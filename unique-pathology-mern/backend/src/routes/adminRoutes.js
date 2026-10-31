import express from 'express'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { z } from 'zod'
import { config } from '../config/index.js'
import { requireAdmin } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import { Test } from '../models/Test.js'
import { Package } from '../models/Package.js'
import { Booking } from '../models/Booking.js'
import { Report } from '../models/Report.js'
import { Payment } from '../models/Payment.js'
import { Enquiry } from '../models/Enquiry.js'
import { AuditLog } from '../models/AuditLog.js'
import { Doctor } from '../models/Doctor.js'
import { DownloadLog } from '../models/DownloadLog.js'
import { recordAudit } from '../services/auditService.js'
import {
  savePrivateReportFile,
  deletePrivateReportFile,
  getReportStream,
  reportFileExists,
} from '../services/storageService.js'
import { syncPaidBookingsMigration } from '../services/paymentMigrationService.js'

export const adminRouter = express.Router()

// Configure Multer for secure in-memory file handling (max 10MB)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (_req, file, cb) => {
    const allowed = ['application/pdf', 'image/jpeg', 'image/png']
    if (allowed.includes(file.mimetype)) {
      cb(null, true)
    } else {
      cb(new Error('Only PDF, JPG, and PNG documents are allowed.'))
    }
  },
})

// ==========================================
// AUTHENTICATION
// ==========================================

adminRouter.post('/auth/admin/login', authLimiter, async (req, res, next) => {
  try {
    const { email, password } = req.body || {}

    if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email and password are required.' })
    }

    const emailMatches = email.trim().toLowerCase() === config.admin.email.toLowerCase()
    let passwordMatches = false

    if (emailMatches && config.admin.passwordHash) {
      passwordMatches = await bcrypt.compare(password, config.admin.passwordHash)
    }

    if (!emailMatches || !passwordMatches) {
      await recordAudit({
        action: 'admin_login_failed',
        category: 'auth',
        performedBy: email.trim().slice(0, 100),
        details: { reason: 'Invalid email or password' },
        req,
      })
      return res.status(401).json({ message: 'Invalid administrative credentials.' })
    }

    const token = jwt.sign(
      { role: 'admin', email: config.admin.email },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    await recordAudit({
      action: 'admin_login_success',
      category: 'auth',
      performedBy: config.admin.email,
      req,
    })

    res.json({
      message: 'Admin authentication successful.',
      token,
      tokenType: 'Bearer',
      expiresIn: config.jwt.expiresIn,
      admin: {
        email: config.admin.email,
        role: 'admin',
      },
    })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/auth/admin/me', requireAdmin, (req, res) => {
  res.json({
    admin: req.admin,
    serverTime: new Date().toISOString(),
  })
})

// ==========================================
// DASHBOARD METRICS
// ==========================================

adminRouter.get('/admin/metrics', requireAdmin, async (_req, res, next) => {
  try {
    const todayStr = new Date().toISOString().slice(0, 10)

    const [
      totalBookings,
      todayBookings,
      pendingRequests,
      confirmedBookings,
      processingBookings,
      completedBookings,
      cancelledBookings,
      homeCollections,
      paidBookings,
      testsCount,
      packagesCount,
      reportsCount,
      enquiriesCount,
      doctorsCount,
      activeDoctorsCount,
      revenueResult,
      totalReferredBookings,
      discountResult,
      uniquePatientsPhones,
    ] = await Promise.all([
      Booking.countDocuments(),
      Booking.countDocuments({ date: todayStr }),
      Booking.countDocuments({ status: 'requested' }),
      Booking.countDocuments({ status: 'confirmed' }),
      Booking.countDocuments({ status: { $in: ['sample_collected', 'processing'] } }),
      Booking.countDocuments({ status: 'completed' }),
      Booking.countDocuments({ status: 'cancelled' }),
      Booking.countDocuments({ collectionType: 'home', status: { $in: ['requested', 'confirmed'] } }),
      Booking.countDocuments({ paymentStatus: 'paid' }),
      Test.countDocuments({ isActive: true }),
      Package.countDocuments({ isActive: true }),
      Report.countDocuments(),
      Enquiry.countDocuments({ status: 'new' }),
      Doctor.countDocuments(),
      Doctor.countDocuments({ status: 'active' }),
      Booking.aggregate([
        { $match: { paymentStatus: 'paid' } },
        { $group: { _id: null, totalPaise: { $sum: '$totalAmountPaise' } } },
      ]),
      Booking.countDocuments({
        $or: [
          { doctorId: { $ne: null } },
          { doctorName: { $exists: true, $ne: '' } },
        ],
      }),
      Booking.aggregate([
        { $group: { _id: null, totalPaise: { $sum: '$discountAmountPaise' } } },
      ]),
      Booking.distinct('phone'),
    ])

    const totalRevenuePaise = revenueResult[0]?.totalPaise || 0
    const totalDiscountGivenPaise = discountResult[0]?.totalPaise || 0
    const uniquePatientsCount = uniquePatientsPhones.length

    res.json({
      metrics: {
        totalBookings,
        todayBookings,
        pendingRequests,
        confirmedBookings,
        processingBookings,
        completedBookings,
        cancelledBookings,
        homeCollections,
        paidBookings,
        testsCount,
        packagesCount,
        reportsCount,
        enquiriesCount,
        doctorsCount,
        activeDoctorsCount,
        totalRevenuePaise,
        totalReferredBookings,
        totalDiscountGivenPaise,
        uniquePatientsCount,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// BOOKING MANAGEMENT
// ==========================================

adminRouter.get('/admin/bookings', requireAdmin, async (req, res, next) => {
  try {
    const { status, collectionType, paymentStatus, doctorId, referredBy, search, limit = 100, skip = 0 } = req.query
    const query = {}

    if (status && status !== 'all') query.status = status
    if (collectionType && collectionType !== 'all') query.collectionType = collectionType
    if (paymentStatus && paymentStatus !== 'all') query.paymentStatus = paymentStatus
    if (doctorId && doctorId !== 'all') query.doctorId = doctorId
    if (referredBy && referredBy !== 'all') query.referredBy = referredBy
    if (search && search.trim()) {
      const term = search.trim()
      const regex = new RegExp(term, 'i')
      query.$or = [{ reference: regex }, { patientName: regex }, { phone: regex }, { doctorName: regex }]
    }

    const [bookings, total] = await Promise.all([
      Booking.find(query).sort({ createdAt: -1 }).skip(Number(skip)).limit(Number(limit)).lean(),
      Booking.countDocuments(query),
    ])

    res.json({ total, bookings })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/admin/bookings/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status, cancellationReason, adminNotes } = req.body || {}
    const validStatuses = ['requested', 'confirmed', 'sample_collected', 'processing', 'completed', 'cancelled']

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: 'Invalid booking status.' })
    }

    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })

    const previousStatus = booking.status
    booking.status = status
    if (cancellationReason) booking.cancellationReason = cancellationReason
    if (adminNotes !== undefined) booking.adminNotes = adminNotes
    if (status === 'cancelled') booking.cancelledAt = new Date()

    await booking.save()

    await recordAudit({
      action: 'booking_status_updated',
      category: 'booking',
      performedBy: req.admin.email,
      targetId: String(booking._id),
      targetReference: booking.reference,
      details: { previousStatus, newStatus: status, cancellationReason },
      req,
    })

    res.json({ message: `Booking status updated to ${status}.`, booking })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/admin/bookings/:id/phlebotomist', requireAdmin, async (req, res, next) => {
  try {
    const { assignedPhlebotomist, adminNotes } = req.body || {}
    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })

    if (assignedPhlebotomist !== undefined) booking.assignedPhlebotomist = assignedPhlebotomist
    if (adminNotes !== undefined) booking.adminNotes = adminNotes
    await booking.save()

    res.json({ message: 'Phlebotomist assignment updated.', booking })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/admin/bookings/:id/payment', requireAdmin, async (req, res, next) => {
  try {
    const { paymentStatus, paymentMethod, notes } = req.body || {}
    const valid = ['not_started', 'pending', 'paid', 'failed', 'refunded']
    if (!valid.includes(paymentStatus)) {
      return res.status(400).json({ message: 'Invalid payment status.' })
    }

    const booking = await Booking.findById(req.params.id)
    if (!booking) return res.status(404).json({ message: 'Booking not found.' })

    let normalizedMethod = paymentMethod?.trim()
    if (paymentStatus === 'paid') {
      const allowedMethods = ['Cash', 'UPI', 'Card', 'Bank Transfer']
      const matched = allowedMethods.find(
        (m) => m.toLowerCase() === (normalizedMethod || '').toLowerCase()
      )
      if (!matched) {
        return res.status(400).json({
          message: 'Payment method is required when marking as PAID. Options: Cash, UPI, Card, Bank Transfer.',
        })
      }
      normalizedMethod = matched
    }

    booking.paymentStatus = paymentStatus
    if (paymentStatus === 'paid') {
      booking.paidAt = new Date()
    }
    if (notes) {
      booking.adminNotes = `${booking.adminNotes ? booking.adminNotes + ' | ' : ''}Payment updated: ${notes}`
    }
    await booking.save()

    let paymentRecord = null
    if (paymentStatus === 'paid') {
      const testOrPackageName =
        booking.items && booking.items.length > 0
          ? booking.items.map((i) => i.name).join(', ')
          : 'Diagnostic Test'

      const originalAmount =
        (booking.originalPricePaise || booking.subtotalPaise || booking.totalAmountPaise || 0) / 100
      const discountAmount =
        (booking.discountAmountPaise || booking.offerDiscountPaise || 0) / 100
      const finalAmount = (booking.totalAmountPaise || 0) / 100
      const paymentDate = new Date()

      // Prevent duplicate entries - find existing record or create new
      let existingPayment = await Payment.findOne({ bookingId: booking._id })

      if (existingPayment) {
        existingPayment.patientName = booking.patientName
        existingPayment.mobileNumber = booking.phone
        existingPayment.testOrPackageName = testOrPackageName
        existingPayment.originalAmount = originalAmount
        existingPayment.discountAmount = discountAmount
        existingPayment.finalAmount = finalAmount
        existingPayment.amountPaise = booking.totalAmountPaise || 0
        existingPayment.paymentMethod = normalizedMethod
        existingPayment.status = 'paid'
        existingPayment.paymentDate = paymentDate
        existingPayment.reconciled = true
        existingPayment.reconciledAt = paymentDate
        existingPayment.reconciledBy = req.admin.email
        if (notes) existingPayment.notes = notes
        await existingPayment.save()
        paymentRecord = existingPayment
      } else {
        paymentRecord = await Payment.create({
          bookingId: booking._id,
          bookingReference: booking.reference,
          patientName: booking.patientName,
          mobileNumber: booking.phone,
          testOrPackageName,
          originalAmount,
          discountAmount,
          finalAmount,
          amountPaise: booking.totalAmountPaise || 0,
          currency: 'INR',
          paymentMethod: normalizedMethod,
          status: 'paid',
          paymentDate,
          reconciled: true,
          reconciledAt: paymentDate,
          reconciledBy: req.admin.email,
          notes: notes || 'Reconciled at admin desk',
        })
      }

      // Audit Log 1: Payment Received
      await recordAudit({
        action: `Payment received for Booking ID ${booking.reference}`,
        category: 'payment',
        performedBy: req.admin.email,
        targetId: String(paymentRecord._id),
        targetReference: booking.reference,
        details: {
          bookingId: String(booking._id),
          finalAmount,
          paymentMethod: normalizedMethod,
          patientName: booking.patientName,
        },
        req,
      })

      // Audit Log 2: Payment Method Selected
      await recordAudit({
        action: `Payment method selected: ${normalizedMethod} for Booking ID ${booking.reference}`,
        category: 'payment',
        performedBy: req.admin.email,
        targetId: String(paymentRecord._id),
        targetReference: booking.reference,
        details: {
          paymentMethod: normalizedMethod,
          bookingReference: booking.reference,
        },
        req,
      })
    } else {
      // If changing to pending/failed/etc., update existing payment record status if present
      const existingPayment = await Payment.findOne({ bookingId: booking._id })
      if (existingPayment) {
        existingPayment.status = paymentStatus === 'pending' ? 'pending' : 'failed'
        await existingPayment.save()
        paymentRecord = existingPayment
      }

      await recordAudit({
        action: `Payment status changed to ${paymentStatus} for Booking ID ${booking.reference}`,
        category: 'payment',
        performedBy: req.admin.email,
        targetId: String(booking._id),
        targetReference: booking.reference,
        details: { paymentStatus, notes },
        req,
      })
    }

    res.json({
      message: `Payment status updated to ${paymentStatus}.`,
      booking,
      payment: paymentRecord,
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// PATIENT MANAGEMENT (MINIMUM NECESSARY DATA)
// ==========================================

adminRouter.get('/admin/patients', requireAdmin, async (_req, res, next) => {
  try {
    const patients = await Booking.aggregate([
      {
        $group: {
          _id: '$phone',
          name: { $last: '$patientName' },
          email: { $last: '$email' },
          gender: { $last: '$gender' },
          totalBookings: { $sum: 1 },
          lastBookingDate: { $max: '$date' },
          lastReference: { $last: '$reference' },
          totalSpentPaise: {
            $sum: {
              $cond: [{ $eq: ['$paymentStatus', 'paid'] }, '$totalAmountPaise', 0],
            },
          },
        },
      },
      { $sort: { lastBookingDate: -1 } },
      { $limit: 150 },
    ])

    res.json({ patients })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// TEST CATALOGUE CRUD
// ==========================================

// GET /api/admin/tests - Fetch all tests (both active and inactive) with search and filters
adminRouter.get('/admin/tests', requireAdmin, async (req, res, next) => {
  try {
    const { category, department, search, status } = req.query
    const query = {}

    if (status === 'active') {
      query.isActive = true
    } else if (status === 'inactive') {
      query.isActive = false
    }

    if (category && category !== 'All Tests') {
      query.category = category
    }

    if (department && department !== 'All Departments') {
      query.department = department
    }

    if (search && typeof search === 'string' && search.trim().length > 0) {
      const term = search.trim()
      const regex = new RegExp(term, 'i')
      query.$or = [{ name: regex }, { shortCode: regex }, { description: regex }, { category: regex }]
    }

    const tests = await Test.find(query).sort({ isPopular: -1, createdAt: -1 }).lean()

    res.json({
      total: tests.length,
      tests,
    })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/admin/tests/:id/status - Quick toggle active/inactive status
adminRouter.patch('/admin/tests/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { isActive, isVerifiedPrice } = req.body || {}
    const updates = {}
    if (typeof isActive === 'boolean') updates.isActive = isActive
    if (typeof isVerifiedPrice === 'boolean') updates.isVerifiedPrice = isVerifiedPrice

    const test = await Test.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
    if (!test) return res.status(404).json({ message: 'Test not found.' })

    await recordAudit({
      action: 'test_status_toggled',
      category: 'test_catalogue',
      performedBy: req.admin.email,
      targetId: String(test._id),
      details: { name: test.name, isActive: test.isActive, isVerifiedPrice: test.isVerifiedPrice },
      req,
    })

    res.json({ message: `Test "${test.name}" status updated.`, test })
  } catch (err) {
    next(err)
  }
})

const testCrudSchema = z.object({
  name: z.string().trim().min(2).max(150),
  shortCode: z.string().trim().max(30).optional(),
  category: z.string().trim(),
  department: z.string().trim(),
  description: z.string().trim().optional(),
  clinicalRelevance: z.string().trim().optional(),
  sampleType: z.string().trim().default('Venous Blood'),
  fastingRequired: z.boolean().default(false),
  fastingDuration: z.string().trim().optional(),
  turnaroundHours: z.coerce.number().min(1).default(12),
  pricePaise: z.coerce.number().min(0),
  mrpPaise: z.coerce.number().min(0).default(0),
  isVerifiedPrice: z.boolean().default(false),
  priceNote: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  isPopular: z.boolean().default(false),
})

adminRouter.post('/admin/tests', requireAdmin, async (req, res, next) => {
  try {
    const parsed = testCrudSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors })
    }

    const test = await Test.create(parsed.data)

    await recordAudit({
      action: 'test_created',
      category: 'test_catalogue',
      performedBy: req.admin.email,
      targetId: String(test._id),
      details: { name: test.name, pricePaise: test.pricePaise, isVerifiedPrice: test.isVerifiedPrice },
      req,
    })

    res.status(201).json({ message: 'Diagnostic test created successfully.', test })
  } catch (err) {
    next(err)
  }
})

adminRouter.put('/admin/tests/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = testCrudSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors })
    }

    const test = await Test.findByIdAndUpdate(req.params.id, parsed.data, { new: true })
    if (!test) return res.status(404).json({ message: 'Test not found.' })

    await recordAudit({
      action: 'test_updated',
      category: 'test_catalogue',
      performedBy: req.admin.email,
      targetId: String(test._id),
      details: { name: test.name, pricePaise: test.pricePaise, isVerifiedPrice: test.isVerifiedPrice },
      req,
    })

    res.json({ message: 'Test updated successfully.', test })
  } catch (err) {
    next(err)
  }
})

adminRouter.delete('/admin/tests/:id', requireAdmin, async (req, res, next) => {
  try {
    const test = await Test.findByIdAndDelete(req.params.id)
    if (!test) return res.status(404).json({ message: 'Test not found.' })

    await recordAudit({
      action: 'test_deleted',
      category: 'test_catalogue',
      performedBy: req.admin.email,
      targetId: String(test._id),
      details: { name: test.name },
      req,
    })

    res.json({ message: `Test "${test.name}" deleted.` })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// HEALTH PACKAGES CRUD
// ==========================================

const packageCrudSchema = z.object({
  name: z.string().trim().min(2).max(150),
  code: z.string().trim().toUpperCase().max(30),
  category: z.string().trim(),
  tagline: z.string().trim().optional(),
  description: z.string().trim().optional(),
  testsIncluded: z.array(z.string().trim()).default([]),
  fastingRequired: z.boolean().default(true),
  fastingInstructions: z.string().trim().optional(),
  sampleType: z.string().trim().default('Blood & Urine'),
  pricePaise: z.coerce.number().min(0),
  mrpPaise: z.coerce.number().min(0).default(0),
  isVerifiedPrice: z.boolean().default(false),
  priceNote: z.string().trim().optional(),
  badge: z.string().trim().optional(),
  isActive: z.boolean().default(true),
  isFeatured: z.boolean().default(false),
})

adminRouter.post('/admin/packages', requireAdmin, async (req, res, next) => {
  try {
    const parsed = packageCrudSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors })
    }

    const pkg = await Package.create({
      ...parsed.data,
      testCount: parsed.data.testsIncluded.length,
    })

    await recordAudit({
      action: 'package_created',
      category: 'package',
      performedBy: req.admin.email,
      targetId: String(pkg._id),
      details: { name: pkg.name, pricePaise: pkg.pricePaise },
      req,
    })

    res.status(201).json({ message: 'Health package created.', package: pkg })
  } catch (err) {
    next(err)
  }
})

adminRouter.put('/admin/packages/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = packageCrudSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({ message: 'Validation failed.', errors: parsed.error.flatten().fieldErrors })
    }

    const pkg = await Package.findByIdAndUpdate(
      req.params.id,
      {
        ...parsed.data,
        testCount: parsed.data.testsIncluded.length,
      },
      { new: true }
    )
    if (!pkg) return res.status(404).json({ message: 'Package not found.' })

    await recordAudit({
      action: 'package_updated',
      category: 'package',
      performedBy: req.admin.email,
      targetId: String(pkg._id),
      details: { name: pkg.name, pricePaise: pkg.pricePaise },
      req,
    })

    res.json({ message: 'Health package updated.', package: pkg })
  } catch (err) {
    next(err)
  }
})

adminRouter.delete('/admin/packages/:id', requireAdmin, async (req, res, next) => {
  try {
    const pkg = await Package.findByIdAndDelete(req.params.id)
    if (!pkg) return res.status(404).json({ message: 'Package not found.' })

    await recordAudit({
      action: 'package_deleted',
      category: 'package',
      performedBy: req.admin.email,
      targetId: String(pkg._id),
      details: { name: pkg.name },
      req,
    })

    res.json({ message: `Package "${pkg.name}" deleted.` })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// REPORT UPLOAD & AUDIT LOGS
// ==========================================

adminRouter.post('/admin/reports/upload', requireAdmin, upload.single('reportFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Report document file (PDF, JPG, or PNG) is required.' })
    }

    const { bookingReference, reportTitle, verifiedByPathologistName } = req.body || {}
    if (!bookingReference) {
      return res.status(400).json({ message: 'Booking reference is required.' })
    }

    const ref = bookingReference.trim().toUpperCase()
    const booking = await Booking.findOne({ reference: ref })
    if (!booking) {
      return res.status(404).json({ message: `No booking found with reference ${ref}.` })
    }

    // Save report file to private storage
    const storageResult = await savePrivateReportFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    })

    const report = await Report.create({
      bookingId: booking._id,
      bookingReference: booking.reference,
      patientPhone: booking.phone,
      patientName: booking.patientName,
      reportTitle: reportTitle?.trim() || `${booking.items.map((i) => i.name).join(', ')} Report`,
      testNames: booking.items.map((i) => i.name),
      fileName: req.file.originalname,
      storageKey: storageResult.storageKey,
      mimeType: req.file.mimetype,
      fileSizeBytes: storageResult.fileSizeBytes,
      checksumSha256: storageResult.checksumSha256,
      status: 'released',
      uploadedBy: req.admin.email,
      verifiedByPathologistName: verifiedByPathologistName?.trim() || 'Duty Clinical Pathologist',
      auditLogs: [
        {
          action: 'uploaded',
          performedBy: req.admin.email,
          ip: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0],
          userAgent: req.headers['user-agent'] || '',
          details: `Report uploaded by admin for reference ${booking.reference}`,
        },
      ],
    })

    // Update booking status to completed
    booking.status = 'completed'
    await booking.save()

    await recordAudit({
      action: `Report uploaded for Booking ID ${booking.reference}`,
      category: 'report',
      performedBy: req.admin.email,
      targetId: String(report._id),
      targetReference: booking.reference,
      details: {
        message: `Report uploaded for Booking ID ${booking.reference}`,
        fileName: req.file.originalname,
        fileSizeBytes: storageResult.fileSizeBytes,
      },
      req,
    })

    res.status(201).json({
      message: 'Report uploaded and released securely. Patient can now verify and download via OTP.',
      reportId: report._id,
      bookingReference: booking.reference,
    })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/admin/reports', requireAdmin, async (_req, res, next) => {
  try {
    const reports = await Report.find().sort({ createdAt: -1 }).limit(100).lean()
    res.json({ reports })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/reports/:id/view - Admin stream view report inline (regardless of payment status)
adminRouter.get('/admin/reports/:id/view', requireAdmin, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found.' })

    if (!reportFileExists(report.storageKey)) {
      return res.status(404).json({ message: 'Report file missing from secure storage.' })
    }

    res.setHeader('Content-Type', report.mimeType || 'application/pdf')
    res.setHeader('Content-Disposition', `inline; filename="UniquePathology_${report.bookingReference}.pdf"`)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')

    const fileStream = getReportStream(report.storageKey)
    fileStream.pipe(res)
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/reports/:id/download - Admin download report as attachment (regardless of payment status)
adminRouter.get('/admin/reports/:id/download', requireAdmin, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found.' })

    if (!reportFileExists(report.storageKey)) {
      return res.status(404).json({ message: 'Report file missing from secure storage.' })
    }

    const now = new Date()
    const downloadDate = now.toISOString().slice(0, 10)
    const downloadTime = now.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    })

    // Record DownloadLog
    await DownloadLog.create({
      bookingId: report.bookingId,
      bookingReference: report.bookingReference,
      patientName: report.patientName,
      downloadDate,
      downloadTime,
      downloadedBy: req.admin.email,
      userType: 'Admin',
      reportId: report._id,
      ip: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0],
      userAgent: req.headers['user-agent'] || '',
    })

    // Record AuditLog
    await recordAudit({
      action: `Report downloaded for Booking ID ${report.bookingReference}`,
      category: 'report',
      performedBy: req.admin.email,
      targetId: String(report.bookingId),
      targetReference: report.bookingReference,
      details: {
        message: `Report downloaded for Booking ID ${report.bookingReference}`,
        fileName: report.fileName,
        userType: 'Admin',
      },
      req,
    })

    res.setHeader('Content-Type', report.mimeType || 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="UniquePathology_${report.bookingReference}.pdf"`)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')

    const fileStream = getReportStream(report.storageKey)
    fileStream.pipe(res)
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/reports/:id/replace - Admin replace existing report file (regardless of payment status)
adminRouter.post('/admin/reports/:id/replace', requireAdmin, upload.single('reportFile'), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'Replacement report document file (PDF, JPG, or PNG) is required.' })
    }

    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found.' })

    // Delete old file
    await deletePrivateReportFile(report.storageKey)

    // Save replacement file
    const storageResult = await savePrivateReportFile({
      buffer: req.file.buffer,
      originalName: req.file.originalname,
      mimeType: req.file.mimetype,
    })

    report.fileName = req.file.originalname
    report.storageKey = storageResult.storageKey
    report.fileSizeBytes = storageResult.fileSizeBytes
    report.mimeType = req.file.mimetype
    report.checksumSha256 = storageResult.checksumSha256
    report.uploadedBy = req.admin.email
    report.auditLogs.push({
      action: 'replaced',
      performedBy: req.admin.email,
      ip: String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0],
      userAgent: req.headers['user-agent'] || '',
      details: `Report file replaced by admin: ${req.file.originalname}`,
    })
    await report.save()

    await recordAudit({
      action: `Report uploaded for Booking ID ${report.bookingReference}`,
      category: 'report',
      performedBy: req.admin.email,
      targetId: String(report._id),
      targetReference: report.bookingReference,
      details: {
        message: `Report replaced for Booking ID ${report.bookingReference}`,
        fileName: req.file.originalname,
        fileSizeBytes: storageResult.fileSizeBytes,
      },
      req,
    })

    res.json({ message: 'Report replaced successfully.', report })
  } catch (err) {
    next(err)
  }
})

adminRouter.delete('/admin/reports/:id', requireAdmin, async (req, res, next) => {
  try {
    const report = await Report.findById(req.params.id)
    if (!report) return res.status(404).json({ message: 'Report not found.' })

    await deletePrivateReportFile(report.storageKey)
    await Report.findByIdAndDelete(req.params.id)

    await recordAudit({
      action: 'report_deleted',
      category: 'report',
      performedBy: req.admin.email,
      targetId: req.params.id,
      targetReference: report.bookingReference,
      req,
    })

    res.json({ message: 'Report deleted from database and secure storage.' })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// PAYMENT RECONCILIATION
// ==========================================

adminRouter.get('/admin/payments', requireAdmin, async (_req, res, next) => {
  try {
    const payments = await Payment.find().sort({ paymentDate: -1, createdAt: -1 }).limit(200).lean()
    res.json({ payments })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/payments/sync - Migration & sync for missing payments on paid bookings
adminRouter.post('/admin/payments/sync', requireAdmin, async (req, res, next) => {
  try {
    const result = await syncPaidBookingsMigration(req)
    res.json({ message: 'Payment synchronization complete.', ...result })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// DOWNLOAD LOGS
// ==========================================

adminRouter.get('/admin/download-logs', requireAdmin, async (_req, res, next) => {
  try {
    const downloadLogs = await DownloadLog.find().sort({ createdAt: -1 }).limit(200).lean()
    res.json({ downloadLogs })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// ENQUIRIES & AUDIT LOGS
// ==========================================

adminRouter.get('/admin/enquiries', requireAdmin, async (_req, res, next) => {
  try {
    const enquiries = await Enquiry.find().sort({ createdAt: -1 }).limit(100).lean()
    res.json({ enquiries })
  } catch (err) {
    next(err)
  }
})

adminRouter.patch('/admin/enquiries/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { status, adminNotes } = req.body || {}
    const enquiry = await Enquiry.findById(req.params.id)
    if (!enquiry) return res.status(404).json({ message: 'Enquiry not found.' })

    if (status) enquiry.status = status
    if (adminNotes !== undefined) enquiry.adminNotes = adminNotes
    await enquiry.save()

    res.json({ message: 'Enquiry updated.', enquiry })
  } catch (err) {
    next(err)
  }
})

adminRouter.get('/admin/audit-logs', requireAdmin, async (req, res, next) => {
  try {
    const { limit = 100 } = req.query
    const logs = await AuditLog.find().sort({ createdAt: -1 }).limit(Number(limit)).lean()
    res.json({ logs })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// DOCTOR MANAGEMENT (ADMIN)
// ==========================================

const doctorInputSchema = z.object({
  name: z.string().trim().min(2, 'Doctor name must be at least 2 characters').max(120),
  email: z.string().trim().email('Valid email address is required').max(254),
  mobile: z.string().trim().regex(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  password: z.string().min(6, 'Password must be at least 6 characters').optional(),
  discountPercent: z.coerce.number().min(0, 'Discount % cannot be negative').max(100, 'Discount % cannot exceed 100%'),
  commissionPercent: z.coerce.number().min(0).max(100).default(0),
  specialization: z.string().trim().max(100).default('General Physician'),
  qualification: z.string().trim().max(100).default('MBBS'),
  clinicName: z.string().trim().max(150).default('Private Practice'),
  clinicAddress: z.string().trim().max(300).default('Mandideep, Bhopal'),
  status: z.enum(['active', 'inactive']).default('active'),
  referralCode: z.string().trim().max(30).optional(),
  notes: z.string().trim().max(500).optional(),
})

// List all doctors
adminRouter.get('/admin/doctors', requireAdmin, async (req, res, next) => {
  try {
    const { search, status } = req.query
    const query = {}

    if (status && status !== 'all') {
      query.status = status
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim()
      const regex = new RegExp(term, 'i')
      query.$or = [
        { name: regex },
        { email: regex },
        { mobile: regex },
        { referralCode: regex },
        { clinicName: regex },
        { specialization: regex },
      ]
    }

    const doctors = await Doctor.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .lean()

    // Calculate real-time referral metrics for each doctor
    const doctorStatsPromises = doctors.map(async (doc) => {
      const bookings = await Booking.find({ doctorId: doc._id }).select('totalAmountPaise subtotalPaise discountAmountPaise status').lean()
      const totalPatients = bookings.length
      const totalRevenue = bookings.reduce((sum, b) => sum + (b.totalAmountPaise || 0), 0)
      const totalDiscountGiven = bookings.reduce((sum, b) => sum + (b.discountAmountPaise || 0), 0)

      return {
        ...doc,
        totalReferredPatients: totalPatients,
        totalRevenuePaise: totalRevenue,
        totalDiscountGivenPaise: totalDiscountGiven,
      }
    })

    const doctorsWithStats = await Promise.all(doctorStatsPromises)

    res.json({
      total: doctorsWithStats.length,
      doctors: doctorsWithStats,
    })
  } catch (err) {
    next(err)
  }
})

// Get single doctor details with their referrals
adminRouter.get('/admin/doctors/:id', requireAdmin, async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id).select('-password').lean()
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    const referrals = await Booking.find({ doctorId: doctor._id })
      .sort({ createdAt: -1 })
      .limit(50)
      .lean()

    res.json({ doctor, referrals })
  } catch (err) {
    next(err)
  }
})

// Create new doctor
adminRouter.post('/admin/doctors', requireAdmin, async (req, res, next) => {
  try {
    const parsed = doctorInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid doctor information submitted.',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const data = parsed.data
    const emailLower = data.email.toLowerCase()
    const mobileClean = data.mobile.replace(/[^0-9]/g, '').slice(-10)

    // Check duplicate email
    const existingEmail = await Doctor.findOne({ email: emailLower })
    if (existingEmail) {
      return res.status(400).json({ message: `Doctor with email '${emailLower}' already exists.` })
    }

    // Check duplicate mobile
    const existingMobile = await Doctor.findOne({ mobile: mobileClean })
    if (existingMobile) {
      return res.status(400).json({ message: `Doctor with mobile '${mobileClean}' already exists.` })
    }

    // Password is required for creation
    const rawPassword = req.body.password || 'Doctor@123'
    if (rawPassword.length < 6) {
      return res.status(400).json({ message: 'Password must be at least 6 characters long.' })
    }
    const hashedPassword = await bcrypt.hash(rawPassword, 12)

    // Generate referral code if empty
    let referralCode = data.referralCode
      ? data.referralCode.toUpperCase().replace(/[^A-Z0-9-]/g, '')
      : `DOC-${data.name.replace(/[^a-zA-Z]/g, '').slice(0, 6).toUpperCase()}-${Math.floor(100 + Math.random() * 900)}`

    // Ensure referral code uniqueness
    let duplicateCode = await Doctor.findOne({ referralCode })
    while (duplicateCode) {
      referralCode = `DOC-${Math.floor(1000 + Math.random() * 9000)}`
      duplicateCode = await Doctor.findOne({ referralCode })
    }

    const doctor = await Doctor.create({
      name: data.name,
      email: emailLower,
      mobile: mobileClean,
      password: hashedPassword,
      discountPercent: data.discountPercent,
      commissionPercent: data.commissionPercent,
      specialization: data.specialization,
      qualification: data.qualification,
      clinicName: data.clinicName,
      clinicAddress: data.clinicAddress,
      status: data.status,
      referralCode,
      notes: data.notes,
    })

    await recordAudit({
      action: 'doctor_created',
      category: 'doctor',
      performedBy: req.admin.email,
      targetId: String(doctor._id),
      details: {
        name: doctor.name,
        email: doctor.email,
        discountPercent: doctor.discountPercent,
        referralCode: doctor.referralCode,
      },
      req,
    })

    const doctorObj = doctor.toObject()
    delete doctorObj.password

    res.status(201).json({
      message: `Doctor ${doctor.name} registered successfully with ${doctor.discountPercent}% discount.`,
      doctor: doctorObj,
    })
  } catch (err) {
    next(err)
  }
})

// Update doctor details
adminRouter.put('/admin/doctors/:id', requireAdmin, async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    const {
      name,
      email,
      mobile,
      discountPercent,
      commissionPercent,
      specialization,
      qualification,
      clinicName,
      clinicAddress,
      status,
      referralCode,
      notes,
      password,
    } = req.body || {}

    if (name) doctor.name = String(name).trim()
    if (email) {
      const emailLower = String(email).trim().toLowerCase()
      const duplicate = await Doctor.findOne({ email: emailLower, _id: { $ne: doctor._id } })
      if (duplicate) return res.status(400).json({ message: 'Email is already used by another doctor.' })
      doctor.email = emailLower
    }
    if (mobile) {
      const mobileClean = String(mobile).replace(/[^0-9]/g, '').slice(-10)
      const duplicate = await Doctor.findOne({ mobile: mobileClean, _id: { $ne: doctor._id } })
      if (duplicate) return res.status(400).json({ message: 'Mobile number is already used by another doctor.' })
      doctor.mobile = mobileClean
    }
    if (discountPercent !== undefined) {
      const num = Number(discountPercent)
      if (num < 0 || num > 100) return res.status(400).json({ message: 'Discount percent must be between 0 and 100.' })
      doctor.discountPercent = num
    }
    if (commissionPercent !== undefined) {
      doctor.commissionPercent = Math.min(100, Math.max(0, Number(commissionPercent)))
    }
    if (specialization !== undefined) doctor.specialization = String(specialization).trim()
    if (qualification !== undefined) doctor.qualification = String(qualification).trim()
    if (clinicName !== undefined) doctor.clinicName = String(clinicName).trim()
    if (clinicAddress !== undefined) doctor.clinicAddress = String(clinicAddress).trim()
    if (status && ['active', 'inactive'].includes(status)) doctor.status = status
    if (notes !== undefined) doctor.notes = String(notes).trim()

    if (referralCode && referralCode.trim()) {
      const codeClean = String(referralCode).trim().toUpperCase()
      const duplicateCode = await Doctor.findOne({ referralCode: codeClean, _id: { $ne: doctor._id } })
      if (duplicateCode) return res.status(400).json({ message: 'Referral code is already used by another doctor.' })
      doctor.referralCode = codeClean
    }

    if (password && typeof password === 'string' && password.trim().length >= 6) {
      doctor.password = await bcrypt.hash(password.trim(), 12)
    }

    await doctor.save()

    await recordAudit({
      action: 'doctor_updated',
      category: 'doctor',
      performedBy: req.admin.email,
      targetId: String(doctor._id),
      details: {
        name: doctor.name,
        discountPercent: doctor.discountPercent,
        status: doctor.status,
      },
      req,
    })

    const doctorObj = doctor.toObject()
    delete doctorObj.password

    res.json({
      message: `Doctor ${doctor.name} updated successfully.`,
      doctor: doctorObj,
    })
  } catch (err) {
    next(err)
  }
})

// Toggle doctor active/inactive status
adminRouter.patch('/admin/doctors/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    const { status } = req.body || {}
    if (status && ['active', 'inactive'].includes(status)) {
      doctor.status = status
    } else {
      // Toggle
      doctor.status = doctor.status === 'active' ? 'inactive' : 'active'
    }

    await doctor.save()

    await recordAudit({
      action: 'doctor_status_toggled',
      category: 'doctor',
      performedBy: req.admin.email,
      targetId: String(doctor._id),
      details: { name: doctor.name, newStatus: doctor.status },
      req,
    })

    res.json({
      message: `Doctor ${doctor.name} status updated to ${doctor.status}.`,
      status: doctor.status,
      doctor: {
        id: String(doctor._id),
        name: doctor.name,
        status: doctor.status,
      },
    })
  } catch (err) {
    next(err)
  }
})

// Delete doctor
adminRouter.delete('/admin/doctors/:id', requireAdmin, async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.params.id)
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor not found.' })
    }

    // Check if doctor has referred patients
    const referralCount = await Booking.countDocuments({ doctorId: doctor._id })
    if (referralCount > 0 && req.query.force !== 'true') {
      // Safely deactivate instead of breaking historical billing records
      doctor.status = 'inactive'
      await doctor.save()
      return res.json({
        message: `Doctor has ${referralCount} linked patient records. Account has been safely deactivated instead of deleting historical data.`,
        deactivated: true,
      })
    }

    await Doctor.findByIdAndDelete(doctor._id)

    await recordAudit({
      action: 'doctor_deleted',
      category: 'doctor',
      performedBy: req.admin.email,
      targetId: String(doctor._id),
      details: { name: doctor.name, email: doctor.email },
      req,
    })

    res.json({
      message: `Doctor ${doctor.name} removed successfully.`,
      deleted: true,
    })
  } catch (err) {
    next(err)
  }
})


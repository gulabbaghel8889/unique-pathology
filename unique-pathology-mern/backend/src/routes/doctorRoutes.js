import express from 'express'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import crypto from 'node:crypto'
import { z } from 'zod'
import { config } from '../config/index.js'
import { requireDoctor } from '../middleware/auth.js'
import { authLimiter } from '../middleware/rateLimiter.js'
import { Doctor } from '../models/Doctor.js'
import { Booking } from '../models/Booking.js'
import { Test } from '../models/Test.js'
import { Package } from '../models/Package.js'
import { Report } from '../models/Report.js'
import { recordAudit } from '../services/auditService.js'

export const doctorRouter = express.Router()

function generateBookingReference() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `UP-DOC-${todayStr}-${randomHex}`
}

// ==========================================
// DOCTOR AUTHENTICATION
// ==========================================

doctorRouter.post('/auth/doctor/login', authLimiter, async (req, res, next) => {
  try {
    const { identifier, password } = req.body || {}

    if (!identifier || !password || typeof identifier !== 'string' || typeof password !== 'string') {
      return res.status(400).json({ message: 'Email or mobile number, and password are required.' })
    }

    const cleanIdentifier = identifier.trim()
    const isEmail = cleanIdentifier.includes('@')

    const query = isEmail
      ? { email: cleanIdentifier.toLowerCase() }
      : { mobile: cleanIdentifier.replace(/[^0-9]/g, '').slice(-10) }

    const doctor = await Doctor.findOne(query)

    if (!doctor) {
      await recordAudit({
        action: 'doctor_login_failed',
        category: 'auth',
        performedBy: cleanIdentifier.slice(0, 100),
        details: { reason: 'Doctor account not found' },
        req,
      })
      return res.status(401).json({ message: 'Invalid doctor login credentials.' })
    }

    const passwordMatches = await bcrypt.compare(password, doctor.password)
    if (!passwordMatches) {
      await recordAudit({
        action: 'doctor_login_failed',
        category: 'auth',
        performedBy: doctor.email,
        details: { reason: 'Incorrect password' },
        req,
      })
      return res.status(401).json({ message: 'Invalid doctor login credentials.' })
    }

    if (doctor.status !== 'active') {
      await recordAudit({
        action: 'doctor_login_blocked',
        category: 'auth',
        performedBy: doctor.email,
        details: { reason: 'Doctor account inactive' },
        req,
      })
      return res.status(403).json({
        message: 'Your doctor account is currently deactivated. Please contact Unique Pathology administrator.',
      })
    }

    const token = jwt.sign(
      {
        role: 'doctor',
        id: String(doctor._id),
        email: doctor.email,
        name: doctor.name,
      },
      config.jwt.secret,
      { expiresIn: config.jwt.expiresIn }
    )

    await recordAudit({
      action: 'doctor_login_success',
      category: 'auth',
      performedBy: doctor.email,
      targetId: String(doctor._id),
      req,
    })

    res.json({
      message: `Welcome, ${doctor.name}. Login successful.`,
      token,
      tokenType: 'Bearer',
      expiresIn: config.jwt.expiresIn,
      doctor: {
        id: String(doctor._id),
        name: doctor.name,
        email: doctor.email,
        mobile: doctor.mobile,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress,
        discountPercent: doctor.discountPercent,
        commissionPercent: doctor.commissionPercent || 0,
        referralCode: doctor.referralCode,
        status: doctor.status,
        role: 'doctor',
      },
    })
  } catch (err) {
    next(err)
  }
})

// Current doctor profile
doctorRouter.get('/auth/doctor/me', requireDoctor, async (req, res, next) => {
  try {
    const doctor = await Doctor.findById(req.doctor.id).select('-password').lean()
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor profile not found.' })
    }
    res.json({ doctor })
  } catch (err) {
    next(err)
  }
})

// Update doctor's own clinic details / contact
doctorRouter.put('/doctor/profile', requireDoctor, async (req, res, next) => {
  try {
    const { specialization, qualification, clinicName, clinicAddress, password } = req.body || {}

    const updates = {}
    if (specialization) updates.specialization = String(specialization).trim().slice(0, 100)
    if (qualification) updates.qualification = String(qualification).trim().slice(0, 100)
    if (clinicName) updates.clinicName = String(clinicName).trim().slice(0, 150)
    if (clinicAddress) updates.clinicAddress = String(clinicAddress).trim().slice(0, 300)

    if (password && typeof password === 'string' && password.trim().length >= 6) {
      updates.password = await bcrypt.hash(password.trim(), 12)
    }

    const doctor = await Doctor.findByIdAndUpdate(req.doctor.id, { $set: updates }, { new: true })
      .select('-password')
      .lean()

    res.json({
      message: 'Profile details updated successfully.',
      doctor,
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// DOCTOR DASHBOARD & METRICS
// ==========================================

doctorRouter.get('/doctor/dashboard', requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.doctor._id

    // Fetch doctor record for real-time stats
    const doctor = await Doctor.findById(doctorId).select('-password').lean()
    if (!doctor) {
      return res.status(404).json({ message: 'Doctor record not found.' })
    }

    // Fetch all bookings referred by this doctor
    const referredBookings = await Booking.find({
      $or: [{ doctorId: doctor._id }, { doctorName: doctor.name }],
    })
      .sort({ createdAt: -1 })
      .lean()

    const totalPatientsReferred = referredBookings.length

    let totalTestsReferred = 0
    let totalGrossRevenuePaise = 0
    let totalDiscountSavingsPaise = 0
    let totalCommissionPaise = 0

    const statusCounts = {
      requested: 0,
      confirmed: 0,
      sample_collected: 0,
      processing: 0,
      completed: 0,
      cancelled: 0,
    }

    referredBookings.forEach((b) => {
      const itemCount = Array.isArray(b.items) ? b.items.length : 1
      totalTestsReferred += itemCount

      const subtotal = b.subtotalPaise || b.totalAmountPaise || 0
      const discount = b.discountAmountPaise || 0
      const commission = b.commissionPaise || 0

      totalGrossRevenuePaise += subtotal
      totalDiscountSavingsPaise += discount
      totalCommissionPaise += commission

      if (statusCounts[b.status] !== undefined) {
        statusCounts[b.status]++
      }
    })

    // Recent 8 referrals — strip financial fields, doctors only see clinical info
    const recentReferrals = referredBookings.slice(0, 8).map((b) => ({
      _id: b._id,
      reference: b.reference,
      patientName: b.patientName,
      phone: b.phone,
      age: b.age,
      gender: b.gender,
      date: b.date,
      timeSlot: b.timeSlot,
      collectionType: b.collectionType,
      status: b.status,
      items: b.items,
      doctorDiscountPercent: b.doctorDiscountPercent,
      // Show ONLY that a discount was applied (amount hidden per business rule)
      discountApplied: (b.discountAmountPaise || 0) > 0 || (b.doctorDiscountPercent || 0) > 0,
      createdAt: b.createdAt,
    }))

    // Activity timeline — no payment amounts exposed
    const activityTimeline = referredBookings.slice(0, 6).map((b) => ({
      id: String(b._id),
      patientName: b.patientName,
      reference: b.reference,
      date: b.date,
      timeSlot: b.timeSlot,
      status: b.status,
      discountApplied: (b.discountAmountPaise || 0) > 0,
      discountPercent: b.doctorDiscountPercent || 0,
      timestamp: b.createdAt,
    }))

    res.json({
      doctor: {
        id: String(doctor._id),
        name: doctor.name,
        email: doctor.email,
        mobile: doctor.mobile,
        specialization: doctor.specialization,
        qualification: doctor.qualification,
        clinicName: doctor.clinicName,
        clinicAddress: doctor.clinicAddress,
        discountPercent: doctor.discountPercent,
        commissionPercent: doctor.commissionPercent || 0,
        referralCode: doctor.referralCode,
        status: doctor.status,
      },
      metrics: {
        assignedDiscountPercent: doctor.discountPercent,
        totalPatientsReferred,
        totalTestsReferred,
        // NOTE: Revenue/payment data intentionally excluded — admin-only information
        statusCounts,
      },
      recentReferrals,
      activityTimeline,
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// REFERRED PATIENTS LIST
// ==========================================

doctorRouter.get('/doctor/patients', requireDoctor, async (req, res, next) => {
  try {
    const doctorId = req.doctor._id
    const { search, status, page = 1, limit = 20 } = req.query

    const query = {
      $or: [{ doctorId }, { doctorName: req.doctor.name }],
    }

    if (status && status !== 'all') {
      query.status = status
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim()
      const regex = new RegExp(term, 'i')
      query.$or = [{ patientName: regex }, { phone: regex }, { reference: regex }]
    }

    const skip = (Number(page) - 1) * Number(limit)
    const [rawBookings, total] = await Promise.all([
      Booking.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)).lean(),
      Booking.countDocuments(query),
    ])

    // Strip financial/payment data — doctors only see clinical info per business rules
    const bookings = rawBookings.map((b) => ({
      _id: b._id,
      reference: b.reference,
      patientName: b.patientName,
      phone: b.phone,
      email: b.email,
      age: b.age,
      gender: b.gender,
      date: b.date,
      timeSlot: b.timeSlot,
      collectionType: b.collectionType,
      address: b.address,
      status: b.status,
      items: b.items,
      doctorDiscountPercent: b.doctorDiscountPercent,
      discountApplied: (b.discountAmountPaise || 0) > 0 || (b.doctorDiscountPercent || 0) > 0,
      createdAt: b.createdAt,
    }))

    res.json({
      bookings,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total,
        totalPages: Math.ceil(total / Number(limit)) || 1,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// DYNAMIC TEST CATALOGUE WITH DOCTOR DISCOUNT
// ==========================================

doctorRouter.get('/doctor/tests', requireDoctor, async (req, res, next) => {
  try {
    const discountPercent = req.doctor.discountPercent || 0

    const [tests, packages] = await Promise.all([
      Test.find({ isActive: true }).sort({ isPopular: -1, name: 1 }).lean(),
      Package.find({ isActive: true }).sort({ isFeatured: -1, pricePaise: 1 }).lean(),
    ])

    // Calculate dynamic doctor pricing
    const discountedTests = tests.map((t) => {
      const discountPaise = Math.round(t.pricePaise * (discountPercent / 100))
      const doctorPricePaise = Math.max(0, t.pricePaise - discountPaise)
      return {
        ...t,
        originalPricePaise: t.pricePaise,
        discountPercent,
        discountPaise,
        doctorPricePaise,
      }
    })

    const discountedPackages = packages.map((p) => {
      const discountPaise = Math.round(p.pricePaise * (discountPercent / 100))
      const doctorPricePaise = Math.max(0, p.pricePaise - discountPaise)
      return {
        ...p,
        originalPricePaise: p.pricePaise,
        discountPercent,
        discountPaise,
        doctorPricePaise,
      }
    })

    res.json({
      discountPercent,
      doctorName: req.doctor.name,
      tests: discountedTests,
      packages: discountedPackages,
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// DIRECT PATIENT REFERRAL / BOOKING BY DOCTOR
// ==========================================

const doctorReferralSchema = z.object({
  patientName: z.string().trim().min(2, 'Patient name must be at least 2 characters').max(100),
  phone: z.string().regex(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  email: z.union([z.string().email(), z.literal('')]).optional(),
  age: z.coerce.number().min(0).max(130).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).default('prefer_not_to_say'),
  items: z
    .array(
      z.object({
        itemType: z.enum(['test', 'package']),
        name: z.string().trim().min(1),
        id: z.string().optional(),
      })
    )
    .min(1, 'Please select at least one test or package to refer.'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date format must be YYYY-MM-DD'),
  timeSlot: z
    .enum([
      '07:00 AM - 09:00 AM',
      '09:00 AM - 11:00 AM',
      '11:00 AM - 01:00 PM',
      '01:00 PM - 03:00 PM',
      '03:00 PM - 05:00 PM',
      '05:00 PM - 07:00 PM',
    ])
    .default('07:00 AM - 09:00 AM'),
  collectionType: z.enum(['centre', 'home']).default('centre'),
  address: z.string().max(400).optional(),
  landmark: z.string().max(150).optional(),
  city: z.string().max(100).default('Mandideep'),
  pinCode: z.union([z.string().regex(/^[0-9]{6}$/), z.literal('')]).optional(),
  clinicalNotes: z.string().max(500).optional(),
})

doctorRouter.post('/doctor/bookings', requireDoctor, async (req, res, next) => {
  try {
    const parsed = doctorReferralSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid referral details provided.',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const data = parsed.data
    const doctor = await Doctor.findById(req.doctor.id)
    if (!doctor || doctor.status !== 'active') {
      return res.status(403).json({ message: 'Active doctor credentials required.' })
    }

    const discountPercent = doctor.discountPercent || 0
    const commissionPercent = doctor.commissionPercent || 0

    // Resolve items and calculate tariffs
    const resolvedItems = []
    let subtotalPaise = 0
    let hasUnverified = false

    for (const item of data.items) {
      if (item.itemType === 'package') {
        const pkg = await Package.findOne({
          $or: [{ name: item.name }, ...(item.id ? [{ _id: item.id }] : [])],
          isActive: true,
        })
        if (pkg) {
          resolvedItems.push({
            itemType: 'package',
            itemId: pkg._id,
            name: pkg.name,
            code: pkg.code,
            pricePaise: pkg.pricePaise,
            isVerifiedPrice: pkg.isVerifiedPrice,
          })
          subtotalPaise += pkg.pricePaise
          if (!pkg.isVerifiedPrice) hasUnverified = true
        }
      } else {
        const test = await Test.findOne({
          $or: [{ name: item.name }, ...(item.id ? [{ _id: item.id }] : [])],
          isActive: true,
        })
        if (test) {
          resolvedItems.push({
            itemType: 'test',
            itemId: test._id,
            name: test.name,
            code: test.shortCode,
            pricePaise: test.pricePaise,
            isVerifiedPrice: test.isVerifiedPrice,
          })
          subtotalPaise += test.pricePaise
          if (!test.isVerifiedPrice) hasUnverified = true
        }
      }
    }

    if (resolvedItems.length === 0) {
      return res.status(400).json({ message: 'No valid tests or packages found to refer.' })
    }

    // Dynamic Doctor Discount Calculation
    const discountAmountPaise = Math.round(subtotalPaise * (discountPercent / 100))
    const totalAmountPaise = Math.max(0, subtotalPaise - discountAmountPaise)
    const commissionPaise = Math.round(subtotalPaise * (commissionPercent / 100))

    // Generate unique reference
    let reference = generateBookingReference()
    while (await Booking.findOne({ reference })) {
      reference = generateBookingReference()
    }

    const booking = await Booking.create({
      reference,
      patientName: data.patientName,
      phone: data.phone,
      email: data.email || undefined,
      age: data.age,
      gender: data.gender,
      items: resolvedItems,
      subtotalPaise,
      discountAmountPaise,
      totalAmountPaise,
      hasUnverifiedPrices: hasUnverified,
      doctorId: doctor._id,
      doctorName: doctor.name,
      doctorDiscountPercent: discountPercent,
      commissionPaise,
      referredBy: 'doctor',
      date: data.date,
      timeSlot: data.timeSlot,
      collectionType: data.collectionType,
      address: data.address || '',
      landmark: data.landmark || '',
      city: data.city || 'Mandideep',
      pinCode: data.pinCode || '',
      status: 'confirmed', // Automatically confirmed when scheduled by referring doctor
      paymentStatus: 'not_started',
      adminNotes: data.clinicalNotes ? `Doctor Prescription: ${data.clinicalNotes}` : `Referred by ${doctor.name}`,
      consent: true,
    })

    // Update doctor's referral counters
    doctor.totalReferredPatients += 1
    doctor.totalTestsReferred += resolvedItems.length
    doctor.totalRevenuePaise += totalAmountPaise
    doctor.totalEarningsPaise += commissionPaise
    await doctor.save()

    await recordAudit({
      action: 'doctor_referral_created',
      category: 'booking',
      performedBy: doctor.email,
      targetId: String(booking._id),
      targetReference: booking.reference,
      details: {
        doctorName: doctor.name,
        discountPercent,
        discountAmountPaise,
        totalAmountPaise,
      },
      req,
    })

    res.status(201).json({
      message: `Patient ${booking.patientName} successfully referred under ${doctor.name} with ${discountPercent}% discount.`,
      booking,
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// PATIENT REPORT ACCESS BY REFERRED DOCTOR
// ==========================================

doctorRouter.get('/doctor/reports/:reference', requireDoctor, async (req, res, next) => {
  try {
    const { reference } = req.params

    const booking = await Booking.findOne({
      reference: reference.toUpperCase().trim(),
      $or: [{ doctorId: req.doctor._id }, { doctorName: req.doctor.name }],
    })

    if (!booking) {
      return res.status(404).json({
        message: 'No patient record found for this reference under your referral.',
      })
    }

    const report = await Report.findOne({
      bookingReference: booking.reference,
      status: 'released',
    }).lean()

    if (!report) {
      return res.status(404).json({
        message: 'Diagnostic report is not yet released for this patient.',
      })
    }

    res.json({
      report: {
        id: String(report._id),
        bookingReference: report.bookingReference,
        patientName: report.patientName,
        reportTitle: report.reportTitle,
        testNames: report.testNames,
        fileName: report.fileName,
        fileSizeBytes: report.fileSizeBytes,
        releasedAt: report.releasedAt,
      },
    })
  } catch (err) {
    next(err)
  }
})

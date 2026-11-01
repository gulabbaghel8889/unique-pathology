import express from 'express'
import mongoose from 'mongoose'
import crypto from 'node:crypto'
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
import { FinancialLedger } from '../models/FinancialLedger.js'
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
// DOCTOR REFERRALS, FINANCIAL LEDGER & STATEMENTS
// ==========================================

function computeBookingFinancials(booking) {
  let originalMrpPaise =
    booking.originalMrpPaise && booking.originalMrpPaise > 0
      ? booking.originalMrpPaise
      : booking.subtotalPaise && booking.subtotalPaise > 0
      ? booking.subtotalPaise
      : 0

  if (!originalMrpPaise && Array.isArray(booking.items) && booking.items.length > 0) {
    originalMrpPaise = booking.items.reduce((sum, it) => sum + (it.mrpPaise || it.pricePaise || 0), 0)
  }

  const doctorDiscountPaise = Math.max(0, booking.discountAmountPaise || 0)

  if (!originalMrpPaise) {
    originalMrpPaise = Math.max(0, (booking.totalAmountPaise || 0) + doctorDiscountPaise)
  }

  const patientPayablePaise =
    booking.totalAmountPaise !== undefined && booking.totalAmountPaise !== null
      ? booking.totalAmountPaise
      : Math.max(0, originalMrpPaise - doctorDiscountPaise)

  const patientPaidPaise =
    booking.amountPaidPaise !== undefined && booking.amountPaidPaise !== null
      ? booking.amountPaidPaise
      : booking.paymentStatus === 'paid'
      ? patientPayablePaise
      : 0

  const amountRefundedPaise = Math.max(0, booking.amountRefundedPaise || 0)
  const netReceiptsPaise = Math.max(0, patientPaidPaise - amountRefundedPaise)

  const patientOutstandingPaise =
    booking.outstandingAmountPaise !== undefined && booking.outstandingAmountPaise !== null
      ? Math.max(0, booking.outstandingAmountPaise)
      : Math.max(0, patientPayablePaise - patientPaidPaise + amountRefundedPaise)

  const authorizedServicePaise = Math.max(0, booking.authorizedServicePaymentPaise || 0)
  const netRetainedPaise = Math.max(0, netReceiptsPaise - authorizedServicePaise)

  return {
    originalMrpPaise,
    totalMrpPaise: originalMrpPaise,
    doctorDiscountPaise,
    discountAmountPaise: doctorDiscountPaise,
    discountPercent: originalMrpPaise > 0 ? Math.round((doctorDiscountPaise / originalMrpPaise) * 100) : 0,
    patientPayablePaise,
    totalPayablePaise: patientPayablePaise,
    patientPaidPaise,
    totalPaidPaise: patientPaidPaise,
    patientOutstandingPaise,
    totalOutstandingPaise: patientOutstandingPaise,
    amountRefundedPaise,
    patientRefundedPaise: amountRefundedPaise,
    totalRefundedPaise: amountRefundedPaise,
    authorizedServicePaise,
    authorizedServicePaymentPaise: authorizedServicePaise,
    totalAuthorizedServicePaymentPaise: authorizedServicePaise,
    netReceiptsPaise,
    labNetReceiptsPaise: netReceiptsPaise,
    netRetainedPaise,
    labNetRetainedPaise: netRetainedPaise,
    totalLabNetRetainedPaise: netRetainedPaise,
  }
}

// 1. Referral Records Ledger (All Referred Patients Across Doctors)
adminRouter.get('/admin/referrals', requireAdmin, async (req, res, next) => {
  try {
    const {
      doctorId,
      search,
      bookingId,
      startDate,
      endDate,
      testOrPackage,
      status,
      paymentStatus,
      settlementStatus,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      page = 1,
      limit = 50,
    } = req.query

    const query = {
      $or: [
        { doctorId: { $ne: null } },
        { doctorName: { $exists: true, $ne: '' } },
        { referredBy: 'doctor' },
      ],
    }

    if (doctorId && doctorId !== 'all') {
      query.doctorId = doctorId
    }

    if (bookingId && typeof bookingId === 'string' && bookingId.trim()) {
      query.reference = new RegExp(bookingId.trim(), 'i')
    }

    if (startDate && endDate) {
      query.date = { $gte: String(startDate), $lte: String(endDate) }
    } else if (startDate) {
      query.date = { $gte: String(startDate) }
    } else if (endDate) {
      query.date = { $lte: String(endDate) }
    }

    if (status && status !== 'all') {
      query.status = status
    }

    if (paymentStatus && paymentStatus !== 'all') {
      query.paymentStatus = paymentStatus
    }

    if (settlementStatus && settlementStatus !== 'all') {
      query.settlementStatus = settlementStatus
    }

    if (testOrPackage && testOrPackage.trim()) {
      query['items.name'] = new RegExp(testOrPackage.trim(), 'i')
    }

    if (search && search.trim()) {
      const term = search.trim()
      const regex = new RegExp(term, 'i')
      query.$and = [
        {
          $or: [
            { reference: regex },
            { patientName: regex },
            { phone: regex },
            { doctorName: regex },
            { 'items.name': regex },
          ],
        },
      ]
    }

    const sortOption = {}
    const order = sortOrder === 'asc' ? 1 : -1
    if (sortBy === 'date') {
      sortOption.date = order
      sortOption.createdAt = order
    } else if (sortBy === 'patientName') {
      sortOption.patientName = order
    } else if (sortBy === 'doctorName') {
      sortOption.doctorName = order
    } else if (sortBy === 'totalAmountPaise') {
      sortOption.totalAmountPaise = order
    } else {
      sortOption.createdAt = order
    }

    const pageNum = Math.max(1, Number(page) || 1)
    const limitNum = Math.max(1, Math.min(1000, Number(limit) || 50))
    const skip = (pageNum - 1) * limitNum

    // Aggregate summary for all matching records
    const allMatching = await Booking.find(query)
      .select(
        'originalMrpPaise subtotalPaise discountAmountPaise totalAmountPaise amountPaidPaise amountRefundedPaise outstandingAmountPaise authorizedServicePaymentPaise paymentStatus settlementStatus'
      )
      .lean()

    let summaryOriginalMrpPaise = 0
    let summaryDiscountPaise = 0
    let summaryPatientPayablePaise = 0
    let summaryPatientPaidPaise = 0
    let summaryOutstandingPaise = 0
    let summaryRefundPaise = 0
    let summaryAuthorizedServicePaise = 0
    let summaryNetReceiptsPaise = 0
    let summaryNetRetainedPaise = 0

    allMatching.forEach((b) => {
      const fin = computeBookingFinancials(b)
      summaryOriginalMrpPaise += fin.originalMrpPaise
      summaryDiscountPaise += fin.doctorDiscountPaise
      summaryPatientPayablePaise += fin.patientPayablePaise
      summaryPatientPaidPaise += fin.patientPaidPaise
      summaryOutstandingPaise += fin.patientOutstandingPaise
      summaryRefundPaise += fin.amountRefundedPaise
      summaryAuthorizedServicePaise += fin.authorizedServicePaise
      summaryNetReceiptsPaise += fin.netReceiptsPaise
    })

    summaryNetRetainedPaise = Math.max(0, summaryNetReceiptsPaise - summaryAuthorizedServicePaise)

    const rawBookings = await Booking.find(query)
      .populate('doctorId', 'name email mobile specialization clinicName referralCode discountPercent status')
      .sort(sortOption)
      .skip(skip)
      .limit(limitNum)
      .lean()

    const bookingIds = rawBookings.map((b) => b._id)
    const bookingRefs = rawBookings.map((b) => b.reference)

    const [payments, reports, ledgers] = await Promise.all([
      Payment.find({ bookingId: { $in: bookingIds } })
        .sort({ paymentDate: -1, createdAt: -1 })
        .lean(),
      Report.find({ bookingReference: { $in: bookingRefs } }).lean(),
      FinancialLedger.find({ bookingId: { $in: bookingIds } })
        .sort({ createdAt: -1 })
        .lean(),
    ])

    const paymentMap = new Map()
    payments.forEach((p) => {
      if (!paymentMap.has(String(p.bookingId))) {
        paymentMap.set(String(p.bookingId), p)
      }
    })

    const reportMap = new Map()
    reports.forEach((r) => {
      reportMap.set(r.bookingReference, r)
    })

    const ledgerMap = new Map()
    ledgers.forEach((l) => {
      const arr = ledgerMap.get(String(l.bookingId)) || []
      arr.push(l)
      ledgerMap.set(String(l.bookingId), arr)
    })

    const referrals = rawBookings.map((b) => {
      const fin = computeBookingFinancials(b)
      const latestPayment = paymentMap.get(String(b._id))
      const rep = reportMap.get(b.reference)
      const bookingLedger = ledgerMap.get(String(b._id)) || []

      const doctorDoc = b.doctorId && typeof b.doctorId === 'object' && b.doctorId.name ? b.doctorId : null
      const docName = (doctorDoc?.name || b.doctorName || '').trim()
      const docId = doctorDoc?._id || (b.doctorId ? String(b.doctorId) : null)
      const isReferredByDoctor = Boolean(docName || docId || b.referredBy === 'doctor')

      const doctorData = isReferredByDoctor && (docName || docId)
        ? {
            _id: docId,
            id: docId,
            name: docName || 'Consulting Doctor',
            email: doctorDoc?.email || '',
            mobile: doctorDoc?.mobile || '',
            clinicName: doctorDoc?.clinicName || '',
            specialization: doctorDoc?.specialization || '',
            referralCode: doctorDoc?.referralCode || '',
            discountPercent: b.doctorDiscountPercent || doctorDoc?.discountPercent || 0,
          }
        : null

      const patientData = {
        name: b.patientName || 'Unknown Patient',
        mobile: b.phone || '',
        phone: b.phone || '',
        email: b.email || '',
        age: b.age,
        gender: b.gender,
        address: b.address || '',
      }

      return {
        _id: b._id,
        reference: b.reference,
        bookingReference: b.reference,
        doctor: doctorData,
        doctorId: docId,
        doctorName: doctorData ? doctorData.name : (b.referredBy === 'doctor' && docName ? docName : 'Direct / Walk-in'),
        doctorEmail: doctorData?.email || '',
        doctorMobile: doctorData?.mobile || '',
        doctorClinic: doctorData?.clinicName || '',
        doctorSpecialization: doctorData?.specialization || '',
        referralCode: doctorData?.referralCode || '',
        doctorDiscountPercent: doctorData?.discountPercent || b.doctorDiscountPercent || 0,
        patient: patientData,
        patientName: b.patientName || 'Unknown Patient',
        phone: b.phone || '',
        email: b.email || '',
        age: b.age,
        gender: b.gender,
        date: b.date,
        timeSlot: b.timeSlot,
        collectionType: b.collectionType,
        address: b.address,
        landmark: b.landmark,
        city: b.city,
        pinCode: b.pinCode,
        status: b.status,
        paymentStatus: b.paymentStatus || 'not_started',
        settlementStatus: b.settlementStatus || 'pending',
        settledAt: b.settledAt,
        settledBy: b.settledBy,
        settlementNotes: b.settlementNotes,
        items: b.items || [],
        financials: fin,
        paymentDetails: latestPayment
          ? {
              method: latestPayment.paymentMethod,
              transactionReference:
                latestPayment.razorpayPaymentId || latestPayment.cardOrVpa || latestPayment.notes || '',
              date: latestPayment.paymentDate,
              reconciled: latestPayment.reconciled,
            }
          : null,
        reportDetails: rep
          ? {
              id: rep._id,
              title: rep.reportTitle,
              status: rep.status,
              releasedAt: rep.releasedAt,
            }
          : null,
        ledgerEntriesCount: bookingLedger.length,
        adminNotes: b.adminNotes,
        createdAt: b.createdAt,
      }
    })

    res.json({
      referrals,
      summary: {
        totalReferralsCount: allMatching.length,
        totalBookings: allMatching.length,
        totalOriginalMrpPaise: summaryOriginalMrpPaise,
        totalMrpPaise: summaryOriginalMrpPaise,
        totalDoctorDiscountPaise: summaryDiscountPaise,
        totalPatientPayablePaise: summaryPatientPayablePaise,
        totalPayablePaise: summaryPatientPayablePaise,
        totalPatientPaidPaise: summaryPatientPaidPaise,
        totalPaidPaise: summaryPatientPaidPaise,
        totalOutstandingPaise: summaryOutstandingPaise,
        totalRefundPaise: summaryRefundPaise,
        totalRefundedPaise: summaryRefundPaise,
        totalAuthorizedServicePaise: summaryAuthorizedServicePaise,
        totalAuthorizedServicePaymentPaise: summaryAuthorizedServicePaise,
        totalNetReceiptsPaise: summaryNetReceiptsPaise,
        totalNetRetainedPaise: summaryNetRetainedPaise,
        totalLabNetRetainedPaise: summaryNetRetainedPaise,
      },
      pagination: {
        page: pageNum,
        limit: limitNum,
        total: allMatching.length,
        totalPages: Math.ceil(allMatching.length / limitNum) || 1,
      },
    })
  } catch (err) {
    next(err)
  }
})

// 2. Single Referral Detail with Complete Audit & Ledger Trail
adminRouter.get('/admin/referrals/:id', requireAdmin, async (req, res, next) => {
  try {
    const booking = await Booking.findById(req.params.id)
      .populate('doctorId', 'name email mobile specialization clinicName referralCode discountPercent status')
      .lean()

    if (!booking) {
      return res.status(404).json({ message: 'Referral booking not found.' })
    }

    const [ledgerEntries, payments, auditLogs, report] = await Promise.all([
      FinancialLedger.find({ bookingId: booking._id }).sort({ createdAt: -1 }).lean(),
      Payment.find({ bookingId: booking._id }).sort({ paymentDate: -1, createdAt: -1 }).lean(),
      AuditLog.find({
        $or: [{ targetId: String(booking._id) }, { targetReference: booking.reference }],
      })
        .sort({ createdAt: -1 })
        .lean(),
      Report.findOne({ bookingReference: booking.reference }).lean(),
    ])

    const financials = computeBookingFinancials(booking)

    const doctorDoc = booking.doctorId && typeof booking.doctorId === 'object' && booking.doctorId.name ? booking.doctorId : null
    const docName = (doctorDoc?.name || booking.doctorName || '').trim()
    const docId = doctorDoc?._id || (booking.doctorId ? String(booking.doctorId) : null)
    const isReferredByDoctor = Boolean(docName || docId || booking.referredBy === 'doctor')

    const doctorData = isReferredByDoctor && (docName || docId)
      ? {
          _id: docId,
          id: docId,
          name: docName || 'Consulting Doctor',
          email: doctorDoc?.email || '',
          mobile: doctorDoc?.mobile || '',
          clinicName: doctorDoc?.clinicName || '',
          specialization: doctorDoc?.specialization || '',
          referralCode: doctorDoc?.referralCode || '',
          discountPercent: booking.doctorDiscountPercent || doctorDoc?.discountPercent || 0,
        }
      : null

    const patientData = {
      name: booking.patientName || 'Unknown Patient',
      mobile: booking.phone || '',
      phone: booking.phone || '',
      email: booking.email || '',
      age: booking.age,
      gender: booking.gender,
      address: booking.address || '',
    }

    const enhancedBooking = {
      ...booking,
      bookingReference: booking.reference,
      doctor: doctorData,
      doctorId: docId,
      doctorName: doctorData ? doctorData.name : (booking.referredBy === 'doctor' && docName ? docName : 'Direct / Walk-in'),
      patient: patientData,
      patientName: booking.patientName || 'Unknown Patient',
    }

    res.json({
      booking: enhancedBooking,
      financials,
      ledgerEntries,
      payments,
      auditLogs,
      report,
      referral: {
        ...enhancedBooking,
        financials,
        ledgerEntries,
        payments,
        auditLogs,
        report,
      },
    })
  } catch (err) {
    next(err)
  }
})

// 3. Record Verified Patient Payment
adminRouter.post('/admin/referrals/:id/payment', requireAdmin, async (req, res, next) => {
  try {
    const { amount, amountPaise: rawAmountPaise, paymentMethod = 'Cash', transactionReference, notes } = req.body || {}

    const amountNum = rawAmountPaise !== undefined ? (Number(rawAmountPaise) / 100) : Number(amount)
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ message: 'Valid payment amount greater than zero is required.' })
    }

    const booking = await Booking.findById(req.params.id)
    if (!booking) {
      return res.status(404).json({ message: 'Referral booking not found.' })
    }

    const amountPaise = Math.round(amountNum * 100)
    const originalMrp =
      booking.originalMrpPaise && booking.originalMrpPaise > 0
        ? booking.originalMrpPaise
        : booking.subtotalPaise || booking.totalAmountPaise || 0

    const currentPaid = booking.amountPaidPaise || (booking.paymentStatus === 'paid' ? booking.totalAmountPaise : 0)
    const newPaidPaise = currentPaid + amountPaise
    const currentRefunds = booking.amountRefundedPaise || 0
    const newOutstandingPaise = Math.max(0, booking.totalAmountPaise - (newPaidPaise - currentRefunds))

    booking.amountPaidPaise = newPaidPaise
    booking.outstandingAmountPaise = newOutstandingPaise
    booking.originalMrpPaise = originalMrp

    if (newOutstandingPaise === 0) {
      booking.paymentStatus = 'paid'
      booking.paidAt = new Date()
    } else {
      booking.paymentStatus = 'pending'
    }

    if (notes) {
      booking.adminNotes = `${booking.adminNotes ? booking.adminNotes + ' | ' : ''}Payment: ${notes}`
    }

    await booking.save()

    const cleanTxRef = transactionReference?.trim() || `RCP-${Date.now().toString().slice(-6)}`

    // Create Immutable Ledger Entry
    const ledgerEntry = await FinancialLedger.create({
      bookingId: booking._id,
      bookingReference: booking.reference,
      doctorId: booking.doctorId || null,
      doctorName: booking.doctorName || '',
      patientName: booking.patientName,
      patientPhone: booking.phone,
      entryType: 'PATIENT_PAYMENT',
      amountPaise,
      paymentMethod,
      transactionReference: cleanTxRef,
      originalMrpPaise: originalMrp,
      discountAmountPaise: booking.discountAmountPaise || 0,
      patientPayablePaise: booking.totalAmountPaise,
      recordedBy: req.admin.email,
      notes: notes?.trim() || `Patient payment collected via ${paymentMethod}`,
    })

    // Sync Payment record for backwards compatibility
    const testOrPackageName =
      booking.items && booking.items.length > 0
        ? booking.items.map((i) => i.name).join(', ')
        : 'Diagnostic Test'

    await Payment.create({
      bookingId: booking._id,
      bookingReference: booking.reference,
      patientName: booking.patientName,
      mobileNumber: booking.phone,
      testOrPackageName,
      originalAmount: originalMrp / 100,
      discountAmount: (booking.discountAmountPaise || 0) / 100,
      finalAmount: amountNum,
      amountPaise,
      currency: 'INR',
      paymentMethod,
      status: 'paid',
      paymentDate: new Date(),
      cardOrVpa: cleanTxRef,
      reconciled: true,
      reconciledAt: new Date(),
      reconciledBy: req.admin.email,
      notes: notes || `Reconciled ledger receipt ${cleanTxRef}`,
    })

    // Record Immutable Audit Log
    await recordAudit({
      action: `Patient payment of ₹${amountNum.toFixed(2)} recorded for Booking ${booking.reference}`,
      category: 'payment',
      performedBy: req.admin.email,
      targetId: String(ledgerEntry._id),
      targetReference: booking.reference,
      details: {
        bookingId: String(booking._id),
        amountPaise,
        paymentMethod,
        transactionReference: cleanTxRef,
        totalPaidPaise: newPaidPaise,
        outstandingAmountPaise: newOutstandingPaise,
      },
      req,
    })

    res.status(201).json({
      message: `Payment of ₹${amountNum.toFixed(2)} successfully recorded for ${booking.patientName}.`,
      booking,
      ledgerEntry,
    })
  } catch (err) {
    next(err)
  }
})

// 4. Record Patient Refund (Without deleting history)
adminRouter.post('/admin/referrals/:id/refund', requireAdmin, async (req, res, next) => {
  try {
    const {
      amount,
      refundAmountPaise,
      amountPaise: rawAmountPaise,
      refundMethod = 'Cash',
      transactionReference,
      reference,
      justification,
      reason,
      notes,
    } = req.body || {}

    // 1. Validate refund amount
    let effectiveAmountPaise
    if (refundAmountPaise !== undefined && refundAmountPaise !== null && !isNaN(Number(refundAmountPaise))) {
      effectiveAmountPaise = Math.round(Number(refundAmountPaise))
    } else if (rawAmountPaise !== undefined && rawAmountPaise !== null && !isNaN(Number(rawAmountPaise))) {
      effectiveAmountPaise = Math.round(Number(rawAmountPaise))
    } else if (amount !== undefined && amount !== null && !isNaN(Number(amount))) {
      effectiveAmountPaise = Math.round(Number(amount) * 100)
    }

    if (!effectiveAmountPaise || effectiveAmountPaise <= 0) {
      return res.status(400).json({ message: 'Valid refund amount greater than zero is required.' })
    }

    const amountNum = effectiveAmountPaise / 100

    // 2. Validate mandatory justification/reason
    const effectiveJustification =
      typeof justification === 'string' && justification.trim()
        ? justification.trim()
        : typeof reason === 'string' && reason.trim()
        ? reason.trim()
        : ''

    if (!effectiveJustification || effectiveJustification.length < 3) {
      return res.status(400).json({ message: 'A documented justification (minimum 3 characters) is required for processing refunds.' })
    }

    // 3. Find booking
    const booking = await Booking.findById(req.params.id)
    if (!booking) {
      return res.status(404).json({ message: 'Referral booking not found.' })
    }

    // 4. Validate refund against actual eligible collected payments
    const currentPaid =
      booking.amountPaidPaise !== undefined && booking.amountPaidPaise !== null
        ? booking.amountPaidPaise
        : booking.paymentStatus === 'paid'
        ? booking.totalAmountPaise
        : 0
    const currentRefunds = booking.amountRefundedPaise || 0
    const maxRefundable = Math.max(0, currentPaid - currentRefunds)

    if (maxRefundable <= 0) {
      return res.status(400).json({
        message: 'No eligible collected payments available for refund on this booking.',
      })
    }

    if (effectiveAmountPaise > maxRefundable) {
      return res.status(400).json({
        message: `Refund of ₹${amountNum.toFixed(2)} exceeds net collected amount of ₹${(maxRefundable / 100).toFixed(2)}. Maximum refundable is ₹${(maxRefundable / 100).toFixed(2)}.`,
      })
    }

    // 5. Prevent duplicate refund submission
    const cleanTxRef =
      typeof transactionReference === 'string' && transactionReference.trim()
        ? transactionReference.trim()
        : typeof reference === 'string' && reference.trim()
        ? reference.trim()
        : null

    if (cleanTxRef) {
      const existingTx = await FinancialLedger.findOne({
        bookingId: booking._id,
        entryType: 'PATIENT_REFUND',
        transactionReference: cleanTxRef,
      })
      if (existingTx) {
        return res.status(400).json({
          message: `Duplicate refund: A refund with reference '${cleanTxRef}' has already been processed for this booking.`,
        })
      }
    }

    // Guard against rapid duplicate double-clicks (< 5s)
    const recentDuplicate = await FinancialLedger.findOne({
      bookingId: booking._id,
      entryType: 'PATIENT_REFUND',
      amountPaise: effectiveAmountPaise,
      createdAt: { $gte: new Date(Date.now() - 5000) },
    })
    if (recentDuplicate) {
      return res.status(400).json({
        message: 'Duplicate refund detected: An identical refund was just processed seconds ago. Please refresh the page.',
      })
    }

    const finalTxRef = cleanTxRef || `REF-${Date.now().toString().slice(-6)}`
    const effectiveNotes =
      typeof notes === 'string' && notes.trim()
        ? notes.trim()
        : `Refund processed: ${effectiveJustification}`

    // 6. Update booking balances safely
    const newRefundsPaise = currentRefunds + effectiveAmountPaise
    const newOutstandingPaise = Math.max(0, booking.totalAmountPaise - (currentPaid - newRefundsPaise))

    booking.amountRefundedPaise = newRefundsPaise
    booking.outstandingAmountPaise = newOutstandingPaise

    if (newRefundsPaise >= currentPaid) {
      booking.paymentStatus = 'refunded'
    } else {
      booking.paymentStatus = newOutstandingPaise > 0 ? 'pending' : 'paid'
    }

    if (notes) {
      booking.adminNotes = `${booking.adminNotes ? booking.adminNotes + ' | ' : ''}Refund: ${effectiveJustification}`
    }

    await booking.save()

    // 7. Create Immutable Ledger Entry for Refund
    const ledgerEntry = await FinancialLedger.create({
      bookingId: booking._id,
      bookingReference: booking.reference,
      doctorId: booking.doctorId || null,
      doctorName: booking.doctorName || '',
      patientName: booking.patientName,
      patientPhone: booking.phone,
      entryType: 'PATIENT_REFUND',
      amountPaise: effectiveAmountPaise,
      paymentMethod: refundMethod,
      transactionReference: finalTxRef,
      recordedBy: req.admin?.email || 'admin',
      justification: effectiveJustification,
      notes: effectiveNotes,
    })

    // 8. Record Immutable Audit Log
    await recordAudit({
      action: `Patient refund of ₹${amountNum.toFixed(2)} recorded for Booking ${booking.reference}`,
      category: 'payment',
      performedBy: req.admin?.email || 'admin',
      targetId: String(ledgerEntry._id),
      targetReference: booking.reference,
      details: {
        bookingId: String(booking._id),
        refundPaise: effectiveAmountPaise,
        refundMethod,
        justification: effectiveJustification,
        transactionReference: finalTxRef,
        totalRefundsPaise: newRefundsPaise,
      },
      req,
    })

    res.status(201).json({
      message: `Refund of ₹${amountNum.toFixed(2)} successfully recorded for ${booking.patientName}.`,
      booking,
      ledgerEntry,
    })
  } catch (err) {
    next(err)
  }
})

// 5. Record Authorized & Lawful Service/Professional Payment
// Compliance Note: Do not automatically pay referral commissions.
// Any permitted professional/service payment must be independently justified, documented, approved, and compliant.
adminRouter.post('/admin/referrals/:id/service-payment', requireAdmin, async (req, res, next) => {
  try {
    const {
      amount,
      amountPaise: rawAmountPaise,
      serviceCategory,
      category,
      justification,
      legalJustification,
      approvalReference,
      agreementRef,
      paymentMethod = 'Bank Transfer',
      transactionReference,
      paymentReference,
      notes,
    } = req.body || {}

    const amountNum = rawAmountPaise !== undefined ? (Number(rawAmountPaise) / 100) : Number(amount)
    if (!amountNum || amountNum <= 0) {
      return res.status(400).json({ message: 'Valid professional service payment amount is required.' })
    }

    const effectiveCategory = category || serviceCategory
    const validCategories = [
      'CLINICAL_SPECIMEN_COLLECTION',
      'POST_DIAGNOSTIC_CONSULTATION',
      'SPECIALIZED_HOME_VISIT',
      'SPECIALIST_SAMPLE_PREPARATION',
      'EQUIPMENT_FACILITY_PROVISION',
      'OTHER_DOCUMENTED_CLINICAL_SERVICE',
      'OTHER_LAWFUL_SERVICE',
    ]

    if (!validCategories.includes(effectiveCategory)) {
      return res.status(400).json({
        message: 'A valid authorized clinical/service category is required.',
      })
    }

    const effectiveJustification = (justification || legalJustification || '').trim()
    if (!effectiveJustification || effectiveJustification.length < 10) {
      return res.status(400).json({
        message: 'An independent legal/clinical justification of at least 10 characters is required for any authorized service payment.',
      })
    }

    const effectiveApprovalRef = (approvalReference || agreementRef || '').trim()
    if (!effectiveApprovalRef || effectiveApprovalRef.length < 3) {
      return res.status(400).json({
        message: 'A documented authorization/agreement reference is mandatory.',
      })
    }

    const booking = await Booking.findById(req.params.id)
    if (!booking) {
      return res.status(404).json({ message: 'Referral booking not found.' })
    }

    const servicePaise = Math.round(amountNum * 100)
    booking.authorizedServicePaymentPaise = (booking.authorizedServicePaymentPaise || 0) + servicePaise
    await booking.save()

    const cleanTxRef = (transactionReference || paymentReference)?.trim() || `SRV-${Date.now().toString().slice(-6)}`

    const ledgerEntry = await FinancialLedger.create({
      bookingId: booking._id,
      bookingReference: booking.reference,
      doctorId: booking.doctorId || null,
      doctorName: booking.doctorName || '',
      patientName: booking.patientName,
      patientPhone: booking.phone,
      entryType: 'AUTHORIZED_SERVICE_PAYMENT',
      amountPaise: servicePaise,
      paymentMethod,
      transactionReference: cleanTxRef,
      recordedBy: req.admin.email,
      justification: `[${effectiveCategory}] ${effectiveJustification} (Approval Ref: ${effectiveApprovalRef})`,
      notes: notes?.trim() || `Authorized service payment for booking ${booking.reference}`,
    })

    await recordAudit({
      action: `Authorized service payment of ₹${amountNum.toFixed(2)} recorded for Booking ${booking.reference}`,
      category: 'payment',
      performedBy: req.admin.email,
      targetId: String(ledgerEntry._id),
      targetReference: booking.reference,
      details: {
        bookingId: String(booking._id),
        serviceCategory: effectiveCategory,
        servicePaise,
        justification: effectiveJustification,
        approvalReference: effectiveApprovalRef,
        transactionReference: cleanTxRef,
      },
      req,
    })

    res.status(201).json({
      message: `Authorized service payment of ₹${amountNum.toFixed(2)} recorded successfully.`,
      booking,
      ledgerEntry,
    })
  } catch (err) {
    next(err)
  }
})

// 6. Update Settlement Status
adminRouter.patch('/admin/referrals/:id/settlement', requireAdmin, async (req, res, next) => {
  try {
    const { settlementStatus, notes } = req.body || {}
    const normalizedStatus = String(settlementStatus || '').toLowerCase().trim()
    const valid = ['pending', 'partially_settled', 'settled', 'waived', 'disputed']

    if (!valid.includes(normalizedStatus)) {
      return res.status(400).json({ message: 'Valid settlement status is required.' })
    }

    const booking = await Booking.findById(req.params.id)
    if (!booking) {
      return res.status(404).json({ message: 'Referral booking not found.' })
    }

    booking.settlementStatus = normalizedStatus
    booking.settledAt = new Date()
    booking.settledBy = req.admin.email
    if (notes) booking.settlementNotes = String(notes).trim()

    await booking.save()

    await recordAudit({
      action: `Settlement status updated to '${settlementStatus}' for Booking ${booking.reference}`,
      category: 'payment',
      performedBy: req.admin.email,
      targetId: String(booking._id),
      targetReference: booking.reference,
      details: { settlementStatus, notes },
      req,
    })

    res.json({
      message: `Settlement status updated to '${settlementStatus}'.`,
      booking,
    })
  } catch (err) {
    next(err)
  }
})

// 7. Doctor-Wise Accounts & Financial Statements (Admin Overview & Filterable by Date Range)
adminRouter.get('/admin/doctors-financial-statements', requireAdmin, async (req, res, next) => {
  try {
    const { doctorId, startDate, endDate } = req.query

    const doctorQuery = { status: 'active' }
    if (doctorId && doctorId !== 'all') {
      doctorQuery._id = doctorId
    }

    const doctors = await Doctor.find(doctorQuery)
      .select('name email mobile specialization qualification clinicName clinicAddress discountPercent commissionPercent referralCode status')
      .sort({ name: 1 })
      .lean()

    const statements = await Promise.all(
      doctors.map(async (doc) => {
        const bookingQuery = {
          $or: [{ doctorId: doc._id }, { doctorName: doc.name }],
        }

        if (startDate && endDate) {
          bookingQuery.date = { $gte: String(startDate), $lte: String(endDate) }
        } else if (startDate) {
          bookingQuery.date = { $gte: String(startDate) }
        } else if (endDate) {
          bookingQuery.date = { $lte: String(endDate) }
        }

        const bookings = await Booking.find(bookingQuery).lean()

        let totalTestsPrescribed = 0
        let totalOriginalMrpPaise = 0
        let totalDiscountPaise = 0
        let totalPatientBillingPaise = 0
        let totalAmountCollectedPaise = 0
        let totalOutstandingPaise = 0
        let totalRefundPaise = 0
        let totalAuthorizedServicePaise = 0
        let settledBookingsCount = 0
        let pendingBookingsCount = 0

        bookings.forEach((b) => {
          const fin = computeBookingFinancials(b)
          totalTestsPrescribed += Array.isArray(b.items) ? b.items.length : 1
          totalOriginalMrpPaise += fin.originalMrpPaise
          totalDiscountPaise += fin.doctorDiscountPaise
          totalPatientBillingPaise += fin.patientPayablePaise
          totalAmountCollectedPaise += fin.patientPaidPaise
          totalOutstandingPaise += fin.patientOutstandingPaise
          totalRefundPaise += fin.amountRefundedPaise
          totalAuthorizedServicePaise += fin.authorizedServicePaise

          if (b.settlementStatus === 'settled') {
            settledBookingsCount++
          } else {
            pendingBookingsCount++
          }
        })

        const netLabReceiptsPaise = Math.max(0, totalAmountCollectedPaise - totalRefundPaise)
        const netLabRetainedPaise = Math.max(0, netLabReceiptsPaise - totalAuthorizedServicePaise)

        return {
          doctor: doc,
          totalPatientsReferred: bookings.length,
          totalReferrals: bookings.length,
          totalTestsPrescribed,
          totalOriginalMrpPaise,
          totalDiscountPaise,
          totalPatientBillingPaise,
          totalAmountCollectedPaise,
          totalOutstandingPaise,
          totalRefundPaise,
          totalAuthorizedServicePaise,
          netLabReceiptsPaise,
          netLabRetainedPaise,
          settledBookingsCount,
          pendingBookingsCount,
          settlementCounts: {
            settled: settledBookingsCount,
            pending: pendingBookingsCount,
            SETTLED: settledBookingsCount,
            PENDING: pendingBookingsCount,
          },
          financials: {
            totalMrpPaise: totalOriginalMrpPaise,
            totalDoctorDiscountPaise: totalDiscountPaise,
            totalPatientBillingPaise,
            totalCollectedPaise: totalAmountCollectedPaise,
            totalOutstandingPaise,
            totalRefundsPaise: totalRefundPaise,
            totalAuthorizedServicePaymentsPaise: totalAuthorizedServicePaise,
            totalLabNetReceiptsPaise: netLabReceiptsPaise,
            totalLabNetRetainedPaise: netLabRetainedPaise,
          },
          // Itemized bookings for simplified billing statement & printing
          bookings: bookings.map((b) => {
            const fin = computeBookingFinancials(b)
            return {
              _id: b._id,
              reference: b.reference,
              bookingReference: b.reference,
              patientName: b.patientName,
              phone: b.phone,
              date: b.date,
              timeSlot: b.timeSlot,
              status: b.status,
              paymentStatus: b.paymentStatus,
              settlementStatus: b.settlementStatus,
              items: b.items,
              financials: fin,
              mrpPaise: fin.originalMrpPaise,
              discPaise: fin.doctorDiscountPaise,
              billPaise: fin.patientPayablePaise,
              paidPaise: fin.patientPaidPaise,
              duePaise: fin.patientOutstandingPaise,
              createdAt: b.createdAt,
            }
          }),
        }
      })
    )

    let overallDoctors = statements.length
    let overallReferrals = 0
    let overallMrpPaise = 0
    let overallDiscountPaise = 0
    let overallPatientBillingPaise = 0
    let overallCollectedPaise = 0
    let overallOutstandingPaise = 0
    let overallRefundPaise = 0
    let overallAuthorizedServicePaise = 0
    let overallNetReceiptsPaise = 0
    let overallNetRetainedPaise = 0

    statements.forEach((s) => {
      overallReferrals += s.totalReferrals || 0
      overallMrpPaise += s.totalOriginalMrpPaise || 0
      overallDiscountPaise += s.totalDiscountPaise || 0
      overallPatientBillingPaise += s.totalPatientBillingPaise || 0
      overallCollectedPaise += s.totalAmountCollectedPaise || 0
      overallOutstandingPaise += s.totalOutstandingPaise || 0
      overallRefundPaise += s.totalRefundPaise || 0
      overallAuthorizedServicePaise += s.totalAuthorizedServicePaise || 0
      overallNetReceiptsPaise += s.netLabReceiptsPaise || 0
      overallNetRetainedPaise += s.netLabRetainedPaise || 0
    })

    res.json({
      statements,
      overallSummary: {
        totalDoctors: overallDoctors,
        totalReferrals: overallReferrals,
        totalMrpPaise: overallMrpPaise,
        totalOriginalMrpPaise: overallMrpPaise,
        totalDoctorDiscountPaise: overallDiscountPaise,
        totalPatientBillingPaise: overallPatientBillingPaise,
        totalCollectedPaise: overallCollectedPaise,
        totalOutstandingPaise: overallOutstandingPaise,
        totalRefundPaise: overallRefundPaise,
        totalAuthorizedServicePaise: overallAuthorizedServicePaise,
        totalNetReceiptsPaise: overallNetReceiptsPaise,
        totalLabNetRetainedPaise: overallNetRetainedPaise,
      },
      filters: { doctorId: doctorId || 'all', startDate: startDate || null, endDate: endDate || null },
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

// Function to generate booking reference for admin created bookings
function generateAdminBookingReference() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `UP-${todayStr}-${randomHex}`
}

// POST /admin/bookings - Create booking from Admin Dashboard with Referring Doctor linking
adminRouter.post('/admin/bookings', requireAdmin, async (req, res, next) => {
  try {
    const {
      patientName,
      phone,
      email,
      age,
      gender = 'prefer_not_to_say',
      collectionType = 'centre',
      address,
      landmark,
      city = 'Mandideep',
      pinCode,
      date,
      timeSlot = '07:00 AM - 09:00 AM',
      items,
      doctorId,
      doctorName,
      paymentStatus = 'pending',
      paymentMethod = 'Cash',
      amountPaid,
      amountPaidPaise: rawPaidPaise,
      adminNotes,
    } = req.body || {}

    if (!patientName || patientName.trim().length < 2) {
      return res.status(400).json({ message: 'Patient name is required (minimum 2 characters).' })
    }

    const cleanPhone = String(phone || '').trim()
    if (!/^[6-9][0-9]{9}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please provide a valid 10-digit Indian mobile number.' })
    }

    const cleanDate = String(date || '').trim() || new Date().toISOString().slice(0, 10)
    if (!/^\d{4}-\d{2}-\d{2}$/.test(cleanDate)) {
      return res.status(400).json({ message: 'Date must be formatted as YYYY-MM-DD.' })
    }

    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ message: 'At least one test or package must be selected.' })
    }

    // Resolve items and calculate authoritative pricing
    const resolvedItems = []
    let originalMrpPaise = 0
    let subtotalPaise = 0
    let hasUnverified = false

    for (const item of items) {
      const qty = Math.max(1, Number(item.quantity) || 1)
      if (item.itemType === 'package') {
        const pkg = await Package.findOne({
          $or: [{ name: item.name }, ...(item.id ? [{ _id: item.id }] : [])],
          isActive: true,
        })
        if (pkg) {
          const itemMrp = ((pkg.mrpPaise && pkg.mrpPaise > 0) ? pkg.mrpPaise : pkg.pricePaise) * qty
          const itemBase = pkg.pricePaise * qty
          resolvedItems.push({
            itemType: 'package',
            itemId: pkg._id,
            name: qty > 1 ? `${pkg.name} (x${qty})` : pkg.name,
            code: pkg.code,
            pricePaise: itemBase,
            mrpPaise: itemMrp,
            isVerifiedPrice: pkg.isVerifiedPrice,
          })
          originalMrpPaise += itemMrp
          subtotalPaise += itemBase
          if (!pkg.isVerifiedPrice) hasUnverified = true
        }
      } else {
        const test = await Test.findOne({
          $or: [{ name: item.name }, ...(item.id ? [{ _id: item.id }] : [])],
          isActive: true,
        })
        if (test) {
          const itemMrp = ((test.mrpPaise && test.mrpPaise > 0) ? test.mrpPaise : test.pricePaise) * qty
          const itemBase = test.pricePaise * qty
          resolvedItems.push({
            itemType: 'test',
            itemId: test._id,
            name: qty > 1 ? `${test.name} (x${qty})` : test.name,
            code: test.shortCode,
            pricePaise: itemBase,
            mrpPaise: itemMrp,
            isVerifiedPrice: test.isVerifiedPrice,
          })
          originalMrpPaise += itemMrp
          subtotalPaise += itemBase
          if (!test.isVerifiedPrice) hasUnverified = true
        }
      }
    }

    if (resolvedItems.length === 0) {
      return res.status(400).json({ message: 'No valid tests or packages found. Please select from active catalogue.' })
    }

    // Referring Doctor linking
    let doctorDoc = null
    let doctorDiscountPercent = 0
    let discountAmountPaise = 0
    let referredBy = 'self'

    const isDirect = !doctorId || doctorId === 'walkin' || doctorId === 'self' || doctorId === 'direct' || doctorId === 'none'

    if (!isDirect) {
      if (mongoose.Types.ObjectId.isValid(doctorId)) {
        doctorDoc = await Doctor.findById(doctorId)
      }
      if (!doctorDoc && doctorName && doctorName.trim()) {
        doctorDoc = await Doctor.findOne({
          $or: [
            { name: new RegExp(`^${doctorName.trim()}`, 'i') },
            { referralCode: doctorName.trim().toUpperCase() },
          ],
        })
      }

      if (doctorDoc) {
        doctorDiscountPercent = doctorDoc.discountPercent || 0
        discountAmountPaise = Math.round(originalMrpPaise * (doctorDiscountPercent / 100))
        referredBy = 'doctor'
      }
    }

    // Update resolved items discount & final prices
    resolvedItems.forEach((it) => {
      it.discountPaise = Math.round((it.mrpPaise || it.pricePaise) * (doctorDiscountPercent / 100))
      it.finalPricePaise = Math.max(0, (it.mrpPaise || it.pricePaise) - it.discountPaise)
    })

    const totalAmountPaise = Math.max(0, originalMrpPaise - discountAmountPaise)

    // Calculate payments & balances
    let paidPaise = 0
    if (rawPaidPaise !== undefined && rawPaidPaise !== null && !isNaN(Number(rawPaidPaise))) {
      paidPaise = Math.max(0, Math.round(Number(rawPaidPaise)))
    } else if (amountPaid !== undefined && amountPaid !== null && !isNaN(Number(amountPaid))) {
      paidPaise = Math.max(0, Math.round(Number(amountPaid) * 100))
    } else if (paymentStatus === 'paid') {
      paidPaise = totalAmountPaise
    }

    const outstandingAmountPaise = Math.max(0, totalAmountPaise - paidPaise)
    const effectivePaymentStatus = paidPaise >= totalAmountPaise ? 'paid' : (paidPaise > 0 ? 'pending' : (paymentStatus || 'pending'))

    let reference = generateAdminBookingReference()
    while (await Booking.findOne({ reference })) {
      reference = generateAdminBookingReference()
    }

    const booking = await Booking.create({
      reference,
      patientName: patientName.trim(),
      phone: cleanPhone,
      email: email ? String(email).trim().toLowerCase() : undefined,
      age: age ? Number(age) : undefined,
      gender,
      collectionType,
      address: address ? String(address).trim() : '',
      landmark: landmark ? String(landmark).trim() : '',
      city: city ? String(city).trim() : 'Mandideep',
      pinCode: pinCode ? String(pinCode).trim() : '',
      date: cleanDate,
      timeSlot,
      items: resolvedItems,
      originalMrpPaise,
      subtotalPaise,
      discountAmountPaise,
      totalAmountPaise,
      amountPaidPaise: paidPaise,
      outstandingAmountPaise,
      amountRefundedPaise: 0,
      authorizedServicePaymentPaise: 0,
      settlementStatus: 'pending',
      paymentStatus: effectivePaymentStatus,
      paidAt: paidPaise >= totalAmountPaise ? new Date() : undefined,
      status: 'confirmed',
      consent: true,
      doctorId: doctorDoc ? doctorDoc._id : null,
      doctorName: doctorDoc ? doctorDoc.name : '',
      doctorDiscountPercent,
      referredBy,
      adminNotes: adminNotes ? String(adminNotes).trim() : (doctorDoc ? `Created by Admin | Ref: Dr. ${doctorDoc.name}` : 'Created by Admin (Walk-in)'),
    })

    // If payment recorded, create FinancialLedger entry
    if (paidPaise > 0) {
      const cleanTxRef = `ADM-RCP-${Date.now().toString().slice(-6)}`
      await FinancialLedger.create({
        bookingId: booking._id,
        bookingReference: booking.reference,
        doctorId: booking.doctorId || null,
        doctorName: booking.doctorName || '',
        patientName: booking.patientName,
        patientPhone: booking.phone,
        entryType: 'PATIENT_PAYMENT',
        amountPaise: paidPaise,
        paymentMethod: paymentMethod || 'Cash',
        transactionReference: cleanTxRef,
        originalMrpPaise,
        discountAmountPaise,
        patientPayablePaise: totalAmountPaise,
        recordedBy: req.admin.email,
        notes: `Payment collected at booking creation via ${paymentMethod || 'Cash'}`,
      })

      const testOrPackageName = resolvedItems.map((i) => i.name).join(', ')
      await Payment.create({
        bookingId: booking._id,
        bookingReference: booking.reference,
        patientName: booking.patientName,
        mobileNumber: booking.phone,
        testOrPackageName,
        originalAmount: originalMrpPaise / 100,
        discountAmount: discountAmountPaise / 100,
        finalAmount: paidPaise / 100,
        amountPaise: paidPaise,
        currency: 'INR',
        paymentMethod: paymentMethod || 'Cash',
        status: 'paid',
        paymentDate: new Date(),
        cardOrVpa: cleanTxRef,
        reconciled: true,
        reconciledAt: new Date(),
        reconciledBy: req.admin.email,
        notes: `Reconciled counter receipt ${cleanTxRef}`,
      })
    }

    await recordAudit({
      action: `Admin created booking ${booking.reference} for ${booking.patientName}`,
      category: 'booking',
      performedBy: req.admin.email,
      targetId: String(booking._id),
      targetReference: booking.reference,
      details: {
        doctorId: doctorDoc ? String(doctorDoc._id) : null,
        doctorName: doctorDoc ? doctorDoc.name : 'Walk-in',
        totalAmountPaise,
        paidPaise,
        outstandingAmountPaise,
      },
      req,
    })

    res.status(201).json({
      message: `Booking ${booking.reference} created successfully for ${booking.patientName}.`,
      booking,
    })
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


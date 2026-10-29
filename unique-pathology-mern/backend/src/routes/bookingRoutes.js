import express from 'express'
import crypto from 'node:crypto'
import { z } from 'zod'
import { Booking } from '../models/Booking.js'
import { Test } from '../models/Test.js'
import { Package } from '../models/Package.js'
import { Doctor } from '../models/Doctor.js'
import { Offer } from '../models/Offer.js'
import { recordAudit } from '../services/auditService.js'

export const bookingRouter = express.Router()

const bookingInputSchema = z.object({
  patientName: z.string().trim().min(2, 'Name must be at least 2 characters').max(100),
  phone: z.string().regex(/^[6-9][0-9]{9}$/, 'Please enter a valid 10-digit Indian mobile number'),
  email: z.union([z.string().email('Please enter a valid email address').max(254), z.literal('')]).optional(),
  age: z.coerce.number().min(0).max(130).optional(),
  gender: z.enum(['male', 'female', 'other', 'prefer_not_to_say']).default('prefer_not_to_say'),
  // Array of items or legacy single test/package string
  testName: z.string().trim().optional(),
  packageName: z.string().trim().optional(),
  items: z
    .array(
      z.object({
        itemType: z.enum(['test', 'package']),
        name: z.string().trim().min(1),
        id: z.string().optional(),
      })
    )
    .optional(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be formatted as YYYY-MM-DD'),
  timeSlot: z.enum([
    '07:00 AM - 09:00 AM',
    '09:00 AM - 11:00 AM',
    '11:00 AM - 01:00 PM',
    '01:00 PM - 03:00 PM',
    '03:00 PM - 05:00 PM',
    '05:00 PM - 07:00 PM',
  ]).default('07:00 AM - 09:00 AM'),
  collectionType: z.enum(['centre', 'home']).default('centre'),
  address: z.string().max(400).optional(),
  landmark: z.string().max(150).optional(),
  city: z.string().max(100).default('Mandideep'),
  pinCode: z.union([z.string().regex(/^[0-9]{6}$/, 'PIN code must be 6 digits'), z.literal('')]).optional(),
  doctorId: z.string().optional(),
  doctorCode: z.string().optional(),
  offerId: z.string().optional(),
  offerCode: z.string().optional(),
  consent: z.literal(true, {
    errorMap: () => ({ message: 'Patient consent to contact and process appointment request is required.' }),
  }),
})

function generateBookingReference() {
  const todayStr = new Date().toISOString().slice(0, 10).replace(/-/g, '')
  const randomHex = crypto.randomBytes(2).toString('hex').toUpperCase()
  return `UP-${todayStr}-${randomHex}`
}

// POST /api/bookings - Create new appointment / home collection request
bookingRouter.post('/bookings', async (req, res, next) => {
  try {
    const parsed = bookingInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid booking information submitted.',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const data = parsed.data

    // Validate date is today or in future
    const appointmentDate = new Date(`${data.date}T00:00:00`)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    if (Number.isNaN(appointmentDate.getTime()) || appointmentDate < today) {
      return res.status(400).json({ message: 'Appointment date must be today or a future date.' })
    }

    // Home collection requires address in Mandideep area
    if (data.collectionType === 'home' && (!data.address || data.address.trim().length < 5)) {
      return res.status(400).json({
        message: 'Please provide complete street address/locality in Mandideep for home sample collection.',
      })
    }

    // Resolve items and calculate database-enforced price
    const resolvedItems = []
    let totalPaise = 0
    let hasUnverified = false

    // Normalize items
    const requestItems = data.items && data.items.length > 0
      ? data.items
      : data.testName
      ? [{ itemType: 'test', name: data.testName }]
      : data.packageName
      ? [{ itemType: 'package', name: data.packageName }]
      : [{ itemType: 'test', name: 'Complete Blood Count (CBC)' }]

    for (const item of requestItems) {
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
          totalPaise += pkg.pricePaise
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
          totalPaise += test.pricePaise
          if (!test.isVerifiedPrice) hasUnverified = true
        }
      }
    }

    if (resolvedItems.length === 0) {
      return res.status(400).json({
        message: 'No valid tests or packages found. Please select from the available catalogue.',
      })
    }

    // Check if referring doctor was selected or referral code provided
    let doctorDoc = null
    let doctorDiscountPercent = 0
    let discountAmountPaise = 0
    let subtotalPaise = totalPaise
    let finalAmountPaise = totalPaise
    let commissionPaise = 0

    if (data.doctorId || data.doctorCode) {
      const doctorQuery = []
      if (data.doctorId && data.doctorId.length === 24) {
        doctorQuery.push({ _id: data.doctorId })
      }
      if (data.doctorCode && data.doctorCode.trim()) {
        doctorQuery.push({ referralCode: data.doctorCode.trim().toUpperCase() })
      }

      if (doctorQuery.length > 0) {
        doctorDoc = await Doctor.findOne({
          $or: doctorQuery,
          status: 'active',
        })
      }

      if (doctorDoc) {
        doctorDiscountPercent = doctorDoc.discountPercent || 0
        // On main public portal, patient pays standard tariff; discount is private to the doctor's portal
        discountAmountPaise = 0
        finalAmountPaise = subtotalPaise
        commissionPaise = Math.round(subtotalPaise * ((doctorDoc.commissionPercent || 0) / 100))
      }
    }

    // Check if promotional offer or campaign is applied
    let appliedOfferDoc = null
    let offerDiscountPaise = 0

    if (data.offerId || data.offerCode) {
      const offerQuery = []
      if (data.offerId && data.offerId.length === 24) {
        offerQuery.push({ _id: data.offerId })
      }
      if (data.offerCode && data.offerCode.trim()) {
        offerQuery.push({ code: data.offerCode.trim().toUpperCase() })
      }

      if (offerQuery.length > 0) {
        const now = new Date()
        const offer = await Offer.findOne({
          $or: offerQuery,
          isActive: true,
          startDate: { $lte: now },
          endDate: { $gte: now },
        })

        if (offer) {
          // Check minimum order amount if configured
          if (!offer.minOrderAmountPaise || subtotalPaise >= offer.minOrderAmountPaise) {
            appliedOfferDoc = offer
            if (offer.discountType === 'percentage') {
              offerDiscountPaise = Math.round(subtotalPaise * (offer.discountValue / 100))
            } else if (offer.discountType === 'fixed_amount') {
              offerDiscountPaise = Math.min(subtotalPaise, Math.round(offer.discountValue))
            } else if (offer.discountType === 'offer_price') {
              offerDiscountPaise = Math.max(0, subtotalPaise - Math.round(offer.discountValue))
            }

            discountAmountPaise = offerDiscountPaise
            finalAmountPaise = Math.max(0, subtotalPaise - discountAmountPaise)
          }
        }
      }
    }

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
      totalAmountPaise: finalAmountPaise,
      hasUnverifiedPrices: hasUnverified,
      offerId: appliedOfferDoc ? appliedOfferDoc._id : null,
      offerName: appliedOfferDoc ? appliedOfferDoc.name : undefined,
      offerCode: appliedOfferDoc ? appliedOfferDoc.code : undefined,
      appliedCampaign: appliedOfferDoc ? appliedOfferDoc.name : undefined,
      originalPricePaise: subtotalPaise,
      offerDiscountPaise,
      doctorId: doctorDoc ? doctorDoc._id : null,
      doctorName: doctorDoc ? doctorDoc.name : undefined,
      doctorDiscountPercent,
      commissionPaise,
      referredBy: doctorDoc ? 'doctor' : 'self',
      date: data.date,
      timeSlot: data.timeSlot,
      collectionType: data.collectionType,
      address: data.address || '',
      landmark: data.landmark || '',
      city: data.city || 'Mandideep',
      pinCode: data.pinCode || '',
      status: 'requested',
      paymentStatus: 'not_started',
      adminNotes: [
        doctorDoc ? `Referred by ${doctorDoc.name} (${doctorDiscountPercent}% Concession)` : '',
        appliedOfferDoc ? `Campaign Applied: ${appliedOfferDoc.name} (${appliedOfferDoc.code || ''}) - Saved Rs ${Math.round(offerDiscountPaise / 100)}` : '',
      ].filter(Boolean).join(' | '),
      consent: data.consent,
    })

    // If offer applied, update offer usage counter
    if (appliedOfferDoc) {
      appliedOfferDoc.currentUsageCount = (appliedOfferDoc.currentUsageCount || 0) + 1
      await appliedOfferDoc.save()
    }

    // If doctor linked, update doctor's referral counters
    if (doctorDoc) {
      doctorDoc.totalReferredPatients += 1
      doctorDoc.totalTestsReferred += resolvedItems.length
      doctorDoc.totalRevenuePaise += finalAmountPaise
      doctorDoc.totalEarningsPaise += commissionPaise
      await doctorDoc.save()
    }

    await recordAudit({
      action: 'booking_created',
      category: 'booking',
      performedBy: 'patient',
      targetId: String(booking._id),
      targetReference: booking.reference,
      details: {
        collectionType: booking.collectionType,
        itemsCount: resolvedItems.length,
        hasUnverifiedPrices: hasUnverified,
      },
      req,
    })

    res.status(201).json({
      message: 'Booking request registered successfully. Our Mandideep centre team will contact you to confirm the appointment.',
      booking: {
        reference: booking.reference,
        patientName: booking.patientName,
        date: booking.date,
        timeSlot: booking.timeSlot,
        collectionType: booking.collectionType,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        doctorId: booking.doctorId,
        doctorName: booking.doctorName,
        doctorDiscountPercent: booking.doctorDiscountPercent,
        offerId: booking.offerId,
        offerName: booking.offerName,
        offerCode: booking.offerCode,
        appliedCampaign: booking.appliedCampaign,
        originalPricePaise: booking.originalPricePaise,
        offerDiscountPaise: booking.offerDiscountPaise,
        subtotalPaise: booking.subtotalPaise,
        discountAmountPaise: booking.discountAmountPaise,
        totalAmountPaise: booking.totalAmountPaise,
        hasUnverifiedPrices: booking.hasUnverifiedPrices,
        items: booking.items.map((i) => ({ name: i.name, itemType: i.itemType, pricePaise: i.pricePaise })),
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/bookings/track/:reference - Safe public tracking view
bookingRouter.get('/bookings/track/:reference', async (req, res, next) => {
  try {
    const reference = req.params.reference.trim().toUpperCase()
    const booking = await Booking.findOne({ reference }).lean()

    if (!booking) {
      return res.status(404).json({ message: 'No booking record found with this reference ID.' })
    }

    // Safe public projection (no sensitive medical records or full address exposure)
    res.json({
      booking: {
        reference: booking.reference,
        patientInitials: booking.patientName
          .split(' ')
          .map((n) => n[0])
          .join('')
          .toUpperCase(),
        date: booking.date,
        timeSlot: booking.timeSlot,
        collectionType: booking.collectionType,
        status: booking.status,
        paymentStatus: booking.paymentStatus,
        totalAmountPaise: booking.totalAmountPaise,
        hasUnverifiedPrices: booking.hasUnverifiedPrices,
        cancellationReason: booking.cancellationReason,
        items: booking.items.map((i) => ({ name: i.name, itemType: i.itemType })),
        createdAt: booking.createdAt,
      },
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/bookings/:reference/cancel - Patient cancellation with validation
bookingRouter.post('/bookings/:reference/cancel', async (req, res, next) => {
  try {
    const reference = req.params.reference.trim().toUpperCase()
    const { phone, reason } = req.body || {}

    if (!phone || !/^[0-9]{10}$/.test(phone)) {
      return res.status(400).json({ message: 'Please provide the registered 10-digit mobile number for verification.' })
    }

    const booking = await Booking.findOne({ reference })
    if (!booking) {
      return res.status(404).json({ message: 'Booking not found.' })
    }

    if (booking.phone !== phone) {
      return res.status(403).json({ message: 'Phone number does not match this booking record.' })
    }

    if (['sample_collected', 'processing', 'completed'].includes(booking.status)) {
      return res.status(409).json({
        message: 'This booking cannot be cancelled online because sample collection or laboratory processing has already begun. Please contact the centre directly.',
      })
    }

    if (booking.status === 'cancelled') {
      return res.status(400).json({ message: 'This booking is already cancelled.' })
    }

    booking.status = 'cancelled'
    booking.cancellationReason = reason?.trim() || 'Cancelled by patient'
    booking.cancelledAt = new Date()
    await booking.save()

    await recordAudit({
      action: 'booking_cancelled_by_patient',
      category: 'booking',
      performedBy: 'patient',
      targetId: String(booking._id),
      targetReference: booking.reference,
      details: { reason: booking.cancellationReason },
      req,
    })

    res.json({
      message: 'Booking request has been cancelled.',
      reference: booking.reference,
      status: booking.status,
    })
  } catch (err) {
    next(err)
  }
})

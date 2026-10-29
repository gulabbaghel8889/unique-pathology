import express from 'express'
import { z } from 'zod'
import { Offer } from '../models/Offer.js'
import { Booking } from '../models/Booking.js'
import { Test } from '../models/Test.js'
import { Package } from '../models/Package.js'
import { requireAdmin } from '../middleware/auth.js'
import { recordAudit } from '../services/auditService.js'

export const offerRouter = express.Router()

// ==========================================
// PUBLIC OFFER ENDPOINTS
// ==========================================

// GET /api/offers/active - Returns currently running valid campaigns for website
offerRouter.get('/offers/active', async (_req, res, next) => {
  try {
    const now = new Date()
    const activeOffers = await Offer.find({
      isActive: true,
      startDate: { $lte: now },
      endDate: { $gte: now },
    })
      .populate('applicablePackageIds', 'name code pricePaise')
      .populate('applicableTestIds', 'name shortCode pricePaise category')
      .sort({ priority: -1, createdAt: -1 })
      .lean()

    const formatted = activeOffers.map((o) => ({
      ...o,
      computedStatus: 'active',
    }))

    res.json({
      total: formatted.length,
      offers: formatted,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/offers/validate - Validate an offer and compute live discount
offerRouter.post('/offers/validate', async (req, res, next) => {
  try {
    const { offerId, offerCode, subtotalPaise = 0, items = [] } = req.body || {}

    const query = []
    if (offerId && offerId.length === 24) query.push({ _id: offerId })
    if (offerCode && offerCode.trim()) query.push({ code: offerCode.trim().toUpperCase() })

    if (query.length === 0) {
      return res.status(400).json({ message: 'Offer ID or code is required for validation.' })
    }

    const now = new Date()
    const offer = await Offer.findOne({
      $or: query,
      isActive: true,
    })
      .populate('applicablePackageIds', '_id name pricePaise')
      .populate('applicableTestIds', '_id name pricePaise')
      .lean()

    if (!offer) {
      return res.status(404).json({ message: 'Invalid or inactive promotional offer.' })
    }

    if (now < new Date(offer.startDate)) {
      return res.status(400).json({
        message: `This offer is scheduled to start on ${new Date(offer.startDate).toLocaleDateString('en-IN')}.`,
      })
    }

    if (now > new Date(offer.endDate)) {
      return res.status(400).json({ message: 'This campaign offer has expired.' })
    }

    if (offer.maxUsageCount && offer.currentUsageCount >= offer.maxUsageCount) {
      return res.status(400).json({ message: 'This offer has reached its maximum redemption limit.' })
    }

    const subtotal = Number(subtotalPaise) || 0
    if (offer.minOrderAmountPaise && subtotal < offer.minOrderAmountPaise) {
      return res.status(400).json({
        message: `Minimum order amount of ₹${Math.round(offer.minOrderAmountPaise / 100)} required for this offer.`,
      })
    }

    // Check item applicability if restricted
    let isApplicable = true
    if (offer.applicabilityType === 'category' && offer.applicableCategories?.length > 0) {
      // Must match at least one test in that category
      isApplicable = items.some((it) => offer.applicableCategories.includes(it.category))
    } else if (offer.applicabilityType === 'package' && offer.applicablePackageIds?.length > 0) {
      const allowedPkgIds = offer.applicablePackageIds.map((p) => String(p._id || p))
      isApplicable = items.some((it) => it.itemType === 'package' && allowedPkgIds.includes(String(it.id || it.itemId)))
    } else if (offer.applicabilityType === 'test' && offer.applicableTestIds?.length > 0) {
      const allowedTestIds = offer.applicableTestIds.map((t) => String(t._id || t))
      isApplicable = items.some((it) => it.itemType === 'test' && allowedTestIds.includes(String(it.id || it.itemId)))
    }

    if (!isApplicable) {
      return res.status(400).json({
        message: `This offer applies specifically to selected ${offer.applicabilityType}s only.`,
      })
    }

    // Calculate discount
    let discountPaise = 0
    if (offer.discountType === 'percentage') {
      discountPaise = Math.round(subtotal * (offer.discountValue / 100))
    } else if (offer.discountType === 'fixed_amount') {
      discountPaise = Math.min(subtotal, Math.round(offer.discountValue))
    } else if (offer.discountType === 'offer_price') {
      // Special fixed offer price: discount is difference between regular subtotal and offer price
      discountPaise = Math.max(0, subtotal - Math.round(offer.discountValue))
    }

    const finalPricePaise = Math.max(0, subtotal - discountPaise)

    res.json({
      valid: true,
      offer: {
        id: String(offer._id),
        name: offer.name,
        title: offer.title,
        code: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
        subtotalPaise: subtotal,
        discountPaise,
        finalPricePaise,
      },
    })
  } catch (err) {
    next(err)
  }
})

// ==========================================
// ADMIN OFFER MANAGEMENT ENDPOINTS
// ==========================================

const offerInputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  title: z.string().trim().min(2).max(200),
  description: z.string().trim().min(5).max(1000),
  code: z.string().trim().max(30).optional(),
  offerType: z.enum(['festival', 'seasonal', 'health_camp', 'special_package', 'senior_citizen', 'general']).default('festival'),
  badgeText: z.string().trim().max(60).default('Special Campaign Offer'),
  bannerGradient: z.string().trim().default('from-amber-500 via-rose-500 to-red-600'),
  bannerUrl: z.string().trim().optional(),
  applicabilityType: z.enum(['all', 'category', 'package', 'test']).default('all'),
  applicableCategories: z.array(z.string().trim()).optional().default([]),
  applicablePackageIds: z.array(z.string()).optional().default([]),
  applicableTestIds: z.array(z.string()).optional().default([]),
  discountType: z.enum(['percentage', 'fixed_amount', 'offer_price']).default('percentage'),
  discountValue: z.coerce.number().min(0),
  minOrderAmountPaise: z.coerce.number().min(0).default(0),
  startDate: z.string().or(z.date()),
  endDate: z.string().or(z.date()),
  isActive: z.boolean().default(true),
  priority: z.coerce.number().min(1).max(100).default(1),
  maxUsageCount: z.coerce.number().nullable().optional(),
  terms: z.array(z.string().trim()).optional().default([]),
})

// GET /api/admin/offers - List all offers with performance metrics
adminRouterOffersList:
offerRouter.get('/admin/offers', requireAdmin, async (req, res, next) => {
  try {
    const { status, offerType, search } = req.query
    const query = {}

    if (offerType && offerType !== 'all') {
      query.offerType = offerType
    }

    if (search && typeof search === 'string' && search.trim()) {
      const term = search.trim()
      const regex = new RegExp(term, 'i')
      query.$or = [{ name: regex }, { title: regex }, { code: regex }, { description: regex }]
    }

    const offers = await Offer.find(query)
      .populate('applicablePackageIds', 'name code pricePaise')
      .populate('applicableTestIds', 'name shortCode pricePaise')
      .sort({ priority: -1, createdAt: -1 })
      .lean()

    const now = new Date()

    // Attach performance metrics and computed status to each offer
    const enrichedOffers = await Promise.all(
      offers.map(async (o) => {
        let computedStatus = 'active'
        if (!o.isActive) {
          computedStatus = 'inactive'
        } else if (o.startDate && now < new Date(o.startDate)) {
          computedStatus = 'scheduled'
        } else if (o.endDate && now > new Date(o.endDate)) {
          computedStatus = 'expired'
        }

        // Fetch bookings associated with this offer
        const bookings = await Booking.find({ offerId: o._id })
          .select('totalAmountPaise subtotalPaise discountAmountPaise paymentStatus patientName phone createdAt')
          .lean()

        const totalBookings = bookings.length
        const totalRevenuePaise = bookings.reduce((sum, b) => sum + (b.totalAmountPaise || 0), 0)
        const totalDiscountGivenPaise = bookings.reduce((sum, b) => sum + (b.discountAmountPaise || 0), 0)

        return {
          ...o,
          computedStatus,
          totalBookings,
          totalRevenuePaise,
          totalDiscountGivenPaise,
        }
      })
    )

    // Filter by computed status if requested
    const filtered = (status && status !== 'all')
      ? enrichedOffers.filter((o) => o.computedStatus === status)
      : enrichedOffers

    res.json({
      total: filtered.length,
      offers: filtered,
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/offers/analytics - Overall Offer & Campaign Analytics
offerRouter.get('/admin/offers/analytics', requireAdmin, async (_req, res, next) => {
  try {
    const now = new Date()
    const allOffers = await Offer.find({}).lean()
    const allBookings = await Booking.find({ offerId: { $ne: null } })
      .select('offerId offerName totalAmountPaise discountAmountPaise createdAt phone')
      .lean()

    let totalActiveOffers = 0
    let totalScheduledOffers = 0
    let totalExpiredOffers = 0
    let totalInactiveOffers = 0

    allOffers.forEach((o) => {
      if (!o.isActive) {
        totalInactiveOffers++
      } else if (o.startDate && now < new Date(o.startDate)) {
        totalScheduledOffers++
      } else if (o.endDate && now > new Date(o.endDate)) {
        totalExpiredOffers++
      } else {
        totalActiveOffers++
      }
    })

    const totalOfferBookings = allBookings.length
    const totalOfferRevenuePaise = allBookings.reduce((sum, b) => sum + (b.totalAmountPaise || 0), 0)
    const totalOfferDiscountGivenPaise = allBookings.reduce((sum, b) => sum + (b.discountAmountPaise || 0), 0)
    const uniqueOfferPatients = new Set(allBookings.map((b) => b.phone)).size

    // Determine most successful offer by volume
    const offerCounts = {}
    allBookings.forEach((b) => {
      const id = String(b.offerId)
      if (!offerCounts[id]) {
        offerCounts[id] = { id, name: b.offerName || 'Offer', bookings: 0, revenuePaise: 0 }
      }
      offerCounts[id].bookings++
      offerCounts[id].revenuePaise += (b.totalAmountPaise || 0)
    })

    const sortedOffersByVolume = Object.values(offerCounts).sort((a, b) => b.bookings - a.bookings)
    const mostSuccessfulOffer = sortedOffersByVolume[0] || null

    res.json({
      metrics: {
        totalOffers: allOffers.length,
        totalActiveOffers,
        totalScheduledOffers,
        totalExpiredOffers,
        totalInactiveOffers,
        totalOfferBookings,
        totalOfferRevenuePaise,
        totalOfferDiscountGivenPaise,
        uniqueOfferPatients,
        mostSuccessfulOffer,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/admin/offers/:id - Single offer details with performance
offerRouter.get('/admin/offers/:id', requireAdmin, async (req, res, next) => {
  try {
    const offer = await Offer.findById(req.params.id)
      .populate('applicablePackageIds')
      .populate('applicableTestIds')
      .lean()

    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' })
    }

    const recentBookings = await Booking.find({ offerId: offer._id })
      .sort({ createdAt: -1 })
      .limit(20)
      .lean()

    res.json({
      offer,
      recentBookings,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/offers - Create new offer
offerRouter.post('/admin/offers', requireAdmin, async (req, res, next) => {
  try {
    const parsed = offerInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid offer parameters submitted.',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const data = parsed.data

    if (new Date(data.startDate) >= new Date(data.endDate)) {
      return res.status(400).json({ message: 'Offer end date must be after the start date.' })
    }

    if (data.code) {
      const existing = await Offer.findOne({ code: data.code.toUpperCase() })
      if (existing) {
        return res.status(400).json({ message: `Offer promo code '${data.code}' already exists.` })
      }
    }

    const offer = await Offer.create({
      ...data,
      code: data.code ? data.code.toUpperCase() : undefined,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    })

    await recordAudit({
      action: 'offer_created',
      category: 'marketing',
      performedBy: req.admin.email,
      targetId: String(offer._id),
      details: {
        name: offer.name,
        code: offer.code,
        discountType: offer.discountType,
        discountValue: offer.discountValue,
      },
      req,
    })

    res.status(201).json({
      message: `Offer campaign "${offer.name}" created successfully.`,
      offer,
    })
  } catch (err) {
    next(err)
  }
})

// PUT /api/admin/offers/:id - Edit existing offer
offerRouter.put('/admin/offers/:id', requireAdmin, async (req, res, next) => {
  try {
    const parsed = offerInputSchema.safeParse(req.body)
    if (!parsed.success) {
      return res.status(400).json({
        message: 'Invalid offer parameters.',
        errors: parsed.error.flatten().fieldErrors,
      })
    }

    const data = parsed.data
    const offer = await Offer.findById(req.params.id)
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' })
    }

    if (new Date(data.startDate) >= new Date(data.endDate)) {
      return res.status(400).json({ message: 'Offer end date must be after start date.' })
    }

    if (data.code) {
      const codeUpper = data.code.toUpperCase()
      const duplicate = await Offer.findOne({ code: codeUpper, _id: { $ne: offer._id } })
      if (duplicate) {
        return res.status(400).json({ message: `Promo code '${codeUpper}' is already in use by another campaign.` })
      }
      data.code = codeUpper
    }

    Object.assign(offer, {
      ...data,
      startDate: new Date(data.startDate),
      endDate: new Date(data.endDate),
    })

    await offer.save()

    await recordAudit({
      action: 'offer_updated',
      category: 'marketing',
      performedBy: req.admin.email,
      targetId: String(offer._id),
      details: { name: offer.name, discountType: offer.discountType, discountValue: offer.discountValue },
      req,
    })

    res.json({
      message: `Campaign "${offer.name}" updated successfully.`,
      offer,
    })
  } catch (err) {
    next(err)
  }
})

// PATCH /api/admin/offers/:id/status - Quick Toggle Active/Inactive
offerRouter.patch('/admin/offers/:id/status', requireAdmin, async (req, res, next) => {
  try {
    const { isActive } = req.body || {}
    const offer = await Offer.findById(req.params.id)
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' })
    }

    const newActive = typeof isActive === 'boolean' ? isActive : !offer.isActive
    offer.isActive = newActive
    await offer.save()

    await recordAudit({
      action: 'offer_status_toggled',
      category: 'marketing',
      performedBy: req.admin.email,
      targetId: String(offer._id),
      details: { name: offer.name, isActive: offer.isActive },
      req,
    })

    res.json({
      message: `Offer "${offer.name}" is now ${offer.isActive ? 'Active' : 'Deactivated'}.`,
      offer,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/admin/offers/:id/duplicate - Duplicate an existing offer
offerRouter.post('/admin/offers/:id/duplicate', requireAdmin, async (req, res, next) => {
  try {
    const source = await Offer.findById(req.params.id).lean()
    if (!source) {
      return res.status(404).json({ message: 'Source offer not found to duplicate.' })
    }

    delete source._id
    delete source.createdAt
    delete source.updatedAt
    delete source.__v

    const randomSuffix = Math.floor(100 + Math.random() * 900)
    source.name = `${source.name} (Copy)`
    source.title = `${source.title} (Copy)`
    source.code = source.code ? `${source.code}_CP${randomSuffix}` : undefined
    source.isActive = false // Keep copy draft / inactive initially for admin review
    source.currentUsageCount = 0

    const duplicatedOffer = await Offer.create(source)

    await recordAudit({
      action: 'offer_duplicated',
      category: 'marketing',
      performedBy: req.admin.email,
      targetId: String(duplicatedOffer._id),
      details: { sourceName: source.name, newName: duplicatedOffer.name },
      req,
    })

    res.status(201).json({
      message: `Offer duplicated as "${duplicatedOffer.name}". Review and activate when ready.`,
      offer: duplicatedOffer,
    })
  } catch (err) {
    next(err)
  }
})

// DELETE /api/admin/offers/:id - Delete an offer
offerRouter.delete('/admin/offers/:id', requireAdmin, async (req, res, next) => {
  try {
    const offer = await Offer.findByIdAndDelete(req.params.id)
    if (!offer) {
      return res.status(404).json({ message: 'Offer not found.' })
    }

    await recordAudit({
      action: 'offer_deleted',
      category: 'marketing',
      performedBy: req.admin.email,
      targetId: String(offer._id),
      details: { name: offer.name },
      req,
    })

    res.json({
      message: `Campaign offer "${offer.name}" deleted.`,
    })
  } catch (err) {
    next(err)
  }
})

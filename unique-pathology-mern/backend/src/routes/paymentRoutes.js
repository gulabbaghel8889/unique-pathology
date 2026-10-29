import express from 'express'
import { Booking } from '../models/Booking.js'
import {
  createPaymentOrderForBooking,
  verifyPaymentSignature,
  verifyWebhookSignature,
} from '../services/paymentService.js'
import { recordAudit } from '../services/auditService.js'

export const paymentRouter = express.Router()

// POST /api/payments/create-order - Create Razorpay order using database-verified amount
paymentRouter.post('/payments/create-order', async (req, res, next) => {
  try {
    const { bookingReference, phone } = req.body || {}

    if (!bookingReference || !phone) {
      return res.status(400).json({ message: 'Booking reference and registered phone number are required.' })
    }

    const booking = await Booking.findOne({ reference: bookingReference.trim().toUpperCase(), phone: phone.trim() })
    if (!booking) {
      return res.status(404).json({ message: 'No matching booking found for this reference and phone number.' })
    }

    if (booking.hasUnverifiedPrices) {
      return res.status(400).json({
        message: 'This booking contains demo/indicative prices. Online payment is locked until the centre verifies test availability and prices.',
      })
    }

    const orderData = await createPaymentOrderForBooking(booking._id)

    await recordAudit({
      action: 'payment_order_created',
      category: 'payment',
      performedBy: 'patient',
      targetId: String(booking._id),
      targetReference: booking.reference,
      details: { orderId: orderData.orderId, amountPaise: orderData.amountPaise },
      req,
    })

    res.status(201).json({
      message: 'Payment order created.',
      ...orderData,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/payments/verify-payment - Verify signature server-side
paymentRouter.post('/payments/verify-payment', async (req, res, next) => {
  try {
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body || {}

    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({ message: 'All Razorpay payment verification parameters are required.' })
    }

    const result = await verifyPaymentSignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    })

    await recordAudit({
      action: 'payment_signature_verified',
      category: 'payment',
      performedBy: 'patient',
      targetReference: result.bookingReference,
      details: { razorpayOrderId, razorpayPaymentId },
      req,
    })

    res.json({
      verified: true,
      message: 'Payment successfully verified and reconciled.',
      bookingReference: result.bookingReference,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/payments/webhook - Idempotent Razorpay Webhook receiver
paymentRouter.post('/payments/webhook', express.raw({ type: 'application/json' }), async (req, res, next) => {
  try {
    const signature = req.headers['x-razorpay-signature']
    const rawBody = req.body?.toString() || ''

    if (!verifyWebhookSignature(rawBody, signature)) {
      return res.status(400).json({ message: 'Invalid webhook signature.' })
    }

    const payload = JSON.parse(rawBody)
    const event = payload.event
    const paymentEntity = payload.payload?.payment?.entity

    if (event === 'payment.captured' && paymentEntity) {
      const orderId = paymentEntity.order_id
      const booking = await Booking.findOne({ razorpayOrderId: orderId })
      if (booking && booking.paymentStatus !== 'paid') {
        booking.paymentStatus = 'paid'
        booking.paidAt = new Date()
        booking.razorpayPaymentId = paymentEntity.id
        await booking.save()

        await recordAudit({
          action: 'payment_captured_webhook',
          category: 'payment',
          performedBy: 'system',
          targetId: String(booking._id),
          targetReference: booking.reference,
          details: { orderId, paymentId: paymentEntity.id },
          req,
        })
      }
    }

    res.json({ status: 'ok' })
  } catch (err) {
    next(err)
  }
})

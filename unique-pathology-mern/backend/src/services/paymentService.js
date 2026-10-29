import crypto from 'node:crypto'
import Razorpay from 'razorpay'
import { config } from '../config/index.js'
import { Booking } from '../models/Booking.js'
import { Payment } from '../models/Payment.js'

let razorpayClient = null
if (config.razorpay.isConfigured) {
  razorpayClient = new Razorpay({
    key_id: config.razorpay.keyId,
    key_secret: config.razorpay.keySecret,
  })
}

/**
 * Creates a Razorpay Order strictly using database-verified amounts
 */
export async function createPaymentOrderForBooking(bookingId) {
  const booking = await Booking.findById(bookingId)
  if (!booking) {
    throw new Error('Booking record not found.')
  }

  if (booking.paymentStatus === 'paid') {
    throw new Error('This booking is already marked as paid.')
  }

  if (booking.hasUnverifiedPrices) {
    throw new Error('This booking includes tests with unverified indicative pricing. Price must be confirmed by the lab before online payment.')
  }

  if (!Number.isInteger(booking.totalAmountPaise) || booking.totalAmountPaise <= 0) {
    throw new Error('A valid total amount in paise is required for payment.')
  }

  if (!config.razorpay.isConfigured || !razorpayClient) {
    throw new Error('Razorpay payment gateway is not configured. Please contact the centre for in-person or UPI payment at the desk.')
  }

  const options = {
    amount: booking.totalAmountPaise,
    currency: 'INR',
    receipt: booking.reference,
    notes: {
      bookingReference: booking.reference,
      patientName: booking.patientName,
      patientPhone: booking.phone,
    },
  }

  const order = await razorpayClient.orders.create(options)

  const payment = await Payment.create({
    bookingId: booking._id,
    bookingReference: booking.reference,
    razorpayOrderId: order.id,
    amountPaise: booking.totalAmountPaise,
    currency: 'INR',
    status: 'created',
  })

  booking.paymentStatus = 'pending'
  booking.razorpayOrderId = order.id
  await booking.save()

  return {
    orderId: order.id,
    amountPaise: order.amount,
    currency: order.currency,
    keyId: config.razorpay.keyId,
    bookingReference: booking.reference,
  }
}

/**
 * Verifies Razorpay HMAC-SHA256 signature server-side using timing-safe comparison
 */
export async function verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature }) {
  if (!config.razorpay.keySecret) {
    throw new Error('Payment gateway secret is not configured.')
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.keySecret)
    .update(`${razorpayOrderId}|${razorpayPaymentId}`)
    .digest('hex')

  const expectedBuf = Buffer.from(expectedSignature)
  const receivedBuf = Buffer.from(razorpaySignature)

  if (expectedBuf.length !== receivedBuf.length || !crypto.timingSafeEqual(expectedBuf, receivedBuf)) {
    throw new Error('Payment signature mismatch. Tampering detected.')
  }

  // Update payment record idempotently
  const payment = await Payment.findOne({ razorpayOrderId })
  if (!payment) {
    throw new Error('Payment order not found.')
  }

  payment.razorpayPaymentId = razorpayPaymentId
  payment.razorpaySignature = razorpaySignature
  payment.status = 'paid'
  payment.verifiedAt = new Date()
  await payment.save()

  // Update booking record
  const booking = await Booking.findById(payment.bookingId)
  if (booking) {
    booking.paymentStatus = 'paid'
    booking.razorpayPaymentId = razorpayPaymentId
    booking.paidAt = new Date()
    if (booking.status === 'requested') {
      booking.status = 'confirmed'
    }
    await booking.save()
  }

  return { verified: true, paymentId: payment._id, bookingReference: booking?.reference }
}

/**
 * Verifies Razorpay Webhook signature
 */
export function verifyWebhookSignature(rawBody, signature) {
  if (!config.razorpay.webhookSecret) {
    return false
  }

  const expectedSignature = crypto
    .createHmac('sha256', config.razorpay.webhookSecret)
    .update(rawBody)
    .digest('hex')

  const expectedBuf = Buffer.from(expectedSignature)
  const receivedBuf = Buffer.from(signature || '')

  if (expectedBuf.length !== receivedBuf.length) return false
  return crypto.timingSafeEqual(expectedBuf, receivedBuf)
}

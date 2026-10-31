import { Booking } from '../models/Booking.js'
import { Payment } from '../models/Payment.js'
import { recordAudit } from './auditService.js'

export async function syncPaidBookingsMigration(req = null) {
  const paidBookings = await Booking.find({ paymentStatus: 'paid' })
  let createdCount = 0
  let updatedCount = 0
  let skippedCount = 0

  for (const booking of paidBookings) {
    const existingPayment = await Payment.findOne({ bookingId: booking._id })

    const testOrPackageName =
      booking.items && booking.items.length > 0
        ? booking.items.map((i) => i.name).join(', ')
        : 'Diagnostic Test'

    const originalAmount =
      (booking.originalPricePaise || booking.subtotalPaise || booking.totalAmountPaise || 0) / 100
    const discountAmount =
      (booking.discountAmountPaise || booking.offerDiscountPaise || 0) / 100
    const finalAmount = (booking.totalAmountPaise || 0) / 100
    const paymentDate = booking.paidAt || booking.updatedAt || booking.createdAt || new Date()

    if (!existingPayment) {
      const newPayment = await Payment.create({
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
        paymentMethod: 'Cash',
        status: 'paid',
        paymentDate,
        reconciled: true,
        reconciledAt: new Date(),
        reconciledBy: 'migration_system',
        notes: 'Automated migration of existing paid booking',
      })

      await recordAudit({
        action: `Payment migration: Record created for Booking ID ${booking.reference}`,
        category: 'payment',
        performedBy: req?.admin?.email || 'migration_system',
        targetId: String(newPayment._id),
        targetReference: booking.reference,
        details: {
          bookingId: String(booking._id),
          finalAmount,
          paymentMethod: 'Cash',
          patientName: booking.patientName,
        },
        req,
      })

      createdCount++
    } else {
      let needsSave = false
      if (!existingPayment.patientName) {
        existingPayment.patientName = booking.patientName
        needsSave = true
      }
      if (!existingPayment.mobileNumber) {
        existingPayment.mobileNumber = booking.phone
        needsSave = true
      }
      if (!existingPayment.testOrPackageName) {
        existingPayment.testOrPackageName = testOrPackageName
        needsSave = true
      }
      if (existingPayment.finalAmount === undefined || existingPayment.finalAmount === null) {
        existingPayment.finalAmount = finalAmount
        needsSave = true
      }
      if (!existingPayment.paymentDate) {
        existingPayment.paymentDate = paymentDate
        needsSave = true
      }
      if (existingPayment.status !== 'paid') {
        existingPayment.status = 'paid'
        needsSave = true
      }

      if (needsSave) {
        await existingPayment.save()
        updatedCount++
      } else {
        skippedCount++
      }
    }
  }

  const totalPaymentsCount = await Payment.countDocuments()

  return {
    scannedBookings: paidBookings.length,
    createdPayments: createdCount,
    updatedPayments: updatedCount,
    skippedPayments: skippedCount,
    totalPaymentsCount,
  }
}

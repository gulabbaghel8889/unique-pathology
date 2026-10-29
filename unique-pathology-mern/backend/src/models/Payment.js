import mongoose from 'mongoose'

const paymentSchema = new mongoose.Schema(
  {
    bookingId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Booking',
      required: true,
      index: true,
    },
    bookingReference: {
      type: String,
      required: true,
      index: true,
    },
    razorpayOrderId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    razorpayPaymentId: {
      type: String,
      sparse: true,
      index: true,
    },
    razorpaySignature: {
      type: String,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: 1,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    status: {
      type: String,
      enum: ['created', 'paid', 'failed', 'refunded'],
      default: 'created',
      index: true,
    },
    paymentMethod: { type: String, trim: true },
    cardOrVpa: { type: String, trim: true },
    verifiedAt: { type: Date },
    webhookEvents: [
      {
        eventId: { type: String },
        eventType: { type: String },
        receivedAt: { type: Date, default: Date.now },
        payloadSummary: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    reconciled: { type: Boolean, default: false },
    reconciledAt: { type: Date },
    reconciledBy: { type: String },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema)

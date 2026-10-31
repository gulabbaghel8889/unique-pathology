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
    patientName: {
      type: String,
      trim: true,
    },
    mobileNumber: {
      type: String,
      trim: true,
    },
    testOrPackageName: {
      type: String,
      trim: true,
    },
    originalAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmount: {
      type: Number,
      default: 0,
      min: 0,
    },
    finalAmount: {
      type: Number,
      required: true,
      min: 0,
    },
    amountPaise: {
      type: Number,
      min: 0,
    },
    currency: {
      type: String,
      default: 'INR',
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Razorpay', 'cash', 'upi', 'card', 'bank_transfer', 'razorpay'],
      default: 'Cash',
      trim: true,
    },
    status: {
      type: String,
      enum: ['created', 'pending', 'paid', 'failed', 'refunded'],
      default: 'paid',
      index: true,
    },
    paymentDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    cardOrVpa: { type: String, trim: true },
    razorpayOrderId: {
      type: String,
      sparse: true,
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
    verifiedAt: { type: Date },
    webhookEvents: [
      {
        eventId: { type: String },
        eventType: { type: String },
        receivedAt: { type: Date, default: Date.now },
        payloadSummary: { type: mongoose.Schema.Types.Mixed },
      },
    ],
    reconciled: { type: Boolean, default: true },
    reconciledAt: { type: Date },
    reconciledBy: { type: String },
    notes: { type: String, trim: true },
  },
  { timestamps: true }
)

export const Payment = mongoose.models.Payment || mongoose.model('Payment', paymentSchema)

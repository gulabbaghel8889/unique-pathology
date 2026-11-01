import mongoose from 'mongoose'

const financialLedgerSchema = new mongoose.Schema(
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
      uppercase: true,
      trim: true,
    },
    doctorId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Doctor',
      index: true,
      default: null,
    },
    doctorName: {
      type: String,
      trim: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    patientPhone: {
      type: String,
      trim: true,
    },
    entryType: {
      type: String,
      required: true,
      enum: ['PATIENT_PAYMENT', 'PATIENT_REFUND', 'FINANCIAL_ADJUSTMENT', 'AUTHORIZED_SERVICE_PAYMENT'],
      index: true,
    },
    amountPaise: {
      type: Number,
      required: true,
      min: [0, 'Amount cannot be negative.'],
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Card', 'Bank Transfer', 'Razorpay', 'Adjustment', 'Other'],
      default: 'Cash',
      trim: true,
    },
    transactionReference: {
      type: String,
      trim: true,
    },
    originalMrpPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    discountAmountPaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    patientPayablePaise: {
      type: Number,
      default: 0,
      min: 0,
    },
    recordedBy: {
      type: String,
      required: true,
      default: 'system',
      trim: true,
    },
    justification: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
    notes: {
      type: String,
      trim: true,
      maxlength: 1000,
    },
  },
  { timestamps: true }
)

financialLedgerSchema.index({ createdAt: -1 })
financialLedgerSchema.index({ doctorId: 1, createdAt: -1 })
financialLedgerSchema.index({ entryType: 1, createdAt: -1 })

export const FinancialLedger =
  mongoose.models.FinancialLedger || mongoose.model('FinancialLedger', financialLedgerSchema)

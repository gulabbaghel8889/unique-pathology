import mongoose from 'mongoose'

const otpSessionSchema = new mongoose.Schema(
  {
    bookingReference: {
      type: String,
      required: true,
      index: true,
      uppercase: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    otpHash: {
      type: String,
      required: true,
    },
    expiresAt: {
      type: Date,
      required: true,
      index: { expires: 0 }, // MongoDB TTL index to auto-cleanup expired sessions
    },
    attempts: {
      type: Number,
      default: 0,
      max: 5,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
    ip: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

export const OtpSession = mongoose.models.OtpSession || mongoose.model('OtpSession', otpSessionSchema)

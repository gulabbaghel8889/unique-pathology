import mongoose from 'mongoose'

const downloadLogSchema = new mongoose.Schema(
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
      required: true,
      trim: true,
    },
    downloadDate: {
      type: String,
      required: true,
      index: true,
    },
    downloadTime: {
      type: String,
      required: true,
    },
    downloadedBy: {
      type: String,
      required: true,
      trim: true,
    },
    userType: {
      type: String,
      enum: ['Patient', 'Admin', 'patient', 'admin'],
      required: true,
      index: true,
    },
    reportId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Report',
    },
    ip: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
)

export const DownloadLog = mongoose.models.DownloadLog || mongoose.model('DownloadLog', downloadLogSchema)

import mongoose from 'mongoose'

const reportAuditSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      enum: ['uploaded', 'otp_requested', 'otp_verified', 'token_issued', 'downloaded', 'admin_viewed', 'deleted'],
      required: true,
    },
    performedBy: { type: String, default: 'patient' }, // 'patient' | 'admin' | 'system'
    ip: { type: String, trim: true },
    userAgent: { type: String, trim: true },
    details: { type: String, trim: true },
    timestamp: { type: Date, default: Date.now },
  },
  { _id: true }
)

const reportSchema = new mongoose.Schema(
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
    patientPhone: {
      type: String,
      required: true,
      index: true,
      trim: true,
    },
    patientName: {
      type: String,
      required: true,
      trim: true,
    },
    reportTitle: {
      type: String,
      required: true,
      trim: true,
      default: 'Diagnostic Test Report',
    },
    testNames: [{ type: String, trim: true }],
    // Private storage reference - NEVER served statically or via public URL
    fileName: { type: String, required: true }, // original filename uploaded by lab
    storageKey: { type: String, required: true, unique: true }, // UUID or random hash on disk in private storage
    mimeType: {
      type: String,
      required: true,
      enum: ['application/pdf', 'image/jpeg', 'image/png'],
      default: 'application/pdf',
    },
    fileSizeBytes: { type: Number, required: true },
    checksumSha256: { type: String }, // integrity check
    status: {
      type: String,
      enum: ['draft', 'verified_by_pathologist', 'released'],
      default: 'released',
    },
    uploadedBy: { type: String, required: true }, // admin email
    verifiedByPathologistName: {
      type: String,
      trim: true,
      default: '[Verified by Duty Clinical Pathologist - Verification On File]',
    },
    activeDownloadToken: {
      token: { type: String, sparse: true, index: true },
      expiresAt: { type: Date },
      issuedToIp: { type: String },
    },
    auditLogs: [reportAuditSchema],
  },
  { timestamps: true }
)

export const Report = mongoose.models.Report || mongoose.model('Report', reportSchema)

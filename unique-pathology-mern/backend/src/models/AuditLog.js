import mongoose from 'mongoose'

const auditLogSchema = new mongoose.Schema(
  {
    action: {
      type: String,
      required: true,
      index: true,
    },
    category: {
      type: String,
      enum: ['auth', 'booking', 'test_catalogue', 'package', 'report', 'payment', 'doctor', 'system'],
      default: 'system',
      index: true,
    },
    performedBy: {
      type: String,
      required: true,
      default: 'system',
    },
    targetId: { type: String },
    targetReference: { type: String },
    details: { type: mongoose.Schema.Types.Mixed },
    ip: { type: String },
    userAgent: { type: String },
  },
  { timestamps: { createdAt: true, updatedAt: false } }
)

export const AuditLog = mongoose.models.AuditLog || mongoose.model('AuditLog', auditLogSchema)

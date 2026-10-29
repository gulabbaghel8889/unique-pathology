import { AuditLog } from '../models/AuditLog.js'

export async function recordAudit({
  action,
  category = 'system',
  performedBy = 'system',
  targetId,
  targetReference,
  details = {},
  req,
}) {
  try {
    const ip = req?.headers['x-forwarded-for'] || req?.socket?.remoteAddress || '127.0.0.1'
    const userAgent = req?.headers['user-agent'] || 'unknown'

    // Strip sensitive fields from details before logging
    const sanitizedDetails = { ...details }
    delete sanitizedDetails.password
    delete sanitizedDetails.token
    delete sanitizedDetails.otpCode

    await AuditLog.create({
      action,
      category,
      performedBy,
      targetId,
      targetReference,
      details: sanitizedDetails,
      ip: String(ip).split(',')[0].trim(),
      userAgent: String(userAgent).slice(0, 250),
    })
  } catch (err) {
    // Non-blocking: audit failure should not crash main request, but should log
    console.error('Audit logging failed:', err.message)
  }
}

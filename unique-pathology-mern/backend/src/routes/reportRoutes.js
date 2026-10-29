import express from 'express'
import { Report } from '../models/Report.js'
import { otpLimiter } from '../middleware/rateLimiter.js'
import { createOtpForPatient, verifyPatientOtp } from '../services/otpService.js'
import {
  generateDownloadToken,
  reportFileExists,
  getReportStream,
} from '../services/storageService.js'
import { recordAudit } from '../services/auditService.js'

export const reportRouter = express.Router()

// POST /api/reports/request-otp - Request patient report download code
reportRouter.post('/reports/request-otp', otpLimiter, async (req, res, next) => {
  try {
    const { bookingReference, phone } = req.body || {}

    if (!bookingReference || !phone) {
      return res.status(400).json({ message: 'Booking reference and registered mobile number are required.' })
    }

    const ref = bookingReference.trim().toUpperCase()
    const cleanPhone = phone.trim()

    if (!/^[0-9]{10}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please enter a valid 10-digit mobile number.' })
    }

    // Verify report exists and is released
    const report = await Report.findOne({
      bookingReference: ref,
      patientPhone: cleanPhone,
      status: 'released',
    })

    if (!report) {
      return res.status(404).json({
        message: 'No released diagnostic report found matching this reference and mobile number. Reports are typically ready within the indicated test turnaround time.',
      })
    }

    const clientIp = req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1'
    const otpResult = await createOtpForPatient({
      bookingReference: ref,
      phone: cleanPhone,
      ip: String(clientIp).split(',')[0],
    })

    // Record audit on report document
    report.auditLogs.push({
      action: 'otp_requested',
      performedBy: 'patient',
      ip: String(clientIp).split(',')[0],
      userAgent: req.headers['user-agent'] || '',
      details: 'Patient requested OTP verification for report access',
    })
    await report.save()

    const maskedPhone = `+91 ******${cleanPhone.slice(-4)}`
    res.json({
      message: otpResult.smsDelivered
        ? `Verification code delivered via real SMS to ${maskedPhone}.`
        : `Verification code generated and dispatched for ${maskedPhone}.`,
      smsDelivered: Boolean(otpResult.smsDelivered),
      smsMessage: otpResult.smsMessage,
      maskedPhone,
      expiresAt: otpResult.expiresAt,
      // In development / testing sandbox mode:
      sandboxCode: otpResult.sandboxCode,
      instructions: otpResult.sandboxCode
        ? `SMS OTP dispatched for ${maskedPhone}. (Dev sandbox code: ${otpResult.sandboxCode})`
        : `Please enter the 6-digit verification code sent via SMS to ${maskedPhone}.`,
    })
  } catch (err) {
    next(err)
  }
})

// POST /api/reports/verify-otp - Verify code & issue short-lived download token
reportRouter.post('/reports/verify-otp', otpLimiter, async (req, res, next) => {
  try {
    const { bookingReference, phone, code } = req.body || {}

    if (!bookingReference || !phone || !code) {
      return res.status(400).json({ message: 'Booking reference, phone number, and 6-digit code are required.' })
    }

    const ref = bookingReference.trim().toUpperCase()
    const cleanPhone = phone.trim()

    const report = await Report.findOne({
      bookingReference: ref,
      patientPhone: cleanPhone,
      status: 'released',
    })

    if (!report) {
      return res.status(404).json({ message: 'No released report record found.' })
    }

    const verification = await verifyPatientOtp({
      bookingReference: ref,
      phone: cleanPhone,
      code: String(code).trim(),
    })

    if (!verification.success) {
      return res.status(400).json({ message: verification.reason })
    }

    // Generate short-lived download token
    const clientIp = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0]
    const { token, expiresAt } = generateDownloadToken()

    report.activeDownloadToken = {
      token,
      expiresAt,
      issuedToIp: clientIp,
    }

    report.auditLogs.push({
      action: 'token_issued',
      performedBy: 'patient',
      ip: clientIp,
      userAgent: req.headers['user-agent'] || '',
      details: 'OTP verified successfully; short-lived download token issued',
    })
    await report.save()

    await recordAudit({
      action: 'report_token_issued',
      category: 'report',
      performedBy: 'patient',
      targetId: String(report._id),
      targetReference: report.bookingReference,
      req,
    })

    res.json({
      message: 'Verification successful. Your report is ready to download.',
      downloadToken: token,
      expiresAt,
      reportInfo: {
        reportTitle: report.reportTitle,
        patientName: report.patientName,
        bookingReference: report.bookingReference,
        testNames: report.testNames,
        fileSizeBytes: report.fileSizeBytes,
        mimeType: report.mimeType,
        verifiedBy: report.verifiedByPathologistName,
      },
    })
  } catch (err) {
    next(err)
  }
})

// GET /api/reports/download/:token - Secure stream download with expiration & audit
reportRouter.get('/reports/download/:token', async (req, res, next) => {
  try {
    const { token } = req.params
    if (!token) {
      return res.status(400).json({ message: 'Download token is required.' })
    }

    const report = await Report.findOne({
      'activeDownloadToken.token': token,
    })

    if (!report) {
      return res.status(404).json({
        message: 'Invalid or expired download link. Please request report access via verification code again.',
      })
    }

    if (!report.activeDownloadToken.expiresAt || new Date() > report.activeDownloadToken.expiresAt) {
      return res.status(410).json({
        message: 'This download link has expired for your security. Please request a new verification code.',
      })
    }

    if (!reportFileExists(report.storageKey)) {
      return res.status(404).json({
        message: 'The requested report file is temporarily unavailable on server storage. Please contact the centre.',
      })
    }

    const clientIp = String(req.headers['x-forwarded-for'] || req.socket?.remoteAddress || '127.0.0.1').split(',')[0]
    const userAgent = req.headers['user-agent'] || 'unknown'

    // Log the download event in audit logs
    report.auditLogs.push({
      action: 'downloaded',
      performedBy: 'patient',
      ip: clientIp,
      userAgent,
      details: `File downloaded successfully: ${report.fileName}`,
    })

    // Single-use token: invalidate token after successful download
    report.activeDownloadToken = undefined
    await report.save()

    await recordAudit({
      action: 'report_downloaded',
      category: 'report',
      performedBy: 'patient',
      targetId: String(report._id),
      targetReference: report.bookingReference,
      req,
    })

    const safeFilename = `UniquePathology_${report.bookingReference}.pdf`

    res.setHeader('Content-Type', report.mimeType || 'application/pdf')
    res.setHeader('Content-Disposition', `attachment; filename="${safeFilename}"`)
    res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, private')
    res.setHeader('X-Content-Type-Options', 'nosniff')

    const fileStream = getReportStream(report.storageKey)
    fileStream.pipe(res)
  } catch (err) {
    next(err)
  }
})

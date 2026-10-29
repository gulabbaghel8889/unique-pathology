import crypto from 'node:crypto'
import { OtpSession } from '../models/OtpSession.js'
import { config } from '../config/index.js'
import { sendOtpSms } from './smsService.js'

const OTP_EXPIRY_MS = 10 * 60 * 1000 // 10 minutes
const MAX_ATTEMPTS = 5

function hashOtp(otp, salt) {
  return crypto.createHash('sha256').update(`${otp}:${salt}`).digest('hex')
}

export async function createOtpForPatient({ bookingReference, phone, ip }) {
  // Generate a random 6-digit number
  const otpCode = crypto.randomInt(100000, 999999).toString()
  const salt = config.jwt.secret || 'salt_unique_pathology'
  const otpHash = hashOtp(otpCode, salt)
  const expiresAt = new Date(Date.now() + OTP_EXPIRY_MS)

  // Invalidate any existing sessions for this reference + phone
  await OtpSession.deleteMany({ bookingReference: bookingReference.toUpperCase(), phone })

  await OtpSession.create({
    bookingReference: bookingReference.toUpperCase(),
    phone,
    otpHash,
    expiresAt,
    attempts: 0,
    isVerified: false,
    ip,
  })

  // Dispatch real SMS OTP through configured gateway or simulation logger
  const smsResult = await sendOtpSms({
    phone,
    otpCode,
    bookingReference: bookingReference.toUpperCase(),
  })

  return {
    expiresAt,
    smsDelivered: smsResult.delivered,
    provider: smsResult.provider,
    smsMessage: smsResult.message,
    // In dev / test or when SMS gateway is not configured, provide previewCode for testing
    sandboxCode: !config.isProd ? otpCode : undefined,
  }
}

export async function verifyPatientOtp({ bookingReference, phone, code }) {
  const session = await OtpSession.findOne({
    bookingReference: bookingReference.toUpperCase(),
    phone,
  })

  if (!session) {
    return { success: false, reason: 'No active OTP request found. Please request a new verification code.' }
  }

  if (session.expiresAt < new Date()) {
    await OtpSession.deleteOne({ _id: session._id })
    return { success: false, reason: 'Verification code has expired. Please request a new one.' }
  }

  if (session.attempts >= MAX_ATTEMPTS) {
    await OtpSession.deleteOne({ _id: session._id })
    return { success: false, reason: 'Maximum verification attempts exceeded. Please request a new code.' }
  }

  session.attempts += 1

  const salt = config.jwt.secret || 'salt_unique_pathology'
  const providedHash = hashOtp(code.trim(), salt)

  const isMatch = crypto.timingSafeEqual(Buffer.from(providedHash), Buffer.from(session.otpHash))

  if (!isMatch) {
    await session.save()
    const remaining = MAX_ATTEMPTS - session.attempts
    return { success: false, reason: `Invalid code. ${remaining} attempt(s) remaining.` }
  }

  session.isVerified = true
  await session.save()

  return { success: true }
}

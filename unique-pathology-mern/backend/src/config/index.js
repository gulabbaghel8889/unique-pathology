import 'dotenv/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

export const config = {
  port: Number(process.env.PORT || 5000),
  nodeEnv: process.env.NODE_ENV || 'development',
  isProd: process.env.NODE_ENV === 'production',
  frontendUrl: (process.env.FRONTEND_URL || 'http://localhost:5173').split(',').map(s => s.trim()),
  mongoUri: process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/unique_pathology',

  jwt: {
    secret: process.env.JWT_SECRET || 'dev_secret_unique_pathology_mandideep_at_least_32_chars_long_key',
    expiresIn: process.env.JWT_EXPIRES_IN || '2h',
  },

  admin: {
    email: (process.env.ADMIN_EMAIL || 'admin@uniquepathology.example').toLowerCase(),
    // Default fallback hash for dev if not set: bcrypt hash of "UniqueAdmin@2026"
    passwordHash: process.env.ADMIN_PASSWORD_HASH || '$2a$12$JWB7gcCmsPmct0aL0KIf6u42cKroKx/7A.xyQgKYJWBz36oa8dXEm',
  },

  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || '',
    keySecret: process.env.RAZORPAY_KEY_SECRET || '',
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || '',
    isConfigured: Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
  },

  sms: {
    provider: process.env.SMS_PROVIDER || 'auto', // 'fast2sms' | 'twilio' | 'auto'
    fast2smsApiKey: process.env.FAST2SMS_API_KEY || '',
    twilioAccountSid: process.env.TWILIO_ACCOUNT_SID || '',
    twilioAuthToken: process.env.TWILIO_AUTH_TOKEN || '',
    twilioFromPhone: process.env.TWILIO_FROM_PHONE || '',
    isConfigured: Boolean(
      process.env.FAST2SMS_API_KEY ||
      (process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN && process.env.TWILIO_FROM_PHONE)
    ),
  },

  storage: {
    reportsDir: process.env.REPORTS_STORAGE_PATH
      ? path.resolve(process.env.REPORTS_STORAGE_PATH)
      : path.resolve(__dirname, '../../storage/reports'),
    linkExpiryMinutes: Number(process.env.REPORTS_LINK_EXPIRES_MINUTES || 15),
  },

  business: {
    name: 'Unique Pathology',
    shortName: 'Unique Pathology',
    tagline: 'Precision Diagnostics & Caring Health Screening',
    city: 'Mandideep',
    district: 'Bhopal Region (Raisen / MP)',
    state: 'Madhya Pradesh',
    country: 'India',
    address: process.env.BUSINESS_ADDRESS || '[Mandideep Centre, Bhopal Region, Madhya Pradesh — Exact Building Address Pending Verification]',
    phone: process.env.BUSINESS_PHONE || '', // Left empty if not verified
    email: process.env.BUSINESS_EMAIL || 'contact@uniquepathology.example',
    whatsappNumber: process.env.WHATSAPP_NUMBER || '', // Only active if explicitly set
    timings: 'Monday – Saturday: 07:00 AM – 08:00 PM | Sunday: 08:00 AM – 01:00 PM',
    homeCollectionHours: '07:00 AM – 02:00 PM Daily',
    isPhoneVerified: Boolean(process.env.BUSINESS_PHONE),
    isWhatsAppConfigured: Boolean(process.env.WHATSAPP_NUMBER),
    disclaimer: 'Notice: Test catalogue information and demo prices are indicative. Always verify with lab staff. Online bookings are requests subject to availability and formal confirmation.',
  },
}

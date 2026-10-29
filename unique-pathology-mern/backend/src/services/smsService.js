import { config } from '../config/index.js'

/**
 * Sends a real SMS OTP to the patient's registered mobile number for report access.
 * Supports:
 * - Fast2SMS (Indian SMS Gateway, route: 'otp')
 * - Twilio SMS (Global SMS Gateway)
 * - Safe laboratory server console simulator fallback
 */
export async function sendOtpSms({ phone, otpCode, bookingReference = '' }) {
  // Normalize 10-digit Indian phone number
  const clean = String(phone).replace(/[^0-9]/g, '')
  const tenDigitPhone = clean.length === 12 && clean.startsWith('91') ? clean.slice(2) : clean.slice(-10)
  const maskedPhone = `+91 ******${tenDigitPhone.slice(-4)}`

  const smsText = `Your Unique Pathology verification code for report access (Ref: ${bookingReference || 'REPORT'}) is ${otpCode}. Valid for 10 minutes. Do not share.`

  // 1. Try Fast2SMS if configured
  if (config.sms.fast2smsApiKey) {
    try {
      console.log(`[SMS Gateway] Sending real OTP via Fast2SMS to ${maskedPhone}...`)
      const response = await fetch('https://www.fast2sms.com/dev/bulkV2', {
        method: 'POST',
        headers: {
          authorization: config.sms.fast2smsApiKey,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          route: 'otp',
          variables_values: otpCode,
          numbers: tenDigitPhone,
        }),
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.return) {
        console.log(`[SMS Gateway] Fast2SMS delivered successfully to ${maskedPhone}. Request ID: ${data.request_id || 'OK'}`)
        return {
          delivered: true,
          provider: 'fast2sms',
          message: `Real SMS OTP dispatched to ${maskedPhone} via Fast2SMS.`,
          requestId: data.request_id,
        }
      } else {
        console.warn(`[SMS Gateway] Fast2SMS returned error:`, data.message || response.statusText)
      }
    } catch (err) {
      console.error(`[SMS Gateway] Fast2SMS dispatch failed:`, err.message)
    }
  }

  // 2. Try Twilio if configured
  if (config.sms.twilioAccountSid && config.sms.twilioAuthToken && config.sms.twilioFromPhone) {
    try {
      console.log(`[SMS Gateway] Sending real OTP via Twilio to ${maskedPhone}...`)
      const twilioUrl = `https://api.twilio.com/2010-04-01/Accounts/${config.sms.twilioAccountSid}/Messages.json`
      const params = new URLSearchParams()
      params.append('To', `+91${tenDigitPhone}`)
      params.append('From', config.sms.twilioFromPhone)
      params.append('Body', smsText)

      const auth = Buffer.from(`${config.sms.twilioAccountSid}:${config.sms.twilioAuthToken}`).toString('base64')

      const response = await fetch(twilioUrl, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params,
      })

      const data = await response.json().catch(() => ({}))

      if (response.ok && data.sid) {
        console.log(`[SMS Gateway] Twilio delivered successfully to ${maskedPhone}. SID: ${data.sid}`)
        return {
          delivered: true,
          provider: 'twilio',
          message: `Real SMS OTP dispatched to ${maskedPhone} via Twilio.`,
          sid: data.sid,
        }
      } else {
        console.warn(`[SMS Gateway] Twilio returned error:`, data.message || response.statusText)
      }
    } catch (err) {
      console.error(`[SMS Gateway] Twilio dispatch failed:`, err.message)
    }
  }

  // 3. Fallback / Development Simulation Log
  console.log(`
╔═══════════════════════════════════════════════════════════════════════════╗
║ [REAL SMS GATEWAY] PATIENT OTP DISPATCH REQUEST                           ║
╠═══════════════════════════════════════════════════════════════════════════╣
║ Recipient Phone:       +91 ${tenDigitPhone} (${maskedPhone})             ║
║ 6-Digit OTP Code:      ${otpCode}                                         ║
║ Booking Reference:     ${bookingReference || 'N/A'}                       ║
║ Message Content:       ${smsText.slice(0, 50)}...                         ║
║ Active Status:         SMS Service Ready                                  ║
║ Note: To send directly via telecom SMS, add FAST2SMS_API_KEY in .env      ║
╚═══════════════════════════════════════════════════════════════════════════╝
  `)

  return {
    delivered: false,
    provider: 'simulator',
    message: `Verification OTP logged and prepared for +91 ******${tenDigitPhone.slice(-4)}. Add FAST2SMS_API_KEY to send over cellular network.`,
  }
}

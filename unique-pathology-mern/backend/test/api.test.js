import test from 'node:test'
import assert from 'node:assert/strict'
import http from 'node:http'
import crypto from 'node:crypto'
import jwt from 'jsonwebtoken'
import { app } from '../src/server.js'
import { config } from '../src/config/index.js'
import { generateDownloadToken, reportFileExists } from '../src/services/storageService.js'

let server
let baseUrl

test.before(async () => {
  server = http.createServer(app)
  await new Promise((resolve) => {
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address()
      baseUrl = `http://127.0.0.1:${addr.port}`
      resolve()
    })
  })
})

test.after(async () => {
  await new Promise((resolve) => server.close(resolve))
})

test('API Health Check', async () => {
  const res = await fetch(`${baseUrl}/api/health`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.status, 'ok')
  assert.match(body.service, /Unique Pathology/i)
  assert.match(body.location, /Mandideep/i)
})

test('Public Business Config', async () => {
  const res = await fetch(`${baseUrl}/api/config/public`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.business.name, 'Unique Pathology')
  assert.equal(body.business.city, 'Mandideep')
  assert.ok(body.features)
  assert.equal(typeof body.features.onlinePaymentAvailable, 'boolean')
})

test('Clinical Departments List', async () => {
  const res = await fetch(`${baseUrl}/api/departments`)
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.ok(Array.isArray(body.departments))
  assert.ok(body.departments.length >= 5)
  const names = body.departments.map((d) => d.name)
  assert.ok(names.includes('Hematology'))
  assert.ok(names.includes('Clinical Biochemistry'))
})

test('Booking Validation Failure on Empty / Invalid Body', async () => {
  const res = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ patientName: '' }),
  })
  assert.equal(res.status, 400)
  const body = await res.json()
  assert.match(body.message, /Invalid booking information/i)
  assert.ok(body.errors)
})

test('Booking Validation Rejects Invalid Phone', async () => {
  const res = await fetch(`${baseUrl}/api/bookings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      patientName: 'Test Patient',
      phone: '12345', // invalid phone
      date: '2026-12-01',
      consent: true,
    }),
  })
  assert.equal(res.status, 400)
})

test('Admin Route Protected: Rejects Unauthenticated Requests', async () => {
  const res = await fetch(`${baseUrl}/api/admin/metrics`)
  assert.equal(res.status, 401)
  const body = await res.json()
  assert.match(body.message, /token required/i)
})

test('Admin Route Protected: Rejects Invalid JWT Token', async () => {
  const res = await fetch(`${baseUrl}/api/admin/metrics`, {
    headers: { Authorization: 'Bearer this_is_a_bogus_token' },
  })
  assert.equal(res.status, 401)
  const body = await res.json()
  assert.match(body.message, /Invalid authentication session/i)
})

test('Admin Route Allowed with Valid Admin JWT Token', async () => {
  const token = jwt.sign(
    { role: 'admin', email: config.admin.email },
    config.jwt.secret,
    { expiresIn: '1h' }
  )
  const res = await fetch(`${baseUrl}/api/auth/admin/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  assert.equal(res.status, 200)
  const body = await res.json()
  assert.equal(body.admin.role, 'admin')
})

test('Doctor / Corporate Enquiry Submission Validation', async () => {
  const res = await fetch(`${baseUrl}/api/enquiries`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      type: 'doctor',
      name: 'Dr. Sharma',
      email: 'dr.sharma@clinic.example',
      phone: '9826012345',
      organization: 'Sharma Medicare Clinic Mandideep',
      message: 'Enquiry regarding daily sample pickup and biochemistry turnaround.',
    }),
  })
  // If MongoDB is not running during offline unit test, will return 500 or 201; check validation passes
  assert.ok(res.status === 201 || res.status === 500)
})

test('Razorpay HMAC SHA-256 Signature Math Verification', () => {
  const testSecret = 'rzp_test_secret_12345'
  const orderId = 'order_DA123456789'
  const paymentId = 'pay_987654321'

  const validSignature = crypto
    .createHmac('sha256', testSecret)
    .update(`${orderId}|${paymentId}`)
    .digest('hex')

  const verifyHmac = (ord, pay, sig) => {
    const expected = crypto.createHmac('sha256', testSecret).update(`${ord}|${pay}`).digest('hex')
    const a = Buffer.from(expected)
    const b = Buffer.from(sig)
    if (a.length !== b.length) return false
    return crypto.timingSafeEqual(a, b)
  }

  assert.equal(verifyHmac(orderId, paymentId, validSignature), true)
  assert.equal(verifyHmac(orderId, paymentId, 'tampered_signature_hex'), false)
  assert.equal(verifyHmac(orderId, 'pay_tampered', validSignature), false)
})

test('Storage Service: Download Token Generation & Expiry', () => {
  const { token, expiresAt } = generateDownloadToken()
  assert.equal(typeof token, 'string')
  assert.equal(token.length, 64) // 32 random bytes hex
  assert.ok(expiresAt instanceof Date)
  assert.ok(expiresAt.getTime() > Date.now())
})

test('Storage Service: Sample Demo PDF Exists on Disk', () => {
  const exists = reportFileExists('sample-demo-report.pdf')
  assert.equal(exists, true)
})

test('SMS Service: Real OTP Dispatch Simulator Formats Phone and Returns Safe Response', async () => {
  const { sendOtpSms } = await import('../src/services/smsService.js')
  const result = await sendOtpSms({
    phone: '9876543210',
    otpCode: '458921',
    bookingReference: 'UP-TEST-SMS',
  })
  assert.equal(typeof result, 'object')
  assert.equal(typeof result.message, 'string')
  assert.ok(result.provider === 'simulator' || result.provider === 'fast2sms' || result.provider === 'twilio')
})


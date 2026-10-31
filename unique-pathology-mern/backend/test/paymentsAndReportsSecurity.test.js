import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { config } from '../src/config/index.js'
import { Booking } from '../src/models/Booking.js'
import { Payment } from '../src/models/Payment.js'
import { Report } from '../src/models/Report.js'
import { DownloadLog } from '../src/models/DownloadLog.js'
import { AuditLog } from '../src/models/AuditLog.js'
import { app } from '../src/server.js'
import { savePrivateReportFile, deletePrivateReportFile } from '../src/services/storageService.js'
import { createOtpForPatient } from '../src/services/otpService.js'

let server = null
let baseUrl = ''
let adminJwt = ''

test.before(async () => {
  await mongoose.connect(config.mongoUri)
  adminJwt = jwt.sign(
    { email: 'admin@uniquepathology.example', role: 'admin' },
    config.jwt.secret,
    { expiresIn: '1h' }
  )

  await new Promise((resolve) => {
    server = app.listen(0, () => {
      const port = server.address().port
      baseUrl = `http://localhost:${port}/api`
      resolve()
    })
  })
})

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await mongoose.disconnect()
})

test('FLOW 1: Booking Created -> Payment Status Pending -> Admin Uploads Report -> Patient Download Blocked', async () => {
  const timestamp = Date.now()
  const ref = `UP-TEST-${timestamp}`

  // 1. Create Booking with Pending Payment
  const booking = await Booking.create({
    reference: ref,
    patientName: 'Test Patient Pending',
    phone: '9876500111',
    date: '2026-11-05',
    timeSlot: '07:00 AM - 09:00 AM',
    collectionType: 'centre',
    items: [
      {
        itemType: 'test',
        name: 'HbA1c (Glycated Hemoglobin)',
        pricePaise: 45000,
      },
    ],
    subtotalPaise: 45000,
    discountAmountPaise: 0,
    totalAmountPaise: 45000,
    status: 'confirmed',
    paymentStatus: 'pending',
    consent: true,
  })

  assert.equal(booking.paymentStatus, 'pending')

  // 2. Admin uploads report for booking
  const dummyBuffer = Buffer.from('%PDF-1.4 dummy pdf for test verification')
  const storageResult = await savePrivateReportFile({
    buffer: dummyBuffer,
    originalName: 'test_report.pdf',
    mimeType: 'application/pdf',
  })

  const report = await Report.create({
    bookingId: booking._id,
    bookingReference: booking.reference,
    patientPhone: booking.phone,
    patientName: booking.patientName,
    reportTitle: 'HbA1c Diagnostic Test Report',
    testNames: ['HbA1c (Glycated Hemoglobin)'],
    fileName: 'test_report.pdf',
    storageKey: storageResult.storageKey,
    mimeType: 'application/pdf',
    fileSizeBytes: storageResult.fileSizeBytes,
    status: 'released',
    uploadedBy: 'admin@uniquepathology.example',
  })

  assert.ok(report._id)

  // 3. Request OTP as patient
  const otpResult = await createOtpForPatient({
    bookingReference: booking.reference,
    phone: booking.phone,
    ip: '127.0.0.1',
  })

  assert.ok(otpResult.sandboxCode)

  // 4. Verify OTP as patient
  const verifyRes = await fetch(`${baseUrl}/reports/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingReference: booking.reference,
      phone: booking.phone,
      code: otpResult.sandboxCode,
    }),
  })

  const verifyData = await verifyRes.json()
  assert.equal(verifyRes.status, 200)
  assert.equal(verifyData.isPaymentPending, true)
  assert.equal(verifyData.paymentStatus, 'pending')
  assert.match(verifyData.message, /Payment Pending/i)

  // 5. Patient attempts download (even if token is passed)
  const downloadRes = await fetch(`${baseUrl}/reports/download/${verifyData.downloadToken || 'dummy_token'}`)
  assert.equal(downloadRes.status >= 400, true)
  const downloadError = await downloadRes.json()
  assert.ok(downloadError.message)
  console.log('Flow 1 Result: Patient download successfully blocked with message:', downloadError.message)

  // Clean up storage file and test docs
  await deletePrivateReportFile(storageResult.storageKey)
  await Report.findByIdAndDelete(report._id)
  await Booking.findByIdAndDelete(booking._id)
})

test('FLOW 2: Payment Status Changed to PAID -> Payment Method Selected -> Payment Record Created -> Count Updated', async () => {
  const initialPaymentsCount = await Payment.countDocuments()
  const timestamp = Date.now()
  const ref = `UP-PAY-${timestamp}`

  // 1. Create a booking
  const booking = await Booking.create({
    reference: ref,
    patientName: 'Test Patient For Payment',
    phone: '9876500222',
    date: '2026-11-06',
    timeSlot: '09:00 AM - 11:00 AM',
    collectionType: 'centre',
    items: [
      {
        itemType: 'test',
        name: 'Lipid Profile (Full Panel)',
        pricePaise: 65000,
      },
    ],
    subtotalPaise: 65000,
    discountAmountPaise: 5000,
    totalAmountPaise: 60000,
    status: 'confirmed',
    paymentStatus: 'pending',
    consent: true,
  })

  // 2. Reject if marking PAID without payment method
  const invalidPatch = await fetch(`${baseUrl}/admin/bookings/${booking._id}/payment`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      paymentStatus: 'paid',
      // missing paymentMethod
    }),
  })
  assert.equal(invalidPatch.status, 400)

  // 3. Mark as PAID with paymentMethod: 'UPI'
  const patchRes = await fetch(`${baseUrl}/admin/bookings/${booking._id}/payment`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      paymentStatus: 'paid',
      paymentMethod: 'UPI',
      notes: 'UPI Ref 1234567890',
    }),
  })

  assert.equal(patchRes.status, 200)
  const patchData = await patchRes.json()
  assert.equal(patchData.booking.paymentStatus, 'paid')
  assert.ok(patchData.payment)

  // 4. Verify payment count incremented
  const newPaymentsCount = await Payment.countDocuments()
  assert.equal(newPaymentsCount, initialPaymentsCount + 1)

  // 5. Verify fields stored in Payment record
  const savedPayment = await Payment.findOne({ bookingId: booking._id })
  assert.ok(savedPayment)
  assert.equal(savedPayment.bookingReference, ref)
  assert.equal(savedPayment.patientName, 'Test Patient For Payment')
  assert.equal(savedPayment.mobileNumber, '9876500222')
  assert.equal(savedPayment.testOrPackageName, 'Lipid Profile (Full Panel)')
  assert.equal(savedPayment.originalAmount, 650)
  assert.equal(savedPayment.discountAmount, 50)
  assert.equal(savedPayment.finalAmount, 600)
  assert.equal(savedPayment.paymentMethod, 'UPI')
  assert.equal(savedPayment.status, 'paid')
  assert.ok(savedPayment.paymentDate)

  // 6. Verify duplicate prevention: update again
  const duplicatePatch = await fetch(`${baseUrl}/admin/bookings/${booking._id}/payment`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      paymentStatus: 'paid',
      paymentMethod: 'Card',
      notes: 'Updated to Card payment',
    }),
  })
  assert.equal(duplicatePatch.status, 200)

  const countAfterDuplicate = await Payment.countDocuments()
  assert.equal(countAfterDuplicate, newPaymentsCount) // Count remains the same!

  const updatedPayment = await Payment.findOne({ bookingId: booking._id })
  assert.equal(updatedPayment.paymentMethod, 'Card')

  // Clean up
  await Payment.findByIdAndDelete(savedPayment._id)
  await Booking.findByIdAndDelete(booking._id)
})

test('FLOW 3: Report Download Enabled when PAID -> Download Log Created -> Audit Log Created', async () => {
  const timestamp = Date.now()
  const ref = `UP-DL-${timestamp}`

  // 1. Create a paid booking
  const booking = await Booking.create({
    reference: ref,
    patientName: 'Test Patient Paid Download',
    phone: '9876500333',
    date: '2026-11-07',
    timeSlot: '11:00 AM - 01:00 PM',
    collectionType: 'centre',
    items: [
      {
        itemType: 'test',
        name: 'Thyroid Profile (Total T3, T4, TSH)',
        pricePaise: 55000,
      },
    ],
    subtotalPaise: 55000,
    totalAmountPaise: 55000,
    status: 'completed',
    paymentStatus: 'paid',
    consent: true,
  })

  // 2. Admin uploads report
  const dummyBuffer = Buffer.from('%PDF-1.4 official diagnostic report dummy content')
  const storageResult = await savePrivateReportFile({
    buffer: dummyBuffer,
    originalName: 'thyroid_report.pdf',
    mimeType: 'application/pdf',
  })

  const report = await Report.create({
    bookingId: booking._id,
    bookingReference: booking.reference,
    patientPhone: booking.phone,
    patientName: booking.patientName,
    reportTitle: 'Thyroid Diagnostic Report',
    testNames: ['Thyroid Profile (Total T3, T4, TSH)'],
    fileName: 'thyroid_report.pdf',
    storageKey: storageResult.storageKey,
    mimeType: 'application/pdf',
    fileSizeBytes: storageResult.fileSizeBytes,
    status: 'released',
    uploadedBy: 'admin@uniquepathology.example',
  })

  // 3. Request OTP and verify OTP
  const otpResult = await createOtpForPatient({
    bookingReference: booking.reference,
    phone: booking.phone,
    ip: '127.0.0.1',
  })

  const verifyRes = await fetch(`${baseUrl}/reports/verify-otp`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      bookingReference: booking.reference,
      phone: booking.phone,
      code: otpResult.sandboxCode,
    }),
  })

  const verifyData = await verifyRes.json()
  assert.equal(verifyRes.status, 200)
  assert.equal(verifyData.paymentStatus, 'paid')
  assert.equal(verifyData.isPaymentPending, false)
  assert.ok(verifyData.downloadToken)

  // 4. Download report as patient
  const downloadRes = await fetch(`${baseUrl}/reports/download/${verifyData.downloadToken}`)
  assert.equal(downloadRes.status, 200)
  assert.equal(downloadRes.headers.get('content-type'), 'application/pdf')
  const downloadedBuf = Buffer.from(await downloadRes.arrayBuffer())
  assert.equal(downloadedBuf.toString(), dummyBuffer.toString())

  // 5. Verify DownloadLog created
  const downloadLog = await DownloadLog.findOne({ bookingReference: ref })
  assert.ok(downloadLog)
  assert.equal(downloadLog.patientName, 'Test Patient Paid Download')
  assert.equal(downloadLog.userType, 'Patient')
  assert.equal(downloadLog.downloadedBy, '9876500333')
  assert.ok(downloadLog.downloadDate)
  assert.ok(downloadLog.downloadTime)

  // 6. Verify AuditLog created
  const auditLog = await AuditLog.findOne({
    action: `Report downloaded for Booking ID ${ref}`,
  })
  assert.ok(auditLog)
  assert.equal(auditLog.category, 'report')
  assert.equal(auditLog.performedBy, '9876500333')

  // 7. Verify Admin Download permission regardless of payment status
  const adminDownloadRes = await fetch(`${baseUrl}/admin/reports/${report._id}/download`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(adminDownloadRes.status, 200)

  const adminDlLog = await DownloadLog.findOne({
    bookingReference: ref,
    userType: 'Admin',
  })
  assert.ok(adminDlLog)
  assert.equal(adminDlLog.downloadedBy, 'admin@uniquepathology.example')

  // Clean up
  await deletePrivateReportFile(storageResult.storageKey)
  await DownloadLog.deleteMany({ bookingReference: ref })
  await AuditLog.deleteMany({ targetReference: ref })
  await Report.findByIdAndDelete(report._id)
  await Booking.findByIdAndDelete(booking._id)
})

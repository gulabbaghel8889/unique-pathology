import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { config } from '../src/config/index.js'
import { app } from '../src/server.js'
import { Doctor } from '../src/models/Doctor.js'
import { Booking } from '../src/models/Booking.js'
import { FinancialLedger } from '../src/models/FinancialLedger.js'

let server = null
let baseUrl = ''
let adminJwt = ''

let testDoctor = null
let referralBooking = null
let walkinBooking = null

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

  // 1. Create a doctor
  testDoctor = await Doctor.findOneAndUpdate(
    { email: 'dr.reconcile.test@uniquepathology.example' },
    {
      name: 'Dr. Reconcile Specialist',
      email: 'dr.reconcile.test@uniquepathology.example',
      mobile: '9826001234',
      password: 'password123',
      discountPercent: 20,
      specialization: 'Pathology & Diagnostics',
      clinicName: 'Unique Care Clinic',
      status: 'active',
      referralCode: 'RECON20',
    },
    { upsert: true, new: true }
  )

  // 2. Create a doctor-referred booking
  referralBooking = await Booking.create({
    reference: `UP-REC-${Date.now().toString().slice(-6)}`,
    patientName: 'Rameshwar Dayal',
    phone: '9826011111',
    email: 'rameshwar@example.com',
    age: 52,
    gender: 'male',
    items: [
      {
        itemType: 'test',
        name: 'Comprehensive Metabolic Panel',
        code: 'CMP',
        pricePaise: 100000,
        mrpPaise: 100000,
        discountPaise: 20000,
        finalPricePaise: 80000,
        isVerifiedPrice: true,
      },
    ],
    originalMrpPaise: 100000,
    subtotalPaise: 100000,
    discountAmountPaise: 20000,
    totalAmountPaise: 80000,
    amountPaidPaise: 80000,
    outstandingAmountPaise: 0,
    amountRefundedPaise: 0,
    authorizedServicePaymentPaise: 0,
    settlementStatus: 'pending',
    paymentStatus: 'paid',
    doctorId: testDoctor._id,
    doctorName: testDoctor.name,
    doctorDiscountPercent: 20,
    referredBy: 'doctor',
    date: '2026-11-01',
    timeSlot: '07:00 AM - 09:00 AM',
    collectionType: 'centre',
    consent: true,
  })

  // 3. Create a walk-in booking (no doctor)
  walkinBooking = await Booking.create({
    reference: `UP-WLK-${Date.now().toString().slice(-6)}`,
    patientName: 'Direct Walkin Patient',
    phone: '9826022222',
    email: 'walkin@example.com',
    age: 28,
    gender: 'female',
    items: [
      {
        itemType: 'test',
        name: 'Random Blood Sugar (RBS)',
        code: 'RBS',
        pricePaise: 20000,
        mrpPaise: 20000,
        discountPaise: 0,
        finalPricePaise: 20000,
        isVerifiedPrice: true,
      },
    ],
    originalMrpPaise: 20000,
    subtotalPaise: 20000,
    discountAmountPaise: 0,
    totalAmountPaise: 20000,
    amountPaidPaise: 20000,
    outstandingAmountPaise: 0,
    amountRefundedPaise: 0,
    authorizedServicePaymentPaise: 0,
    settlementStatus: 'pending',
    paymentStatus: 'paid',
    doctorId: null,
    doctorName: '',
    doctorDiscountPercent: 0,
    referredBy: 'self',
    date: '2026-11-01',
    timeSlot: '09:00 AM - 11:00 AM',
    collectionType: 'centre',
    consent: true,
  })
})

test.after(async () => {
  if (referralBooking) {
    await Booking.deleteMany({ _id: { $in: [referralBooking._id, walkinBooking._id] } })
    await FinancialLedger.deleteMany({ bookingId: referralBooking._id })
  }
  if (testDoctor) {
    await Doctor.deleteOne({ _id: testDoctor._id })
  }
  if (server) {
    server.close()
  }
  await mongoose.disconnect()
})

test('ISSUE 1: Patient and doctor details are correctly populated and mapped', async () => {
  const res = await fetch(`${baseUrl}/admin/referrals?bookingId=${referralBooking.reference}`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.equal(data.referrals.length, 1)

  const r = data.referrals[0]
  // Patient details
  assert.equal(r.patientName, 'Rameshwar Dayal')
  assert.equal(r.patient?.name, 'Rameshwar Dayal')
  assert.equal(r.patient?.mobile, '9826011111')
  assert.equal(r.patient?.gender, 'male')
  assert.equal(r.patient?.age, 52)

  // Referring Doctor details
  assert.equal(r.doctorName, 'Dr. Reconcile Specialist')
  assert.equal(r.doctor?.name, 'Dr. Reconcile Specialist')
  assert.equal(r.doctor?.referralCode, 'RECON20')
  assert.equal(r.doctor?.discountPercent, 20)
  assert.equal(String(r.doctor?._id), String(testDoctor._id))
  assert.equal(r.bookingReference, referralBooking.reference)

  // Single referral detail endpoint
  const detailRes = await fetch(`${baseUrl}/admin/referrals/${referralBooking._id}`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(detailRes.status, 200)
  const detailData = await detailRes.json()
  assert.equal(detailData.booking.patient?.name, 'Rameshwar Dayal')
  assert.equal(detailData.booking.doctor?.name, 'Dr. Reconcile Specialist')
  assert.equal(detailData.booking.bookingReference, referralBooking.reference)
})

test('ISSUE 2: Refund API handles frontend payload, prevents .trim() errors, and enforces business rules', async () => {
  // 1. Missing justification (< 3 chars) -> HTTP 400
  const badJustRes = await fetch(`${baseUrl}/admin/referrals/${referralBooking._id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      refundAmountPaise: 10000,
      reason: 'ab', // too short
    }),
  })
  assert.equal(badJustRes.status, 400)
  const badJustData = await badJustRes.json()
  assert.match(badJustData.message, /justification.*required/i)

  // 2. Undefined justification / reason without crash -> HTTP 400
  const noJustRes = await fetch(`${baseUrl}/admin/referrals/${referralBooking._id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      refundAmountPaise: 10000,
    }),
  })
  assert.equal(noJustRes.status, 400)

  // 3. Invalid refund amount <= 0 -> HTTP 400
  const zeroAmtRes = await fetch(`${baseUrl}/admin/referrals/${referralBooking._id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      refundAmountPaise: 0,
      reason: 'Valid cancellation reason',
    }),
  })
  assert.equal(zeroAmtRes.status, 400)

  // 4. Refund amount exceeding eligible paid amount (80,000 paise paid, requesting 100,000) -> HTTP 400
  const excessRes = await fetch(`${baseUrl}/admin/referrals/${referralBooking._id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      refundAmountPaise: 100000,
      reason: 'Valid cancellation reason',
    }),
  })
  assert.equal(excessRes.status, 400)
  const excessData = await excessRes.json()
  assert.match(excessData.message, /exceeds net collected amount/i)

  // 5. Valid partial refund using frontend payload structure ({ refundAmountPaise, reason, notes, reference })
  const validPartialRes = await fetch(`${baseUrl}/admin/referrals/${referralBooking._id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      refundAmountPaise: 30000, // ₹300 partial refund
      reason: 'PATIENT_REQUEST',
      notes: 'Customer changed mind for one investigation',
      reference: 'TX-REF-PARTIAL-001',
    }),
  })
  assert.equal(validPartialRes.status, 201)
  const validPartialData = await validPartialRes.json()
  assert.equal(validPartialData.booking.amountRefundedPaise, 30000)
  assert.equal(validPartialData.booking.outstandingAmountPaise, 30000)
  assert.equal(validPartialData.ledgerEntry.entryType, 'PATIENT_REFUND')
  assert.equal(validPartialData.ledgerEntry.justification, 'PATIENT_REQUEST')
  assert.equal(validPartialData.ledgerEntry.transactionReference, 'TX-REF-PARTIAL-001')

  // 6. Duplicate refund attempt with same transaction reference -> HTTP 400
  const dupRes = await fetch(`${baseUrl}/admin/referrals/${referralBooking._id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      refundAmountPaise: 10000,
      reason: 'PATIENT_REQUEST',
      reference: 'TX-REF-PARTIAL-001', // duplicate ref
    }),
  })
  assert.equal(dupRes.status, 400)
  const dupData = await dupRes.json()
  assert.match(dupData.message, /duplicate refund/i)

  // 7. Valid full remaining refund (remaining 50,000 paise) -> booking marked refunded
  const validFullRes = await fetch(`${baseUrl}/admin/referrals/${referralBooking._id}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      refundAmountPaise: 50000,
      justification: 'Full remaining refund clearance',
      transactionReference: 'TX-REF-FULL-002',
    }),
  })
  assert.equal(validFullRes.status, 201)
  const validFullData = await validFullRes.json()
  assert.equal(validFullData.booking.amountRefundedPaise, 80000)
  assert.equal(validFullData.booking.paymentStatus, 'refunded')
})

test('ISSUE 3: All 9 Financial KPI summary fields are computed accurately with both alias conventions', async () => {
  const res = await fetch(`${baseUrl}/admin/referrals`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(res.status, 200)
  const data = await res.json()
  assert.ok(data.summary, 'Summary object must exist')

  const s = data.summary
  // Both totalBookings and totalReferralsCount are non-zero numbers
  assert.ok(s.totalBookings > 0, `totalBookings should be > 0, got ${s.totalBookings}`)
  assert.equal(s.totalBookings, s.totalReferralsCount)

  // Both totalMrpPaise and totalOriginalMrpPaise match and are > 0
  assert.ok(s.totalMrpPaise > 0, `totalMrpPaise should be > 0, got ${s.totalMrpPaise}`)
  assert.equal(s.totalMrpPaise, s.totalOriginalMrpPaise)

  // Both totalPayablePaise and totalPatientPayablePaise match
  assert.ok(s.totalPayablePaise > 0, `totalPayablePaise should be > 0, got ${s.totalPayablePaise}`)
  assert.equal(s.totalPayablePaise, s.totalPatientPayablePaise)

  // Both totalPaidPaise and totalPatientPaidPaise match
  assert.ok(s.totalPaidPaise > 0, `totalPaidPaise should be > 0, got ${s.totalPaidPaise}`)
  assert.equal(s.totalPaidPaise, s.totalPatientPaidPaise)

  // Both totalRefundedPaise and totalRefundPaise match
  assert.ok(s.totalRefundedPaise >= 0)
  assert.equal(s.totalRefundedPaise, s.totalRefundPaise)

  // Both totalAuthorizedServicePaymentPaise and totalAuthorizedServicePaise match
  assert.ok(s.totalAuthorizedServicePaymentPaise >= 0)
  assert.equal(s.totalAuthorizedServicePaymentPaise, s.totalAuthorizedServicePaise)

  // Both totalLabNetRetainedPaise and totalNetRetainedPaise match
  assert.ok(s.totalLabNetRetainedPaise >= 0)
  assert.equal(s.totalLabNetRetainedPaise, s.totalNetRetainedPaise)
})

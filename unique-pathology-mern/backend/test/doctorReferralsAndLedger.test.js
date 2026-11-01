import test from 'node:test'
import assert from 'node:assert/strict'
import mongoose from 'mongoose'
import jwt from 'jsonwebtoken'
import { config } from '../src/config/index.js'
import { app } from '../src/server.js'
import { Doctor } from '../src/models/Doctor.js'
import { Booking } from '../src/models/Booking.js'
import { Test } from '../src/models/Test.js'
import { Package } from '../src/models/Package.js'
import { FinancialLedger } from '../src/models/FinancialLedger.js'

let server = null
let baseUrl = ''
let adminJwt = ''

let doctorA = null
let doctorB = null
let doctorAJwt = ''
let doctorBJwt = ''

let testHba1c = null
let pkgFullBody = null

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

  // Seed Diagnostic Tests & Packages with clear MRP
  testHba1c = await Test.findOneAndUpdate(
    { shortCode: 'TEST_HBA1C_REF' },
    {
      name: 'HbA1c Glycated Hemoglobin Test',
      shortCode: 'TEST_HBA1C_REF',
      category: 'Diabetes',
      department: 'Clinical Biochemistry',
      sampleType: 'Venous Blood',
      pricePaise: 50000,
      mrpPaise: 50000,
      isVerifiedPrice: true,
      isActive: true,
    },
    { upsert: true, new: true }
  )

  pkgFullBody = await Package.findOneAndUpdate(
    { name: 'Executive Full Body Health Check' },
    {
      name: 'Executive Full Body Health Check',
      category: 'Comprehensive',
      pricePaise: 120000,
      mrpPaise: 120000,
      isVerifiedPrice: true,
      isActive: true,
    },
    { upsert: true, new: true }
  )

  // Seed Doctor A (20% discount)
  doctorA = await Doctor.findOneAndUpdate(
    { email: 'dr.sharma.test@uniquepathology.example' },
    {
      name: 'Rajesh Sharma',
      email: 'dr.sharma.test@uniquepathology.example',
      mobile: '9826000001',
      password: 'password123',
      discountPercent: 20,
      specialization: 'Internal Medicine',
      qualification: 'MD, MBBS',
      clinicName: 'Sharma Health Clinic',
      status: 'active',
      referralCode: 'SHARMA20',
    },
    { upsert: true, new: true }
  )

  // Seed Doctor B (15% discount)
  doctorB = await Doctor.findOneAndUpdate(
    { email: 'dr.verma.test@uniquepathology.example' },
    {
      name: 'Anjali Verma',
      email: 'dr.verma.test@uniquepathology.example',
      mobile: '9826000002',
      password: 'password123',
      discountPercent: 15,
      specialization: 'Pediatrics',
      qualification: 'DCH, MBBS',
      clinicName: 'Verma Child Care',
      status: 'active',
      referralCode: 'VERMA15',
    },
    { upsert: true, new: true }
  )

  doctorAJwt = jwt.sign(
    { id: doctorA._id.toString(), role: 'doctor', email: doctorA.email },
    config.jwt.secret,
    { expiresIn: '1h' }
  )

  doctorBJwt = jwt.sign(
    { id: doctorB._id.toString(), role: 'doctor', email: doctorB.email },
    config.jwt.secret,
    { expiresIn: '1h' }
  )

  // Clean up any residual test bookings and ledgers for test doctors
  await Booking.deleteMany({
    $or: [{ doctorId: { $in: [doctorA._id, doctorB._id] } }, { doctorName: { $in: [doctorA.name, doctorB.name] } }],
  })
  await FinancialLedger.deleteMany({
    doctorId: { $in: [doctorA._id, doctorB._id] },
  })
})

test.after(async () => {
  if (server) await new Promise((resolve) => server.close(resolve))
  await mongoose.disconnect()
})

test('ADMIN REFERRAL FLOW: Admin creates booking linked to Doctor A with authoritative snapshot pricing', async () => {
  const patientMobile = '9876543210'
  const bookingPayload = {
    patientName: 'Kavita Patel',
    phone: patientMobile,
    email: 'kavita.patel@example.com',
    age: 38,
    gender: 'female',
    date: '2026-11-10',
    timeSlot: '09:00 AM - 11:00 AM',
    collectionType: 'centre',
    doctorId: doctorA._id.toString(),
    doctorName: doctorA.name,
    adminNotes: 'Routine referral for fasting glucose and general screen',
    items: [
      {
        itemType: 'test',
        id: testHba1c._id.toString(),
        name: testHba1c.name,
      },
      {
        itemType: 'package',
        id: pkgFullBody._id.toString(),
        name: pkgFullBody.name,
      },
    ],
  }

  const res = await fetch(`${baseUrl}/admin/bookings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify(bookingPayload),
  })

  assert.equal(res.status, 201)
  const body = await res.json()
  assert.ok(body.booking)

  const b = body.booking
  // Gross MRP = 50,000 + 120,000 = 170,000 paise (₹1,700)
  assert.equal(b.originalMrpPaise, 170000)
  // Doctor A has 20% discount: 20% of 170,000 = 34,000 paise (₹340)
  assert.equal(b.discountAmountPaise, 34000)
  // Final patient bill = 170,000 - 34,000 = 136,000 paise (₹1,360)
  assert.equal(b.totalAmountPaise, 136000)
  assert.equal(b.doctorName, doctorA.name)
  assert.equal(b.settlementStatus, 'pending')

  // Verify item snapshot calculations
  assert.equal(b.items.length, 2)
  const testItem = b.items.find((i) => i.itemType === 'test')
  assert.equal(testItem.mrpPaise, 50000)
  assert.equal(testItem.discountPaise, 10000) // 20% of 50000
  assert.equal(testItem.finalPricePaise, 40000)

  const pkgItem = b.items.find((i) => i.itemType === 'package')
  assert.equal(pkgItem.mrpPaise, 120000)
  assert.equal(pkgItem.discountPaise, 24000) // 20% of 120000
  assert.equal(pkgItem.finalPricePaise, 96000)
})

test('ADMIN REFERRAL FILTERING: Doctor A referrals isolated from Doctor B', async () => {
  // Admin fetch for Doctor A
  const resA = await fetch(`${baseUrl}/admin/referrals?doctorId=${doctorA._id.toString()}`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(resA.status, 200)
  const bodyA = await resA.json()
  assert.ok(bodyA.referrals.length >= 1)
  const kavitaBooking = bodyA.referrals.find((p) => p.patientName === 'Kavita Patel')
  assert.ok(kavitaBooking)
  assert.equal(kavitaBooking.financials.originalMrpPaise, 170000)
  assert.equal(kavitaBooking.doctorDiscountPercent, 20)
  assert.equal(kavitaBooking.financials.patientPayablePaise, 136000)

  // Doctor B statement should have 0 referrals
  const resB = await fetch(`${baseUrl}/admin/doctors-financial-statements?doctorId=${doctorB._id.toString()}`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(resB.status, 200)
  const bodyB = await resB.json()
  const statementB = bodyB.statements.find((s) => s.doctor._id.toString() === doctorB._id.toString())
  assert.ok(statementB)
  assert.equal(statementB.totalReferrals, 0, 'Doctor B must NOT have Doctor A referrals')
})

test('ADMIN REFERRAL LEDGER & FINANCIAL TRANSACTIONS LIFECYCLE', async () => {
  // 1. Admin gets all referrals
  const resAll = await fetch(`${baseUrl}/admin/referrals?doctorId=${doctorA._id.toString()}`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(resAll.status, 200)
  const data = await resAll.json()
  assert.ok(data.referrals.length >= 1)
  const targetBooking = data.referrals.find((r) => r.patientName === 'Kavita Patel')
  assert.ok(targetBooking)
  const bookingId = targetBooking._id

  assert.equal(targetBooking.financials.originalMrpPaise, 170000)
  assert.equal(targetBooking.financials.doctorDiscountPaise, 34000)
  assert.equal(targetBooking.financials.patientPayablePaise, 136000)
  assert.equal(targetBooking.financials.patientPaidPaise, 0)
  assert.equal(targetBooking.financials.patientOutstandingPaise, 136000)

  // 2. Admin records partial payment of 100,000 paise (₹1,000)
  const payRes1 = await fetch(`${baseUrl}/admin/referrals/${bookingId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      amountPaise: 100000,
      paymentMethod: 'UPI',
      transactionReference: 'UPI-TXN-10001',
      notes: 'Partial advance collected via UPI',
    }),
  })
  assert.equal(payRes1.status, 201)
  const payData1 = await payRes1.json()
  assert.equal(payData1.booking.amountPaidPaise, 100000)
  assert.equal(payData1.booking.outstandingAmountPaise, 36000)
  assert.equal(payData1.booking.paymentStatus, 'pending') // Still ₹360 due

  // 3. Admin records remaining balance payment of 36,000 paise (₹360)
  const payRes2 = await fetch(`${baseUrl}/admin/referrals/${bookingId}/payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      amountPaise: 36000,
      paymentMethod: 'Cash',
      notes: 'Counter balance cash clearance',
    }),
  })
  assert.equal(payRes2.status, 201)
  const payData2 = await payRes2.json()
  assert.equal(payData2.booking.amountPaidPaise, 136000)
  assert.equal(payData2.booking.outstandingAmountPaise, 0)
  assert.equal(payData2.booking.paymentStatus, 'paid')

  // 4. Admin records audited partial refund of 20,000 paise (₹200) with mandatory justification
  const refRes = await fetch(`${baseUrl}/admin/referrals/${bookingId}/refund`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      refundAmountPaise: 20000,
      justification: 'Patient requested partial cancellation of lipid panel',
      notes: 'Approved by clinical desk',
      reference: 'BANK-REF-9988',
    }),
  })
  assert.equal(refRes.status, 201)
  const refData = await refRes.json()
  assert.equal(refData.booking.amountRefundedPaise, 20000)

  // 5. Admin records authorized clinical service payment of 15,000 paise (₹150)
  const srvRes = await fetch(`${baseUrl}/admin/referrals/${bookingId}/service-payment`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      amountPaise: 15000,
      category: 'CLINICAL_SPECIMEN_COLLECTION',
      agreementRef: 'SLA-CENTRE-2026-004',
      justification: 'Verified clinical venipuncture performed at affiliated clinic per contractual agreement',
      paymentReference: 'NEFT-DOC-2026-99',
      notes: 'Quarterly clinical collection disbursement',
    }),
  })
  assert.equal(srvRes.status, 201)
  const srvData = await srvRes.json()
  assert.equal(srvData.booking.authorizedServicePaymentPaise, 15000)

  // 6. Admin updates settlement status to settled
  const stlRes = await fetch(`${baseUrl}/admin/referrals/${bookingId}/settlement`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${adminJwt}`,
    },
    body: JSON.stringify({
      settlementStatus: 'settled',
      notes: 'Account fully reconciled with clinic statement',
    }),
  })
  assert.equal(stlRes.status, 200)
  const stlData = await stlRes.json()
  assert.equal(stlData.booking.settlementStatus, 'settled')

  // 7. Verify full detail endpoint and immutable ledger entries
  const detailRes = await fetch(`${baseUrl}/admin/referrals/${bookingId}`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(detailRes.status, 200)
  const detailData = await detailRes.json()

  // Verify financial ledger integrity:
  // Payments: 100,000 + 36,000 = 136,000
  // Refund: 20,000
  // Service: 15,000
  // Retained: 136,000 - 20,000 - 15,000 = 101,000 paise (₹1,010)
  assert.equal(detailData.financials.patientPaidPaise, 136000)
  assert.equal(detailData.financials.patientRefundedPaise, 20000)
  assert.equal(detailData.financials.authorizedServicePaymentPaise, 15000)
  assert.equal(detailData.financials.labNetRetainedPaise, 101000)

  // Ledger entries must contain all 4 operations: 2 payments, 1 refund, 1 service payment
  const ledgers = detailData.ledgerEntries
  assert.equal(ledgers.length, 4)
  const paymentEntries = ledgers.filter((l) => l.entryType === 'PATIENT_PAYMENT')
  assert.equal(paymentEntries.length, 2)
  const refundEntries = ledgers.filter((l) => l.entryType === 'PATIENT_REFUND')
  assert.equal(refundEntries.length, 1)
  const serviceEntries = ledgers.filter((l) => l.entryType === 'AUTHORIZED_SERVICE_PAYMENT')
  assert.equal(serviceEntries.length, 1)

  // 8. Verify Doctor-Wise Financial Statement aggregation
  const stmtRes = await fetch(`${baseUrl}/admin/doctors-financial-statements?doctorId=${doctorA._id.toString()}`, {
    headers: { Authorization: `Bearer ${adminJwt}` },
  })
  assert.equal(stmtRes.status, 200)
  const stmtData = await stmtRes.json()
  assert.equal(stmtData.statements.length, 1)

  const docStatement = stmtData.statements[0]
  assert.equal(docStatement.doctor.name, 'Rajesh Sharma')
  assert.equal(docStatement.totalReferrals, 1)
  assert.equal(docStatement.financials.totalMrpPaise, 170000)
  assert.equal(docStatement.financials.totalDoctorDiscountPaise, 34000)
  assert.equal(docStatement.financials.totalPatientBillingPaise, 136000)
  assert.equal(docStatement.financials.totalCollectedPaise, 136000)
  assert.equal(docStatement.financials.totalRefundsPaise, 20000)
  assert.equal(docStatement.financials.totalAuthorizedServicePaymentsPaise, 15000)
  assert.equal(docStatement.financials.totalLabNetRetainedPaise, 101000)
  assert.equal(docStatement.settlementCounts.settled, 1)
})

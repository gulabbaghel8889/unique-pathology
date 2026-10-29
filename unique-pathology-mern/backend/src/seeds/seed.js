import 'dotenv/config'
import mongoose from 'mongoose'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import bcrypt from 'bcryptjs'
import { config } from '../config/index.js'
import { Test } from '../models/Test.js'
import { Package } from '../models/Package.js'
import { Booking } from '../models/Booking.js'
import { Report } from '../models/Report.js'
import { Doctor } from '../models/Doctor.js'
import { AuditLog } from '../models/AuditLog.js'
import { demoTests, demoPackages, demoDoctors } from './seedData.js'

export async function runSeed() {
  console.log(`Connecting to MongoDB at: ${config.mongoUri}`)
  await mongoose.connect(config.mongoUri)

  console.log('Seeding diagnostic tests...')
  await Test.deleteMany({})
  const insertedTests = await Test.insertMany(demoTests)
  console.log(`Inserted ${insertedTests.length} tests.`)

  console.log('Seeding health packages...')
  await Package.deleteMany({})
  const insertedPackages = await Package.insertMany(demoPackages)
  console.log(`Inserted ${insertedPackages.length} packages.`)

  console.log('Seeding sample demo booking...')
  await Booking.deleteMany({ reference: 'UP-DEMO-2026' })
  const sampleBooking = await Booking.create({
    reference: 'UP-DEMO-2026',
    patientName: 'Demo Patient',
    phone: '9876543210',
    email: 'patient.demo@uniquepathology.example',
    age: 34,
    gender: 'female',
    items: [
      {
        itemType: 'test',
        name: 'Complete Blood Count (CBC)',
        code: 'CBC',
        pricePaise: 35000,
        isVerifiedPrice: false,
      },
    ],
    totalAmountPaise: 35000,
    hasUnverifiedPrices: true,
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '07:00 AM - 09:00 AM',
    collectionType: 'centre',
    status: 'completed',
    paymentStatus: 'paid',
    consent: true,
    adminNotes: 'Sample seeded record for test report lookup demonstration.',
  })
  console.log(`Created sample booking: ${sampleBooking.reference}`)

  // Seed sample report in storage
  const sampleStorageKey = 'sample-demo-report.pdf'
  const reportPath = path.join(config.storage.reportsDir, sampleStorageKey)
  if (fs.existsSync(reportPath)) {
    await Report.deleteMany({ bookingReference: 'UP-DEMO-2026' })
    const stats = fs.statSync(reportPath)
    const fileBuf = fs.readFileSync(reportPath)
    const checksum = crypto.createHash('sha256').update(fileBuf).digest('hex')

    await Report.create({
      bookingId: sampleBooking._id,
      bookingReference: sampleBooking.reference,
      patientPhone: sampleBooking.phone,
      patientName: sampleBooking.patientName,
      reportTitle: 'Complete Blood Count Report (Demo)',
      testNames: ['Complete Blood Count (CBC)'],
      fileName: 'UniquePathology_CBC_Report_Demo.pdf',
      storageKey: sampleStorageKey,
      mimeType: 'application/pdf',
      fileSizeBytes: stats.size,
      checksumSha256: checksum,
      status: 'released',
      uploadedBy: config.admin.email,
      auditLogs: [
        {
          action: 'uploaded',
          performedBy: 'admin',
          details: 'Initial seed report uploaded for reference UP-DEMO-2026',
        },
      ],
    })
    console.log(`Linked sample demo report for booking: ${sampleBooking.reference}`)
  }

  console.log('Seeding doctors...')
  await Doctor.deleteMany({})
  const seededDoctors = []
  for (const docData of demoDoctors) {
    const hashedPassword = await bcrypt.hash(docData.password, 12)
    const doctor = await Doctor.create({
      ...docData,
      password: hashedPassword,
    })
    seededDoctors.push(doctor)
    console.log(`Created doctor: ${doctor.name} (${doctor.discountPercent}% discount) - ${doctor.email}`)
  }

  // Seed sample referrals for each doctor
  const docA = seededDoctors[0] // Dr. Ananya (10%)
  const docB = seededDoctors[1] // Dr. Bharat (20%)
  const docC = seededDoctors[2] // Dr. Chitra (15%)

  if (docA && docB && docC) {
    await Booking.deleteMany({ reference: { $in: ['UP-DOC-ANANYA-01', 'UP-DOC-BHARAT-01', 'UP-DOC-CHITRA-01'] } })

    // Dr. Ananya referral (10% discount on CBC ₹350 -> ₹315)
    const subtotalA = 35000
    const discountA = Math.round(subtotalA * (docA.discountPercent / 100))
    const totalA = subtotalA - discountA
    await Booking.create({
      reference: 'UP-DOC-ANANYA-01',
      patientName: 'Ramesh Verma',
      phone: '9876500001',
      email: 'ramesh.v@example.com',
      age: 42,
      gender: 'male',
      items: [{ itemType: 'test', name: 'Complete Blood Count (CBC)', code: 'CBC', pricePaise: subtotalA, isVerifiedPrice: false }],
      subtotalPaise: subtotalA,
      discountAmountPaise: discountA,
      totalAmountPaise: totalA,
      hasUnverifiedPrices: true,
      doctorId: docA._id,
      doctorName: docA.name,
      doctorDiscountPercent: docA.discountPercent,
      referredBy: 'doctor',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '07:00 AM - 09:00 AM',
      collectionType: 'centre',
      status: 'completed',
      paymentStatus: 'paid',
      consent: true,
      adminNotes: `Referred by ${docA.name} with ${docA.discountPercent}% clinic discount`,
    })
    docA.totalReferredPatients = 1
    docA.totalTestsReferred = 1
    docA.totalRevenuePaise = totalA
    docA.totalEarningsPaise = Math.round(subtotalA * ((docA.commissionPercent || 0) / 100))
    await docA.save()

    // Dr. Bharat referral (20% discount on Lipid Profile ₹650 + HbA1c ₹450 = ₹1100 -> ₹880)
    const subtotalB = 110000
    const discountB = Math.round(subtotalB * (docB.discountPercent / 100))
    const totalB = subtotalB - discountB
    await Booking.create({
      reference: 'UP-DOC-BHARAT-01',
      patientName: 'Suresh Chandra',
      phone: '9876500002',
      email: 'suresh.c@example.com',
      age: 58,
      gender: 'male',
      items: [
        { itemType: 'test', name: 'Lipid Profile (Full Panel)', code: 'LIPID', pricePaise: 65000, isVerifiedPrice: false },
        { itemType: 'test', name: 'HbA1c (Glycated Hemoglobin)', code: 'HbA1c', pricePaise: 45000, isVerifiedPrice: false },
      ],
      subtotalPaise: subtotalB,
      discountAmountPaise: discountB,
      totalAmountPaise: totalB,
      hasUnverifiedPrices: true,
      doctorId: docB._id,
      doctorName: docB.name,
      doctorDiscountPercent: docB.discountPercent,
      referredBy: 'doctor',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '09:00 AM - 11:00 AM',
      collectionType: 'home',
      address: 'House 44, Near Industrial Gate 1, Mandideep',
      city: 'Mandideep',
      status: 'confirmed',
      paymentStatus: 'paid',
      consent: true,
      adminNotes: `Referred by ${docB.name} (Cardiac Evaluation) with ${docB.discountPercent}% discount`,
    })
    docB.totalReferredPatients = 1
    docB.totalTestsReferred = 2
    docB.totalRevenuePaise = totalB
    docB.totalEarningsPaise = Math.round(subtotalB * ((docB.commissionPercent || 0) / 100))
    await docB.save()

    // Dr. Chitra referral (15% discount on Thyroid Profile ₹550 -> ₹468)
    const subtotalC = 55000
    const discountC = Math.round(subtotalC * (docC.discountPercent / 100))
    const totalC = subtotalC - discountC
    await Booking.create({
      reference: 'UP-DOC-CHITRA-01',
      patientName: 'Pooja Tiwari',
      phone: '9876500003',
      email: 'pooja.t@example.com',
      age: 29,
      gender: 'female',
      items: [{ itemType: 'test', name: 'Thyroid Profile Total (T3, T4, TSH)', code: 'THYROID-3', pricePaise: subtotalC, isVerifiedPrice: false }],
      subtotalPaise: subtotalC,
      discountAmountPaise: discountC,
      totalAmountPaise: totalC,
      hasUnverifiedPrices: true,
      doctorId: docC._id,
      doctorName: docC.name,
      doctorDiscountPercent: docC.discountPercent,
      referredBy: 'doctor',
      date: new Date().toISOString().slice(0, 10),
      timeSlot: '11:00 AM - 01:00 PM',
      collectionType: 'centre',
      status: 'processing',
      paymentStatus: 'pending',
      consent: true,
      adminNotes: `Referred by ${docC.name} with ${docC.discountPercent}% maternal discount`,
    })
    docC.totalReferredPatients = 1
    docC.totalTestsReferred = 1
    docC.totalRevenuePaise = totalC
    docC.totalEarningsPaise = Math.round(subtotalC * ((docC.commissionPercent || 0) / 100))
    await docC.save()

    console.log('Seeded sample referred bookings for Dr. Ananya, Dr. Bharat, and Dr. Chitra.')
  }

  await AuditLog.create({
    action: 'seed_database',
    category: 'system',
    performedBy: 'seed_script',
    details: {
      testsCount: insertedTests.length,
      packagesCount: insertedPackages.length,
      doctorsCount: seededDoctors.length,
    },
  })

  console.log('\nSeed completed successfully!')
  console.log('--- ADMIN LOGIN CREDENTIALS ---')
  console.log(`Email:    ${config.admin.email}`)
  console.log(`Password: UniqueAdmin@2026`)
  console.log('--- DEMO DOCTOR LOGIN CREDENTIALS ---')
  console.log(`Doctor A (10% discount): doctor.ananya@uniquepathology.example (or 9826011111) | Pwd: Doctor@123`)
  console.log(`Doctor B (20% discount): doctor.bharat@uniquepathology.example (or 9826022222) | Pwd: Doctor@123`)
  console.log(`Doctor C (15% discount): doctor.chitra@uniquepathology.example (or 9826033333) | Pwd: Doctor@123`)
  console.log('--- DEMO REPORT LOOKUP ---')
  console.log(`Reference: UP-DEMO-2026`)
  console.log(`Phone:     9876543210`)
  console.log('-------------------------------\n')
}

// Execute if run directly
if (process.argv[1] && process.argv[1].endsWith('seed.js')) {
  runSeed()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('Seed script error:', err.message)
      process.exit(1)
    })
}

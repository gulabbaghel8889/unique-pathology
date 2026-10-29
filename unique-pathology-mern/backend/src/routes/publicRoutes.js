import express from 'express'
import { config } from '../config/index.js'
import { Doctor } from '../models/Doctor.js'

export const publicRouter = express.Router()

publicRouter.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    service: 'Unique Pathology Diagnostics API',
    location: `${config.business.city}, ${config.business.state}, India`,
    timestamp: new Date().toISOString(),
    uptimeSeconds: Math.floor(process.uptime()),
  })
})

publicRouter.get('/config/public', (_req, res) => {
  res.json({
    business: {
      name: config.business.name,
      shortName: config.business.shortName,
      tagline: config.business.tagline,
      city: config.business.city,
      district: config.business.district,
      state: config.business.state,
      country: config.business.country,
      address: config.business.address,
      phone: config.business.phone,
      email: config.business.email,
      whatsappNumber: config.business.whatsappNumber,
      timings: config.business.timings,
      homeCollectionHours: config.business.homeCollectionHours,
      isPhoneVerified: config.business.isPhoneVerified,
      isWhatsAppConfigured: config.business.isWhatsAppConfigured,
      disclaimer: config.business.disclaimer,
    },
    features: {
      onlinePaymentAvailable: config.razorpay.isConfigured,
      razorpayKeyId: config.razorpay.keyId || null,
      secureReportLookupAvailable: true,
      homeSampleCollectionAvailable: true,
    },
  })
})

publicRouter.get('/departments', (_req, res) => {
  const departments = [
    {
      id: 'biochemistry',
      name: 'Clinical Biochemistry',
      description: 'Metabolic markers, blood glucose, lipid profiles, renal and liver function assays.',
      icon: 'Activity',
      commonTests: ['Lipid Profile', 'Liver Function Test (LFT)', 'Kidney Function Test (KFT)', 'HbA1c', 'FBS'],
    },
    {
      id: 'hematology',
      name: 'Hematology',
      description: 'Cellular blood profiling, red/white blood cell morphometry, platelet counts, and hemoglobin metrics.',
      icon: 'Microscope',
      commonTests: ['Complete Blood Count (CBC)', 'ESR', 'Peripheral Smear', 'Blood Group & Rh'],
    },
    {
      id: 'endocrinology',
      name: 'Endocrinology & Hormones',
      description: 'Thyroid hormones, reproductive markers, vitamin assays, and metabolic endocrine indicators.',
      icon: 'TestTube2',
      commonTests: ['Thyroid Profile (T3, T4, TSH)', 'Vitamin D 25-OH', 'Vitamin B12', 'Serum Ferritin'],
    },
    {
      id: 'clinical-pathology',
      name: 'Clinical Pathology',
      description: 'Microscopic and biochemical examination of urine, fluids, and sediment for diagnostic clarity.',
      icon: 'FlaskConical',
      commonTests: ['Urine Routine & Microscopic (R/M)', 'Stool Routine', 'Occult Blood', 'Specific Gravity'],
    },
    {
      id: 'immunology-serology',
      name: 'Immunology & Serology',
      description: 'Antigen-antibody screening, infectious serology, and rapid diagnostic panels.',
      icon: 'ShieldCheck',
      commonTests: ['Widal Test', 'Dengue NS1 Antigen', 'Typhoid Serology', 'CRP Quantitative'],
    },
    {
      id: 'preventive-health',
      name: 'Preventive Health Checkups',
      description: 'Systematic health packages designed for annual wellness, executive checkups, and senior care.',
      icon: 'HeartPulse',
      commonTests: ['Basic Wellness Screening', 'Executive Health Check', 'Senior Citizen Care Profile'],
    },
  ]

  res.json({ departments })
})

// Public list of active verified doctors for patient booking referral
publicRouter.get('/doctors/active', async (_req, res, next) => {
  try {
    const doctors = await Doctor.find({ status: 'active' })
      .select('name specialization qualification clinicName referralCode')
      .sort({ name: 1 })
      .lean()

    res.json({ doctors })
  } catch (err) {
    next(err)
  }
})


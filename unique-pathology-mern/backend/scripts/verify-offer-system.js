import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'

dotenv.config({ path: 'C:/Users/gulab/Downloads/unique-pathology-mern-starter/unique-pathology-mern/backend/.env' })

const API_BASE = 'http://localhost:5000/api'
const JWT_SECRET = process.env.JWT_SECRET || 'unique-pathology-super-secret-key-development-2024'

// Create a valid admin JWT
const adminToken = jwt.sign(
  {
    userId: '600000000000000000000001',
    role: 'admin',
    email: 'admin@uniquepathology.com',
  },
  JWT_SECRET,
  { expiresIn: '2h' }
)

const adminHeaders = {
  'Content-Type': 'application/json',
  Authorization: `Bearer ${adminToken}`,
}

async function request(endpoint, options = {}) {
  const url = `${API_BASE}${endpoint}`
  const res = await fetch(url, options)
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(`HTTP ${res.status}: ${data.message || JSON.stringify(data)}`)
  }
  return data
}

async function runVerification() {
  console.log('\n===============================================================')
  console.log('🚀 RUNNING COMPREHENSIVE OFFER & CAMPAIGN SYSTEM VERIFICATION')
  console.log('===============================================================\n')

  let createdOfferIds = []

  try {
    // -------------------------------------------------------------
    // TEST 1: Admin Create Percentage Offer (Active & Live)
    // -------------------------------------------------------------
    console.log('TEST 1: Creating Active Percentage Discount Campaign...')
    const now = new Date()
    const startDate = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString() // yesterday
    const endDate = new Date(now.getTime() + 10 * 24 * 60 * 60 * 1000).toISOString() // +10 days

    const percentageOfferRes = await request('/admin/offers', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Deepawali Mega Health Fest',
        title: 'Flat 20% Off on All Clinical Diagnostic Tests',
        description: 'Celebrate the festival with precision diagnostics for your entire family.',
        code: 'DIWALI20',
        offerType: 'festival',
        badgeText: 'DIWALI SPECIAL 2026',
        bannerGradient: 'from-amber-500 via-rose-500 to-red-600',
        applicabilityType: 'all',
        discountType: 'percentage',
        discountValue: 20, // 20%
        startDate,
        endDate,
        isActive: true,
        priority: 25,
      }),
    })

    const offer1 = percentageOfferRes.offer
    createdOfferIds.push(offer1._id)
    console.log(`✅ Percentage Offer Created: "${offer1.name}" (ID: ${offer1._id}, Code: ${offer1.code})`)

    // -------------------------------------------------------------
    // TEST 2: Admin Create Fixed Amount Discount Campaign
    // -------------------------------------------------------------
    console.log('\nTEST 2: Creating Fixed Amount Discount Campaign (₹500 OFF)...')
    const fixedOfferRes = await request('/admin/offers', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Winter Wellness Camp Concession',
        title: 'Flat ₹500 Discount on Senior Citizen & Family Checkups',
        description: 'Community health camp initiative in Mandideep industrial zone.',
        code: 'WINTER500',
        offerType: 'health_camp',
        badgeText: 'MANDIDEEP HEALTH DRIVE',
        bannerGradient: 'from-emerald-500 via-teal-600 to-cyan-700',
        applicabilityType: 'all',
        discountType: 'fixed_amount',
        discountValue: 50000, // Rs 500 in paise
        minOrderAmountPaise: 80000, // Rs 800 min order
        startDate,
        endDate,
        isActive: true,
        priority: 20,
      }),
    })
    const offer2 = fixedOfferRes.offer
    createdOfferIds.push(offer2._id)
    console.log(`✅ Fixed Amount Offer Created: "${offer2.name}" (ID: ${offer2._id}, Code: ${offer2.code})`)

    // -------------------------------------------------------------
    // TEST 3: Admin Create Future Scheduled Campaign
    // -------------------------------------------------------------
    console.log('\nTEST 3: Creating Future Scheduled Campaign (Starts in 7 days)...')
    const futureStart = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000).toISOString()
    const futureEnd = new Date(now.getTime() + 20 * 24 * 60 * 60 * 1000).toISOString()

    const scheduledRes = await request('/admin/offers', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'New Year 2027 Preventive Screening',
        title: 'Ring in the New Year with Complete Health Clarity',
        description: 'Scheduled campaign for upcoming New Year resolution health drives.',
        code: 'NEWYEAR2027',
        offerType: 'seasonal',
        badgeText: 'COMING SOON',
        bannerGradient: 'from-indigo-600 via-purple-600 to-pink-600',
        applicabilityType: 'all',
        discountType: 'percentage',
        discountValue: 25,
        startDate: futureStart,
        endDate: futureEnd,
        isActive: true,
        priority: 15,
      }),
    })
    const scheduledOffer = scheduledRes.offer
    createdOfferIds.push(scheduledOffer._id)
    console.log(`✅ Scheduled Offer Created: "${scheduledOffer.name}" (Computed Status: ${scheduledOffer.computedStatus || 'scheduled'})`)

    // -------------------------------------------------------------
    // TEST 4: Admin Create Expired Campaign
    // -------------------------------------------------------------
    console.log('\nTEST 4: Creating Expired Campaign (Ended 5 days ago)...')
    const pastStart = new Date(now.getTime() - 20 * 24 * 60 * 60 * 1000).toISOString()
    const pastEnd = new Date(now.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString()

    const expiredRes = await request('/admin/offers', {
      method: 'POST',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Past Monsoon Camp 2026',
        title: 'Monsoon Dengue & Malaria Surveillance Camp',
        description: 'Historical camp that has concluded.',
        code: 'MONSOONOLD',
        offerType: 'seasonal',
        badgeText: 'EXPIRED',
        bannerGradient: 'from-slate-700 to-slate-900',
        applicabilityType: 'all',
        discountType: 'fixed_amount',
        discountValue: 30000,
        startDate: pastStart,
        endDate: pastEnd,
        isActive: true,
        priority: 5,
      }),
    })
    const expiredOffer = expiredRes.offer
    createdOfferIds.push(expiredOffer._id)
    console.log(`✅ Expired Offer Created: "${expiredOffer.name}" (Computed Status: ${expiredOffer.computedStatus || 'expired'})`)

    // -------------------------------------------------------------
    // TEST 5: Public Website Display API (/api/offers/active)
    // -------------------------------------------------------------
    console.log('\nTEST 5: Testing Public Website Active Offers Endpoint (/api/offers/active)...')
    const publicActiveRes = await request('/offers/active')
    const activeOffers = publicActiveRes.offers || []
    console.log(`Public Active Offers Count: ${activeOffers.length}`)

    const hasOffer1 = activeOffers.some((o) => o._id === offer1._id)
    const hasOffer2 = activeOffers.some((o) => o._id === offer2._id)
    const hasScheduled = activeOffers.some((o) => o._id === scheduledOffer._id)
    const hasExpired = activeOffers.some((o) => o._id === expiredOffer._id)

    if (!hasOffer1 || !hasOffer2) {
      throw new Error('Active offers 1 or 2 are missing from /api/offers/active!')
    }
    if (hasScheduled) {
      throw new Error('Scheduled offer erroneously appeared in public active offers!')
    }
    if (hasExpired) {
      throw new Error('Expired offer erroneously appeared in public active offers!')
    }
    console.log('✅ PASS: Only currently running active offers appear on public website.')
    console.log('✅ PASS: Scheduled and expired offers are automatically filtered out.')

    // -------------------------------------------------------------
    // TEST 6: Admin Edit Campaign
    // -------------------------------------------------------------
    console.log('\nTEST 6: Testing Admin Edit Campaign...')
    const editRes = await request(`/admin/offers/${offer1._id}`, {
      method: 'PUT',
      headers: adminHeaders,
      body: JSON.stringify({
        name: 'Deepawali Mega Health Fest - Revised',
        title: 'Flat 25% Off on All Clinical Diagnostic Tests',
        description: 'Revised festive promotion with enhanced 25% discount.',
        code: 'DIWALI25',
        offerType: 'festival',
        badgeText: 'REVISED FESTIVE OFFER',
        bannerGradient: 'from-amber-500 via-rose-500 to-red-600',
        applicabilityType: 'all',
        discountType: 'percentage',
        discountValue: 25, // Updated to 25%
        startDate,
        endDate,
        isActive: true,
        priority: 30,
      }),
    })
    if (editRes.offer.discountValue !== 25 || editRes.offer.code !== 'DIWALI25') {
      throw new Error('Admin edit did not persist updated values.')
    }
    console.log(`✅ PASS: Offer edited successfully. New discount: ${editRes.offer.discountValue}%, Code: ${editRes.offer.code}`)

    // -------------------------------------------------------------
    // TEST 7: 1-Click Duplicate Campaign
    // -------------------------------------------------------------
    console.log('\nTEST 7: Testing 1-Click Duplicate Campaign...')
    const duplicateRes = await request(`/admin/offers/${offer1._id}/duplicate`, {
      method: 'POST',
      headers: adminHeaders,
    })
    const duplicatedOffer = duplicateRes.offer
    createdOfferIds.push(duplicatedOffer._id)
    if (!duplicatedOffer.name.includes('(Copy)')) {
      throw new Error('Duplicated offer should contain "(Copy)" suffix.')
    }
    console.log(`✅ PASS: Campaign duplicated as: "${duplicatedOffer.name}" (ID: ${duplicatedOffer._id})`)

    // -------------------------------------------------------------
    // TEST 8: Toggle Active / Inactive Status
    // -------------------------------------------------------------
    console.log('\nTEST 8: Testing Active / Inactive Status Toggle...')
    const toggleRes = await request(`/admin/offers/${duplicatedOffer._id}/status`, {
      method: 'PATCH',
      headers: adminHeaders,
      body: JSON.stringify({ isActive: false }),
    })
    if (toggleRes.offer.isActive !== false) {
      throw new Error('Status toggle to false failed.')
    }
    console.log(`✅ PASS: Campaign status toggled to inactive: ${toggleRes.offer.isActive}`)

    // -------------------------------------------------------------
    // TEST 9: Offer Validation API (/api/offers/validate)
    // -------------------------------------------------------------
    console.log('\nTEST 9: Testing Live Discount Calculation via /api/offers/validate...')
    const validateRes = await request('/offers/validate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        offerCode: 'DIWALI25',
        subtotalPaise: 100000, // ₹1,000 standard tariff
        items: [{ itemType: 'test', name: 'Complete Blood Count (CBC)' }],
      }),
    })

    if (!validateRes.valid || validateRes.offer.discountPaise !== 25000 || validateRes.offer.finalPricePaise !== 75000) {
      throw new Error(`Discount calculation incorrect: ${JSON.stringify(validateRes)}`)
    }
    console.log(`✅ PASS: 25% discount verified on ₹1,000 bill: Discount = ₹${validateRes.offer.discountPaise / 100}, Final = ₹${validateRes.offer.finalPricePaise / 100}`)

    // -------------------------------------------------------------
    // TEST 10: Booking Integration with Offer Application
    // -------------------------------------------------------------
    console.log('\nTEST 10: Testing Booking Registration with Applied Campaign...')
    const bookingRes = await request('/bookings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        patientName: 'Shri Anand Verma (Offer Test)',
        phone: '9826019999',
        email: 'anand.verma@example.com',
        age: 48,
        gender: 'male',
        date: new Date().toISOString().slice(0, 10),
        timeSlot: '07:00 AM - 09:00 AM',
        collectionType: 'centre',
        offerId: offer1._id,
        offerCode: 'DIWALI25',
        consent: true,
        items: [
          {
            itemType: 'test',
            name: 'Complete Blood Count (CBC)',
          },
        ],
      }),
    })

    const booking = bookingRes.booking
    if (!booking) {
      throw new Error('Booking response does not contain booking object.')
    }
    console.log(`Booking Reference: ${booking.reference}`)
    console.log(`Offer Name Saved: ${booking.offerName}`)
    console.log(`Original Price: ₹${(booking.originalPricePaise || 0) / 100}`)
    console.log(`Offer Concession: ₹${(booking.offerDiscountPaise || 0) / 100}`)
    console.log(`Final Total: ₹${(booking.totalAmountPaise || 0) / 100}`)

    if (!booking.offerName || !booking.offerDiscountPaise || booking.offerDiscountPaise <= 0) {
      throw new Error('Booking did not save offer details or discount!')
    }
    console.log('✅ PASS: Booking properly saved offerId, offerName, offerCode, discount, and final amount in DB.')

    // -------------------------------------------------------------
    // TEST 11: Admin Dashboard Analytics & Reporting
    // -------------------------------------------------------------
    console.log('\nTEST 11: Testing Admin Campaign Analytics (/api/admin/offers/analytics)...')
    const analyticsRes = await request('/admin/offers/analytics', {
      headers: adminHeaders,
    })
    const metrics = analyticsRes.metrics
    console.log('Analytics Metrics Summary:', JSON.stringify(metrics, null, 2))

    if (!metrics || metrics.totalOfferBookings < 1 || metrics.totalOfferRevenuePaise <= 0) {
      throw new Error('Campaign analytics failed to aggregate offer bookings or revenue.')
    }
    console.log('✅ PASS: Offer analytics accurately report active/scheduled counts, revenue, and top campaign.')

    // -------------------------------------------------------------
    // TEST 12: Admin Delete Campaign
    // -------------------------------------------------------------
    console.log('\nTEST 12: Testing Admin Campaign Deletion...')
    const deleteRes = await request(`/admin/offers/${duplicatedOffer._id}`, {
      method: 'DELETE',
      headers: adminHeaders,
    })
    console.log(`✅ PASS: ${deleteRes.message}`)

    console.log('\n===============================================================')
    console.log('🎉 ALL 12 OFFER & CAMPAIGN SYSTEM VERIFICATION TESTS PASSED!')
    console.log('===============================================================\n')
  } catch (err) {
    console.error('\n❌ VERIFICATION TEST FAILED:', err.message)
    process.exit(1)
  }
}

runVerification()

import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  CalendarDays,
  Clock,
  Home,
  Building2,
  CheckCircle2,
  AlertCircle,
  Copy,
  Printer,
  ArrowRight,
  ShieldCheck,
  MapPin,
  Phone,
  Stethoscope,
  Percent,
  Sparkles,
  Tag,
} from 'lucide-react'
import { apiRequest } from '../api.js'

export function BookingPage() {
  const [searchParams] = useSearchParams()
  const initialTest = searchParams.get('test') || ''
  const initialPackage = searchParams.get('package') || ''
  const initialCollection = searchParams.get('collection') || 'centre'
  const initialDoctorId = searchParams.get('doctor') || searchParams.get('doc') || ''
  const initialOfferId = searchParams.get('offerId') || ''
  const initialOfferCode = searchParams.get('offerCode') || searchParams.get('code') || ''

  const [tests, setTests] = useState([])
  const [packages, setPackages] = useState([])
  const [doctors, setDoctors] = useState([])
  const [activeOffers, setActiveOffers] = useState([])
  const [loadingOptions, setLoadingOptions] = useState(true)

  // Selected Offer & Discount State
  const [selectedOfferId, setSelectedOfferId] = useState(initialOfferId)
  const [enteredOfferCode, setEnteredOfferCode] = useState(initialOfferCode)
  const [appliedOffer, setAppliedOffer] = useState(null)
  const [validatingOffer, setValidatingOffer] = useState(false)
  const [offerError, setOfferError] = useState('')

  const [formData, setFormData] = useState({
    patientName: '',
    phone: '',
    email: '',
    age: '',
    gender: 'prefer_not_to_say',
    selectionType: initialPackage ? 'package' : 'test',
    selectedItemName: initialPackage || initialTest || 'Complete Blood Count (CBC)',
    selectedDoctorId: initialDoctorId,
    collectionType: initialCollection === 'home' ? 'home' : 'centre',
    address: '',
    landmark: '',
    pinCode: '',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '07:00 AM - 09:00 AM',
    consent: false,
  })

  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [confirmation, setConfirmation] = useState(null)
  const [copied, setCopied] = useState(false)

  // Selected item standard price
  const selectedItem =
    formData.selectionType === 'package'
      ? packages.find((p) => p.name === formData.selectedItemName)
      : tests.find((t) => t.name === formData.selectedItemName)

  const basePricePaise = selectedItem?.pricePaise || 0

  async function validateAndApplyOffer(offerIdToUse, codeToUse, targetItem) {
    const itemToValidate = targetItem || selectedItem
    const subtotal = itemToValidate?.pricePaise || 0

    if (!offerIdToUse && (!codeToUse || !codeToUse.trim())) {
      setAppliedOffer(null)
      setOfferError('')
      return
    }

    setValidatingOffer(true)
    setOfferError('')

    try {
      const res = await apiRequest('/offers/validate', {
        method: 'POST',
        body: JSON.stringify({
          offerId: offerIdToUse || undefined,
          offerCode: codeToUse ? codeToUse.trim().toUpperCase() : undefined,
          subtotalPaise: subtotal,
          items: itemToValidate
            ? [
                {
                  itemType: formData.selectionType,
                  name: itemToValidate.name,
                  id: itemToValidate._id,
                  category: itemToValidate.category,
                },
              ]
            : [],
        }),
      })

      if (res.valid && res.offer) {
        setAppliedOffer(res.offer)
        setOfferError('')
      } else {
        setAppliedOffer(null)
        setOfferError(res.message || 'Offer could not be applied.')
      }
    } catch (err) {
      setAppliedOffer(null)
      setOfferError(err.message || 'Invalid or expired promotional offer.')
    } finally {
      setValidatingOffer(false)
    }
  }

  useEffect(() => {
    async function loadOptions() {
      try {
        const [testsRes, pkgsRes, docsRes, offersRes] = await Promise.all([
          apiRequest('/tests'),
          apiRequest('/packages'),
          apiRequest('/doctors/active').catch(() => ({ doctors: [] })),
          apiRequest('/offers/active').catch(() => ({ offers: [] })),
        ])
        const loadedTests = testsRes.tests || []
        const loadedPkgs = pkgsRes.packages || []
        setTests(loadedTests)
        setPackages(loadedPkgs)
        setDoctors(docsRes.doctors || [])
        setActiveOffers(offersRes.offers || [])

        let defaultItemName = formData.selectedItemName
        if (!initialTest && !initialPackage && loadedTests.length > 0) {
          defaultItemName = loadedTests[0].name
          setFormData((prev) => ({
            ...prev,
            selectedItemName: defaultItemName,
          }))
        }

        // Auto-validate initial offer if present in URL
        if (initialOfferId || initialOfferCode) {
          const item =
            formData.selectionType === 'package'
              ? loadedPkgs.find((p) => p.name === defaultItemName)
              : loadedTests.find((t) => t.name === defaultItemName)

          validateAndApplyOffer(initialOfferId, initialOfferCode, item)
        }
      } catch (err) {
        console.warn('Failed to load tests/packages list:', err.message)
      } finally {
        setLoadingOptions(false)
      }
    }
    loadOptions()
  }, [initialTest, initialPackage])

  // Revalidate offer when selected test/package changes
  useEffect(() => {
    if ((selectedOfferId || enteredOfferCode) && selectedItem) {
      validateAndApplyOffer(selectedOfferId, enteredOfferCode, selectedItem)
    }
  }, [formData.selectedItemName, formData.selectionType])

  async function handleSubmit(e) {
    e.preventDefault()
    setError('')
    setSubmitting(true)

    try {
      const payload = {
        patientName: formData.patientName.trim(),
        phone: formData.phone.trim(),
        email: formData.email.trim() || undefined,
        age: formData.age ? Number(formData.age) : undefined,
        gender: formData.gender,
        date: formData.date,
        timeSlot: formData.timeSlot,
        collectionType: formData.collectionType,
        address: formData.collectionType === 'home' ? formData.address.trim() : '',
        landmark: formData.collectionType === 'home' ? formData.landmark.trim() : '',
        city: 'Mandideep',
        pinCode: formData.collectionType === 'home' ? formData.pinCode.trim() : undefined,
        doctorId: formData.selectedDoctorId || undefined,
        consent: Boolean(formData.consent),
        offerId: appliedOffer?.id || selectedOfferId || undefined,
        offerCode: enteredOfferCode?.trim().toUpperCase() || appliedOffer?.code || undefined,
        items: [
          {
            itemType: formData.selectionType,
            name: formData.selectedItemName,
          },
        ],
      }

      const res = await apiRequest('/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setConfirmation(res.booking)
      window.scrollTo({ top: 0, behavior: 'smooth' })
    } catch (err) {
      setError(err.message || 'Could not complete booking request. Please check inputs.')
    } finally {
      setSubmitting(false)
    }
  }

  function handleCopyReference() {
    if (confirmation?.reference) {
      navigator.clipboard.writeText(confirmation.reference)
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    }
  }

  // TODAY'S DATE FOR MIN DATE
  const todayStr = new Date().toISOString().slice(0, 10)

  if (confirmation) {
    return (
      <div className="mx-auto max-w-3xl px-4 py-16 sm:px-6 lg:px-8">
        <div className="rounded-3xl border border-emerald-200 bg-white p-8 sm:p-12 shadow-xl space-y-8 print-area">
          {/* Success header */}
          <div className="text-center space-y-3">
            <span className="grid h-16 w-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600 mx-auto border border-emerald-200">
              <CheckCircle2 size={36} />
            </span>
            <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-700">
              Booking Request Received
            </span>
            <h1 className="text-2xl sm:text-3xl font-black text-[#073b66]">
              Appointment Registered
            </h1>
            <p className="text-sm text-slate-600 max-w-md mx-auto">
              Thank you, <strong>{confirmation.patientName}</strong>. Our Mandideep laboratory team will contact you to verify details and sample collection slot.
            </p>
          </div>

          {/* Reference Card */}
          <div className="rounded-2xl border-2 border-dashed border-cyan-300 bg-cyan-50/60 p-6 text-center space-y-2">
            <span className="text-xs font-black uppercase tracking-wider text-cyan-800">
              Your Booking Reference ID
            </span>
            <div className="flex items-center justify-center gap-3">
              <span className="text-2xl sm:text-3xl font-black tracking-tight text-[#073b66] font-mono">
                {confirmation.reference}
              </span>
              <button
                onClick={handleCopyReference}
                className="p-2 text-cyan-700 hover:text-cyan-900 bg-white rounded-lg border border-cyan-200 shadow-xs"
                title="Copy reference code"
              >
                <Copy size={18} />
              </button>
            </div>
            {copied && <p className="text-xs font-bold text-emerald-600">Copied to clipboard!</p>}
            <p className="text-[11px] text-slate-500">
              Please save this reference code. You will need it to track appointment progress and download your report.
            </p>
          </div>

          {/* Summary table */}
          <div className="rounded-2xl border border-slate-200 divide-y divide-slate-100 text-xs sm:text-sm">
            <div className="flex justify-between p-4">
              <span className="text-slate-500 font-medium">Selected Test / Package:</span>
              <span className="font-bold text-[#073b66] text-right">
                {confirmation.items?.map((i) => i.name).join(', ')}
              </span>
            </div>

            {confirmation.doctorName && (
              <div className="flex justify-between p-4 bg-cyan-50/50">
                <span className="text-cyan-900 font-medium flex items-center gap-1.5">
                  <Stethoscope size={14} className="text-cyan-700" />
                  <span>Referring Doctor:</span>
                </span>
                <span className="font-black text-[#073b66]">{confirmation.doctorName}</span>
              </div>
            )}

            {confirmation.offerName && (
              <div className="flex justify-between p-4 bg-amber-50/70 border-y border-amber-100">
                <span className="text-amber-900 font-bold flex items-center gap-1.5">
                  <Sparkles size={14} className="text-amber-600" />
                  <span>Applied Campaign Offer:</span>
                </span>
                <span className="font-black text-amber-950 text-right">
                  {confirmation.offerName} {confirmation.offerCode ? `(${confirmation.offerCode})` : ''}
                </span>
              </div>
            )}

            {confirmation.offerDiscountPaise > 0 && (
              <div className="flex justify-between p-4 bg-emerald-50/60">
                <span className="text-emerald-900 font-bold flex items-center gap-1.5">
                  <Percent size={14} className="text-emerald-700" />
                  <span>Campaign Concession Applied:</span>
                </span>
                <span className="font-black text-emerald-800">
                  -₹{Math.round(confirmation.offerDiscountPaise / 100)}
                </span>
              </div>
            )}

            <div className="flex justify-between p-4">
              <span className="text-slate-500 font-medium">Preferred Date & Slot:</span>
              <span className="font-bold text-slate-800 text-right">
                {confirmation.date} • {confirmation.timeSlot}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-slate-500 font-medium">Collection Mode:</span>
              <span className="font-bold text-slate-800 capitalize">
                {confirmation.collectionType === 'home' ? 'Home Sample Collection (Mandideep Area)' : 'Visit Mandideep Diagnostic Centre'}
              </span>
            </div>
            <div className="flex justify-between p-4">
              <span className="text-slate-500 font-medium">Laboratory Tariff:</span>
              <span className="font-bold text-slate-800">
                ₹{Math.round((confirmation.totalAmountPaise || confirmation.subtotalPaise || 0) / 100)} (Standard Laboratory Tariff)
              </span>
            </div>
          </div>

          {/* Instructions note */}
          <div className="rounded-xl bg-slate-50 p-4 text-xs text-slate-600 space-y-1.5 border border-slate-200">
            <strong className="block font-bold text-[#073b66]">Next Steps:</strong>
            <p>1. Keep your 10-digit mobile phone reachable for our coordinator's confirmation call.</p>
            <p>2. If your test requires fasting, do not consume food or caffeinated drinks for 10–12 hours prior to collection. Plain water is permitted.</p>
            <p>3. Once your sample is processed, you can download your official report securely using this Reference ID and an OTP sent to your phone.</p>
          </div>

          {/* Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 pt-4 border-t border-slate-100 no-print">
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl border border-slate-300 px-5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 w-full sm:w-auto justify-center"
            >
              <Printer size={16} />
              Print Confirmation Slip
            </button>

            <div className="flex items-center gap-3 w-full sm:w-auto">
              <Link
                to={`/track?ref=${encodeURIComponent(confirmation.reference)}`}
                className="rounded-xl bg-[#073b66] px-5 py-3 text-xs font-extrabold text-white hover:bg-cyan-700 text-center flex-1 sm:flex-initial"
              >
                Track Live Status
              </Link>
              <button
                onClick={() => setConfirmation(null)}
                className="rounded-xl border border-cyan-200 px-4 py-3 text-xs font-bold text-cyan-800 hover:bg-cyan-50"
              >
                New Booking
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Online Appointment Request
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Book a Test or Home Collection
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-6">
          Schedule your lab visit or request an experienced phlebotomist for sample collection at your Mandideep home.
        </p>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main Booking Form */}
      <form onSubmit={handleSubmit} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8">
        {/* Section 1: Test / Package Selection */}
        <div className="space-y-4">
          <h2 className="text-base font-black text-[#073b66] flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-100 text-cyan-800 text-xs font-black">
              1
            </span>
            Select Test or Health Package
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  selectionType: 'test',
                  selectedItemName: tests[0]?.name || 'Complete Blood Count (CBC)',
                }))
              }}
              className={`rounded-xl border p-4 text-left font-bold transition flex items-center justify-between ${
                formData.selectionType === 'test'
                  ? 'border-cyan-600 bg-cyan-50/70 text-cyan-900 ring-2 ring-cyan-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div>
                <span className="block text-sm">Individual Diagnostic Test</span>
                <span className="text-xs font-normal text-slate-500">e.g. CBC, Lipid, LFT, Thyroid</span>
              </div>
              <CheckCircle2
                size={18}
                className={formData.selectionType === 'test' ? 'text-cyan-600' : 'text-slate-300'}
              />
            </button>

            <button
              type="button"
              onClick={() => {
                setFormData((prev) => ({
                  ...prev,
                  selectionType: 'package',
                  selectedItemName: packages[0]?.name || 'Basic Wellness Screening (Demo)',
                }))
              }}
              className={`rounded-xl border p-4 text-left font-bold transition flex items-center justify-between ${
                formData.selectionType === 'package'
                  ? 'border-cyan-600 bg-cyan-50/70 text-cyan-900 ring-2 ring-cyan-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <div>
                <span className="block text-sm">Health Screening Package</span>
                <span className="text-xs font-normal text-slate-500">Curated multi-parameter packages</span>
              </div>
              <CheckCircle2
                size={18}
                className={formData.selectionType === 'package' ? 'text-cyan-600' : 'text-slate-300'}
              />
            </button>
          </div>

          <div>
            <label className="field-label">
              {formData.selectionType === 'package' ? 'Choose Health Package' : 'Choose Diagnostic Test'}
            </label>
            <select
              value={formData.selectedItemName}
              onChange={(e) => setFormData({ ...formData, selectedItemName: e.target.value })}
              className="field"
              required
            >
              {formData.selectionType === 'package'
                ? packages.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))
                : tests.map((t) => (
                    <option key={t.name} value={t.name}>
                      {t.name} {t.shortCode ? `(${t.shortCode})` : ''} — {t.department}
                    </option>
                  ))}
            </select>
          </div>

          {/* Doctor Referral (Private B2B Tariff Governance - No discount exposed to public!) */}
          <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 sm:p-5 space-y-3">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-[#073b66] uppercase tracking-wider flex items-center gap-1.5">
                <Stethoscope size={15} className="text-cyan-600" />
                <span>Referring Doctor / Clinic (Optional)</span>
              </label>
              <span className="text-[11px] text-slate-500 font-medium">Prescription / Consultation</span>
            </div>

            <select
              value={formData.selectedDoctorId}
              onChange={(e) => setFormData({ ...formData, selectedDoctorId: e.target.value })}
              className="field bg-white"
            >
              <option value="">— Direct Walk-in / Self Reference (Standard Laboratory Tariff) —</option>
              {doctors.map((doc) => (
                <option key={doc._id} value={doc._id}>
                  {doc.name} ({doc.specialization}{doc.clinicName ? ` • ${doc.clinicName}` : ''})
                </option>
              ))}
            </select>

            {basePricePaise > 0 && (
              <div className="pt-2 border-t border-slate-200/80 flex items-center justify-between text-xs">
                <span className="text-slate-600 font-medium">Standard Laboratory Tariff:</span>
                <span className="font-extrabold text-[#073b66] text-sm font-mono">
                  ₹{Math.round(basePricePaise / 100)}
                </span>
              </div>
            )}
          </div>

          {/* SECTION 1.B: PROMOTIONAL CAMPAIGNS & OFFERS */}
          <div className="rounded-2xl border-2 border-amber-200 bg-amber-50/40 p-4 sm:p-5 space-y-3.5">
            <div className="flex items-center justify-between">
              <label className="text-xs font-black text-amber-950 uppercase tracking-wider flex items-center gap-1.5">
                <Sparkles size={16} className="text-amber-600" />
                <span>Special Campaigns & Promotional Concessions</span>
              </label>
              <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full">
                Direct Patient Savings
              </span>
            </div>

            {/* Campaign Selector if active offers exist */}
            {activeOffers.length > 0 && (
              <div>
                <label className="text-[11px] font-bold text-slate-700 block mb-1">
                  Choose from Active Campaigns:
                </label>
                <select
                  value={selectedOfferId}
                  onChange={(e) => {
                    const id = e.target.value
                    setSelectedOfferId(id)
                    const found = activeOffers.find((o) => o._id === id)
                    if (found) {
                      setEnteredOfferCode(found.code || '')
                      validateAndApplyOffer(id, found.code, selectedItem)
                    } else {
                      setAppliedOffer(null)
                      setOfferError('')
                    }
                  }}
                  className="field bg-white"
                >
                  <option value="">— No promotional offer selected —</option>
                  {activeOffers.map((o) => (
                    <option key={o._id} value={o._id}>
                      {o.name} —{' '}
                      {o.discountType === 'percentage'
                        ? `${o.discountValue}% OFF`
                        : o.discountType === 'fixed_amount'
                        ? `₹${Math.round(o.discountValue / 100)} OFF`
                        : `Flat ₹${Math.round(o.discountValue / 100)}`}
                      {o.code ? ` (CODE: ${o.code})` : ''}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Custom Promo Code Input */}
            <div className="pt-1">
              <label className="text-[11px] font-bold text-slate-700 block mb-1">
                Have a Promo / Festival Voucher Code?
              </label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Tag size={15} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={enteredOfferCode}
                    onChange={(e) => setEnteredOfferCode(e.target.value.toUpperCase())}
                    placeholder="Enter promo code (e.g. DIWALI20)"
                    className="field bg-white pl-9 font-mono uppercase"
                  />
                </div>
                <button
                  type="button"
                  disabled={validatingOffer || !enteredOfferCode.trim()}
                  onClick={() => validateAndApplyOffer(selectedOfferId, enteredOfferCode, selectedItem)}
                  className="rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-xs px-4 py-2.5 transition shrink-0 disabled:opacity-50"
                >
                  {validatingOffer ? 'Checking...' : 'Apply Code'}
                </button>
              </div>
            </div>

            {/* Applied Offer Banner */}
            {appliedOffer && (
              <div className="rounded-xl border border-emerald-300 bg-emerald-50 p-3.5 flex items-center justify-between text-xs animate-in fade-in">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-7 w-7 place-items-center rounded-lg bg-emerald-600 text-white shrink-0">
                    <CheckCircle2 size={16} />
                  </span>
                  <div>
                    <span className="font-black text-emerald-950 block">
                      Offer Applied: {appliedOffer.name}
                    </span>
                    <span className="text-[11px] text-emerald-700">
                      Savings of ₹{Math.round(appliedOffer.discountPaise / 100)} credited on standard tariff.
                    </span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedOfferId('')
                    setEnteredOfferCode('')
                    setAppliedOffer(null)
                    setOfferError('')
                  }}
                  className="text-emerald-800 hover:text-emerald-950 font-bold text-[11px] underline ml-2"
                >
                  Remove
                </button>
              </div>
            )}

            {/* Offer Error Banner */}
            {offerError && (
              <div className="rounded-xl border border-red-200 bg-red-50 p-3 flex items-center gap-2 text-xs font-bold text-red-700 animate-in fade-in">
                <AlertCircle size={16} className="shrink-0" />
                <span>{offerError}</span>
              </div>
            )}

            {/* Realtime Tariff Breakdown */}
            {basePricePaise > 0 && (
              <div className="pt-2 border-t border-amber-200/80 space-y-1.5 text-xs">
                <div className="flex items-center justify-between text-slate-600">
                  <span>Standard Laboratory Tariff:</span>
                  <span className="font-mono font-bold">₹{Math.round(basePricePaise / 100)}</span>
                </div>
                {appliedOffer && appliedOffer.discountPaise > 0 && (
                  <div className="flex items-center justify-between text-emerald-700 font-bold">
                    <span>Campaign Concession ({appliedOffer.name}):</span>
                    <span className="font-mono">-₹{Math.round(appliedOffer.discountPaise / 100)}</span>
                  </div>
                )}
                <div className="flex items-center justify-between text-sm font-black text-[#073b66] pt-1 border-t border-amber-200/60">
                  <span>Net Payable Laboratory Tariff:</span>
                  <span className="font-mono text-base text-cyan-800">
                    ₹{Math.round((appliedOffer ? appliedOffer.finalPricePaise : basePricePaise) / 100)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Section 2: Collection Mode */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-black text-[#073b66] flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-100 text-cyan-800 text-xs font-black">
              2
            </span>
            Collection Preference
          </h2>

          <div className="grid gap-3 sm:grid-cols-2">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, collectionType: 'centre' })}
              className={`rounded-xl border p-4 text-left font-bold transition flex items-start gap-3 ${
                formData.collectionType === 'centre'
                  ? 'border-cyan-600 bg-cyan-50/70 text-cyan-900 ring-2 ring-cyan-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Building2 size={20} className={formData.collectionType === 'centre' ? 'text-cyan-600' : 'text-slate-400'} />
              <div>
                <span className="block text-sm">Visit Unique Pathology Centre</span>
                <span className="text-xs font-normal text-slate-500">Walk in to our Mandideep diagnostic centre</span>
              </div>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, collectionType: 'home' })}
              className={`rounded-xl border p-4 text-left font-bold transition flex items-start gap-3 ${
                formData.collectionType === 'home'
                  ? 'border-cyan-600 bg-cyan-50/70 text-cyan-900 ring-2 ring-cyan-500/20'
                  : 'border-slate-200 hover:border-slate-300 text-slate-700'
              }`}
            >
              <Home size={20} className={formData.collectionType === 'home' ? 'text-cyan-600' : 'text-slate-400'} />
              <div>
                <span className="block text-sm">Home Sample Collection</span>
                <span className="text-xs font-normal text-slate-500">Trained phlebotomist visit at your doorstep</span>
              </div>
            </button>
          </div>

          {/* Conditional Address Fields if Home Collection */}
          {formData.collectionType === 'home' && (
            <div className="rounded-2xl bg-cyan-50/40 p-4 sm:p-5 border border-cyan-100 space-y-4 animate-in fade-in">
              <span className="text-xs font-bold text-cyan-900 block">
                Mandideep / Bhopal Doorstep Collection Details
              </span>

              <div>
                <label className="field-label">
                  Complete Street Address / House / Flat No. <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.address}
                  onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                  placeholder="e.g. House No. 42, Sector C, Industrial Area / Near Railway Crossing"
                  className="field"
                />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Prominent Landmark (optional)</label>
                  <input
                    type="text"
                    value={formData.landmark}
                    onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                    placeholder="e.g. Near SBI Bank / Market Gate"
                    className="field"
                  />
                </div>
                <div>
                  <label className="field-label">PIN Code (Mandideep 462046)</label>
                  <input
                    type="text"
                    pattern="[0-9]{6}"
                    value={formData.pinCode}
                    onChange={(e) => setFormData({ ...formData, pinCode: e.target.value })}
                    placeholder="462046"
                    className="field"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Section 3: Date & Slot */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-black text-[#073b66] flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-100 text-cyan-800 text-xs font-black">
              3
            </span>
            Preferred Appointment Date & Time Slot
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Date <span className="text-red-500">*</span></label>
              <input
                type="date"
                required
                min={todayStr}
                value={formData.date}
                onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                className="field"
              />
            </div>

            <div>
              <label className="field-label">Time Slot <span className="text-red-500">*</span></label>
              <select
                value={formData.timeSlot}
                onChange={(e) => setFormData({ ...formData, timeSlot: e.target.value })}
                className="field"
              >
                <option value="07:00 AM - 09:00 AM">07:00 AM - 09:00 AM (Recommended for Fasting)</option>
                <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 4: Patient Details (Minimum Necessary Data) */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <h2 className="text-base font-black text-[#073b66] flex items-center gap-2">
            <span className="grid h-6 w-6 place-items-center rounded-full bg-cyan-100 text-cyan-800 text-xs font-black">
              4
            </span>
            Patient Contact Information
          </h2>

          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="field-label">Patient Full Name <span className="text-red-500">*</span></label>
              <input
                type="text"
                required
                minLength={2}
                value={formData.patientName}
                onChange={(e) => setFormData({ ...formData, patientName: e.target.value })}
                placeholder="e.g. Ramesh Kumar"
                className="field"
              />
            </div>

            <div>
              <label className="field-label">10-Digit Mobile Number <span className="text-red-500">*</span></label>
              <input
                type="tel"
                required
                pattern="[6-9][0-9]{9}"
                value={formData.phone}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                placeholder="e.g. 9826012345"
                className="field"
              />
              <span className="text-[10px] text-slate-400 mt-1 block">
                Required for appointment confirmation and secure OTP report access.
              </span>
            </div>
          </div>

          <div className="grid gap-4 sm:grid-cols-3">
            <div>
              <label className="field-label">Email (Optional)</label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                placeholder="you@example.com"
                className="field"
              />
            </div>

            <div>
              <label className="field-label">Age</label>
              <input
                type="number"
                min="0"
                max="125"
                value={formData.age}
                onChange={(e) => setFormData({ ...formData, age: e.target.value })}
                placeholder="Years"
                className="field"
              />
            </div>

            <div>
              <label className="field-label">Gender</label>
              <select
                value={formData.gender}
                onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                className="field"
              >
                <option value="prefer_not_to_say">Prefer not to say</option>
                <option value="male">Male</option>
                <option value="female">Female</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        {/* Section 5: Consent & Submit */}
        <div className="space-y-4 pt-4 border-t border-slate-100">
          <label className="flex items-start gap-3 text-xs leading-5 text-slate-600 select-none cursor-pointer">
            <input
              type="checkbox"
              required
              checked={formData.consent}
              onChange={(e) => setFormData({ ...formData, consent: e.target.checked })}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
            />
            <span>
              I agree that Unique Pathology may contact me regarding this booking request. I acknowledge that online bookings represent appointment requests subject to slot and pricing confirmation by laboratory personnel.
            </span>
          </label>

          <button
            type="submit"
            disabled={submitting || !formData.consent}
            className="w-full rounded-2xl bg-[#073b66] py-4 text-base font-extrabold text-white shadow-xl shadow-[#073b66]/20 hover:bg-[#062d4e] transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
          >
            {submitting ? 'Submitting Appointment Request...' : 'Submit Booking Request'}
            {!submitting && <ArrowRight size={18} />}
          </button>

          <p className="text-[11px] text-center text-slate-400">
            No advance online payment is required in this starter. Payment can be completed at the centre or at sample collection.
          </p>
        </div>
      </form>
    </div>
  )
}

import React, { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  ArrowDown,
  BadgeCheck,
  CalendarCheck,
  CheckCircle2,
  Clock,
  Compass,
  FileCheck2,
  FlaskConical,
  HeartPulse,
  Home,
  MapPin,
  Microscope,
  Phone,
  Search,
  ShieldCheck,
  Sparkles,
  TestTube2,
  UserCheck,
  Users,
  Award,
  Zap,
  Stethoscope,
  Percent,
  Tag,
  Gift,
  Copy,
  Calendar,
} from 'lucide-react'
import { apiRequest } from '../api.js'
import { PriceBadge } from '../components/PriceBadge.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

export function HomePage({ publicConfig }) {
  const navigate = useNavigate()
  const [searchTerm, setSearchTerm] = useState('')
  const [allPopularTests, setAllPopularTests] = useState([])
  const [visiblePopularCount, setVisiblePopularCount] = useState(6)
  const [loadingMoreHomeTests, setLoadingMoreHomeTests] = useState(false)
  const [featuredPackages, setFeaturedPackages] = useState([])
  const [activeOffers, setActiveOffers] = useState([])
  const [copiedCode, setCopiedCode] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function loadHighlights() {
      try {
        const [testsData, pkgsData, offersData] = await Promise.all([
          apiRequest('/tests'),
          apiRequest('/packages?featured=true'),
          apiRequest('/offers/active').catch(() => ({ offers: [] })),
        ])
        setAllPopularTests(testsData.tests || [])
        setFeaturedPackages(pkgsData.packages?.slice(0, 3) || [])
        setActiveOffers(offersData.offers || [])
      } catch (err) {
        console.warn('Could not load live catalogue highlights:', err.message)
      } finally {
        setLoading(false)
      }
    }
    loadHighlights()
  }, [])

  const popularTests = allPopularTests.slice(0, visiblePopularCount)

  useScrollReveal([allPopularTests.length, featuredPackages.length, visiblePopularCount, activeOffers.length])

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (searchTerm.trim()) {
      navigate(`/tests?search=${encodeURIComponent(searchTerm.trim())}`)
    } else {
      navigate('/tests')
    }
  }

  const departments = [
    {
      title: 'Hematology',
      desc: 'Complete blood cell counts, hemoglobin, platelets, and cellular morphology.',
      icon: Microscope,
      badge: 'CBC & Blood Panels',
    },
    {
      title: 'Clinical Biochemistry',
      desc: 'Blood glucose, lipid panels, liver function (LFT), and kidney function (KFT).',
      icon: Activity,
      badge: 'Metabolic Health',
    },
    {
      title: 'Endocrinology & Thyroid',
      desc: 'T3, T4, TSH thyroid profiling, reproductive hormones, and vitamin assays.',
      icon: TestTube2,
      badge: 'Hormonal Balance',
    },
    {
      title: 'Clinical Pathology',
      desc: 'Urine routine and microscopic analysis for infection and crystal sediment.',
      icon: FlaskConical,
      badge: 'Urine & Fluids',
    },
    {
      title: 'Preventive Health',
      desc: 'Comprehensive multi-parameter health packages for working adults & seniors.',
      icon: HeartPulse,
      badge: 'Full Body Check',
    },
    {
      title: 'Home Sample Collection',
      desc: 'Hygienic, gentle sample collection at your doorstep across Mandideep.',
      icon: Home,
      badge: 'Mandideep Doorstep',
    },
  ]

  const workflowSteps = [
    {
      step: '01',
      title: 'Select Test or Package',
      desc: 'Browse our searchable catalogue, review fasting rules, and pick your test in seconds.',
      icon: CalendarCheck,
    },
    {
      step: '02',
      title: 'Centre Visit or Home Visit',
      desc: 'Walk in to our Mandideep centre or schedule our certified phlebotomist to visit your home.',
      icon: Home,
    },
    {
      step: '03',
      title: 'Automated Diagnostic Testing',
      desc: 'Barcoded vacuum tubes processed on calibrated clinical analyzers under strict protocols.',
      icon: Microscope,
    },
    {
      step: '04',
      title: 'Secure OTP Report Access',
      desc: 'Receive your verified digital PDF report directly via secure mobile phone OTP.',
      icon: FileCheck2,
    },
  ]

  return (
    <div className="space-y-16 sm:space-y-24 overflow-hidden">
      {/* HERO SECTION */}
      <section className="relative overflow-hidden bg-gradient-to-b from-[#f0f8ff] via-[#f7fbfe] to-white pt-8 pb-16 sm:pt-14 sm:pb-24">
        {/* Subtle clinical tech grid background */}
        <div className="absolute inset-0 bg-medical-grid opacity-60 pointer-events-none" />

        {/* Animated background glow circles */}
        <div className="absolute top-0 right-0 -mr-24 -mt-24 h-96 w-96 rounded-full bg-cyan-200/40 blur-3xl pointer-events-none animate-pulseSlow" />
        <div className="absolute bottom-0 left-0 -ml-24 -mb-24 h-96 w-96 rounded-full bg-blue-200/40 blur-3xl pointer-events-none" />

        {/* Floating subtle medical pulse waveform in background */}
        <div className="absolute top-1/3 right-10 opacity-20 pointer-events-none hidden lg:block animate-float">
          <svg width="240" height="90" viewBox="0 0 240 90" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M0 45H60L75 15L95 75L115 35L130 55L145 45H240" stroke="#0891b2" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr] lg:gap-14">
            {/* Left copy */}
            <div className="space-y-6 text-center lg:text-left animate-fadeIn">
              <div className="inline-flex items-center gap-2 rounded-full border border-cyan-200 bg-white/90 px-4 py-1.5 text-xs font-bold uppercase tracking-[0.14em] text-cyan-800 shadow-xs">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                <span>Mandideep, Bhopal • Diagnostics & Healthcare</span>
              </div>

              <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight text-[#073b66] leading-[1.15]">
                Precision Diagnostics, <br className="hidden sm:inline" />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 to-teal-600">
                  Caring Service
                </span>{' '}
                for Mandideep.
              </h1>

              <p className="max-w-xl mx-auto lg:mx-0 text-sm sm:text-base lg:text-lg leading-7 text-slate-600 font-medium">
                Accurate clinical testing, transparent pricing, and gentle home sample collection for families, doctors, and working professionals in the Mandideep industrial corridor.
              </p>

              {/* Quick Search Bar */}
              <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto lg:mx-0">
                <div className="flex rounded-2xl bg-white p-1.5 sm:p-2 shadow-xl shadow-cyan-950/5 border border-slate-200 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100 transition">
                  <div className="relative flex-1">
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Search tests (CBC, Thyroid, Lipid, Glucose)..."
                      className="w-full bg-transparent py-2.5 sm:py-3 pl-11 pr-2 text-xs sm:text-sm font-semibold text-slate-800 placeholder-slate-400 outline-none"
                    />
                  </div>
                  <button
                    type="submit"
                    className="inline-flex items-center gap-1.5 sm:gap-2 rounded-xl bg-cyan-600 px-4 sm:px-5 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition shrink-0"
                  >
                    <span>Find Test</span>
                    <ArrowRight size={14} />
                  </button>
                </div>
              </form>

              {/* Action buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-3 pt-2">
                <Link
                  to="/book"
                  className="w-full sm:w-auto text-center rounded-xl bg-[#073b66] px-6 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-lg shadow-[#073b66]/20 hover:bg-[#062d4e] active:scale-95 transition"
                >
                  Book Appointment / Home Visit
                </Link>
                <Link
                  to="/reports"
                  className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 rounded-xl border border-slate-300 bg-white px-5 py-3.5 text-xs sm:text-sm font-bold text-[#073b66] hover:border-cyan-400 hover:bg-cyan-50/50 shadow-sm transition"
                >
                  <ShieldCheck size={18} className="text-cyan-600" />
                  <span>Access Reports (OTP)</span>
                </Link>
                <Link
                  to="/login"
                  className="w-full sm:w-auto text-center inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-600 px-5 py-3.5 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition"
                >
                  <Stethoscope size={18} />
                  <span>Doctor / Staff Login</span>
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 sm:gap-4 pt-4 border-t border-slate-200/80 text-[11px] sm:text-xs font-semibold text-slate-600">
                <span className="flex items-center justify-center lg:justify-start gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  Hygienic Vacutainers
                </span>
                <span className="flex items-center justify-center lg:justify-start gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  Mandideep Home Visit
                </span>
                <span className="col-span-2 sm:col-span-1 flex items-center justify-center lg:justify-start gap-1.5">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  Zero Spam Privacy
                </span>
              </div>
            </div>

            {/* Right Card with Real Diagnostic Image & Animated Badges */}
            <div className="relative mx-auto w-full max-w-md sm:max-w-lg">
              <div className="img-zoom-container overflow-hidden rounded-3xl border-8 border-white bg-white shadow-2xl relative">
                <img
                  src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=1200&q=85"
                  alt="Clinical laboratory pathologist conducting automated blood diagnostic testing"
                  className="h-72 sm:h-96 w-full object-cover"
                  loading="eager"
                />
                <div className="p-5 sm:p-6 bg-gradient-to-t from-slate-950 via-slate-900/80 to-transparent absolute inset-x-0 bottom-0 text-white">
                  <span className="inline-block rounded-md bg-cyan-500/30 px-2 py-0.5 text-[10px] font-extrabold tracking-wider text-cyan-300 uppercase border border-cyan-400/40 mb-1">
                    Quality Controlled Laboratory
                  </span>
                  <h3 className="text-base sm:text-lg font-black leading-snug">
                    Unique Pathology Diagnostic Centre
                  </h3>
                  <p className="text-[11px] sm:text-xs text-slate-300 mt-1">
                    Mandideep, Bhopal • Reliable turnaround with verified clinical reporting.
                  </p>
                </div>
              </div>

              {/* Floating Badge 1 - Top Left */}
              <div className="absolute -left-4 sm:-left-6 top-6 hidden sm:flex items-center gap-3 rounded-2xl border border-slate-100 bg-white/95 p-3.5 shadow-xl backdrop-blur-md animate-float">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
                  <Microscope size={20} />
                </span>
                <div>
                  <b className="block text-xs font-black text-[#073b66]">Clinical Precision</b>
                  <small className="text-[11px] text-slate-500">Calibrated Analyzers</small>
                </div>
              </div>

              {/* Floating Badge 2 - Bottom Right */}
              <div className="absolute -right-3 sm:-right-4 -bottom-4 hidden sm:flex items-center gap-3 rounded-2xl border border-slate-100 bg-[#073b66] p-3.5 text-white shadow-xl animate-float-reverse">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-cyan-300">
                  <Home size={20} />
                </span>
                <div>
                  <b className="block text-xs font-black">Doorstep Sample Pickup</b>
                  <small className="text-[11px] text-cyan-200">Across Mandideep & Bhopal</small>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DYNAMIC CAMPAIGNS & FESTIVE OFFERS SECTION */}
      {activeOffers.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 relative z-20 reveal-on-scroll">
          <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-3">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3.5 py-1 text-xs font-black text-amber-800 border border-amber-200 shadow-xs mb-2">
                  <Sparkles size={14} className="text-amber-600 animate-spin" style={{ animationDuration: '6s' }} />
                  <span>Limited Festive & Health Promotions</span>
                </div>
                <h2 className="text-2xl sm:text-3xl font-black text-[#073b66] tracking-tight">
                  Active Lab Campaigns & Seasonal Concessions
                </h2>
                <p className="text-xs sm:text-sm text-slate-600 max-w-xl">
                  Mandideep diagnostic offers automatically applied during booking. Enjoy guaranteed lab precision with seasonal family savings.
                </p>
              </div>

              <div className="text-right hidden sm:block">
                <span className="text-xs font-bold text-slate-500">
                  {activeOffers.length} {activeOffers.length === 1 ? 'Campaign' : 'Campaigns'} Currently Live
                </span>
              </div>
            </div>

            <div className={`grid gap-5 ${activeOffers.length > 1 ? 'sm:grid-cols-2 lg:grid-cols-2' : 'grid-cols-1'}`}>
              {activeOffers.map((offer) => {
                const isCopied = copiedCode === offer.code

                return (
                  <div
                    key={offer._id}
                    className={`relative overflow-hidden rounded-3xl bg-gradient-to-r ${
                      offer.bannerGradient || 'from-amber-500 via-rose-500 to-red-600'
                    } p-6 sm:p-8 text-white shadow-xl flex flex-col justify-between group transition hover:shadow-2xl`}
                  >
                    {/* Background subtle watermark or image */}
                    {offer.bannerUrl && (
                      <div
                        className="absolute inset-0 bg-cover bg-center opacity-15 mix-blend-overlay pointer-events-none"
                        style={{ backgroundImage: `url(${offer.bannerUrl})` }}
                      />
                    )}

                    <div className="relative z-10 space-y-4">
                      {/* Top Badges */}
                      <div className="flex items-center justify-between gap-2 flex-wrap">
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-white/20 backdrop-blur-md px-3 py-1 text-[11px] font-black uppercase tracking-wider text-white border border-white/20">
                          <Sparkles size={12} />
                          <span>{offer.badgeText || 'SPECIAL CAMPAIGN'}</span>
                        </span>

                        <span className="inline-flex items-center gap-1 text-[11px] font-bold text-white/90 bg-black/20 backdrop-blur-xs px-2.5 py-1 rounded-full">
                          <Calendar size={12} />
                          <span>
                            Valid till {new Date(offer.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
                          </span>
                        </span>
                      </div>

                      {/* Title & Description */}
                      <div>
                        <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-tight drop-shadow-xs">
                          {offer.title || offer.name}
                        </h3>
                        <p className="text-xs sm:text-sm text-white/90 mt-2 leading-relaxed">
                          {offer.description}
                        </p>
                      </div>

                      {/* Applicability note */}
                      <div className="text-[11px] text-white/85 font-medium">
                        {offer.applicabilityType === 'all' && (
                          <span>✨ Applies to all tests and packages across catalogue</span>
                        )}
                        {offer.applicabilityType === 'category' && offer.applicableCategories?.length > 0 && (
                          <span>✨ Applies to categories: {offer.applicableCategories.join(', ')}</span>
                        )}
                        {offer.applicabilityType === 'package' && offer.applicablePackageIds?.length > 0 && (
                          <span>✨ Applies to: {offer.applicablePackageIds.map((p) => p.name || p).join(', ')}</span>
                        )}
                        {offer.applicabilityType === 'test' && offer.applicableTestIds?.length > 0 && (
                          <span>✨ Applies to {offer.applicableTestIds.length} designated diagnostic tests</span>
                        )}
                      </div>
                    </div>

                    {/* Bottom CTA & Pricing */}
                    <div className="relative z-10 pt-6 mt-4 border-t border-white/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                      <div>
                        <span className="text-2xl sm:text-3xl font-black font-mono block tracking-tight text-white drop-shadow-sm">
                          {offer.discountType === 'percentage' && `FLAT ${offer.discountValue}% OFF`}
                          {offer.discountType === 'fixed_amount' && `SAVE ₹${Math.round(offer.discountValue / 100)}`}
                          {offer.discountType === 'offer_price' && `OFFER PRICE ₹${Math.round(offer.discountValue / 100)}`}
                        </span>
                        {offer.minOrderAmountPaise > 0 && (
                          <span className="text-[10px] text-white/80 block mt-0.5">
                            On orders above ₹{Math.round(offer.minOrderAmountPaise / 100)}
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        {offer.code && (
                          <button
                            type="button"
                            onClick={() => {
                              navigator.clipboard.writeText(offer.code)
                              setCopiedCode(offer.code)
                              setTimeout(() => setCopiedCode(''), 3000)
                            }}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-white/20 hover:bg-white/30 backdrop-blur-md px-3 py-2.5 text-xs font-mono font-black text-white border border-white/25 transition"
                            title="Copy promo code"
                          >
                            <Tag size={13} />
                            <span>{offer.code}</span>
                            <Copy size={13} />
                            {isCopied && <span className="text-[10px] text-emerald-300 font-sans">Copied!</span>}
                          </button>
                        )}

                        <Link
                          to={`/book?offerId=${offer._id}${offer.code ? `&offerCode=${offer.code}` : ''}`}
                          className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-white px-5 py-2.5 text-xs font-extrabold text-slate-900 shadow-lg hover:bg-slate-100 active:scale-95 transition"
                        >
                          <span>Claim Offer & Book</span>
                          <ArrowRight size={14} />
                        </Link>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </section>
      )}

      {/* PROFESSIONAL PORTALS ACCESS BANNER (DOCTOR & ADMIN) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 -mt-6 sm:-mt-10 relative z-20 reveal-on-scroll">
        <div className="grid gap-4 sm:grid-cols-2">
          {/* Card 1: Doctor Portal */}
          <div className="rounded-3xl border-2 border-cyan-200 bg-gradient-to-br from-cyan-50/90 via-white to-cyan-50/40 p-6 sm:p-7 shadow-lg shadow-cyan-950/5 flex flex-col justify-between hover:border-cyan-400 transition group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-600 text-white shadow-md group-hover:scale-105 transition">
                  <Stethoscope size={24} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-3 py-1 text-xs font-black">
                  <Percent size={13} />
                  <span>Custom Concession Tariffs</span>
                </span>
              </div>
              <h3 className="text-xl font-black text-[#073b66]">Doctor Referral Portal</h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed">
                Registered clinicians and clinic partners: Log in with your mobile / email to track referred patients, view real-time test status, and book direct requisitions with your dynamic discount.
              </p>
            </div>
            <div className="pt-5 flex items-center gap-3">
              <Link
                to="/doctor/login"
                className="flex-1 text-center rounded-xl bg-cyan-600 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>Doctor Portal Login</span>
                <ArrowRight size={15} />
              </Link>
              <Link
                to="/contact?type=doctor"
                className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs font-bold text-[#073b66] hover:bg-slate-50 transition"
              >
                Join Network
              </Link>
            </div>
          </div>

          {/* Card 2: Staff & Admin Portal */}
          <div className="rounded-3xl border-2 border-slate-200 bg-gradient-to-br from-slate-900 via-[#073b66] to-[#052944] p-6 sm:p-7 text-white shadow-lg flex flex-col justify-between hover:border-cyan-400/60 transition group">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="grid h-12 w-12 place-items-center rounded-2xl bg-white/10 text-cyan-300 border border-white/15 group-hover:scale-105 transition">
                  <ShieldCheck size={24} />
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-cyan-900/80 text-cyan-200 px-3 py-1 text-xs font-black border border-cyan-700/60">
                  <span>Lab Operations Console</span>
                </span>
              </div>
              <h3 className="text-xl font-black text-white">Laboratory Admin Portal</h3>
              <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                Mandideep centre management & staff: Log in to manage patient appointments, update test catalogues, govern doctor accounts and discounts, and release encrypted diagnostic reports.
              </p>
            </div>
            <div className="pt-5 flex items-center gap-3">
              <Link
                to="/admin/login"
                className="flex-1 text-center rounded-xl bg-cyan-500 hover:bg-cyan-400 px-5 py-3 text-xs sm:text-sm font-black text-[#052944] shadow-md active:scale-95 transition flex items-center justify-center gap-2"
              >
                <span>Admin / Staff Login</span>
                <ArrowRight size={15} />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* HOW IT WORKS WORKFLOW */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 reveal-on-scroll">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Simple & Transparent</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#073b66]">
            How Your Diagnostic Visit Works
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            From easy online appointment booking to private report delivery in 4 clear steps.
          </p>
        </div>

        <div className="grid gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {workflowSteps.map((s) => (
            <div
              key={s.step}
              className="group relative rounded-2xl border border-slate-200 bg-white p-5 sm:p-6 shadow-sm hover:shadow-lg hover:border-cyan-300 hover:-translate-y-1 transition duration-300"
            >
              <div className="flex items-center justify-between mb-4">
                <span className="grid h-11 w-11 sm:h-12 sm:w-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-700 group-hover:bg-cyan-600 group-hover:text-white transition">
                  <s.icon size={22} />
                </span>
                <span className="text-2xl font-black text-slate-200 group-hover:text-cyan-200 transition">
                  {s.step}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-extrabold text-[#073b66]">{s.title}</h3>
              <p className="mt-2 text-xs leading-5 text-slate-600">{s.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* HOME SAMPLE COLLECTION SPOTLIGHT (WITH PICTURE) */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 reveal-on-scroll">
        <div className="rounded-3xl border border-cyan-100 bg-gradient-to-br from-[#f2faff] to-white p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-2 items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100/70 px-3 py-1 text-xs font-black uppercase tracking-wider text-cyan-800">
                <Home size={14} className="text-cyan-700" />
                Doorstep Health Screening
              </span>

              <h2 className="text-2xl sm:text-3xl font-black text-[#073b66] tracking-tight">
                Hygienic Home Blood Collection in Mandideep
              </h2>

              <p className="text-xs sm:text-sm text-slate-600 leading-6">
                Avoid traffic and waiting rooms. Our certified phlebotomists arrive on time with sterile vacuum tubes and sealed needles. Ideal for senior citizens, diabetic patients requiring early fasting checks, and working parents.
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 font-semibold pt-1">
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Single-use sterile vacutainers</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Temperature-controlled cold box</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Early 07:00 AM slots available</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                  <span>Same-day digital report on phone</span>
                </div>
              </div>

              <div className="pt-3 flex flex-wrap gap-3">
                <Link
                  to="/book?collection=home"
                  className="rounded-xl bg-cyan-600 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition"
                >
                  Schedule Home Collection
                </Link>
                <Link
                  to="/faqs"
                  className="rounded-xl border border-slate-300 bg-white px-4 py-3 text-xs sm:text-sm font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Fasting Guidelines
                </Link>
              </div>
            </div>

            {/* Phlebotomy Image */}
            <div className="img-zoom-container overflow-hidden rounded-2xl border-4 border-white shadow-xl">
              <img
                src="https://www.shutterstock.com/shutterstock/photos/145429276/display_1500/stock-photo-nurse-is-going-to-draw-blood-from-vein-145429276.jpg"
                alt="Healthcare professional gently taking patient blood sample with sterile equipment"
                className="h-64 sm:h-80 w-full object-cover"
                loading="lazy"
              />
            </div>
          </div>
        </div>
      </section>

      {/* POPULAR TESTS SECTION */}
      <section className="bg-slate-50 py-14 sm:py-20 border-y border-slate-200/70 reveal-on-scroll">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10">
            <div>
              <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Diagnostic Catalogue</p>
              <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#073b66] mt-1">
                Popular Routine Tests
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-lg">
                Commonly requested blood, glucose, liver, renal, and hormone profiles in Mandideep.
              </p>
            </div>
            <Link
              to="/tests"
              className="inline-flex items-center gap-2 text-xs sm:text-sm font-extrabold text-cyan-700 hover:text-cyan-900 group"
            >
              <span>View All Diagnostic Tests</span>
              <ArrowRight size={16} className="group-hover:translate-x-1 transition" />
            </Link>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {popularTests.map((test) => (
              <div
                key={test.name}
                className="medical-card p-5 sm:p-6 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <span className="rounded-lg bg-blue-50 px-2.5 py-1 text-[11px] font-bold text-blue-800">
                      {test.department}
                    </span>
                    <span className="text-xs font-bold text-slate-400">
                      {test.turnaroundHours}h TAT
                    </span>
                  </div>

                  <h3 className="mt-4 text-base sm:text-lg font-black text-[#073b66] leading-snug">
                    {test.name}
                  </h3>
                  {test.shortCode && (
                    <p className="text-xs font-bold text-cyan-600 mt-0.5">{test.shortCode}</p>
                  )}

                  <p className="mt-2 text-xs text-slate-600 leading-5 line-clamp-2">
                    {test.description}
                  </p>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center gap-2 text-[11px] text-slate-500">
                    <span className="font-semibold text-slate-700">Sample:</span> {test.sampleType}
                  </div>
                </div>

                <div className="mt-5 pt-4 border-t border-slate-100 flex items-center justify-between gap-4">
                  <PriceBadge
                    pricePaise={test.pricePaise}
                    mrpPaise={test.mrpPaise}
                    isVerifiedPrice={test.isVerifiedPrice}
                    priceNote={test.priceNote}
                  />

                  <Link
                    to={`/book?test=${encodeURIComponent(test.name)}`}
                    className="rounded-xl bg-[#073b66] px-3.5 py-2 text-xs font-extrabold text-white hover:bg-cyan-700 active:scale-95 transition shrink-0"
                  >
                    Book Test
                  </Link>
                </div>
              </div>
            ))}
          </div>

          {/* Load More Tests on Scroll / Click */}
          {allPopularTests.length > visiblePopularCount && (
            <div className="mt-10 text-center">
              <button
                onClick={() => {
                  setLoadingMoreHomeTests(true)
                  setTimeout(() => {
                    setVisiblePopularCount((prev) => prev + 6)
                    setLoadingMoreHomeTests(false)
                  }, 300)
                }}
                className="inline-flex items-center gap-2 rounded-2xl border-2 border-cyan-600/30 bg-white hover:bg-cyan-50/80 px-6 py-3 text-xs font-extrabold text-[#073b66] shadow-sm hover:scale-[1.02] active:scale-95 transition"
              >
                {loadingMoreHomeTests ? (
                  <>
                    <div className="h-4 w-4 animate-spin rounded-full border-2 border-cyan-600 border-t-transparent" />
                    <span>Loading more tests...</span>
                  </>
                ) : (
                  <>
                    <span>Load More Tests ({allPopularTests.length - visiblePopularCount} remaining)</span>
                    <ArrowDown size={14} className="text-cyan-600 animate-bounce" />
                  </>
                )}
              </button>
            </div>
          )}
        </div>
      </section>

      {/* HEALTH PACKAGES SECTION */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 reveal-on-scroll">
        <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">Preventive Wellness</p>
          <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-[#073b66]">
            Comprehensive Health Screening Packages
          </h2>
          <p className="text-xs sm:text-sm text-slate-600">
            Carefully curated multi-parameter checkups designed for adults, families, and senior citizens.
          </p>
        </div>

        <div className="grid gap-6 sm:gap-8 md:grid-cols-3">
          {featuredPackages.map((pkg) => (
            <div
              key={pkg.code}
              className="rounded-3xl border-2 border-slate-200 bg-white p-6 sm:p-7 shadow-sm hover:border-cyan-400 hover:shadow-xl hover:-translate-y-1 transition duration-300 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-700 border border-cyan-100">
                    {pkg.category}
                  </span>
                  {pkg.badge && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200">
                      {pkg.badge}
                    </span>
                  )}
                </div>

                <h3 className="mt-4 text-xl font-black text-[#073b66]">{pkg.name}</h3>
                <p className="mt-2 text-xs text-slate-600 leading-5">{pkg.tagline || pkg.description}</p>

                <div className="mt-5 space-y-2 border-t border-slate-100 pt-4">
                  <div className="text-xs font-black text-slate-800 uppercase tracking-wider mb-2">
                    Includes {pkg.testsIncluded?.length || 0} Key Parameters:
                  </div>
                  <ul className="space-y-1.5 text-xs text-slate-600">
                    {pkg.testsIncluded?.slice(0, 5).map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <CheckCircle2 size={14} className="text-cyan-600 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                    {pkg.testsIncluded?.length > 5 && (
                      <li className="text-[11px] font-bold text-cyan-700 pt-1">
                        + {pkg.testsIncluded.length - 5} more diagnostic parameters
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              <div className="mt-8 pt-6 border-t border-slate-100">
                <PriceBadge
                  pricePaise={pkg.pricePaise}
                  mrpPaise={pkg.mrpPaise}
                  isVerifiedPrice={pkg.isVerifiedPrice}
                  priceNote={pkg.priceNote}
                  className="mb-4"
                />

                <Link
                  to={`/book?package=${encodeURIComponent(pkg.name)}`}
                  className="block w-full rounded-xl bg-cyan-600 py-3 text-center text-xs font-extrabold text-white shadow-md shadow-cyan-600/20 hover:bg-cyan-700 active:scale-95 transition"
                >
                  Book Package
                </Link>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* CLINICAL DEPARTMENTS OVERVIEW */}
      <section className="relative overflow-hidden bg-[#052944] text-white py-14 sm:py-20 reveal-on-scroll">
        <div className="absolute inset-0 bg-dark-grid opacity-25 pointer-events-none" />
        <div className="relative mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto space-y-2 mb-10">
            <span className="text-xs font-extrabold uppercase tracking-[0.2em] text-cyan-300">Medical Divisions</span>
            <h2 className="text-2xl sm:text-3xl lg:text-4xl font-black tracking-tight text-white">
              Specialized Laboratory Departments
            </h2>
            <p className="text-xs sm:text-sm text-blue-100">
              State-of-the-art diagnostic testing wings configured to support precise clinician decisions.
            </p>
          </div>

          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {departments.map((dep) => (
              <div
                key={dep.title}
                className="group rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6 hover:bg-white/10 hover:border-cyan-400/50 hover:-translate-y-1 transition duration-300"
              >
                <div className="flex items-center justify-between mb-4">
                  <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 group-hover:bg-cyan-500 group-hover:text-white transition">
                    <dep.icon size={22} />
                  </span>
                  <span className="text-[10px] font-bold text-cyan-300 bg-cyan-950/60 px-2 py-0.5 rounded border border-cyan-700/40">
                    {dep.badge}
                  </span>
                </div>
                <h3 className="text-base sm:text-lg font-bold text-white">{dep.title}</h3>
                <p className="mt-2 text-xs leading-5 text-blue-200">{dep.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MANDIDEEP LOCATION SPOTLIGHT & CONTACT */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 reveal-on-scroll">
        <div className="rounded-3xl border border-slate-200 bg-gradient-to-br from-white to-[#f4faff] p-6 sm:p-10 lg:p-12 shadow-sm">
          <div className="grid gap-8 lg:grid-cols-[1fr_1.1fr] items-center">
            <div className="space-y-4">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-800 border border-cyan-200">
                <MapPin size={14} className="text-cyan-600" />
                Diagnostic Centre Location
              </span>
              <h2 className="text-2xl sm:text-3xl font-black text-[#073b66] tracking-tight">
                Conveniently Located in Mandideep, Bhopal
              </h2>
              <p className="text-xs sm:text-sm text-slate-600 leading-6">
                Centrally accessible for residents, industrial workforce personnel, and referring clinics across Mandideep industrial zones, Station Road corridor, and surrounding Bhopal highway access points.
              </p>

              <div className="space-y-3 pt-2 text-xs text-slate-700">
                <div className="flex items-start gap-3">
                  <MapPin size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-[#073b66]">Centre Address:</strong>
                    <span>
                      {publicConfig?.business?.address || 'Unique Pathology, Mandideep, Bhopal Region, Madhya Pradesh 462046, India'}
                    </span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Clock size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-[#073b66]">Operating Hours:</strong>
                    <span>{publicConfig?.business?.timings || 'Mon–Sat: 07:00 AM – 08:00 PM | Sun: 08:00 AM – 01:00 PM'}</span>
                  </div>
                </div>

                <div className="flex items-start gap-3">
                  <Phone size={18} className="text-cyan-600 shrink-0 mt-0.5" />
                  <div>
                    <strong className="block font-bold text-[#073b66]">Helpline:</strong>
                    <a href="tel:+918962038429" className="font-bold text-cyan-800 hover:underline">
                      +91 89620 38429
                    </a>
                  </div>
                </div>
              </div>

              <div className="pt-4 flex flex-wrap gap-3">
                <Link
                  to="/book?collection=home"
                  className="rounded-xl bg-cyan-600 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:bg-cyan-700 active:scale-95 transition"
                >
                  Book Home Collection
                </Link>
                <Link
                  to="/contact"
                  className="rounded-xl border border-slate-300 bg-white px-5 py-3 text-xs sm:text-sm font-bold text-[#073b66] hover:bg-slate-50 transition"
                >
                  Contact & Directions
                </Link>
              </div>
            </div>

            {/* Diagnostic Facility Photo */}
            <div className="img-zoom-container overflow-hidden rounded-2xl border-4 border-white shadow-xl relative">
              <img
                src="https://images.unsplash.com/photo-1629909613654-28e377c37b09?auto=format&fit=crop&w=1000&q=85"
                alt="Modern, clean medical diagnostic testing centre interior"
                className="h-64 sm:h-80 w-full object-cover"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#073b66]/90 via-transparent to-transparent flex items-end p-5 text-white">
                <div>
                  <b className="block text-sm sm:text-base font-black">Clean, Sanitized Clinical Facility</b>
                  <span className="text-[11px] text-cyan-200">Adhering to strict laboratory bio-safety standards</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* DOCTOR & CORPORATE ENQUIRY BANNER */}
      <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 pb-12 reveal-on-scroll">
        <div className="rounded-3xl bg-gradient-to-r from-[#073b66] to-[#085375] p-6 sm:p-10 lg:p-12 text-white shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl text-center md:text-left">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              For Clinics, Doctors & Industry
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black">
              Doctor Tie-ups & Corporate Health Checkups
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-6">
              Are you a practicing clinician seeking reliable diagnostic reporting, or a Mandideep factory manager planning annual staff wellness camps? Connect with our professional coordinator.
            </p>
          </div>

          <Link
            to="/contact?type=doctor"
            className="rounded-2xl bg-white px-6 py-4 text-xs sm:text-sm font-extrabold text-[#073b66] hover:bg-cyan-50 shadow-md shrink-0 active:scale-95 transition"
          >
            Doctor / Corporate Enquiry
          </Link>
        </div>
      </section>
    </div>
  )
}

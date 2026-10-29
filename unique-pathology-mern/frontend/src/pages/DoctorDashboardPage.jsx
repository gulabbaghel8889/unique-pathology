import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Stethoscope,
  Activity,
  Users,
  TestTube2,
  Percent,
  TrendingUp,
  DollarSign,
  Calendar,
  Clock,
  Search,
  Filter,
  CheckCircle2,
  AlertCircle,
  FileText,
  UserPlus,
  Copy,
  Check,
  RefreshCw,
  LogOut,
  ArrowRight,
  ShieldCheck,
  Building2,
  MapPin,
  Phone,
  Mail,
  ChevronRight,
  Download,
  Info,
} from 'lucide-react'
import { useDoctorAuth } from '../context/DoctorAuthContext.jsx'
import { apiRequest } from '../api.js'
import { PriceBadge } from '../components/PriceBadge.jsx'

export function DoctorDashboardPage() {
  const navigate = useNavigate()
  const { doctor, isAuthenticated, loading: authLoading, logout, refreshDoctor } = useDoctorAuth()

  const [activeTab, setActiveTab] = useState('overview') // 'overview' | 'patients' | 'refer' | 'catalogue' | 'profile'
  const [dashboardData, setDashboardData] = useState(null)
  const [loadingData, setLoadingData] = useState(true)
  const [error, setError] = useState('')

  // Patients Tab state
  const [patients, setPatients] = useState([])
  const [patientsLoading, setPatientsLoading] = useState(false)
  const [patientSearch, setPatientSearch] = useState('')
  const [patientStatusFilter, setPatientStatusFilter] = useState('all')

  // Catalogue Tab state
  const [catalogueData, setCatalogueData] = useState({ tests: [], packages: [] })
  const [catalogueLoading, setCatalogueLoading] = useState(false)
  const [catalogueSearch, setCatalogueSearch] = useState('')

  // Refer a Patient Form state
  const [referralForm, setReferralForm] = useState({
    patientName: '',
    phone: '',
    email: '',
    age: '',
    gender: 'prefer_not_to_say',
    selectedItemType: 'test',
    selectedItemName: '',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '07:00 AM - 09:00 AM',
    collectionType: 'centre',
    address: '',
    clinicalNotes: '',
  })
  const [referralSubmitting, setReferralSubmitting] = useState(false)
  const [referralSuccess, setReferralSuccess] = useState(null)
  const [referralError, setReferralError] = useState('')

  // Copy referral code state
  const [copiedCode, setCopiedCode] = useState(false)

  // Redirect if unauthenticated
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      navigate('/doctor/login')
    }
  }, [authLoading, isAuthenticated, navigate])

  // Load Dashboard summary data
  async function loadDashboard() {
    if (!isAuthenticated) return
    setLoadingData(true)
    setError('')
    try {
      const data = await apiRequest('/doctor/dashboard', { authType: 'doctor' })
      setDashboardData(data)
    } catch (err) {
      setError(err.message || 'Could not load doctor dashboard data.')
    } finally {
      setLoadingData(false)
    }
  }

  // Load Patients list
  async function loadPatients() {
    if (!isAuthenticated) return
    setPatientsLoading(true)
    try {
      const queryParams = new URLSearchParams()
      if (patientSearch.trim()) queryParams.set('search', patientSearch.trim())
      if (patientStatusFilter !== 'all') queryParams.set('status', patientStatusFilter)

      const data = await apiRequest(`/doctor/patients?${queryParams.toString()}`, { authType: 'doctor' })
      setPatients(data.bookings || [])
    } catch (err) {
      console.warn('Failed to load doctor patients:', err.message)
    } finally {
      setPatientsLoading(false)
    }
  }

  // Load Catalogue with Doctor's custom discounted pricing
  async function loadCatalogue() {
    if (!isAuthenticated) return
    setCatalogueLoading(true)
    try {
      const data = await apiRequest('/doctor/tests', { authType: 'doctor' })
      setCatalogueData({
        tests: data.tests || [],
        packages: data.packages || [],
      })
      if (!referralForm.selectedItemName && data.tests?.length > 0) {
        setReferralForm((prev) => ({
          ...prev,
          selectedItemName: data.tests[0].name,
        }))
      }
    } catch (err) {
      console.warn('Failed to load catalogue:', err.message)
    } finally {
      setCatalogueLoading(false)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadDashboard()
      loadCatalogue()
    }
  }, [isAuthenticated])

  useEffect(() => {
    if (activeTab === 'patients') {
      loadPatients()
    }
  }, [activeTab, patientSearch, patientStatusFilter])

  function handleCopyReferralCode() {
    if (doctor?.referralCode) {
      navigator.clipboard.writeText(doctor.referralCode)
      setCopiedCode(true)
      setTimeout(() => setCopiedCode(false), 2500)
    }
  }

  // Handle direct patient referral submission
  async function handleReferralSubmit(e) {
    e.preventDefault()
    setReferralSubmitting(true)
    setReferralError('')
    setReferralSuccess(null)

    try {
      const payload = {
        patientName: referralForm.patientName.trim(),
        phone: referralForm.phone.trim(),
        email: referralForm.email.trim() || undefined,
        age: referralForm.age ? Number(referralForm.age) : undefined,
        gender: referralForm.gender,
        items: [
          {
            itemType: referralForm.selectedItemType,
            name: referralForm.selectedItemName,
          },
        ],
        date: referralForm.date,
        timeSlot: referralForm.timeSlot,
        collectionType: referralForm.collectionType,
        address: referralForm.collectionType === 'home' ? referralForm.address.trim() : '',
        clinicalNotes: referralForm.clinicalNotes.trim() || undefined,
      }

      const res = await apiRequest('/doctor/bookings', {
        method: 'POST',
        authType: 'doctor',
        body: JSON.stringify(payload),
      })

      setReferralSuccess(res.booking)
      setReferralForm((prev) => ({
        ...prev,
        patientName: '',
        phone: '',
        email: '',
        age: '',
        address: '',
        clinicalNotes: '',
      }))

      // Reload dashboard metrics & patients
      loadDashboard()
      refreshDoctor()
    } catch (err) {
      setReferralError(err.message || 'Could not submit patient referral. Please verify fields.')
    } finally {
      setReferralSubmitting(false)
    }
  }

  // Find currently selected test in referral form for live price preview
  const selectedTestItem =
    referralForm.selectedItemType === 'package'
      ? catalogueData.packages.find((p) => p.name === referralForm.selectedItemName)
      : catalogueData.tests.find((t) => t.name === referralForm.selectedItemName)

  if (authLoading || (!dashboardData && loadingData)) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center space-y-3 bg-[#f8fbfe]">
        <div className="h-10 w-10 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
        <p className="text-sm font-bold text-slate-600">Loading Doctor Partner Portal...</p>
      </div>
    )
  }

  const discountPercent = doctor?.discountPercent || 0
  const metrics = dashboardData?.metrics || {}

  return (
    <div className="min-h-screen bg-[#f8fbfe] text-slate-800 flex flex-col">
      {/* Top Doctor Portal Header Bar */}
      <header className="sticky top-0 z-30 bg-[#073b66] text-white shadow-md">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 py-3">
          
          {/* Left branding */}
          <div className="flex items-center gap-3">
            <div className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30 shadow-inner">
              <Stethoscope size={22} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base sm:text-lg font-black tracking-tight leading-none text-white">
                  UNIQUE PATHOLOGY
                </span>
                <span className="hidden sm:inline-block rounded bg-cyan-500/30 text-cyan-200 text-[10px] font-black uppercase px-2 py-0.5 border border-cyan-400/40">
                  Doctor Portal
                </span>
              </div>
              <span className="block text-[10px] font-extrabold uppercase tracking-wider text-cyan-200 mt-0.5">
                Mandideep Medical Diagnostic Network
              </span>
            </div>
          </div>

          {/* Right Doctor Identity & Logout */}
          <div className="flex items-center gap-3 sm:gap-4">
            {/* Active Discount Pill */}
            <div className="hidden md:flex items-center gap-1.5 rounded-xl bg-cyan-900/70 border border-cyan-700/60 px-3 py-1.5 text-xs">
              <Percent size={13} className="text-cyan-400" />
              <span className="text-slate-300">Your Discount:</span>
              <strong className="text-cyan-300 font-black">{discountPercent}% OFF</strong>
            </div>

            {/* Doctor Profile Pill */}
            <div className="hidden sm:flex flex-col text-right">
              <strong className="text-xs font-black text-white">{doctor?.name}</strong>
              <small className="text-[10px] text-cyan-200 font-semibold">{doctor?.specialization}</small>
            </div>

            {/* Logout button */}
            <button
              onClick={() => {
                logout()
                navigate('/doctor/login')
              }}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/20 hover:bg-red-600 text-red-200 hover:text-white px-3 py-1.5 text-xs font-bold transition border border-red-500/30"
              title="Logout from Doctor Portal"
            >
              <LogOut size={14} />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>

        {/* Doctor Portal Secondary Header Strip with Referral Code */}
        <div className="bg-[#052944] border-t border-cyan-900/60 px-4 sm:px-6 lg:px-8 py-2 text-xs flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Building2 size={13} className="text-cyan-400" />
            <span className="text-slate-300 font-medium">
              Clinic: <strong className="text-white">{doctor?.clinicName || 'Private Practice'}</strong>
            </span>
            <span className="hidden md:inline text-slate-500">•</span>
            <span className="hidden md:inline text-slate-300">{doctor?.clinicAddress}</span>
          </div>

          {/* Referral Code with 1-Click Copy */}
          <div className="flex items-center gap-2">
            <span className="text-cyan-200 text-[11px] font-bold">Your Referral Code:</span>
            <button
              onClick={handleCopyReferralCode}
              className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-950 px-2.5 py-1 text-xs font-mono font-black text-cyan-300 border border-cyan-600/50 hover:bg-cyan-900 transition"
              title="Click to copy patient referral code"
            >
              <span>{doctor?.referralCode || 'DOC-GEN'}</span>
              {copiedCode ? <Check size={12} className="text-emerald-400" /> : <Copy size={12} className="text-cyan-400" />}
            </button>
            {copiedCode && <span className="text-[10px] font-bold text-emerald-400 animate-fadeIn">Copied!</span>}
          </div>
        </div>
      </header>

      {/* Main Container */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-6">
        
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 border-b border-slate-200">
          {[
            { id: 'overview', label: 'Dashboard Overview', icon: Activity },
            { id: 'patients', label: `Referred Patients (${metrics.totalPatientsReferred || 0})`, icon: Users },
            { id: 'refer', label: 'Refer a Patient (New Booking)', icon: UserPlus, highlight: true },
            { id: 'catalogue', label: `Discounted Test Directory (${discountPercent}% OFF)`, icon: TestTube2 },
            { id: 'profile', label: 'Doctor Profile & Settings', icon: Stethoscope },
          ].map((tab) => {
            const Icon = tab.icon
            const active = activeTab === tab.id
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-xs sm:text-sm font-extrabold whitespace-nowrap transition ${
                  active
                    ? 'bg-[#073b66] text-white shadow-sm'
                    : tab.highlight
                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-200 hover:bg-cyan-100'
                    : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
                }`}
              >
                <Icon size={16} className={active ? 'text-cyan-300' : 'text-slate-500'} />
                <span>{tab.label}</span>
              </button>
            )
          })}
        </div>

        {/* ========================================================
            TAB 1: DASHBOARD OVERVIEW
           ======================================================== */}
        {activeTab === 'overview' && (
          <div className="space-y-6 animate-fadeIn">
            {/* Top Stat Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
              
              {/* Card 1: Assigned Discount */}
              <div className="rounded-2xl border-2 border-cyan-200 bg-gradient-to-br from-white to-cyan-50/50 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Your Discount Rate</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-600 text-white shadow-xs">
                    <Percent size={18} />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-[#073b66]">{discountPercent}%</span>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                    Automatically applied to all your patient referrals
                  </p>
                </div>
              </div>

              {/* Card 2: Total Referred Patients */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Patients Referred</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-[#073b66]">
                    <Users size={18} />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-[#073b66]">
                    {metrics.totalPatientsReferred || 0}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                    {metrics.totalTestsReferred || 0} diagnostic tests prescribed
                  </p>
                </div>
              </div>

              {/* Card 3: Status Summary */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">Completed Tests</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-700">
                    <CheckCircle2 size={18} />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-emerald-700">
                    {metrics.statusCounts?.completed || 0}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                    Reports ready for patients
                  </p>
                </div>
              </div>

              {/* Card 4: Pending / In Progress */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-500">In Progress</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-700">
                    <Activity size={18} />
                  </span>
                </div>
                <div className="mt-3">
                  <span className="text-2xl sm:text-3xl font-black text-[#073b66]">
                    {(metrics.statusCounts?.confirmed || 0) + (metrics.statusCounts?.processing || 0) + (metrics.statusCounts?.sample_collected || 0)}
                  </span>
                  <p className="text-[11px] text-slate-500 mt-1 font-semibold">
                    Confirmed, collected or in lab
                  </p>
                </div>
              </div>

            </div>

            {/* Quick Actions & Recent Referrals */}
            <div className="grid gap-6 lg:grid-cols-[1fr_360px]">
              
              {/* Left Column: Recent Referrals Table */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#073b66]">Recent Patient Referrals</h3>
                    <p className="text-xs text-slate-500">Live testing and report status updates</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('patients')}
                    className="inline-flex items-center gap-1 text-xs font-bold text-cyan-700 hover:text-cyan-900"
                  >
                    <span>View All</span>
                    <ArrowRight size={13} />
                  </button>
                </div>

                {(!dashboardData?.recentReferrals || dashboardData.recentReferrals.length === 0) ? (
                  <div className="text-center py-12 rounded-2xl border border-dashed border-slate-200 p-6 space-y-3">
                    <Users size={32} className="mx-auto text-slate-300" />
                    <p className="text-xs font-bold text-slate-500">No patient referrals linked yet.</p>
                    <button
                      onClick={() => setActiveTab('refer')}
                      className="rounded-xl bg-cyan-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-cyan-700 transition"
                    >
                      Refer Your First Patient
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                          <th className="pb-3">Patient</th>
                          <th className="pb-3">Tests Prescribed</th>
                          <th className="pb-3">Discount Status</th>
                          <th className="pb-3">Status</th>
                          <th className="pb-3">Date</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 font-medium">
                        {dashboardData.recentReferrals.map((b) => (
                          <tr key={b._id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3">
                              <strong className="block font-bold text-[#073b66]">{b.patientName}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">{b.reference}</span>
                            </td>
                            <td className="py-3 max-w-[200px] truncate text-slate-700">
                              {b.items?.map((it) => it.name).join(', ') || 'Diagnostic Test'}
                            </td>
                            <td className="py-3">
                              {b.discountApplied ? (
                                <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                  ✓ {b.doctorDiscountPercent || discountPercent}% Applied
                                </span>
                              ) : (
                                <span className="text-[10px] text-slate-400">Standard Rate</span>
                              )}
                            </td>
                            <td className="py-3">
                              <span
                                className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                  b.status === 'completed'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : b.status === 'processing'
                                    ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                    : b.status === 'sample_collected'
                                    ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                    : b.status === 'confirmed'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : 'bg-slate-100 text-slate-700'
                                }`}
                              >
                                {b.status.replace('_', ' ')}
                              </span>
                            </td>
                            <td className="py-3 text-slate-500 text-[11px]">{b.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Right Column: Quick Referral Card & Guidelines */}
              <div className="space-y-5">
                {/* Refer Card */}
                <div className="rounded-3xl border border-cyan-200 bg-gradient-to-br from-[#073b66] to-cyan-800 text-white p-6 shadow-md space-y-4">
                  <div className="inline-grid h-10 w-10 place-items-center rounded-xl bg-white/10 text-cyan-300">
                    <UserPlus size={22} />
                  </div>
                  <div>
                    <h3 className="text-lg font-black leading-snug">Prescribe / Refer Patient</h3>
                    <p className="text-xs text-cyan-100 mt-1 leading-5">
                      Directly register a patient for centre visit or home collection in Mandideep with your {discountPercent}% discount pre-applied.
                    </p>
                  </div>
                  <button
                    onClick={() => setActiveTab('refer')}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-white py-3 text-xs font-black text-[#073b66] shadow hover:bg-cyan-50 active:scale-95 transition"
                  >
                    <span>New Patient Referral</span>
                    <ArrowRight size={14} />
                  </button>
                </div>

                {/* Mandideep Phlebotomy Support Box */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 text-xs text-slate-600 space-y-2.5">
                  <b className="block text-sm font-black text-[#073b66]">Mandideep Phlebotomist Support</b>
                  <p className="text-[11px] leading-5">
                    For priority home collection or emergency fever profiles for your patients, direct WhatsApp / call our chief phlebotomist:
                  </p>
                  <div className="rounded-xl bg-slate-50 p-3 text-[11px] font-semibold text-slate-700 flex items-center justify-between border border-slate-100">
                    <span className="flex items-center gap-1.5 text-cyan-800 font-bold">
                      <Phone size={14} className="text-cyan-600" />
                      +91 89620 38429
                    </span>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                      07:00 AM – 08:00 PM
                    </span>
                  </div>
                </div>
              </div>

            </div>
          </div>
        )}

        {/* ========================================================
            TAB 2: REFERRED PATIENTS DIRECTORY
           ======================================================== */}
        {activeTab === 'patients' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Search & Filters */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="relative w-full sm:max-w-md">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={17} />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patient by name, mobile, reference..."
                  className="field pl-10 text-xs"
                />
              </div>

              <div className="flex items-center gap-2 w-full sm:w-auto">
                <select
                  value={patientStatusFilter}
                  onChange={(e) => setPatientStatusFilter(e.target.value)}
                  className="field text-xs py-2"
                >
                  <option value="all">All Statuses</option>
                  <option value="requested">Requested</option>
                  <option value="confirmed">Confirmed</option>
                  <option value="sample_collected">Sample Collected</option>
                  <option value="processing">Processing</option>
                  <option value="completed">Completed</option>
                  <option value="cancelled">Cancelled</option>
                </select>

                <button
                  onClick={loadPatients}
                  className="p-2.5 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-600 transition shrink-0"
                  title="Refresh list"
                >
                  <RefreshCw size={15} />
                </button>
              </div>
            </div>

            {/* Patients Table */}
            <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
              {patientsLoading ? (
                <div className="py-16 text-center space-y-2">
                  <div className="h-8 w-8 animate-spin rounded-full border-3 border-cyan-600 border-t-transparent mx-auto" />
                  <p className="text-xs font-bold text-slate-500">Loading your referred patients...</p>
                </div>
              ) : patients.length === 0 ? (
                <div className="text-center py-16 space-y-3">
                  <Users size={36} className="mx-auto text-slate-300" />
                  <h3 className="text-base font-bold text-[#073b66]">No patients found</h3>
                  <p className="text-xs text-slate-500 max-w-sm mx-auto">
                    {patientSearch
                      ? `No patient records matching "${patientSearch}".`
                      : 'Patients referred with your code or booked directly from this portal will appear here.'}
                  </p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-[11px] font-black uppercase tracking-wider text-slate-400">
                        <th className="pb-3">Patient Name</th>
                        <th className="pb-3">Contact</th>
                        <th className="pb-3">Prescribed Tests</th>
                        <th className="pb-3">Discount Applied</th>
                        <th className="pb-3">Status</th>
                        <th className="pb-3">Date</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {patients.map((p) => (
                        <tr key={p._id} className="hover:bg-slate-50/80 transition">
                          <td className="py-3.5">
                            <strong className="block font-bold text-[#073b66]">{p.patientName}</strong>
                            <div className="flex items-center gap-1.5 text-[10px] text-slate-400 mt-0.5">
                              <span>Ref: {p.reference}</span>
                              {p.age && <span>• {p.age}y</span>}
                              {p.gender && <span className="capitalize">• {p.gender}</span>}
                            </div>
                          </td>
                          <td className="py-3.5 text-slate-600">
                            <div>{p.phone}</div>
                            {p.email && <small className="text-slate-400 block">{p.email}</small>}
                          </td>
                          <td className="py-3.5 max-w-[220px]">
                            <div className="font-semibold text-slate-700 truncate">
                              {p.items?.map((it) => it.name).join(', ') || 'Test'}
                            </div>
                            <span className="text-[10px] text-slate-400 capitalize">
                              {p.collectionType === 'home' ? 'Home Sample Collection' : 'Centre Visit'}
                            </span>
                          </td>
                          <td className="py-3.5">
                            {p.discountApplied ? (
                              <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-md">
                                ✓ {p.doctorDiscountPercent || discountPercent}% Discount Applied
                              </span>
                            ) : (
                              <span className="text-[10px] text-slate-400">Regular Tariff</span>
                            )}
                          </td>
                          <td className="py-3.5">
                            <span
                              className={`inline-block rounded-md px-2 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                                p.status === 'completed'
                                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                  : p.status === 'processing'
                                  ? 'bg-cyan-50 text-cyan-800 border border-cyan-200'
                                  : p.status === 'sample_collected'
                                  ? 'bg-blue-50 text-blue-800 border border-blue-200'
                                  : p.status === 'confirmed'
                                  ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                  : 'bg-slate-100 text-slate-700'
                              }`}
                            >
                              {p.status.replace('_', ' ')}
                            </span>
                          </td>
                          <td className="py-3.5 text-slate-500 text-[11px]">
                            {p.date}
                            <span className="block text-[10px] text-slate-400">{p.timeSlot}</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 3: REFER A PATIENT (DIRECT BOOKING BY DOCTOR)
           ======================================================== */}
        {activeTab === 'refer' && (
          <div className="max-w-3xl mx-auto space-y-6 animate-fadeIn">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              
              {/* Form Title & Info */}
              <div className="border-b border-slate-100 pb-4">
                <div className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-bold text-cyan-800 border border-cyan-200 mb-2">
                  <Percent size={13} className="text-cyan-600" />
                  Your {discountPercent}% Clinic Discount Applied Automatically
                </div>
                <h2 className="text-xl sm:text-2xl font-black text-[#073b66]">
                  Prescribe & Schedule Patient Test
                </h2>
                <p className="text-xs text-slate-500 mt-1">
                  Referred by: <strong>{doctor?.name}</strong> ({doctor?.clinicName || 'Clinic'})
                </p>
              </div>

              {referralSuccess && (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-xs text-emerald-900 space-y-2 animate-fadeIn">
                  <div className="flex items-center gap-2 font-black text-emerald-800 text-sm">
                    <CheckCircle2 size={18} />
                    <span>Patient Referral Successfully Created!</span>
                  </div>
                  <p>
                    Reference Number: <strong className="font-mono text-emerald-950 font-black">{referralSuccess.reference}</strong>
                  </p>
                  <p>
                    Patient: <strong>{referralSuccess.patientName}</strong> ({referralSuccess.phone})
                  </p>
                  <p className="font-semibold">
                    Net Discounted Amount: ₹{(referralSuccess.totalAmountPaise / 100).toLocaleString('en-IN')} (Saved ₹{(referralSuccess.discountAmountPaise / 100).toLocaleString('en-IN')})
                  </p>
                </div>
              )}

              {referralError && (
                <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2 animate-fadeIn">
                  <AlertCircle size={17} className="shrink-0 mt-0.5 text-red-600" />
                  <span>{referralError}</span>
                </div>
              )}

              <form onSubmit={handleReferralSubmit} className="space-y-5">
                
                {/* Patient Information */}
                <div className="space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    1. Patient Details
                  </h4>
                  <div className="grid gap-4 sm:grid-cols-2">
                    <div>
                      <label className="field-label">Patient Full Name *</label>
                      <input
                        type="text"
                        required
                        value={referralForm.patientName}
                        onChange={(e) => setReferralForm({ ...referralForm, patientName: e.target.value })}
                        placeholder="e.g. Anand Sharma"
                        className="field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label">10-Digit Mobile Number *</label>
                      <input
                        type="tel"
                        required
                        pattern="[6-9][0-9]{9}"
                        value={referralForm.phone}
                        onChange={(e) => setReferralForm({ ...referralForm, phone: e.target.value })}
                        placeholder="98XXXXXXXX"
                        className="field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label">Patient Age (Years)</label>
                      <input
                        type="number"
                        min="0"
                        max="130"
                        value={referralForm.age}
                        onChange={(e) => setReferralForm({ ...referralForm, age: e.target.value })}
                        placeholder="e.g. 45"
                        className="field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label">Gender</label>
                      <select
                        value={referralForm.gender}
                        onChange={(e) => setReferralForm({ ...referralForm, gender: e.target.value })}
                        className="field text-xs"
                      >
                        <option value="prefer_not_to_say">Select Gender</option>
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Test Selection */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    2. Prescribed Diagnostic Investigation
                  </h4>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="field-label">Investigation Category</label>
                      <div className="grid grid-cols-2 gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setReferralForm({
                              ...referralForm,
                              selectedItemType: 'test',
                              selectedItemName: catalogueData.tests[0]?.name || '',
                            })
                          }}
                          className={`py-2 text-xs font-extrabold rounded-xl border transition ${
                            referralForm.selectedItemType === 'test'
                              ? 'bg-[#073b66] text-white border-[#073b66]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Individual Test
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            setReferralForm({
                              ...referralForm,
                              selectedItemType: 'package',
                              selectedItemName: catalogueData.packages[0]?.name || '',
                            })
                          }}
                          className={`py-2 text-xs font-extrabold rounded-xl border transition ${
                            referralForm.selectedItemType === 'package'
                              ? 'bg-[#073b66] text-white border-[#073b66]'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          Health Package
                        </button>
                      </div>
                    </div>

                    <div>
                      <label className="field-label">Select Test / Profile *</label>
                      <select
                        value={referralForm.selectedItemName}
                        onChange={(e) => setReferralForm({ ...referralForm, selectedItemName: e.target.value })}
                        className="field text-xs"
                        required
                      >
                        {referralForm.selectedItemType === 'test'
                          ? catalogueData.tests.map((t) => (
                              <option key={t._id} value={t.name}>
                                {t.name} ({t.department})
                              </option>
                            ))
                          : catalogueData.packages.map((p) => (
                              <option key={p._id} value={p.name}>
                                {p.name}
                              </option>
                            ))}
                      </select>
                    </div>
                  </div>

                  {/* Live Price Calculator Breakdown */}
                  {selectedTestItem && (
                    <div className="rounded-2xl border border-cyan-200 bg-cyan-50/60 p-4 text-xs space-y-2">
                      <div className="flex items-center justify-between font-bold text-[#073b66]">
                        <span>Regular Lab Tariff:</span>
                        <span>₹{((selectedTestItem.pricePaise || 0) / 100).toLocaleString('en-IN')}</span>
                      </div>
                      <div className="flex items-center justify-between font-bold text-emerald-700">
                        <span>Your Doctor Referral Discount ({discountPercent}%):</span>
                        <span>
                          -₹{(Math.round((selectedTestItem.pricePaise * (discountPercent / 100)) / 100)).toLocaleString('en-IN')}
                        </span>
                      </div>
                      <div className="pt-2 border-t border-cyan-200/80 flex items-center justify-between font-black text-base text-[#073b66]">
                        <span>Net Patient Tariff:</span>
                        <span className="text-cyan-800">
                          ₹{((Math.max(0, selectedTestItem.pricePaise - Math.round(selectedTestItem.pricePaise * (discountPercent / 100)))) / 100).toLocaleString('en-IN')}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Appointment Schedule & Visit Type */}
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-400">
                    3. Appointment & Visit Details
                  </h4>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <div>
                      <label className="field-label">Sample Collection Mode</label>
                      <select
                        value={referralForm.collectionType}
                        onChange={(e) => setReferralForm({ ...referralForm, collectionType: e.target.value })}
                        className="field text-xs"
                      >
                        <option value="centre">Centre Visit (Mandideep)</option>
                        <option value="home">Home Blood Collection</option>
                      </select>
                    </div>

                    <div>
                      <label className="field-label">Date</label>
                      <input
                        type="date"
                        required
                        value={referralForm.date}
                        onChange={(e) => setReferralForm({ ...referralForm, date: e.target.value })}
                        className="field text-xs"
                      />
                    </div>

                    <div>
                      <label className="field-label">Time Slot</label>
                      <select
                        value={referralForm.timeSlot}
                        onChange={(e) => setReferralForm({ ...referralForm, timeSlot: e.target.value })}
                        className="field text-xs"
                      >
                        <option value="07:00 AM - 09:00 AM">07:00 AM - 09:00 AM</option>
                        <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                        <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                        <option value="01:00 PM - 03:00 PM">01:00 PM - 03:00 PM</option>
                        <option value="03:00 PM - 05:00 PM">03:00 PM - 05:00 PM</option>
                        <option value="05:00 PM - 07:00 PM">05:00 PM - 07:00 PM</option>
                      </select>
                    </div>
                  </div>

                  {referralForm.collectionType === 'home' && (
                    <div>
                      <label className="field-label">Mandideep Home Address *</label>
                      <input
                        type="text"
                        required
                        value={referralForm.address}
                        onChange={(e) => setReferralForm({ ...referralForm, address: e.target.value })}
                        placeholder="House no., colony, street in Mandideep"
                        className="field text-xs"
                      />
                    </div>
                  )}

                  <div>
                    <label className="field-label">Clinical Prescription Notes (Optional)</label>
                    <input
                      type="text"
                      value={referralForm.clinicalNotes}
                      onChange={(e) => setReferralForm({ ...referralForm, clinicalNotes: e.target.value })}
                      placeholder="e.g. Fasting sample required, check for persistent fever"
                      className="field text-xs"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={referralSubmitting}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-[#073b66] py-3.5 text-xs sm:text-sm font-black text-white shadow-md hover:bg-cyan-700 active:scale-[0.99] transition disabled:opacity-50"
                >
                  {referralSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Scheduling Patient Referral...</span>
                    </>
                  ) : (
                    <>
                      <span>Confirm & Prescribe Investigation ({discountPercent}% Discount)</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 4: DISCOUNTED TEST DIRECTORY
           ======================================================== */}
        {activeTab === 'catalogue' && (
          <div className="space-y-5 animate-fadeIn">
            {/* Header info */}
            <div className="rounded-3xl border border-cyan-200 bg-gradient-to-r from-cyan-50/80 to-white p-5 shadow-xs flex flex-col sm:flex-row items-center justify-between gap-4">
              <div>
                <span className="inline-block rounded-md bg-cyan-700 text-white text-[10px] font-black uppercase px-2 py-0.5 mb-1">
                  Doctor Tariff Schedule
                </span>
                <h3 className="text-lg font-black text-[#073b66]">
                  Diagnostic Catalogue for {doctor?.name}
                </h3>
                <p className="text-xs text-slate-500">
                  Tariffs below reflect your configured <strong>{discountPercent}% doctor referral discount</strong>.
                </p>
              </div>

              <div className="relative w-full sm:w-72">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                <input
                  type="text"
                  value={catalogueSearch}
                  onChange={(e) => setCatalogueSearch(e.target.value)}
                  placeholder="Filter tests (CBC, LFT, Lipid)..."
                  className="field pl-10 text-xs py-2"
                />
              </div>
            </div>

            {/* Test Cards Grid */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {catalogueData.tests
                .filter((t) => {
                  if (!catalogueSearch.trim()) return true
                  const q = catalogueSearch.toLowerCase()
                  return t.name.toLowerCase().includes(q) || t.department?.toLowerCase().includes(q) || t.shortCode?.toLowerCase().includes(q)
                })
                .map((test) => {
                  const basePrice = test.pricePaise / 100
                  const doctorPrice = test.doctorPricePaise / 100
                  const savings = basePrice - doctorPrice

                  return (
                    <div
                      key={test._id}
                      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs flex flex-col justify-between hover:border-cyan-300 transition"
                    >
                      <div className="space-y-3">
                        <div className="flex items-start justify-between gap-2">
                          <span className="rounded-lg bg-blue-50 px-2 py-0.5 text-[10px] font-bold text-blue-800">
                            {test.department}
                          </span>
                          <span className="text-[10px] font-bold text-slate-400">
                            {test.turnaroundHours}h TAT
                          </span>
                        </div>

                        <div>
                          <h4 className="text-sm font-black text-[#073b66] leading-snug">{test.name}</h4>
                          {test.shortCode && (
                            <span className="text-[10px] font-bold text-cyan-600">{test.shortCode}</span>
                          )}
                        </div>

                        <p className="text-[11px] text-slate-500 line-clamp-2 leading-relaxed">
                          {test.description}
                        </p>

                        <div className="text-[10px] text-slate-500 bg-slate-50 p-2 rounded-lg border border-slate-100 space-y-0.5">
                          <div><strong>Sample:</strong> {test.sampleType || 'Venous Blood'}</div>
                          <div><strong>Fasting:</strong> {test.fastingRequired ? 'Required' : 'No'}</div>
                        </div>
                      </div>

                      <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                        <div>
                          <div className="text-[10px] text-slate-400 line-through">
                            Lab: ₹{basePrice.toLocaleString('en-IN')}
                          </div>
                          <div className="text-sm font-black text-cyan-700">
                            ₹{doctorPrice.toLocaleString('en-IN')}
                            <span className="text-[10px] text-emerald-600 font-bold ml-1">
                              ({discountPercent}% OFF)
                            </span>
                          </div>
                        </div>

                        <button
                          onClick={() => {
                            setReferralForm((prev) => ({
                              ...prev,
                              selectedItemType: 'test',
                              selectedItemName: test.name,
                            }))
                            setActiveTab('refer')
                          }}
                          className="rounded-xl bg-[#073b66] px-3 py-1.5 text-xs font-bold text-white hover:bg-cyan-700 transition"
                        >
                          Prescribe
                        </button>
                      </div>
                    </div>
                  )
                })}
            </div>
          </div>
        )}

        {/* ========================================================
            TAB 5: DOCTOR PROFILE & SETTINGS
           ======================================================== */}
        {activeTab === 'profile' && (
          <div className="max-w-2xl mx-auto space-y-6 animate-fadeIn">
            <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-8 shadow-xs space-y-6">
              
              <div className="flex items-center gap-4 border-b border-slate-100 pb-5">
                <div className="grid h-16 w-16 place-items-center rounded-2xl bg-cyan-50 text-[#073b66] border border-cyan-100">
                  <Stethoscope size={30} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-[#073b66]">{doctor?.name}</h3>
                  <p className="text-xs text-slate-500 font-semibold">
                    {doctor?.qualification} • {doctor?.specialization}
                  </p>
                  <span className="inline-block mt-1 text-[11px] font-black text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
                    {discountPercent}% Clinical Referral Discount Active
                  </span>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2 text-xs">
                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Registered Mobile</span>
                  <strong className="text-slate-800 text-sm font-mono">{doctor?.mobile}</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Email Address</span>
                  <strong className="text-slate-800 text-sm">{doctor?.email}</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Clinic Practice</span>
                  <strong className="text-slate-800">{doctor?.clinicName || 'Private Practice'}</strong>
                </div>

                <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Referral Code</span>
                  <strong className="text-cyan-700 font-mono text-sm">{doctor?.referralCode || 'DOC-DEFAULT'}</strong>
                </div>

                <div className="sm:col-span-2 p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                  <span className="text-slate-400 font-bold block text-[10px] uppercase">Clinic Address</span>
                  <p className="text-slate-700 font-medium">{doctor?.clinicAddress}</p>
                </div>
              </div>

              {/* Informative notice on discount modification */}
              <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs text-blue-950 flex items-start gap-2.5">
                <Info size={17} className="shrink-0 text-blue-700 mt-0.5" />
                <div>
                  <strong className="block font-bold">Discount Rate Governance:</strong>
                  Your referral discount rate ({discountPercent}%) is custom-configured by laboratory administration in accordance with Mandideep diagnostic tie-up standards. To adjust your discount percentage or add clinic branches, contact the laboratory administrative desk.
                </div>
              </div>

            </div>
          </div>
        )}

      </div>
    </div>
  )
}

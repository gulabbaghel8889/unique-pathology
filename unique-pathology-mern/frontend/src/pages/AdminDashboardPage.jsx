import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  Activity,
  BarChart3,
  CalendarCheck,
  CheckCircle2,
  Clock,
  CreditCard,
  FileText,
  Home,
  LogOut,
  Microscope,
  Package,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Trash2,
  Upload,
  UserCheck,
  Users,
  AlertCircle,
  X,
  Edit,
  Mail,
  Eye,
  Check,
  Stethoscope,
  Percent,
  ToggleLeft,
  ToggleRight,
  Building2,
  Phone,
  ArrowRight,
  Tag,
  Copy,
  Sparkles,
  TrendingUp,
  Gift,
  Layers,
  Calendar,
  ExternalLink,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiRequest } from '../api.js'

export function AdminDashboardPage() {
  const { admin, logout, isAuthenticated } = useAuth()
  const navigate = useNavigate()

  const [activeTab, setActiveTab] = useState('overview')
  const [metrics, setMetrics] = useState(null)
  const [bookings, setBookings] = useState([])
  const [tests, setTests] = useState([])
  const [packages, setPackages] = useState([])
  const [reports, setReports] = useState([])
  const [payments, setPayments] = useState([])
  const [enquiries, setEnquiries] = useState([])
  const [auditLogs, setAuditLogs] = useState([])
  const [doctors, setDoctors] = useState([])

  const [patients, setPatients] = useState([])
  const [patientSearch, setPatientSearch] = useState('')
  const [testSearch, setTestSearch] = useState('')
  const [testCategoryFilter, setTestCategoryFilter] = useState('all')
  const [testStatusFilter, setTestStatusFilter] = useState('all')

  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [actionNotice, setActionNotice] = useState('')

  // Bookings filter state
  const [bookingDoctorFilter, setBookingDoctorFilter] = useState('all')
  const [bookingStatusFilter, setBookingStatusFilter] = useState('all')
  const [bookingSearch, setBookingSearch] = useState('')

  // Doctor state & modal
  const [doctorModalOpen, setDoctorModalOpen] = useState(false)
  const [editingDoctor, setEditingDoctor] = useState(null)
  const [doctorSearch, setDoctorSearch] = useState('')
  const [doctorStatusFilter, setDoctorStatusFilter] = useState('all')
  const [doctorForm, setDoctorForm] = useState({
    name: '',
    email: '',
    mobile: '',
    password: '',
    discountPercent: 10,
    commissionPercent: 0,
    specialization: 'General Physician',
    qualification: 'MBBS',
    clinicName: '',
    clinicAddress: '',
    status: 'active',
    referralCode: '',
    notes: '',
  })

  // Offer & Campaign State
  const defaultOfferForm = {
    name: '',
    title: '',
    description: '',
    code: '',
    offerType: 'festival',
    badgeText: 'Limited Festive Offer',
    bannerGradient: 'from-amber-500 via-rose-500 to-red-600',
    bannerUrl: '',
    applicabilityType: 'all',
    applicableCategories: [],
    applicablePackageIds: [],
    applicableTestIds: [],
    discountType: 'percentage',
    discountValue: 20,
    minOrderAmountPaise: 0,
    startDate: new Date().toISOString().slice(0, 10),
    endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10),
    isActive: true,
    priority: 10,
    maxUsageCount: '',
    terms: 'Valid on direct lab bookings and home collections in Mandideep.\nCannot be clubbed with corporate contractual tariffs.\nFinal appointment confirmed by laboratory phlebotomist.',
  }

  const [offers, setOffers] = useState([])
  const [offerMetrics, setOfferMetrics] = useState(null)
  const [offerSearch, setOfferSearch] = useState('')
  const [offerStatusFilter, setOfferStatusFilter] = useState('all')
  const [offerTypeFilter, setOfferTypeFilter] = useState('all')
  const [offerModalOpen, setOfferModalOpen] = useState(false)
  const [editingOffer, setEditingOffer] = useState(null)
  const [offerForm, setOfferForm] = useState(defaultOfferForm)
  const [offerSubmitting, setOfferSubmitting] = useState(false)
  const [offerFormError, setOfferFormError] = useState('')

  // Modals
  const [testModalOpen, setTestModalOpen] = useState(false)
  const [editingTest, setEditingTest] = useState(null)
  const [packageModalOpen, setPackageModalOpen] = useState(false)
  const [editingPackage, setEditingPackage] = useState(null)
  const [reportUploadModalOpen, setReportUploadModalOpen] = useState(false)

  // Test form state
  const [testForm, setTestForm] = useState({
    name: '',
    shortCode: '',
    category: 'General Health',
    department: 'Clinical Biochemistry',
    description: '',
    sampleType: 'Venous Blood',
    fastingRequired: false,
    turnaroundHours: 12,
    pricePaise: 35000,
    mrpPaise: 50000,
    isVerifiedPrice: false,
    priceNote: 'Demo indicative price. Final price confirmed by lab desk.',
    isActive: true,
  })

  // Package form state
  const [packageForm, setPackageForm] = useState({
    name: '',
    code: '',
    category: 'Preventive Wellness',
    tagline: '',
    description: '',
    testsIncludedInput: '',
    sampleType: 'Blood & Spot Urine',
    fastingRequired: true,
    fastingInstructions: '10–12 hours overnight fasting recommended. Water is permitted.',
    pricePaise: 110000,
    mrpPaise: 150000,
    isVerifiedPrice: false,
    priceNote: 'Demo/indicative package pricing. Subject to laboratory verification.',
    badge: 'Popular Routine',
    isActive: true,
    isFeatured: true,
  })

  // Report upload state
  const [uploadRef, setUploadRef] = useState('')
  const [uploadTitle, setUploadTitle] = useState('')
  const [uploadPathologist, setUploadPathologist] = useState('Duty Clinical Pathologist')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploadBusy, setUploadBusy] = useState(false)

  useEffect(() => {
    if (!isAuthenticated) {
      navigate('/admin/login')
    }
  }, [isAuthenticated, navigate])

  async function loadAllDashboardData() {
    setRefreshing(true)
    try {
      const results = await Promise.allSettled([
        apiRequest('/admin/metrics'),
        apiRequest('/admin/bookings?limit=500'),
        apiRequest('/admin/tests'),
        apiRequest('/packages'),
        apiRequest('/admin/reports'),
        apiRequest('/admin/payments'),
        apiRequest('/admin/enquiries'),
        apiRequest('/admin/audit-logs'),
        apiRequest('/admin/doctors'),
        apiRequest('/admin/patients'),
        apiRequest('/admin/offers'),
        apiRequest('/admin/offers/analytics'),
      ])

      const [mRes, bRes, tRes, pRes, rRes, payRes, enqRes, audRes, docRes, patRes, offRes, offAnRes] = results

      if (mRes.status === 'fulfilled') setMetrics(mRes.value?.metrics || {})
      if (bRes.status === 'fulfilled') setBookings(bRes.value?.bookings || [])
      if (tRes.status === 'fulfilled') setTests(tRes.value?.tests || [])
      if (pRes.status === 'fulfilled') setPackages(pRes.value?.packages || [])
      if (rRes.status === 'fulfilled') setReports(rRes.value?.reports || [])
      if (payRes.status === 'fulfilled') setPayments(payRes.value?.payments || [])
      if (enqRes.status === 'fulfilled') setEnquiries(enqRes.value?.enquiries || [])
      if (audRes.status === 'fulfilled') setAuditLogs(audRes.value?.logs || [])
      if (docRes.status === 'fulfilled') setDoctors(docRes.value?.doctors || [])
      if (patRes.status === 'fulfilled') setPatients(patRes.value?.patients || [])
      if (offRes.status === 'fulfilled') setOffers(offRes.value?.offers || [])
      if (offAnRes.status === 'fulfilled') setOfferMetrics(offAnRes.value?.metrics || null)
    } catch (err) {
      console.warn('Dashboard data fetch error:', err.message)
    } finally {
      setRefreshing(false)
      setLoading(false)
    }
  }

  async function handleToggleTestStatus(id, currentStatus, name) {
    try {
      const nextStatus = !currentStatus
      await apiRequest(`/admin/tests/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
      })
      setActionNotice(`Test "${name}" is now ${nextStatus ? 'Active & Visible' : 'Disabled & Hidden'}.`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Error updating test status: ${err.message}`)
    }
  }

  useEffect(() => {
    if (isAuthenticated) {
      loadAllDashboardData()
    }
  }, [isAuthenticated])

  // Booking actions
  async function updateBookingStatus(id, newStatus) {
    try {
      await apiRequest(`/admin/bookings/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: newStatus }),
      })
      setActionNotice(`Booking status updated to ${newStatus}`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Error updating status: ${err.message}`)
    }
  }

  async function updateBookingPayment(id, paymentStatus) {
    try {
      await apiRequest(`/admin/bookings/${id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({ paymentStatus, notes: 'Updated from admin console' }),
      })
      setActionNotice(`Payment status updated to ${paymentStatus}`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Error updating payment: ${err.message}`)
    }
  }

  // Test form submit
  async function handleTestSubmit(e) {
    e.preventDefault()
    try {
      if (editingTest) {
        await apiRequest(`/admin/tests/${editingTest._id}`, {
          method: 'PUT',
          body: JSON.stringify(testForm),
        })
        setActionNotice(`Test "${testForm.name}" updated successfully.`)
      } else {
        await apiRequest('/admin/tests', {
          method: 'POST',
          body: JSON.stringify(testForm),
        })
        setActionNotice(`Test "${testForm.name}" created.`)
      }
      setTestModalOpen(false)
      setEditingTest(null)
      loadAllDashboardData()
    } catch (err) {
      alert(`Failed to save test: ${err.message}`)
    }
  }

  async function handleDeleteTest(id, name) {
    if (!window.confirm(`Are you sure you want to delete test "${name}"?`)) return
    try {
      await apiRequest(`/admin/tests/${id}`, { method: 'DELETE' })
      setActionNotice(`Test "${name}" deleted.`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // Package form submit
  async function handlePackageSubmit(e) {
    e.preventDefault()
    try {
      const testsArray = packageForm.testsIncludedInput
        ? packageForm.testsIncludedInput.split(',').map((s) => s.trim()).filter(Boolean)
        : []

      const payload = {
        name: packageForm.name.trim(),
        code: packageForm.code.trim().toUpperCase(),
        category: packageForm.category,
        tagline: packageForm.tagline.trim(),
        description: packageForm.description.trim(),
        testsIncluded: testsArray,
        sampleType: packageForm.sampleType.trim() || 'Blood & Spot Urine',
        fastingRequired: Boolean(packageForm.fastingRequired),
        fastingInstructions: packageForm.fastingInstructions.trim(),
        pricePaise: Number(packageForm.pricePaise),
        mrpPaise: Number(packageForm.mrpPaise || 0),
        isVerifiedPrice: Boolean(packageForm.isVerifiedPrice),
        priceNote: packageForm.priceNote.trim(),
        badge: packageForm.badge.trim(),
        isActive: Boolean(packageForm.isActive),
        isFeatured: Boolean(packageForm.isFeatured),
      }

      if (editingPackage) {
        await apiRequest(`/admin/packages/${editingPackage._id}`, {
          method: 'PUT',
          body: JSON.stringify(payload),
        })
        setActionNotice(`Package "${payload.name}" updated successfully.`)
      } else {
        await apiRequest('/admin/packages', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        setActionNotice(`Package "${payload.name}" created successfully.`)
      }
      setPackageModalOpen(false)
      setEditingPackage(null)
      loadAllDashboardData()
    } catch (err) {
      alert(`Failed to save package: ${err.message}`)
    }
  }

  async function handleDeletePackage(id, name) {
    if (!window.confirm(`Are you sure you want to delete package "${name}"?`)) return
    try {
      await apiRequest(`/admin/packages/${id}`, { method: 'DELETE' })
      setActionNotice(`Package "${name}" deleted.`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // Report upload submit
  async function handleReportUploadSubmit(e) {
    e.preventDefault()
    if (!selectedFile) {
      alert('Please select a report file (PDF, JPG, or PNG).')
      return
    }

    setUploadBusy(true)
    try {
      const formData = new FormData()
      formData.append('reportFile', selectedFile)
      formData.append('bookingReference', uploadRef.trim().toUpperCase())
      formData.append('reportTitle', uploadTitle.trim())
      formData.append('verifiedByPathologistName', uploadPathologist.trim())

      await apiRequest('/admin/reports/upload', {
        method: 'POST',
        body: formData,
      })

      setActionNotice(`Report uploaded and released for booking ${uploadRef.toUpperCase()}`)
      setReportUploadModalOpen(false)
      setSelectedFile(null)
      setUploadRef('')
      setUploadTitle('')
      loadAllDashboardData()
    } catch (err) {
      alert(`Upload error: ${err.message}`)
    } finally {
      setUploadBusy(false)
    }
  }

  async function handleDeleteReport(id) {
    if (!window.confirm('Delete this report and remove its file from private storage?')) return
    try {
      await apiRequest(`/admin/reports/${id}`, { method: 'DELETE' })
      setActionNotice('Report deleted from private storage.')
      loadAllDashboardData()
    } catch (err) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // Doctor management handlers
  function handleOpenCreateDoctor() {
    setEditingDoctor(null)
    setDoctorForm({
      name: '',
      email: '',
      mobile: '',
      password: '',
      discountPercent: 10,
      commissionPercent: 0,
      specialization: 'General Physician',
      qualification: 'MBBS',
      clinicName: '',
      clinicAddress: '',
      status: 'active',
      referralCode: '',
      notes: '',
    })
    setDoctorModalOpen(true)
  }

  function handleOpenEditDoctor(doc) {
    setEditingDoctor(doc)
    setDoctorForm({
      name: doc.name || '',
      email: doc.email || '',
      mobile: doc.mobile || '',
      password: '',
      discountPercent: doc.discountPercent ?? 10,
      commissionPercent: doc.commissionPercent ?? 0,
      specialization: doc.specialization || 'General Physician',
      qualification: doc.qualification || 'MBBS',
      clinicName: doc.clinicName || '',
      clinicAddress: doc.clinicAddress || '',
      status: doc.status || 'active',
      referralCode: doc.referralCode || '',
      notes: doc.notes || '',
    })
    setDoctorModalOpen(true)
  }

  async function handleDoctorSubmit(e) {
    e.preventDefault()
    try {
      const payload = {
        name: doctorForm.name.trim(),
        email: doctorForm.email.trim().toLowerCase(),
        mobile: doctorForm.mobile.trim(),
        discountPercent: Number(doctorForm.discountPercent),
        commissionPercent: Number(doctorForm.commissionPercent || 0),
        specialization: doctorForm.specialization.trim(),
        qualification: doctorForm.qualification.trim(),
        clinicName: doctorForm.clinicName.trim(),
        clinicAddress: doctorForm.clinicAddress.trim(),
        status: doctorForm.status,
        referralCode: doctorForm.referralCode ? doctorForm.referralCode.trim().toUpperCase() : undefined,
        notes: doctorForm.notes ? doctorForm.notes.trim() : undefined,
      }

      if (doctorForm.password && doctorForm.password.trim()) {
        payload.password = doctorForm.password.trim()
      }

      if (editingDoctor) {
        await apiRequest(`/admin/doctors/${editingDoctor._id}`, {
          method: 'PUT',
          authType: 'admin',
          body: JSON.stringify(payload),
        })
        setActionNotice(`Doctor "${payload.name}" updated successfully with ${payload.discountPercent}% discount.`)
      } else {
        if (!doctorForm.password || doctorForm.password.trim().length < 6) {
          alert('Please enter a password with at least 6 characters.')
          return
        }
        await apiRequest('/admin/doctors', {
          method: 'POST',
          authType: 'admin',
          body: JSON.stringify(payload),
        })
        setActionNotice(`Doctor "${payload.name}" registered with ${payload.discountPercent}% discount.`)
      }

      setDoctorModalOpen(false)
      setEditingDoctor(null)
      loadAllDashboardData()
    } catch (err) {
      alert(`Doctor save error: ${err.message}`)
    }
  }

  async function handleToggleDoctorStatus(id, currentStatus, name) {
    const newStatus = currentStatus === 'active' ? 'inactive' : 'active'
    try {
      await apiRequest(`/admin/doctors/${id}/status`, {
        method: 'PATCH',
        authType: 'admin',
        body: JSON.stringify({ status: newStatus }),
      })
      setActionNotice(`Doctor "${name}" status changed to ${newStatus}.`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Status error: ${err.message}`)
    }
  }

  async function handleDeleteDoctor(id, name) {
    if (!window.confirm(`Are you sure you want to remove doctor "${name}"?`)) return
    try {
      const res = await apiRequest(`/admin/doctors/${id}`, { method: 'DELETE', authType: 'admin' })
      setActionNotice(res.message || `Doctor "${name}" removed.`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Delete error: ${err.message}`)
    }
  }

  // Offer action handlers
  function handleOpenOfferModal(offer = null) {
    setOfferFormError('')
    if (offer) {
      setEditingOffer(offer)
      setOfferForm({
        name: offer.name || '',
        title: offer.title || '',
        description: offer.description || '',
        code: offer.code || '',
        offerType: offer.offerType || 'festival',
        badgeText: offer.badgeText || 'Special Campaign Offer',
        bannerGradient: offer.bannerGradient || 'from-amber-500 via-rose-500 to-red-600',
        bannerUrl: offer.bannerUrl || '',
        applicabilityType: offer.applicabilityType || 'all',
        applicableCategories: offer.applicableCategories || [],
        applicablePackageIds: (offer.applicablePackageIds || []).map((p) => (typeof p === 'object' && p !== null ? String(p._id) : String(p))),
        applicableTestIds: (offer.applicableTestIds || []).map((t) => (typeof t === 'object' && t !== null ? String(t._id) : String(t))),
        discountType: offer.discountType || 'percentage',
        discountValue: offer.discountType === 'percentage'
          ? offer.discountValue
          : Math.round((offer.discountValue || 0) / 100),
        minOrderAmountPaise: Math.round((offer.minOrderAmountPaise || 0) / 100),
        startDate: offer.startDate ? new Date(offer.startDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        endDate: offer.endDate ? new Date(offer.endDate).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10),
        isActive: Boolean(offer.isActive),
        priority: offer.priority || 1,
        maxUsageCount: offer.maxUsageCount ? String(offer.maxUsageCount) : '',
        terms: Array.isArray(offer.terms) ? offer.terms.join('\n') : (offer.terms || ''),
      })
    } else {
      setEditingOffer(null)
      setOfferForm(defaultOfferForm)
    }
    setOfferModalOpen(true)
  }

  async function handleOfferSubmit(e) {
    e.preventDefault()
    setOfferFormError('')
    setOfferSubmitting(true)
    try {
      const rawDiscount = Number(offerForm.discountValue) || 0
      const discountValue = offerForm.discountType === 'percentage'
        ? rawDiscount
        : Math.round(rawDiscount * 100)

      const termsArray = typeof offerForm.terms === 'string'
        ? offerForm.terms.split('\n').map((s) => s.trim()).filter(Boolean)
        : []

      const payload = {
        name: offerForm.name.trim(),
        title: offerForm.title.trim(),
        description: offerForm.description.trim(),
        code: offerForm.code.trim().toUpperCase() || undefined,
        offerType: offerForm.offerType,
        badgeText: offerForm.badgeText.trim() || 'Special Campaign Offer',
        bannerGradient: offerForm.bannerGradient.trim() || 'from-amber-500 via-rose-500 to-red-600',
        bannerUrl: offerForm.bannerUrl.trim() || undefined,
        applicabilityType: offerForm.applicabilityType,
        applicableCategories: offerForm.applicabilityType === 'category' ? offerForm.applicableCategories : [],
        applicablePackageIds: offerForm.applicabilityType === 'package' ? offerForm.applicablePackageIds : [],
        applicableTestIds: offerForm.applicabilityType === 'test' ? offerForm.applicableTestIds : [],
        discountType: offerForm.discountType,
        discountValue,
        minOrderAmountPaise: Math.round((Number(offerForm.minOrderAmountPaise) || 0) * 100),
        startDate: new Date(offerForm.startDate).toISOString(),
        endDate: new Date(offerForm.endDate + 'T23:59:59.999Z').toISOString(),
        isActive: Boolean(offerForm.isActive),
        priority: Number(offerForm.priority) || 1,
        maxUsageCount: offerForm.maxUsageCount ? Number(offerForm.maxUsageCount) : null,
        terms: termsArray,
      }

      const endpoint = editingOffer ? `/admin/offers/${editingOffer._id}` : '/admin/offers'
      const method = editingOffer ? 'PUT' : 'POST'

      await apiRequest(endpoint, {
        method,
        body: JSON.stringify(payload),
        authType: 'admin',
      })

      setActionNotice(
        editingOffer
          ? `Campaign offer "${payload.name}" updated successfully.`
          : `New promotional campaign "${payload.name}" created and published.`
      )
      setOfferModalOpen(false)
      loadAllDashboardData()
    } catch (err) {
      setOfferFormError(err.message || 'Failed to save offer.')
    } finally {
      setOfferSubmitting(false)
    }
  }

  async function handleToggleOfferStatus(id, currentStatus, name) {
    try {
      const nextStatus = !currentStatus
      await apiRequest(`/admin/offers/${id}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ isActive: nextStatus }),
        authType: 'admin',
      })
      setActionNotice(`Campaign "${name}" is now ${nextStatus ? 'Activated' : 'Deactivated'}.`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Error updating campaign status: ${err.message}`)
    }
  }

  async function handleDuplicateOffer(id, name) {
    try {
      const res = await apiRequest(`/admin/offers/${id}/duplicate`, {
        method: 'POST',
        authType: 'admin',
      })
      setActionNotice(`Campaign "${name}" duplicated as "${res.offer?.name || 'Copy'}".`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Failed to duplicate campaign: ${err.message}`)
    }
  }

  async function handleDeleteOffer(id, name) {
    if (!window.confirm(`Are you sure you want to permanently delete campaign "${name}"? This action cannot be undone.`)) {
      return
    }
    try {
      await apiRequest(`/admin/offers/${id}`, {
        method: 'DELETE',
        authType: 'admin',
      })
      setActionNotice(`Campaign "${name}" has been permanently deleted.`)
      loadAllDashboardData()
    } catch (err) {
      alert(`Failed to delete campaign: ${err.message}`)
    }
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Admin Top Navigation */}
      <header className="bg-[#052944] text-white sticky top-0 z-30 shadow-md">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-500/20 text-cyan-300 border border-cyan-400/30">
              <ShieldCheck size={20} />
            </span>
            <div>
              <span className="block text-sm font-black tracking-tight text-white leading-none">
                UNIQUE PATHOLOGY <span className="text-cyan-400">ADMIN</span>
              </span>
              <span className="block text-[10px] text-cyan-200 mt-0.5">Mandideep Laboratory Operations Console</span>
            </div>
          </div>

          <div className="flex items-center gap-4 text-xs font-semibold">
            <Link
              to="/"
              target="_blank"
              className="hidden sm:inline-block text-cyan-200 hover:text-white transition"
            >
              View Public Website ↗
            </Link>

            <button
              onClick={loadAllDashboardData}
              disabled={refreshing}
              className="p-2 text-cyan-300 hover:text-white rounded-lg hover:bg-white/10"
              title="Refresh Data"
            >
              <RefreshCw size={16} className={refreshing ? 'animate-spin' : ''} />
            </button>

            <div className="hidden md:flex flex-col text-right">
              <span className="text-white font-bold">{admin?.email}</span>
              <span className="text-[10px] text-cyan-300 uppercase tracking-wider">Super Administrator</span>
            </div>

            <button
              onClick={logout}
              className="inline-flex items-center gap-1.5 rounded-xl bg-red-600/80 px-3 py-2 text-xs font-bold text-white hover:bg-red-700 transition"
            >
              <LogOut size={14} />
              <span>Logout</span>
            </button>
          </div>
        </div>

        {/* Tab Navigation Bar */}
        <div className="border-t border-slate-800 bg-[#031d30] px-4 sm:px-6 lg:px-8 overflow-x-auto">
          <div className="mx-auto flex max-w-7xl gap-2 py-2">
            {[
              { id: 'overview', label: 'Overview Metrics', icon: BarChart3 },
              { id: 'doctors', label: `Doctors (${doctors.length})`, icon: Stethoscope },
              { id: 'offers', label: `Offers & Campaigns (${offers.length})`, icon: Tag },
              { id: 'bookings', label: `Bookings (${bookings.length})`, icon: CalendarCheck },
              { id: 'patients', label: `Patients (${patients.length})`, icon: Users },
              { id: 'tests', label: `Tests (${tests.length})`, icon: Microscope },
              { id: 'packages', label: `Packages (${packages.length})`, icon: Package },
              { id: 'reports', label: `Reports (${reports.length})`, icon: FileText },
              { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
              { id: 'enquiries', label: `Enquiries (${enquiries.length})`, icon: Mail },
              { id: 'audit', label: 'Audit Trail', icon: ShieldCheck },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`whitespace-nowrap px-3.5 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
                  activeTab === tab.id
                    ? 'bg-cyan-600 text-white shadow-sm'
                    : 'text-slate-300 hover:text-white hover:bg-white/5'
                }`}
              >
                <tab.icon size={15} />
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </header>

      {/* Main Content Area */}
      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {actionNotice && (
          <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 size={16} />
              <span>{actionNotice}</span>
            </div>
            <button onClick={() => setActionNotice('')}>
              <X size={16} />
            </button>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 1: OVERVIEW METRICS                                   */}
        {/* ========================================================= */}
        {activeTab === 'overview' && (
          <div className="space-y-8 animate-in fade-in">
            {/* 6 Analytical KPI Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
              {/* Card 1: Total Patients Booked */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <span className="text-xs font-bold text-slate-400 block uppercase tracking-wider">Total Patients</span>
                <span className="text-3xl font-black text-[#073b66] mt-1 block">
                  {metrics?.totalBookings ?? bookings.length}
                </span>
                <span className="text-[11px] text-cyan-700 font-bold mt-1 block">
                  {metrics?.uniquePatientsCount || new Set(bookings.map((b) => b.phone)).size} unique patients
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  {metrics?.todayBookings ?? 0} scheduled today
                </span>
              </div>

              {/* Card 2: Doctor Referrals */}
              <div className="rounded-2xl border-2 border-cyan-200 bg-cyan-50/50 p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-cyan-900 uppercase tracking-wider">Doctor Referrals</span>
                  <Stethoscope size={16} className="text-cyan-700" />
                </div>
                <span className="text-3xl font-black text-cyan-900 mt-1 block">
                  {metrics?.totalReferredBookings ?? bookings.filter((b) => b.doctorName || b.doctorId).length}
                </span>
                <span className="text-[11px] text-cyan-800 font-bold mt-1 block">
                  Across {doctors.length} registered doctors
                </span>
                <span className="text-[10px] text-emerald-700 font-bold mt-0.5 block">
                  ₹{Math.round((metrics?.totalDiscountGivenPaise || bookings.reduce((sum, b) => sum + (b.discountAmountPaise || 0), 0)) / 100)} concessions saved
                </span>
              </div>

              {/* Card 3: Diagnostic Tests Catalogue */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Test Catalogue</span>
                  <Microscope size={16} className="text-slate-400" />
                </div>
                <span className="text-3xl font-black text-[#073b66] mt-1 block">
                  {tests.length}
                </span>
                <span className="text-[11px] text-slate-600 font-bold mt-1 block">
                  +{packages.length} screening packages
                </span>
                <span className="text-[10px] text-emerald-600 font-bold mt-0.5 block">
                  {tests.filter((t) => t.isVerifiedPrice).length} verified official tariffs
                </span>
              </div>

              {/* Card 4: Home Sample Collections */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Home Visits</span>
                  <Home size={16} className="text-amber-600" />
                </div>
                <span className="text-3xl font-black text-amber-700 mt-1 block">
                  {metrics?.homeCollections ?? bookings.filter((b) => b.collectionType === 'home').length}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Mandideep & Bhopal area
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Doorstep phlebotomy
                </span>
              </div>

              {/* Card 5: Released Reports */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Reports Ready</span>
                  <FileText size={16} className="text-emerald-600" />
                </div>
                <span className="text-3xl font-black text-emerald-700 mt-1 block">
                  {metrics?.reportsCount ?? reports.length}
                </span>
                <span className="text-[11px] text-slate-500 font-medium mt-1 block">
                  Available for OTP download
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Pathologist verified
                </span>
              </div>

              {/* Card 6: Reconciled Revenue */}
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Revenue</span>
                  <CreditCard size={16} className="text-cyan-700" />
                </div>
                <span className="text-3xl font-black text-[#073b66] mt-1 block">
                  ₹{Math.round((metrics?.totalRevenuePaise || 0) / 100)}
                </span>
                <span className="text-[11px] text-emerald-600 font-bold mt-1 block">
                  {metrics?.paidBookings ?? bookings.filter((b) => b.paymentStatus === 'paid').length} paid receipts
                </span>
                <span className="text-[10px] text-slate-400 mt-0.5 block">
                  Desk & Online collections
                </span>
              </div>
            </div>

            {/* DOCTOR REFERRALS BREAKDOWN SECTION */}
            <div className="rounded-3xl border-2 border-cyan-100 bg-white p-6 shadow-xs space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-2.5">
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-100 text-cyan-800">
                    <Stethoscope size={20} />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-[#073b66]">
                      Referring Doctors & Patient Volumes
                    </h3>
                    <p className="text-xs text-slate-500">
                      Breakdown of each doctor&apos;s referred patient volume, custom discount rate, and generated test revenue.
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => setActiveTab('doctors')}
                    className="rounded-xl border border-cyan-200 bg-cyan-50/80 px-3.5 py-1.5 text-xs font-bold text-cyan-800 hover:bg-cyan-100 transition"
                  >
                    Manage Doctors ({doctors.length}) →
                  </button>
                  <button
                    onClick={handleOpenCreateDoctor}
                    className="rounded-xl bg-cyan-600 px-3.5 py-1.5 text-xs font-extrabold text-white hover:bg-cyan-700 transition flex items-center gap-1.5 shadow-sm"
                  >
                    <Plus size={14} />
                    <span>Add Doctor</span>
                  </button>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="py-2.5 px-3">Referring Doctor</th>
                      <th className="py-2.5 px-3">Specialization & Clinic</th>
                      <th className="py-2.5 px-3">Configured Discount %</th>
                      <th className="py-2.5 px-3">Total Referred Patients</th>
                      <th className="py-2.5 px-3">Tests Referred</th>
                      <th className="py-2.5 px-3">Generated Value</th>
                      <th className="py-2.5 px-3">Status</th>
                      <th className="py-2.5 px-3 text-right">Quick Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-medium">
                    {doctors.map((d) => (
                      <tr key={d._id} className="hover:bg-slate-50/70 transition">
                        <td className="py-3 px-3">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-7 w-7 place-items-center rounded-lg bg-cyan-100 text-cyan-800 font-black text-xs">
                              {d.name ? d.name.replace(/^Dr\.?\s*/i, '').charAt(0) : 'D'}
                            </span>
                            <div>
                              <strong className="block font-black text-[#073b66]">{d.name}</strong>
                              <span className="text-[10px] text-slate-400 font-mono">{d.mobile}</span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-3 text-slate-600">
                          <span className="block font-semibold text-slate-800">{d.specialization}</span>
                          <span className="text-[11px] text-slate-500">{d.clinicName || 'Clinic Mandideep'}</span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-300 font-black text-xs">
                            <Percent size={11} />
                            <span>{d.discountPercent}% OFF</span>
                          </span>
                        </td>

                        <td className="py-3 px-3">
                          <span className="font-black text-lg text-[#073b66]">
                            {d.totalReferredPatients || bookings.filter((b) => b.doctorName === d.name || String(b.doctorId) === String(d._id)).length}
                          </span>
                          <span className="text-slate-400 text-[11px] ml-1">patients</span>
                        </td>

                        <td className="py-3 px-3 text-slate-700">
                          <span className="font-bold text-slate-900">{d.totalTestsReferred || 0}</span> tests
                        </td>

                        <td className="py-3 px-3 font-mono font-bold text-emerald-700">
                          ₹{Math.round((d.totalRevenuePaise || 0) / 100)}
                        </td>

                        <td className="py-3 px-3">
                          <span
                            className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-black uppercase ${
                              d.status === 'active' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                            }`}
                          >
                            <span className={`h-1.5 w-1.5 rounded-full ${d.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                            <span>{d.status}</span>
                          </span>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setBookingDoctorFilter(d.name)
                              setActiveTab('bookings')
                            }}
                            className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100 transition"
                          >
                            Filter Bookings →
                          </button>
                        </td>
                      </tr>
                    ))}
                    {doctors.length === 0 && (
                      <tr>
                        <td colSpan={8} className="py-6 text-center text-slate-400">
                          No doctors registered yet. Click &quot;Add Doctor&quot; to register your first referring physician.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            {/* TWO COLUMNS: DOCTOR REFERRED PATIENT STREAM & RECENT TESTS UPDATES */}
            <div className="grid gap-6 lg:grid-cols-2">
              {/* Box 1: Recent Doctor-Referred Bookings */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#073b66] flex items-center gap-2">
                      <CalendarCheck size={18} className="text-cyan-600" />
                      <span>Recent Patient Bookings & Appointments</span>
                    </h3>
                    <p className="text-xs text-slate-500">Live stream of incoming patient bookings (Direct Walk-ins & Doctor Referrals)</p>
                  </div>
                  <button
                    onClick={() => {
                      setBookingDoctorFilter('all')
                      setActiveTab('bookings')
                    }}
                    className="text-xs font-bold text-cyan-700 hover:underline"
                  >
                    View All Bookings ({bookings.length}) →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-2">Patient</th>
                        <th className="pb-2">Channel / Doctor</th>
                        <th className="pb-2">Test & Tariff</th>
                        <th className="pb-2">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {bookings.slice(0, 8).map((b) => (
                        <tr key={b._id} className="hover:bg-slate-50/60">
                          <td className="py-2.5">
                            <strong className="block text-slate-900 font-bold">{b.patientName}</strong>
                            <span className="text-[10px] text-slate-500 font-mono">{b.phone}</span>
                          </td>

                          <td className="py-2.5">
                            {b.doctorName || b.doctorId ? (
                              <div>
                                <span className="inline-flex items-center gap-1 rounded-md bg-cyan-100 text-[#073b66] border border-cyan-300 px-2 py-0.5 text-[11px] font-black">
                                  <Stethoscope size={11} className="text-cyan-700" />
                                  <span>{b.doctorName || b.referredBy}</span>
                                </span>
                                {(b.doctorDiscountPercent || 0) > 0 && (
                                  <span className="block text-[10px] font-bold text-emerald-700 mt-0.5">
                                    {b.doctorDiscountPercent}% Concession
                                  </span>
                                )}
                              </div>
                            ) : (
                              <span className="inline-flex items-center gap-1 rounded-md bg-slate-100 text-slate-700 border border-slate-200 px-2 py-0.5 text-[11px] font-bold">
                                <span>Direct Walk-in</span>
                              </span>
                            )}
                          </td>

                          <td className="py-2.5">
                            <span className="block font-semibold text-slate-800 truncate max-w-[150px]">
                              {b.items?.map((i) => i.name).join(', ')}
                            </span>
                            <span className="text-[11px] font-bold text-slate-700 font-mono">
                              ₹{Math.round((b.totalAmountPaise || 0) / 100)}
                            </span>
                            {(b.discountAmountPaise || 0) > 0 && (
                              <span className="text-[10px] text-emerald-600 ml-1">
                                (Saved ₹{Math.round(b.discountAmountPaise / 100)})
                              </span>
                            )}
                          </td>

                          <td className="py-2.5">
                            <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                              b.status === 'completed'
                                ? 'bg-emerald-100 text-emerald-800'
                                : b.status === 'processing'
                                ? 'bg-cyan-100 text-cyan-800'
                                : b.status === 'confirmed'
                                ? 'bg-blue-100 text-blue-800'
                                : 'bg-slate-100 text-slate-700'
                            }`}>
                              {b.status}
                            </span>
                          </td>
                        </tr>
                      ))}
                      {bookings.length === 0 && (
                        <tr>
                          <td colSpan={4} className="py-6 text-center text-slate-400">
                            No patient bookings registered yet.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Box 2: Diagnostic Tests Catalogue Updates & Inventory */}
              <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-base font-black text-[#073b66] flex items-center gap-2">
                      <Microscope size={18} className="text-cyan-600" />
                      <span>Diagnostic Tests Catalogue Updates</span>
                    </h3>
                    <p className="text-xs text-slate-500">Live catalogue inventory & verified diagnostic tariffs</p>
                  </div>
                  <button
                    onClick={() => setActiveTab('tests')}
                    className="text-xs font-bold text-cyan-700 hover:underline"
                  >
                    Manage Catalogue ({tests.length}) →
                  </button>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b border-slate-100 text-slate-400 font-bold uppercase text-[10px]">
                        <th className="pb-2">Test Name</th>
                        <th className="pb-2">Department</th>
                        <th className="pb-2">Tariff</th>
                        <th className="pb-2">Specimen & TAT</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 font-medium">
                      {tests.slice(0, 6).map((t) => (
                        <tr key={t._id} className="hover:bg-slate-50/60">
                          <td className="py-2.5">
                            <strong className="block text-slate-900 font-bold">{t.name}</strong>
                            {t.shortCode && (
                              <span className="text-[10px] font-mono text-cyan-800 bg-cyan-50 px-1 rounded">
                                {t.shortCode}
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 text-slate-600 text-[11px]">
                            {t.department}
                          </td>

                          <td className="py-2.5">
                            <span className="font-mono font-bold text-slate-900 block">
                              ₹{Math.round((t.pricePaise || 0) / 100)}
                            </span>
                            {t.mrpPaise > t.pricePaise && (
                              <span className="text-[10px] text-slate-400 line-through">
                                MRP ₹{Math.round(t.mrpPaise / 100)}
                              </span>
                            )}
                          </td>

                          <td className="py-2.5 text-slate-500 text-[11px]">
                            <span className="block truncate max-w-[120px]">{t.sampleType || 'Venous Blood'}</span>
                            <span className="text-[10px] text-slate-400">{t.turnaroundHours || 12}h TAT</span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs">
                  <span className="text-slate-500 font-medium">
                    Showing latest 6 of {tests.length} tests and {packages.length} packages
                  </span>
                  <button
                    onClick={() => {
                      setEditingTest(null)
                      setTestForm({
                        name: '',
                        shortCode: '',
                        category: 'General Health',
                        department: 'Clinical Biochemistry',
                        description: '',
                        sampleType: 'Venous Blood',
                        fastingRequired: false,
                        turnaroundHours: 12,
                        pricePaise: 35000,
                        isVerifiedPrice: false,
                        priceNote: 'Demo indicative price. Subject to lab verification.',
                        isActive: true,
                      })
                      setTestModalOpen(true)
                    }}
                    className="inline-flex items-center gap-1 font-bold text-cyan-700 hover:underline"
                  >
                    <Plus size={14} />
                    <span>Add New Test</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: DOCTORS MANAGEMENT                                   */}
        {/* ========================================================= */}
        {activeTab === 'doctors' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Doctors Summary Cards */}
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Doctors</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-blue-50 text-blue-600">
                    <Stethoscope size={18} />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-black text-[#073b66]">{doctors.length}</div>
                <span className="text-[11px] text-slate-500">Registered referral doctors</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Active Doctors</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                    <CheckCircle2 size={18} />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-black text-emerald-600">
                  {doctors.filter((d) => d.status === 'active').length}
                </div>
                <span className="text-[11px] text-slate-500">Can log in and refer patients</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Avg Custom Discount</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-amber-50 text-amber-600">
                    <Percent size={18} />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-black text-[#073b66]">
                  {doctors.length > 0
                    ? Math.round(doctors.reduce((sum, d) => sum + (d.discountPercent || 0), 0) / doctors.length)
                    : 0}%
                </div>
                <span className="text-[11px] text-slate-500">Configured per doctor</span>
              </div>

              <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-slate-400">Total Referrals</span>
                  <span className="grid h-9 w-9 place-items-center rounded-xl bg-purple-50 text-purple-600">
                    <Users size={18} />
                  </span>
                </div>
                <div className="mt-3 text-2xl font-black text-[#073b66]">
                  {doctors.reduce((sum, d) => sum + (d.totalReferredPatients || 0), 0)}
                </div>
                <span className="text-[11px] text-slate-500">Patients linked to doctors</span>
              </div>
            </div>

            {/* Doctors Table Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <h2 className="text-xl font-black text-[#073b66]">Doctor Management & Discount Governance</h2>
                  <p className="text-xs text-slate-500">
                    Register doctors, configure individual custom discount percentages, manage login access, and review referred patient volumes.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <Link
                    to="/doctor/login"
                    target="_blank"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100 transition"
                  >
                    <span>Doctor Portal</span>
                    <ArrowRight size={13} />
                  </Link>

                  <button
                    onClick={handleOpenCreateDoctor}
                    className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-cyan-700 shadow-sm transition"
                  >
                    <Plus size={16} />
                    <span>Add New Doctor</span>
                  </button>
                </div>
              </div>

              {/* Search and Filters */}
              <div className="flex flex-col sm:flex-row gap-3">
                <div className="relative flex-1">
                  <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={doctorSearch}
                    onChange={(e) => setDoctorSearch(e.target.value)}
                    placeholder="Search doctor by name, email, mobile, code, or specialization..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium outline-none focus:border-cyan-500 focus:bg-white"
                  />
                </div>

                <select
                  value={doctorStatusFilter}
                  onChange={(e) => setDoctorStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
                >
                  <option value="all">All Statuses ({doctors.length})</option>
                  <option value="active">Active Only ({doctors.filter((d) => d.status === 'active').length})</option>
                  <option value="inactive">Inactive Only ({doctors.filter((d) => d.status === 'inactive').length})</option>
                </select>
              </div>

              {/* Table */}
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                      <th className="py-3 px-3">Doctor & Specialization</th>
                      <th className="py-3 px-3">Contact & Clinic</th>
                      <th className="py-3 px-3">Custom Discount %</th>
                      <th className="py-3 px-3">Referrals & Stats</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {doctors
                      .filter((doc) => {
                        const q = doctorSearch.trim().toLowerCase()
                        const matchesSearch =
                          !q ||
                          doc.name?.toLowerCase().includes(q) ||
                          doc.email?.toLowerCase().includes(q) ||
                          doc.mobile?.includes(q) ||
                          doc.referralCode?.toLowerCase().includes(q) ||
                          doc.specialization?.toLowerCase().includes(q) ||
                          doc.clinicName?.toLowerCase().includes(q)
                        const matchesStatus =
                          doctorStatusFilter === 'all' || doc.status === doctorStatusFilter
                        return matchesSearch && matchesStatus
                      })
                      .map((doc) => (
                        <tr key={doc._id} className="hover:bg-slate-50/70 transition">
                          <td className="py-3.5 px-3">
                            <div className="flex items-start gap-2.5">
                              <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-xl bg-cyan-100/70 text-cyan-800 font-black text-xs">
                                {doc.name ? doc.name.replace(/^Dr\.?\s*/i, '').charAt(0) : 'D'}
                              </span>
                              <div>
                                <strong className="block font-black text-[#073b66] text-sm leading-snug">
                                  {doc.name}
                                </strong>
                                <span className="block text-[11px] text-slate-500 font-medium">
                                  {doc.specialization} • {doc.qualification}
                                </span>
                                {doc.referralCode && (
                                  <span className="mt-0.5 inline-block font-mono text-[10px] font-bold text-cyan-700 bg-cyan-50 border border-cyan-200/60 px-1.5 py-0.2 rounded">
                                    Code: {doc.referralCode}
                                  </span>
                                )}
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="space-y-0.5">
                              <div className="flex items-center gap-1.5 font-mono text-slate-700">
                                <Phone size={12} className="text-slate-400" />
                                <span>{doc.mobile}</span>
                              </div>
                              <div className="flex items-center gap-1.5 text-slate-500 text-[11px]">
                                <Mail size={12} className="text-slate-400" />
                                <span className="truncate max-w-[180px]">{doc.email}</span>
                              </div>
                              {doc.clinicName && (
                                <div className="flex items-center gap-1.5 text-slate-600 text-[11px]">
                                  <Building2 size={12} className="text-slate-400" />
                                  <span className="truncate max-w-[180px]">{doc.clinicName}</span>
                                </div>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-100 text-emerald-900 border border-emerald-300 font-black text-xs">
                              <Percent size={13} className="text-emerald-700" />
                              <span>{doc.discountPercent ?? 10}% Discount</span>
                            </div>
                            <span className="block text-[10px] text-slate-400 mt-1">
                              Auto-applied to patient bills
                            </span>
                          </td>

                          <td className="py-3.5 px-3">
                            <div className="font-semibold text-slate-800">
                              <span className="font-black text-[#073b66]">{doc.totalReferredPatients || 0}</span> patients
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {doc.totalTestsReferred || 0} tests referred
                            </span>
                            {(doc.totalRevenuePaise || 0) > 0 && (
                              <div className="text-[10px] font-mono font-bold text-emerald-700 mt-0.5">
                                ₹{Math.round((doc.totalRevenuePaise || 0) / 100)} revenue
                              </div>
                            )}
                          </td>

                          <td className="py-3.5 px-3">
                            <button
                              onClick={() => handleToggleDoctorStatus(doc._id, doc.status, doc.name)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition ${
                                doc.status === 'active'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="Click to toggle active/inactive status"
                            >
                              <span
                                className={`h-1.5 w-1.5 rounded-full ${
                                  doc.status === 'active' ? 'bg-emerald-600' : 'bg-rose-600'
                                }`}
                              />
                              <span>{doc.status}</span>
                            </button>
                          </td>

                          <td className="py-3.5 px-3 text-right">
                            <div className="inline-flex items-center gap-1">
                              <button
                                onClick={() => handleOpenEditDoctor(doc)}
                                className="rounded-lg p-1.5 text-slate-600 hover:bg-cyan-50 hover:text-cyan-700 transition"
                                title="Edit Doctor & Discount"
                              >
                                <Edit size={15} />
                              </button>
                              <button
                                onClick={() => handleDeleteDoctor(doc._id, doc.name)}
                                className="rounded-lg p-1.5 text-slate-400 hover:bg-rose-50 hover:text-rose-600 transition"
                                title="Delete Doctor"
                              >
                                <Trash2 size={15} />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    {doctors.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-8 text-center text-slate-400">
                          No doctors found. Click &quot;Add New Doctor&quot; to register your first referring physician.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: OFFERS & CAMPAIGNS MANAGEMENT                        */}
        {/* ========================================================= */}
        {activeTab === 'offers' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Header with Title and Create Button */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <div className="inline-flex items-center gap-2 rounded-full bg-amber-50 px-3 py-1 text-xs font-black text-amber-800 border border-amber-200 mb-2">
                  <Sparkles size={13} className="text-amber-600" />
                  <span>Dynamic Campaign Governance</span>
                </div>
                <h2 className="text-2xl font-black text-[#073b66]">Offers & Campaign Management</h2>
                <p className="text-xs sm:text-sm text-slate-500 mt-1 max-w-2xl">
                  Manage festival promotions, health camp vouchers, seasonal packages, and senior citizen concessions. Active campaigns automatically appear on the website and booking engine with zero hardcoding.
                </p>
              </div>
              <button
                onClick={() => handleOpenOfferModal()}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-5 py-3 text-xs sm:text-sm font-extrabold text-white shadow-md hover:from-cyan-700 hover:to-teal-700 active:scale-95 transition shrink-0"
              >
                <Plus size={16} />
                <span>Create New Campaign</span>
              </button>
            </div>

            {/* Campaign Analytics KPI Cards */}
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-3 sm:gap-4">
              {/* Active Campaigns */}
              <div className="rounded-2xl border border-emerald-200 bg-gradient-to-br from-emerald-50 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-emerald-800 uppercase tracking-wider">Active & Live</span>
                  <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-ping" />
                </div>
                <p className="text-2xl font-black text-emerald-950 mt-2 font-mono">
                  {offerMetrics?.totalActiveOffers ?? offers.filter((o) => o.computedStatus === 'active').length}
                </p>
                <span className="text-[10px] text-emerald-700 mt-0.5 block">Visible to public</span>
              </div>

              {/* Scheduled Campaigns */}
              <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-indigo-800 uppercase tracking-wider">Scheduled</span>
                  <Clock size={16} className="text-indigo-600" />
                </div>
                <p className="text-2xl font-black text-indigo-950 mt-2 font-mono">
                  {offerMetrics?.totalScheduledOffers ?? offers.filter((o) => o.computedStatus === 'scheduled').length}
                </p>
                <span className="text-[10px] text-indigo-700 mt-0.5 block">Upcoming launch</span>
              </div>

              {/* Expired / Inactive */}
              <div className="rounded-2xl border border-slate-200 bg-gradient-to-br from-slate-50 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-slate-700 uppercase tracking-wider">Inactive / Expired</span>
                  <ShieldCheck size={16} className="text-slate-400" />
                </div>
                <p className="text-2xl font-black text-slate-800 mt-2 font-mono">
                  {(offerMetrics?.totalExpiredOffers || 0) + (offerMetrics?.totalInactiveOffers || 0)}
                </p>
                <span className="text-[10px] text-slate-500 mt-0.5 block">Hidden from public</span>
              </div>

              {/* Total Bookings */}
              <div className="rounded-2xl border border-cyan-200 bg-gradient-to-br from-cyan-50 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-cyan-800 uppercase tracking-wider">Offer Bookings</span>
                  <Tag size={16} className="text-cyan-600" />
                </div>
                <p className="text-2xl font-black text-[#073b66] mt-2 font-mono">
                  {offerMetrics?.totalOfferBookings || 0}
                </p>
                <span className="text-[10px] text-cyan-700 mt-0.5 block">Referred by offers</span>
              </div>

              {/* Offer Revenue */}
              <div className="rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-blue-800 uppercase tracking-wider">Offer Revenue</span>
                  <TrendingUp size={16} className="text-blue-600" />
                </div>
                <p className="text-2xl font-black text-blue-950 mt-2 font-mono">
                  ₹{Math.round((offerMetrics?.totalOfferRevenuePaise || 0) / 100).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-blue-700 mt-0.5 block">Net billing total</span>
              </div>

              {/* Concessions Given */}
              <div className="rounded-2xl border border-amber-200 bg-gradient-to-br from-amber-50 to-white p-4 shadow-xs">
                <div className="flex items-center justify-between">
                  <span className="text-[11px] font-bold text-amber-800 uppercase tracking-wider">Concessions Given</span>
                  <Percent size={16} className="text-amber-600" />
                </div>
                <p className="text-2xl font-black text-amber-950 mt-2 font-mono">
                  ₹{Math.round((offerMetrics?.totalOfferDiscountGivenPaise || 0) / 100).toLocaleString('en-IN')}
                </p>
                <span className="text-[10px] text-amber-700 mt-0.5 block">Patient savings</span>
              </div>
            </div>

            {/* Top Performer Banner */}
            {offerMetrics?.mostSuccessfulOffer && (
              <div className="rounded-2xl border border-purple-200 bg-gradient-to-r from-purple-50 via-indigo-50 to-white p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-purple-600 text-white shadow-xs shrink-0">
                    <Sparkles size={20} />
                  </span>
                  <div>
                    <span className="text-[11px] font-extrabold uppercase tracking-wider text-purple-700 block">
                      Top Performing Campaign
                    </span>
                    <strong className="text-sm font-black text-[#073b66]">
                      {offerMetrics.mostSuccessfulOffer.name}
                    </strong>
                  </div>
                </div>
                <div className="flex items-center gap-4 text-purple-900 font-bold">
                  <span>🎯 {offerMetrics.mostSuccessfulOffer.bookings} Bookings Generated</span>
                  <span>💰 ₹{Math.round((offerMetrics.mostSuccessfulOffer.revenuePaise || 0) / 100).toLocaleString('en-IN')} Revenue</span>
                </div>
              </div>
            )}

            {/* Filter and Search Bar */}
            <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col md:flex-row items-center gap-3">
              <div className="relative flex-1 w-full">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search campaigns by name, headline, or promo code..."
                  value={offerSearch}
                  onChange={(e) => setOfferSearch(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 pl-10 pr-3 text-xs font-medium text-slate-800 placeholder-slate-400 focus:border-cyan-500 focus:bg-white focus:outline-none focus:ring-2 focus:ring-cyan-100"
                />
              </div>

              <div className="flex items-center gap-2 w-full md:w-auto">
                {/* Status Filter */}
                <select
                  value={offerStatusFilter}
                  onChange={(e) => setOfferStatusFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:bg-white focus:outline-none"
                >
                  <option value="all">All Statuses ({offers.length})</option>
                  <option value="active">Active & Live</option>
                  <option value="scheduled">Scheduled</option>
                  <option value="expired">Expired</option>
                  <option value="inactive">Deactivated</option>
                </select>

                {/* Offer Type Filter */}
                <select
                  value={offerTypeFilter}
                  onChange={(e) => setOfferTypeFilter(e.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50/50 py-2.5 px-3 text-xs font-bold text-slate-700 focus:border-cyan-500 focus:bg-white focus:outline-none"
                >
                  <option value="all">All Campaign Types</option>
                  <option value="festival">Festival Offers</option>
                  <option value="seasonal">Seasonal Campaigns</option>
                  <option value="health_camp">Health Camp Offers</option>
                  <option value="special_package">Special Packages</option>
                  <option value="senior_citizen">Senior Citizen Offers</option>
                  <option value="general">General Promotions</option>
                </select>
              </div>
            </div>

            {/* Campaign Cards / Table */}
            <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-100 bg-slate-50/80 text-[11px] font-black uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="py-3.5 px-5">Campaign & Details</th>
                      <th className="py-3.5 px-4">Discount Structure</th>
                      <th className="py-3.5 px-4">Applicability</th>
                      <th className="py-3.5 px-4">Validity & Status</th>
                      <th className="py-3.5 px-4">Performance</th>
                      <th className="py-3.5 px-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {offers
                      .filter((o) => {
                        const matchesSearch =
                          !offerSearch.trim() ||
                          o.name?.toLowerCase().includes(offerSearch.toLowerCase()) ||
                          o.title?.toLowerCase().includes(offerSearch.toLowerCase()) ||
                          o.code?.toLowerCase().includes(offerSearch.toLowerCase()) ||
                          o.description?.toLowerCase().includes(offerSearch.toLowerCase())

                        const matchesStatus =
                          offerStatusFilter === 'all' || o.computedStatus === offerStatusFilter

                        const matchesType =
                          offerTypeFilter === 'all' || o.offerType === offerTypeFilter

                        return matchesSearch && matchesStatus && matchesType
                      })
                      .map((offer) => {
                        const statusColors = {
                          active: 'bg-emerald-50 text-emerald-800 border-emerald-200',
                          scheduled: 'bg-indigo-50 text-indigo-800 border-indigo-200',
                          expired: 'bg-slate-100 text-slate-600 border-slate-200',
                          inactive: 'bg-rose-50 text-rose-800 border-rose-200',
                        }

                        const typeLabels = {
                          festival: 'Festival Offer',
                          seasonal: 'Seasonal Campaign',
                          health_camp: 'Health Camp',
                          special_package: 'Special Package',
                          senior_citizen: 'Senior Citizen',
                          general: 'General Promotion',
                        }

                        return (
                          <tr key={offer._id} className="hover:bg-slate-50/70 transition">
                            {/* Campaign Details with banner preview */}
                            <td className="py-4 px-5">
                              <div className="flex items-start gap-3.5 max-w-sm">
                                <div
                                  className={`h-12 w-12 rounded-2xl bg-gradient-to-br ${
                                    offer.bannerGradient || 'from-amber-500 via-rose-500 to-red-600'
                                  } text-white grid place-items-center shrink-0 shadow-xs border border-black/10`}
                                >
                                  <Sparkles size={20} />
                                </div>
                                <div className="space-y-1">
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <strong className="text-sm font-black text-[#073b66]">
                                      {offer.name}
                                    </strong>
                                    <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-600 border border-slate-200">
                                      {typeLabels[offer.offerType] || offer.offerType}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-600 font-medium line-clamp-1">
                                    {offer.title}
                                  </p>
                                  {offer.code && (
                                    <div className="inline-flex items-center gap-1.5 rounded-md bg-amber-50 px-2 py-0.5 text-[11px] font-mono font-black text-amber-900 border border-amber-200">
                                      <Tag size={11} className="text-amber-700" />
                                      <span>{offer.code}</span>
                                      <button
                                        onClick={() => {
                                          navigator.clipboard.writeText(offer.code)
                                          setActionNotice(`Promo code "${offer.code}" copied to clipboard!`)
                                        }}
                                        title="Copy code"
                                        className="text-amber-700 hover:text-amber-950 ml-0.5"
                                      >
                                        <Copy size={11} />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </td>

                            {/* Discount Structure */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="space-y-1">
                                {offer.discountType === 'percentage' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-emerald-100 text-emerald-800 px-2.5 py-1 text-xs font-black">
                                    <Percent size={12} />
                                    <span>{offer.discountValue}% OFF</span>
                                  </span>
                                )}
                                {offer.discountType === 'fixed_amount' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-cyan-100 text-cyan-900 px-2.5 py-1 text-xs font-black">
                                    <span>₹{Math.round(offer.discountValue / 100)} OFF</span>
                                  </span>
                                )}
                                {offer.discountType === 'offer_price' && (
                                  <span className="inline-flex items-center gap-1 rounded-full bg-purple-100 text-purple-900 px-2.5 py-1 text-xs font-black">
                                    <span>Offer Price ₹{Math.round(offer.discountValue / 100)}</span>
                                  </span>
                                )}
                                {offer.minOrderAmountPaise > 0 && (
                                  <span className="block text-[10px] text-slate-500 font-semibold">
                                    Min Order: ₹{Math.round(offer.minOrderAmountPaise / 100)}
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Applicability */}
                            <td className="py-4 px-4">
                              <div className="space-y-1 text-xs">
                                {offer.applicabilityType === 'all' && (
                                  <span className="inline-block rounded-lg bg-slate-100 px-2.5 py-1 font-bold text-slate-700">
                                    Entire Catalogue
                                  </span>
                                )}
                                {offer.applicabilityType === 'category' && (
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[11px]">
                                      Categories ({offer.applicableCategories?.length || 0}):
                                    </span>
                                    <span className="text-[11px] text-slate-600 line-clamp-1">
                                      {offer.applicableCategories?.join(', ') || 'None selected'}
                                    </span>
                                  </div>
                                )}
                                {offer.applicabilityType === 'package' && (
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[11px]">
                                      Packages ({offer.applicablePackageIds?.length || 0}):
                                    </span>
                                    <span className="text-[11px] text-slate-600 line-clamp-1">
                                      {offer.applicablePackageIds?.map((p) => (typeof p === 'object' ? p.name : p)).join(', ') || 'Selected Packages'}
                                    </span>
                                  </div>
                                )}
                                {offer.applicabilityType === 'test' && (
                                  <div>
                                    <span className="font-bold text-slate-800 block text-[11px]">
                                      Tests ({offer.applicableTestIds?.length || 0}):
                                    </span>
                                    <span className="text-[11px] text-slate-600 line-clamp-1">
                                      {offer.applicableTestIds?.map((t) => (typeof t === 'object' ? t.name : t)).join(', ') || 'Selected Tests'}
                                    </span>
                                  </div>
                                )}
                              </div>
                            </td>

                            {/* Validity & Computed Status */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="space-y-1.5">
                                <span
                                  className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-black border ${
                                    statusColors[offer.computedStatus] || statusColors.inactive
                                  }`}
                                >
                                  {offer.computedStatus === 'active' && (
                                    <span className="h-1.5 w-1.5 rounded-full bg-emerald-500 animate-ping" />
                                  )}
                                  {offer.computedStatus === 'scheduled' && <Clock size={11} />}
                                  <span className="capitalize">{offer.computedStatus}</span>
                                </span>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  <span>{new Date(offer.startDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                                  <span className="mx-1">→</span>
                                  <span>{new Date(offer.endDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                                </div>
                              </div>
                            </td>

                            {/* Performance */}
                            <td className="py-4 px-4 whitespace-nowrap">
                              <div className="space-y-0.5">
                                <span className="font-black text-[#073b66] block">
                                  {offer.totalBookings || 0} Bookings
                                </span>
                                <span className="text-[11px] text-emerald-700 font-bold block">
                                  ₹{Math.round((offer.totalRevenuePaise || 0) / 100).toLocaleString('en-IN')} Rev
                                </span>
                                {offer.maxUsageCount ? (
                                  <span className="text-[10px] text-slate-400 block">
                                    Limit: {offer.currentUsageCount || 0} / {offer.maxUsageCount}
                                  </span>
                                ) : (
                                  <span className="text-[10px] text-slate-400 block">Unlimited redemptions</span>
                                )}
                              </div>
                            </td>

                            {/* Actions */}
                            <td className="py-4 px-5 text-right whitespace-nowrap">
                              <div className="flex items-center justify-end gap-1.5">
                                {/* Toggle Active/Inactive */}
                                <button
                                  onClick={() => handleToggleOfferStatus(offer._id, offer.isActive, offer.name)}
                                  title={offer.isActive ? 'Deactivate Campaign' : 'Activate Campaign'}
                                  className={`p-1.5 rounded-lg border transition ${
                                    offer.isActive
                                      ? 'text-emerald-700 hover:bg-emerald-50 border-emerald-200'
                                      : 'text-slate-400 hover:bg-slate-100 border-slate-200'
                                  }`}
                                >
                                  {offer.isActive ? <ToggleRight size={18} /> : <ToggleLeft size={18} />}
                                </button>

                                {/* 1-Click Duplicate */}
                                <button
                                  onClick={() => handleDuplicateOffer(offer._id, offer.name)}
                                  title="Duplicate Campaign"
                                  className="p-1.5 text-indigo-700 hover:bg-indigo-50 border border-indigo-200 rounded-lg transition"
                                >
                                  <Copy size={15} />
                                </button>

                                {/* Edit Offer */}
                                <button
                                  onClick={() => handleOpenOfferModal(offer)}
                                  title="Edit Campaign"
                                  className="p-1.5 text-cyan-700 hover:bg-cyan-50 border border-cyan-200 rounded-lg transition"
                                >
                                  <Edit size={15} />
                                </button>

                                {/* Delete Offer */}
                                <button
                                  onClick={() => handleDeleteOffer(offer._id, offer.name)}
                                  title="Delete Campaign"
                                  className="p-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg transition"
                                >
                                  <Trash2 size={15} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        )
                      })}

                    {offers.length === 0 && (
                      <tr>
                        <td colSpan={6} className="py-12 text-center space-y-3">
                          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-amber-50 text-amber-600 mx-auto border border-amber-200">
                            <Gift size={24} />
                          </span>
                          <strong className="block text-sm font-bold text-slate-700">
                            No Promotional Campaigns Configured Yet
                          </strong>
                          <p className="text-xs text-slate-500 max-w-sm mx-auto">
                            Launch your first festival offer, health camp discount, or senior citizen concession to drive patient appointments.
                          </p>
                          <button
                            onClick={() => handleOpenOfferModal()}
                            className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-700 transition"
                          >
                            <Plus size={14} />
                            <span>Create First Offer</span>
                          </button>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: BOOKINGS MANAGEMENT                                */}
        {/* ========================================================= */}
        {activeTab === 'bookings' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#073b66]">Appointments & Home Collections</h2>
                <p className="text-xs text-slate-500">
                  Manage patient bookings, track referring doctor concessions, and update test progression workflow.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-900 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full">
                  {bookings.filter((b) => b.doctorName || b.doctorId).length} Doctor Referred
                </span>
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {bookings.length} Total Records
                </span>
              </div>
            </div>

            {/* Filters Bar: Search, Doctor Filter, Status Filter */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={bookingSearch}
                  onChange={(e) => setBookingSearch(e.target.value)}
                  placeholder="Search by patient name, phone, reference, test, or doctor name..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              {/* Filter by Referring Doctor */}
              <select
                value={bookingDoctorFilter}
                onChange={(e) => setBookingDoctorFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-[#073b66] outline-none"
              >
                <option value="all">All Referrals & Walk-ins ({bookings.length})</option>
                <option value="doctor_only">
                  All Doctor-Referred Only ({bookings.filter((b) => b.doctorName || b.doctorId).length})
                </option>
                <option value="direct_only">
                  Direct Walk-ins Only ({bookings.filter((b) => !b.doctorName && !b.doctorId).length})
                </option>
                <optgroup label="Filter by Specific Doctor">
                  {doctors.map((doc) => (
                    <option key={doc._id} value={doc.name}>
                      Dr. {doc.name.replace(/^Dr\.?\s*/i, '')} ({doc.discountPercent}% OFF)
                    </option>
                  ))}
                </optgroup>
              </select>

              {/* Filter by Workflow Status */}
              <select
                value={bookingStatusFilter}
                onChange={(e) => setBookingStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">All Workflow Statuses</option>
                <option value="requested">Requested</option>
                <option value="confirmed">Confirmed</option>
                <option value="sample_collected">Sample Collected</option>
                <option value="processing">Processing in Lab</option>
                <option value="completed">Completed / Ready</option>
                <option value="cancelled">Cancelled</option>
              </select>

              {(bookingDoctorFilter !== 'all' || bookingStatusFilter !== 'all' || bookingSearch) && (
                <button
                  type="button"
                  onClick={() => {
                    setBookingDoctorFilter('all')
                    setBookingStatusFilter('all')
                    setBookingSearch('')
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-3">Patient & Phone</th>
                    <th className="py-3 px-3">Referring Doctor</th>
                    <th className="py-3 px-3">Tests Booked & Tariff</th>
                    <th className="py-3 px-3">Date / Mode</th>
                    <th className="py-3 px-3">Status Workflow</th>
                    <th className="py-3 px-3">Payment</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {bookings
                    .filter((b) => {
                      const q = bookingSearch.trim().toLowerCase()
                      const matchesSearch =
                        !q ||
                        b.reference?.toLowerCase().includes(q) ||
                        b.patientName?.toLowerCase().includes(q) ||
                        b.phone?.includes(q) ||
                        b.doctorName?.toLowerCase().includes(q) ||
                        b.items?.some((i) => i.name.toLowerCase().includes(q))

                      const matchesStatus =
                        bookingStatusFilter === 'all' || b.status === bookingStatusFilter

                      let matchesDoctor = true
                      if (bookingDoctorFilter === 'doctor_only') {
                        matchesDoctor = Boolean(b.doctorName || b.doctorId)
                      } else if (bookingDoctorFilter === 'direct_only') {
                        matchesDoctor = !b.doctorName && !b.doctorId
                      } else if (bookingDoctorFilter !== 'all') {
                        matchesDoctor =
                          b.doctorName === bookingDoctorFilter ||
                          String(b.doctorId) === String(bookingDoctorFilter)
                      }

                      return matchesSearch && matchesStatus && matchesDoctor
                    })
                    .map((b) => (
                      <tr key={b._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 font-mono font-bold text-cyan-800">
                          {b.reference}
                        </td>

                        <td className="py-3 px-3">
                          <strong className="block text-slate-900 font-bold">{b.patientName}</strong>
                          <span className="text-[11px] text-slate-500 font-mono">{b.phone}</span>
                        </td>

                        {/* Referring Doctor Column */}
                        <td className="py-3 px-3">
                          {b.doctorName || b.referredBy ? (
                            <div className="space-y-1">
                              <span className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-100 text-[#073b66] border border-cyan-300 px-2.5 py-1 text-xs font-black shadow-xs">
                                <Stethoscope size={13} className="text-cyan-700" />
                                <span>{b.doctorName || b.referredBy}</span>
                              </span>
                              {(b.doctorDiscountPercent || 0) > 0 && (
                                <span className="block text-[11px] font-extrabold text-emerald-700">
                                  {b.doctorDiscountPercent}% Concession Applied
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="text-slate-400 text-xs italic font-medium">Direct Walk-in (No Doctor)</span>
                          )}
                        </td>

                        <td className="py-3 px-3 max-w-xs">
                          <span className="font-semibold text-slate-800 block">
                            {b.items?.map((i) => i.name).join(', ')}
                          </span>
                          <div className="text-[11px] text-slate-500 mt-0.5">
                            Total: <strong className="text-slate-900 font-mono">₹{Math.round((b.totalAmountPaise || 0) / 100)}</strong>
                            {(b.discountAmountPaise || 0) > 0 && (
                              <span className="ml-1.5 text-emerald-700 font-bold">
                                (Saved ₹{Math.round(b.discountAmountPaise / 100)})
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="py-3 px-3">
                          <span className="block text-slate-800 font-medium">{b.date}</span>
                          <span className="text-[11px] text-slate-500 capitalize">{b.collectionType} ({b.timeSlot})</span>
                          {b.collectionType === 'home' && b.address && (
                            <span className="text-[10px] text-cyan-900 block font-semibold truncate max-w-xs">
                              {b.address}
                            </span>
                          )}
                        </td>

                        <td className="py-3 px-3">
                          <select
                            value={b.status}
                            onChange={(e) => updateBookingStatus(b._id, e.target.value)}
                            className="rounded-lg border border-slate-200 bg-white px-2 py-1 text-xs font-bold text-slate-700 outline-none"
                          >
                            <option value="requested">Requested</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="sample_collected">Sample Collected</option>
                            <option value="processing">Processing in Lab</option>
                            <option value="completed">Completed / Report Ready</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>

                        <td className="py-3 px-3">
                          <button
                            onClick={() => updateBookingPayment(b._id, b.paymentStatus === 'paid' ? 'pending' : 'paid')}
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              b.paymentStatus === 'paid'
                                ? 'bg-emerald-100 text-emerald-800'
                                : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            }`}
                            title="Click to toggle paid / pending"
                          >
                            {b.paymentStatus}
                          </button>
                        </td>

                        <td className="py-3 px-3 text-right">
                          <button
                            onClick={() => {
                              setUploadRef(b.reference)
                              setUploadTitle(`${b.items?.map((i) => i.name).join(', ')} Report`)
                              setReportUploadModalOpen(true)
                            }}
                            className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100"
                          >
                            Upload Report
                          </button>
                        </td>
                      </tr>
                    ))}
                  {bookings.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No appointments found matching your filters.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: PATIENT MANAGEMENT (ALL PATIENTS)                  */}
        {/* ========================================================= */}
        {activeTab === 'patients' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#073b66]">All Registered Patients</h2>
                <p className="text-xs text-slate-500">
                  Comprehensive patient roster aggregated across direct walk-in bookings and doctor referrals in Mandideep.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-cyan-900 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full">
                  {patients.length} Unique Patients
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  {patients.filter((p) => p.totalBookings > 1).length} Repeat Visitors
                </span>
              </div>
            </div>

            {/* Patient Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={patientSearch}
                  onChange={(e) => setPatientSearch(e.target.value)}
                  placeholder="Search patients by name or phone number..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>
              {patientSearch && (
                <button
                  type="button"
                  onClick={() => setPatientSearch('')}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Clear Search
                </button>
              )}
            </div>

            {/* Patients Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3">Patient Name & Phone</th>
                    <th className="py-3 px-3">Email & Gender</th>
                    <th className="py-3 px-3">Total Appointments</th>
                    <th className="py-3 px-3">Total Paid Spend</th>
                    <th className="py-3 px-3">Last Appointment Date</th>
                    <th className="py-3 px-3">Last Reference ID</th>
                    <th className="py-3 px-3 text-right">Quick Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {patients
                    .filter((p) => {
                      const q = patientSearch.trim().toLowerCase()
                      if (!q) return true
                      return (
                        p.name?.toLowerCase().includes(q) ||
                        String(p._id)?.includes(q) ||
                        p.email?.toLowerCase().includes(q)
                      )
                    })
                    .map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3.5 px-3">
                          <div className="flex items-center gap-2.5">
                            <span className="grid h-8 w-8 place-items-center rounded-xl bg-cyan-100 text-cyan-800 font-black text-xs">
                              {p.name ? p.name.charAt(0).toUpperCase() : 'P'}
                            </span>
                            <div>
                              <strong className="block text-slate-900 font-bold">{p.name || 'Anonymous Patient'}</strong>
                              <span className="text-[11px] text-slate-500 font-mono flex items-center gap-1 mt-0.5">
                                <Phone size={11} className="text-slate-400" />
                                {p._id}
                              </span>
                            </div>
                          </div>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="block text-slate-700">{p.email || '—'}</span>
                          <span className="text-[10px] text-slate-400 capitalize">{p.gender || 'Not specified'}</span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-cyan-50 text-cyan-800 border border-cyan-200 text-xs font-black">
                            <CalendarCheck size={11} />
                            <span>{p.totalBookings} Booking{p.totalBookings > 1 ? 's' : ''}</span>
                          </span>
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-mono font-bold text-emerald-700 text-sm">
                            ₹{Math.round((p.totalSpentPaise || 0) / 100).toLocaleString('en-IN')}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-slate-600">
                          {p.lastBookingDate || '—'}
                        </td>

                        <td className="py-3.5 px-3">
                          <span className="font-mono text-cyan-800 font-bold bg-cyan-50 px-2 py-0.5 rounded text-[11px]">
                            {p.lastReference || '—'}
                          </span>
                        </td>

                        <td className="py-3.5 px-3 text-right">
                          <button
                            onClick={() => {
                              setBookingSearch(p._id)
                              setActiveTab('bookings')
                            }}
                            className="rounded-lg bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100 transition"
                          >
                            View Bookings →
                          </button>
                        </td>
                      </tr>
                    ))}
                  {patients.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400">
                        No registered patients found. Patient records will populate automatically when appointments are booked.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 4: DIAGNOSTIC TESTS CRUD                              */}
        {/* ========================================================= */}
        {activeTab === 'tests' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#073b66]">Diagnostic Tests Catalogue</h2>
                <p className="text-xs text-slate-500">
                  Complete laboratory test inventory. Create tests, modify prices, configure discounts, and enable or disable visibility.
                </p>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-xs font-bold text-slate-600 bg-slate-100 px-3 py-1 rounded-full">
                  {tests.length} Total Tests
                </span>
                <span className="text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  {tests.filter((t) => t.isActive).length} Active
                </span>
                <button
                  onClick={() => {
                    setEditingTest(null)
                    setTestForm({
                      name: '',
                      shortCode: '',
                      category: 'General Health',
                      department: 'Clinical Biochemistry',
                      description: '',
                      sampleType: 'Venous Blood',
                      fastingRequired: false,
                      turnaroundHours: 12,
                      pricePaise: 35000,
                      mrpPaise: 50000,
                      isVerifiedPrice: true,
                      priceNote: 'Verified laboratory tariff.',
                      isActive: true,
                    })
                    setTestModalOpen(true)
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2 text-xs font-extrabold text-white hover:bg-cyan-700 shadow-sm"
                >
                  <Plus size={16} />
                  <span>Add New Test</span>
                </button>
              </div>
            </div>

            {/* Test Filters: Search + Status */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={testSearch}
                  onChange={(e) => setTestSearch(e.target.value)}
                  placeholder="Search test by name, department, or code..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <select
                value={testStatusFilter}
                onChange={(e) => setTestStatusFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">All Statuses ({tests.length})</option>
                <option value="active">Active Only ({tests.filter((t) => t.isActive).length})</option>
                <option value="inactive">Disabled / Hidden ({tests.filter((t) => !t.isActive).length})</option>
              </select>

              {(testSearch || testStatusFilter !== 'all') && (
                <button
                  type="button"
                  onClick={() => {
                    setTestSearch('')
                    setTestStatusFilter('all')
                  }}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Clear Filters
                </button>
              )}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3">Test Name & Code</th>
                    <th className="py-3 px-3">Department & Category</th>
                    <th className="py-3 px-3">Sample Specimen</th>
                    <th className="py-3 px-3">MRP (₹)</th>
                    <th className="py-3 px-3">Offer Price (₹)</th>
                    <th className="py-3 px-3">Patient Discount</th>
                    <th className="py-3 px-3">Status (Click to Toggle)</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {tests
                    .filter((t) => {
                      const q = testSearch.trim().toLowerCase()
                      const matchesSearch =
                        !q ||
                        t.name?.toLowerCase().includes(q) ||
                        t.shortCode?.toLowerCase().includes(q) ||
                        t.department?.toLowerCase().includes(q) ||
                        t.category?.toLowerCase().includes(q)

                      let matchesStatus = true
                      if (testStatusFilter === 'active') matchesStatus = t.isActive === true
                      if (testStatusFilter === 'inactive') matchesStatus = t.isActive === false

                      return matchesSearch && matchesStatus
                    })
                    .map((t) => {
                      const priceRs = Math.round(t.pricePaise / 100)
                      const mrpRs = t.mrpPaise ? Math.round(t.mrpPaise / 100) : null
                      const discountPct = mrpRs && mrpRs > priceRs ? Math.round(((mrpRs - priceRs) / mrpRs) * 100) : 0

                      return (
                        <tr key={t._id} className="hover:bg-slate-50/60 transition">
                          <td className="py-3 px-3">
                            <strong className="block text-slate-900 font-bold">{t.name}</strong>
                            <span className="text-[11px] font-mono text-cyan-700">{t.shortCode || '—'}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="block text-slate-800 font-medium">{t.department}</span>
                            <span className="text-[11px] text-slate-500">{t.category}</span>
                          </td>
                          <td className="py-3 px-3">
                            <span className="block text-slate-700">{t.sampleType}</span>
                            <span className="text-[10px] text-slate-500">
                              {t.fastingRequired ? 'Fasting Required' : 'No Fasting'}
                            </span>
                          </td>
                          <td className="py-3 px-3 text-slate-400 font-semibold line-through">
                            {mrpRs ? `₹${mrpRs}` : '—'}
                          </td>
                          <td className="py-3 px-3 font-bold text-slate-900 text-sm">
                            ₹{priceRs}
                          </td>
                          <td className="py-3 px-3">
                            {discountPct > 0 ? (
                              <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 border border-emerald-200">
                                {discountPct}% OFF
                              </span>
                            ) : (
                              <span className="text-slate-400 font-medium">—</span>
                            )}
                          </td>
                          <td className="py-3 px-3">
                            <button
                              onClick={() => handleToggleTestStatus(t._id, t.isActive, t.name)}
                              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-black uppercase tracking-wider transition ${
                                t.isActive
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-rose-100 text-rose-800 hover:bg-rose-200'
                              }`}
                              title="Click to enable or disable this test"
                            >
                              <span className={`h-1.5 w-1.5 rounded-full ${t.isActive ? 'bg-emerald-600' : 'bg-rose-600'}`} />
                              <span>{t.isActive ? 'Active' : 'Disabled'}</span>
                            </button>
                          </td>
                          <td className="py-3 px-3 text-right space-x-2">
                            <button
                              onClick={() => {
                                setEditingTest(t)
                                setTestForm({
                                  name: t.name,
                                  shortCode: t.shortCode || '',
                                  category: t.category,
                                  department: t.department,
                                  description: t.description || '',
                                  sampleType: t.sampleType || 'Venous Blood',
                                  fastingRequired: Boolean(t.fastingRequired),
                                  turnaroundHours: t.turnaroundHours || 12,
                                  pricePaise: t.pricePaise,
                                  mrpPaise: t.mrpPaise || 0,
                                  isVerifiedPrice: Boolean(t.isVerifiedPrice),
                                  priceNote: t.priceNote || '',
                                  isActive: Boolean(t.isActive),
                                })
                                setTestModalOpen(true)
                              }}
                              className="p-1.5 text-cyan-700 hover:bg-cyan-50 rounded"
                              title="Edit Test / Price / Discount"
                            >
                              <Edit size={15} />
                            </button>
                            <button
                              onClick={() => handleDeleteTest(t._id, t.name)}
                              className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                              title="Delete Test"
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      )
                    })}
                  {tests.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-8 text-center text-slate-400">
                        No diagnostic tests configured yet. Click &quot;Add New Test&quot; to register tests.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: HEALTH PACKAGES                                    */}
        {/* ========================================================= */}
        {activeTab === 'packages' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#073b66]">Comprehensive Health Screening Packages</h2>
                <p className="text-xs text-slate-500">
                  Manage preventive checkup bundles, update package tariffs, test compositions, and promotional discounts.
                </p>
              </div>

              <button
                onClick={() => {
                  setEditingPackage(null)
                  setPackageForm({
                    name: '',
                    code: '',
                    category: 'Preventive Wellness',
                    tagline: '',
                    description: '',
                    testsIncludedInput: '',
                    sampleType: 'Blood & Spot Urine',
                    fastingRequired: true,
                    fastingInstructions: '10–12 hours overnight fasting recommended. Water is permitted.',
                    pricePaise: 110000,
                    mrpPaise: 150000,
                    isVerifiedPrice: false,
                    priceNote: 'Demo/indicative package pricing. Subject to laboratory verification.',
                    badge: 'Popular Routine',
                    isActive: true,
                    isFeatured: true,
                  })
                  setPackageModalOpen(true)
                }}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-cyan-700 shadow-sm shrink-0"
              >
                <Plus size={16} />
                <span>Add Health Package</span>
              </button>
            </div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {packages.map((pkg) => {
                const priceRs = Math.round(pkg.pricePaise / 100)
                const mrpRs = pkg.mrpPaise ? Math.round(pkg.mrpPaise / 100) : null
                const discountPct = mrpRs && mrpRs > priceRs ? Math.round(((mrpRs - priceRs) / mrpRs) * 100) : 0
                const savingsRs = mrpRs && mrpRs > priceRs ? mrpRs - priceRs : 0

                return (
                  <div key={pkg._id} className="rounded-2xl border border-slate-200 p-5 space-y-4 hover:border-cyan-400 transition bg-slate-50/30 flex flex-col justify-between">
                    <div className="space-y-3">
                      <div className="flex justify-between items-start gap-2">
                        <span className="rounded-md bg-cyan-50 px-2 py-0.5 text-[10px] font-bold text-cyan-800 border border-cyan-200 font-mono">
                          {pkg.code}
                        </span>
                        {pkg.badge && (
                          <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-bold text-amber-700 border border-amber-200">
                            {pkg.badge}
                          </span>
                        )}
                      </div>

                      <div>
                        <h3 className="font-black text-[#073b66] text-sm leading-snug">{pkg.name}</h3>
                        <p className="text-[11px] font-medium text-cyan-700 mt-0.5">{pkg.category}</p>
                        {pkg.tagline && <p className="text-xs text-slate-500 italic mt-1">{pkg.tagline}</p>}
                      </div>

                      {/* Pricing & Discount Box */}
                      <div className="rounded-xl bg-white border border-slate-200 p-3 space-y-1">
                        <div className="flex items-baseline justify-between gap-2">
                          <div className="flex items-baseline gap-2">
                            <span className="font-black text-slate-900 text-lg">₹{priceRs}</span>
                            {mrpRs && (
                              <span className="text-xs text-slate-400 font-semibold line-through">
                                ₹{mrpRs}
                              </span>
                            )}
                          </div>
                          {discountPct > 0 && (
                            <span className="rounded-md bg-emerald-100 px-2 py-0.5 text-[11px] font-black text-emerald-800 border border-emerald-300">
                              {discountPct}% OFF
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between text-[10px]">
                          {pkg.isVerifiedPrice ? (
                            <span className="text-emerald-700 font-bold">Verified Tariff</span>
                          ) : (
                            <span className="text-amber-700 font-bold">Demo Indicative</span>
                          )}
                          {savingsRs > 0 && (
                            <span className="text-emerald-700 font-bold">Save ₹{savingsRs}</span>
                          )}
                        </div>
                      </div>

                      {/* Tests Included */}
                      <div className="text-[11px] text-slate-600 pt-2 border-t border-slate-100">
                        <strong className="block text-slate-800 mb-1">
                          {pkg.testsIncluded?.length || 0} Tests Included:
                        </strong>
                        <div className="flex flex-wrap gap-1 max-h-24 overflow-y-auto">
                          {pkg.testsIncluded?.map((t, idx) => (
                            <span key={idx} className="rounded bg-white border border-slate-200 px-1.5 py-0.5 text-[10px] text-slate-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Action buttons */}
                    <div className="pt-3 border-t border-slate-200 flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setEditingPackage(pkg)
                          setPackageForm({
                            name: pkg.name,
                            code: pkg.code,
                            category: pkg.category,
                            tagline: pkg.tagline || '',
                            description: pkg.description || '',
                            testsIncludedInput: Array.isArray(pkg.testsIncluded) ? pkg.testsIncluded.join(', ') : '',
                            sampleType: pkg.sampleType || 'Blood & Spot Urine',
                            fastingRequired: Boolean(pkg.fastingRequired),
                            fastingInstructions: pkg.fastingInstructions || '10–12 hours overnight fasting recommended.',
                            pricePaise: pkg.pricePaise,
                            mrpPaise: pkg.mrpPaise || 0,
                            isVerifiedPrice: Boolean(pkg.isVerifiedPrice),
                            priceNote: pkg.priceNote || '',
                            badge: pkg.badge || '',
                            isActive: Boolean(pkg.isActive),
                            isFeatured: Boolean(pkg.isFeatured),
                          })
                          setPackageModalOpen(true)
                        }}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-cyan-50 px-3 py-1.5 text-xs font-bold text-cyan-800 hover:bg-cyan-100 transition"
                      >
                        <Edit size={14} />
                        <span>Update Price / Edit</span>
                      </button>

                      <button
                        onClick={() => handleDeletePackage(pkg._id, pkg.name)}
                        className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                        title="Delete Package"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 5: REPORTS & AUDIT LOGS                               */}
        {/* ========================================================= */}
        {activeTab === 'reports' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black text-[#073b66]">Patient Diagnostic Reports</h2>
                <p className="text-xs text-slate-500">
                  Secure PDF reports stored in private storage with OTP access tracking and regulatory audit logs.
                </p>
              </div>

              <button
                onClick={() => setReportUploadModalOpen(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-4 py-2.5 text-xs font-extrabold text-white hover:bg-cyan-700"
              >
                <Upload size={16} />
                <span>Upload New Report</span>
              </button>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3">Reference & Patient</th>
                    <th className="py-3 px-3">Report Title</th>
                    <th className="py-3 px-3">File Size</th>
                    <th className="py-3 px-3">Uploaded By</th>
                    <th className="py-3 px-3">Access Audit Log</th>
                    <th className="py-3 px-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {reports.map((r) => (
                    <tr key={r._id} className="hover:bg-slate-50/60">
                      <td className="py-3 px-3">
                        <strong className="block font-mono text-cyan-800">{r.bookingReference}</strong>
                        <span className="text-[11px] text-slate-600">{r.patientName} ({r.patientPhone})</span>
                      </td>
                      <td className="py-3 px-3 font-semibold text-slate-800">{r.reportTitle}</td>
                      <td className="py-3 px-3 text-slate-500">{Math.round(r.fileSizeBytes / 1024)} KB</td>
                      <td className="py-3 px-3 text-slate-500">{r.uploadedBy}</td>
                      <td className="py-3 px-3">
                        <span className="rounded-full bg-slate-100 px-2 py-0.5 text-[10px] font-bold text-slate-700">
                          {r.auditLogs?.length || 0} audit event(s)
                        </span>
                        {r.auditLogs?.slice(-1).map((log, i) => (
                          <span key={i} className="block text-[10px] text-slate-400 mt-0.5">
                            Last: {log.action} ({new Date(log.timestamp).toLocaleTimeString()})
                          </span>
                        ))}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteReport(r._id)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                          title="Delete Report"
                        >
                          <Trash2 size={15} />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: PAYMENTS & RECONCILIATION                          */}
        {/* ========================================================= */}
        {activeTab === 'payments' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <h2 className="text-xl font-black text-[#073b66]">Payment Reconciliation</h2>
            <p className="text-xs text-slate-500">
              Razorpay gateway transactions and manual desk payments logged with verification status.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3">Order ID</th>
                    <th className="py-3 px-3">Reference</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payment ID</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No online transactions recorded yet. Payments can also be reconciled at the desk.
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id}>
                        <td className="py-3 px-3 font-mono font-bold text-slate-900">{p.razorpayOrderId}</td>
                        <td className="py-3 px-3 font-mono text-cyan-800">{p.bookingReference}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">₹{p.amountPaise / 100}</td>
                        <td className="py-3 px-3 font-mono text-slate-500">{p.razorpayPaymentId || '—'}</td>
                        <td className="py-3 px-3">
                          <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-800 uppercase">
                            {p.status}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500">
                          {new Date(p.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 7: ENQUIRIES                                          */}
        {/* ========================================================= */}
        {activeTab === 'enquiries' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <h2 className="text-xl font-black text-[#073b66]">Doctor & Corporate Enquiries</h2>
            <p className="text-xs text-slate-500">Messages received from clinics, factories, and visitors.</p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3">Type</th>
                    <th className="py-3 px-3">Name & Organization</th>
                    <th className="py-3 px-3">Contact</th>
                    <th className="py-3 px-3">Message</th>
                    <th className="py-3 px-3">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {enquiries.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        No enquiries submitted yet.
                      </td>
                    </tr>
                  ) : (
                    enquiries.map((e) => (
                      <tr key={e._id} className="hover:bg-slate-50">
                        <td className="py-3 px-3 capitalize font-bold text-cyan-800">{e.type}</td>
                        <td className="py-3 px-3">
                          <strong className="block text-slate-900">{e.name}</strong>
                          <span className="text-[11px] text-slate-500">{e.organization || '—'}</span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="block text-slate-800 font-mono">{e.phone}</span>
                          <span className="text-[11px] text-slate-500">{e.email}</span>
                        </td>
                        <td className="py-3 px-3 max-w-sm text-slate-600 line-clamp-2">{e.message}</td>
                        <td className="py-3 px-3 text-slate-400">{new Date(e.createdAt).toLocaleDateString()}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 8: AUDIT TRAIL                                        */}
        {/* ========================================================= */}
        {activeTab === 'audit' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <h2 className="text-xl font-black text-[#073b66]">Regulatory & Security Audit Trail</h2>
            <p className="text-xs text-slate-500">
              Tamper-evident logs of administrative actions, test changes, and patient report access events.
            </p>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs font-mono">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase">
                    <th className="py-2.5 px-3">Timestamp</th>
                    <th className="py-2.5 px-3">Action</th>
                    <th className="py-2.5 px-3">Category</th>
                    <th className="py-2.5 px-3">Actor</th>
                    <th className="py-2.5 px-3">Reference / Target</th>
                    <th className="py-2.5 px-3">IP Address</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-[11px]">
                  {auditLogs.map((log) => (
                    <tr key={log._id}>
                      <td className="py-2 px-3 text-slate-500">
                        {new Date(log.createdAt).toLocaleString()}
                      </td>
                      <td className="py-2 px-3 font-bold text-slate-800">{log.action}</td>
                      <td className="py-2 px-3 text-slate-600 capitalize">{log.category}</td>
                      <td className="py-2 px-3 text-cyan-800">{log.performedBy}</td>
                      <td className="py-2 px-3 text-slate-700">{log.targetReference || log.targetId || '—'}</td>
                      <td className="py-2 px-3 text-slate-500">{log.ip || '127.0.0.1'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* MODAL: CREATE / EDIT TEST */}
      {testModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setTestModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-[#073b66]">
                {editingTest ? 'Edit Diagnostic Test' : 'Add New Diagnostic Test'}
              </h3>
              <button onClick={() => setTestModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleTestSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Test Name</label>
                  <input
                    type="text"
                    required
                    value={testForm.name}
                    onChange={(e) => setTestForm({ ...testForm, name: e.target.value })}
                    className="field"
                    placeholder="e.g. Complete Blood Count (CBC)"
                  />
                </div>
                <div>
                  <label className="field-label">Short Code / Acronym</label>
                  <input
                    type="text"
                    value={testForm.shortCode}
                    onChange={(e) => setTestForm({ ...testForm, shortCode: e.target.value })}
                    className="field"
                    placeholder="e.g. CBC"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Category</label>
                  <select
                    value={testForm.category}
                    onChange={(e) => setTestForm({ ...testForm, category: e.target.value })}
                    className="field"
                  >
                    <option value="Blood Tests">Blood Tests</option>
                    <option value="Diabetes">Diabetes</option>
                    <option value="Hormones">Hormones</option>
                    <option value="Heart Health">Heart Health</option>
                    <option value="Organ Health">Organ Health</option>
                    <option value="Infection & Immunity">Infection & Immunity</option>
                    <option value="Vitamins & Nutrition">Vitamins & Nutrition</option>
                    <option value="General Health">General Health</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Department</label>
                  <select
                    value={testForm.department}
                    onChange={(e) => setTestForm({ ...testForm, department: e.target.value })}
                    className="field"
                  >
                    <option value="Hematology">Hematology</option>
                    <option value="Clinical Biochemistry">Clinical Biochemistry</option>
                    <option value="Immunology & Serology">Immunology & Serology</option>
                    <option value="Clinical Pathology">Clinical Pathology</option>
                    <option value="Endocrinology">Endocrinology</option>
                    <option value="Microbiology">Microbiology</option>
                  </select>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Original MRP in Paise (e.g. 50000 = ₹500)</label>
                  <input
                    type="number"
                    min={0}
                    value={testForm.mrpPaise || 0}
                    onChange={(e) => setTestForm({ ...testForm, mrpPaise: Number(e.target.value) })}
                    className="field"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">₹{Math.round((testForm.mrpPaise || 0) / 100)}</p>
                </div>

                <div>
                  <label className="field-label">Offer / Selling Price in Paise (e.g. 35000 = ₹350) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={testForm.pricePaise}
                    onChange={(e) => setTestForm({ ...testForm, pricePaise: Number(e.target.value) })}
                    className="field"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">₹{Math.round(testForm.pricePaise / 100)}</p>
                </div>
              </div>

              {testForm.mrpPaise > testForm.pricePaise && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between font-bold">
                  <span>Calculated Discount: {Math.round(((testForm.mrpPaise - testForm.pricePaise) / testForm.mrpPaise) * 100)}% OFF</span>
                  <span>Patient Saves: ₹{Math.round((testForm.mrpPaise - testForm.pricePaise) / 100)}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Turnaround Hours (TAT)</label>
                  <input
                    type="number"
                    min={1}
                    value={testForm.turnaroundHours}
                    onChange={(e) => setTestForm({ ...testForm, turnaroundHours: Number(e.target.value) })}
                    className="field"
                  />
                </div>

                <div>
                  <label className="field-label">Specimen Type</label>
                  <input
                    type="text"
                    value={testForm.sampleType}
                    onChange={(e) => setTestForm({ ...testForm, sampleType: e.target.value })}
                    className="field"
                    placeholder="e.g. EDTA Whole Blood"
                  />
                </div>
              </div>

              <div className="flex items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={testForm.isVerifiedPrice}
                    onChange={(e) => setTestForm({ ...testForm, isVerifiedPrice: e.target.checked })}
                    className="rounded text-cyan-600"
                  />
                  <span>Mark Price as Officially Verified</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={testForm.fastingRequired}
                    onChange={(e) => setTestForm({ ...testForm, fastingRequired: e.target.checked })}
                    className="rounded text-cyan-600"
                  />
                  <span>Fasting Required</span>
                </label>
              </div>

              <div>
                <label className="field-label">Description / Clinical Purpose</label>
                <textarea
                  rows={2}
                  value={testForm.description}
                  onChange={(e) => setTestForm({ ...testForm, description: e.target.value })}
                  className="field"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setTestModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-700"
                >
                  Save Test
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: HEALTH PACKAGE CREATE / EDIT */}
      {packageModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setPackageModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 space-y-5 max-w-xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#073b66]">
                  {editingPackage ? 'Edit Health Screening Package' : 'Create New Health Package'}
                </h3>
                <p className="text-xs text-slate-500">
                  Set package details, test inclusions, tariffs, and promotional discount pricing.
                </p>
              </div>
              <button onClick={() => setPackageModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handlePackageSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Package Name *</label>
                  <input
                    type="text"
                    required
                    value={packageForm.name}
                    onChange={(e) => setPackageForm({ ...packageForm, name: e.target.value })}
                    className="field"
                    placeholder="e.g. Comprehensive Executive Health Profile"
                  />
                </div>

                <div>
                  <label className="field-label">Package Code *</label>
                  <input
                    type="text"
                    required
                    value={packageForm.code}
                    onChange={(e) => setPackageForm({ ...packageForm, code: e.target.value.toUpperCase() })}
                    className="field font-mono uppercase"
                    placeholder="e.g. PKG-EXEC-2026"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Category</label>
                  <select
                    value={packageForm.category}
                    onChange={(e) => setPackageForm({ ...packageForm, category: e.target.value })}
                    className="field"
                  >
                    <option value="Preventive Wellness">Preventive Wellness</option>
                    <option value="Senior Care">Senior Care</option>
                    <option value="Diabetic Care">Diabetic Care</option>
                    <option value="Women Health">Women Health</option>
                    <option value="Executive Health">Executive Health</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Badge / Highlight Pill</label>
                  <input
                    type="text"
                    value={packageForm.badge}
                    onChange={(e) => setPackageForm({ ...packageForm, badge: e.target.value })}
                    className="field"
                    placeholder="e.g. Popular Routine, 25% Off"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Tagline (Short Summary)</label>
                <input
                  type="text"
                  value={packageForm.tagline}
                  onChange={(e) => setPackageForm({ ...packageForm, tagline: e.target.value })}
                  className="field"
                  placeholder="e.g. Extensive multi-organ screening for working professionals"
                />
              </div>

              <div>
                <label className="field-label">Included Diagnostic Tests (comma-separated) *</label>
                <textarea
                  rows={3}
                  required
                  value={packageForm.testsIncludedInput}
                  onChange={(e) => setPackageForm({ ...packageForm, testsIncludedInput: e.target.value })}
                  className="field font-mono text-xs"
                  placeholder="CBC, Fasting Blood Glucose, HbA1c, Lipid Profile, LFT, KFT, Thyroid Profile, Urine Routine"
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  Separate test names with commas. Currently {packageForm.testsIncludedInput ? packageForm.testsIncludedInput.split(',').filter(s => s.trim()).length : 0} test(s) detected.
                </p>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Original MRP in Paise (e.g. 310000 = ₹3,100)</label>
                  <input
                    type="number"
                    min={0}
                    value={packageForm.mrpPaise}
                    onChange={(e) => setPackageForm({ ...packageForm, mrpPaise: Number(e.target.value) })}
                    className="field"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">₹{Math.round((packageForm.mrpPaise || 0) / 100)}</p>
                </div>

                <div>
                  <label className="field-label">Offer / Discounted Price in Paise (e.g. 249900 = ₹2,499) *</label>
                  <input
                    type="number"
                    required
                    min={0}
                    value={packageForm.pricePaise}
                    onChange={(e) => setPackageForm({ ...packageForm, pricePaise: Number(e.target.value) })}
                    className="field"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">₹{Math.round(packageForm.pricePaise / 100)}</p>
                </div>
              </div>

              {/* Live discount preview */}
              {packageForm.mrpPaise > packageForm.pricePaise && (
                <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-xs text-emerald-800 flex items-center justify-between font-bold">
                  <span>Calculated Discount: {Math.round(((packageForm.mrpPaise - packageForm.pricePaise) / packageForm.mrpPaise) * 100)}% OFF</span>
                  <span>Patient Saves: ₹{Math.round((packageForm.mrpPaise - packageForm.pricePaise) / 100)}</span>
                </div>
              )}

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Specimen Type</label>
                  <input
                    type="text"
                    value={packageForm.sampleType}
                    onChange={(e) => setPackageForm({ ...packageForm, sampleType: e.target.value })}
                    className="field"
                  />
                </div>

                <div>
                  <label className="field-label">Fasting Instructions</label>
                  <input
                    type="text"
                    value={packageForm.fastingInstructions}
                    onChange={(e) => setPackageForm({ ...packageForm, fastingInstructions: e.target.value })}
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Description / Clinical Purpose</label>
                <textarea
                  rows={2}
                  value={packageForm.description}
                  onChange={(e) => setPackageForm({ ...packageForm, description: e.target.value })}
                  className="field"
                />
              </div>

              <div className="flex flex-wrap items-center gap-6 pt-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={packageForm.isVerifiedPrice}
                    onChange={(e) => setPackageForm({ ...packageForm, isVerifiedPrice: e.target.checked })}
                    className="rounded text-cyan-600"
                  />
                  <span>Mark Tariff as Verified</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={packageForm.isFeatured}
                    onChange={(e) => setPackageForm({ ...packageForm, isFeatured: e.target.checked })}
                    className="rounded text-cyan-600"
                  />
                  <span>Featured Package (Home Page)</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-slate-700">
                  <input
                    type="checkbox"
                    checked={packageForm.isActive}
                    onChange={(e) => setPackageForm({ ...packageForm, isActive: e.target.checked })}
                    className="rounded text-cyan-600"
                  />
                  <span>Active in Public Catalogue</span>
                </label>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPackageModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 shadow-sm"
                >
                  {editingPackage ? 'Update Package & Prices' : 'Create Package'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}


      {/* MODAL: REPORT UPLOAD */}
      {reportUploadModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setReportUploadModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 space-y-5 max-w-lg">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <h3 className="text-lg font-black text-[#073b66]">
                Upload & Release Diagnostic Report
              </h3>
              <button onClick={() => setReportUploadModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleReportUploadSubmit} className="space-y-4">
              <div>
                <label className="field-label">Booking Reference ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={uploadRef}
                  onChange={(e) => setUploadRef(e.target.value.toUpperCase())}
                  placeholder="e.g. UP-DEMO-2026"
                  className="field font-mono font-bold uppercase"
                />
              </div>

              <div>
                <label className="field-label">Report Title</label>
                <input
                  type="text"
                  required
                  value={uploadTitle}
                  onChange={(e) => setUploadTitle(e.target.value)}
                  placeholder="e.g. Complete Blood Count (CBC) Diagnostic Report"
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">Verified Pathologist Name</label>
                <input
                  type="text"
                  value={uploadPathologist}
                  onChange={(e) => setUploadPathologist(e.target.value)}
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">Report Document File (PDF, JPG, PNG - Max 10MB)</label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png"
                  onChange={(e) => setSelectedFile(e.target.files?.[0] || null)}
                  className="field p-2 text-xs"
                />
              </div>

              <div className="rounded-xl bg-slate-50 p-3 text-[11px] text-slate-500 border border-slate-200">
                Notice: The file will be encrypted/stored under a random UUID in private storage. It will not be exposed via public URLs.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReportUploadModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={uploadBusy}
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 disabled:opacity-50"
                >
                  {uploadBusy ? 'Encrypting & Uploading...' : 'Upload & Release Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: CREATE / EDIT DOCTOR & CUSTOM DISCOUNT */}
      {doctorModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setDoctorModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 space-y-5 max-w-2xl">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#073b66]">
                  {editingDoctor ? 'Edit Doctor & Custom Discount' : 'Register New Referring Doctor'}
                </h3>
                <p className="text-xs text-slate-500">
                  Configure doctor login credentials, custom discount percentage, and clinic details.
                </p>
              </div>
              <button onClick={() => setDoctorModalOpen(false)}>
                <X size={20} />
              </button>
            </div>

            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Doctor Full Name <span className="text-red-500">*</span></label>
                  <input
                    type="text"
                    required
                    value={doctorForm.name}
                    onChange={(e) => setDoctorForm({ ...doctorForm, name: e.target.value })}
                    className="field"
                    placeholder="e.g. Dr. Rajesh Sharma"
                  />
                </div>

                <div>
                  <label className="field-label">Specialization</label>
                  <input
                    type="text"
                    required
                    value={doctorForm.specialization}
                    onChange={(e) => setDoctorForm({ ...doctorForm, specialization: e.target.value })}
                    className="field"
                    placeholder="e.g. Consultant Physician, Cardiologist"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Mobile Number (Login ID) <span className="text-red-500">*</span></label>
                  <input
                    type="tel"
                    required
                    value={doctorForm.mobile}
                    onChange={(e) => setDoctorForm({ ...doctorForm, mobile: e.target.value.replace(/\D/g, '').slice(0, 10) })}
                    className="field font-mono"
                    placeholder="10-digit mobile number"
                  />
                </div>

                <div>
                  <label className="field-label">Email Address <span className="text-red-500">*</span></label>
                  <input
                    type="email"
                    required
                    value={doctorForm.email}
                    onChange={(e) => setDoctorForm({ ...doctorForm, email: e.target.value })}
                    className="field"
                    placeholder="doctor@example.com"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">
                    Password {editingDoctor ? '(Leave blank to keep unchanged)' : <span className="text-red-500">*</span>}
                  </label>
                  <input
                    type="password"
                    required={!editingDoctor}
                    minLength={6}
                    value={doctorForm.password}
                    onChange={(e) => setDoctorForm({ ...doctorForm, password: e.target.value })}
                    className="field"
                    placeholder={editingDoctor ? '••••••••' : 'Min 6 characters'}
                  />
                </div>

                <div>
                  <label className="field-label">Qualifications</label>
                  <input
                    type="text"
                    value={doctorForm.qualification}
                    onChange={(e) => setDoctorForm({ ...doctorForm, qualification: e.target.value })}
                    className="field"
                    placeholder="e.g. MBBS, MD (Medicine)"
                  />
                </div>
              </div>

              {/* Custom Discount Config Box */}
              <div className="rounded-2xl border-2 border-cyan-200 bg-cyan-50/60 p-4 space-y-3">
                <div className="flex items-center gap-2 text-cyan-950 font-black text-sm">
                  <Percent size={18} className="text-cyan-600" />
                  <span>Custom Discount Percentage Configuration</span>
                </div>
                <p className="text-xs text-slate-600">
                  Set this doctor&apos;s custom discount rate. Whenever patients are referred by this doctor or book using their code, this discount is dynamically subtracted from their bill.
                </p>

                <div className="grid gap-4 sm:grid-cols-2 pt-1">
                  <div>
                    <label className="field-label text-cyan-950 font-bold">Assigned Discount % *</label>
                    <div className="relative">
                      <input
                        type="number"
                        required
                        min={0}
                        max={100}
                        value={doctorForm.discountPercent}
                        onChange={(e) => setDoctorForm({ ...doctorForm, discountPercent: Number(e.target.value) })}
                        className="field font-black text-base pr-8 text-[#073b66]"
                      />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 font-bold">%</span>
                    </div>
                    <div className="mt-2 flex gap-1.5">
                      {[5, 10, 15, 20, 25].map((preset) => (
                        <button
                          key={preset}
                          type="button"
                          onClick={() => setDoctorForm({ ...doctorForm, discountPercent: preset })}
                          className={`px-2 py-0.5 rounded text-[11px] font-bold border transition ${
                            doctorForm.discountPercent === preset
                              ? 'bg-cyan-600 text-white border-cyan-600'
                              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100'
                          }`}
                        >
                          {preset}%
                        </button>
                      ))}
                    </div>
                  </div>

                  <div>
                    <label className="field-label">Referral Code (Optional)</label>
                    <input
                      type="text"
                      value={doctorForm.referralCode}
                      onChange={(e) => setDoctorForm({ ...doctorForm, referralCode: e.target.value.toUpperCase() })}
                      className="field font-mono uppercase"
                      placeholder="e.g. DR-SHARMA"
                    />
                    <span className="text-[11px] text-slate-500 mt-1 block">
                      Auto-generated from name if left empty
                    </span>
                  </div>
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="field-label">Clinic / Hospital Name</label>
                  <input
                    type="text"
                    value={doctorForm.clinicName}
                    onChange={(e) => setDoctorForm({ ...doctorForm, clinicName: e.target.value })}
                    className="field"
                    placeholder="e.g. Sharma Health Clinic"
                  />
                </div>

                <div>
                  <label className="field-label">Account Status</label>
                  <select
                    value={doctorForm.status}
                    onChange={(e) => setDoctorForm({ ...doctorForm, status: e.target.value })}
                    className="field font-bold"
                  >
                    <option value="active">Active (Can log in & refer)</option>
                    <option value="inactive">Inactive / Suspended</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Clinic Address</label>
                <input
                  type="text"
                  value={doctorForm.clinicAddress}
                  onChange={(e) => setDoctorForm({ ...doctorForm, clinicAddress: e.target.value })}
                  className="field"
                  placeholder="e.g. Shop 4, Station Road, Mandideep (M.P.)"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setDoctorModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="rounded-xl bg-cyan-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 shadow-sm"
                >
                  {editingDoctor ? 'Save Changes' : 'Register Doctor'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* MODAL: CREATE / EDIT OFFER & CAMPAIGN                     */}
      {/* ========================================================= */}
      {offerModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/70 p-4 backdrop-blur-xs overflow-y-auto">
          <div className="relative w-full max-w-4xl rounded-3xl bg-white p-6 sm:p-8 shadow-2xl max-h-[92vh] overflow-y-auto space-y-6">
            {/* Modal Header */}
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200">
                  <Sparkles size={22} />
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#073b66]">
                    {editingOffer ? 'Edit Promotional Campaign' : 'Create Promotional Campaign / Offer'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    Configure campaign details, visual banner gradient, discount structure, and automatic activation dates.
                  </p>
                </div>
              </div>
              <button
                onClick={() => setOfferModalOpen(false)}
                className="rounded-xl p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            {offerFormError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-center gap-2">
                <AlertCircle size={16} />
                <span>{offerFormError}</span>
              </div>
            )}

            {/* LIVE BANNER PREVIEW CARD */}
            <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-2">
              <span className="text-[10px] font-black uppercase tracking-wider text-slate-500 block">
                Live Public Banner Preview (How this offer appears to patients)
              </span>
              <div
                className={`relative overflow-hidden rounded-2xl bg-gradient-to-r ${
                  offerForm.bannerGradient || 'from-amber-500 via-rose-500 to-red-600'
                } p-5 text-white shadow-lg`}
              >
                <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1.5 max-w-xl">
                    <div className="inline-flex items-center gap-1.5 rounded-full bg-white/20 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-xs border border-white/20">
                      <Sparkles size={11} />
                      <span>{offerForm.badgeText || 'SPECIAL OFFER'}</span>
                    </div>
                    <h4 className="text-lg sm:text-xl font-black tracking-tight leading-snug">
                      {offerForm.title || offerForm.name || 'Sample Campaign Headline'}
                    </h4>
                    <p className="text-xs text-white/90 line-clamp-2">
                      {offerForm.description || 'Promotional campaign description and terms will appear here.'}
                    </p>
                    <div className="pt-1 flex items-center gap-3 text-[11px] text-white/80 font-medium">
                      <span>
                        Valid: {offerForm.startDate || 'Today'} → {offerForm.endDate || 'Ongoing'}
                      </span>
                      {offerForm.code && (
                        <span className="font-mono bg-white/20 px-2 py-0.5 rounded font-black text-white">
                          CODE: {offerForm.code.toUpperCase()}
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex md:flex-col items-center md:items-end justify-between gap-2 shrink-0">
                    <div className="text-right">
                      <span className="text-2xl sm:text-3xl font-black font-mono block text-white drop-shadow-xs">
                        {offerForm.discountType === 'percentage' && `${offerForm.discountValue}% OFF`}
                        {offerForm.discountType === 'fixed_amount' && `₹${offerForm.discountValue} OFF`}
                        {offerForm.discountType === 'offer_price' && `₹${offerForm.discountValue}`}
                      </span>
                      {offerForm.minOrderAmountPaise > 0 && (
                        <span className="text-[10px] text-white/80 block">
                          Min. Order ₹{offerForm.minOrderAmountPaise}
                        </span>
                      )}
                    </div>
                    <span className="inline-flex items-center gap-1 rounded-xl bg-white px-4 py-2 text-xs font-black text-slate-900 shadow-md">
                      Claim Offer & Book
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Main Form */}
            <form onSubmit={handleOfferSubmit} className="space-y-6">
              {/* SECTION 1: CAMPAIGN BASICS */}
              <div className="space-y-4">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#073b66] border-b border-slate-100 pb-2">
                  1. Campaign Basic Information
                </h4>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Campaign / Offer Name <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={offerForm.name}
                      onChange={(e) => setOfferForm({ ...offerForm, name: e.target.value })}
                      placeholder="e.g. Deepawali Mega Health Festive"
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="field-label">Headline / Banner Title <span className="text-red-500">*</span></label>
                    <input
                      type="text"
                      required
                      value={offerForm.title}
                      onChange={(e) => setOfferForm({ ...offerForm, title: e.target.value })}
                      placeholder="e.g. Flat 20% Off on Full Body & Diabetic Screenings"
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Detailed Description <span className="text-red-500">*</span></label>
                  <textarea
                    rows={2}
                    required
                    value={offerForm.description}
                    onChange={(e) => setOfferForm({ ...offerForm, description: e.target.value })}
                    placeholder="Provide patient-friendly details regarding this offer, purpose, and inclusions..."
                    className="field"
                  />
                </div>

                <div className="grid gap-4 sm:grid-cols-4">
                  <div>
                    <label className="field-label">Promo Code (Optional)</label>
                    <input
                      type="text"
                      value={offerForm.code}
                      onChange={(e) => setOfferForm({ ...offerForm, code: e.target.value.toUpperCase() })}
                      placeholder="e.g. DIWALI20"
                      className="field font-mono uppercase"
                    />
                  </div>

                  <div>
                    <label className="field-label">Campaign Type</label>
                    <select
                      value={offerForm.offerType}
                      onChange={(e) => setOfferForm({ ...offerForm, offerType: e.target.value })}
                      className="field font-bold"
                    >
                      <option value="festival">Festival Offer (Diwali, Holi, etc.)</option>
                      <option value="seasonal">Seasonal (Winter, Summer, Monsoon)</option>
                      <option value="health_camp">Health Camp & Community Drive</option>
                      <option value="special_package">Special Health Package</option>
                      <option value="senior_citizen">Senior Citizen Concession</option>
                      <option value="general">General Promotional</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">Badge Text</label>
                    <input
                      type="text"
                      value={offerForm.badgeText}
                      onChange={(e) => setOfferForm({ ...offerForm, badgeText: e.target.value })}
                      placeholder="e.g. LIMITED FESTIVE OFFER"
                      className="field"
                    />
                  </div>

                  <div>
                    <label className="field-label">Display Priority (1-100)</label>
                    <input
                      type="number"
                      min={1}
                      max={100}
                      value={offerForm.priority}
                      onChange={(e) => setOfferForm({ ...offerForm, priority: Number(e.target.value) })}
                      className="field"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 2: BANNER STYLING */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#073b66] border-b border-slate-100 pb-2">
                  2. Banner Styling & Gradient
                </h4>

                <div>
                  <label className="field-label block mb-2">Preset Banner Color Themes</label>
                  <div className="grid grid-cols-2 sm:grid-cols-5 gap-2">
                    {[
                      { name: 'Festival Amber/Red', gradient: 'from-amber-500 via-rose-500 to-red-600' },
                      { name: 'Emerald Wellness', gradient: 'from-emerald-500 via-teal-600 to-cyan-700' },
                      { name: 'Royal Purple', gradient: 'from-indigo-600 via-purple-600 to-pink-600' },
                      { name: 'Sunrise Gold', gradient: 'from-orange-500 via-amber-500 to-yellow-500' },
                      { name: 'Clinical Navy', gradient: 'from-slate-900 via-[#073b66] to-cyan-800' },
                    ].map((preset) => (
                      <button
                        key={preset.gradient}
                        type="button"
                        onClick={() => setOfferForm({ ...offerForm, bannerGradient: preset.gradient })}
                        className={`rounded-xl p-2.5 text-left border text-xs font-bold transition flex flex-col gap-1.5 ${
                          offerForm.bannerGradient === preset.gradient
                            ? 'border-cyan-600 ring-2 ring-cyan-500/30 shadow-xs'
                            : 'border-slate-200 hover:border-slate-300'
                        }`}
                      >
                        <div className={`h-6 w-full rounded-lg bg-gradient-to-r ${preset.gradient}`} />
                        <span className="text-[11px] text-slate-700 truncate">{preset.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="field-label">Custom Tailwind Gradient Classes</label>
                    <input
                      type="text"
                      value={offerForm.bannerGradient}
                      onChange={(e) => setOfferForm({ ...offerForm, bannerGradient: e.target.value })}
                      placeholder="from-amber-500 via-rose-500 to-red-600"
                      className="field font-mono text-xs"
                    />
                  </div>

                  <div>
                    <label className="field-label">Optional Banner Image URL</label>
                    <input
                      type="url"
                      value={offerForm.bannerUrl}
                      onChange={(e) => setOfferForm({ ...offerForm, bannerUrl: e.target.value })}
                      placeholder="https://images.unsplash.com/..."
                      className="field"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 3: DISCOUNT STRUCTURE */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#073b66] border-b border-slate-100 pb-2">
                  3. Discount Calculation
                </h4>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="field-label">Discount Type <span className="text-red-500">*</span></label>
                    <select
                      value={offerForm.discountType}
                      onChange={(e) => setOfferForm({ ...offerForm, discountType: e.target.value })}
                      className="field font-bold"
                    >
                      <option value="percentage">Percentage Discount (%)</option>
                      <option value="fixed_amount">Fixed Amount Concession (₹)</option>
                      <option value="offer_price">Special Flat Offer Price (₹)</option>
                    </select>
                  </div>

                  <div>
                    <label className="field-label">
                      {offerForm.discountType === 'percentage' && 'Discount Percentage (%) *'}
                      {offerForm.discountType === 'fixed_amount' && 'Concession Amount in Rupees (₹) *'}
                      {offerForm.discountType === 'offer_price' && 'Flat Offer Price in Rupees (₹) *'}
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={offerForm.discountValue}
                      onChange={(e) => setOfferForm({ ...offerForm, discountValue: Number(e.target.value) })}
                      className="field font-black text-base text-[#073b66]"
                      placeholder={offerForm.discountType === 'percentage' ? '20' : '500'}
                    />
                  </div>

                  <div>
                    <label className="field-label">Minimum Order Requirement (₹)</label>
                    <input
                      type="number"
                      min={0}
                      value={offerForm.minOrderAmountPaise}
                      onChange={(e) => setOfferForm({ ...offerForm, minOrderAmountPaise: Number(e.target.value) })}
                      placeholder="0 for no minimum"
                      className="field"
                    />
                  </div>
                </div>
              </div>

              {/* SECTION 4: APPLICABILITY SCOPE */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#073b66] border-b border-slate-100 pb-2">
                  4. Applicability Scope
                </h4>

                <div className="grid gap-3 sm:grid-cols-4">
                  {[
                    { id: 'all', title: 'Entire Catalogue', desc: 'All tests & health packages' },
                    { id: 'category', title: 'Specific Categories', desc: 'Select test categories' },
                    { id: 'package', title: 'Health Packages', desc: 'Select screening packages' },
                    { id: 'test', title: 'Individual Tests', desc: 'Select individual tests' },
                  ].map((scope) => (
                    <button
                      key={scope.id}
                      type="button"
                      onClick={() => setOfferForm({ ...offerForm, applicabilityType: scope.id })}
                      className={`p-3 rounded-2xl border text-left transition flex flex-col justify-between ${
                        offerForm.applicabilityType === scope.id
                          ? 'border-cyan-600 bg-cyan-50/60 ring-2 ring-cyan-500/20 shadow-xs'
                          : 'border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      <strong className="text-xs font-black text-[#073b66]">{scope.title}</strong>
                      <span className="text-[11px] text-slate-500 mt-1">{scope.desc}</span>
                    </button>
                  ))}
                </div>

                {/* Sub-selectors based on applicability type */}
                {offerForm.applicabilityType === 'category' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 animate-in fade-in">
                    <label className="field-label block font-bold text-slate-800">
                      Select Applicable Categories:
                    </label>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                      {[
                        'Blood Tests',
                        'Diabetes',
                        'Hormones',
                        'Heart Health',
                        'Organ Health',
                        'Infection & Immunity',
                        'Vitamins & Nutrition',
                        'General Health',
                      ].map((cat) => {
                        const checked = offerForm.applicableCategories.includes(cat)
                        return (
                          <label
                            key={cat}
                            className={`flex items-center gap-2 p-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                              checked
                                ? 'bg-cyan-600 text-white border-cyan-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...offerForm.applicableCategories, cat]
                                  : offerForm.applicableCategories.filter((c) => c !== cat)
                                setOfferForm({ ...offerForm, applicableCategories: next })
                              }}
                              className="hidden"
                            />
                            <span>{cat}</span>
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {offerForm.applicabilityType === 'package' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 animate-in fade-in">
                    <label className="field-label block font-bold text-slate-800">
                      Select Health Packages ({offerForm.applicablePackageIds.length} selected):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-48 overflow-y-auto p-1">
                      {packages.map((pkg) => {
                        const pkgId = String(pkg._id)
                        const checked = offerForm.applicablePackageIds.includes(pkgId)
                        return (
                          <label
                            key={pkgId}
                            className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold cursor-pointer transition ${
                              checked
                                ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate pr-2">{pkg.name}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...offerForm.applicablePackageIds, pkgId]
                                  : offerForm.applicablePackageIds.filter((id) => id !== pkgId)
                                setOfferForm({ ...offerForm, applicablePackageIds: next })
                              }}
                              className="rounded text-cyan-600"
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}

                {offerForm.applicabilityType === 'test' && (
                  <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-2 animate-in fade-in">
                    <label className="field-label block font-bold text-slate-800">
                      Select Individual Tests ({offerForm.applicableTestIds.length} selected):
                    </label>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto p-1">
                      {tests.map((t) => {
                        const testId = String(t._id)
                        const checked = offerForm.applicableTestIds.includes(testId)
                        return (
                          <label
                            key={testId}
                            className={`flex items-center justify-between p-2 rounded-xl border text-xs font-bold cursor-pointer transition ${
                              checked
                                ? 'bg-cyan-600 text-white border-cyan-600'
                                : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-50'
                            }`}
                          >
                            <span className="truncate pr-2">{t.name} {t.shortCode ? `(${t.shortCode})` : ''}</span>
                            <input
                              type="checkbox"
                              checked={checked}
                              onChange={(e) => {
                                const next = e.target.checked
                                  ? [...offerForm.applicableTestIds, testId]
                                  : offerForm.applicableTestIds.filter((id) => id !== testId)
                                setOfferForm({ ...offerForm, applicableTestIds: next })
                              }}
                              className="rounded text-cyan-600"
                            />
                          </label>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              {/* SECTION 5: SCHEDULE & LIMITS */}
              <div className="space-y-4 pt-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-[#073b66] border-b border-slate-100 pb-2">
                  5. Schedule & Expiry Controls
                </h4>

                <div className="grid gap-4 sm:grid-cols-3">
                  <div>
                    <label className="field-label">Campaign Start Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      value={offerForm.startDate}
                      onChange={(e) => setOfferForm({ ...offerForm, startDate: e.target.value })}
                      className="field"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Auto-activates on this date.
                    </span>
                  </div>

                  <div>
                    <label className="field-label">Campaign End Date <span className="text-red-500">*</span></label>
                    <input
                      type="date"
                      required
                      min={offerForm.startDate}
                      value={offerForm.endDate}
                      onChange={(e) => setOfferForm({ ...offerForm, endDate: e.target.value })}
                      className="field"
                    />
                    <span className="text-[10px] text-slate-500 mt-1 block">
                      Auto-expires and hides after this date.
                    </span>
                  </div>

                  <div>
                    <label className="field-label">Redemption Limit (Max Usage)</label>
                    <input
                      type="number"
                      min={1}
                      value={offerForm.maxUsageCount}
                      onChange={(e) => setOfferForm({ ...offerForm, maxUsageCount: e.target.value })}
                      placeholder="Leave blank for unlimited"
                      className="field"
                    />
                  </div>
                </div>

                <div>
                  <label className="field-label">Terms & Conditions (One per line)</label>
                  <textarea
                    rows={3}
                    value={offerForm.terms}
                    onChange={(e) => setOfferForm({ ...offerForm, terms: e.target.value })}
                    placeholder="Enter terms, eligibility guidelines, and exclusions..."
                    className="field text-xs font-mono"
                  />
                </div>

                <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 flex items-center justify-between">
                  <div>
                    <strong className="block text-xs font-black text-[#073b66]">
                      Campaign Active Switch
                    </strong>
                    <span className="text-[11px] text-slate-500">
                      Enable to allow this offer to run during its scheduled date range.
                    </span>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={offerForm.isActive}
                      onChange={(e) => setOfferForm({ ...offerForm, isActive: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-slate-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                </div>
              </div>

              {/* Form Action Buttons */}
              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setOfferModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-5 py-2.5 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={offerSubmitting}
                  className="rounded-xl bg-gradient-to-r from-cyan-600 to-teal-600 px-6 py-2.5 text-xs font-black text-white hover:from-cyan-700 hover:to-teal-700 shadow-md active:scale-95 transition disabled:opacity-50"
                >
                  {offerSubmitting
                    ? 'Publishing Campaign...'
                    : editingOffer
                    ? 'Save Campaign Changes'
                    : 'Publish & Schedule Campaign'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

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
  Download,
  Receipt,
  Printer,
  FileSpreadsheet,
  RotateCcw,
  DollarSign,
  Filter,
  ArrowUpDown,
  FileCheck2,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { apiRequest, API_BASE, getAdminToken } from '../api.js'

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
  const [downloadLogs, setDownloadLogs] = useState([])

  const [patients, setPatients] = useState([])
  const [patientSearch, setPatientSearch] = useState('')
  const [testSearch, setTestSearch] = useState('')
  const [testCategoryFilter, setTestCategoryFilter] = useState('all')
  const [testStatusFilter, setTestStatusFilter] = useState('all')

  const [paymentSearch, setPaymentSearch] = useState('')
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all')
  const [syncBusy, setSyncBusy] = useState(false)

  // Payment Method Selection Modal State
  const [paymentModalOpen, setPaymentModalOpen] = useState(false)
  const [paymentBooking, setPaymentBooking] = useState(null)
  const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('Cash')
  const [paymentNotes, setPaymentNotes] = useState('')
  const [paymentBusy, setPaymentBusy] = useState(false)

  // Report Replace Modal State
  const [replaceReportModalOpen, setReplaceReportModalOpen] = useState(false)
  const [replacingReport, setReplacingReport] = useState(null)
  const [replaceFile, setReplaceFile] = useState(null)
  const [replaceBusy, setReplaceBusy] = useState(false)

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

  // =========================================================================
  // DOCTOR REFERRALS & FINANCIAL LEDGER STATE
  // =========================================================================
  const [referralSubView, setReferralSubView] = useState('ledger') // 'ledger' | 'statements'
  const [referrals, setReferrals] = useState([])
  const [referralsSummary, setReferralsSummary] = useState({
    totalBookings: 0,
    totalMrpPaise: 0,
    totalDoctorDiscountPaise: 0,
    totalPayablePaise: 0,
    totalPaidPaise: 0,
    totalOutstandingPaise: 0,
    totalRefundedPaise: 0,
    totalAuthorizedServicePaymentPaise: 0,
    totalLabNetRetainedPaise: 0,
  })
  const [referralsLoading, setReferralsLoading] = useState(false)
  const [referralsPagination, setReferralsPagination] = useState({ page: 1, limit: 20, total: 0, pages: 1 })

  // Referral Filters
  const [refDoctorFilter, setRefDoctorFilter] = useState('all')
  const [refSearch, setRefSearch] = useState('')
  const [refBookingId, setRefBookingId] = useState('')
  const [refStartDate, setRefStartDate] = useState('')
  const [refEndDate, setRefEndDate] = useState('')
  const [refTestOrPackage, setRefTestOrPackage] = useState('')
  const [refStatusFilter, setRefStatusFilter] = useState('all')
  const [refPaymentFilter, setRefPaymentFilter] = useState('all')
  const [refSettlementFilter, setRefSettlementFilter] = useState('all')
  const [refSortBy, setRefSortBy] = useState('createdAt')
  const [refSortOrder, setRefSortOrder] = useState('desc')
  const [refPage, setRefPage] = useState(1)

  // Doctor Financial Statements
  const [doctorStatements, setDoctorStatements] = useState([])
  const [statementsSummary, setStatementsSummary] = useState(null)
  const [statementsLoading, setStatementsLoading] = useState(false)
  const [statementDoctorFilter, setStatementDoctorFilter] = useState('')
  const [statementStartDate, setStatementStartDate] = useState('')
  const [statementEndDate, setStatementEndDate] = useState('')
  const [selectedStatementDrilldown, setSelectedStatementDrilldown] = useState(null)

  // Referral Action Modals State
  const [refPaymentModalOpen, setRefPaymentModalOpen] = useState(false)
  const [refPaymentBooking, setRefPaymentBooking] = useState(null)
  const [refPaymentForm, setRefPaymentForm] = useState({ amount: '', paymentMethod: 'Cash', transactionRef: '', notes: '' })
  const [refPaymentSubmitting, setRefPaymentSubmitting] = useState(false)

  const [refRefundModalOpen, setRefRefundModalOpen] = useState(false)
  const [refRefundBooking, setRefRefundBooking] = useState(null)
  const [refRefundForm, setRefRefundForm] = useState({ refundAmount: '', reason: 'PATIENT_REQUEST', notes: '', reference: '' })
  const [refRefundSubmitting, setRefRefundSubmitting] = useState(false)

  const [refServiceModalOpen, setRefServiceModalOpen] = useState(false)
  const [refServiceBooking, setRefServiceBooking] = useState(null)
  const [refServiceForm, setRefServiceForm] = useState({
    amount: '',
    category: 'CLINICAL_SPECIMEN_COLLECTION',
    agreementRef: '',
    legalJustification: '',
    paymentReference: '',
    notes: '',
  })
  const [refServiceSubmitting, setRefServiceSubmitting] = useState(false)

  const [refSettlementModalOpen, setRefSettlementModalOpen] = useState(false)
  const [refSettlementBooking, setRefSettlementBooking] = useState(null)
  const [refSettlementForm, setRefSettlementForm] = useState({ settlementStatus: 'SETTLED', notes: '' })
  const [refSettlementSubmitting, setRefSettlementSubmitting] = useState(false)

  const [referralDetailModalOpen, setReferralDetailModalOpen] = useState(false)
  const [selectedReferralDetail, setSelectedReferralDetail] = useState(null)
  const [referralDetailLoading, setReferralDetailLoading] = useState(false)

  const [refPrintModalOpen, setRefPrintModalOpen] = useState(false)
  const [printReportType, setPrintReportType] = useState('referrals') // 'referrals' | 'doctor-statement'
  const [printReportPayload, setPrintReportPayload] = useState(null)

  const formatInr = (paise) => {
    const rs = (Number(paise) || 0) / 100
    return '₹' + rs.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
  }

  async function loadReferralsData() {
    setReferralsLoading(true)
    try {
      const params = new URLSearchParams()
      params.set('page', refPage.toString())
      params.set('limit', '20')
      if (refDoctorFilter && refDoctorFilter !== 'all') params.set('doctorId', refDoctorFilter)
      if (refSearch.trim()) params.set('search', refSearch.trim())
      if (refBookingId.trim()) params.set('bookingId', refBookingId.trim())
      if (refStartDate) params.set('startDate', refStartDate)
      if (refEndDate) params.set('endDate', refEndDate)
      if (refTestOrPackage.trim()) params.set('testOrPackage', refTestOrPackage.trim())
      if (refStatusFilter && refStatusFilter !== 'all') params.set('bookingStatus', refStatusFilter)
      if (refPaymentFilter && refPaymentFilter !== 'all') params.set('paymentStatus', refPaymentFilter)
      if (refSettlementFilter && refSettlementFilter !== 'all') params.set('settlementStatus', refSettlementFilter)
      if (refSortBy) params.set('sortBy', refSortBy)
      if (refSortOrder) params.set('sortOrder', refSortOrder)

      const res = await apiRequest(`/admin/referrals?${params.toString()}`, { authType: 'admin' })
      setReferrals(res.referrals || [])
      setReferralsSummary(res.summary || {})
      setReferralsPagination(res.pagination || { page: 1, limit: 20, total: 0, pages: 1 })
    } catch (err) {
      console.error('Error loading referrals:', err.message)
    } finally {
      setReferralsLoading(false)
    }
  }

  async function loadDoctorStatementsData() {
    setStatementsLoading(true)
    try {
      const params = new URLSearchParams()
      if (statementDoctorFilter && statementDoctorFilter !== 'all') params.set('doctorId', statementDoctorFilter)
      if (statementStartDate) params.set('startDate', statementStartDate)
      if (statementEndDate) params.set('endDate', statementEndDate)

      const res = await apiRequest(`/admin/doctors-financial-statements?${params.toString()}`, { authType: 'admin' })
      setDoctorStatements(res.statements || [])
      setStatementsSummary(res.overallSummary || null)
    } catch (err) {
      console.error('Error loading doctor statements:', err.message)
    } finally {
      setStatementsLoading(false)
    }
  }

  useEffect(() => {
    if (activeTab === 'doctorReferrals') {
      if (referralSubView === 'ledger') {
        loadReferralsData()
      } else {
        loadDoctorStatementsData()
      }
    }
  }, [
    activeTab,
    referralSubView,
    refDoctorFilter,
    refSearch,
    refBookingId,
    refStartDate,
    refEndDate,
    refTestOrPackage,
    refStatusFilter,
    refPaymentFilter,
    refSettlementFilter,
    refSortBy,
    refSortOrder,
    refPage,
    statementDoctorFilter,
    statementStartDate,
    statementEndDate,
  ])

  async function handleOpenReferralDetail(bookingId) {
    setReferralDetailLoading(true)
    setReferralDetailModalOpen(true)
    try {
      const res = await apiRequest(`/admin/referrals/${bookingId}`, { authType: 'admin' })
      setSelectedReferralDetail(res)
    } catch (err) {
      alert(`Error loading booking details: ${err.message}`)
      setReferralDetailModalOpen(false)
    } finally {
      setReferralDetailLoading(false)
    }
  }

  function handleOpenRefPaymentModal(booking) {
    setRefPaymentBooking(booking)
    const dueAmount = Math.max(0, (booking.financials?.patientOutstandingPaise || 0) / 100)
    setRefPaymentForm({
      amount: dueAmount > 0 ? dueAmount.toString() : '',
      paymentMethod: 'Cash',
      transactionRef: '',
      notes: '',
    })
    setRefPaymentModalOpen(true)
  }

  async function handleRefPaymentSubmit(e) {
    e.preventDefault()
    if (!refPaymentBooking) return
    setRefPaymentSubmitting(true)
    try {
      const amtPaise = Math.round(Number(refPaymentForm.amount) * 100)
      if (!amtPaise || amtPaise <= 0) {
        alert('Please enter a valid payment amount greater than zero.')
        setRefPaymentSubmitting(false)
        return
      }
      await apiRequest(`/admin/referrals/${refPaymentBooking._id}/payment`, {
        method: 'POST',
        authType: 'admin',
        body: JSON.stringify({
          amountPaise: amtPaise,
          paymentMethod: refPaymentForm.paymentMethod,
          transactionReference: refPaymentForm.transactionRef.trim(),
          notes: refPaymentForm.notes.trim(),
        }),
      })
      setActionNotice(`Payment of ${formatInr(amtPaise)} recorded successfully.`)
      setRefPaymentModalOpen(false)
      setRefPaymentBooking(null)
      loadReferralsData()
      if (selectedReferralDetail) handleOpenReferralDetail(selectedReferralDetail.booking?._id || refPaymentBooking._id)
    } catch (err) {
      alert(`Error recording payment: ${err.message}`)
    } finally {
      setRefPaymentSubmitting(false)
    }
  }

  function handleOpenRefRefundModal(booking) {
    setRefRefundBooking(booking)
    const paidAmount = Math.max(0, (booking.financials?.patientPaidPaise || 0) / 100)
    setRefRefundForm({
      refundAmount: paidAmount > 0 ? paidAmount.toString() : '',
      reason: 'PATIENT_REQUEST',
      notes: '',
      reference: '',
    })
    setRefRefundModalOpen(true)
  }

  async function handleRefRefundSubmit(e) {
    e.preventDefault()
    if (!refRefundBooking) return
    setRefRefundSubmitting(true)
    try {
      const amtPaise = Math.round(Number(refRefundForm.refundAmount) * 100)
      if (!amtPaise || amtPaise <= 0) {
        alert('Please enter a valid refund amount.')
        setRefRefundSubmitting(false)
        return
      }
      if (!refRefundForm.reason.trim()) {
        alert('Justification/reason is mandatory for issuing refunds.')
        setRefRefundSubmitting(false)
        return
      }
      await apiRequest(`/admin/referrals/${refRefundBooking._id}/refund`, {
        method: 'POST',
        authType: 'admin',
        body: JSON.stringify({
          refundAmountPaise: amtPaise,
          amountPaise: amtPaise,
          amount: Number(refRefundForm.refundAmount),
          reason: refRefundForm.reason.trim(),
          justification: refRefundForm.reason.trim(),
          notes: refRefundForm.notes.trim(),
          reference: refRefundForm.reference.trim(),
          transactionReference: refRefundForm.reference.trim(),
        }),
      })
      setActionNotice(`Refund of ${formatInr(amtPaise)} processed and recorded in ledger.`)
      setRefRefundModalOpen(false)
      setRefRefundBooking(null)
      loadReferralsData()
      if (selectedReferralDetail) handleOpenReferralDetail(selectedReferralDetail.booking?._id || refRefundBooking._id)
    } catch (err) {
      alert(`Error processing refund: ${err.message}`)
    } finally {
      setRefRefundSubmitting(false)
    }
  }

  function handleOpenRefServiceModal(booking) {
    setRefServiceBooking(booking)
    setRefServiceForm({
      amount: '',
      category: 'CLINICAL_SPECIMEN_COLLECTION',
      agreementRef: '',
      legalJustification: '',
      paymentReference: '',
      notes: '',
    })
    setRefServiceModalOpen(true)
  }

  async function handleRefServiceSubmit(e) {
    e.preventDefault()
    if (!refServiceBooking) return
    setRefServiceSubmitting(true)
    try {
      const amtPaise = Math.round(Number(refServiceForm.amount) * 100)
      if (!amtPaise || amtPaise <= 0) {
        alert('Please enter a valid amount.')
        setRefServiceSubmitting(false)
        return
      }
      if (!refServiceForm.legalJustification.trim()) {
        alert('Legal justification and regulatory compliance documentation are strictly required.')
        setRefServiceSubmitting(false)
        return
      }
      await apiRequest(`/admin/referrals/${refServiceBooking._id}/service-payment`, {
        method: 'POST',
        authType: 'admin',
        body: JSON.stringify({
          amountPaise: amtPaise,
          category: refServiceForm.category,
          agreementRef: refServiceForm.agreementRef.trim(),
          legalJustification: refServiceForm.legalJustification.trim(),
          paymentReference: refServiceForm.paymentReference.trim(),
          notes: refServiceForm.notes.trim(),
        }),
      })
      setActionNotice(`Authorized clinical service payment of ${formatInr(amtPaise)} logged.`)
      setRefServiceModalOpen(false)
      setRefServiceBooking(null)
      loadReferralsData()
      if (selectedReferralDetail) handleOpenReferralDetail(selectedReferralDetail.booking?._id || refServiceBooking._id)
    } catch (err) {
      alert(`Error recording clinical service payment: ${err.message}`)
    } finally {
      setRefServiceSubmitting(false)
    }
  }

  function handleOpenRefSettlementModal(booking) {
    setRefSettlementBooking(booking)
    setRefSettlementForm({
      settlementStatus: booking.settlementStatus || 'SETTLED',
      notes: booking.settlementNotes || '',
    })
    setRefSettlementModalOpen(true)
  }

  async function handleRefSettlementSubmit(e) {
    e.preventDefault()
    if (!refSettlementBooking) return
    setRefSettlementSubmitting(true)
    try {
      await apiRequest(`/admin/referrals/${refSettlementBooking._id}/settlement`, {
        method: 'PATCH',
        authType: 'admin',
        body: JSON.stringify({
          settlementStatus: refSettlementForm.settlementStatus,
          notes: refSettlementForm.notes.trim(),
        }),
      })
      setActionNotice(`Settlement status updated to ${refSettlementForm.settlementStatus}`)
      setRefSettlementModalOpen(false)
      setRefSettlementBooking(null)
      loadReferralsData()
      if (selectedReferralDetail) handleOpenReferralDetail(selectedReferralDetail.booking?._id || refSettlementBooking._id)
    } catch (err) {
      alert(`Error updating settlement: ${err.message}`)
    } finally {
      setRefSettlementSubmitting(false)
    }
  }

  function handleExportReferralsCSV() {
    if (!referrals.length) {
      alert('No referral records available to export.')
      return
    }
    const headers = [
      'Booking ID',
      'Date & Time',
      'Doctor Name',
      'Doctor ID',
      'Doctor Code',
      'Patient Name',
      'Patient Mobile',
      'Prescribed Items',
      'Original MRP (₹)',
      'Doctor Discount (₹)',
      'Discount %',
      'Patient Bill (₹)',
      'Collected Paid (₹)',
      'Outstanding (₹)',
      'Refunds (₹)',
      'Lab Net Receipts (₹)',
      'Authorized Service Payment (₹)',
      'Lab Retained Net (₹)',
      'Booking Status',
      'Payment Status',
      'Settlement Status',
    ]

    const rows = referrals.map((r) => {
      const items = (r.items || []).map((i) => (i.itemType || 'test') + ': ' + (i.name || i.test?.name || i.package?.name || 'Item')).join('; ')
      const f = r.financials || {}
      const docName = r.doctor?.name || (r.doctorName && r.doctorName !== 'Direct / Walk-in' && r.doctorName !== 'Unassigned Doctor' ? r.doctorName : '')
      const doctorStr = docName ? `Dr. ${docName.replace(/^Dr\.?\s*/i, '')}` : 'Direct / Walk-in'
      const docId = r.doctor?._id || r.doctorId || ''
      const docCode = r.doctor?.referralCode || r.referralCode || ''
      const patientName = r.patient?.name || r.patientName || 'Unknown Patient'
      const patientMobile = r.patient?.mobile || r.phone || ''
      return [
        `"${r.bookingReference || r.reference || r._id}"`,
        `"${new Date(r.createdAt || r.date).toLocaleString()}"`,
        `"${doctorStr}"`,
        `"${docId}"`,
        `"${docCode}"`,
        `"${patientName}"`,
        `"${patientMobile}"`,
        `"${items.replace(/"/g, '""')}"`,
        ((f.originalMrpPaise || 0) / 100).toFixed(2),
        ((f.doctorDiscountPaise || 0) / 100).toFixed(2),
        (f.discountPercent || 0) + '%',
        ((f.patientPayablePaise || 0) / 100).toFixed(2),
        ((f.patientPaidPaise || 0) / 100).toFixed(2),
        ((f.patientOutstandingPaise || 0) / 100).toFixed(2),
        ((f.patientRefundedPaise || 0) / 100).toFixed(2),
        ((f.labNetReceiptsPaise || 0) / 100).toFixed(2),
        ((f.authorizedServicePaymentPaise || 0) / 100).toFixed(2),
        ((f.labNetRetainedPaise || 0) / 100).toFixed(2),
        `"${r.status || ''}"`,
        `"${r.paymentStatus || ''}"`,
        `"${r.settlementStatus || 'PENDING'}"`,
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `UniquePathology_Doctor_Referrals_Ledger_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  function handleExportStatementsCSV() {
    if (!doctorStatements.length) {
      alert('No statement data to export.')
      return
    }
    const headers = [
      'Doctor Name',
      'Doctor ID',
      'Specialization',
      'Clinic Name',
      'Mobile',
      'Tariff Discount %',
      'Patients Referred',
      'Total MRP (₹)',
      'Discounts Granted (₹)',
      'Patient Billing (₹)',
      'Collected Receipts (₹)',
      'Outstanding (₹)',
      'Refunds (₹)',
      'Lab Net Receipts (₹)',
      'Authorized Service Payments (₹)',
      'Unique Pathology Net Retained (₹)',
      'Settled Count',
      'Pending Count',
    ]

    const rows = doctorStatements.map((d) => {
      const doc = d.doctor || {}
      const f = d.financials || {}
      return [
        `"${doc.name || ''}"`,
        `"${doc._id || ''}"`,
        `"${doc.specialization || ''}"`,
        `"${doc.clinicName || ''}"`,
        `"${doc.mobile || ''}"`,
        (doc.discountPercent || 0) + '%',
        d.totalReferrals || 0,
        ((f.totalMrpPaise || 0) / 100).toFixed(2),
        ((f.totalDoctorDiscountPaise || 0) / 100).toFixed(2),
        ((f.totalPatientBillingPaise || 0) / 100).toFixed(2),
        ((f.totalCollectedPaise || 0) / 100).toFixed(2),
        ((f.totalOutstandingPaise || 0) / 100).toFixed(2),
        ((f.totalRefundsPaise || 0) / 100).toFixed(2),
        ((f.totalLabNetReceiptsPaise || 0) / 100).toFixed(2),
        ((f.totalAuthorizedServicePaymentsPaise || 0) / 100).toFixed(2),
        ((f.totalLabNetRetainedPaise || 0) / 100).toFixed(2),
        d.settlementCounts?.SETTLED || 0,
        d.settlementCounts?.PENDING || 0,
      ]
    })

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n')
    const encodedUri = encodeURI(csvContent)
    const link = document.createElement('a')
    link.setAttribute('href', encodedUri)
    link.setAttribute('download', `UniquePathology_Doctor_Statements_${new Date().toISOString().slice(0, 10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Admin Patient Booking Creation Modal State (Part 2 & 3)
  const initialAdminBookingForm = {
    patientName: '',
    phone: '',
    email: '',
    age: '',
    gender: 'prefer_not_to_say',
    collectionType: 'centre',
    address: '',
    landmark: '',
    city: 'Mandideep',
    pinCode: '462046',
    date: new Date().toISOString().slice(0, 10),
    timeSlot: '07:00 AM - 09:00 AM',
    doctorId: 'walkin', // 'walkin' | 'self' | doctor._id
    selectedTestIds: [],
    selectedPackageIds: [],
    paymentStatus: 'pending',
    paymentMethod: 'Cash',
    amountPaid: '',
    adminNotes: '',
  }

  const [adminBookingModalOpen, setAdminBookingModalOpen] = useState(false)
  const [adminBookingSubmitting, setAdminBookingSubmitting] = useState(false)
  const [adminBookingError, setAdminBookingError] = useState('')
  const [adminBookingSuccess, setAdminBookingSuccess] = useState('')
  const [adminBookingForm, setAdminBookingForm] = useState(initialAdminBookingForm)

  function handleOpenAdminBookingModal() {
    setAdminBookingForm({
      ...initialAdminBookingForm,
      date: new Date().toISOString().slice(0, 10),
    })
    setAdminBookingError('')
    setAdminBookingSuccess('')
    setAdminBookingModalOpen(true)
  }

  async function handleSubmitAdminBooking(e) {
    if (e) e.preventDefault()
    setAdminBookingError('')
    setAdminBookingSuccess('')

    if (!adminBookingForm.patientName || adminBookingForm.patientName.trim().length < 2) {
      setAdminBookingError('Patient name is required (minimum 2 characters).')
      return
    }

    if (!/^[6-9][0-9]{9}$/.test(adminBookingForm.phone.trim())) {
      setAdminBookingError('Please enter a valid 10-digit Indian mobile number.')
      return
    }

    if (adminBookingForm.selectedTestIds.length === 0 && adminBookingForm.selectedPackageIds.length === 0) {
      setAdminBookingError('Please select at least one pathology test or health package.')
      return
    }

    const items = [
      ...adminBookingForm.selectedTestIds.map((id) => {
        const t = tests.find((x) => x._id === id)
        return { itemType: 'test', id, name: t?.name }
      }),
      ...adminBookingForm.selectedPackageIds.map((id) => {
        const p = packages.find((x) => x._id === id)
        return { itemType: 'package', id, name: p?.name }
      }),
    ]

    const selectedDoc = doctors.find((d) => String(d._id) === String(adminBookingForm.doctorId))
    const docName = selectedDoc
      ? selectedDoc.name
      : adminBookingForm.doctorId === 'self'
      ? 'Self Referred'
      : 'Walk-In Patient'

    const payload = {
      patientName: adminBookingForm.patientName.trim(),
      phone: adminBookingForm.phone.trim(),
      email: adminBookingForm.email.trim() || undefined,
      age: adminBookingForm.age ? Number(adminBookingForm.age) : undefined,
      gender: adminBookingForm.gender,
      collectionType: adminBookingForm.collectionType,
      address: adminBookingForm.address.trim() || undefined,
      landmark: adminBookingForm.landmark.trim() || undefined,
      city: adminBookingForm.city.trim() || 'Mandideep',
      pinCode: adminBookingForm.pinCode.trim() || '462046',
      date: adminBookingForm.date,
      timeSlot: adminBookingForm.timeSlot,
      doctorId: adminBookingForm.doctorId,
      doctorName: docName,
      items,
      paymentStatus: adminBookingForm.paymentStatus,
      paymentMethod: adminBookingForm.paymentMethod,
      amountPaid: adminBookingForm.amountPaid ? Number(adminBookingForm.amountPaid) : undefined,
      adminNotes: adminBookingForm.adminNotes.trim() || undefined,
    }

    setAdminBookingSubmitting(true)
    try {
      const res = await apiRequest('/admin/bookings', {
        method: 'POST',
        body: JSON.stringify(payload),
        authType: 'admin',
      })
      setAdminBookingSuccess(`Booking ${res.booking?.reference || ''} created successfully and linked to ${docName}!`)
      await Promise.allSettled([
        loadAllDashboardData(),
        loadReferralsData(),
        loadDoctorStatementsData(),
      ])
      setTimeout(() => {
        setAdminBookingModalOpen(false)
        setAdminBookingSuccess('')
      }, 1500)
    } catch (err) {
      setAdminBookingError(err.message || 'Failed to create patient booking.')
    } finally {
      setAdminBookingSubmitting(false)
    }
  }

  function handleOpenPrintModal(type = 'referrals', payload = null) {
    setPrintReportType(type)
    setPrintReportPayload(payload)
    setRefPrintModalOpen(true)
  }

  function handleTriggerPrint() {
    const originalTitle = document.title
    let filename = 'Doctor_Ledger_Report'

    if (printReportType === 'doctor-statement') {
      const activeDoc = printReportPayload?.doctor || (statementDoctorFilter !== 'all' ? doctors.find(d => String(d._id) === String(statementDoctorFilter)) : null) || (doctors[0] || null)
      const rawName = activeDoc?.name || 'Dr_Chitra_Verma'
      const cleanName = rawName.startsWith('Dr') ? rawName : `Dr_${rawName}`
      const sanitizedDoc = cleanName.replace(/[^a-zA-Z0-9]/g, '_')
      const monthYear = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }).replace(/\s+/g, '_')
      filename = `Doctor_Ledger_${sanitizedDoc}_${monthYear}`
    } else {
      const monthYear = new Date().toLocaleString('en-US', { month: 'short', year: 'numeric' }).replace(/\s+/g, '_')
      filename = `Doctor_Ledger_Referrals_${monthYear}`
    }

    document.title = filename
    window.print()
    setTimeout(() => {
      document.title = originalTitle
    }, 1500)
  }

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
        apiRequest('/admin/download-logs'),
      ])

      const [mRes, bRes, tRes, pRes, rRes, payRes, enqRes, audRes, docRes, patRes, offRes, offAnRes, dlRes] = results

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
      if (dlRes.status === 'fulfilled') setDownloadLogs(dlRes.value?.downloadLogs || [])
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

  function handleOpenPaymentModal(booking) {
    setPaymentBooking(booking)
    setSelectedPaymentMethod('Cash')
    setPaymentNotes('')
    setPaymentModalOpen(true)
  }

  async function handleConfirmPayment(e) {
    if (e) e.preventDefault()
    if (!paymentBooking) return
    if (!selectedPaymentMethod) {
      alert('Please select a payment method before confirming payment.')
      return
    }

    setPaymentBusy(true)
    try {
      await apiRequest(`/admin/bookings/${paymentBooking._id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({
          paymentStatus: 'paid',
          paymentMethod: selectedPaymentMethod,
          notes: paymentNotes || 'Reconciled at admin desk',
        }),
      })
      setActionNotice(`Payment recorded (${selectedPaymentMethod}) for ${paymentBooking.reference}`)
      setPaymentModalOpen(false)
      setPaymentBooking(null)
      await loadAllDashboardData()
    } catch (err) {
      alert(`Error recording payment: ${err.message}`)
    } finally {
      setPaymentBusy(false)
    }
  }

  async function updateBookingPayment(id, paymentStatus, paymentMethod = 'Cash') {
    try {
      await apiRequest(`/admin/bookings/${id}/payment`, {
        method: 'PATCH',
        body: JSON.stringify({
          paymentStatus,
          paymentMethod,
          notes: 'Updated from admin console',
        }),
      })
      setActionNotice(`Payment status updated to ${paymentStatus}`)
      await loadAllDashboardData()
    } catch (err) {
      alert(`Error updating payment: ${err.message}`)
    }
  }

  async function handleSyncPayments() {
    setSyncBusy(true)
    try {
      const res = await apiRequest('/admin/payments/sync', { method: 'POST' })
      setActionNotice(`Payment sync complete: ${res.createdPayments} missing record(s) created, ${res.totalPaymentsCount} total payments.`)
      await loadAllDashboardData()
    } catch (err) {
      alert(`Sync error: ${err.message}`)
    } finally {
      setSyncBusy(false)
    }
  }

  function handleAdminViewReport(report) {
    const token = getAdminToken()
    const viewUrl = `${API_BASE}/admin/reports/${report._id}/view?token=${encodeURIComponent(token)}`
    window.open(viewUrl, '_blank')
  }

  function handleAdminDownloadReport(report) {
    const token = getAdminToken()
    const downloadUrl = `${API_BASE}/admin/reports/${report._id}/download?token=${encodeURIComponent(token)}`
    const a = document.createElement('a')
    a.href = downloadUrl
    a.download = `UniquePathology_${report.bookingReference}.pdf`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    setActionNotice(`Downloading report for ${report.bookingReference}`)
    setTimeout(() => loadAllDashboardData(), 1200)
  }

  function handleOpenReplaceModal(report) {
    setReplacingReport(report)
    setReplaceFile(null)
    setReplaceReportModalOpen(true)
  }

  async function handleReplaceReportSubmit(e) {
    e.preventDefault()
    if (!replaceFile || !replacingReport) {
      alert('Please select a replacement report file (PDF, JPG, PNG).')
      return
    }

    setReplaceBusy(true)
    try {
      const formData = new FormData()
      formData.append('reportFile', replaceFile)

      await apiRequest(`/admin/reports/${replacingReport._id}/replace`, {
        method: 'POST',
        body: formData,
      })

      setActionNotice(`Report replaced successfully for booking ${replacingReport.bookingReference}`)
      setReplaceReportModalOpen(false)
      setReplacingReport(null)
      setReplaceFile(null)
      await loadAllDashboardData()
    } catch (err) {
      alert(`Failed to replace report: ${err.message}`)
    } finally {
      setReplaceBusy(false)
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
              { id: 'doctorReferrals', label: 'Doctor Referrals & Accounts', icon: Receipt },
              { id: 'offers', label: `Offers & Campaigns (${offers.length})`, icon: Tag },
              { id: 'bookings', label: `Bookings (${bookings.length})`, icon: CalendarCheck },
              { id: 'patients', label: `Patients (${patients.length})`, icon: Users },
              { id: 'tests', label: `Tests (${tests.length})`, icon: Microscope },
              { id: 'packages', label: `Packages (${packages.length})`, icon: Package },
              { id: 'reports', label: `Reports (${reports.length})`, icon: FileText },
              { id: 'payments', label: `Payments (${payments.length})`, icon: CreditCard },
              { id: 'enquiries', label: `Enquiries (${enquiries.length})`, icon: Mail },
              
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
                <button
                  type="button"
                  onClick={handleOpenAdminBookingModal}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-[#073b66] px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800 transition shadow-xs"
                >
                  <Plus size={15} />
                  <span>Create Patient Booking</span>
                </button>
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
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <button
                              onClick={() => {
                                if (b.paymentStatus === 'paid') {
                                  if (window.confirm(`Mark payment as pending for booking ${b.reference}?`)) {
                                    updateBookingPayment(b._id, 'pending')
                                  }
                                } else {
                                  handleOpenPaymentModal(b)
                                }
                              }}
                              className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider transition ${
                                b.paymentStatus === 'paid'
                                  ? 'bg-emerald-100 text-emerald-800 hover:bg-emerald-200'
                                  : 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                              }`}
                              title={b.paymentStatus === 'paid' ? 'Click to change to pending' : 'Click to select payment method and mark as PAID'}
                            >
                              {b.paymentStatus}
                            </button>
                            {b.paymentStatus !== 'paid' && (
                              <button
                                onClick={() => handleOpenPaymentModal(b)}
                                className="rounded-lg bg-[#073b66] px-2 py-0.5 text-[10px] font-extrabold text-white hover:bg-[#052b4b] shadow-xs"
                                title="Select payment method and confirm"
                              >
                                + Pay
                              </button>
                            )}
                          </div>
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
                        <div className="flex items-center justify-end gap-1.5 flex-wrap">
                          <button
                            onClick={() => handleAdminViewReport(r)}
                            className="inline-flex items-center gap-1 rounded-lg bg-cyan-50 px-2.5 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-100 transition"
                            title="View Report PDF in new tab"
                          >
                            <Eye size={13} />
                            <span>View</span>
                          </button>
                          <button
                            onClick={() => handleAdminDownloadReport(r)}
                            className="inline-flex items-center gap-1 rounded-lg bg-emerald-50 px-2.5 py-1 text-[11px] font-bold text-emerald-800 hover:bg-emerald-100 transition"
                            title="Download Report File"
                          >
                            <Download size={13} />
                            <span>Download</span>
                          </button>
                          <button
                            onClick={() => handleOpenReplaceModal(r)}
                            className="inline-flex items-center gap-1 rounded-lg bg-amber-50 px-2.5 py-1 text-[11px] font-bold text-amber-800 hover:bg-amber-100 transition"
                            title="Replace existing file with updated PDF"
                          >
                            <RefreshCw size={13} />
                            <span>Replace</span>
                          </button>
                          <button
                            onClick={() => handleDeleteReport(r._id)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded"
                            title="Delete Report"
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
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
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#073b66]">Payment Reconciliation & Ledger</h2>
                <p className="text-xs text-slate-500">
                  Automated records for all paid bookings across Cash, UPI, Card, and Bank Transfer with full audit trail.
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  onClick={handleSyncPayments}
                  disabled={syncBusy}
                  className="inline-flex items-center gap-1.5 rounded-xl bg-cyan-50 border border-cyan-200 px-3.5 py-2 text-xs font-bold text-cyan-900 hover:bg-cyan-100 transition disabled:opacity-50"
                  title="Scan for paid bookings and generate missing payment records"
                >
                  <RefreshCw size={14} className={syncBusy ? 'animate-spin' : ''} />
                  <span>{syncBusy ? 'Syncing...' : 'Sync Missing Payments'}</span>
                </button>
                <span className="text-xs font-bold text-emerald-900 bg-emerald-50 border border-emerald-200 px-3 py-1 rounded-full">
                  Total Payments: {payments.length}
                </span>
              </div>
            </div>

            {/* Filter and Search Bar */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search size={16} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  type="text"
                  value={paymentSearch}
                  onChange={(e) => setPaymentSearch(e.target.value)}
                  placeholder="Search payments by Patient Name, Mobile, or Booking ID..."
                  className="w-full rounded-xl border border-slate-200 bg-slate-50/50 pl-10 pr-4 py-2 text-xs font-medium outline-none focus:border-cyan-500 focus:bg-white"
                />
              </div>

              <select
                value={paymentMethodFilter}
                onChange={(e) => setPaymentMethodFilter(e.target.value)}
                className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none"
              >
                <option value="all">All Payment Methods</option>
                <option value="Cash">Cash</option>
                <option value="UPI">UPI</option>
                <option value="Card">Card</option>
                <option value="Bank Transfer">Bank Transfer</option>
              </select>

              {paymentSearch && (
                <button
                  type="button"
                  onClick={() => setPaymentSearch('')}
                  className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-bold text-slate-500 hover:bg-slate-50"
                >
                  Clear
                </button>
              )}
            </div>

            {/* Reconciled Payments Table */}
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Patient Name</th>
                    <th className="py-3 px-3">Mobile Number</th>
                    <th className="py-3 px-3">Amount</th>
                    <th className="py-3 px-3">Payment Method</th>
                    <th className="py-3 px-3">Status</th>
                    <th className="py-3 px-3">Timestamp</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {payments
                    .filter((p) => {
                      const q = paymentSearch.trim().toLowerCase()
                      const matchSearch =
                        !q ||
                        p.bookingReference?.toLowerCase().includes(q) ||
                        p.patientName?.toLowerCase().includes(q) ||
                        p.mobileNumber?.includes(q) ||
                        p.testOrPackageName?.toLowerCase().includes(q)

                      const matchMethod =
                        paymentMethodFilter === 'all' ||
                        p.paymentMethod?.toLowerCase() === paymentMethodFilter.toLowerCase()

                      return matchSearch && matchMethod
                    })
                    .map((p) => (
                      <tr key={p._id} className="hover:bg-slate-50/60 transition">
                        <td className="py-3 px-3 font-mono font-bold text-[#073b66]">
                          {p.bookingReference || p.bookingId}
                        </td>
                        <td className="py-3 px-3 font-bold text-slate-900">
                          {p.patientName || '—'}
                          {p.testOrPackageName && (
                            <span className="block text-[10px] text-slate-400 font-normal truncate max-w-xs">
                              {p.testOrPackageName}
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-3 font-mono text-slate-600">
                          {p.mobileNumber || '—'}
                        </td>
                        <td className="py-3 px-3 font-black text-slate-900 text-sm">
                          ₹{p.finalAmount ?? (p.amountPaise ? (p.amountPaise / 100).toFixed(2) : '0')}
                        </td>
                        <td className="py-3 px-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              p.paymentMethod === 'Cash'
                                ? 'bg-amber-100 text-amber-900 border border-amber-200'
                                : p.paymentMethod === 'UPI'
                                ? 'bg-blue-100 text-blue-900 border border-blue-200'
                                : p.paymentMethod === 'Card'
                                ? 'bg-purple-100 text-purple-900 border border-purple-200'
                                : 'bg-slate-100 text-slate-800 border border-slate-200'
                            }`}
                          >
                            {p.paymentMethod || 'Cash'}
                          </span>
                        </td>
                        <td className="py-3 px-3">
                          <span className="rounded-full bg-emerald-100 px-2.5 py-0.5 text-[10px] font-black text-emerald-800 uppercase tracking-wider">
                            {p.status || 'paid'}
                          </span>
                        </td>
                        <td className="py-3 px-3 text-slate-500 font-mono text-[11px]">
                          {new Date(p.paymentDate || p.createdAt).toLocaleString('en-IN')}
                        </td>
                      </tr>
                    ))}
                  {payments.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-slate-400 font-medium">
                        No payment records found. Mark bookings as PAID or click "Sync Missing Payments".
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB: REPORT DOWNLOAD LOGS                                 */}
        {/* ========================================================= */}
        {/*
        {activeTab === 'downloadLogs' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs space-y-6 animate-in fade-in">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-black text-[#073b66]">Diagnostic Report Download Logs</h2>
                <p className="text-xs text-slate-500">
                  Comprehensive audit trail of diagnostic report downloads by Patients and Administrators.
                </p>
              </div>
              <span className="text-xs font-bold text-cyan-900 bg-cyan-50 border border-cyan-200 px-3 py-1 rounded-full w-fit">
                {downloadLogs.length} Download Events
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-400 font-extrabold uppercase tracking-wider">
                    <th className="py-3 px-3">Booking ID</th>
                    <th className="py-3 px-3">Patient Name</th>
                    <th className="py-3 px-3">Download Date</th>
                    <th className="py-3 px-3">Download Time</th>
                    <th className="py-3 px-3">Downloaded By</th>
                    <th className="py-3 px-3">User Type</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {downloadLogs.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-8 text-center text-slate-400 font-medium">
                        No report download events recorded yet.
                      </td>
                    </tr>
                  ) : (
                    downloadLogs.map((log) => (
                      <tr key={log._id} className="hover:bg-slate-50/60">
                        <td className="py-3 px-3 font-mono font-bold text-cyan-800">{log.bookingReference}</td>
                        <td className="py-3 px-3 font-bold text-slate-900">{log.patientName}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono">{log.downloadDate}</td>
                        <td className="py-3 px-3 text-slate-600 font-mono">{log.downloadTime}</td>
                        <td className="py-3 px-3 font-mono text-slate-700">{log.downloadedBy}</td>
                        <td className="py-3 px-3">
                          <span
                            className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider ${
                              log.userType === 'Admin' || log.userType === 'admin'
                                ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                : 'bg-cyan-100 text-cyan-800 border border-cyan-200'
                            }`}
                          >
                            {log.userType}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
        */}

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
        {/*
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
        */
      }
      
        {/* ========================================================= */}
        {/* TAB: DOCTOR REFERRALS & FINANCIAL LEDGER                   */}
        {/* ========================================================= */}
        {activeTab === 'doctorReferrals' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Top Header Card */}
            <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xs">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="p-2.5 rounded-2xl bg-gradient-to-br from-cyan-600 to-[#073b66] text-white shadow-md shadow-cyan-900/10">
                      <Receipt size={22} />
                    </span>
                    <div>
                      <h2 className="text-xl font-black text-[#073b66]">Doctor Referrals & Financial Accounts</h2>
                      <p className="text-xs text-slate-500">
                        Auditable financial ledger, doctor-specific tariff reconciliation, verified collections, and lawful clinical service accounting.
                      </p>
                    </div>
                  </div>
                </div>

                {/* Sub-view switcher & Action Buttons */}
                <div className="flex flex-wrap items-center gap-2">
                  <div className="inline-flex rounded-xl bg-slate-100 p-1 border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setReferralSubView('ledger')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        referralSubView === 'ledger'
                          ? 'bg-white text-[#073b66] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Referral Ledger
                    </button>
                    <button
                      type="button"
                      onClick={() => setReferralSubView('statements')}
                      className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition ${
                        referralSubView === 'statements'
                          ? 'bg-white text-[#073b66] shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Doctor Financial Statements
                    </button>
                  </div>

                  <button
                    type="button"
                    onClick={handleOpenAdminBookingModal}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-teal-800 px-3.5 py-2 text-xs font-bold text-white hover:bg-teal-700 transition shadow-xs"
                    title="Create New Patient Referral Booking"
                  >
                    <Plus size={15} />
                    <span>New Referral Booking</span>
                  </button>

                  {referralSubView === 'ledger' ? (
                    <>
                      <button
                        type="button"
                        onClick={handleExportReferralsCSV}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                        title="Export Referrals to CSV"
                      >
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPrintModal('referrals')}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                      >
                        <Printer size={15} />
                        <span>Print Ledger Report</span>
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        type="button"
                        onClick={handleExportStatementsCSV}
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition shadow-xs"
                        title="Export Statements to CSV"
                      >
                        <FileSpreadsheet size={15} className="text-emerald-600" />
                        <span>Export CSV</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleOpenPrintModal('doctor-statement', null)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-slate-900 px-3.5 py-2 text-xs font-bold text-white hover:bg-slate-800 transition shadow-xs"
                      >
                        <Printer size={15} />
                        <span>Print All Statements</span>
                      </button>
                    </>
                  )}

                  <button
                    type="button"
                    onClick={() => (referralSubView === 'ledger' ? loadReferralsData() : loadDoctorStatementsData())}
                    disabled={referralsLoading || statementsLoading}
                    className="p-2 text-slate-600 hover:text-cyan-700 rounded-xl hover:bg-slate-100 transition border border-slate-200 bg-white"
                    title="Refresh Ledger"
                  >
                    <RefreshCw size={15} className={referralsLoading || statementsLoading ? 'animate-spin' : ''} />
                  </button>
                </div>
              </div>

              {/* Legal & Regulatory Compliance Alert */}
              <div className="mt-4 rounded-2xl bg-amber-50/70 border border-amber-200/80 p-3.5 text-xs text-amber-900 flex items-start gap-3">
                <ShieldCheck size={18} className="text-amber-700 mt-0.5 shrink-0" />
                <div className="leading-relaxed">
                  <span className="font-bold">Medical Ethics & Statutory Compliance:</span> In compliance with National Medical Commission (NMC) regulations and Indian Medical Ethics, Unique Pathology strictly prohibits commission kickbacks or referral fees. All figures reflect verified patient billing concessions, actual payment collections, transparent refunds, and separately documented clinical service agreements.
                </div>
              </div>
            </div>

            {/* ================= SUB-VIEW 1: REFERRAL LEDGER ================= */}
            {referralSubView === 'ledger' && (
              <div className="space-y-6">
                {/* 9 Financial Ledger Metric Cards */}
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Referrals</span>
                    <p className="mt-1 text-2xl font-black text-[#073b66]">{referralsSummary.totalBookings ?? referralsSummary.totalReferralsCount ?? 0}</p>
                    <span className="text-[11px] text-slate-500">Bookings across doctors</span>
                  </div>

                  <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Original MRP</span>
                    <p className="mt-1 text-xl font-black text-slate-700">{formatInr(referralsSummary.totalMrpPaise ?? referralsSummary.totalOriginalMrpPaise ?? 0)}</p>
                    <span className="text-[11px] text-slate-500">Standard catalogue tariff</span>
                  </div>

                  <div className="rounded-2xl border border-amber-200 bg-amber-50/40 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Doctor Concessions</span>
                    <p className="mt-1 text-xl font-black text-amber-900">-{formatInr(referralsSummary.totalDoctorDiscountPaise ?? 0)}</p>
                    <span className="text-[11px] text-amber-700">Patient discount granted</span>
                  </div>

                  <div className="rounded-2xl border border-blue-200 bg-blue-50/40 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-blue-700">Patient Invoiced</span>
                    <p className="mt-1 text-xl font-black text-blue-900">{formatInr(referralsSummary.totalPayablePaise ?? referralsSummary.totalPatientPayablePaise ?? 0)}</p>
                    <span className="text-[11px] text-blue-700">Net payable after discount</span>
                  </div>

                  <div className="rounded-2xl border border-emerald-200 bg-emerald-50/40 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Collected Receipts</span>
                    <p className="mt-1 text-xl font-black text-emerald-900">{formatInr(referralsSummary.totalPaidPaise ?? referralsSummary.totalPatientPaidPaise ?? 0)}</p>
                    <span className="text-[11px] text-emerald-700">Verified cash/digital received</span>
                  </div>

                  <div className="rounded-2xl border border-rose-200 bg-rose-50/40 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Patient Outstanding</span>
                    <p className="mt-1 text-xl font-black text-rose-900">{formatInr(referralsSummary.totalOutstandingPaise ?? 0)}</p>
                    <span className="text-[11px] text-rose-700">Due from patients</span>
                  </div>

                  <div className="rounded-2xl border border-orange-200 bg-orange-50/40 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-orange-700">Refunds Recorded</span>
                    <p className="mt-1 text-xl font-black text-orange-900">{formatInr(referralsSummary.totalRefundedPaise ?? referralsSummary.totalRefundPaise ?? 0)}</p>
                    <span className="text-[11px] text-orange-700">Audit-recorded adjustments</span>
                  </div>

                  <div className="rounded-2xl border border-purple-200 bg-purple-50/40 p-4 shadow-xs">
                    <span className="text-[10px] font-black uppercase tracking-wider text-purple-700">Clinical Service Costs</span>
                    <p className="mt-1 text-xl font-black text-purple-900">{formatInr(referralsSummary.totalAuthorizedServicePaymentPaise ?? referralsSummary.totalAuthorizedServicePaise ?? 0)}</p>
                    <span className="text-[11px] text-purple-700">Legally documented tasks</span>
                  </div>

                  <div className="col-span-2 rounded-2xl border-2 border-teal-500 bg-gradient-to-br from-teal-900 to-[#073b66] p-4 text-white shadow-md">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">Laboratory Net Retained Revenue</span>
                      <span className="px-2 py-0.5 rounded-full bg-teal-400/20 text-[10px] font-bold text-teal-200">Audited Retained</span>
                    </div>
                    <p className="mt-1 text-2xl font-black text-white">{formatInr(referralsSummary.totalLabNetRetainedPaise ?? referralsSummary.totalNetRetainedPaise ?? 0)}</p>
                    <span className="text-[11px] text-teal-200/90">(Collected Receipts) − (Refunds) − (Lawful Clinical Service Costs)</span>
                  </div>
                </div>

                {/* Filters & Search Toolbar */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3">
                    {/* Doctor Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Referring Doctor</label>
                      <select
                        value={refDoctorFilter}
                        onChange={(e) => {
                          setRefDoctorFilter(e.target.value)
                          setRefPage(1)
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="all">All Referring Doctors</option>
                        {doctors.map((d) => (
                          <option key={d._id} value={d._id}>
                            Dr. {d.name} {d.referralCode ? `(${d.referralCode})` : ''}
                          </option>
                        ))}
                      </select>
                    </div>

                    {/* Patient/Doctor Search */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Patient Name or Mobile</label>
                      <div className="relative">
                        <input
                          type="text"
                          value={refSearch}
                          onChange={(e) => {
                            setRefSearch(e.target.value)
                            setRefPage(1)
                          }}
                          placeholder="Search patient..."
                          className="w-full rounded-xl border border-slate-200 bg-white pl-8 pr-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        />
                        <Search size={14} className="absolute left-2.5 top-2.5 text-slate-400" />
                      </div>
                    </div>

                    {/* Booking ID Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Booking Reference ID</label>
                      <input
                        type="text"
                        value={refBookingId}
                        onChange={(e) => {
                          setRefBookingId(e.target.value)
                          setRefPage(1)
                        }}
                        placeholder="e.g. UP-BK-..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Start Date */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">From Date</label>
                      <input
                        type="date"
                        value={refStartDate}
                        onChange={(e) => {
                          setRefStartDate(e.target.value)
                          setRefPage(1)
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    {/* End Date */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">To Date</label>
                      <input
                        type="date"
                        value={refEndDate}
                        onChange={(e) => {
                          setRefEndDate(e.target.value)
                          setRefPage(1)
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Test/Package Name */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Test / Package Name</label>
                      <input
                        type="text"
                        value={refTestOrPackage}
                        onChange={(e) => {
                          setRefTestOrPackage(e.target.value)
                          setRefPage(1)
                        }}
                        placeholder="Filter by test name..."
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    {/* Booking Status Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Booking Status</label>
                      <select
                        value={refStatusFilter}
                        onChange={(e) => {
                          setRefStatusFilter(e.target.value)
                          setRefPage(1)
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="all">All Booking Statuses</option>
                        <option value="CONFIRMED">CONFIRMED</option>
                        <option value="SAMPLE_COLLECTED">SAMPLE_COLLECTED</option>
                        <option value="REPORT_UPLOADED">REPORT_UPLOADED</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="CANCELLED">CANCELLED</option>
                      </select>
                    </div>

                    {/* Payment Status Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Payment Status</label>
                      <select
                        value={refPaymentFilter}
                        onChange={(e) => {
                          setRefPaymentFilter(e.target.value)
                          setRefPage(1)
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="all">All Payment Statuses</option>
                        <option value="PENDING">PENDING</option>
                        <option value="COMPLETED">COMPLETED</option>
                        <option value="REFUNDED">REFUNDED</option>
                      </select>
                    </div>

                    {/* Settlement Status Filter */}
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Settlement Status</label>
                      <select
                        value={refSettlementFilter}
                        onChange={(e) => {
                          setRefSettlementFilter(e.target.value)
                          setRefPage(1)
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="all">All Settlement Statuses</option>
                        <option value="PENDING">PENDING</option>
                        <option value="SETTLED">SETTLED</option>
                        <option value="DISPUTED">DISPUTED</option>
                      </select>
                    </div>

                    {/* Reset Filters */}
                    <div className="flex items-end">
                      <button
                        type="button"
                        onClick={() => {
                          setRefDoctorFilter('all')
                          setRefSearch('')
                          setRefBookingId('')
                          setRefStartDate('')
                          setRefEndDate('')
                          setRefTestOrPackage('')
                          setRefStatusFilter('all')
                          setRefPaymentFilter('all')
                          setRefSettlementFilter('all')
                          setRefPage(1)
                        }}
                        className="w-full rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 hover:text-slate-900 transition flex items-center justify-center gap-1.5"
                      >
                        <RotateCcw size={13} />
                        <span>Reset Filters</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Referrals & Ledger Table */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3.5">Booking / Date</th>
                          <th className="py-3 px-3.5">Referring Doctor</th>
                          <th className="py-3 px-3.5">Patient Details</th>
                          <th className="py-3 px-3.5">Tests / Packages</th>
                          <th className="py-3 px-3.5 text-right">Original MRP</th>
                          <th className="py-3 px-3.5 text-right">Doctor Discount</th>
                          <th className="py-3 px-3.5 text-right">Patient Payable</th>
                          <th className="py-3 px-3.5 text-right">Collected Paid</th>
                          <th className="py-3 px-3.5 text-right">Due / Outstanding</th>
                          <th className="py-3 px-3.5 text-right">Lab Net Retained</th>
                          <th className="py-3 px-3.5 text-center">Statuses</th>
                          <th className="py-3 px-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {referralsLoading ? (
                          <tr>
                            <td colSpan={12} className="py-12 text-center text-slate-500">
                              <RefreshCw size={24} className="mx-auto animate-spin text-cyan-600 mb-2" />
                              <p className="font-bold">Loading referral ledger records...</p>
                            </td>
                          </tr>
                        ) : referrals.length === 0 ? (
                          <tr>
                            <td colSpan={12} className="py-12 text-center text-slate-400">
                              <Receipt size={32} className="mx-auto text-slate-300 mb-2" />
                              <p className="font-bold text-slate-600">No referral bookings found matching your filters.</p>
                              <p className="text-[11px] text-slate-400 mt-1">Try adjusting the doctor, date range, or search criteria.</p>
                            </td>
                          </tr>
                        ) : (
                          referrals.map((r) => {
                            const f = r.financials || {}
                            return (
                              <tr key={r._id} className="hover:bg-slate-50/80 transition group">
                                {/* Booking & Date */}
                                <td className="py-3 px-3.5 whitespace-nowrap">
                                  <div className="font-mono font-bold text-[#073b66]">{r.bookingReference || r.reference || r._id.slice(-6)}</div>
                                  <div className="text-[10px] text-slate-400">{new Date(r.createdAt || r.date).toLocaleString()}</div>
                                </td>

                                {/* Referring Doctor */}
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-slate-800">
                                    {r.doctor?.name || (r.doctorName && r.doctorName !== 'Direct / Walk-in' && r.doctorName !== 'Unassigned Doctor') ? (
                                      `Dr. ${(r.doctor?.name || r.doctorName).replace(/^Dr\.?\s*/i, '')}`
                                    ) : (
                                      <span className="text-slate-400">Direct / Walk-in</span>
                                    )}
                                  </div>
                                  {(r.doctor?.name || (r.doctorName && r.doctorName !== 'Direct / Walk-in' && r.doctorName !== 'Unassigned Doctor')) && (
                                    <div className="text-[10px] text-slate-500 flex items-center gap-1">
                                      <span>Code: {r.doctor?.referralCode || r.referralCode || '—'}</span>
                                      <span>•</span>
                                      <span>Disc: {r.doctor?.discountPercent ?? r.doctorDiscountPercent ?? 0}%</span>
                                      {(r.doctor?._id || r.doctorId) && (
                                        <>
                                          <span>•</span>
                                          <span className="font-mono text-[9px] text-slate-400">ID: {String(r.doctor?._id || r.doctorId).slice(-6)}</span>
                                        </>
                                      )}
                                    </div>
                                  )}
                                </td>

                                {/* Patient Details */}
                                <td className="py-3 px-3.5">
                                  <div className="font-bold text-slate-900">{r.patient?.name || r.patientName || 'Unknown Patient'}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {r.patient?.mobile || r.phone || '—'}
                                    {(r.patient?.gender || r.gender) ? ` • ${r.patient?.gender || r.gender}` : ''}
                                    {(r.patient?.age || r.age) ? ` (${r.patient?.age || r.age}y)` : ''}
                                  </div>
                                </td>

                                {/* Tests & Packages */}
                                <td className="py-3 px-3.5 max-w-xs">
                                  <div className="flex flex-wrap gap-1">
                                    {(r.items || []).map((item, idx) => (
                                      <span
                                        key={idx}
                                        className="inline-block rounded-md bg-slate-100 text-slate-700 px-1.5 py-0.5 text-[10px] font-semibold border border-slate-200"
                                      >
                                        {item.name || item.test?.name || item.package?.name || 'Item'}
                                      </span>
                                    ))}
                                    {(!r.items || r.items.length === 0) && (
                                      <span className="text-[11px] text-slate-400">—</span>
                                    )}
                                  </div>
                                </td>

                                {/* Original MRP */}
                                <td className="py-3 px-3.5 text-right font-medium text-slate-600 whitespace-nowrap">
                                  {formatInr(f.originalMrpPaise)}
                                </td>

                                {/* Doctor Discount */}
                                <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                  <div className="font-bold text-amber-700">
                                    -{formatInr(f.doctorDiscountPaise)}
                                  </div>
                                  <div className="text-[10px] text-amber-600 font-semibold">
                                    ({f.discountPercent || 0}%)
                                  </div>
                                </td>

                                {/* Final Patient Payable */}
                                <td className="py-3 px-3.5 text-right font-bold text-blue-900 whitespace-nowrap">
                                  {formatInr(f.patientPayablePaise)}
                                </td>

                                {/* Collected Paid */}
                                <td className="py-3 px-3.5 text-right font-black text-emerald-700 whitespace-nowrap">
                                  {formatInr(f.patientPaidPaise)}
                                </td>

                                {/* Outstanding */}
                                <td className="py-3 px-3.5 text-right whitespace-nowrap">
                                  {f.patientOutstandingPaise > 0 ? (
                                    <span className="font-bold text-rose-700">{formatInr(f.patientOutstandingPaise)}</span>
                                  ) : (
                                    <span className="text-emerald-600 font-semibold">₹0.00</span>
                                  )}
                                </td>

                                {/* Lab Net Retained */}
                                <td className="py-3 px-3.5 text-right whitespace-nowrap font-black text-teal-800 bg-teal-50/50">
                                  {formatInr(f.labNetRetainedPaise)}
                                  {f.patientRefundedPaise > 0 && (
                                    <div className="text-[9px] text-orange-600 font-normal">
                                      Refund: -{formatInr(f.patientRefundedPaise)}
                                    </div>
                                  )}
                                  {f.authorizedServicePaymentPaise > 0 && (
                                    <div className="text-[9px] text-purple-600 font-normal">
                                      Clin Svc: -{formatInr(f.authorizedServicePaymentPaise)}
                                    </div>
                                  )}
                                </td>

                                {/* Statuses */}
                                <td className="py-3 px-3.5 whitespace-nowrap text-center">
                                  <div className="flex flex-col gap-1 items-center">
                                    {/* Booking Status Badge */}
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] font-black uppercase tracking-wider border ${
                                        r.status === 'COMPLETED'
                                          ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                          : r.status === 'CANCELLED'
                                          ? 'bg-red-50 text-red-700 border-red-200'
                                          : 'bg-blue-50 text-blue-700 border-blue-200'
                                      }`}
                                    >
                                      {r.status}
                                    </span>

                                    {/* Payment Status Badge */}
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                        r.paymentStatus === 'COMPLETED'
                                          ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                                          : r.paymentStatus === 'REFUNDED'
                                          ? 'bg-orange-100 text-orange-800 border-orange-300'
                                          : 'bg-amber-100 text-amber-800 border-amber-300'
                                      }`}
                                    >
                                      {r.paymentStatus}
                                    </span>

                                    {/* Settlement Status */}
                                    <span
                                      className={`rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider border ${
                                        r.settlementStatus === 'SETTLED'
                                          ? 'bg-teal-50 text-teal-700 border-teal-200'
                                          : r.settlementStatus === 'DISPUTED'
                                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                                          : 'bg-slate-100 text-slate-600 border-slate-200'
                                      }`}
                                    >
                                      {r.settlementStatus || 'PENDING'}
                                    </span>
                                  </div>
                                </td>

                                {/* Action Buttons */}
                                <td className="py-3 px-3.5 whitespace-nowrap text-center">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => handleOpenReferralDetail(r._id)}
                                      className="p-1.5 rounded-lg border border-slate-200 text-slate-600 hover:text-cyan-700 hover:bg-slate-100 transition shadow-xs"
                                      title="View Detailed Ledger & Audit Trail"
                                    >
                                      <Eye size={13} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenRefPaymentModal(r)}
                                      className="p-1.5 rounded-lg border border-emerald-200 text-emerald-700 hover:bg-emerald-50 transition shadow-xs"
                                      title="Record Verified Patient Payment"
                                    >
                                      <DollarSign size={13} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenRefRefundModal(r)}
                                      className="p-1.5 rounded-lg border border-orange-200 text-orange-700 hover:bg-orange-50 transition shadow-xs"
                                      title="Record Refund with Audit Justification"
                                    >
                                      <RotateCcw size={13} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenRefServiceModal(r)}
                                      className="p-1.5 rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 transition shadow-xs"
                                      title="Record Authorized Clinical Service Work"
                                    >
                                      <Stethoscope size={13} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenRefSettlementModal(r)}
                                      className="p-1.5 rounded-lg border border-teal-200 text-teal-700 hover:bg-teal-50 transition shadow-xs"
                                      title="Update Settlement Status"
                                    >
                                      <CheckCircle2 size={13} />
                                    </button>

                                    <button
                                      type="button"
                                      onClick={() => handleOpenPrintModal('referrals', r)}
                                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs"
                                      title="Print Patient Statement"
                                    >
                                      <Printer size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>

                  {/* Pagination Bar */}
                  <div className="flex flex-col sm:flex-row items-center justify-between border-t border-slate-200 bg-slate-50 px-4 py-3 gap-3">
                    <div className="text-xs text-slate-500">
                      Showing{' '}
                      <span className="font-bold text-slate-800">
                        {referrals.length > 0 ? (referralsPagination.page - 1) * referralsPagination.limit + 1 : 0}
                      </span>{' '}
                      to{' '}
                      <span className="font-bold text-slate-800">
                        {Math.min(referralsPagination.page * referralsPagination.limit, referralsPagination.total)}
                      </span>{' '}
                      of <span className="font-bold text-slate-800">{referralsPagination.total}</span> referral bookings
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setRefPage(Math.max(1, refPage - 1))}
                        disabled={refPage <= 1 || referralsLoading}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition shadow-xs"
                      >
                        Previous
                      </button>
                      <span className="text-xs font-bold text-slate-600 px-2">
                        Page {referralsPagination.page} of {referralsPagination.pages || 1}
                      </span>
                      <button
                        type="button"
                        onClick={() => setRefPage(Math.min(referralsPagination.pages, refPage + 1))}
                        disabled={refPage >= referralsPagination.pages || referralsLoading}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-100 disabled:opacity-40 transition shadow-xs"
                      >
                        Next
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ================= SUB-VIEW 2: DOCTOR STATEMENTS ================= */}
            {referralSubView === 'statements' && (
              <div className="space-y-6">
                {/* Statement Date Range and Doctor Filter Bar */}
                <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 items-end">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Select Doctor</label>
                      <select
                        value={statementDoctorFilter}
                        onChange={(e) => setStatementDoctorFilter(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      >
                        <option value="">All Doctors (Consolidated)</option>
                        {doctors.map((d) => (
                          <option key={d._id} value={d._id}>
                            Dr. {d.name} ({d.referralCode || 'No Code'})
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Statement From Date</label>
                      <input
                        type="date"
                        value={statementStartDate}
                        onChange={(e) => setStatementStartDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 mb-1">Statement To Date</label>
                      <input
                        type="date"
                        value={statementEndDate}
                        onChange={(e) => setStatementEndDate(e.target.value)}
                        className="w-full rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-cyan-500"
                      />
                    </div>

                    <div>
                      <button
                        type="button"
                        onClick={loadDoctorStatementsData}
                        disabled={statementsLoading}
                        className="w-full rounded-xl bg-cyan-700 px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800 transition flex items-center justify-center gap-1.5 shadow-sm"
                      >
                        <RefreshCw size={14} className={statementsLoading ? 'animate-spin' : ''} />
                        <span>Filter Statements</span>
                      </button>
                    </div>
                  </div>
                </div>

                {/* Overall Summary Cards (if statementsSummary available) */}
                {statementsSummary && (
                  <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total Doctors</span>
                      <p className="mt-1 text-xl font-black text-[#073b66]">{statementsSummary.totalDoctors || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Patients Referred</span>
                      <p className="mt-1 text-xl font-black text-slate-700">{statementsSummary.totalReferrals || 0}</p>
                    </div>
                    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Total MRP</span>
                      <p className="mt-1 text-base font-black text-slate-700">{formatInr(statementsSummary.totalMrpPaise)}</p>
                    </div>
                    <div className="rounded-2xl border border-amber-200 bg-amber-50/50 p-3.5 shadow-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-amber-700">Discounts</span>
                      <p className="mt-1 text-base font-black text-amber-900">-{formatInr(statementsSummary.totalDoctorDiscountPaise)}</p>
                    </div>
                    <div className="rounded-2xl border border-emerald-200 bg-emerald-50/50 p-3.5 shadow-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700">Collected Receipts</span>
                      <p className="mt-1 text-base font-black text-emerald-900">{formatInr(statementsSummary.totalCollectedPaise)}</p>
                    </div>
                    <div className="rounded-2xl border border-rose-200 bg-rose-50/50 p-3.5 shadow-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-rose-700">Outstanding</span>
                      <p className="mt-1 text-base font-black text-rose-900">{formatInr(statementsSummary.totalOutstandingPaise)}</p>
                    </div>
                    <div className="rounded-2xl border-2 border-teal-500 bg-teal-900 text-white p-3.5 shadow-xs">
                      <span className="text-[10px] font-black uppercase tracking-wider text-teal-300">Net Retained</span>
                      <p className="mt-1 text-base font-black text-white">{formatInr(statementsSummary.totalLabNetRetainedPaise)}</p>
                    </div>
                  </div>
                )}

                {/* Statements Table */}
                <div className="rounded-3xl border border-slate-200 bg-white shadow-xs overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-600 font-extrabold uppercase tracking-wider text-[11px]">
                          <th className="py-3 px-3.5">Doctor & Practice</th>
                          <th className="py-3 px-3.5 text-center">Tariff Discount</th>
                          <th className="py-3 px-3.5 text-center">Referred Patients</th>
                          <th className="py-3 px-3.5 text-right">Total MRP</th>
                          <th className="py-3 px-3.5 text-right">Discounts Granted</th>
                          <th className="py-3 px-3.5 text-right">Patient Billing</th>
                          <th className="py-3 px-3.5 text-right">Collected Paid</th>
                          <th className="py-3 px-3.5 text-right">Outstanding</th>
                          <th className="py-3 px-3.5 text-right">Refunds</th>
                          <th className="py-3 px-3.5 text-right">Clinical Services</th>
                          <th className="py-3 px-3.5 text-right">Lab Net Retained</th>
                          <th className="py-3 px-3.5 text-center">Settlements</th>
                          <th className="py-3 px-3.5 text-center">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {statementsLoading ? (
                          <tr>
                            <td colSpan={13} className="py-12 text-center text-slate-500">
                              <RefreshCw size={24} className="mx-auto animate-spin text-cyan-600 mb-2" />
                              <p className="font-bold">Generating doctor financial statements...</p>
                            </td>
                          </tr>
                        ) : doctorStatements.length === 0 ? (
                          <tr>
                            <td colSpan={13} className="py-12 text-center text-slate-400">
                              <Stethoscope size={32} className="mx-auto text-slate-300 mb-2" />
                              <p className="font-bold text-slate-600">No doctor referral records found for the selected period.</p>
                            </td>
                          </tr>
                        ) : (
                          doctorStatements.map((d) => {
                            const doc = d.doctor || {}
                            const f = d.financials || {}
                            return (
                              <tr key={doc._id} className="hover:bg-slate-50/80 transition">
                                <td className="py-3 px-3.5">
                                  <div className="font-black text-[#073b66]">Dr. {doc.name}</div>
                                  <div className="text-[10px] text-slate-500">
                                    {doc.specialization} • {doc.qualification || 'MBBS'}
                                  </div>
                                  <div className="text-[10px] text-slate-400">
                                    {doc.clinicName} {doc.mobile ? `(${doc.mobile})` : ''}
                                  </div>
                                </td>

                                <td className="py-3 px-3.5 text-center">
                                  <span className="inline-block rounded-md bg-amber-50 text-amber-700 px-2 py-0.5 text-xs font-bold border border-amber-200">
                                    {doc.discountPercent || 0}%
                                  </span>
                                </td>

                                <td className="py-3 px-3.5 text-center font-bold text-slate-800">
                                  {d.totalReferrals || 0}
                                </td>

                                <td className="py-3 px-3.5 text-right font-medium text-slate-600">
                                  {formatInr(f.totalMrpPaise)}
                                </td>

                                <td className="py-3 px-3.5 text-right font-bold text-amber-700">
                                  -{formatInr(f.totalDoctorDiscountPaise)}
                                </td>

                                <td className="py-3 px-3.5 text-right font-bold text-blue-900">
                                  {formatInr(f.totalPatientBillingPaise)}
                                </td>

                                <td className="py-3 px-3.5 text-right font-black text-emerald-700">
                                  {formatInr(f.totalCollectedPaise)}
                                </td>

                                <td className="py-3 px-3.5 text-right font-bold text-rose-700">
                                  {formatInr(f.totalOutstandingPaise)}
                                </td>

                                <td className="py-3 px-3.5 text-right text-orange-700">
                                  {formatInr(f.totalRefundsPaise)}
                                </td>

                                <td className="py-3 px-3.5 text-right text-purple-700 font-medium">
                                  {formatInr(f.totalAuthorizedServicePaymentsPaise)}
                                </td>

                                <td className="py-3 px-3.5 text-right font-black text-teal-800 bg-teal-50/50">
                                  {formatInr(f.totalLabNetRetainedPaise)}
                                </td>

                                <td className="py-3 px-3.5 text-center">
                                  <div className="flex items-center justify-center gap-1.5 text-[10px]">
                                    <span className="rounded bg-teal-100 text-teal-800 px-1.5 py-0.5 font-bold" title="Settled Bookings">
                                      {d.settlementCounts?.SETTLED || 0} S
                                    </span>
                                    <span className="rounded bg-amber-100 text-amber-800 px-1.5 py-0.5 font-bold" title="Pending Bookings">
                                      {d.settlementCounts?.PENDING || 0} P
                                    </span>
                                  </div>
                                </td>

                                <td className="py-3 px-3.5 text-center whitespace-nowrap">
                                  <div className="flex items-center justify-center gap-1">
                                    <button
                                      type="button"
                                      onClick={() => setSelectedStatementDrilldown(d)}
                                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:text-cyan-700 hover:bg-slate-100 transition shadow-xs"
                                      title="View Detailed Statement Drilldown"
                                    >
                                      <Eye size={13} />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => handleOpenPrintModal('doctor-statement', d)}
                                      className="p-1.5 rounded-lg border border-slate-200 text-slate-700 hover:bg-slate-100 transition shadow-xs"
                                      title="Print Doctor Statement"
                                    >
                                      <Printer size={13} />
                                    </button>
                                  </div>
                                </td>
                              </tr>
                            )
                          })
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>

                {/* Doctor Statement Drilldown Card (if selected) */}
                {selectedStatementDrilldown && (
                  <div className="rounded-3xl border border-cyan-200 bg-cyan-50/20 p-6 shadow-sm space-y-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[10px] font-black uppercase tracking-wider text-cyan-800">Doctor Statement Drilldown</span>
                        <h3 className="text-lg font-black text-[#073b66]">
                          Dr. {selectedStatementDrilldown.doctor?.name} ({selectedStatementDrilldown.doctor?.referralCode || 'No Code'})
                        </h3>
                        <p className="text-xs text-slate-500">
                          {selectedStatementDrilldown.doctor?.specialization} • {selectedStatementDrilldown.doctor?.clinicName}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPrintModal('doctor-statement', selectedStatementDrilldown)}
                          className="rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-bold text-white hover:bg-slate-800 transition flex items-center gap-1"
                        >
                          <Printer size={14} />
                          <span>Print Statement</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setSelectedStatementDrilldown(null)}
                          className="p-1.5 rounded-xl border border-slate-200 bg-white text-slate-600 hover:bg-slate-100"
                        >
                          <X size={16} />
                        </button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div className="rounded-xl bg-white p-3 border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Referred</span>
                        <span className="text-base font-black text-slate-800">{selectedStatementDrilldown.totalReferrals} Patients</span>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Total Concessions</span>
                        <span className="text-base font-black text-amber-700">
                          -{formatInr(selectedStatementDrilldown.financials?.totalDoctorDiscountPaise)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Collected Receipts</span>
                        <span className="text-base font-black text-emerald-700">
                          {formatInr(selectedStatementDrilldown.financials?.totalCollectedPaise)}
                        </span>
                      </div>
                      <div className="rounded-xl bg-white p-3 border border-slate-200">
                        <span className="text-slate-400 block text-[10px] uppercase font-bold">Lab Net Retained</span>
                        <span className="text-base font-black text-teal-800">
                          {formatInr(selectedStatementDrilldown.financials?.totalLabNetRetainedPaise)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
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

      {/* MODAL: PAYMENT METHOD SELECTION */}
      {paymentModalOpen && paymentBooking && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setPaymentModalOpen(false)}
        >
          <div className="modal-panel p-6 sm:p-8 space-y-5 max-w-md animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#073b66]">Select Payment Method</h3>
                <p className="text-xs text-slate-500">
                  Confirm receipt of payment for booking{' '}
                  <span className="font-mono font-bold text-cyan-800">{paymentBooking.reference}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setPaymentModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            {/* Booking Details Card */}
            <div className="rounded-2xl bg-cyan-50/70 p-4 border border-cyan-200/80 space-y-2 text-xs">
              <div className="flex justify-between py-1 border-b border-cyan-200/40">
                <span className="text-slate-600 font-medium">Patient:</span>
                <span className="font-bold text-slate-900">
                  {paymentBooking.patientName} ({paymentBooking.phone})
                </span>
              </div>
              <div className="flex justify-between py-1 border-b border-cyan-200/40">
                <span className="text-slate-600 font-medium">Tests / Packages:</span>
                <span className="font-bold text-slate-800 text-right max-w-[200px] truncate">
                  {paymentBooking.items?.map((i) => i.name).join(', ') || 'Diagnostic Tests'}
                </span>
              </div>
              <div className="flex justify-between py-1 items-center pt-2">
                <span className="text-slate-700 font-black uppercase tracking-wider text-[11px]">
                  Total Amount Due:
                </span>
                <span className="text-xl font-black text-[#073b66]">
                  ₹{(paymentBooking.totalAmountPaise || 0) / 100}
                </span>
              </div>
            </div>

            {/* Payment Method Radio Options */}
            <form onSubmit={handleConfirmPayment} className="space-y-4">
              <div className="space-y-2">
                <label className="field-label">
                  Select Payment Method <span className="text-red-500">*</span>
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {['Cash', 'UPI', 'Card', 'Bank Transfer'].map((method) => (
                    <label
                      key={method}
                      className={`flex items-center gap-2.5 rounded-xl border p-3 cursor-pointer transition ${
                        selectedPaymentMethod === method
                          ? 'border-cyan-600 bg-cyan-50/60 shadow-xs ring-1 ring-cyan-500'
                          : 'border-slate-200 hover:bg-slate-50'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={method}
                        checked={selectedPaymentMethod === method}
                        onChange={() => setSelectedPaymentMethod(method)}
                        className="text-cyan-600 focus:ring-cyan-500"
                      />
                      <span className="text-xs font-bold text-slate-800">{method}</span>
                    </label>
                  ))}
                </div>
              </div>

              <div>
                <label className="field-label">Reference / Transaction Notes (Optional)</label>
                <input
                  type="text"
                  value={paymentNotes}
                  onChange={(e) => setPaymentNotes(e.target.value)}
                  placeholder="e.g. UPI Ref / Cash receipt / Desk note"
                  className="field text-xs"
                />
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setPaymentModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={paymentBusy || !selectedPaymentMethod}
                  className="rounded-xl bg-[#073b66] px-5 py-2.5 text-xs font-bold text-white hover:bg-[#062d4e] shadow-md transition disabled:opacity-50"
                >
                  {paymentBusy ? 'Recording...' : `Confirm & Mark as PAID (${selectedPaymentMethod})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REPLACE REPORT */}
      {replaceReportModalOpen && replacingReport && (
        <div
          className="modal-backdrop"
          onClick={(e) => e.target === e.currentTarget && setReplaceReportModalOpen(false)}
        >
          <div className="modal-panel p-6 sm:p-8 space-y-5 max-w-lg animate-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#073b66]">Replace Diagnostic Report</h3>
                <p className="text-xs text-slate-500">
                  Update file for booking{' '}
                  <span className="font-mono font-bold text-cyan-800">{replacingReport.bookingReference}</span>
                </p>
              </div>
              <button
                type="button"
                onClick={() => setReplaceReportModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              >
                <X size={20} />
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-700 border border-slate-200 space-y-1">
              <div><strong>Patient:</strong> {replacingReport.patientName}</div>
              <div><strong>Current File:</strong> <span className="font-mono">{replacingReport.fileName}</span> ({Math.round(replacingReport.fileSizeBytes / 1024)} KB)</div>
            </div>

            <form onSubmit={handleReplaceReportSubmit} className="space-y-4">
              <div>
                <label className="field-label">
                  New Report File (PDF, JPG, PNG - Max 10MB) <span className="text-red-500">*</span>
                </label>
                <input
                  type="file"
                  required
                  accept=".pdf,image/jpeg,image/png"
                  onChange={(e) => setReplaceFile(e.target.files?.[0] || null)}
                  className="field p-2 text-xs"
                />
              </div>

              <div className="rounded-xl bg-amber-50 p-3 text-[11px] text-amber-800 border border-amber-200">
                Note: Replacing this report will securely remove the old file from storage, update the checksum, and log an audit entry.
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setReplaceReportModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={replaceBusy || !replaceFile}
                  className="rounded-xl bg-amber-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-amber-700 disabled:opacity-50"
                >
                  {replaceBusy ? 'Replacing...' : 'Upload & Replace Report'}
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

      {/* ========================================================================= */}
      {/* MODAL 1: RECORD VERIFIED PATIENT PAYMENT                                  */}
      {/* ========================================================================= */}
      {refPaymentModalOpen && refPaymentBooking && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setRefPaymentModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#073b66]">Record Patient Payment</h3>
                <p className="text-xs text-slate-500">
                  Booking #{refPaymentBooking.bookingReference || refPaymentBooking._id} • {refPaymentBooking.patient?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefPaymentModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Financial Status Summary */}
            <div className="grid grid-cols-3 gap-2.5 rounded-2xl bg-slate-50 p-3.5 border border-slate-200 text-center">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Total Invoiced</span>
                <span className="text-sm font-black text-slate-800">
                  {formatInr(refPaymentBooking.financials?.patientPayablePaise || refPaymentBooking.totalAmountPaise)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-emerald-600">Already Paid</span>
                <span className="text-sm font-black text-emerald-700">
                  {formatInr(refPaymentBooking.financials?.patientPaidPaise || 0)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-rose-600">Due Outstanding</span>
                <span className="text-sm font-black text-rose-700">
                  {formatInr(refPaymentBooking.financials?.patientOutstandingPaise || 0)}
                </span>
              </div>
            </div>

            <form onSubmit={handleRefPaymentSubmit} className="space-y-4">
              <div>
                <label className="field-label">Payment Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={refPaymentForm.amount}
                  onChange={(e) => setRefPaymentForm({ ...refPaymentForm, amount: e.target.value })}
                  placeholder="Enter amount in ₹..."
                  className="field"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Payment Method <span className="text-red-500">*</span></label>
                  <select
                    value={refPaymentForm.paymentMethod}
                    onChange={(e) => setRefPaymentForm({ ...refPaymentForm, paymentMethod: e.target.value })}
                    className="field"
                  >
                    <option value="Cash">Cash at Counter</option>
                    <option value="UPI">UPI / QR Code</option>
                    <option value="Card">Debit / Credit Card</option>
                    <option value="NetBanking">Net Banking / NEFT</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>

                <div>
                  <label className="field-label">Transaction Reference / Receipt No.</label>
                  <input
                    type="text"
                    value={refPaymentForm.transactionRef}
                    onChange={(e) => setRefPaymentForm({ ...refPaymentForm, transactionRef: e.target.value })}
                    placeholder="e.g. UPI-987654321 / REC-102"
                    className="field"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Accounting Notes</label>
                <input
                  type="text"
                  value={refPaymentForm.notes}
                  onChange={(e) => setRefPaymentForm({ ...refPaymentForm, notes: e.target.value })}
                  placeholder="e.g. Received full settlement at sample collection desk"
                  className="field"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefPaymentModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refPaymentSubmitting}
                  className="rounded-xl bg-emerald-600 px-5 py-2 text-xs font-bold text-white hover:bg-emerald-700 transition shadow-sm disabled:opacity-50"
                >
                  {refPaymentSubmitting ? 'Recording Payment...' : 'Confirm & Record Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: PROCESS & RECORD PATIENT REFUND                                 */}
      {/* ========================================================================= */}
      {refRefundModalOpen && refRefundBooking && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setRefRefundModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 max-w-lg space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-rose-900">Record Patient Refund</h3>
                <p className="text-xs text-slate-500">
                  Booking #{refRefundBooking.bookingReference || refRefundBooking._id} • {refRefundBooking.patient?.name}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefRefundModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <div className="rounded-2xl bg-amber-50 border border-amber-200 p-3 text-xs text-amber-900 leading-relaxed">
              <span className="font-bold block mb-0.5">Auditing & Compliance Policy:</span>
              Refunds do NOT delete historical transaction records. An immutable refund entry will be posted to the financial ledger and Unique Pathology revenue will be adjusted accordingly.
            </div>

            {/* Paid vs Max Refundable */}
            <div className="grid grid-cols-2 gap-3 rounded-2xl bg-slate-50 p-3 border border-slate-200 text-center">
              <div>
                <span className="block text-[10px] font-bold uppercase text-slate-400">Total Amount Paid</span>
                <span className="text-base font-black text-emerald-700">
                  {formatInr(refRefundBooking.financials?.patientPaidPaise || 0)}
                </span>
              </div>
              <div>
                <span className="block text-[10px] font-bold uppercase text-rose-600">Already Refunded</span>
                <span className="text-base font-black text-rose-700">
                  {formatInr(refRefundBooking.financials?.patientRefundedPaise || 0)}
                </span>
              </div>
            </div>

            <form onSubmit={handleRefRefundSubmit} className="space-y-4">
              <div>
                <label className="field-label">Refund Amount (₹) <span className="text-red-500">*</span></label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={refRefundForm.refundAmount}
                  onChange={(e) => setRefRefundForm({ ...refRefundForm, refundAmount: e.target.value })}
                  placeholder="Enter refund amount..."
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">Mandatory Justification / Reason <span className="text-red-500">*</span></label>
                <select
                  value={refRefundForm.reason}
                  onChange={(e) => setRefRefundForm({ ...refRefundForm, reason: e.target.value })}
                  className="field"
                >
                  <option value="PATIENT_REQUEST">Patient Cancellation Request</option>
                  <option value="TEST_CANCELLED">Diagnostic Test Not Available / Cancelled</option>
                  <option value="SAMPLE_UNVIABLE">Sample Rejected / Inadequate Specimen</option>
                  <option value="BILLING_CORRECTION">Billing Tariff Overcharge Correction</option>
                  <option value="DISCOUNT_DISPUTE_SETTLEMENT">Authorized Doctor Tariff Concession Adjustment</option>
                  <option value="OTHER_DOCUMENTED_REASON">Other Documented Clinical Reason</option>
                </select>
              </div>

              <div>
                <label className="field-label">Disbursement / Bank Reference ID</label>
                <input
                  type="text"
                  value={refRefundForm.reference}
                  onChange={(e) => setRefRefundForm({ ...refRefundForm, reference: e.target.value })}
                  placeholder="e.g. REF-UPI-987654 / IMPS-345678"
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">Detailed Administrative & Audit Notes</label>
                <textarea
                  rows={2}
                  value={refRefundForm.notes}
                  onChange={(e) => setRefRefundForm({ ...refRefundForm, notes: e.target.value })}
                  placeholder="Enter documented reason approved by lab director..."
                  className="field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefRefundModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refRefundSubmitting}
                  className="rounded-xl bg-rose-600 px-5 py-2 text-xs font-bold text-white hover:bg-rose-700 transition shadow-sm disabled:opacity-50"
                >
                  {refRefundSubmitting ? 'Posting Refund...' : 'Post Audited Refund'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 3: RECORD AUTHORIZED CLINICAL SERVICE PAYMENT                      */}
      {/* ========================================================================= */}
      {refServiceModalOpen && refServiceBooking && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setRefServiceModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 max-w-xl space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-purple-950">Record Authorized Clinical Service</h3>
                <p className="text-xs text-slate-500">
                  Doctor: Dr. {refServiceBooking.doctor?.name} • Booking #{refServiceBooking.bookingReference || refServiceBooking._id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefServiceModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Statutory Compliance Notice */}
            <div className="rounded-2xl bg-purple-50 border border-purple-200 p-3.5 text-xs text-purple-950 leading-relaxed">
              <span className="font-bold flex items-center gap-1.5 mb-1 text-purple-900">
                <ShieldCheck size={16} /> Statutory Ethics Warning (NMC / MCI Compliance)
              </span>
              Under Indian Medical Ethics Regulations, referral fees or kickbacks are strictly illegal. This form is strictly restricted to logging bona-fide, independently documented and legally permissible clinical service costs (e.g. clinical specimen collection center facility, specialist specimen centrifugation) backed by a formal SLA.
            </div>

            <form onSubmit={handleRefServiceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Service Payment Amount (₹) <span className="text-red-500">*</span></label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={refServiceForm.amount}
                    onChange={(e) => setRefServiceForm({ ...refServiceForm, amount: e.target.value })}
                    placeholder="Enter amount in ₹..."
                    className="field"
                  />
                </div>

                <div>
                  <label className="field-label">Clinical Task Category <span className="text-red-500">*</span></label>
                  <select
                    value={refServiceForm.category}
                    onChange={(e) => setRefServiceForm({ ...refServiceForm, category: e.target.value })}
                    className="field"
                  >
                    <option value="CLINICAL_SPECIMEN_COLLECTION">Clinical Specimen Collection Facility</option>
                    <option value="SPECIALIST_SAMPLE_PREPARATION">Specialist Specimen Centrifugation / Prep</option>
                    <option value="POST_DIAGNOSTIC_CONSULTATION">Formal Post-Diagnostic Consultation</option>
                    <option value="EQUIPMENT_FACILITY_PROVISION">Equipment & Cold-Chain Maintenance</option>
                    <option value="OTHER_DOCUMENTED_CLINICAL_SERVICE">Other Permissible Documented Service</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="field-label">Agreement Reference / SLA Contract ID <span className="text-red-500">*</span></label>
                <input
                  type="text"
                  required
                  value={refServiceForm.agreementRef}
                  onChange={(e) => setRefServiceForm({ ...refServiceForm, agreementRef: e.target.value })}
                  placeholder="e.g. SLA-COLLECTION-2026/04"
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">Legal Justification & Detailed Clinical Work Description <span className="text-red-500">*</span></label>
                <textarea
                  rows={2}
                  required
                  value={refServiceForm.legalJustification}
                  onChange={(e) => setRefServiceForm({ ...refServiceForm, legalJustification: e.target.value })}
                  placeholder="Describe the clinical service performed and verification protocol..."
                  className="field text-xs font-mono"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="field-label">Disbursement / Payment Reference</label>
                  <input
                    type="text"
                    value={refServiceForm.paymentReference}
                    onChange={(e) => setRefServiceForm({ ...refServiceForm, paymentReference: e.target.value })}
                    placeholder="e.g. BANK-TXN-778899"
                    className="field"
                  />
                </div>

                <div>
                  <label className="field-label">Accounting Notes</label>
                  <input
                    type="text"
                    value={refServiceForm.notes}
                    onChange={(e) => setRefServiceForm({ ...refServiceForm, notes: e.target.value })}
                    placeholder="e.g. Approved per quarterly collection agreement"
                    className="field"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefServiceModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refServiceSubmitting}
                  className="rounded-xl bg-purple-700 px-5 py-2 text-xs font-bold text-white hover:bg-purple-800 transition shadow-sm disabled:opacity-50"
                >
                  {refServiceSubmitting ? 'Logging Service Task...' : 'Log Authorized Clinical Service'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 4: SETTLEMENT STATUS UPDATE                                         */}
      {/* ========================================================================= */}
      {refSettlementModalOpen && refSettlementBooking && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setRefSettlementModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 max-w-md space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#073b66]">Update Settlement Status</h3>
                <p className="text-xs text-slate-500">
                  Booking #{refSettlementBooking.bookingReference || refSettlementBooking._id}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setRefSettlementModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleRefSettlementSubmit} className="space-y-4">
              <div>
                <label className="field-label">Settlement Status</label>
                <select
                  value={refSettlementForm.settlementStatus}
                  onChange={(e) => setRefSettlementForm({ ...refSettlementForm, settlementStatus: e.target.value })}
                  className="field font-bold"
                >
                  <option value="PENDING">PENDING — Reconciliation Pending</option>
                  <option value="SETTLED">SETTLED — Fully Reconciled & Closed</option>
                  <option value="DISPUTED">DISPUTED — Under Audit Review</option>
                </select>
              </div>

              <div>
                <label className="field-label">Settlement Notes / Remarks</label>
                <textarea
                  rows={3}
                  value={refSettlementForm.notes}
                  onChange={(e) => setRefSettlementForm({ ...refSettlementForm, notes: e.target.value })}
                  placeholder="Enter audit reconciliation notes..."
                  className="field text-xs"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setRefSettlementModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={refSettlementSubmitting}
                  className="rounded-xl bg-[#073b66] px-5 py-2 text-xs font-bold text-white hover:bg-cyan-800 transition shadow-sm disabled:opacity-50"
                >
                  {refSettlementSubmitting ? 'Updating...' : 'Update Settlement Status'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 5: DETAILED REFERRAL LEDGER & AUDIT TRAIL MODAL                    */}
      {/* ========================================================================= */}
      {referralDetailModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setReferralDetailModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 max-w-3xl space-y-6 max-h-[90vh] overflow-y-auto">
            {referralDetailLoading || !selectedReferralDetail ? (
              <div className="py-12 text-center text-slate-500">
                <RefreshCw size={24} className="mx-auto animate-spin text-cyan-600 mb-2" />
                <p className="font-bold">Loading comprehensive ledger record...</p>
              </div>
            ) : (
              (() => {
                const b = selectedReferralDetail.booking || {}
                const f = selectedReferralDetail.financials || {}
                const ledgers = selectedReferralDetail.ledgerEntries || []
                const audits = selectedReferralDetail.auditLogs || []

                return (
                  <div className="space-y-6">
                    {/* Header */}
                    <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold bg-cyan-50 text-cyan-800 border border-cyan-200 px-2 py-0.5 rounded">
                            {b.bookingReference || b.reference || b._id}
                          </span>
                          <span className="text-xs text-slate-400">
                            Booked: {new Date(b.createdAt || b.date).toLocaleString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-black text-[#073b66] mt-1">
                          Referral Financial Statement: {b.patient?.name || b.patientName || 'Patient'}
                        </h3>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleOpenPrintModal('referrals', b)}
                          className="rounded-xl border border-slate-200 bg-white px-3 py-1.5 text-xs font-bold text-slate-700 hover:bg-slate-50 flex items-center gap-1 shadow-xs"
                        >
                          <Printer size={14} />
                          <span>Print Statement</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setReferralDetailModalOpen(false)}
                          className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>

                    {/* Patient & Doctor Card */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
                        <span className="font-black text-[#073b66] uppercase text-[10px] tracking-wider block">
                          Patient Information
                        </span>
                        <div className="font-bold text-slate-900 text-sm">{b.patient?.name || b.patientName || 'Unknown Patient'}</div>
                        <div className="text-slate-600">Mobile: {b.patient?.mobile || b.phone || '—'}</div>
                        <div className="text-slate-600">
                          Age / Gender: {(b.patient?.age || b.age) ? `${b.patient?.age || b.age} yrs` : 'Age N/A'} {(b.patient?.gender || b.gender) ? `• ${b.patient?.gender || b.gender}` : ''}
                        </div>
                        <div className="text-slate-600">Email: {b.patient?.email || b.email || '—'}</div>
                        <div className="text-slate-500 text-[11px]">{b.patient?.address || b.address || 'Mandideep, Bhopal (MP)'}</div>
                      </div>

                      <div className="rounded-2xl border border-slate-200 bg-slate-50/60 p-4 space-y-1.5">
                        <span className="font-black text-[#073b66] uppercase text-[10px] tracking-wider block">
                          Referring Doctor & Tariff
                        </span>
                        <div className="font-bold text-slate-900 text-sm">
                          {(b.doctor?.name || b.doctorName) && (b.doctor?.name !== 'Direct / Walk-in' && b.doctorName !== 'Direct / Walk-in' && b.doctorName !== 'Unassigned Doctor')
                            ? `Dr. ${(b.doctor?.name || b.doctorName).replace(/^Dr\.?\s*/i, '')}`
                            : 'Direct Laboratory Patient'}
                        </div>
                        {((b.doctor?.name || b.doctorName) && (b.doctor?.name !== 'Direct / Walk-in' && b.doctorName !== 'Direct / Walk-in' && b.doctorName !== 'Unassigned Doctor')) && (
                          <>
                            <div className="text-slate-600">
                              {b.doctor?.specialization || b.doctorSpecialization || 'Clinical Specialist'} {b.doctor?.clinicName || b.doctorClinic ? `• ${b.doctor?.clinicName || b.doctorClinic}` : ''}
                            </div>
                            <div className="text-slate-600">
                              Referral Code: <span className="font-mono font-bold text-cyan-800">{b.doctor?.referralCode || b.referralCode || '—'}</span>
                              {(b.doctor?._id || b.doctorId) && (
                                <span className="ml-2 font-mono text-[10px] text-slate-400">ID: {String(b.doctor?._id || b.doctorId).slice(-6)}</span>
                              )}
                            </div>
                            <div className="text-amber-700 font-bold">
                              Doctor-Specific Concession: {b.doctor?.discountPercent ?? b.doctorDiscountPercent ?? 0}%
                            </div>
                          </>
                        )}
                      </div>
                    </div>

                    {/* Prescribed Tests Table with Snapshot Pricing */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                        Prescribed Diagnostic Tests & Tariff Snapshots
                      </h4>
                      <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs">
                          <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Item / Investigation</th>
                              <th className="py-2.5 px-3">Type</th>
                              <th className="py-2.5 px-3 text-right">Original MRP</th>
                              <th className="py-2.5 px-3 text-right">Concession</th>
                              <th className="py-2.5 px-3 text-right">Patient Charge</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100">
                            {(b.items || []).map((it, idx) => (
                              <tr key={idx}>
                                <td className="py-2.5 px-3 font-semibold text-slate-800">
                                  {it.name || it.test?.name || it.package?.name || 'Diagnostic Item'}
                                </td>
                                <td className="py-2.5 px-3 text-slate-500 uppercase text-[10px]">
                                  {it.itemType}
                                </td>
                                <td className="py-2.5 px-3 text-right text-slate-600">
                                  {formatInr(it.mrpPaise || it.pricePaise)}
                                </td>
                                <td className="py-2.5 px-3 text-right text-amber-700 font-semibold">
                                  -{formatInr(it.discountPaise || 0)}
                                </td>
                                <td className="py-2.5 px-3 text-right font-bold text-blue-900">
                                  {formatInr(it.finalPricePaise || it.pricePaise)}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Financial Reconciliation Summary Box */}
                    <div className="rounded-2xl border border-teal-200 bg-teal-50/40 p-4 space-y-3">
                      <h4 className="text-xs font-black uppercase tracking-wider text-teal-900">
                        Audited Financial Reconciliation
                      </h4>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                        <div>
                          <span className="text-slate-500 block text-[10px]">Total Original MRP</span>
                          <span className="font-bold text-slate-800 text-sm">{formatInr(f.originalMrpPaise)}</span>
                        </div>
                        <div>
                          <span className="text-amber-700 block text-[10px]">Doctor Concession</span>
                          <span className="font-bold text-amber-800 text-sm">-{formatInr(f.doctorDiscountPaise)}</span>
                        </div>
                        <div>
                          <span className="text-blue-700 block text-[10px]">Patient Bill</span>
                          <span className="font-bold text-blue-900 text-sm">{formatInr(f.patientPayablePaise)}</span>
                        </div>
                        <div>
                          <span className="text-emerald-700 block text-[10px]">Collected Paid</span>
                          <span className="font-black text-emerald-800 text-sm">{formatInr(f.patientPaidPaise)}</span>
                        </div>
                        <div>
                          <span className="text-rose-700 block text-[10px]">Outstanding Due</span>
                          <span className="font-bold text-rose-800 text-sm">{formatInr(f.patientOutstandingPaise)}</span>
                        </div>
                        <div>
                          <span className="text-orange-700 block text-[10px]">Refunded</span>
                          <span className="font-bold text-orange-800 text-sm">{formatInr(f.patientRefundedPaise)}</span>
                        </div>
                        <div>
                          <span className="text-purple-700 block text-[10px]">Clinical Service</span>
                          <span className="font-bold text-purple-800 text-sm">{formatInr(f.authorizedServicePaymentPaise)}</span>
                        </div>
                        <div className="bg-teal-900 text-white rounded-xl p-2 text-center">
                          <span className="text-teal-300 block text-[10px] font-bold uppercase">Lab Net Retained</span>
                          <span className="font-black text-base">{formatInr(f.labNetRetainedPaise)}</span>
                        </div>
                      </div>
                    </div>

                    {/* Immutable Financial Ledger Entries */}
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <h4 className="text-xs font-black uppercase tracking-wider text-slate-500">
                          Immutable Financial Ledger History ({ledgers.length} entries)
                        </h4>
                        <span className="text-[10px] text-slate-400 font-mono">Double-entry verified</span>
                      </div>
                      <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2.5 px-3">Timestamp</th>
                              <th className="py-2.5 px-3">Entry Type</th>
                              <th className="py-2.5 px-3">Method / Ref</th>
                              <th className="py-2.5 px-3 text-right">Amount</th>
                              <th className="py-2.5 px-3">Direction</th>
                              <th className="py-2.5 px-3">Actor / Notes</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {ledgers.length === 0 ? (
                              <tr>
                                <td colSpan={6} className="py-4 text-center text-slate-400">
                                  No financial ledger entries posted yet.
                                </td>
                              </tr>
                            ) : (
                              ledgers.map((l) => (
                                <tr key={l._id}>
                                  <td className="py-2 px-3 text-slate-500">{new Date(l.createdAt).toLocaleString()}</td>
                                  <td className="py-2 px-3 font-bold text-slate-800">{l.entryType}</td>
                                  <td className="py-2 px-3 text-slate-600">
                                    {l.paymentMethod} {l.transactionReference ? `(${l.transactionReference})` : ''}
                                  </td>
                                  <td className="py-2 px-3 text-right font-black text-slate-900">
                                    {formatInr(l.amountPaise)}
                                  </td>
                                  <td className="py-2 px-3">
                                    <span
                                      className={`px-1.5 py-0.5 rounded text-[10px] font-bold ${
                                        l.direction === 'CREDIT' ? 'bg-emerald-100 text-emerald-800' : 'bg-rose-100 text-rose-800'
                                      }`}
                                    >
                                      {l.direction}
                                    </span>
                                  </td>
                                  <td className="py-2 px-3 text-slate-600">
                                    <div>{l.performedBy}</div>
                                    {l.notes && <div className="text-[10px] text-slate-400 italic">{l.notes}</div>}
                                  </td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>

                    {/* Audit Logs */}
                    <div>
                      <h4 className="text-xs font-black uppercase tracking-wider text-slate-500 mb-2">
                        Regulatory Audit Trail ({audits.length} events)
                      </h4>
                      <div className="rounded-2xl border border-slate-200 overflow-hidden">
                        <table className="w-full text-left text-xs font-mono">
                          <thead className="bg-slate-100 text-slate-600 font-bold uppercase text-[10px]">
                            <tr>
                              <th className="py-2 px-3">Date</th>
                              <th className="py-2 px-3">Action</th>
                              <th className="py-2 px-3">Category</th>
                              <th className="py-2 px-3">Actor</th>
                              <th className="py-2 px-3">IP</th>
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-slate-100 text-[11px]">
                            {audits.length === 0 ? (
                              <tr>
                                <td colSpan={5} className="py-3 text-center text-slate-400">
                                  No audit events recorded for this booking.
                                </td>
                              </tr>
                            ) : (
                              audits.map((a) => (
                                <tr key={a._id}>
                                  <td className="py-1.5 px-3 text-slate-500">{new Date(a.createdAt).toLocaleString()}</td>
                                  <td className="py-1.5 px-3 font-semibold text-slate-800">{a.action}</td>
                                  <td className="py-1.5 px-3 text-slate-600">{a.category}</td>
                                  <td className="py-1.5 px-3 text-cyan-800">{a.performedBy}</td>
                                  <td className="py-1.5 px-3 text-slate-400">{a.ip || '127.0.0.1'}</td>
                                </tr>
                              ))
                            )}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  </div>
                )
              })()
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 6: DOCTOR MONTHLY BILLING STATEMENT / BROWSER PRINT & PDF EXPORT     */}
      {/* ========================================================================= */}
      {refPrintModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/80 backdrop-blur-sm p-4 sm:p-6 flex items-center justify-center">
          <div className="bg-white rounded-3xl max-w-4xl w-full p-6 sm:p-8 shadow-2xl space-y-6 max-h-[95vh] overflow-y-auto">
            {/* Top Toolbar (Hidden during print) */}
            <div className="flex items-center justify-between border-b border-slate-200 pb-4 print:hidden">
              <div className="flex items-center gap-2">
                <Printer size={20} className="text-[#073b66]" />
                <h3 className="text-base font-black text-[#073b66]">
                  Doctor Monthly Billing Statement & PDF Export Preview
                </h3>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleTriggerPrint}
                  className="rounded-xl bg-[#073b66] px-4 py-2 text-xs font-bold text-white hover:bg-cyan-800 transition flex items-center gap-1.5 shadow-sm"
                >
                  <Printer size={15} />
                  <span>Print Document / Save PDF</span>
                </button>
                <button
                  type="button"
                  onClick={() => setRefPrintModalOpen(false)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-100"
                >
                  Close
                </button>
              </div>
            </div>

            {/* Printable Document Body */}
            {(() => {
              // Resolve Doctor Information (NEVER show MongoDB ObjectIDs!)
              let targetDoc = null
              if (printReportType === 'doctor-statement') {
                targetDoc = printReportPayload?.doctor || (statementDoctorFilter !== 'all' ? doctors.find(d => String(d._id) === String(statementDoctorFilter)) : null) || (doctors[0] || null)
              } else if (printReportPayload?.doctor) {
                targetDoc = printReportPayload.doctor
              } else if (refDoctorFilter !== 'all') {
                targetDoc = doctors.find(d => String(d._id) === String(refDoctorFilter))
              }

              const docName = targetDoc?.name
                ? (targetDoc.name.startsWith('Dr') ? targetDoc.name : `Dr. ${targetDoc.name}`)
                : (printReportPayload?.doctorName && printReportPayload.doctorName !== 'Direct / Walk-in' && printReportPayload.doctorName !== 'Unassigned Doctor')
                ? (printReportPayload.doctorName.startsWith('Dr') ? printReportPayload.doctorName : `Dr. ${printReportPayload.doctorName}`)
                : 'Dr. Chitra Verma'

              const docCode = targetDoc?.referralCode || targetDoc?.code || 'DOC-001'
              const docMobile = targetDoc?.mobile || '9826012345'
              const docDiscount = targetDoc?.discountPercent !== undefined ? targetDoc.discountPercent : 15

              const periodText = (statementStartDate && statementEndDate)
                ? `${statementStartDate} to ${statementEndDate}`
                : (statementStartDate)
                ? `From ${statementStartDate}`
                : (statementEndDate)
                ? `Until ${statementEndDate}`
                : (refStartDate && refEndDate)
                ? `${refStartDate} to ${refEndDate}`
                : 'Selected Date Range'

              // Resolve itemized bookings rows
              let rawRows = []
              if (printReportType === 'doctor-statement') {
                if (printReportPayload?.bookings && printReportPayload.bookings.length > 0) {
                  rawRows = printReportPayload.bookings
                } else if (targetDoc?._id) {
                  rawRows = referrals.filter(r => String(r.doctorId) === String(targetDoc._id) || (r.doctorName && targetDoc.name && r.doctorName.toLowerCase().includes(targetDoc.name.toLowerCase())))
                } else {
                  rawRows = referrals
                }
              } else {
                if (printReportPayload) {
                  rawRows = [printReportPayload]
                } else {
                  rawRows = referrals
                }
              }

              const calculatedRows = rawRows.map((r) => {
                const mrp = Math.round(Number(r.mrpPaise || r.financials?.originalMrpPaise || r.originalMrpPaise || 0) / 100)
                const disc = Math.round(Number(r.discPaise || r.financials?.doctorDiscountPaise || r.discountAmountPaise || 0) / 100)
                const bill = Math.max(0, mrp - disc)
                const paid = Math.round(Number(r.paidPaise || r.financials?.patientPaidPaise || r.amountPaidPaise || 0) / 100)
                const due = Math.max(0, bill - paid)
                return {
                  ...r,
                  calcMrp: mrp,
                  calcDisc: disc,
                  calcBill: bill,
                  calcPaid: paid,
                  calcDue: due,
                }
              })

              const totalMrp = calculatedRows.reduce((sum, r) => sum + r.calcMrp, 0)
              const totalDisc = calculatedRows.reduce((sum, r) => sum + r.calcDisc, 0)
              const totalBill = Math.max(0, totalMrp - totalDisc)
              const totalPaid = calculatedRows.reduce((sum, r) => sum + r.calcPaid, 0)
              const totalDue = Math.max(0, totalBill - totalPaid)

              return (
                <div id="printable-financial-document" className="text-slate-900 space-y-6 print:p-0">
                  {/* Header Branding */}
                  <div className="border-b-2 border-[#073b66] pb-3 flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-black text-[#073b66] tracking-tight">UNIQUE PATHOLOGY</h1>
                      <p className="text-xs text-slate-600 font-semibold">
                        Advanced Clinical Diagnostic Laboratory & Research Center
                      </p>
                      <p className="text-[11px] text-slate-500">
                        Industrial Area, Mandideep, Bhopal (MP) • Phone: +91 98260 00000 • Email: info@uniquepathology.com
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="inline-block bg-slate-100 text-[#073b66] font-mono font-bold text-xs px-3 py-1 rounded-lg border border-slate-200">
                        OFFICIAL STATEMENT
                      </span>
                      <p className="text-[11px] text-slate-500 mt-1">Generated: {new Date().toLocaleDateString('en-IN')}</p>
                    </div>
                  </div>

                  {/* PART 4: DOCTOR MONTHLY BILLING STATEMENT HEADER */}
                  <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200">
                    <h2 className="text-lg font-black text-[#073b66] tracking-tight border-b border-slate-200 pb-2">
                      DOCTOR MONTHLY BILLING STATEMENT
                    </h2>
                    <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mt-3 text-xs">
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Doctor Name</span>
                        <strong className="text-sm text-slate-900 block mt-0.5">{docName}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Doctor Code</span>
                        <strong className="text-sm font-mono text-cyan-800 block mt-0.5">{docCode}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Doctor Mobile</span>
                        <strong className="text-sm text-slate-900 block mt-0.5">{docMobile}</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Doctor Discount</span>
                        <strong className="text-sm text-amber-700 block mt-0.5">{docDiscount}%</strong>
                      </div>
                      <div>
                        <span className="text-[10px] uppercase font-bold text-slate-500 block">Period</span>
                        <strong className="text-sm text-slate-900 block mt-0.5">{periodText}</strong>
                      </div>
                    </div>
                  </div>

                  {/* PART 5: SIMPLIFIED LEDGER TABLE (7 COLUMNS) */}
                  <div className="rounded-xl border border-slate-300 overflow-hidden text-xs">
                    <table className="w-full text-left print-table">
                      <thead className="bg-slate-100 border-b border-slate-300 font-bold uppercase text-[10px] text-slate-700">
                        <tr>
                          <th className="py-2.5 px-3">DATE</th>
                          <th className="py-2.5 px-3">PATIENT NAME</th>
                          <th className="py-2.5 px-3 text-right">MRP (₹)</th>
                          <th className="py-2.5 px-3 text-right">DISC (₹)</th>
                          <th className="py-2.5 px-3 text-right">BILL (₹)</th>
                          <th className="py-2.5 px-3 text-right">PAID (₹)</th>
                          <th className="py-2.5 px-3 text-right">DUE (₹)</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-200">
                        {calculatedRows.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="py-6 text-center text-slate-500 italic">
                              No referred patient records found for the selected period.
                            </td>
                          </tr>
                        ) : (
                          calculatedRows.map((r, idx) => (
                            <tr key={r._id || idx} className="hover:bg-slate-50/50">
                              <td className="py-2.5 px-3 text-slate-600 whitespace-nowrap">
                                {r.date || (r.createdAt ? new Date(r.createdAt).toLocaleDateString('en-IN') : 'N/A')}
                              </td>
                              <td className="py-2.5 px-3 font-semibold text-slate-900">
                                {r.patientName || r.patient?.name || 'Walk-In Patient'}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-slate-800">
                                ₹{r.calcMrp.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-medium text-amber-700">
                                ₹{r.calcDisc.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-blue-900">
                                ₹{r.calcBill.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-emerald-800">
                                ₹{r.calcPaid.toLocaleString('en-IN')}
                              </td>
                              <td className="py-2.5 px-3 text-right font-bold text-rose-700">
                                ₹{r.calcDue.toLocaleString('en-IN')}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>

                      {/* PART 6: TOTAL ROW */}
                      <tfoot className="print-totals-row bg-slate-100 border-t-2 border-slate-300">
                        <tr>
                          <td colSpan={2} className="py-2.5 px-3 font-black text-slate-900 uppercase text-xs">
                            TOTAL
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-slate-900 text-xs">
                            ₹{totalMrp.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-amber-700 text-xs">
                            ₹{totalDisc.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-blue-900 text-xs">
                            ₹{totalBill.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-emerald-800 text-xs">
                            ₹{totalPaid.toLocaleString('en-IN')}
                          </td>
                          <td className="py-2.5 px-3 text-right font-black text-rose-700 text-xs">
                            ₹{totalDue.toLocaleString('en-IN')}
                          </td>
                        </tr>
                      </tfoot>
                    </table>
                  </div>

                  {/* PART 6: SUMMARY TOTAL BOXES */}
                  <div className="grid grid-cols-5 gap-2 text-center text-xs print:grid">
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">TOTAL MRP</span>
                      <strong className="text-sm font-black text-slate-800 block mt-0.5">₹{totalMrp.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="bg-amber-50/70 border border-amber-200 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold uppercase text-amber-800 block">TOTAL DISC</span>
                      <strong className="text-sm font-black text-amber-800 block mt-0.5">₹{totalDisc.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="bg-blue-50/70 border border-blue-200 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold uppercase text-blue-800 block">TOTAL BILL</span>
                      <strong className="text-sm font-black text-blue-900 block mt-0.5">₹{totalBill.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="bg-emerald-50/70 border border-emerald-200 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold uppercase text-emerald-800 block">TOTAL PAID</span>
                      <strong className="text-sm font-black text-emerald-900 block mt-0.5">₹{totalPaid.toLocaleString('en-IN')}</strong>
                    </div>
                    <div className="bg-rose-50/70 border border-rose-200 rounded-xl p-2.5">
                      <span className="text-[10px] font-bold uppercase text-rose-800 block">TOTAL DUE</span>
                      <strong className="text-sm font-black text-rose-900 block mt-0.5">₹{totalDue.toLocaleString('en-IN')}</strong>
                    </div>
                  </div>

                  {/* Sign-off & Statutory Notes */}
                  <div className="pt-4 border-t border-slate-200 text-xs flex flex-col sm:flex-row justify-between items-end gap-6">
                    <div className="text-[11px] text-slate-500 max-w-md">
                      <span className="font-bold block text-slate-700">Audit Certification & Statutory Compliance</span>
                      This statement is an official accounting ledger generated by Unique Pathology Diagnostic System.
                      Doctor discounts applied are authorized clinical concessions passed directly to the patient.
                    </div>
                    <div className="text-center sm:text-right">
                      <div className="h-12 border-b border-slate-400 w-44 mb-1"></div>
                      <span className="text-xs font-bold text-slate-800 block">Authorized Signatory</span>
                      <span className="text-[10px] text-slate-500">Finance & Accounts, Unique Pathology</span>
                    </div>
                  </div>
                </div>
              )
            })()}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 7: ADMIN PATIENT BOOKING CREATION FORM (PARTS 2 & 3)                 */}
      {/* ========================================================================= */}
      {adminBookingModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setAdminBookingModalOpen(false)}>
          <div className="modal-panel p-6 sm:p-8 max-w-3xl space-y-6 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div>
                <h3 className="text-lg font-black text-[#073b66]">
                  Create Patient Booking & Doctor Referral
                </h3>
                <p className="text-xs text-slate-500">
                  Book patient tests, link referring doctor for authoritative discounts, and record payments.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setAdminBookingModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100"
              >
                <X size={18} />
              </button>
            </div>

            {adminBookingError && (
              <div className="rounded-xl border border-rose-200 bg-rose-50 p-3 text-xs font-semibold text-rose-800">
                {adminBookingError}
              </div>
            )}

            {adminBookingSuccess && (
              <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-3 text-xs font-semibold text-emerald-800">
                {adminBookingSuccess}
              </div>
            )}

            {(() => {
              // Real-time calculation of pricing & doctor discount
              const selectedDoc = doctors.find((d) => String(d._id) === String(adminBookingForm.doctorId))
              const docDiscountPercent = selectedDoc?.discountPercent || 0

              const selectedTests = tests.filter((t) => adminBookingForm.selectedTestIds.includes(t._id))
              const selectedPkgs = packages.filter((p) => adminBookingForm.selectedPackageIds.includes(p._id))

              const originalMrpPaise =
                selectedTests.reduce((sum, t) => sum + (t.mrpPaise || t.pricePaise || 0), 0) +
                selectedPkgs.reduce((sum, p) => sum + (p.mrpPaise || p.pricePaise || 0), 0)

              const doctorDiscountPaise = Math.round(originalMrpPaise * (docDiscountPercent / 100))
              const finalPayablePaise = Math.max(0, originalMrpPaise - doctorDiscountPaise)

              const enteredPaidPaise =
                adminBookingForm.paymentStatus === 'paid'
                  ? finalPayablePaise
                  : adminBookingForm.amountPaid
                  ? Math.round(Number(adminBookingForm.amountPaid) * 100)
                  : 0

              const balanceDuePaise = Math.max(0, finalPayablePaise - enteredPaidPaise)

              return (
                <form onSubmit={handleSubmitAdminBooking} className="space-y-5 text-xs">
                  {/* Row 1: Patient Basic Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Patient Name <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="text"
                        required
                        value={adminBookingForm.patientName}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, patientName: e.target.value })}
                        placeholder="e.g. Ramesh Kumar"
                        className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">
                        Mobile Number <span className="text-rose-500">*</span>
                      </label>
                      <input
                        type="tel"
                        required
                        maxLength={10}
                        value={adminBookingForm.phone}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, phone: e.target.value.replace(/\D/g, '') })}
                        placeholder="10-digit mobile"
                        className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Email Address</label>
                      <input
                        type="email"
                        value={adminBookingForm.email}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, email: e.target.value })}
                        placeholder="patient@example.com (optional)"
                        className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-cyan-500"
                      />
                    </div>
                  </div>

                  {/* Row 2: Age, Gender, Collection Type */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Patient Age</label>
                      <input
                        type="number"
                        min={1}
                        max={120}
                        value={adminBookingForm.age}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, age: e.target.value })}
                        placeholder="e.g. 45"
                        className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-cyan-500"
                      />
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Gender</label>
                      <select
                        value={adminBookingForm.gender}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, gender: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-cyan-500 bg-white"
                      >
                        <option value="male">Male</option>
                        <option value="female">Female</option>
                        <option value="other">Other</option>
                        <option value="prefer_not_to_say">Prefer not to say</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Sample Collection</label>
                      <select
                        value={adminBookingForm.collectionType}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, collectionType: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-cyan-500 bg-white"
                      >
                        <option value="centre">Lab Visit (Mandideep Centre)</option>
                        <option value="home">Home Sample Collection</option>
                      </select>
                    </div>
                  </div>

                  {/* Address if home collection */}
                  {adminBookingForm.collectionType === 'home' && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 bg-slate-50 rounded-xl border border-slate-200">
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Home Address</label>
                        <input
                          type="text"
                          value={adminBookingForm.address}
                          onChange={(e) => setAdminBookingForm({ ...adminBookingForm, address: e.target.value })}
                          placeholder="House/Street/Locality"
                          className="w-full rounded-xl border border-slate-300 p-2 font-medium bg-white"
                        />
                      </div>
                      <div>
                        <label className="font-bold text-slate-700 block mb-1">Landmark & PIN</label>
                        <input
                          type="text"
                          value={adminBookingForm.landmark}
                          onChange={(e) => setAdminBookingForm({ ...adminBookingForm, landmark: e.target.value })}
                          placeholder="Nearby landmark (Mandideep)"
                          className="w-full rounded-xl border border-slate-300 p-2 font-medium bg-white"
                        />
                      </div>
                    </div>
                  )}

                  {/* Date & Time Slot */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Appointment Date</label>
                      <input
                        type="date"
                        required
                        value={adminBookingForm.date}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, date: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-cyan-500 bg-white"
                      />
                    </div>
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Time Slot</label>
                      <select
                        value={adminBookingForm.timeSlot}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, timeSlot: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2.5 font-medium outline-none focus:border-cyan-500 bg-white"
                      >
                        <option value="07:00 AM - 09:00 AM">07:00 AM - 09:00 AM (Fasting)</option>
                        <option value="09:00 AM - 11:00 AM">09:00 AM - 11:00 AM</option>
                        <option value="11:00 AM - 01:00 PM">11:00 AM - 01:00 PM</option>
                        <option value="02:00 PM - 04:00 PM">02:00 PM - 04:00 PM</option>
                        <option value="04:00 PM - 06:00 PM">04:00 PM - 06:00 PM</option>
                        <option value="06:00 PM - 08:00 PM">06:00 PM - 08:00 PM</option>
                      </select>
                    </div>
                  </div>

                  {/* PART 3: REFERRING DOCTOR DROPDOWN */}
                  <div className="rounded-2xl border-2 border-cyan-200 bg-cyan-50/50 p-4 space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-black text-[#073b66] uppercase tracking-wide flex items-center gap-1.5">
                        <Stethoscope size={16} className="text-cyan-700" />
                        <span>Select Referring Doctor</span>
                      </label>
                      {selectedDoc && (
                        <span className="text-[11px] font-bold text-amber-800 bg-amber-100 px-2 py-0.5 rounded-full border border-amber-200">
                          {selectedDoc.discountPercent}% Concession Applies
                        </span>
                      )}
                    </div>

                    <select
                      value={adminBookingForm.doctorId}
                      onChange={(e) => setAdminBookingForm({ ...adminBookingForm, doctorId: e.target.value })}
                      className="w-full rounded-xl border border-cyan-300 bg-white p-2.5 text-xs font-bold text-slate-800 outline-none focus:border-cyan-600 shadow-xs"
                    >
                      <option value="walkin">Walk-In Patient (No Doctor / Direct)</option>
                      <option value="self">Self Referred</option>
                      {doctors.map((doc) => (
                        <option key={doc._id} value={doc._id}>
                          {doc.name.startsWith('Dr') ? doc.name : `Dr. ${doc.name}`} ({doc.discountPercent || 0}% Concession{doc.referralCode ? ` - ${doc.referralCode}` : ''})
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-500">
                      When a doctor is selected, the patient's booking is authoritatively linked and the doctor's preset discount will be deducted automatically from MRP.
                    </p>
                  </div>

                  {/* Tests & Packages Multi-Selection */}
                  <div className="space-y-3">
                    <label className="font-bold text-slate-700 block">
                      Select Tests & Packages <span className="text-rose-500">*</span>
                    </label>

                    {/* Pathology Tests Grid */}
                    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 space-y-2 max-h-40 overflow-y-auto">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Tests Catalogue</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {tests.map((t) => {
                          const checked = adminBookingForm.selectedTestIds.includes(t._id)
                          return (
                            <label
                              key={t._id}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                checked
                                  ? 'bg-cyan-50 border-cyan-300 text-cyan-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...adminBookingForm.selectedTestIds, t._id]
                                      : adminBookingForm.selectedTestIds.filter((id) => id !== t._id)
                                    setAdminBookingForm({ ...adminBookingForm, selectedTestIds: next })
                                  }}
                                  className="rounded text-cyan-600 focus:ring-cyan-500"
                                />
                                <span className="line-clamp-1">{t.name}</span>
                              </div>
                              <span className="font-bold text-slate-900 ml-2">₹{(t.mrpPaise || t.pricePaise) / 100}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>

                    {/* Health Packages Grid */}
                    <div className="rounded-xl border border-slate-200 p-3 bg-slate-50 space-y-2 max-h-36 overflow-y-auto">
                      <span className="text-[10px] font-bold uppercase text-slate-500 block">Health Packages</span>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                        {packages.map((pkg) => {
                          const checked = adminBookingForm.selectedPackageIds.includes(pkg._id)
                          return (
                            <label
                              key={pkg._id}
                              className={`flex items-center justify-between p-2 rounded-lg border text-xs cursor-pointer transition ${
                                checked
                                  ? 'bg-cyan-50 border-cyan-300 text-cyan-950 font-bold'
                                  : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  onChange={(e) => {
                                    const next = e.target.checked
                                      ? [...adminBookingForm.selectedPackageIds, pkg._id]
                                      : adminBookingForm.selectedPackageIds.filter((id) => id !== pkg._id)
                                    setAdminBookingForm({ ...adminBookingForm, selectedPackageIds: next })
                                  }}
                                  className="rounded text-cyan-600 focus:ring-cyan-500"
                                />
                                <span className="line-clamp-1">{pkg.name}</span>
                              </div>
                              <span className="font-bold text-slate-900 ml-2">₹{(pkg.mrpPaise || pkg.pricePaise) / 100}</span>
                            </label>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Real-time Financial Breakdown Card */}
                  <div className="rounded-2xl bg-gradient-to-br from-slate-900 to-[#073b66] text-white p-4 space-y-3">
                    <span className="text-[10px] uppercase font-bold tracking-wider text-cyan-300 block">
                      Tariff & Billing Calculation
                    </span>
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                      <div>
                        <span className="text-slate-300 block text-[11px]">Original MRP:</span>
                        <strong className="text-base font-black text-white">{formatInr(originalMrpPaise)}</strong>
                      </div>
                      <div>
                        <span className="text-amber-300 block text-[11px]">Doctor Concession ({docDiscountPercent}%):</span>
                        <strong className="text-base font-black text-amber-300">-{formatInr(doctorDiscountPaise)}</strong>
                      </div>
                      <div>
                        <span className="text-cyan-300 block text-[11px]">Final Bill:</span>
                        <strong className="text-base font-black text-cyan-200">{formatInr(finalPayablePaise)}</strong>
                      </div>
                      <div>
                        <span className="text-rose-300 block text-[11px]">Balance Due:</span>
                        <strong className="text-base font-black text-rose-300">{formatInr(balanceDuePaise)}</strong>
                      </div>
                    </div>
                  </div>

                  {/* Payment Details */}
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Payment Status</label>
                      <select
                        value={adminBookingForm.paymentStatus}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, paymentStatus: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 font-medium bg-white"
                      >
                        <option value="pending">Pending Payment</option>
                        <option value="paid">Fully Paid</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Payment Method</label>
                      <select
                        value={adminBookingForm.paymentMethod}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, paymentMethod: e.target.value })}
                        className="w-full rounded-xl border border-slate-300 p-2 font-medium bg-white"
                      >
                        <option value="Cash">Cash at Counter</option>
                        <option value="UPI">UPI / QR Code</option>
                        <option value="Card">Debit / Credit Card</option>
                        <option value="Net Banking">Net Banking</option>
                      </select>
                    </div>

                    <div>
                      <label className="font-bold text-slate-700 block mb-1">Amount Paid (₹)</label>
                      <input
                        type="number"
                        min={0}
                        step="0.01"
                        value={adminBookingForm.paymentStatus === 'paid' ? finalPayablePaise / 100 : adminBookingForm.amountPaid}
                        onChange={(e) => setAdminBookingForm({ ...adminBookingForm, amountPaid: e.target.value })}
                        placeholder={adminBookingForm.paymentStatus === 'paid' ? String(finalPayablePaise / 100) : '0'}
                        disabled={adminBookingForm.paymentStatus === 'paid'}
                        className="w-full rounded-xl border border-slate-300 p-2 font-medium bg-white"
                      />
                    </div>
                  </div>

                  {/* Admin Notes */}
                  <div>
                    <label className="font-bold text-slate-700 block mb-1">Clinical / Administrative Notes</label>
                    <input
                      type="text"
                      value={adminBookingForm.adminNotes}
                      onChange={(e) => setAdminBookingForm({ ...adminBookingForm, adminNotes: e.target.value })}
                      placeholder="Doctor prescription reference, special instructions, etc."
                      className="w-full rounded-xl border border-slate-300 p-2 font-medium bg-white"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-200">
                    <button
                      type="button"
                      onClick={() => setAdminBookingModalOpen(false)}
                      className="rounded-xl border border-slate-200 px-4 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={adminBookingSubmitting}
                      className="rounded-xl bg-[#073b66] px-5 py-2 text-xs font-bold text-white hover:bg-cyan-800 transition disabled:opacity-50 shadow-sm"
                    >
                      {adminBookingSubmitting ? 'Creating Booking...' : 'Create Booking & Link Doctor'}
                    </button>
                  </div>
                </form>
              )
            })()}
          </div>
        </div>
      )}

    </div>
  )
}

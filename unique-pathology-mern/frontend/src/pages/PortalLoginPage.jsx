import React, { useState, useEffect } from 'react'
import { useNavigate, useSearchParams, Link } from 'react-router-dom'
import {
  Stethoscope,
  ShieldCheck,
  Lock,
  Mail,
  Phone,
  ArrowRight,
  AlertCircle,
  Sparkles,
  CheckCircle2,
  Building2,
  Percent,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useDoctorAuth } from '../context/DoctorAuthContext.jsx'

export function PortalLoginPage({ initialRole = 'doctor' }) {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()

  const urlRole = searchParams.get('role')
  const defaultTab = urlRole === 'admin' ? 'admin' : (urlRole === 'doctor' ? 'doctor' : initialRole)

  const [activeTab, setActiveTab] = useState(defaultTab)

  const { admin, login: adminLogin, isAuthenticated: isAdminAuthenticated } = useAuth()
  const { doctor, login: doctorLogin, isAuthenticated: isDoctorAuthenticated } = useDoctorAuth()

  // Doctor Form State
  
  const [doctorIdentifier, setDoctorIdentifier] = useState('')
  const [doctorPassword, setDoctorPassword] = useState('')
  const [doctorLoading, setDoctorLoading] = useState(false)
  const [doctorError, setDoctorError] = useState('')

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminRemember, setAdminRemember] = useState(true)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')
  // Redirect if already logged in
  useEffect(() => {
    if (activeTab === 'admin' && isAdminAuthenticated) {
      navigate('/admin')
    } else if (activeTab === 'doctor' && isDoctorAuthenticated) {
      navigate('/doctor')
    }
  }, [activeTab, isAdminAuthenticated, isDoctorAuthenticated, navigate])

  async function handleDoctorSubmit(e) {
    e.preventDefault()
    setDoctorError('')
    setDoctorLoading(true)

    try {
      await doctorLogin(doctorIdentifier.trim(), doctorPassword)
      navigate('/doctor')
    } catch (err) {
      setDoctorError(err.message || 'Invalid doctor login credentials.')
    } finally {
      setDoctorLoading(false)
    }
  }

  async function handleAdminSubmit(e) {
    e.preventDefault()
    setAdminError('')
    setAdminLoading(true)

    try {
      await adminLogin(adminEmail.trim(), adminPassword, adminRemember)
      navigate('/admin')
    } catch (err) {
      setAdminError(err.message || 'Invalid administrative credentials.')
    } finally {
      setAdminLoading(false)
    }
  }

  function handleQuickDoctorSelect(mobile, pwd) {
    setDoctorIdentifier(mobile)
    setDoctorPassword(pwd)
    setDoctorError('')
  }

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/60">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 text-cyan-900 px-3 py-1 text-xs font-black uppercase tracking-wider">
            Unique Pathology • Secure Portal Login
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#073b66]">
            {activeTab === 'doctor' ? 'Referring Doctor Portal' : 'Laboratory Administration'}
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            {activeTab === 'doctor'
              ? 'Access referred patients, custom concession tariffs, and direct lab booking requisitions.'
              : 'Laboratory operations console for managing appointments, tests, reports, and doctor accounts.'}
          </p>
        </div>

        {/* Tab Switcher: Doctor vs Admin */}
        <div className="grid grid-cols-2 rounded-2xl bg-white p-1.5 border border-slate-200 shadow-xs">
          <button
            type="button"
            onClick={() => {
              setActiveTab('doctor')
              setDoctorError('')
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              activeTab === 'doctor'
                ? 'bg-cyan-600 text-white shadow-md'
                : 'text-slate-600 hover:text-[#073b66] hover:bg-slate-50'
            }`}
          >
            <Stethoscope size={18} />
            <span>Doctor Login</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setActiveTab('admin')
              setAdminError('')
            }}
            className={`flex items-center justify-center gap-2 py-3 px-4 rounded-xl text-xs sm:text-sm font-extrabold transition ${
              activeTab === 'admin'
                ? 'bg-[#073b66] text-white shadow-md'
                : 'text-slate-600 hover:text-[#073b66] hover:bg-slate-50'
            }`}
          >
            <ShieldCheck size={18} />
            <span>Admin / Staff Login</span>
          </button>
        </div>

        {/* ========================================================= */}
        {/* TAB 1: DOCTOR LOGIN                                       */}
        {/* ========================================================= */}
        {activeTab === 'doctor' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-sm space-y-6 animate-in fade-in">
            {/* Quick Demo Doctor Switcher */}

            {/*
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-xs space-y-2.5">
              <div className="flex items-center justify-between font-extrabold text-cyan-950">
                <span className="flex items-center gap-1.5">
                  <Sparkles size={15} className="text-cyan-700" />
                  <span>1-Click Demo Doctor Credentials:</span>
                </span>
                <span className="text-[10px] text-cyan-700 font-bold bg-white px-2 py-0.5 rounded-full border border-cyan-200">
                  Password: Doctor@123
                </span>
              </div>

              <div className="grid gap-2 sm:grid-cols-3">
                <button
                  type="button"
                  onClick={() => handleQuickDoctorSelect('9826011111', 'Doctor@123')}
                  className={`text-left p-2.5 rounded-xl border transition ${
                    doctorIdentifier === '9826011111'
                      ? 'bg-white border-cyan-600 shadow-xs ring-2 ring-cyan-500/20'
                      : 'bg-white/80 border-cyan-100 hover:bg-white text-slate-700'
                  }`}
                >
                  <strong className="block text-slate-900 font-black text-xs">Dr. Ananya</strong>
                  <span className="text-[11px] font-bold text-emerald-700 block">10% Concession</span>
                  <span className="text-[10px] text-slate-500 font-mono">9826011111</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDoctorSelect('9826022222', 'Doctor@123')}
                  className={`text-left p-2.5 rounded-xl border transition ${
                    doctorIdentifier === '9826022222'
                      ? 'bg-white border-cyan-600 shadow-xs ring-2 ring-cyan-500/20'
                      : 'bg-white/80 border-cyan-100 hover:bg-white text-slate-700'
                  }`}
                >
                  <strong className="block text-slate-900 font-black text-xs">Dr. Bharat</strong>
                  <span className="text-[11px] font-bold text-emerald-700 block">20% Concession</span>
                  <span className="text-[10px] text-slate-500 font-mono">9826022222</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleQuickDoctorSelect('9826033333', 'Doctor@123')}
                  className={`text-left p-2.5 rounded-xl border transition ${
                    doctorIdentifier === '9826033333'
                      ? 'bg-white border-cyan-600 shadow-xs ring-2 ring-cyan-500/20'
                      : 'bg-white/80 border-cyan-100 hover:bg-white text-slate-700'
                  }`}
                >
                  <strong className="block text-slate-900 font-black text-xs">Dr. Chitra</strong>
                  <span className="text-[11px] font-bold text-emerald-700 block">15% Concession</span>
                  <span className="text-[10px] text-slate-500 font-mono">9826033333</span>
                </button>
              </div>
            </div>
            */}

            {doctorError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{doctorError}</span>
              </div>
            )}

            <form onSubmit={handleDoctorSubmit} className="space-y-4">
              <div>
                <label className="field-label">Doctor Mobile Number or Email Address</label>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="text"
                    required
                    value={doctorIdentifier}
                    onChange={(e) => setDoctorIdentifier(e.target.value)}
                    className="field pl-11"
                    placeholder="e.g. 9826011111 or doctor@example.com"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={doctorPassword}
                    onChange={(e) => setDoctorPassword(e.target.value)}
                    className="field pl-11"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={doctorLoading}
                className="w-full rounded-2xl bg-cyan-600 py-3.5 text-sm font-extrabold text-white shadow-lg shadow-cyan-600/25 hover:bg-cyan-700 active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {doctorLoading ? 'Signing in as Doctor...' : 'Sign In to Doctor Dashboard'}
                {!doctorLoading && <ArrowRight size={16} />}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <span>New doctor wanting to partner?</span>
              <Link to="/contact?type=doctor" className="font-bold text-cyan-700 hover:underline">
                Request Clinic Tie-up →
              </Link>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: ADMIN LOGIN                                        */}
        {/* ========================================================= */}
        {activeTab === 'admin' && (
          <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-sm space-y-6 animate-in fade-in">
            {/* Demo Admin Callout */}

             {/*
            <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-xs text-cyan-950 space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-cyan-900">
                <Sparkles size={14} className="text-cyan-700" />
                <span>Evaluation Admin Credentials:</span>
              </div>
              <div className="text-[11px] font-mono space-y-0.5 bg-white p-2.5 rounded-xl border border-cyan-200 flex items-center justify-between">
                <div>
                  <p><strong>Email:</strong> admin@uniquepathology.example</p>
                  <p><strong>Password:</strong> UniqueAdmin@2026</p>
                </div>
                <button
                  type="button"
                  onClick={() => {
                    setAdminEmail('admin@uniquepathology.example')
                    setAdminPassword('UniqueAdmin@2026')
                    setAdminError('')
                  }}
                  className="rounded-lg bg-cyan-100 px-2.5 py-1 text-[11px] font-bold text-cyan-800 hover:bg-cyan-200"
                >
                  Fill
                </button>
              </div>
            </div>
             */}

            {adminError && (
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2.5">
                <AlertCircle size={18} className="shrink-0 mt-0.5" />
                <span>{adminError}</span>
              </div>
            )}

            <form onSubmit={handleAdminSubmit} className="space-y-4">
              <div>
                <label className="field-label">Administrator Email Address</label>
                <div className="relative">
                  <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="email"
                    required
                    value={adminEmail}
                    onChange={(e) => setAdminEmail(e.target.value)}
                    className="field pl-11"
                    placeholder="admin@uniquepathology.example"
                  />
                </div>
              </div>

              <div>
                <label className="field-label">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type="password"
                    required
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    className="field pl-11"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between text-xs">
                <label className="flex items-center gap-2 cursor-pointer font-medium text-slate-600">
                  <input
                    type="checkbox"
                    checked={adminRemember}
                    onChange={(e) => setAdminRemember(e.target.checked)}
                    className="rounded border-slate-300 text-cyan-600 focus:ring-cyan-500"
                  />
                  <span>Keep administrative session active</span>
                </label>
              </div>

              <button
                type="submit"
                disabled={adminLoading}
                className="w-full rounded-2xl bg-[#073b66] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#073b66]/20 hover:bg-[#062d4e] active:scale-95 transition disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {adminLoading ? 'Authenticating Admin...' : 'Sign In to Laboratory Console'}
                {!adminLoading && <ArrowRight size={16} />}
              </button>
            </form>
          </div>
        )}

        <p className="text-center text-xs text-slate-400">
          <Link to="/" className="text-cyan-700 font-semibold hover:underline">
            ← Return to Unique Pathology Public Website
          </Link>
        </p>
      </div>
    </div>
  )
}

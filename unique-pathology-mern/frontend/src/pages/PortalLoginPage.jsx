import React, { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import {
  ShieldCheck,
  Lock,
  Mail,
  ArrowRight,
  AlertCircle,
} from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

export function PortalLoginPage() {
  const navigate = useNavigate()
  const { admin, login: adminLogin, isAuthenticated: isAdminAuthenticated } = useAuth()

  // Admin Form State
  const [adminEmail, setAdminEmail] = useState('')
  const [adminPassword, setAdminPassword] = useState('')
  const [adminRemember, setAdminRemember] = useState(true)
  const [adminLoading, setAdminLoading] = useState(false)
  const [adminError, setAdminError] = useState('')

  // Redirect if already logged in as Admin
  useEffect(() => {
    if (isAdminAuthenticated) {
      navigate('/admin')
    }
  }, [isAdminAuthenticated, navigate])

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

  return (
    <div className="min-h-[85vh] flex items-center justify-center px-4 py-12 sm:px-6 lg:px-8 bg-slate-50/60">
      <div className="w-full max-w-xl space-y-6">
        {/* Header Branding */}
        <div className="text-center space-y-2">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-100 text-cyan-900 px-3 py-1 text-xs font-black uppercase tracking-wider">
            Unique Pathology • Secure Portal Login
          </span>
          <h1 className="text-2xl sm:text-3xl font-black text-[#073b66]">
            Laboratory Administration
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 max-w-md mx-auto">
            Laboratory operations console for managing appointments, tests, reports, and doctor accounts.
          </p>
        </div>

        {/* Admin Login Card */}
        <div className="rounded-3xl border border-slate-200 bg-white p-7 sm:p-9 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <div className="p-2.5 rounded-2xl bg-cyan-50 border border-cyan-100 text-cyan-800">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h2 className="text-base font-extrabold text-[#073b66]">
                Administrator Authentication
              </h2>
              <p className="text-xs text-slate-500">
                Sign in with authorized administrative credentials to access laboratory controls.
              </p>
            </div>
          </div>

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

        <p className="text-center text-xs text-slate-400">
          <Link to="/" className="text-cyan-700 font-semibold hover:underline">
            ← Return to Unique Pathology Public Website
          </Link>
        </p>
      </div>
    </div>
  )
}

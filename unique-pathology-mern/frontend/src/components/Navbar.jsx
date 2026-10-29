import React, { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  Activity,
  ArrowRight,
  Clock3,
  MapPin,
  Menu,
  Phone,
  ShieldCheck,
  UserCheck,
  Stethoscope,
  X,
} from 'lucide-react'

export function Navbar({ publicConfig }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()

  const isActive = (path) => {
    if (path === '/' && location.pathname === '/') return true
    if (path !== '/' && location.pathname.startsWith(path)) return true
    return false
  }

  const navLinks = [
    { label: 'Home', path: '/' },
    { label: 'Tests', path: '/tests' },
    { label: 'Packages', path: '/packages' },
    { label: 'Track Status', path: '/track' },
    { label: 'About Us', path: '/about' },
    { label: 'Contact', path: '/contact' },
    { label: 'FAQs', path: '/faqs' },
  ]

  const phoneDisplay = publicConfig?.business?.phone || '[Contact Pending Verification]'
  const timings = publicConfig?.business?.timings || 'Mon–Sat: 07:00 AM – 08:00 PM | Sun: 08:00 AM – 01:00 PM'

  return (
    <header className="sticky top-0 z-40 w-full shadow-sm">
      {/* Top emergency / timings info strip - Full width left aligned */}
      <div className="bg-[#052944] text-slate-200 text-xs py-2 px-4 sm:px-6 lg:px-8 xl:px-10 border-b border-cyan-900/40">
        <div className="w-full flex flex-wrap items-center justify-between gap-3">
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="flex items-center gap-1.5 text-cyan-300 font-semibold">
              <MapPin size={13} className="text-cyan-400" />
              <span>Mandideep, Bhopal (M.P.)</span>
            </span>
            <span className="hidden md:flex items-center gap-1.5 text-slate-300">
              <Clock3 size={13} className="text-cyan-400" />
              <span>{timings}</span>
            </span>
          </div>

          <div className="flex items-center gap-4 sm:gap-6 text-[11px] font-semibold">
            <span className="hidden lg:inline-block bg-cyan-900/70 text-cyan-200 px-2.5 py-0.5 rounded-md border border-cyan-700/50">
              Home Sample Collection in Mandideep
            </span>
            {publicConfig?.business?.phone ? (
              <a
                href={`tel:${publicConfig.business.phone.replace(/[^0-9+]/g, '')}`}
                className="flex items-center gap-1 text-cyan-200 hover:text-white font-bold transition"
              >
                <Phone size={12} className="text-cyan-400" />
                <span>{phoneDisplay}</span>
              </a>
            ) : (
              <span className="flex items-center gap-1 text-slate-300">
                <Phone size={12} className="text-cyan-400" />
                <span>{phoneDisplay}</span>
              </span>
            )}

            {/* Quick Doctor Portal link */}
            <Link
              to="/doctor/login"
              className="text-cyan-300 hover:text-white transition flex items-center gap-1 font-bold border-l border-cyan-800/80 pl-3"
            >
              <Stethoscope size={12} className="text-cyan-400" />
              <span>Doctor Portal</span>
            </Link>

            {/* Quick Admin Portal link */}
            <Link
              to="/admin/login"
              className="text-cyan-300 hover:text-white transition flex items-center gap-1 font-bold border-l border-cyan-800/80 pl-3"
            >
              <UserCheck size={12} className="text-cyan-400" />
              <span>Admin Portal</span>
            </Link>
          </div>
        </div>
      </div>

      {/* Main navigation bar - Full width left anchored layout */}
      <div className="bg-white/95 backdrop-blur-md border-b border-slate-200">
        <div className="w-full flex items-center justify-between px-4 sm:px-6 lg:px-8 xl:px-10 py-3 sm:py-3.5 gap-4">
          
          {/* LEFT SECTION: Logo on the far left + Desktop Nav shifted fully to the left */}
          <div className="flex items-center gap-6 xl:gap-8 min-w-0">
            {/* Brand Logo - Shifted fully to left */}
            <Link to="/" className="flex items-center gap-2.5 sm:gap-3 shrink-0 group">
              <div className="grid h-10 w-10 sm:h-11 sm:w-11 place-items-center rounded-2xl bg-gradient-to-tr from-[#073b66] to-cyan-600 text-white shadow-md shadow-cyan-600/20 group-hover:scale-105 transition">
                <Activity size={22} className="sm:w-6 sm:h-6" />
              </div>
              <div className="shrink-0">
                <span className="block text-lg sm:text-xl font-black tracking-tight text-[#073b66] leading-none">
                  UNIQUE <span className="text-cyan-600">PATHOLOGY</span>
                </span>
                <span className="block text-[9px] sm:text-[9.5px] font-extrabold uppercase tracking-[0.2em] text-slate-500 mt-1">
                  Diagnostics • Mandideep, Bhopal
                </span>
              </div>
            </Link>

            {/* Desktop Navigation Links placed right next to logo with ample spacing */}
            <nav className="hidden lg:flex items-center gap-4 xl:gap-6 text-xs xl:text-sm font-bold text-slate-600 shrink-0">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  className={`py-1.5 transition hover:text-cyan-700 relative whitespace-nowrap ${
                    isActive(link.path)
                      ? 'text-cyan-700 font-black after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-cyan-600'
                      : ''
                  }`}
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* RIGHT SECTION: Action Buttons with dedicated spacing and divider (No overlap!) */}
          <div className="ml-auto flex items-center gap-2.5 sm:gap-3.5 shrink-0 pl-4 lg:pl-6">
            
            {/* Subtle Divider between Nav links and Action Buttons */}
            <div className="hidden lg:block h-6 w-[1px] bg-slate-200/90 mr-1" />

            {/* Access Reports Button */}
            <Link
              to="/reports"
              className="hidden md:inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 sm:px-3.5 py-2 text-xs font-bold text-[#073b66] hover:border-cyan-400 hover:bg-cyan-50/60 shadow-xs transition whitespace-nowrap"
            >
              <ShieldCheck size={15} className="text-cyan-600 shrink-0" />
              <span>Access Reports</span>
            </Link>

            {/* Book a Test Button */}
            <Link
              to="/book"
              className="hidden sm:inline-flex items-center gap-1.5 rounded-xl bg-cyan-600 px-3.5 sm:px-4 py-2 text-xs font-extrabold text-white shadow-md shadow-cyan-600/25 hover:bg-cyan-700 transition whitespace-nowrap"
            >
              <span>Book Test</span>
              <ArrowRight size={13} className="shrink-0" />
            </Link>

            {/* Unified Portal Login Button (Doctor & Staff) */}
            <Link
              to="/login"
              title="Doctor & Staff Portal Access"
              className="inline-flex items-center gap-1.5 rounded-xl bg-[#073b66] hover:bg-cyan-700 active:scale-95 text-white px-3 sm:px-3.5 py-2 text-xs font-extrabold shadow-sm transition border border-cyan-900/30 whitespace-nowrap"
            >
              <Stethoscope size={14} className="text-cyan-300 shrink-0" />
              <span>Portal Login</span>
            </Link>

            {/* Mobile hamburger toggle */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="rounded-xl p-2 text-slate-700 hover:bg-slate-100 lg:hidden shrink-0"
              aria-label="Toggle navigation menu"
            >
              {mobileMenuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {/* Mobile menu dropdown */}
        {mobileMenuOpen && (
          <div className="border-t border-slate-100 bg-white px-5 py-6 lg:hidden animate-in slide-in-from-top-2">
            <div className="flex flex-col gap-3 font-bold text-slate-700">
              {navLinks.map((link) => (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={`rounded-xl px-3 py-2.5 text-base transition ${
                    isActive(link.path) ? 'bg-cyan-50 text-cyan-800 font-black' : 'hover:bg-slate-50'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              <div className="my-2 border-t border-slate-100 pt-3 flex flex-col gap-2.5">
                <Link
                  to="/reports"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 py-3 text-sm font-bold text-[#073b66]"
                >
                  <ShieldCheck size={18} className="text-cyan-600" />
                  Access Reports Online
                </Link>

                <Link
                  to="/book"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-cyan-600 py-3 text-sm font-extrabold text-white shadow-md shadow-cyan-600/20"
                >
                  Book a Test / Home Collection
                  <ArrowRight size={16} />
                </Link>

                <Link
                  to="/doctor/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl border border-cyan-300 bg-cyan-50/80 py-3 text-sm font-extrabold text-[#073b66]"
                >
                  <Stethoscope size={18} className="text-cyan-600" />
                  Doctor Portal Login
                </Link>

                <Link
                  to="/admin/login"
                  onClick={() => setMobileMenuOpen(false)}
                  className="flex items-center justify-center gap-2 rounded-xl bg-[#073b66] text-white py-3 text-sm font-extrabold shadow-md hover:bg-cyan-700 transition"
                >
                  <UserCheck size={18} className="text-cyan-300" />
                  Staff & Admin Login
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}

import React from 'react'
import { Link } from 'react-router-dom'
import { Activity, MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react'

export function Footer({ publicConfig }) {
  const currentYear = new Date().getFullYear()
  const business = publicConfig?.business || {}

  return (
    <footer className="bg-[#031b2e] text-slate-300 text-sm">
      <div className="mx-auto max-w-7xl px-4 pt-16 pb-12 sm:px-6 lg:px-8">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-5">
          {/* Col 1: Brand & Mandideep Identity (2 cols on lg) */}
          <div className="lg:col-span-2 space-y-4">
            <div className="flex items-center gap-3">
              <span className="grid h-11 w-11 place-items-center rounded-2xl bg-cyan-500/20 text-cyan-400 border border-cyan-500/30">
                <Activity size={24} />
              </span>
              <div>
                <span className="block text-xl font-black tracking-tight text-white">
                  UNIQUE <span className="text-cyan-400">PATHOLOGY</span>
                </span>
                <span className="block text-[10px] font-extrabold uppercase tracking-[0.2em] text-cyan-200">
                  Diagnostic Centre • Mandideep, Bhopal
                </span>
              </div>
            </div>

            <p className="text-slate-400 text-xs sm:text-sm leading-6 max-w-sm">
              Providing dependable diagnostic services, biochemistry, hematology, and preventive health screenings. Proudly serving patients and families in Mandideep and the Bhopal industrial region.
            </p>

            <div className="pt-2 space-y-2 text-xs text-slate-400">
              <div className="flex items-start gap-2.5">
                <MapPin size={16} className="text-cyan-400 shrink-0 mt-0.5" />
                <span>
                  {business.address || '[Mandideep Centre, Bhopal Region, Madhya Pradesh — Exact Building Address Pending Verification]'}
                </span>
              </div>
              <div className="flex items-center gap-2.5">
                <Clock size={16} className="text-cyan-400 shrink-0" />
                <span>{business.timings || 'Monday – Saturday: 07:00 AM – 08:00 PM | Sunday: 08:00 AM – 01:00 PM'}</span>
              </div>
              <div className="flex items-center gap-2.5">
                <Mail size={16} className="text-cyan-400 shrink-0" />
                <span>{business.email || 'contact@uniquepathology.example'}</span>
              </div>
              {business.phone && (
                <div className="flex items-center gap-2.5">
                  <Phone size={16} className="text-cyan-400 shrink-0" />
                  <a href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`} className="hover:text-cyan-300 font-semibold transition">
                    {business.phone}
                  </a>
                </div>
              )}
            </div>
          </div>

          {/* Col 2: Diagnostic Services */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
              Diagnostic Tests
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/tests" className="hover:text-cyan-300 transition">Complete Blood Count (CBC)</Link>
              </li>
              <li>
                <Link to="/tests" className="hover:text-cyan-300 transition">Lipid Profile (Cholesterol)</Link>
              </li>
              <li>
                <Link to="/tests" className="hover:text-cyan-300 transition">Liver Function Test (LFT)</Link>
              </li>
              <li>
                <Link to="/tests" className="hover:text-cyan-300 transition">Kidney Function Test (KFT)</Link>
              </li>
              <li>
                <Link to="/tests" className="hover:text-cyan-300 transition">Thyroid Profile (T3, T4, TSH)</Link>
              </li>
              <li>
                <Link to="/tests" className="hover:text-cyan-300 transition">HbA1c Glycated Hemoglobin</Link>
              </li>
              <li>
                <Link to="/tests" className="hover:text-cyan-300 transition">All Tests Catalogue →</Link>
              </li>
            </ul>
          </div>

          {/* Col 3: Patients & Bookings */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
              Patient Services
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/book" className="hover:text-cyan-300 transition">Book Centre Appointment</Link>
              </li>
              <li>
                <Link to="/book" className="hover:text-cyan-300 transition">Home Sample Collection</Link>
              </li>
              <li>
                <Link to="/packages" className="hover:text-cyan-300 transition">Health Screening Packages</Link>
              </li>
              <li>
                <Link to="/track" className="hover:text-cyan-300 transition">Track Booking Status</Link>
              </li>
              <li>
                <Link to="/reports" className="hover:text-cyan-300 transition font-bold text-cyan-300">
                  Download Test Report (OTP)
                </Link>
              </li>
              <li>
                <Link to="/faqs" className="hover:text-cyan-300 transition">Fasting & Preparation FAQs</Link>
              </li>
            </ul>
          </div>

          {/* Col 4: Doctors & Partners */}
          <div>
            <h4 className="text-xs font-black uppercase tracking-[0.2em] text-cyan-400 mb-4">
              Doctors & Corporate
            </h4>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>
                <Link to="/doctor/login" className="hover:text-cyan-300 transition font-bold text-cyan-300 flex items-center gap-1.5">
                  <span>Doctor Portal Login</span>
                  <span className="text-[9px] bg-cyan-900/80 text-cyan-200 px-1.5 py-0.2 rounded border border-cyan-700">New</span>
                </Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-300 transition">Doctor Sample Pickup Enquiry</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-300 transition">Corporate & Factory Checkups</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-300 transition">Community Health Camps</Link>
              </li>
              <li>
                <Link to="/about" className="hover:text-cyan-300 transition">About Unique Pathology</Link>
              </li>
              <li>
                <Link to="/contact" className="hover:text-cyan-300 transition">Centre Location & Directions</Link>
              </li>
              <li>
                <Link to="/admin/login" className="hover:text-cyan-300 transition text-slate-400">Staff Admin Login</Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Ethical Medical Notice Bar */}
        <div className="mt-12 rounded-2xl border border-slate-800 bg-[#021422] p-4 text-[11px] leading-5 text-slate-400">
          <p>
            <strong className="text-slate-300">Medical Notice & Tariffs:</strong> Diagnostic test descriptions and demo pricing published on this starter portal are intended for reference and booking requests. Testing does not substitute formal consultation with a registered medical specialist. Final pricing, specimen suitability, and report release times are verified directly by Unique Pathology staff in Mandideep, Bhopal, M.P.
          </p>
        </div>

        {/* Bottom copyright & legal links */}
        <div className="mt-8 pt-8 border-t border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {currentYear} Unique Pathology, Mandideep, Bhopal. All rights reserved.</p>
          <div className="flex flex-wrap items-center gap-5">
            <Link to="/privacy" className="hover:text-slate-300 transition">Privacy Policy</Link>
            <Link to="/terms" className="hover:text-slate-300 transition">Terms of Service</Link>
            <Link to="/faqs" className="hover:text-slate-300 transition">Help & FAQs</Link>
            <Link to="/doctor/login" className="hover:text-cyan-300 transition font-bold text-cyan-400">Doctor Portal</Link>
            <Link to="/admin/login" className="hover:text-slate-300 transition">Admin Portal</Link>
          </div>
        </div>
      </div>
    </footer>
  )
}

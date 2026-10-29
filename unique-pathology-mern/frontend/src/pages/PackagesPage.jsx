import React, { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  HeartPulse,
  CheckCircle2,
  Clock,
  ShieldCheck,
  AlertCircle,
  ArrowRight,
  Info,
  CalendarCheck,
} from 'lucide-react'
import { apiRequest } from '../api.js'
import { PriceBadge } from '../components/PriceBadge.jsx'
import { useScrollReveal } from '../hooks/useScrollReveal.js'

export function PackagesPage() {
  const [packages, setPackages] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useScrollReveal([packages.length])

  useEffect(() => {
    async function fetchPackages() {
      try {
        const data = await apiRequest('/packages')
        setPackages(data.packages || [])
      } catch (err) {
        setError('Could not load health packages.')
      } finally {
        setLoading(false)
      }
    }
    fetchPackages()
  }, [])

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      {/* Title */}
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Preventive Diagnostics
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Comprehensive Health Screening Packages
        </h1>
        <p className="text-sm text-slate-600 max-w-2xl leading-6">
          Carefully configured multi-organ panels designed to detect silent risk factors early. Bundled tests offer holistic insights with single-visit convenience.
        </p>
      </div>

      {/* Advisory Banner */}
      <div className="rounded-2xl border border-blue-200 bg-blue-50/70 p-4 text-xs leading-5 text-blue-900 flex items-start gap-3">
        <Info size={18} className="shrink-0 text-blue-700 mt-0.5" />
        <div>
          <strong className="block font-bold">Preparation & Home Visit:</strong>
          Most health packages require 10–12 hours overnight fasting (water is allowed). Home sample collection across Mandideep can be scheduled directly during the booking process.
        </div>
      </div>

      {loading ? (
        <div className="py-20 text-center space-y-3">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-cyan-600 border-t-transparent" />
          <p className="text-sm font-semibold text-slate-500">Loading screening packages...</p>
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700">
          <p className="font-bold">{error}</p>
        </div>
      ) : (
        <div className="grid gap-8 lg:grid-cols-3">
          {packages.map((pkg) => (
            <div
              key={pkg.code}
              className="rounded-3xl border-2 border-slate-200 bg-white p-7 shadow-sm hover:border-cyan-400 hover:shadow-xl transition flex flex-col justify-between reveal-on-scroll is-visible"
            >
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <span className="rounded-full bg-cyan-50 px-3 py-1 text-xs font-extrabold text-cyan-800 border border-cyan-200">
                    {pkg.category}
                  </span>
                  {pkg.badge && (
                    <span className="rounded-full bg-amber-50 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-amber-800 border border-amber-200">
                      {pkg.badge}
                    </span>
                  )}
                </div>

                <div>
                  <h3 className="text-2xl font-black text-[#073b66]">{pkg.name}</h3>
                  <p className="mt-1 text-xs text-slate-500 font-semibold">{pkg.tagline}</p>
                </div>

                <p className="text-xs text-slate-600 leading-5">{pkg.description}</p>

                {/* Preparation info */}
                <div className="rounded-xl bg-slate-50 p-3 text-xs text-slate-600 space-y-1 border border-slate-100">
                  <div>
                    <strong className="text-slate-800">Fasting:</strong>{' '}
                    <span>{pkg.fastingInstructions}</span>
                  </div>
                  <div>
                    <strong className="text-slate-800">Specimen:</strong>{' '}
                    <span>{pkg.sampleType}</span>
                  </div>
                </div>

                {/* Included Tests Breakdown */}
                <div className="border-t border-slate-100 pt-4">
                  <h4 className="text-xs font-black uppercase tracking-wider text-slate-800 mb-3">
                    Includes {pkg.testsIncluded?.length || 0} Test Parameters:
                  </h4>
                  <ul className="space-y-2 text-xs text-slate-600">
                    {pkg.testsIncluded?.map((t) => (
                      <li key={t} className="flex items-start gap-2">
                        <CheckCircle2 size={15} className="text-cyan-600 shrink-0 mt-0.5" />
                        <span>{t}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Price & Action Footer */}
              <div className="mt-8 pt-6 border-t border-slate-100 space-y-4">
                <PriceBadge
                  pricePaise={pkg.pricePaise}
                  mrpPaise={pkg.mrpPaise}
                  isVerifiedPrice={pkg.isVerifiedPrice}
                  priceNote={pkg.priceNote}
                />

                <Link
                  to={`/book?package=${encodeURIComponent(pkg.name)}`}
                  className="block w-full rounded-xl bg-cyan-600 py-3.5 text-center text-sm font-extrabold text-white shadow-md shadow-cyan-600/25 hover:bg-cyan-700 transition"
                >
                  Book Package Now
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

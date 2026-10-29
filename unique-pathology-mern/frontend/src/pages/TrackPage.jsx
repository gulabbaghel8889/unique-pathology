import React, { useState, useEffect } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import {
  Search,
  Clock,
  CheckCircle2,
  AlertCircle,
  XCircle,
  Calendar,
  Home,
  Building2,
  CreditCard,
  Ban,
  ArrowRight,
  ShieldCheck,
} from 'lucide-react'
import { apiRequest } from '../api.js'

export function TrackPage() {
  const [searchParams, setSearchParams] = useSearchParams()
  const initialRef = searchParams.get('ref') || ''

  const [reference, setReference] = useState(initialRef)
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Cancellation modal state
  const [cancelModalOpen, setCancelModalOpen] = useState(false)
  const [cancelPhone, setCancelPhone] = useState('')
  const [cancelReason, setCancelReason] = useState('')
  const [cancelBusy, setCancelBusy] = useState(false)
  const [cancelNotice, setCancelNotice] = useState('')

  useEffect(() => {
    if (initialRef.trim()) {
      lookupBooking(initialRef.trim())
    }
  }, [initialRef])

  async function lookupBooking(refId) {
    if (!refId) return
    setLoading(true)
    setError('')
    try {
      const data = await apiRequest(`/bookings/track/${encodeURIComponent(refId.trim())}`)
      setBooking(data.booking)
    } catch (err) {
      setBooking(null)
      setError(err.message || 'No booking found matching this Reference ID.')
    } finally {
      setLoading(false)
    }
  }

  function handleSearchSubmit(e) {
    e.preventDefault()
    if (reference.trim()) {
      setSearchParams({ ref: reference.trim().toUpperCase() })
      lookupBooking(reference.trim())
    }
  }

  async function handleCancelSubmit(e) {
    e.preventDefault()
    setCancelBusy(true)
    setCancelNotice('')
    try {
      await apiRequest(`/bookings/${encodeURIComponent(booking.reference)}/cancel`, {
        method: 'POST',
        body: JSON.stringify({ phone: cancelPhone.trim(), reason: cancelReason.trim() }),
      })
      setCancelNotice('Booking cancelled successfully.')
      setCancelModalOpen(false)
      lookupBooking(booking.reference)
    } catch (err) {
      setCancelNotice(err.message || 'Cancellation failed. Please check your phone number.')
    } finally {
      setCancelBusy(false)
    }
  }

  const statusSteps = [
    { key: 'requested', label: 'Requested' },
    { key: 'confirmed', label: 'Confirmed' },
    { key: 'sample_collected', label: 'Sample Collected' },
    { key: 'processing', label: 'Processing in Lab' },
    { key: 'completed', label: 'Report Ready' },
  ]

  const getStepIndex = (status) => {
    const idx = statusSteps.findIndex((s) => s.key === status)
    return idx === -1 ? 0 : idx
  }

  const currentStepIdx = booking ? getStepIndex(booking.status) : 0
  const isCancelled = booking?.status === 'cancelled'

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Page Title */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Booking Management
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Track Your Diagnostic Appointment
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-6">
          Enter your unique booking reference ID (e.g. <span className="font-mono font-bold text-cyan-800">UP-DEMO-2026</span>) to view appointment status, phlebotomist assignment, and report availability.
        </p>
      </div>

      {/* Lookup Bar */}
      <form onSubmit={handleSearchSubmit} className="max-w-xl mx-auto">
        <div className="flex rounded-2xl bg-white p-2 shadow-md border border-slate-200 focus-within:border-cyan-500 focus-within:ring-4 focus-within:ring-cyan-100">
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              type="text"
              required
              value={reference}
              onChange={(e) => setReference(e.target.value.toUpperCase())}
              placeholder="Enter Booking Reference (e.g. UP-DEMO-2026)..."
              className="w-full bg-transparent py-3 pl-11 pr-4 text-sm font-bold text-slate-800 placeholder-slate-400 outline-none uppercase font-mono"
            />
          </div>
          <button
            type="submit"
            disabled={loading}
            className="rounded-xl bg-[#073b66] px-6 py-3 text-xs sm:text-sm font-extrabold text-white hover:bg-cyan-700 transition"
          >
            {loading ? 'Searching...' : 'Track'}
          </button>
        </div>
      </form>

      {cancelNotice && (
        <div className="rounded-2xl border border-cyan-200 bg-cyan-50 p-4 text-xs font-bold text-cyan-900 text-center">
          {cancelNotice}
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-center text-red-700 space-y-2">
          <AlertCircle size={28} className="mx-auto" />
          <p className="font-bold">{error}</p>
          <p className="text-xs text-red-600">
            Please verify the reference code printed on your booking receipt or confirmation SMS. Try <strong className="font-mono">UP-DEMO-2026</strong> for testing.
          </p>
        </div>
      )}

      {/* Booking Status Card */}
      {booking && (
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-8 animate-in fade-in">
          {/* Header */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-100 pb-6">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-slate-400 block">
                Appointment Reference
              </span>
              <span className="text-2xl font-black text-[#073b66] font-mono">
                {booking.reference}
              </span>
            </div>

            <div className="text-right">
              <span className="text-xs text-slate-400 block font-semibold">Scheduled Date</span>
              <span className="text-sm font-bold text-slate-800">
                {booking.date} ({booking.timeSlot})
              </span>
            </div>
          </div>

          {/* Cancellation Banner if cancelled */}
          {isCancelled ? (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-6 text-red-800 space-y-2">
              <div className="flex items-center gap-2 font-bold text-base">
                <XCircle size={20} className="text-red-600" />
                This Appointment Has Been Cancelled
              </div>
              <p className="text-xs leading-5 text-red-700">
                Reason: {booking.cancellationReason || 'Cancelled upon request.'}
              </p>
            </div>
          ) : (
            /* Progress Workflow Tracker */
            <div className="space-y-4">
              <span className="text-xs font-black uppercase tracking-wider text-cyan-800 block">
                Live Progression Timeline
              </span>

              <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pt-2">
                {statusSteps.map((step, idx) => {
                  const isDone = currentStepIdx >= idx
                  const isCurrent = currentStepIdx === idx
                  return (
                    <div
                      key={step.key}
                      className={`rounded-2xl p-3.5 border transition ${
                        isCurrent
                          ? 'border-cyan-500 bg-cyan-50/70 text-cyan-900 ring-2 ring-cyan-500/20'
                          : isDone
                          ? 'border-emerald-200 bg-emerald-50/50 text-emerald-900'
                          : 'border-slate-100 bg-slate-50 text-slate-400'
                      }`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-[11px] font-black">0{idx + 1}</span>
                        {isDone ? (
                          <CheckCircle2 size={16} className={isCurrent ? 'text-cyan-600' : 'text-emerald-600'} />
                        ) : (
                          <Clock size={14} className="text-slate-300" />
                        )}
                      </div>
                      <span className="block text-xs font-bold leading-tight">{step.label}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Details Grid */}
          <div className="grid gap-6 sm:grid-cols-2 pt-4 border-t border-slate-100">
            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Tests / Packages Booked
              </h3>
              <ul className="space-y-1.5 text-xs text-slate-700">
                {booking.items?.map((item) => (
                  <li key={item.name} className="flex items-center gap-2 font-bold text-[#073b66]">
                    <span className="h-1.5 w-1.5 rounded-full bg-cyan-600" />
                    <span>{item.name}</span>
                  </li>
                ))}
              </ul>
            </div>

            <div className="space-y-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-slate-400">
                Collection Mode & Payment
              </h3>
              <div className="text-xs text-slate-700 space-y-1">
                <p>
                  <strong>Collection:</strong>{' '}
                  <span className="capitalize">
                    {booking.collectionType === 'home' ? 'Home Sample Collection' : 'Diagnostic Centre Visit'}
                  </span>
                </p>
                <p>
                  <strong>Payment Status:</strong>{' '}
                  <span
                    className={`font-bold capitalize ${
                      booking.paymentStatus === 'paid' ? 'text-emerald-600' : 'text-amber-700'
                    }`}
                  >
                    {booking.paymentStatus?.replace('_', ' ')}
                  </span>
                </p>
                <p>
                  <strong>Tariff:</strong>{' '}
                  {booking.hasUnverifiedPrices
                    ? 'Demo / Indicative Tariff (Confirmed at collection)'
                    : `₹${booking.totalAmountPaise / 100}`}
                </p>
              </div>
            </div>
          </div>

          {/* Action Row */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-6 border-t border-slate-100">
            {booking.status === 'completed' ? (
              <Link
                to={`/reports?ref=${encodeURIComponent(booking.reference)}`}
                className="inline-flex items-center gap-2 rounded-xl bg-cyan-600 px-5 py-3 text-xs font-extrabold text-white hover:bg-cyan-700 transition"
              >
                <ShieldCheck size={16} />
                <span>Access Digital Report Online (OTP)</span>
              </Link>
            ) : (
              <div className="text-xs text-slate-500">
                Digital reports will be available for secure download once testing is completed.
              </div>
            )}

            {/* Cancel booking if still requested or confirmed */}
            {!isCancelled && ['requested', 'confirmed'].includes(booking.status) && (
              <button
                type="button"
                onClick={() => setCancelModalOpen(true)}
                className="inline-flex items-center gap-1.5 text-xs font-bold text-red-600 hover:text-red-800"
              >
                <Ban size={14} />
                <span>Cancel Appointment</span>
              </button>
            )}
          </div>
        </div>
      )}

      {/* Cancellation Modal */}
      {cancelModalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setCancelModalOpen(false)}>
          <div className="modal-panel max-w-md p-6 sm:p-7 space-y-4">
            <h3 className="text-lg font-black text-[#073b66]">Cancel Appointment</h3>
            <p className="text-xs text-slate-500 leading-5">
              To verify your identity, please enter the registered 10-digit mobile number used when creating this booking.
            </p>

            <form onSubmit={handleCancelSubmit} className="space-y-4">
              <div>
                <label className="field-label">Registered Phone Number</label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={cancelPhone}
                  onChange={(e) => setCancelPhone(e.target.value)}
                  placeholder="10-digit mobile number"
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">Reason for Cancellation (optional)</label>
                <textarea
                  rows={3}
                  value={cancelReason}
                  onChange={(e) => setCancelReason(e.target.value)}
                  placeholder="e.g. Schedule conflict / Rescheduled with physician"
                  className="field"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={cancelBusy}
                  className="flex-1 rounded-xl bg-red-600 py-3 text-xs font-bold text-white hover:bg-red-700 transition disabled:opacity-50"
                >
                  {cancelBusy ? 'Cancelling...' : 'Confirm Cancellation'}
                </button>
                <button
                  type="button"
                  onClick={() => setCancelModalOpen(false)}
                  className="rounded-xl border border-slate-200 px-4 py-3 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                >
                  Keep Appointment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

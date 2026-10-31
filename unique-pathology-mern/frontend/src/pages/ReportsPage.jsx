import React, { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  ShieldCheck,
  KeyRound,
  FileText,
  Download,
  AlertCircle,
  CheckCircle2,
  Lock,
  Clock,
  Sparkles,
  Info,
  MessageSquare,
  RotateCw,
} from 'lucide-react'
import { apiRequest, API_BASE } from '../api.js'

export function ReportsPage() {
  const [searchParams] = useSearchParams()
  const initialRef = searchParams.get('ref') || ''

  const [reference, setReference] = useState(initialRef)
  const [phone, setPhone] = useState('')
  const [otpCode, setOtpCode] = useState('')

  // State workflow: 'idle' -> 'otp_sent' -> 'verified'
  const [step, setStep] = useState('idle')
  const [sandboxCode, setSandboxCode] = useState('')
  const [expiresAt, setExpiresAt] = useState(null)
  const [downloadToken, setDownloadToken] = useState('')
  const [reportInfo, setReportInfo] = useState(null)

  // Real SMS state
  const [maskedPhone, setMaskedPhone] = useState('')
  const [smsDelivered, setSmsDelivered] = useState(false)
  const [resendCountdown, setResendCountdown] = useState(0)

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  useEffect(() => {
    if (initialRef) setReference(initialRef.toUpperCase())
  }, [initialRef])

  // Resend countdown ticker
  useEffect(() => {
    let timer
    if (resendCountdown > 0) {
      timer = setTimeout(() => setResendCountdown((c) => c - 1), 1000)
    }
    return () => clearTimeout(timer)
  }, [resendCountdown])

  // Step 1 -> Step 2: Request OTP
  async function handleRequestOtp(e) {
    e.preventDefault()
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const data = await apiRequest('/reports/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          bookingReference: reference.trim().toUpperCase(),
          phone: phone.trim(),
        }),
      })

      setStep('otp_sent')
      setExpiresAt(data.expiresAt)
      setSandboxCode(data.sandboxCode || '')
      setMaskedPhone(data.maskedPhone || `+91 ******${phone.trim().slice(-4)}`)
      setSmsDelivered(Boolean(data.smsDelivered))
      setSuccessMsg(data.message || 'Verification code sent via SMS.')
      setResendCountdown(30)
    } catch (err) {
      setError(err.message || 'Could not verify booking and report record.')
    } finally {
      setLoading(false)
    }
  }

  // Resend SMS OTP
  async function handleResendOtp() {
    if (resendCountdown > 0) return
    setError('')
    setSuccessMsg('')
    setLoading(true)

    try {
      const data = await apiRequest('/reports/request-otp', {
        method: 'POST',
        body: JSON.stringify({
          bookingReference: reference.trim().toUpperCase(),
          phone: phone.trim(),
        }),
      })

      setExpiresAt(data.expiresAt)
      setSandboxCode(data.sandboxCode || '')
      setSmsDelivered(Boolean(data.smsDelivered))
      setSuccessMsg(data.message || 'New verification code dispatched via SMS.')
      setResendCountdown(30)
    } catch (err) {
      setError(err.message || 'Could not resend verification code.')
    } finally {
      setLoading(false)
    }
  }

  // Step 2 -> Step 3: Verify OTP & get download token
  async function handleVerifyOtp(e) {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const data = await apiRequest('/reports/verify-otp', {
        method: 'POST',
        body: JSON.stringify({
          bookingReference: reference.trim().toUpperCase(),
          phone: phone.trim(),
          code: otpCode.trim(),
        }),
      })

      setStep('verified')
      setDownloadToken(data.downloadToken || '')
      setReportInfo(data.reportInfo)
      if (data.isPaymentPending || data.paymentStatus !== 'paid') {
        setError('Payment Pending. Please clear payment before downloading the report.')
      } else {
        setSuccessMsg('Identity verified! Your diagnostic report is ready for secure download.')
      }
    } catch (err) {
      setError(err.message || 'Invalid or expired verification code.')
    } finally {
      setLoading(false)
    }
  }

  // Download action
  function handleDownloadReport() {
    if (!reportInfo || reportInfo.paymentStatus !== 'paid' || reportInfo.isPaymentPending) {
      setError('Payment Pending. Please clear payment before downloading the report.')
      return
    }
    if (!downloadToken) {
      setError('Download session expired or invalid. Please request a new verification code.')
      return
    }
    const downloadUrl = `${API_BASE}/reports/download/${downloadToken}`
    window.location.href = downloadUrl
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="inline-flex items-center gap-1.5 rounded-full bg-cyan-50 px-3 py-1 text-xs font-black uppercase tracking-[0.2em] text-cyan-800 border border-cyan-200">
          <ShieldCheck size={14} className="text-cyan-600" />
          Zero-Trust Patient Portal
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Access Your Diagnostic Report
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-6">
          To protect patient confidentiality, all diagnostic reports require 2-step phone verification and are delivered via time-limited, encrypted download streams.
        </p>
      </div>

      {/* Demo Sandbox Helper Callout */}
      <div className="rounded-2xl border border-cyan-200 bg-cyan-50/70 p-4 text-xs leading-5 text-cyan-900">
        <div className="flex gap-2.5">
          <Sparkles size={18} className="shrink-0 text-cyan-700 mt-0.5" />
          <div>
            <strong className="block font-bold">Try the Demonstration Report:</strong>
            Use Booking Reference: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-cyan-300">UP-DEMO-2026</strong> and Registered Phone: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-cyan-300">9876543210</strong> to test the verification and PDF download workflow.
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2.5">
          <AlertCircle size={18} className="shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      {successMsg && (
        <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-start gap-2.5">
          <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
          <span>{successMsg}</span>
        </div>
      )}

      {/* STEP 1: Enter Reference & Phone */}
      {step === 'idle' && (
        <form onSubmit={handleRequestOtp} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
              <KeyRound size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#073b66]">Step 1: Patient Identification</h2>
              <p className="text-xs text-slate-500">Enter reference ID and mobile number registered at the lab</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="field-label">Booking Reference ID</label>
              <input
                type="text"
                required
                value={reference}
                onChange={(e) => setReference(e.target.value.toUpperCase())}
                placeholder="e.g. UP-DEMO-2026"
                className="field font-mono font-bold uppercase"
              />
            </div>

            <div>
              <label className="field-label">Registered 10-Digit Mobile Number</label>
              <input
                type="tel"
                required
                pattern="[0-9]{10}"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="e.g. 9876543210"
                className="field font-mono"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full rounded-2xl bg-[#073b66] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#073b66]/20 hover:bg-[#062d4e] transition disabled:opacity-50"
          >
            {loading ? 'Verifying Records...' : 'Request One-Time Verification Code (OTP)'}
          </button>
        </form>
      )}

      {/* STEP 2: Enter OTP */}
      {step === 'otp_sent' && (
        <form onSubmit={handleVerifyOtp} className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6 animate-in fade-in">
          <div className="flex items-center gap-3 border-b border-slate-100 pb-4">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-cyan-50 text-cyan-700">
              <Lock size={20} />
            </span>
            <div>
              <h2 className="text-base font-bold text-[#073b66]">Step 2: Enter SMS Verification Code</h2>
              <p className="text-xs text-slate-500">Sent to phone registered with {reference}</p>
            </div>
          </div>

          {/* Real SMS dispatch notice */}
          <div className="rounded-2xl border border-cyan-200 bg-gradient-to-r from-cyan-50 to-blue-50 p-4 text-xs text-cyan-950 flex items-start gap-3.5">
            <div className="grid h-9 w-9 place-items-center rounded-xl bg-cyan-600 text-white shrink-0 mt-0.5 shadow-sm">
              <MessageSquare size={18} />
            </div>
            <div className="space-y-1 flex-1">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <strong className="font-extrabold text-slate-900 text-sm">SMS OTP Dispatched</strong>
                {smsDelivered ? (
                  <span className="rounded-full bg-emerald-100 text-emerald-800 font-extrabold px-2.5 py-0.5 text-[10px] border border-emerald-300">
                    Live Mobile SMS Delivered
                  </span>
                ) : (
                  <span className="rounded-full bg-cyan-100 text-cyan-900 font-extrabold px-2.5 py-0.5 text-[10px] border border-cyan-300">
                    Carrier SMS Gateway Active
                  </span>
                )}
              </div>
              <p className="text-slate-600 text-xs">
                A 6-digit confidential verification code has been dispatched via SMS to your registered number{' '}
                <strong className="font-mono text-slate-900 font-bold">{maskedPhone}</strong>. Valid for 10 minutes.
              </p>
            </div>
          </div>

          {/* Sandbox code badge for development testing */}
          {sandboxCode && (
            <div className="rounded-2xl border border-emerald-300 bg-emerald-50/80 p-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-center sm:text-left">
              <div>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 block">
                  Evaluation / Sandbox Code Detected
                </span>
                <span className="text-2xl font-black font-mono text-emerald-900 tracking-widest block mt-0.5">
                  {sandboxCode}
                </span>
                <p className="text-[11px] text-emerald-700">
                  (For testing without active SMS credit)
                </p>
              </div>

              <button
                type="button"
                onClick={() => setOtpCode(sandboxCode)}
                className="rounded-xl bg-emerald-700 px-4 py-2 text-xs font-bold text-white hover:bg-emerald-800 shadow-sm transition active:scale-95 shrink-0"
              >
                Auto-Fill Code
              </button>
            </div>
          )}

          <div>
            <label className="field-label text-center">Enter 6-Digit Code</label>
            <input
              type="text"
              required
              maxLength={6}
              pattern="[0-9]{6}"
              value={otpCode}
              onChange={(e) => setOtpCode(e.target.value)}
              placeholder="••••••"
              className="field text-center text-3xl font-mono tracking-widest font-black max-w-xs mx-auto py-3 border-2 focus:border-cyan-600"
            />
          </div>

          <div className="flex gap-3">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 rounded-2xl bg-[#073b66] py-3.5 text-sm font-extrabold text-white shadow-lg hover:bg-[#062d4e] transition disabled:opacity-50"
            >
              {loading ? 'Verifying Code...' : 'Verify Code & Access Report'}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep('idle')
                setOtpCode('')
              }}
              className="rounded-2xl border border-slate-200 px-4 py-3.5 text-xs font-bold text-slate-600 hover:bg-slate-50"
            >
              Back
            </button>
          </div>

          <div className="flex items-center justify-between text-xs text-slate-500 pt-3 border-t border-slate-100">
            <span>Didn't receive the SMS message?</span>
            {resendCountdown > 0 ? (
              <span className="font-bold text-slate-400">Resend SMS in {resendCountdown}s</span>
            ) : (
              <button
                type="button"
                onClick={handleResendOtp}
                disabled={loading}
                className="font-bold text-cyan-700 hover:text-cyan-800 underline inline-flex items-center gap-1"
              >
                <RotateCw size={12} />
                <span>Resend SMS OTP</span>
              </button>
            )}
          </div>
        </form>
      )}

      {/* STEP 3: Report Download Ready */}
      {step === 'verified' && reportInfo && (
        <div
          className={`rounded-3xl border-2 bg-white p-8 sm:p-10 shadow-xl space-y-6 animate-in zoom-in-95 ${
            reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending
              ? 'border-emerald-300'
              : 'border-amber-300'
          }`}
        >
          <div className="flex items-start justify-between border-b border-slate-100 pb-5">
            <div className="flex items-center gap-3">
              <span
                className={`grid h-12 w-12 place-items-center rounded-2xl ${
                  reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending
                    ? 'bg-emerald-50 text-emerald-600'
                    : 'bg-amber-50 text-amber-600'
                }`}
              >
                {reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending ? (
                  <FileText size={26} />
                ) : (
                  <Lock size={26} />
                )}
              </span>
              <div>
                <span
                  className={`text-xs font-black uppercase tracking-wider ${
                    reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending
                      ? 'text-emerald-700'
                      : 'text-amber-700'
                  }`}
                >
                  {reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending
                    ? 'Verified Official Report'
                    : 'Report Ready — Payment Pending'}
                </span>
                <h2 className="text-xl font-black text-[#073b66]">{reportInfo.reportTitle}</h2>
              </div>
            </div>

            {reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending ? (
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-xs font-black text-emerald-800">
                Ready to Download
              </span>
            ) : (
              <span className="rounded-full bg-amber-100 px-3 py-1 text-xs font-black text-amber-800">
                Payment Pending
              </span>
            )}
          </div>

          {/* Payment Pending Alert Notice */}
          {!(reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending) && (
            <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-xs font-bold text-amber-900 flex items-start gap-3">
              <AlertCircle size={20} className="shrink-0 text-amber-700 mt-0.5" />
              <div className="space-y-1">
                <strong className="block text-sm font-extrabold text-amber-950">
                  Payment Pending. Please clear payment before downloading the report.
                </strong>
                <p className="font-normal text-amber-800">
                  The clinical diagnostic report has been verified and released by the laboratory pathologist, but download access is restricted until test payment is settled. Please visit our Mandideep diagnostic centre or contact reception at +91 89620 38429 to clear your dues.
                </p>
              </div>
            </div>
          )}

          {/* Details table */}
          <div className="rounded-2xl bg-slate-50 p-4 border border-slate-200/80 space-y-2 text-xs">
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Patient Name:</span>
              <span className="font-bold text-slate-800">{reportInfo.patientName}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Booking Reference:</span>
              <span className="font-bold font-mono text-[#073b66]">{reportInfo.bookingReference}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Tests Covered:</span>
              <span className="font-bold text-slate-800">{reportInfo.testNames?.join(', ')}</span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Payment Status:</span>
              <span
                className={`font-black uppercase tracking-wider px-2 py-0.5 rounded text-[10px] ${
                  reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending
                    ? 'bg-emerald-100 text-emerald-800'
                    : 'bg-amber-100 text-amber-800'
                }`}
              >
                {reportInfo.paymentStatus || 'pending'}
              </span>
            </div>
            <div className="flex justify-between py-1 border-b border-slate-200/50">
              <span className="text-slate-500 font-medium">Verified By:</span>
              <span className="font-bold text-slate-800">{reportInfo.verifiedBy}</span>
            </div>
            <div className="flex justify-between py-1">
              <span className="text-slate-500 font-medium">Format & Size:</span>
              <span className="font-bold text-slate-800">PDF • {Math.round(reportInfo.fileSizeBytes / 1024)} KB</span>
            </div>
          </div>

          {/* Download button */}
          {reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending ? (
            <button
              onClick={handleDownloadReport}
              className="w-full rounded-2xl bg-cyan-600 py-4 text-base font-extrabold text-white shadow-xl shadow-cyan-600/25 hover:bg-cyan-700 transition flex items-center justify-center gap-2"
            >
              <Download size={20} />
              <span>Download Official PDF Diagnostic Report</span>
            </button>
          ) : (
            <button
              type="button"
              disabled
              className="w-full rounded-2xl bg-slate-200 py-4 text-base font-extrabold text-slate-400 cursor-not-allowed flex items-center justify-center gap-2 border border-slate-300"
              title="Payment Pending. Please clear payment before downloading the report."
            >
              <Lock size={20} />
              <span>Download Report (Disabled — Payment Pending)</span>
            </button>
          )}

          <p className="text-[11px] text-center text-slate-400">
            {reportInfo.paymentStatus === 'paid' && !reportInfo.isPaymentPending
              ? 'For security, this download token will automatically expire after 15 minutes. Report access has been recorded in the lab regulatory audit trail.'
              : 'Download access will be automatically unlocked immediately once payment status is updated to PAID.'}
          </p>
        </div>
      )}
    </div>
  )
}

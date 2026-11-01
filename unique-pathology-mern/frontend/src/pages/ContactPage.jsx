import React, { useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import {
  MapPin,
  Clock,
  Phone,
  Mail,
  Send,
  CheckCircle2,
  AlertCircle,
  Building2,
  Stethoscope,
  Users,
  Compass,
} from 'lucide-react'
import { apiRequest } from '../api.js'

export function ContactPage({ publicConfig }) {
  const [searchParams] = useSearchParams()
  const initialType = searchParams.get('type') === 'doctor' ? 'doctor' : 'general'

  const [enquiryType, setEnquiryType] = useState(initialType)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    organization: '',
    city: 'Mandideep / Bhopal Region',
    subject: '',
    message: '',
  })

  const [submitting, setSubmitting] = useState(false)
  const [successMsg, setSuccessMsg] = useState('')
  const [errorMsg, setErrorMsg] = useState('')

  async function handleSubmit(e) {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')
    setSubmitting(true)

    try {
      const payload = {
        type: enquiryType,
        name: formData.name.trim(),
        email: formData.email.trim(),
        phone: formData.phone.trim(),
        organization: formData.organization.trim() || undefined,
        city: formData.city.trim() || 'Mandideep',
        subject: formData.subject.trim() || undefined,
        message: formData.message.trim(),
      }

      const res = await apiRequest('/enquiries', {
        method: 'POST',
        body: JSON.stringify(payload),
      })

      setSuccessMsg(res.message || 'Your enquiry has been received. Our team will contact you shortly.')
      setFormData({
        name: '',
        email: '',
        phone: '',
        organization: '',
        city: 'Mandideep / Bhopal Region',
        subject: '',
        message: '',
      })
    } catch (err) {
      setErrorMsg(err.message || 'Failed to submit enquiry. Please verify the form inputs.')
    } finally {
      setSubmitting(false)
    }
  }

  const business = publicConfig?.business || {}

  return (
    <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
      {/* Header */}
      <div className="text-center max-w-2xl mx-auto space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Get in Touch
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Contact Unique Pathology
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-6">
          Whether you are a patient asking about a test, a clinician requesting daily sample pickup, or a corporate HR planning health checkups, we are here to assist.
        </p>
      </div>

      <div className="grid gap-10 lg:grid-cols-[1fr_1.3fr] items-start">
        {/* Left Column: Centre Info Cards */}
        <div className="space-y-6">
          <div className="rounded-3xl border border-slate-200 bg-white p-7 shadow-sm space-y-6">
            <h2 className="text-lg font-black text-[#073b66]">Diagnostic Centre Information</h2>

            <div className="space-y-4 text-xs text-slate-700">
              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                  <MapPin size={16} />
                </span>
                <div>
                  <strong className="block font-bold text-slate-900">Laboratory Address</strong>
                  <p className="mt-0.5 leading-5 text-slate-600">
                    {business.address || '[Mandideep Centre, Bhopal Region, Madhya Pradesh — Exact Building Address Pending Verification]'}
                  </p>
                  <span className="text-[10px] text-amber-700 font-semibold block mt-1">
                    (Final premises verification by diagnostic licensing authorities in progress)
                  </span>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                  <Clock size={16} />
                </span>
                <div>
                  <strong className="block font-bold text-slate-900">Operating Hours</strong>
                  <p className="mt-0.5 leading-5 text-slate-600">
                    {business.timings || 'Mon–Sat: 07:00 AM – 08:00 PM | Sun: 08:00 AM – 01:00 PM'}
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                  <Phone size={16} />
                </span>
                <div>
                  <strong className="block font-bold text-slate-900">Telephone / Helpline</strong>
                  {business.phone ? (
                    <div className="flex flex-wrap items-center gap-2 mt-0.5">
                      <a
                        href={`tel:${business.phone.replace(/[^0-9+]/g, '')}`}
                        className="font-bold text-[#073b66] hover:text-cyan-700 text-sm transition"
                      >
                        {business.phone}
                      </a>
                      {business.isWhatsAppConfigured && (
                        <a
                          href={`https://wa.me/91${business.whatsappNumber}?text=Hello%20Unique%20Pathology%2C%20I%20would%20like%20to%20enquire%20about%20tests.`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-[10px] font-black text-emerald-800 hover:bg-emerald-200 transition"
                        >
                          Chat on WhatsApp ↗
                        </a>
                      )}
                    </div>
                  ) : (
                    <p className="mt-0.5 leading-5 text-slate-600">
                      [Telephone line pending formal lab activation]
                    </p>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <span className="grid h-8 w-8 place-items-center rounded-lg bg-cyan-50 text-cyan-700 shrink-0">
                  <Mail size={16} />
                </span>
                <div>
                  <strong className="block font-bold text-slate-900">Official Email</strong>
                  <p className="mt-0.5 leading-5 text-slate-600">
                    {business.email || 'contact@uniquepathology.example'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Interactive Directions Card Placeholder */}
          <div className="rounded-3xl border border-cyan-100 bg-[#f7fbfe] p-6 text-center space-y-3">
            <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-100 text-cyan-700 mx-auto">
              <Compass size={24} />
            </span>
            <h3 className="text-sm font-black text-[#073b66]">Map Directions</h3>
            <p className="text-xs text-slate-500 leading-5 max-w-xs mx-auto">
              Direct Google Maps pin and GPS waypoint link will be unlocked once physical laboratory building confirmation is finalized.
            </p>
          </div>
        </div>

        {/* Right Column: Interactive Multi-Type Enquiry Form */}
        <div className="rounded-3xl border border-slate-200 bg-white p-6 sm:p-10 shadow-sm space-y-6">
          {/* Tabs for Enquiry Types */}
          <div className="flex rounded-2xl bg-slate-100 p-1 text-xs font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setEnquiryType('general')}
              className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                enquiryType === 'general' ? 'bg-white text-[#073b66] shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              General Enquiry
            </button>
            <button
              type="button"
              onClick={() => setEnquiryType('corporate')}
              className={`flex-1 py-2.5 rounded-xl transition flex items-center justify-center gap-1.5 ${
                enquiryType === 'corporate' ? 'bg-white text-[#073b66] shadow-sm font-black' : 'hover:text-slate-900'
              }`}
            >
              <Building2 size={14} className="text-cyan-600" />
              Corporate / Health Camp
            </button>
          </div>

          {successMsg && (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 p-4 text-xs font-bold text-emerald-800 flex items-start gap-2.5">
              <CheckCircle2 size={18} className="shrink-0 mt-0.5" />
              <span>{successMsg}</span>
            </div>
          )}

          {errorMsg && (
            <div className="rounded-2xl border border-red-200 bg-red-50 p-4 text-xs font-bold text-red-700 flex items-start gap-2.5">
              <AlertCircle size={18} className="shrink-0 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">
                  Your Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="Your Full Name"
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">
                  10-Digit Mobile Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  pattern="[0-9]{10}"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  placeholder="e.g. 9826012345"
                  className="field"
                />
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="field-label">
                  Email Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  placeholder="contact@example.com"
                  className="field"
                />
              </div>

              <div>
                <label className="field-label">
                  {enquiryType === 'corporate'
                    ? 'Company / Factory / Institution'
                    : 'Organization (optional)'}
                </label>
                <input
                  type="text"
                  value={formData.organization}
                  onChange={(e) => setFormData({ ...formData, organization: e.target.value })}
                  placeholder={
                    enquiryType === 'corporate'
                      ? 'e.g. Mandideep Industrial Works Ltd'
                      : 'Optional'
                  }
                  className="field"
                />
              </div>
            </div>

            <div>
              <label className="field-label">Subject (optional)</label>
              <input
                type="text"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="e.g. Daily sample pickup logistics / Annual wellness package"
                className="field"
              />
            </div>

            <div>
              <label className="field-label">
                Message / Details <span className="text-red-500">*</span>
              </label>
              <textarea
                required
                rows={4}
                value={formData.message}
                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                placeholder="Please describe your requirements, expected sample volumes, or questions..."
                className="field"
              />
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="w-full rounded-2xl bg-[#073b66] py-3.5 text-sm font-extrabold text-white shadow-lg shadow-[#073b66]/20 hover:bg-[#062d4e] transition disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {submitting ? 'Submitting Enquiry...' : 'Send Message'}
              {!submitting && <Send size={16} />}
            </button>

            <p className="text-[11px] text-center text-slate-400">
              Please do not submit sensitive personal medical reports or confidential prescription scans via this general contact form.
            </p>
          </form>
        </div>
      </div>
    </div>
  )
}

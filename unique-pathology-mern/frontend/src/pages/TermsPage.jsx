import React from 'react'
import { AlertCircle, FileCheck, ShieldAlert } from 'lucide-react'

export function TermsPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Diagnostic Service Terms
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Terms of Service & Medical Disclaimer
        </h1>
        <p className="text-xs text-slate-500">Effective: October 2026 • Unique Pathology, Mandideep, Bhopal</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm text-slate-700 leading-7">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">1. Nature of Online Bookings</h2>
          <p>
            Submission of an online test or package booking through this website constitutes an appointment request. It does not create a binding medical contract until verified and confirmed by laboratory staff. Unique Pathology reserves the right to reschedule or cancel appointment slots due to emergencies, instrument maintenance, or extreme logistical disruptions.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">2. Medical Advice Disclaimer</h2>
          <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-900 leading-6">
            <strong>CRITICAL HEALTHCARE NOTICE:</strong> Diagnostic test results and reference ranges provided by Unique Pathology are intended to assist registered medical doctors in evaluating health status. Laboratory reports do not constitute independent medical diagnoses, and test parameters must always be interpreted by a qualified clinician in the context of the patient's full medical history and physical examination.
          </div>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">3. Tariffs & Price Verification</h2>
          <p>
            Prices labeled on this platform as "Verified Price" represent active laboratory desk rates. Profiles labeled as "Demo / Indicative" are sample parameters presented for system evaluation, and the exact applicable fee must be confirmed directly at our Mandideep diagnostic centre prior to testing.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">4. Cancellation & Rescheduling Policy</h2>
          <p>
            Patients may cancel an appointment online without fee while the booking remains in the "Requested" or "Confirmed" status. Once sample collection has occurred at your home or our centre, or once laboratory chemical processing has commenced, the appointment cannot be cancelled and fees are non-refundable.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">5. Governing Jurisdiction</h2>
          <p>
            Any disputes or claims relating to diagnostic services provided by Unique Pathology shall be governed by the laws of Madhya Pradesh, India, subject to the exclusive jurisdiction of the competent courts in the Bhopal / Raisen district.
          </p>
        </section>
      </div>
    </div>
  )
}

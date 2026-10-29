import React from 'react'
import { ShieldCheck, Lock, EyeOff, FileText, CheckCircle2 } from 'lucide-react'

export function PrivacyPolicyPage() {
  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-8">
      <div className="space-y-3">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Patient Data Protection
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Privacy Policy
        </h1>
        <p className="text-xs text-slate-500">Last updated: October 2026 • Unique Pathology, Mandideep, Bhopal</p>
      </div>

      <div className="rounded-3xl border border-slate-200 bg-white p-8 sm:p-12 shadow-sm space-y-8 text-xs sm:text-sm text-slate-700 leading-7">
        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">1. Commitment to Patient Confidentiality</h2>
          <p>
            At <strong>Unique Pathology</strong>, Mandideep, Bhopal, Madhya Pradesh, we treat your health information and personal records with the highest standard of professional discretion. We collect only the minimum necessary data needed to safely schedule appointments, perform clinical testing, and deliver diagnostic reports to you or your designated clinician.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">2. Information We Collect</h2>
          <p>When you register an appointment or request home sample collection, we collect:</p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li><strong>Patient Identification:</strong> Full Name, Age, and Gender.</li>
            <li><strong>Contact Details:</strong> 10-digit mobile number and optional email address.</li>
            <li><strong>Home Collection Location:</strong> Residential or workplace address and landmarks in the Mandideep/Bhopal region.</li>
            <li><strong>Clinical Selections:</strong> Requested diagnostic tests or health screening packages.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">3. Zero-Trust Report Storage & Access Controls</h2>
          <p>
            Patient diagnostic reports are never stored in public static web folders or exposed via predictable file links. Our architecture implements:
          </p>
          <ul className="list-disc pl-5 space-y-1.5 text-slate-600">
            <li>Private object/server storage strictly isolated from public web access.</li>
            <li>Two-step mobile verification (OTP) required to unlock report downloads.</li>
            <li>Single-use, short-lived (15-minute) signed download tokens.</li>
            <li>Comprehensive regulatory audit logging of every report access attempt, including IP address, user agent, and timestamp.</li>
          </ul>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">4. Non-Disclosure & Third-Party Protection</h2>
          <p>
            We do not sell, rent, or trade patient personal health data, phone numbers, or test histories to advertisers, pharmaceutical companies, or third-party data brokers. Data is shared exclusively with our accredited internal laboratory personnel and the referring physician indicated by the patient.
          </p>
        </section>

        <section className="space-y-3">
          <h2 className="text-lg font-black text-[#073b66]">5. Contacting the Laboratory Privacy Coordinator</h2>
          <p>
            If you have questions regarding your data privacy, report history, or wish to request correction of your contact records, please contact our administrative desk at Unique Pathology, Mandideep, Bhopal or email <code className="bg-slate-100 px-2 py-0.5 rounded text-cyan-800">contact@uniquepathology.example</code>.
          </p>
        </section>
      </div>
    </div>
  )
}

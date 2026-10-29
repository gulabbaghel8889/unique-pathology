import React, { useState } from 'react'
import { Link } from 'react-router-dom'
import { ChevronDown, HelpCircle, ArrowRight } from 'lucide-react'

export function FaqsPage() {
  const faqs = [
    {
      q: 'Which tests require fasting, and how many hours should I fast?',
      a: 'Tests such as Fasting Blood Glucose (FBS), Lipid Profile, and comprehensive Wellness Panels typically require 10 to 12 hours of overnight fasting. During this fasting period, you should not consume food, tea, coffee, milk, or juices. Plain water is permitted and encouraged to keep you well hydrated for smooth blood sample draw.',
    },
    {
      q: 'How does home sample collection work in Mandideep?',
      a: 'When you select "Home Sample Collection" on our booking form, an experienced phlebotomist visits your home or office address in Mandideep during your chosen morning slot. Samples are drawn using single-use sterile vacuum tubes, immediately barcoded, and transported in temperature-regulated cool containers to our laboratory.',
    },
    {
      q: 'How will I receive my diagnostic report?',
      a: 'Once your test is processed and verified by the duty pathologist, you can access your report from anywhere via our secure Patient Portal. Simply enter your Booking Reference ID (e.g. UP-DEMO-2026) and registered 10-digit mobile number to receive a one-time verification code (OTP), and securely download your official PDF report.',
    },
    {
      q: 'Why does the report download require an OTP?',
      a: 'Diagnostic test reports contain sensitive personal health data. To protect patient privacy and comply with healthcare data guidelines, we do not store reports on public or guessable web links. An authenticated OTP verification ensures that only the authorized patient or guardian can view and download the report.',
    },
    {
      q: 'What is the difference between "Verified Price" and "Demo / Indicative Price"?',
      a: 'In accordance with our strict transparency policy, tests labeled "Verified Price" reflect active laboratory desk tariffs. Tests labeled "Demo / Indicative Price" are illustrative sample profiles provided during system demonstration, and their final charges will be confirmed directly by lab staff before sample collection.',
    },
    {
      q: 'Can I cancel or reschedule my appointment?',
      a: 'Yes. As long as your appointment is in the "Requested" or "Confirmed" state, you can cancel it online using our Track Booking page by confirming your registered mobile number. Once sample collection has occurred or laboratory processing has begun, cancellation is locked.',
    },
    {
      q: 'Do you offer corporate or industrial health camps in Mandideep?',
      a: 'Yes. We work with industrial units, factories, and commercial enterprises in the Mandideep industrial area to conduct tailored occupational health checks and annual employee wellness screenings. Please submit an enquiry via our Contact page.',
    },
  ]

  const [openIdx, setOpenIdx] = useState(0)

  return (
    <div className="mx-auto max-w-4xl px-4 py-12 sm:px-6 lg:px-8 space-y-10">
      <div className="text-center max-w-xl mx-auto space-y-2">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          Patient Assistance
        </span>
        <h1 className="text-3xl sm:text-4xl font-black text-[#073b66] tracking-tight">
          Frequently Asked Questions
        </h1>
        <p className="text-xs sm:text-sm text-slate-600 leading-6">
          Everything you need to know about preparing for blood tests, scheduling home visits, and retrieving digital reports.
        </p>
      </div>

      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <div
            key={faq.q}
            className="rounded-2xl border border-slate-200 bg-white overflow-hidden transition"
          >
            <button
              onClick={() => setOpenIdx(openIdx === idx ? -1 : idx)}
              className="w-full p-5 text-left font-bold text-[#073b66] flex items-center justify-between gap-4 hover:bg-slate-50 transition"
            >
              <span className="text-sm sm:text-base leading-snug">{faq.q}</span>
              <ChevronDown
                size={18}
                className={`text-slate-400 transition-transform ${openIdx === idx ? 'rotate-180 text-cyan-600' : ''}`}
              />
            </button>

            {openIdx === idx && (
              <div className="px-5 pb-5 text-xs sm:text-sm text-slate-600 leading-6 border-t border-slate-100 pt-3">
                {faq.a}
              </div>
            )}
          </div>
        ))}
      </div>

      <div className="rounded-3xl bg-slate-100 p-8 text-center space-y-3">
        <h3 className="text-base font-bold text-[#073b66]">Still have questions regarding test preparation?</h3>
        <p className="text-xs text-slate-600 max-w-md mx-auto">
          Our Mandideep laboratory team is happy to help you clarify fasting rules and collection schedules.
        </p>
        <Link
          to="/contact"
          className="inline-flex items-center gap-2 rounded-xl bg-[#073b66] px-5 py-2.5 text-xs font-bold text-white hover:bg-cyan-700 transition"
        >
          <span>Contact Centre Support</span>
          <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  )
}

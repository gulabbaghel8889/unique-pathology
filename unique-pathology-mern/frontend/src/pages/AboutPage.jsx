import React from 'react'
import { Link } from 'react-router-dom'
import {
  ShieldCheck,
  Microscope,
  HeartPulse,
  CheckCircle2,
  AlertCircle,
  Clock,
  MapPin,
  ArrowRight,
  Sparkles,
  Users,
  Award,
  TestTube,
} from 'lucide-react'

export function AboutPage({ publicConfig }) {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10 sm:py-16 sm:px-6 lg:px-8 space-y-14 sm:space-y-20">
      {/* Hero section */}
      <div className="text-center max-w-3xl mx-auto space-y-4 animate-fadeIn">
        <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-700">
          About Unique Pathology
        </span>
        <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-[#073b66] tracking-tight leading-tight">
          Precision, Integrity, and Genuine Patient Care in Mandideep.
        </h1>
        <p className="text-xs sm:text-sm lg:text-base text-slate-600 leading-7">
          Unique Pathology is a dedicated diagnostic centre established to provide reliable medical testing, accessible health screening, and compassionate service to families and workers across Mandideep and Bhopal, Madhya Pradesh.
        </p>
      </div>

      {/* Visual Showcase (3 Pictures Grid) */}
      <div className="grid gap-4 sm:gap-6 sm:grid-cols-3">
        <div className="img-zoom-container rounded-2xl overflow-hidden shadow-md border-2 border-white relative group">
          <img
            src="https://www.asterhospitals.ae/fileadmin/user_upload/Pathology.jpg"
            alt="Automated clinical biochemistry analyzer equipment"
            className="h-52 sm:h-64 w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4 text-white">
            <span className="text-xs font-bold">Calibrated Diagnostic Analyzers</span>
          </div>
        </div>

        <div className="img-zoom-container rounded-2xl overflow-hidden shadow-md border-2 border-white relative group">
          <img
            src="https://images.unsplash.com/photo-1579154204601-01588f351e67?auto=format&fit=crop&w=800&q=80"
            alt="Microbiology and hematology sample processing in clinical lab"
            className="h-52 sm:h-64 w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4 text-white">
            <span className="text-xs font-bold">Pathologist-Supervised Testing</span>
          </div>
        </div>

        <div className="img-zoom-container rounded-2xl overflow-hidden shadow-md border-2 border-white relative group">
          <img
            src="https://hrdiagnostic.in/blog/wp-content/uploads/2025/05/Pathology-Lab.webp"
            alt="Gentle patient blood draw with sterile vacuum tubes"
            className="h-52 sm:h-64 w-full object-cover"
            loading="lazy"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent flex items-end p-4 text-white">
            <span className="text-xs font-bold">Safe & Gentle Phlebotomy</span>
          </div>
        </div>
      </div>

      {/* Verified vs Placeholder Ethics Callout */}
      <div className="rounded-3xl border border-cyan-200 bg-cyan-50/60 p-6 sm:p-8 space-y-3">
        <div className="flex items-center gap-2 text-cyan-900 font-extrabold text-sm sm:text-base">
          <ShieldCheck size={20} className="text-cyan-700" />
          Our Ethical Commitment & Transparency Standard
        </div>
        <p className="text-xs sm:text-sm text-slate-700 leading-6">
          In healthcare, trust begins with honesty. We strictly refrain from fabricating claims of accreditation, inventing staff credentials, or publishing synthetic patient reviews. Test tariffs and services shown on this platform are transparently categorized into verified lab rates and indicative demo profiles, ensuring full clarity for our community.
        </p>
      </div>

      {/* Core Diagnostic Pillars */}
      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-3 hover:shadow-md transition">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
            <Microscope size={24} />
          </span>
          <h3 className="text-base sm:text-lg font-black text-[#073b66]">Calibrated Clinical Testing</h3>
          <p className="text-xs text-slate-600 leading-6">
            All samples are processed using standardized protocols, vacuum collection tubes, and regular multi-level calibration controls to ensure precision and clinical repeatability.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-3 hover:shadow-md transition">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
            <HeartPulse size={24} />
          </span>
          <h3 className="text-base sm:text-lg font-black text-[#073b66]">Hygienic Sample Handling</h3>
          <p className="text-xs text-slate-600 leading-6">
            Our certified phlebotomists follow strict sterile collection techniques. Samples for home collection are immediately barcoded and transported in temperature-controlled cooler kits.
          </p>
        </div>

        <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:p-7 shadow-sm space-y-3 hover:shadow-md transition">
          <span className="grid h-12 w-12 place-items-center rounded-2xl bg-cyan-50 text-cyan-700">
            <ShieldCheck size={24} />
          </span>
          <h3 className="text-base sm:text-lg font-black text-[#073b66]">Patient Data Privacy</h3>
          <p className="text-xs text-slate-600 leading-6">
            We respect patient dignity and health data confidentiality. Reports are delivered through authenticated OTP workflows, never stored in public web folders or exposed via guessable URLs.
          </p>
        </div>
      </div>

      {/* Mandideep Context */}
      <div className="rounded-3xl bg-[#073b66] p-6 sm:p-10 lg:p-12 text-white">
        <div className="grid gap-8 lg:grid-cols-2 items-center">
          <div className="space-y-4">
            <span className="text-xs font-black uppercase tracking-[0.2em] text-cyan-300">
              Community Service
            </span>
            <h2 className="text-xl sm:text-2xl lg:text-3xl font-black">
              Supporting the Industrial Hub of Mandideep
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 leading-6">
              Mandideep is one of Madhya Pradesh's key industrial engines. We understand that shift workers, factory staff, and busy families need early morning collection hours (from 07:00 AM) and reliable turnaround so clinicians can make timely decisions.
            </p>
            <div className="pt-2 flex flex-wrap gap-4 text-xs font-semibold text-cyan-200">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Early 7 AM Morning Slots
              </span>
              <span className="flex items-center gap-1.5">
                <CheckCircle2 size={16} className="text-cyan-400" />
                Sunday Morning Timings
              </span>
            </div>
          </div>

          <div className="rounded-2xl bg-white/10 p-6 border border-white/10 space-y-3">
            <h3 className="text-sm sm:text-base font-bold text-white">Centre Operating Schedule</h3>
            <div className="text-xs text-blue-100 space-y-2">
              <div className="flex justify-between py-1 border-b border-white/10">
                <span>Monday to Saturday:</span>
                <span className="font-bold text-white">07:00 AM – 08:00 PM</span>
              </div>
              <div className="flex justify-between py-1 border-b border-white/10">
                <span>Sunday:</span>
                <span className="font-bold text-white">08:00 AM – 01:00 PM</span>
              </div>
              <div className="flex justify-between py-1">
                <span>Home Collection Dispatch:</span>
                <span className="font-bold text-white">07:00 AM – 02:00 PM Daily</span>
              </div>
            </div>
            <div className="pt-3">
              <Link
                to="/book"
                className="block text-center rounded-xl bg-white text-[#073b66] font-extrabold py-3 text-xs hover:bg-cyan-50 active:scale-95 transition"
              >
                Book Appointment Online
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

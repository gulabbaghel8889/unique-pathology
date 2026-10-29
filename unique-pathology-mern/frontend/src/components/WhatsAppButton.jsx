import React, { useState } from 'react'
import { MessageSquare, X, ShieldAlert, PhoneCall } from 'lucide-react'

export function WhatsAppButton({ isConfigured = false, whatsappNumber = '', phone = '' }) {
  const [modalOpen, setModalOpen] = useState(false)

  function handleClick() {
    if (isConfigured && whatsappNumber) {
      let clean = whatsappNumber.replace(/[^0-9]/g, '')
      if (clean.length === 10) {
        clean = `91${clean}`
      }
      const url = `https://wa.me/${clean}?text=Hello%20Unique%20Pathology%2C%20I%20would%20like%20to%20enquire%20about%20diagnostic%20tests.`
      window.open(url, '_blank', 'noopener,noreferrer')
    } else {
      setModalOpen(true)
    }
  }

  return (
    <>
      <button
        onClick={handleClick}
        className="fixed bottom-20 md:bottom-6 right-4 sm:right-6 z-40 flex items-center gap-2 rounded-full bg-emerald-600 px-3.5 sm:px-4 py-2.5 sm:py-3 text-xs sm:text-sm font-extrabold text-white shadow-xl shadow-emerald-700/30 transition hover:bg-emerald-700 hover:scale-105 active:scale-95 focus:outline-none focus:ring-4 focus:ring-emerald-300"
        aria-label="Chat on WhatsApp"
      >
        <MessageSquare size={19} />
        <span className="hidden sm:inline">WhatsApp Help</span>
      </button>

      {modalOpen && (
        <div className="modal-backdrop" onClick={(e) => e.target === e.currentTarget && setModalOpen(false)}>
          <div className="modal-panel max-w-md p-6 sm:p-7">
            <div className="flex items-start justify-between border-b border-slate-100 pb-4">
              <div className="flex items-center gap-3">
                <span className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                  <MessageSquare size={20} />
                </span>
                <div>
                  <h3 className="text-lg font-black text-[#073b66]">WhatsApp Support</h3>
                  <p className="text-xs text-slate-500">Official Channel Status</p>
                </div>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={18} />
              </button>
            </div>

            <div className="py-5 space-y-3">
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs leading-5 text-amber-900">
                <div className="flex gap-2.5">
                  <ShieldAlert size={18} className="shrink-0 text-amber-600 mt-0.5" />
                  <div>
                    <strong className="block font-bold">Registration in Progress</strong>
                    The dedicated WhatsApp business channel for Unique Pathology, Mandideep is currently completing telecom registration.
                  </div>
                </div>
              </div>

              <p className="text-xs leading-5 text-slate-600">
                In the meantime, you can submit test bookings or home sample collection requests directly through our website, or call our centre helpline.
              </p>
            </div>

            <div className="flex flex-col gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  setModalOpen(false)
                  window.location.href = '/book'
                }}
                className="w-full rounded-xl bg-[#073b66] py-3 text-sm font-bold text-white hover:bg-cyan-700"
              >
                Book Appointment Online
              </button>
              <button
                onClick={() => setModalOpen(false)}
                className="w-full rounded-xl border border-slate-200 py-2.5 text-xs font-semibold text-slate-600 hover:bg-slate-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

import React from 'react'
import { CheckCircle2, AlertCircle } from 'lucide-react'

export function PriceBadge({
  pricePaise,
  mrpPaise,
  isVerifiedPrice,
  priceNote,
  showDiscountTag = true,
  className = '',
}) {
  const priceRupees = Number.isInteger(pricePaise) ? Math.round(pricePaise / 100) : 0
  const mrpRupees = Number.isInteger(mrpPaise) && mrpPaise > pricePaise ? Math.round(mrpPaise / 100) : null
  const discountPercent = mrpRupees ? Math.round(((mrpRupees - priceRupees) / mrpRupees) * 100) : 0
  const savings = mrpRupees ? mrpRupees - priceRupees : 0

  return (
    <div className={`flex flex-col gap-1.5 ${className}`}>
      <div className="flex items-baseline flex-wrap gap-2">
        <span className="text-2xl font-black tracking-tight text-slate-900">₹{priceRupees}</span>

        {mrpRupees && (
          <span className="text-sm font-semibold text-slate-400 line-through decoration-slate-400">
            ₹{mrpRupees}
          </span>
        )}

        {showDiscountTag && discountPercent > 0 && (
          <span className="inline-flex items-center gap-1 rounded-md bg-emerald-100 px-2 py-0.5 text-xs font-black text-emerald-800 border border-emerald-300">
            {discountPercent}% OFF
          </span>
        )}

        {isVerifiedPrice ? (
          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 border border-emerald-200">
            <CheckCircle2 size={12} className="text-emerald-600" />
            Verified Price
          </span>
        ) : (
          <span className="inline-flex items-center gap-1 rounded-full bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-800 border border-amber-200">
            <AlertCircle size={12} className="text-amber-600" />
            Demo / Indicative
          </span>
        )}
      </div>

      <div className="flex items-center justify-between text-[11px] text-slate-500 leading-tight">
        <span>
          {isVerifiedPrice
            ? 'Standard centre tariff.'
            : priceNote || 'Demo test price shown. Subject to confirmation at the centre.'}
        </span>
        {savings > 0 && (
          <span className="text-emerald-700 font-bold ml-2 shrink-0">
            Save ₹{savings}
          </span>
        )}
      </div>
    </div>
  )
}

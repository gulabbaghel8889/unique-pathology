import React, { useState, useEffect } from 'react'
import { ArrowUp } from 'lucide-react'

export function ScrollProgressAndTop() {
  const [scrollProgress, setScrollProgress] = useState(0)
  const [showTopBtn, setShowTopBtn] = useState(false)

  useEffect(() => {
    function handleScroll() {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight
      if (totalHeight > 0) {
        const currentProgress = (window.scrollY / totalHeight) * 100
        setScrollProgress(Math.min(100, Math.max(0, currentProgress)))
      }

      if (window.scrollY > 280) {
        setShowTopBtn(true)
      } else {
        setShowTopBtn(false)
      }
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    handleScroll()

    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  function scrollToTop() {
    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    })
  }

  return (
    <>
      {/* Top Scroll Indicator Line */}
      <div
        className="scroll-progress-bar pointer-events-none"
        style={{ width: `${scrollProgress}%` }}
        aria-hidden="true"
      />

      {/* Floating Scroll To Top Button */}
      {showTopBtn && (
        <button
          onClick={scrollToTop}
          aria-label="Scroll back to top"
          className="fixed right-4 bottom-20 md:bottom-8 z-40 flex items-center justify-center h-11 w-11 rounded-2xl bg-[#073b66] text-white shadow-lg hover:bg-cyan-600 hover:scale-105 active:scale-95 transition-all duration-300 border border-white/20 animate-fadeIn"
          title="Back to Top"
        >
          <ArrowUp size={20} className="stroke-[2.5]" />
        </button>
      )}
    </>
  )
}

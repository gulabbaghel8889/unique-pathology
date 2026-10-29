import { useEffect } from 'react'

/**
 * Custom hook to reveal elements with `.reveal-on-scroll` class
 * smoothly as they are scrolled into the viewport.
 */
export function useScrollReveal(dependencies = []) {
  useEffect(() => {
    if (typeof window === 'undefined') return

    // Fallback if IntersectionObserver is unsupported
    if (!('IntersectionObserver' in window)) {
      document.querySelectorAll('.reveal-on-scroll').forEach((el) => {
        el.classList.add('is-visible')
      })
      return
    }

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-visible')
            // Stop observing once animated
            observer.unobserve(entry.target)
          }
        })
      },
      {
        root: null,
        rootMargin: '0px 0px -40px 0px',
        threshold: 0.08,
      }
    )

    // Select all unrevealed elements
    const elements = document.querySelectorAll('.reveal-on-scroll:not(.is-visible)')
    elements.forEach((el) => observer.observe(el))

    return () => {
      observer.disconnect()
    }
  }, dependencies)
}

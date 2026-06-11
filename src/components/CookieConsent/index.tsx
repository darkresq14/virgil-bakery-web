'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'

import {
  type ConsentValue,
  getConsentCookie,
  onBannerRequest,
  setConsentCookie,
  updateGtagConsent,
} from './consent'

export function CookieConsent() {
  const [visible, setVisible] = useState(false)
  const [dismissed, setDismissed] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    // Register reopen callback for the footer "Setări Cookies" button
    const unregister = onBannerRequest(() => {
      setDismissed(false)
      setVisible(true)
    })

    // Detect reduced motion preference
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)

    // Handle existing consent
    const consent = getConsentCookie()
    if (consent === 'accepted') {
      updateGtagConsent(true)
    } else if (consent === null) {
      setVisible(true)
    }

    return () => {
      unregister()
      mq.removeEventListener('change', handler)
    }
  }, [])

  const handleAccept = () => {
    updateGtagConsent(true)
    setConsentCookie('accepted' as ConsentValue)
    handleDismiss()
  }

  const handleReject = () => {
    updateGtagConsent(false)
    setConsentCookie('rejected' as ConsentValue)
    handleDismiss()
  }

  const handleDismiss = () => {
    setDismissed(true)
    // Wait for animation to finish before removing from DOM
    setTimeout(() => setVisible(false), 300)
  }

  if (!visible) return null

  return (
    <div
      role="dialog"
      aria-label="Consimțământ cookie-uri"
      className={`fixed bottom-4 left-4 z-50 max-w-sm w-[calc(100%-2rem)] sm:w-auto bg-card border border-border rounded-xl shadow-lg p-5 font-sans ${
        dismissed
          ? reducedMotion
            ? 'hidden'
            : 'opacity-0 translate-y-4'
          : reducedMotion
            ? ''
            : 'animate-[slideUp_0.3s_ease-out]'
      }`}
      style={{
        transition: dismissed && !reducedMotion ? 'opacity 0.3s, transform 0.3s' : undefined,
      }}
    >
      <div className="flex items-start gap-2 mb-3">
        <span className="text-xl leading-none" aria-hidden="true">
          🍪
        </span>
        <p className="text-sm text-foreground leading-relaxed">
          Acest site folosește cookie-uri analitice pentru a îmbunătăți experiența.
        </p>
      </div>

      <Link
        href="/politica-de-confidentialitate"
        className="inline-block text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground transition-colors mb-4"
      >
        Politica de Confidențialitate
      </Link>

      <div className="flex gap-3">
        <button
          type="button"
          onClick={handleReject}
          className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-secondary text-secondary-foreground hover:bg-secondary/80 transition-colors cursor-pointer"
        >
          Respinge
        </button>
        <button
          type="button"
          onClick={handleAccept}
          className="flex-1 px-4 py-2 text-sm font-medium rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors cursor-pointer"
        >
          Acceptă
        </button>
      </div>
    </div>
  )
}

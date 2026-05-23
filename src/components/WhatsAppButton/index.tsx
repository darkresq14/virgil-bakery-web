'use client'

import React, { useEffect, useState } from 'react'
import Image from 'next/image'

export const WhatsAppButton = () => {
  const [visible, setVisible] = useState(false)
  const [reducedMotion, setReducedMotion] = useState(false)

  useEffect(() => {
    const mq = window.matchMedia('(prefers-reduced-motion: reduce)')
    setReducedMotion(mq.matches)
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches)
    mq.addEventListener('change', handler)
    return () => mq.removeEventListener('change', handler)
  }, [])

  useEffect(() => {
    const handleScroll = () => {
      const scrolledHalf = window.scrollY > window.innerHeight * 0.5
      const atBottom = window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 100
      setVisible(scrolledHalf && !atBottom)
    }

    window.addEventListener('scroll', handleScroll, { passive: true })
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  if (!visible) return null

  return (
    <a
      href="https://wa.me/40746245391"
      target="_blank"
      rel="noopener noreferrer"
      aria-label="Contactează-ne pe WhatsApp"
      className={`fixed bottom-6 right-6 z-40 transition-transform hover:scale-110 ${
        reducedMotion ? '' : 'animate-[pulse_2s_ease-in-out_infinite]'
      }`}
    >
      <Image src="/WhatsApp_White.svg" alt="WhatsApp" width={56} height={56} />
    </a>
  )
}

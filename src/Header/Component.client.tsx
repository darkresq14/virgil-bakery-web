'use client'

import { Menu, MessageCircle, ShoppingBag, X } from 'lucide-react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import type React from 'react'
import { useCallback, useEffect, useRef, useState } from 'react'
import { AdminBar } from '@/components/AdminBar'

import { Logo } from '@/components/Logo/Logo'
import { Media } from '@/components/Media'
import type { Header as HeaderType } from '@/payload-types'
import { useCart } from '@/providers/Cart'

interface HeaderClientProps {
  data: HeaderType
  adminBarProps?: { preview: boolean }
}

const navLinks = [
  { href: '/', label: 'Acasă' },
  { href: '/produse', label: 'Produse' },
  { href: '/maiaua-mea', label: 'Despre' },
  { href: '/posts', label: 'Blog' },
  { href: '/#contact', label: 'Contact' },
]

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, adminBarProps }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount } = useCart()
  const pathname = usePathname()
  const overlayRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    const header = document.querySelector('header')
    if (!header) return
    const observer = new ResizeObserver(([entry]) => {
      document.documentElement.style.setProperty('--header-height', `${entry.contentRect.height}px`)
    })
    observer.observe(header)
    return () => observer.disconnect()
  }, [])

  // Lock body scroll & handle focus trapping when mobile menu is open
  useEffect(() => {
    if (mobileOpen) {
      document.body.style.overflow = 'hidden'

      // Focus the close button after opening
      requestAnimationFrame(() => closeRef.current?.focus())

      const handleKeyDown = (e: KeyboardEvent) => {
        if (e.key === 'Escape') {
          setMobileOpen(false)
          return
        }

        if (e.key === 'Tab' && overlayRef.current) {
          const focusable = overlayRef.current.querySelectorAll<HTMLElement>(
            'a[href], button, [tabindex]:not([tabindex="-1"])',
          )
          const first = focusable[0]
          const last = focusable[focusable.length - 1]

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault()
            last.focus()
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault()
            first.focus()
          }
        }
      }

      document.addEventListener('keydown', handleKeyDown)
      return () => {
        document.removeEventListener('keydown', handleKeyDown)
        document.body.style.overflow = ''
      }
    } else {
      document.body.style.overflow = ''
    }
  }, [mobileOpen])

  const closeMobile = useCallback(() => setMobileOpen(false), [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <AdminBar adminBarProps={adminBarProps} />
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link
            href="/"
            className="flex items-center shrink-0 gap-2"
            aria-label="Pâine cu Maia — Pagina principală"
          >
            {data?.logo ? (
              <>
                <Media resource={data.logo} imgClassName="h-10 w-auto" />
                <div className="flex flex-col leading-none">
                  <span className="font-heading text-lg font-bold tracking-tight">
                    Pâine cu Maia
                  </span>
                  <span className="text-[10px] text-foreground/60 tracking-[0.15em] uppercase font-sans">
                    by Virgil
                  </span>
                </div>
              </>
            ) : (
              <Logo />
            )}
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6" aria-label="Navigare principală">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`text-sm font-sans transition-colors hover:text-primary ${
                  pathname === link.href ? 'text-primary font-medium' : 'text-foreground/70'
                }`}
              >
                {link.label}
              </Link>
            ))}
          </nav>

          {/* Right side: Cart + Hamburger */}
          <div className="flex items-center gap-3">
            <Link
              href="/cos"
              className="relative flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
              aria-label={`Coșul tău (${itemCount} produse)`}
            >
              <ShoppingBag className="w-5 h-5" />
              {itemCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-sans font-medium">
                  {itemCount}
                </span>
              )}
            </Link>

            {/* Mobile hamburger */}
            <button
              className="md:hidden flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
              onClick={() => setMobileOpen(true)}
              aria-label="Deschide meniul"
              aria-expanded={mobileOpen}
              aria-controls="mobile-menu"
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div
          ref={overlayRef}
          id="mobile-menu"
          role="dialog"
          aria-modal="true"
          aria-label="Meniu navigare"
          className="fixed inset-0 z-60 bg-white flex flex-col"
        >
          <div className="flex items-center justify-between h-16 px-4">
            <Link
              href="/"
              onClick={closeMobile}
              className="flex items-center gap-2"
              aria-label="Pâine cu Maia — Pagina principală"
            >
              {data?.logo ? (
                <>
                  <Media resource={data.logo} imgClassName="h-10 w-auto" />
                  <div className="flex flex-col leading-none">
                    <span className="font-heading text-lg font-bold tracking-tight">
                      Pâine cu Maia
                    </span>
                    <span className="text-[10px] text-foreground/60 tracking-[0.15em] uppercase font-sans">
                      by Virgil
                    </span>
                  </div>
                </>
              ) : (
                <Logo />
              )}
            </Link>
            <button
              ref={closeRef}
              onClick={closeMobile}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
              aria-label="Închide meniul"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav
            className="flex flex-col items-center justify-center flex-1 gap-6"
            aria-label="Navigare principală"
          >
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={closeMobile}
                className="text-2xl font-heading transition-colors hover:text-primary"
              >
                {link.label}
              </Link>
            ))}
          </nav>

          <div className="pb-8 flex justify-center">
            <a
              href="https://wa.me/40746245391"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full bg-[#25D366] text-white px-6 py-3 font-sans font-medium"
            >
              <MessageCircle className="w-5 h-5" />
              Comandă prin WhatsApp
            </a>
          </div>
        </div>
      )}
    </>
  )
}

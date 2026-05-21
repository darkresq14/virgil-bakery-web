'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { ShoppingBag, Menu, X, MessageCircle } from 'lucide-react'

import type { Header as HeaderType } from '@/payload-types'

import { Logo } from '@/components/Logo/Logo'
import { HeaderNav } from './Nav'
import { useCart } from '@/providers/Cart'
import { AdminBar } from '@/components/AdminBar'

interface HeaderClientProps {
  data: HeaderType
  adminBarProps?: { preview: boolean }
}

export const HeaderClient: React.FC<HeaderClientProps> = ({ data, adminBarProps }) => {
  const [mobileOpen, setMobileOpen] = useState(false)
  const { itemCount } = useCart()
  const pathname = usePathname()

  const navLinks = [
    { href: '/', label: 'Acasă' },
    { href: '/produse', label: 'Produse' },
    { href: '/maiaua-mea', label: 'Despre' },
    { href: '/posts', label: 'Blog' },
    { href: '/#contact', label: 'Contact' },
  ]

  return (
    <>
      <header className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-sm border-b border-border">
        <AdminBar adminBarProps={adminBarProps} />
        <div className="container flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center shrink-0">
            <Logo />
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
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
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-60 bg-white flex flex-col">
          <div className="flex items-center justify-between h-16 px-4">
            <Link href="/" onClick={() => setMobileOpen(false)}>
              <Logo />
            </Link>
            <button
              onClick={() => setMobileOpen(false)}
              className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-secondary transition-colors"
              aria-label="Închide meniul"
            >
              <X className="w-6 h-6" />
            </button>
          </div>

          <nav className="flex flex-col items-center justify-center flex-1 gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                onClick={() => setMobileOpen(false)}
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

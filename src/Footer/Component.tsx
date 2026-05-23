import { getCachedGlobal } from '@/utilities/getGlobals'
import Link from 'next/link'

import { Logo } from '@/components/Logo/Logo'
import { Media } from '@/components/Media'
import { MessageCircle, Facebook, Instagram, Mail, Phone } from 'lucide-react'

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)()
  const siteConfig = await getCachedGlobal('siteConfig', 1)()

  const navItems = footerData?.navItems || []

  const footerLinks = [
    { href: '/', label: 'Acasă' },
    { href: '/produse', label: 'Produse' },
    { href: '/maiaua-mea', label: 'Despre' },
    { href: '/posts', label: 'Blog' },
    { href: '/politica-de-confidentialitate', label: 'Politica de Confidențialitate' },
  ]

  return (
    <footer className="bg-foreground text-background">
      <div className="container py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Logo & tagline */}
          <div className="flex flex-col items-start gap-3">
            <Link href="/" className="group">
              {footerData?.footerLogo ? (
                <Media
                  resource={footerData.footerLogo}
                  pictureClassName="rounded-md overflow-hidden shadow-sm group-hover:shadow-md transition-shadow"
                  imgClassName="h-32 w-auto"
                />
              ) : (
                <Logo />
              )}
            </Link>
            <p className="text-sm text-background/60 font-sans leading-relaxed max-w-65">
              Pâine artizanală, fermentată lent, coaptă pe vatră.
            </p>
          </div>

          {/* Quick links */}
          <div>
            <h4 className="font-heading text-lg mb-4">Linkuri rapide</h4>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-sm text-background/70 hover:text-background transition-colors font-sans"
                >
                  {link.label}
                </Link>
              ))}
            </nav>
          </div>

          {/* Contact & Social */}
          <div>
            <h4 className="font-heading text-lg mb-4">Contact</h4>
            <div className="flex flex-col gap-2 text-sm text-background/70 font-sans">
              {siteConfig?.contactPhone && (
                <a
                  href={`tel:${siteConfig.contactPhone}`}
                  className="flex items-center gap-2 hover:text-background transition-colors"
                >
                  <Phone className="w-4 h-4" />
                  {siteConfig.contactPhone}
                </a>
              )}
              {siteConfig?.contactEmail && (
                <a
                  href={`mailto:${siteConfig.contactEmail}`}
                  className="flex items-center gap-2 hover:text-background transition-colors"
                >
                  <Mail className="w-4 h-4" />
                  {siteConfig.contactEmail}
                </a>
              )}
            </div>

            {/* Social icons */}
            <div className="flex gap-3 mt-4">
              {siteConfig?.whatsappNumber && (
                <a
                  href={`https://wa.me/${siteConfig.whatsappNumber.replace(/[^0-9]/g, '')}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="WhatsApp"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-background/10 hover:bg-[#25D366] transition-colors"
                >
                  <MessageCircle className="w-5 h-5" />
                </a>
              )}
              {siteConfig?.facebookUrl && (
                <a
                  href={siteConfig.facebookUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Facebook"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-background/10 hover:bg-blue-600 transition-colors"
                >
                  <Facebook className="w-5 h-5" />
                </a>
              )}
              {siteConfig?.instagramUrl && (
                <a
                  href={siteConfig.instagramUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label="Instagram"
                  className="flex items-center justify-center w-10 h-10 rounded-full bg-background/10 hover:bg-pink-600 transition-colors"
                >
                  <Instagram className="w-5 h-5" />
                </a>
              )}
            </div>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-8 pt-8 border-t border-background/10 text-center text-sm text-background/50 font-sans">
          © {new Date().getFullYear()} Pâine cu Maia by Virgil. Toate drepturile rezervate.
        </div>
      </div>
    </footer>
  )
}

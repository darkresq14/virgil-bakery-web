import { Facebook, Instagram, Mail, MessageCircle, Phone } from 'lucide-react';
import Link from 'next/link';

import { CookieSettingsButton } from '@/components/CookieConsent/CookieSettingsButton';
import { Logo } from '@/components/Logo/Logo';
import { Media } from '@/components/Media';
import { getCachedGlobal } from '@/utilities/getGlobals';

export async function Footer() {
  const footerData = await getCachedGlobal('footer', 1)();
  const siteConfig = await getCachedGlobal('siteConfig', 1)();

  const _navItems = footerData?.navItems || [];

  const footerLinks = [
    { href: '/', label: 'Acasă' },
    { href: '/produse', label: 'Produse' },
    { href: '/cum-comand', label: 'Cum Comanzi' },
    { href: '/maiaua-mea', label: 'Despre' },
    { href: '/posts', label: 'Blog' },
    { href: '/politica-de-confidentialitate', label: 'Politica de Confidențialitate' },
    { href: '#', label: 'Setări Cookies', isCookieSettings: true },
  ];

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
                  unoptimized
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
            <h3 className="font-heading text-lg mb-4">Linkuri rapide</h3>
            <nav className="flex flex-col gap-2">
              {footerLinks.map((link) =>
                link.isCookieSettings ? (
                  <CookieSettingsButton key={link.label} />
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className="text-sm text-background/70 hover:text-background transition-colors font-sans"
                  >
                    {link.label}
                  </Link>
                ),
              )}
            </nav>
          </div>

          {/* Contact & Social */}
          <div>
            <h3 className="font-heading text-lg mb-4">Contact</h3>
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

        {/* Bottom bar */}
        <div className="mt-10 pt-6 border-t border-background/8 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs font-sans text-background/35 tracking-wide">
            &copy; {new Date().getFullYear()}&nbsp;P&acirc;ine cu Maia by Virgil. Toate drepturile
            rezervate.
          </p>
          <p className="text-xs font-sans text-background/35 flex items-center gap-1">
            crafted with <span className="text-accent/60 text-[0.7rem]">♥</span> by{' '}
            <a
              href="https://github.com/darkresq14"
              target="_blank"
              rel="noopener noreferrer"
              className="font-heading text-sm text-background/50 hover:text-accent transition-colors duration-300"
            >
              Răzvan Bielz
            </a>
          </p>
        </div>
      </div>
    </footer>
  );
}

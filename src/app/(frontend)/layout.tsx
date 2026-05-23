import type { Metadata } from 'next'
import { Playfair_Display, Merriweather, Inter } from 'next/font/google'

import { cn } from '@/utilities/ui'
import React from 'react'
import { SpeedInsights } from '@vercel/speed-insights/next'
import { Analytics } from '@vercel/analytics/next'

import { Footer } from '@/Footer/Component'
import { Header } from '@/Header/Component'
import { Providers } from '@/providers'
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph'
import { WhatsAppButton } from '@/components/WhatsAppButton'

import './globals.css'
import { getServerSideURL } from '@/utilities/getURL'

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
})

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
})

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
})

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      className={cn(playfair.variable, merriweather.variable, inter.variable)}
      lang="ro"
      data-theme="light"
      suppressHydrationWarning
    >
      <body>
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-sans"
        >
          Sari la conținutul principal
        </a>
        <div className="flex min-h-screen flex-col">
          <Providers>
            <Header />
            <main id="main-content" className="flex-1 pt-(--header-height,4rem)">
              {children}
            </main>
            <Footer />
            <WhatsAppButton />
            <SpeedInsights />
            <Analytics />
          </Providers>
        </div>
      </body>
    </html>
  )
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: 'Pâine cu Maia by Virgil',
  description:
    'Pâine artizanală, fermentată lent, coaptă pe vatră. Comandă pâine cu maia naturală de la Pâine cu Maia by Virgil.',
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
}

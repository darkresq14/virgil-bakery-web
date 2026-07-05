import { GoogleAnalytics } from '@next/third-parties/google';
import { Analytics } from '@vercel/analytics/next';
import { SpeedInsights } from '@vercel/speed-insights/next';
import type { Metadata } from 'next';
import { Inter, Merriweather, Playfair_Display } from 'next/font/google';
import type React from 'react';
import { CookieConsent } from '@/components/CookieConsent';
import { HolidayBanner } from '@/components/HolidayBanner';
import { HolidayNotice } from '@/components/HolidayNotice';
import { WhatsAppButton } from '@/components/WhatsAppButton';

import { Footer } from '@/Footer/Component';
import { Header } from '@/Header/Component';
import { Providers } from '@/providers';
import { getCachedGlobal } from '@/utilities/getGlobals';
import { getMediaUrl } from '@/utilities/getMediaUrl';
import { holidayDates } from '@/utilities/holidayDates';
import { mergeOpenGraph } from '@/utilities/mergeOpenGraph';
import { localBusinessSchema } from '@/utilities/schema';
import { SITE_DESCRIPTION, SITE_TITLE } from '@/utilities/seoDefaults';
import { cn } from '@/utilities/ui';

import './globals.css';
import { getServerSideURL } from '@/utilities/getURL';

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-playfair',
  display: 'swap',
});

const merriweather = Merriweather({
  subsets: ['latin'],
  weight: ['300', '400', '700'],
  variable: '--font-merriweather',
  display: 'swap',
});

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-inter',
  display: 'swap',
});

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const siteConfig = await getCachedGlobal('siteConfig', 1)();
  const homepage = await getCachedGlobal('homepage', 1)();

  const bizSchema = localBusinessSchema({
    name: 'Pâine cu Maia by Virgil',
    phone: siteConfig?.contactPhone,
    email: siteConfig?.contactEmail,
    address: homepage?.contactSection?.address,
  });

  const holidayStart =
    siteConfig?.holidayStartDate != null ? new Date(siteConfig.holidayStartDate) : null;
  const holidayEnd =
    siteConfig?.holidayEndDate != null ? new Date(siteConfig.holidayEndDate) : null;
  const holiday = holidayDates({
    holidayStartDate: holidayStart,
    holidayEndDate: holidayEnd,
  });
  const holidayImage =
    typeof siteConfig?.holidayModalImage === 'object' && siteConfig?.holidayModalImage?.url
      ? getMediaUrl(siteConfig.holidayModalImage.url)
      : null;

  return (
    <html
      className={cn(playfair.variable, merriweather.variable, inter.variable)}
      lang="ro"
      data-theme="light"
      suppressHydrationWarning
    >
      <head>
        <script
          // biome-ignore lint/security/noDangerouslySetInnerHtml: static GA4 default-consent snippet
          dangerouslySetInnerHTML={{
            __html: `window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('consent','default',{'analytics_storage':'denied'});`,
          }}
        />
      </head>
      <body>
        <script
          type="application/ld+json"
          // biome-ignore lint/security/noDangerouslySetInnerHtml: serialized LocalBusiness JSON-LD
          dangerouslySetInnerHTML={{ __html: JSON.stringify(bizSchema) }}
        />
        <a
          href="#main-content"
          className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-100 focus:rounded-lg focus:bg-primary focus:px-4 focus:py-2 focus:text-primary-foreground focus:text-sm focus:font-sans"
        >
          Sari la conținutul principal
        </a>
        <div className="flex min-h-screen flex-col">
          <Providers>
            <Header
              holidayBanner={
                holiday.isNoticeActive ? (
                  <HolidayBanner
                    lastDeliveryBefore={holiday.lastDeliveryBefore}
                    firstDeliveryAfter={holiday.firstDeliveryAfter}
                  />
                ) : undefined
              }
            />
            <main id="main-content" className="flex-1 pt-(--header-height,4rem)">
              {children}
            </main>
            <Footer />
            <WhatsAppButton />
            <CookieConsent />
            <HolidayNotice
              active={holiday.isHolidayActive}
              title={siteConfig?.holidayModalTitle ?? null}
              message={siteConfig?.holidayModalMessage ?? null}
              imageUrl={holidayImage}
              lastDeliveryBefore={holiday.lastDeliveryBefore}
              firstDeliveryAfter={holiday.firstDeliveryAfter}
            />
            <GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
            <SpeedInsights />
            <Analytics />
          </Providers>
        </div>
      </body>
    </html>
  );
}

export const metadata: Metadata = {
  metadataBase: new URL(getServerSideURL()),
  title: SITE_TITLE,
  description: SITE_DESCRIPTION,
  openGraph: mergeOpenGraph(),
  twitter: {
    card: 'summary_large_image',
  },
  verification: {
    google: process.env.NEXT_PUBLIC_GSC_VERIFICATION || '',
  },
};

import type { Metadata } from 'next';
import { getCachedGlobal } from '@/utilities/getGlobals';
import { ThankYouContent } from './ThankYouContent';

// Post-checkout landing page — never indexed, excluded from the sitemap.
export const metadata: Metadata = {
  title: 'Mulțumim pentru comandă | Pâine cu Maia by Virgil',
  robots: { index: false, follow: false },
};

export default async function ThankYouPage() {
  const siteConfig = await getCachedGlobal('siteConfig', 1)();

  return (
    <ThankYouContent
      title={siteConfig?.thankYouTitle ?? null}
      message={siteConfig?.thankYouMessage ?? null}
    />
  );
}

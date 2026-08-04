import type { Metadata } from 'next';
import { getCachedGlobal } from '@/utilities/getGlobals';
import { holidayDates } from '@/utilities/holidayDates';
import { CartPageClient } from './page.client';

export const metadata: Metadata = {
  title: 'Coșul tău | Pâine cu Maia by Virgil',
  robots: { index: false, follow: true },
};

export default async function CartPage() {
  const siteConfig = await getCachedGlobal('siteConfig', 1)();

  const holidayStartDate =
    siteConfig?.holidayStartDate != null ? new Date(siteConfig.holidayStartDate) : null;
  const holidayEndDate =
    siteConfig?.holidayEndDate != null ? new Date(siteConfig.holidayEndDate) : null;

  const { isNoticeActive } = holidayDates({
    holidayStartDate,
    holidayEndDate,
  });

  return (
    <CartPageClient
      holidayStartDate={holidayStartDate}
      holidayEndDate={holidayEndDate}
      isNoticeActive={isNoticeActive}
    />
  );
}

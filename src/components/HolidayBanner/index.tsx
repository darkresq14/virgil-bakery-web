import { formatRomanianDate } from '@/utilities/deliveryDates';

interface HolidayBannerProps {
  lastDeliveryBefore: Date | null;
  firstDeliveryAfter: Date | null;
}

export function HolidayBanner({ lastDeliveryBefore, firstDeliveryAfter }: HolidayBannerProps) {
  if (lastDeliveryBefore == null || firstDeliveryAfter == null) return null;

  return (
    <div role="status" className="bg-[oklch(55%_0.15_65deg)] text-[oklch(98.5%_0_0deg)]">
      <div className="container flex flex-col items-center justify-center gap-x-6 gap-y-1 px-4 py-2 text-center sm:flex-row sm:text-left font-sans text-sm">
        <span className="font-medium tracking-wide uppercase text-[0.7rem] opacity-80">
          Program concediu
        </span>
        <span>
          Ultima livrare înainte de concediu:{' '}
          <strong className="font-semibold">{formatRomanianDate(lastDeliveryBefore)}</strong>
        </span>
        <span className="hidden sm:inline opacity-40">•</span>
        <span>
          Reluăm livrările:{' '}
          <strong className="font-semibold">{formatRomanianDate(firstDeliveryAfter)}</strong>
        </span>
      </div>
    </div>
  );
}

'use client';

import { CalendarDays, X } from 'lucide-react';
import Image from 'next/image';
import { useEffect, useState } from 'react';

import { formatRomanianDate } from '@/utilities/deliveryDates';

const STORAGE_KEY = 'vb-holiday-notice-seen';

const DEFAULT_TITLE = 'Ne luăm o pauză scurtă';
const DEFAULT_MESSAGE =
  'Tragem aer în piept și pregătim maiaua pentru următoarea serie de pâine. Comenzile se vor relua după vacanță — ne bucurăm să vă revedem!';
const FALLBACK_IMAGE = '/holiday-fallback.svg';

export interface HolidayModalProps {
  active: boolean;
  title: string | null;
  message: string | null;
  imageUrl: string | null;
  lastDeliveryBefore: Date | null;
  firstDeliveryAfter: Date | null;
}

export function HolidayModal({
  active,
  title,
  message,
  imageUrl,
  lastDeliveryBefore,
  firstDeliveryAfter,
}: HolidayModalProps) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!active) return;
    if (sessionStorage.getItem(STORAGE_KEY) === '1') return;
    setOpen(true);
  }, [active]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.body.style.overflow = 'hidden';
    window.addEventListener('keydown', onKey);
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  if (!open) return null;

  const dismiss = () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    document.body.style.overflow = '';
    setOpen(false);
  };

  const heading = title?.trim() ? title : DEFAULT_TITLE;
  const body = message?.trim() ? message : DEFAULT_MESSAGE;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="holiday-modal-title"
      className="fixed inset-0 z-[200] flex items-center justify-center p-4"
    >
      {/* Warm overlay */}
      <button
        type="button"
        aria-label="Închide"
        onClick={dismiss}
        className="absolute inset-0 cursor-default bg-[oklch(20%_0.02_60deg/0.55)] backdrop-blur-[2px]"
        tabIndex={-1}
      />

      <div className="relative z-10 w-full max-w-2xl overflow-hidden rounded-2xl bg-[oklch(99%_0.005_80deg)] shadow-2xl ring-1 ring-[oklch(55%_0.15_65deg/0.2)]">
        {/* Decorative top thread */}
        <div className="h-1.5 w-full bg-gradient-to-r from-[oklch(75%_0.15_70deg)] via-[oklch(55%_0.15_65deg)] to-[oklch(75%_0.15_70deg)]" />

        <div className="grid grid-cols-1 sm:grid-cols-5">
          {/* Image panel */}
          <div className="relative hidden sm:block sm:col-span-2 min-h-[16rem] bg-[oklch(95%_0.02_75deg)]">
            {imageUrl ? (
              <Image
                src={imageUrl}
                alt=""
                fill
                sizes="(max-width: 640px) 0px, 40vw"
                className="object-cover"
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <Image src={FALLBACK_IMAGE} alt="" width={120} height={120} />
              </div>
            )}
          </div>

          {/* Text panel */}
          <div className="sm:col-span-3 p-6 sm:p-8">
            <button
              type="button"
              onClick={dismiss}
              aria-label="Închide"
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full text-[oklch(50%_0.01_60deg)] transition-colors hover:bg-[oklch(95%_0.02_75deg)] hover:text-[oklch(30%_0.02_60deg)]"
            >
              <X className="h-4 w-4" />
            </button>

            <p className="font-sans text-[0.7rem] font-semibold uppercase tracking-[0.2em] text-[oklch(55%_0.15_65deg)]">
              Pâine cu Maia
            </p>

            <h2
              id="holiday-modal-title"
              className="mt-2 font-heading text-2xl sm:text-3xl leading-tight text-[oklch(20%_0.02_60deg)]"
            >
              {heading}
            </h2>

            <p className="mt-4 font-serif text-[0.975rem] leading-relaxed text-[oklch(35%_0.02_60deg)]">
              {body}
            </p>

            {lastDeliveryBefore && firstDeliveryAfter && (
              <div className="mt-5 flex items-start gap-3 rounded-xl border border-[oklch(90%_0.02_75deg)] bg-[oklch(97%_0.01_80deg)] p-4">
                <CalendarDays className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(55%_0.15_65deg)]" />
                <div className="font-sans text-sm leading-relaxed text-[oklch(30%_0.02_60deg)]">
                  <div>
                    Ultima livrare:{' '}
                    <span className="font-semibold text-[oklch(20%_0.02_60deg)]">
                      {formatRomanianDate(lastDeliveryBefore)}
                    </span>
                  </div>
                  <div className="mt-1">
                    Reluăm livrările:{' '}
                    <span className="font-semibold text-[oklch(20%_0.02_60deg)]">
                      {formatRomanianDate(firstDeliveryAfter)}
                    </span>
                  </div>
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={dismiss}
              className="mt-6 w-full rounded-full bg-[oklch(55%_0.15_65deg)] px-6 py-3 font-sans text-sm font-semibold tracking-wide text-[oklch(98.5%_0_0deg)] transition-all hover:bg-[oklch(48%_0.15_65deg)] hover:shadow-lg active:scale-[0.99]"
            >
              Am înțeles
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

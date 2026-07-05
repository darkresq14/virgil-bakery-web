import { getDeliveryCutoff } from '@/utilities/deliveryDates';

export interface HolidayDatesInput {
  holidayStartDate: Date | null;
  holidayEndDate: Date | null;
  referenceDate?: Date;
}

export interface HolidayDatesResult {
  /** Preview OR active holiday — banner + cart notice shown. */
  isNoticeActive: boolean;
  /** Holiday in progress right now — modal shown. */
  isHolidayActive: boolean;
  lastDeliveryBefore: Date | null;
  firstDeliveryAfter: Date | null;
}

const TUESDAY = 2;
const FRIDAY = 5;

function getRomaniaNow(): Date {
  const now = new Date();
  const romaniaStr = now.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' });
  return new Date(romaniaStr);
}

function ymd(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function addDays(date: Date, days: number): Date {
  const d = startOfDay(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Last Tuesday or Friday on or before the given date (day-level). */
function lastDeliveryOnOrBefore(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const back = Math.min((day - TUESDAY + 7) % 7, (day - FRIDAY + 7) % 7);
  d.setDate(d.getDate() - back);
  return d;
}

/** First Tuesday or Friday on or after the given date (day-level). */
function firstDeliveryOnOrAfter(date: Date): Date {
  const d = startOfDay(date);
  const day = d.getDay();
  const forward = Math.min((TUESDAY - day + 7) % 7, (FRIDAY - day + 7) % 7);
  d.setDate(d.getDate() + forward);
  return d;
}

export function holidayDates(input: HolidayDatesInput): HolidayDatesResult {
  const { holidayStartDate, holidayEndDate, referenceDate } = input;

  if (holidayStartDate == null || holidayEndDate == null) {
    return {
      isNoticeActive: false,
      isHolidayActive: false,
      lastDeliveryBefore: null,
      firstDeliveryAfter: null,
    };
  }

  const start = startOfDay(holidayStartDate);
  const end = startOfDay(holidayEndDate);
  const lastDeliveryBefore = lastDeliveryOnOrBefore(addDays(start, -1));
  const firstDeliveryAfter = firstDeliveryOnOrAfter(addDays(end, 1));

  // A delivery day falls inside the holiday range -> the holiday disrupts at
  // least one round and will appear as a disabled "concediu" date in the
  // dropdown. That's the signal to start informing customers.
  const firstOverlapping = firstDeliveryOnOrAfter(start);
  const hasOverlap = ymd(firstOverlapping) <= ymd(end);

  const ref = referenceDate ?? getRomaniaNow();
  const refDay = ymd(ref);

  // Notice covers preview (holiday visible ahead) through the end date.
  const isNoticeActive = hasOverlap && refDay <= ymd(end);
  // Modal fires once no pre-holiday slot remains orderable — the cutoff of
  // the last delivery round before the holiday — and stays through the end.
  const isHolidayActive =
    hasOverlap &&
    ref.getTime() >= getDeliveryCutoff(lastDeliveryBefore).getTime() &&
    refDay <= ymd(end);

  return {
    isNoticeActive,
    isHolidayActive,
    lastDeliveryBefore,
    firstDeliveryAfter,
  };
}

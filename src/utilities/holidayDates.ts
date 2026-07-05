import { getDeliveryCutoff } from '@/utilities/deliveryDates';

export interface HolidayDatesInput {
  holidayStartDate: Date | null;
  holidayEndDate: Date | null;
  referenceDate?: Date;
}

export interface HolidayDatesResult {
  isNoticeActive: boolean;
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
    return { isNoticeActive: false, lastDeliveryBefore: null, firstDeliveryAfter: null };
  }

  const lastDeliveryBefore = lastDeliveryOnOrBefore(addDays(holidayStartDate, -1));
  const firstDeliveryAfter = firstDeliveryOnOrAfter(addDays(holidayEndDate, 1));

  // The notice fires once the first holiday-overlapping delivery date enters the
  // dropdown window, defined as the cutoff of the last delivery round before the
  // holiday start. It stays live through the end date (inclusive).
  const firstOverlapping = firstDeliveryOnOrAfter(holidayStartDate);
  const hasOverlap = ymd(firstOverlapping) <= ymd(holidayEndDate);
  const triggerTime = getDeliveryCutoff(lastDeliveryBefore);

  const ref = referenceDate ?? getRomaniaNow();
  const withinHoliday = ymd(ref) <= ymd(holidayEndDate);
  const isNoticeActive = hasOverlap && ref.getTime() >= triggerTime.getTime() && withinHoliday;

  return {
    isNoticeActive,
    lastDeliveryBefore,
    firstDeliveryAfter,
  };
}

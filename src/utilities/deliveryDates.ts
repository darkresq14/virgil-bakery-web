export interface DeliveryDateOption {
  date: Date;
  label: string;
  isSelectable: boolean;
  isHoliday: boolean;
  /** Why the option is unselectable (null when selectable or holiday-blocked). */
  blockedReason: DeliveryBlockedReason | null;
}

export type DeliveryBlockedReason = 'cutoff' | 'availability';

const DAY_NAMES: Record<number, string> = {
  1: 'Luni',
  2: 'Marți',
  3: 'Miercuri',
  4: 'Joi',
  5: 'Vineri',
  6: 'Sâmbătă',
  0: 'Duminică',
};

const MONTH_NAMES: Record<number, string> = {
  0: 'Ianuarie',
  1: 'Februarie',
  2: 'Martie',
  3: 'Aprilie',
  4: 'Mai',
  5: 'Iunie',
  6: 'Iulie',
  7: 'August',
  8: 'Septembrie',
  9: 'Octombrie',
  10: 'Noiembrie',
  11: 'Decembrie',
};

// --- Europe/Bucharest helpers -------------------------------------------------
// Wall-clock math must be timezone-explicit: production renders on UTC (Vercel)
// while customers (and the reference dates below) live in Europe/Bucharest.

interface RoParts {
  year: number;
  month: number; // 0-indexed, like Date
  day: number;
  hour: number;
  minute: number;
}

const roDateTimeFormat = new Intl.DateTimeFormat('en-US', {
  timeZone: 'Europe/Bucharest',
  hour12: false,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  minute: '2-digit',
});

function getRoParts(date: Date): RoParts {
  const parts = roDateTimeFormat.formatToParts(date);
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    Number(parts.find((p) => p.type === type)?.value);
  return {
    year: get('year'),
    month: get('month') - 1,
    day: get('day'),
    hour: get('hour') % 24,
    minute: get('minute'),
  };
}

/** Calendar-day key in Europe/Bucharest, e.g. "2026-10-31" (lexically sortable). */
export function roDayKey(date: Date): string {
  const p = getRoParts(date);
  return `${p.year}-${String(p.month + 1).padStart(2, '0')}-${String(p.day).padStart(2, '0')}`;
}

/** Europe/Bucharest offset from UTC (ms) at the given instant. */
function roOffsetMs(date: Date): number {
  const p = getRoParts(date);
  const asUtc = Date.UTC(p.year, p.month, p.day, p.hour, p.minute);
  return asUtc - Math.floor(date.getTime() / 60000) * 60000;
}

/** Absolute instant matching an Europe/Bucharest wall-clock time. */
function roWallTime(year: number, month: number, day: number, hour: number, minute: number): Date {
  const wall = Date.UTC(year, month, day, hour, minute);
  let guess = new Date(wall);
  for (let i = 0; i < 2; i++) {
    const candidate = new Date(wall - roOffsetMs(guess));
    if (candidate.getTime() === guess.getTime()) return candidate;
    guess = candidate;
  }
  return guess;
}

function getRomaniaNow(): Date {
  const now = new Date();
  const romaniaStr = now.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' });
  return new Date(romaniaStr);
}

function nextDayOnOrAfter(date: Date, targetDay: number): Date {
  const d = new Date(date);
  const diff = (targetDay - d.getDay() + 7) % 7;
  d.setDate(d.getDate() + diff);
  return d;
}

/**
 * Ordering cutoff for a delivery date, at 17:00 Europe/Bucharest two days
 * before the delivery: Tuesday delivery -> order by preceding Sunday 17:00,
 * Friday delivery -> order by preceding Wednesday 17:00.
 */
export function getDeliveryCutoff(deliveryDate: Date): Date {
  const p = getRoParts(deliveryDate);
  return roWallTime(p.year, p.month, p.day - 2, 17, 0);
}

/** Same Europe/Bucharest wall-clock time, `days` calendar days earlier. */
export function subtractRoDays(date: Date, days: number): Date {
  const p = getRoParts(date);
  return roWallTime(p.year, p.month, p.day - days, p.hour, p.minute);
}

/** Inclusive day-level check: does `date` fall inside the holiday period? */
export function isInHoliday(
  date: Date,
  holidayStartDate: Date | string | null | undefined,
  holidayEndDate: Date | string | null | undefined,
): boolean {
  if (holidayStartDate == null || holidayEndDate == null) return false;
  const key = roDayKey(date);
  return key >= roDayKey(new Date(holidayStartDate)) && key <= roDayKey(new Date(holidayEndDate));
}

/** Formats a date as "Luni, 13 Iunie" (Romanian long form). */
export function formatRomanianDate(date: Date): string {
  const dayName = DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return `${dayName}, ${day} ${month}`;
}

export interface GetDeliveryDatesInput {
  holidayStartDate?: Date | null;
  holidayEndDate?: Date | null;
  referenceDate?: Date;
  /**
   * Weekdays the order can be delivered on (product Availability Day
   * intersection, see productAvailability.ts). Defaults to all delivery days.
   * Days outside this set are still shown, but grayed out. An empty set means
   * no weekday is orderable — every option comes back unselectable.
   */
  allowedDays?: number[];
  /**
   * Concrete calendar days the order can be delivered on (One-off Availability,
   * see productAvailability.ts). Null/undefined = no date restriction. An
   * empty array means a cart conflict: every option is unselectable with
   * blockedReason "availability".
   */
  allowedDates?: Date[] | null;
}

export function getDeliveryDates(input?: GetDeliveryDatesInput): DeliveryDateOption[] {
  const now = input?.referenceDate ?? getRomaniaNow();
  const deliveryDays = [2, 5]; // Tuesday, Friday — always both, so restricted
  // days render as grayed-out options rather than vanishing
  const allowedDays = input?.allowedDays ?? [2, 5];
  const allowedDates = input?.allowedDates ?? null;
  const allowedDateKeys = allowedDates != null ? new Set(allowedDates.map(roDayKey)) : null;
  const holidayStartKey = input?.holidayStartDate != null ? roDayKey(input.holidayStartDate) : null;
  const holidayEndKey = input?.holidayEndDate != null ? roDayKey(input.holidayEndDate) : null;
  const inHoliday = (date: Date) => {
    if (holidayStartKey == null || holidayEndKey == null) return false;
    const key = roDayKey(date);
    return key >= holidayStartKey && key <= holidayEndKey;
  };
  const makeOption = (date: Date): DeliveryDateOption => {
    const holiday = inHoliday(date);
    const dayAllowed = allowedDays.includes(date.getDay());
    const dateAllowed = allowedDateKeys == null || allowedDateKeys.has(roDayKey(date));
    return {
      date,
      label: formatRomanianDate(date),
      isSelectable: !holiday && dayAllowed && dateAllowed,
      isHoliday: holiday,
      blockedReason: !dayAllowed || !dateAllowed ? 'availability' : null,
    };
  };
  const results: DeliveryDateOption[] = [];

  for (const targetDay of deliveryDays) {
    const nearest = nextDayOnOrAfter(now, targetDay);
    const cutoff = getDeliveryCutoff(nearest);

    if (now < cutoff) {
      results.push(makeOption(nearest));
    } else {
      // Show grayed-out occurrence + next week's selectable occurrence.
      // Availability blocks keep their (more actionable) reason over the cutoff.
      const pastCutoff = makeOption(nearest);
      pastCutoff.isSelectable = false;
      if (pastCutoff.blockedReason == null) pastCutoff.blockedReason = 'cutoff';
      results.push(pastCutoff);

      const next = new Date(nearest);
      next.setDate(next.getDate() + 7);
      results.push(makeOption(next));
    }
  }

  // Sort chronologically
  results.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Guarantee selectable dates. When a holiday or an Availability Day
  // restriction consumes the normal selectable window, extend forward with
  // future delivery days (skipping any that still fall inside the holiday) until
  // the threshold is met. Only allowed weekdays are considered — grayed-out days
  // never help reach the threshold. With a single allowed weekday the dropdown
  // stays at the regular Tuesday/Friday pattern (threshold 1) instead of
  // accumulating extra Fridays. When concrete allowedDates restrict the cart,
  // never extend past the latest allowed date — dates beyond it can never
  // become selectable, so the loop stops there instead of running away.
  const selectableTarget = allowedDays.length >= 2 ? 2 : 1;
  const candidateDays = allowedDays.length > 0 ? allowedDays : [];
  const maxAllowedMs =
    allowedDates == null
      ? Number.POSITIVE_INFINITY
      : allowedDates.length > 0
        ? Math.max(...allowedDates.map((d) => d.getTime()))
        : Number.NEGATIVE_INFINITY;
  let lastDate = results.at(-1)?.date ?? now;
  while (
    candidateDays.length > 0 &&
    results.filter((r) => r.isSelectable).length < selectableTarget
  ) {
    const dayAfter = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
    const nextCandidate = candidateDays
      .map((day) => nextDayOnOrAfter(dayAfter, day))
      .sort((a, b) => a.getTime() - b.getTime())[0];
    if (nextCandidate.getTime() > maxAllowedMs) break;
    if (!results.some((r) => r.date.getTime() === nextCandidate.getTime())) {
      results.push(makeOption(nextCandidate));
    }
    lastDate = nextCandidate;
  }

  results.sort((a, b) => a.date.getTime() - b.date.getTime());

  return results;
}

export function getDefaultDeliveryDate(dates: DeliveryDateOption[]): string {
  const selectable = dates.find((d) => d.isSelectable);
  return selectable ? selectable.label : '';
}

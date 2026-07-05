export interface DeliveryDateOption {
  date: Date;
  label: string;
  isSelectable: boolean;
  isHoliday: boolean;
}

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
 * Ordering cutoff for a delivery date, in the local time frame.
 * Tuesday delivery -> order by preceding Sunday 17:00.
 * Friday delivery -> order by preceding Wednesday 17:00.
 */
export function getDeliveryCutoff(deliveryDate: Date): Date {
  const day = deliveryDate.getDay();
  const cutoffDayOffset = day === 2 ? -2 : -2;
  const cutoff = new Date(deliveryDate);
  cutoff.setDate(cutoff.getDate() + cutoffDayOffset);
  cutoff.setHours(17, 0, 0, 0);
  return cutoff;
}

function startOfDay(date: Date): Date {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
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
}

export function getDeliveryDates(input?: GetDeliveryDatesInput): DeliveryDateOption[] {
  const now = input?.referenceDate ?? getRomaniaNow();
  const holidayStart = input?.holidayStartDate != null ? startOfDay(input.holidayStartDate) : null;
  const holidayEnd = input?.holidayEndDate != null ? startOfDay(input.holidayEndDate) : null;
  const inHoliday = (date: Date) => {
    if (holidayStart == null || holidayEnd == null) return false;
    const day = startOfDay(date);
    return day.getTime() >= holidayStart.getTime() && day.getTime() <= holidayEnd.getTime();
  };
  const makeOption = (date: Date): DeliveryDateOption => {
    const holiday = inHoliday(date);
    return {
      date,
      label: formatRomanianDate(date),
      isSelectable: !holiday,
      isHoliday: holiday,
    };
  };
  const results: DeliveryDateOption[] = [];

  const deliveryDays = [2, 5] as const; // Tuesday, Friday

  for (const targetDay of deliveryDays) {
    const nearest = nextDayOnOrAfter(now, targetDay);
    const cutoff = getDeliveryCutoff(nearest);
    const isSelectable = now < cutoff;

    if (isSelectable) {
      const option = makeOption(nearest);
      results.push(option);
    } else {
      // Show grayed-out occurrence + next week's selectable occurrence
      results.push({ ...makeOption(nearest), isSelectable: false });

      const next = new Date(nearest);
      next.setDate(next.getDate() + 7);
      results.push(makeOption(next));
    }
  }

  // Sort chronologically
  results.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Guarantee at least two selectable dates. When a holiday consumes the normal
  // selectable window, extend forward with future delivery days (skipping any that
  // still fall inside the holiday) until the threshold is met.
  let lastDate = results.at(-1)?.date ?? now;
  while (results.filter((r) => r.isSelectable).length < 2) {
    const dayAfter = new Date(lastDate.getTime() + 24 * 60 * 60 * 1000);
    const candidateTue = nextDayOnOrAfter(dayAfter, 2);
    const candidateFri = nextDayOnOrAfter(dayAfter, 5);
    const nextCandidate =
      candidateTue.getTime() <= candidateFri.getTime() ? candidateTue : candidateFri;
    results.push(makeOption(nextCandidate));
    lastDate = nextCandidate;
  }

  results.sort((a, b) => a.date.getTime() - b.date.getTime());

  return results;
}

export function getDefaultDeliveryDate(dates: DeliveryDateOption[]): string {
  const selectable = dates.find((d) => d.isSelectable);
  return selectable ? selectable.label : '';
}

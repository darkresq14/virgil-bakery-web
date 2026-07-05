export interface DeliveryDateOption {
  date: Date;
  label: string;
  isSelectable: boolean;
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

function formatLabel(date: Date): string {
  const dayName = DAY_NAMES[date.getDay()];
  const day = date.getDate();
  const month = MONTH_NAMES[date.getMonth()];
  return `${dayName}, ${day} ${month}`;
}

export function getDeliveryDates(): DeliveryDateOption[] {
  const now = getRomaniaNow();
  const results: DeliveryDateOption[] = [];

  const deliveryDays = [2, 5] as const; // Tuesday, Friday

  for (const targetDay of deliveryDays) {
    const nearest = nextDayOnOrAfter(now, targetDay);
    const cutoff = getDeliveryCutoff(nearest);
    const isSelectable = now < cutoff;

    if (isSelectable) {
      results.push({
        date: nearest,
        label: formatLabel(nearest),
        isSelectable: true,
      });
    } else {
      // Show grayed-out occurrence + next week's selectable occurrence
      results.push({
        date: nearest,
        label: formatLabel(nearest),
        isSelectable: false,
      });

      const next = new Date(nearest);
      next.setDate(next.getDate() + 7);

      results.push({
        date: next,
        label: formatLabel(next),
        isSelectable: true,
      });
    }
  }

  // Sort chronologically
  results.sort((a, b) => a.date.getTime() - b.date.getTime());

  return results;
}

export function getDefaultDeliveryDate(dates: DeliveryDateOption[]): string {
  const selectable = dates.find((d) => d.isSelectable);
  return selectable ? selectable.label : '';
}

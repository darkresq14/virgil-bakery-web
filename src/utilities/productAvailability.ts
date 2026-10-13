/**
 * Availability Day model (see CONTEXT.md → Bakery Availability).
 * The weekday(s) a product can be delivered on. Delivery days are Tuesday (2)
 * and Friday (5) — see deliveryDates.ts.
 */
export type AvailableDays = 'both' | 'tuesday' | 'friday';

export const ALL_DELIVERY_DAYS = [2, 5] as const;

/** Maps the product's availability setting to concrete weekday numbers. */
export function availabilityDaysToWeekdays(days?: AvailableDays | null): number[] {
  if (days === 'tuesday') return [2];
  if (days === 'friday') return [5];
  return [...ALL_DELIVERY_DAYS];
}

/** Short Romanian label for restricted products, or null when unrestricted. */
export function availableDaysLabel(days?: AvailableDays | null): string | null {
  switch (days) {
    case 'tuesday':
      return 'Doar marți';
    case 'friday':
      return 'Doar vineri';
    default:
      return null;
  }
}

/** Weekday-name lookup shared with deliveryDates.ts labels. */
const WEEKDAY_NAMES: Record<number, string> = {
  2: 'marți',
  5: 'vineri',
};

/** Romanian list of weekday names for a set of day numbers, e.g. "marți". */
export function weekdayListLabel(days: number[]): string {
  return days
    .map((d) => WEEKDAY_NAMES[d] ?? '')
    .filter(Boolean)
    .join(' și ');
}

/** Intersection of several weekday sets (cart-wide allowed delivery days). */
export function intersectWeekdays(sets: number[][]): number[] {
  if (sets.length === 0) return [...ALL_DELIVERY_DAYS];
  return [...ALL_DELIVERY_DAYS].filter((day) => sets.every((set) => set.includes(day)));
}

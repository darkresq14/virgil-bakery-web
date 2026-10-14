import { formatRomanianDate, getDeliveryCutoff, roDayKey, subtractRoDays } from './deliveryDates';

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

// --- One-off Availability (see CONTEXT.md → Bakery Availability) -----------

/** One-off activation lead: 7 days = from the previous cycle's cutoff to this
 * date's cutoff (the exact span during which the date is offered by the
 * delivery-date picker). Applied as wall-clock days, not absolute ms, so the
 * window stays at 17:00 across DST switches. */
const ONE_OFF_ACTIVATION_LEAD_DAYS = 7;

/**
 * Normalizes any instant to its Europe/Bucharest calendar day as UTC midnight,
 * so weekday/day comparisons are stable on servers and clients alike.
 */
export function parseOneOffDate(value: string | Date | null | undefined): Date | null {
  if (value == null || value === '') return null;
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return new Date(`${roDayKey(date)}T00:00:00.000Z`);
}

/** True when both instants fall on the same Europe/Bucharest calendar day. */
export function isSameRoDay(a: Date, b: Date): boolean {
  return roDayKey(a) === roDayKey(b);
}

/**
 * One-off purchase window: opens when the date first becomes selectable in the
 * delivery-date picker (cutoff of the previous same-weekday cycle — Wednesday
 * 17:00, nine days before a Friday) and closes at the date's own cutoff
 * (17:00, two days before). Computed, never stored.
 */
export function isOneOffPurchaseable(oneOff: Date, now: Date = new Date()): boolean {
  const cutoff = getDeliveryCutoff(oneOff);
  const activation = subtractRoDays(cutoff, ONE_OFF_ACTIVATION_LEAD_DAYS);
  return now.getTime() >= activation.getTime() && now.getTime() < cutoff.getTime();
}

/** Badge label for one-off products, e.g. "Doar vineri, 31 octombrie". */
export function oneOffDateLabel(oneOff: Date): string {
  return `Doar ${formatRomanianDate(oneOff).toLowerCase()}`;
}

/** Product fields the delivery-label helpers read. */
export interface DeliveryLabelSource {
  availableDays?: AvailableDays | null;
  availableOnDate?: string | Date | null;
}

/**
 * Inline (mid-sentence) delivery label, e.g. "vineri, 31 octombrie" or
 * "marți". Null when the product has no delivery restriction.
 */
export function inlineDeliveryLabel(product: DeliveryLabelSource): string | null {
  const oneOff = parseOneOffDate(product.availableOnDate);
  if (oneOff) return formatRomanianDate(oneOff).toLowerCase();
  return availableDaysLabel(product.availableDays)?.toLowerCase() ?? null;
}

/**
 * Badge label, e.g. "Doar vineri, 31 octombrie" or "Doar marți". Null when
 * the product has no delivery restriction.
 */
export function badgeDeliveryLabel(product: DeliveryLabelSource): string | null {
  const oneOff = parseOneOffDate(product.availableOnDate);
  if (oneOff) return oneOffDateLabel(oneOff);
  return availableDaysLabel(product.availableDays);
}

export interface EffectiveAvailability {
  available?: boolean | null;
  availableOnDate?: string | Date | null;
}

/**
 * Runtime purchaseability. One-off Availability has the highest priority and
 * overrides the "Disponibil" checkbox entirely; without it, the checkbox rules.
 */
export function isEffectivelyPurchaseable(
  product: EffectiveAvailability,
  now: Date = new Date(),
): boolean {
  const oneOff = parseOneOffDate(product.availableOnDate);
  if (oneOff) return isOneOffPurchaseable(oneOff, now);
  return product.available !== false;
}

/** True when the product is a one-off currently inside its purchase window. */
export function isActiveOneOff(product: EffectiveAvailability, now: Date = new Date()): boolean {
  const oneOff = parseOneOffDate(product.availableOnDate);
  return oneOff != null && isOneOffPurchaseable(oneOff, now);
}

import { isPersonalDeliveryZone } from '@/utilities/deliveryZone';

/**
 * GLS delivery pricing + zone detection (issue #47).
 *
 * Outside the personal delivery zone the customer picks between:
 * - GLS Point Delivery (parcel locker / ParcelShop) — flat fee
 * - GLS Home Delivery — tiered by total shipping weight (grams)
 *
 * Home tiers are baker-confirmed (comms, 2026-11-21).
 */

/** Delivery methods stored on the Order and sent to the sheet wire. */
export type DeliveryMethod = 'personal' | 'gls-punct' | 'gls-acasa';

/** A GLS delivery point as emitted by the official widget (and cached in
 * the checkout's localStorage profile). Single source for the field set —
 * mirror of the Orders `glsPoint` group and the wire `punct*` fields
 * (ADR 0007). */
export interface GlsPoint {
  /** Matchcode — MyGLS PSDParameter.StringValue. */
  matchcode: string;
  /** Numeric DropOffPoint ID — MyGLS PSDParameter.IntegerValue. */
  goldId?: string;
  nume: string;
  adresa: string;
  tip: string;
}

/** Stored/wire variant of {@link GlsPoint} — Payload text columns are
 * nullable, so every field is optional. */
export interface GlsPointData {
  goldId?: string | null;
  matchcode?: string | null;
  nume?: string | null;
  adresa?: string | null;
  tip?: string | null;
}

/** Flat fee (lei) for GLS Point Delivery — any quantity. Baker-confirmed. */
export const POINT_SHIPPING_COST = 25;

/** Zone classification from the customer's judet + localitate. */
export type DeliveryZone = 'unknown' | 'in' | 'out';

export function detectDeliveryZone(judet: string, localitate: string): DeliveryZone {
  if (!judet || !localitate) return 'unknown';
  return isPersonalDeliveryZone(judet, localitate) ? 'in' : 'out';
}

/**
 * GLS Home Delivery tiers by total shipping weight — inclusive upper
 * bound in grams, fee in lei, and the checkout label for the tier.
 * Baker-confirmed (comms, 2026-11-21).
 */
const HOME_TIERS = [
  { maxGrams: 2000, cost: 26, label: 'până la 2 kg' },
  { maxGrams: 5000, cost: 33, label: 'până la 5 kg' },
  { maxGrams: 10000, cost: 43, label: 'până la 10 kg' },
] as const;

function homeTierFor(totalGrams: number) {
  return HOME_TIERS.find((tier) => totalGrams <= tier.maxGrams) ?? null;
}

/**
 * GLS Home Delivery fee by total shipping weight in grams (lei).
 * null = unavailable (above 10 kg — point delivery still is).
 */
export function homeShippingCost(totalGrams: number): number | null {
  return homeTierFor(totalGrams)?.cost ?? null;
}

/** Checkout label for the home tier the cart lands in ("până la 5 kg"). */
export function homeTierLabel(totalGrams: number): string | null {
  return homeTierFor(totalGrams)?.label ?? null;
}

/**
 * Shipping cost for the resolved method. null = the chosen method is
 * unavailable for this cart (home delivery above 10 kg).
 */
export function shippingCostFor(
  method: DeliveryMethod,
  zone: DeliveryZone,
  totalGrams: number,
): number | null {
  if (zone !== 'out') return 0;
  if (method === 'gls-punct') return POINT_SHIPPING_COST;
  if (method === 'gls-acasa') return homeShippingCost(totalGrams);
  return 0;
}

/** Cheapest national (outside-zone) shipping rate — GLS point flat fee.
 * Used by the schema.org product offers. */
export const NATIONAL_SHIPPING_MIN = POINT_SHIPPING_COST;

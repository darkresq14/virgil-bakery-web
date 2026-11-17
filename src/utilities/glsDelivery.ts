import { isPersonalDeliveryZone } from '@/utilities/deliveryZone';

/**
 * GLS delivery pricing + zone detection (issue #47).
 *
 * Outside the personal delivery zone the customer picks between:
 * - GLS Point Delivery (parcel locker / ParcelShop) — flat fee
 * - GLS Home Delivery — tiered by total item quantity
 *
 * Home tiers are the baker's indicative prices ("prețuri orientative");
 * exact values pending his confirmation (baker comms #57).
 */

/** Delivery methods stored on the Order and sent to the sheet wire. */
export type DeliveryMethod = 'personal' | 'gls-punct' | 'gls-acasa';

/** Flat fee (lei) for GLS Point Delivery — any quantity. Baker-confirmed. */
export const POINT_SHIPPING_COST = 25;

/** Zone classification from the customer's judet + localitate. */
export type DeliveryZone = 'unknown' | 'in' | 'out';

export function detectDeliveryZone(judet: string, localitate: string): DeliveryZone {
  if (!judet || !localitate) return 'unknown';
  return isPersonalDeliveryZone(judet, localitate) ? 'in' : 'out';
}

/**
 * GLS Home Delivery fee by total item quantity (lei). Baker's indicative
 * tiers; null = unavailable (more than 10 items — locker still is).
 */
export function homeShippingCost(totalQuantity: number): number | null {
  if (totalQuantity <= 2) return 26;
  if (totalQuantity === 3) return 30;
  if (totalQuantity <= 5) return 39;
  if (totalQuantity <= 10) return 53;
  return null;
}

/**
 * Shipping cost for the resolved method. null = the chosen method is
 * unavailable for this cart (home delivery above 10 items).
 */
export function shippingCostFor(
  method: DeliveryMethod,
  zone: DeliveryZone,
  totalQuantity: number,
): number | null {
  if (zone !== 'out') return 0;
  if (method === 'gls-punct') return POINT_SHIPPING_COST;
  if (method === 'gls-acasa') return homeShippingCost(totalQuantity);
  return 0;
}

/** Cheapest national (outside-zone) shipping rate — GLS point flat fee.
 * Used by the schema.org product offers. */
export const NATIONAL_SHIPPING_MIN = POINT_SHIPPING_COST;

import { isPersonalDeliveryZone } from '@/utilities/deliveryZone'

export interface DeliveryMethodResult {
  deliveryMethod: 'personal' | 'curier'
  shippingCost: number
}

/** Flat courier fee (lei) for national shipping. Shared so product schema stays in sync. */
export const COURIER_SHIPPING_COST = 25

/**
 * Detects the delivery method and shipping cost based on the customer's address.
 * Returns personal delivery (free) for addresses in the Sibiu delivery zone,
 * or courier delivery for all other addresses.
 */
export function detectDeliveryMethod(judet: string, localitate: string): DeliveryMethodResult {
  if (judet && localitate && isPersonalDeliveryZone(judet, localitate)) {
    return { deliveryMethod: 'personal', shippingCost: 0 }
  }

  return { deliveryMethod: 'curier', shippingCost: COURIER_SHIPPING_COST }
}

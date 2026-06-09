import { isPersonalDeliveryZone } from '@/utilities/deliveryZone'

export interface DeliveryMethodResult {
  deliveryMethod: 'personal' | 'curier'
  shippingCost: number
}

/**
 * Detects the delivery method and shipping cost based on the customer's address.
 * Returns personal delivery (free) for addresses in the Sibiu delivery zone,
 * or courier delivery (25 lei) for all other addresses.
 */
export function detectDeliveryMethod(judet: string, localitate: string): DeliveryMethodResult {
  if (judet && localitate && isPersonalDeliveryZone(judet, localitate)) {
    return { deliveryMethod: 'personal', shippingCost: 0 }
  }

  return { deliveryMethod: 'curier', shippingCost: 25 }
}

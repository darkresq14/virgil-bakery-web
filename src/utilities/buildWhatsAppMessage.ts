import { formatPrice } from '@/utilities/formatPrice'

const DELIVERY_METHOD_LABELS = {
  personal: 'Livrare personală',
  curier: 'Livrare prin curier',
} as const

interface CartItem {
  name: string
  quantity: number
  price: number
}

interface BuildWhatsAppMessageParams {
  items: CartItem[]
  subtotal: number
  shippingCost: number
  deliveryDate: string
  deliveryMethod: 'personal' | 'curier'
  customerName?: string
  customerPhone?: string
  judet?: string
  localitate?: string
  streetAddress?: string
  addressDetails?: string
}

/**
 * Builds the WhatsApp message for an order.
 * Format varies based on delivery method and customer type:
 * - First-time buyer: includes name, phone, structured address
 * - Returning customer: no address fields
 * - Courier: includes Subtotal + Transport lines
 * - Personal: just Total (no transport)
 */
export function buildWhatsAppMessage(params: BuildWhatsAppMessageParams): string {
  const {
    items,
    subtotal,
    shippingCost,
    deliveryDate,
    deliveryMethod,
    customerName,
    customerPhone,
    judet,
    localitate,
    streetAddress,
    addressDetails,
  } = params

  const total = subtotal + shippingCost
  const hasCustomerInfo = !!(customerName || customerPhone || streetAddress)
  const isCourier = deliveryMethod === 'curier'
  const methodLabel = DELIVERY_METHOD_LABELS[deliveryMethod]

  const lines: string[] = [
    'Bună ziua! Doresc să comand:',
    '',
    ...items.map((item) => `• ${item.quantity}x ${item.name} - ${formatPrice(item.price * item.quantity)}`),
    '',
  ]

  if (hasCustomerInfo || isCourier) {
    lines.push(`Subtotal: ${formatPrice(subtotal)}`)
  }

  if (isCourier) {
    lines.push(`Transport (Curier Cargus): ${formatPrice(shippingCost)}`)
  }

  lines.push(`Total: ${formatPrice(total)}`)
  lines.push(`Livrare: ${deliveryDate}`)
  lines.push(`Metoda: ${methodLabel}`)

  if (hasCustomerInfo) {
    if (customerName) lines.push(`Nume: ${customerName}`)
    if (customerPhone) lines.push(`Telefon: ${customerPhone}`)
    if (judet) lines.push(`Județ: ${judet}`)
    if (localitate) lines.push(`Localitate: ${localitate}`)
    if (streetAddress) lines.push(`Adresă: ${streetAddress}`)
    if (addressDetails) lines.push(`Detalii: ${addressDetails}`)
  }

  lines.push('')
  lines.push('Mulțumesc!')

  return lines.join('\n')
}

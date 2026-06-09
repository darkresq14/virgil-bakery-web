import { describe, expect, it } from 'vitest'

import { buildWhatsAppMessage } from '@/utilities/buildWhatsAppMessage'

const formatPrice = (price: number) =>
  new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(price)

describe('buildWhatsAppMessage', () => {
  const baseItems = [
    { name: 'Pâine Albă', quantity: 2, price: 10 },
    { name: 'Scovergă', quantity: 1, price: 10 },
  ]

  const baseParams = {
    items: baseItems,
    subtotal: 30,
    shippingCost: 0,
    deliveryDate: 'Vineri, 13 Iunie',
    deliveryMethod: 'personal' as const,
  }

  describe('first-time buyer — personal delivery', () => {
    it('includes items, total, delivery date, method, name, phone, and address', () => {
      const message = buildWhatsAppMessage({
        ...baseParams,
        customerName: 'Ion Popescu',
        customerPhone: '+40 7XX XXX XXX',
        judet: 'Sibiu',
        localitate: 'Sibiu',
        streetAddress: 'Str. X nr. Y',
        addressDetails: 'ap. 3, interfon 02',
      })

      expect(message).toContain('Bună ziua! Doresc să comand:')
      expect(message).toContain(`• 2x Pâine Albă - ${formatPrice(20)}`)
      expect(message).toContain(`• 1x Scovergă - ${formatPrice(10)}`)
      expect(message).toContain(`Subtotal: ${formatPrice(30)}`)
      expect(message).not.toContain('Transport')
      expect(message).toContain(`Total: ${formatPrice(30)}`)
      expect(message).toContain('Livrare: Vineri, 13 Iunie')
      expect(message).toContain('Metoda: Livrare personală')
      expect(message).toContain('Nume: Ion Popescu')
      expect(message).toContain('Telefon: +40 7XX XXX XXX')
      expect(message).toContain('Județ: Sibiu')
      expect(message).toContain('Localitate: Sibiu')
      expect(message).toContain('Adresă: Str. X nr. Y')
      expect(message).toContain('Detalii: ap. 3, interfon 02')
      expect(message).toContain('Mulțumesc!')
    })

    it('omits Detalii line when addressDetails is empty', () => {
      const message = buildWhatsAppMessage({
        ...baseParams,
        customerName: 'Ion Popescu',
        customerPhone: '+40 7XX XXX XXX',
        judet: 'Sibiu',
        localitate: 'Sibiu',
        streetAddress: 'Str. X nr. Y',
        addressDetails: '',
      })

      expect(message).not.toContain('Detalii:')
    })
  })

  describe('first-time buyer — courier delivery', () => {
    it('includes transport line with 25 cost', () => {
      const message = buildWhatsAppMessage({
        ...baseParams,
        subtotal: 30,
        shippingCost: 25,
        deliveryMethod: 'curier',
        customerName: 'Ion Popescu',
        customerPhone: '+40 7XX XXX XXX',
        judet: 'Cluj',
        localitate: 'Cluj-Napoca',
        streetAddress: 'Str. Z nr. 5',
        addressDetails: '',
      })

      expect(message).toContain(`Subtotal: ${formatPrice(30)}`)
      expect(message).toContain(`Transport (Curier Cargus): ${formatPrice(25)}`)
      expect(message).toContain(`Total: ${formatPrice(55)}`)
      expect(message).toContain('Metoda: Livrare prin curier')
      expect(message).not.toContain('Detalii:')
    })
  })

  describe('returning customer — personal delivery (no courier checkbox)', () => {
    it('shows only Total with no transport line and no address fields', () => {
      const message = buildWhatsAppMessage({
        ...baseParams,
        subtotal: 30,
        shippingCost: 0,
        deliveryMethod: 'personal',
      })

      expect(message).toContain(`Total: ${formatPrice(30)}`)
      expect(message).not.toContain('Transport')
      expect(message).not.toContain('Subtotal')
      expect(message).toContain('Metoda: Livrare personală')
      expect(message).not.toContain('Nume:')
      expect(message).not.toContain('Telefon:')
      expect(message).not.toContain('Adresă:')
    })
  })

  describe('returning customer — courier delivery (checkbox checked)', () => {
    it('shows Subtotal + Transport + Total with courier method', () => {
      const message = buildWhatsAppMessage({
        ...baseParams,
        subtotal: 30,
        shippingCost: 25,
        deliveryMethod: 'curier',
      })

      expect(message).toContain(`Subtotal: ${formatPrice(30)}`)
      expect(message).toContain(`Transport (Curier Cargus): ${formatPrice(25)}`)
      expect(message).toContain(`Total: ${formatPrice(55)}`)
      expect(message).toContain('Metoda: Livrare prin curier')
      expect(message).not.toContain('Nume:')
      expect(message).not.toContain('Adresă:')
    })
  })
})

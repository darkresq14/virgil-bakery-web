import { describe, expect, it } from 'vitest'

import { detectDeliveryMethod } from '@/utilities/detectDeliveryMethod'

describe('detectDeliveryMethod', () => {
  it('returns personal delivery with 0 cost for Sibiu + Sibiu', () => {
    const result = detectDeliveryMethod('Sibiu', 'Sibiu')
    expect(result).toEqual({ deliveryMethod: 'personal', shippingCost: 0 })
  })

  it('returns courier delivery with 25 cost for non-delivery zone', () => {
    const result = detectDeliveryMethod('Cluj', 'Cluj-Napoca')
    expect(result).toEqual({ deliveryMethod: 'curier', shippingCost: 25 })
  })

  it('returns courier delivery for Sibiu judet with non-delivery locality', () => {
    const result = detectDeliveryMethod('Sibiu', 'Mediaș')
    expect(result).toEqual({ deliveryMethod: 'curier', shippingCost: 25 })
  })

  it('returns courier delivery when only judet is provided (no localitate)', () => {
    const result = detectDeliveryMethod('Sibiu', '')
    expect(result).toEqual({ deliveryMethod: 'curier', shippingCost: 25 })
  })

  it('returns courier delivery when no address is provided', () => {
    const result = detectDeliveryMethod('', '')
    expect(result).toEqual({ deliveryMethod: 'curier', shippingCost: 25 })
  })

  it('returns personal delivery for all 5 personal delivery localities', () => {
    const personalLocalities = ['Sibiu', 'Sura Mare', 'Sura Mica', 'Cisnadie', 'Cisnadioara']
    for (const locality of personalLocalities) {
      expect(detectDeliveryMethod('Sibiu', locality)).toEqual({
        deliveryMethod: 'personal',
        shippingCost: 0,
      })
    }
  })
})

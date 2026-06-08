import { describe, expect, it } from 'vitest'
import { isPersonalDeliveryZone } from '@/utilities/deliveryZone'

describe('isPersonalDeliveryZone', () => {
  it('returns true for Sibiu judet + Sibiu localitate', () => {
    expect(isPersonalDeliveryZone('Sibiu', 'Sibiu')).toBe(true)
  })

  it('returns true for all 5 personal delivery localities in Sibiu judet', () => {
    // Values match the ASCII form used in ro-localities.ts
    const personalDeliveryLocalities = [
      'Sibiu',
      'Sura Mare',
      'Sura Mica',
      'Cisnadie',
      'Cisnadioara',
    ]

    for (const locality of personalDeliveryLocalities) {
      expect(isPersonalDeliveryZone('Sibiu', locality)).toBe(true)
    }
  })

  it('returns false for a non-Sibiu judet', () => {
    expect(isPersonalDeliveryZone('Cluj', 'Cluj-Napoca')).toBe(false)
    expect(isPersonalDeliveryZone('Brasov', 'Brasov')).toBe(false)
    expect(isPersonalDeliveryZone('Bucuresti', 'Bucuresti')).toBe(false)
  })

  it('returns false for a Sibiu judet locality outside the delivery zone', () => {
    expect(isPersonalDeliveryZone('Sibiu', 'Medias')).toBe(false)
    expect(isPersonalDeliveryZone('Sibiu', 'Agnita')).toBe(false)
    expect(isPersonalDeliveryZone('Sibiu', 'Dumbraveni')).toBe(false)
  })

  it('normalizes case — uppercase, lowercase, and mixed case all match', () => {
    expect(isPersonalDeliveryZone('SIBIU', 'SIBIU')).toBe(true)
    expect(isPersonalDeliveryZone('sibiu', 'sibiu')).toBe(true)
    expect(isPersonalDeliveryZone('SiBiU', 'CiSnAdIe')).toBe(true)
    expect(isPersonalDeliveryZone('SIBIU', 'sura mare')).toBe(true)
    expect(isPersonalDeliveryZone('SIBIU', 'SURA MARE')).toBe(true)
  })

  it('normalizes leading/trailing whitespace', () => {
    expect(isPersonalDeliveryZone('  Sibiu  ', '  Sibiu  ')).toBe(true)
    expect(isPersonalDeliveryZone('\tSibiu\t', '\tCisnadie\t')).toBe(true)
    expect(isPersonalDeliveryZone(' Sibiu ', ' Sura Mare ')).toBe(true)
  })
})

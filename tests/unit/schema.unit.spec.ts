import { describe, expect, it } from 'vitest'
import type { Product } from '@/payload-types'

import { COURIER_SHIPPING_COST } from '@/utilities/detectDeliveryMethod'
import { localBusinessSchema, productSchema } from '@/utilities/schema'

const NOT_PERMITTED = 'https://schema.org/MerchantReturnNotPermitted'

interface ShippingDetail {
  '@type': string
  shippingRate: { '@type': string; value: number; currency: string }
  shippingDestination: { '@type': string; addressCountry: string; addressRegion?: string }
  deliveryTime: {
    '@type': string
    handlingTime: { minValue: number; maxValue: number; unitCode: string }
    transitTime: { minValue: number; maxValue: number; unitCode: string }
  }
}

interface ProductJsonLd {
  '@type': string
  brand: { '@type': string; name: string }
  offers?: {
    hasMerchantReturnPolicy: { '@type': string; returnPolicyCategory: string }
    shippingDetails: ShippingDetail[]
  }
}

interface BakeryJsonLd {
  image?: string
  priceRange?: string
  servesCuisine?: string[]
  address?: {
    '@type': string
    streetAddress?: string
    addressLocality?: string
    postalCode?: string
    addressCountry?: string
  }
  hasMerchantReturnPolicy: {
    '@type': string
    applicableCountry: string
    returnPolicyCategory: string
    merchantReturnLink: string
  }
}

describe('localBusinessSchema', () => {
  it('declares a not-permitted return policy that links to the policies page', () => {
    const schema = localBusinessSchema({ name: 'Pâine cu Maia by Virgil' }) as BakeryJsonLd

    expect(schema.hasMerchantReturnPolicy).toMatchObject({
      '@type': 'MerchantReturnPolicy',
      applicableCountry: 'RO',
      returnPolicyCategory: NOT_PERMITTED,
    })
    expect(schema.hasMerchantReturnPolicy.merchantReturnLink).toMatch(/\/cum-comand$/)
  })

  it('emits the location and market hints Google flags as recommended', () => {
    const schema = localBusinessSchema({
      name: 'Pâine cu Maia by Virgil',
      address: 'Str. Exemplu 1',
    }) as BakeryJsonLd

    expect(schema.image).toMatch(/\/og-image\.jpg$/)
    expect(schema.priceRange).toBe('25–40 RON')
    expect(schema.servesCuisine).toEqual(['Bakery'])
    expect(schema.address).toMatchObject({
      '@type': 'PostalAddress',
      addressLocality: 'Sibiu',
      postalCode: '557260',
      addressCountry: 'RO',
    })
    expect(schema.address?.streetAddress).toBe('Str. Exemplu 1')
  })

  it('still emits a full postal address when no street address is provided', () => {
    const schema = localBusinessSchema({
      name: 'Pâine cu Maia by Virgil',
    }) as BakeryJsonLd

    expect(schema.address).toMatchObject({
      addressLocality: 'Sibiu',
      postalCode: '557260',
      addressCountry: 'RO',
    })
    expect(schema.address?.streetAddress).toBeUndefined()
  })
})

describe('productSchema', () => {
  const product = {
    name: 'Pâine cu maia',
    shortDescription: 'Pâine artizanală fermentată lent',
    price: 30,
    available: true,
  } as unknown as Product

  it('sets the brand so a global identifier is present', () => {
    const schema = productSchema({
      product,
      url: 'https://example.test/produse/paine',
    }) as ProductJsonLd

    expect(schema.brand).toEqual({ '@type': 'Brand', name: 'Pâine cu Maia by Virgil' })
  })

  it('declares a not-permitted return policy on the offer', () => {
    const schema = productSchema({
      product,
      url: 'https://example.test/produse/paine',
    }) as ProductJsonLd

    expect(schema.offers?.hasMerchantReturnPolicy).toEqual({
      '@type': 'MerchantReturnPolicy',
      returnPolicyCategory: NOT_PERMITTED,
    })
  })

  it('declares both shipping rates (free in Sibiu, courier nationwide) with delivery times', () => {
    const schema = productSchema({
      product,
      url: 'https://example.test/produse/paine',
    }) as ProductJsonLd
    const details = schema.offers?.shippingDetails ?? []

    expect(details).toHaveLength(2)

    const free = details.find((d) => d.shippingRate.value === 0)
    const courier = details.find((d) => d.shippingRate.value === COURIER_SHIPPING_COST)
    expect(free).toBeDefined()
    expect(courier).toBeDefined()

    expect(free?.shippingDestination).toMatchObject({
      addressCountry: 'RO',
      addressRegion: 'Sibiu',
    })
    expect(courier?.shippingDestination).toMatchObject({ addressCountry: 'RO' })
    expect(courier?.shippingDestination.addressRegion).toBeUndefined()

    for (const detail of details) {
      expect(detail.shippingRate.currency).toBe('RON')
      expect(detail.deliveryTime['@type']).toBe('ShippingDeliveryTime')
      // Fixed Tue/Fri bake schedule: transit ~1 day (dispatched day-before),
      // handling 1–5 days (wait to next dispatch day per Sun/Wed cutoffs).
      expect(detail.deliveryTime.handlingTime).toMatchObject({
        minValue: 1,
        maxValue: 5,
        unitCode: 'DAY',
      })
      expect(detail.deliveryTime.transitTime).toMatchObject({
        minValue: 1,
        maxValue: 1,
        unitCode: 'DAY',
      })
    }
  })

  it('omits offers entirely when the product has no price', () => {
    const schema = productSchema({
      product: { ...product, price: null } as unknown as Product,
      url: 'https://example.test/produse/paine',
    }) as ProductJsonLd

    expect(schema.offers).toBeUndefined()
    // brand is still present regardless of offer
    expect(schema.brand.name).toBe('Pâine cu Maia by Virgil')
  })
})

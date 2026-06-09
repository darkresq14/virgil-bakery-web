import { describe, expect, it } from 'vitest'

import { Orders } from '@/collections/Orders'

describe('Orders collection schema', () => {
  const fieldNames = Orders.fields.map((f) => ('name' in f ? f.name : '')).filter(Boolean)

  it('does not have a customerAddress field', () => {
    expect(fieldNames).not.toContain('customerAddress')
  })

  it('has a deliveryMethod select field defaulting to personal', () => {
    const field = Orders.fields.find((f) => 'name' in f && f.name === 'deliveryMethod')
    expect(field).toBeDefined()
    expect(field).toMatchObject({
      type: 'select',
      required: true,
      defaultValue: 'personal',
    })
  })

  it('has deliveryMethod options for personal and curier', () => {
    const field = Orders.fields.find((f) => 'name' in f && f.name === 'deliveryMethod')
    const options = ('options' in field! ? field.options : []) as { label: string; value: string }[]
    const values = options.map((o) => o.value)
    expect(values).toContain('personal')
    expect(values).toContain('curier')
  })

  it('has a shippingCost number field defaulting to 0 with min 0', () => {
    const field = Orders.fields.find((f) => 'name' in f && f.name === 'shippingCost')
    expect(field).toBeDefined()
    expect(field).toMatchObject({
      type: 'number',
      required: true,
      defaultValue: 0,
      min: 0,
    })
  })

  it('has a subtotal number field with min 0', () => {
    const field = Orders.fields.find((f) => 'name' in f && f.name === 'subtotal')
    expect(field).toBeDefined()
    expect(field).toMatchObject({
      type: 'number',
      required: true,
      min: 0,
    })
  })

  it('has optional address fields: judet, localitate, streetAddress, addressDetails', () => {
    for (const name of ['judet', 'localitate', 'streetAddress', 'addressDetails']) {
      const field = Orders.fields.find((f) => 'name' in f && f.name === name)
      expect(field).toBeDefined()
      expect(field).toMatchObject({ type: 'text' })
    }
  })

  it('includes deliveryMethod in admin default columns', () => {
    expect(Orders.admin?.defaultColumns).toContain('deliveryMethod')
  })

  it('wires DeliveryMethodCell to the deliveryMethod field', () => {
    const field = Orders.fields.find((f) => 'name' in f && f.name === 'deliveryMethod')
    expect(field).toMatchObject({
      admin: {
        components: {
          Cell: expect.stringContaining('DeliveryMethodCell'),
        },
      },
    })
  })
})

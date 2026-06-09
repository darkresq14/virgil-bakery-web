import { cleanup, render, screen } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { DeliveryMethodCell } from '@/collections/Orders/components/DeliveryMethodCell'

afterEach(cleanup)

describe('DeliveryMethodCell', () => {
  it('renders a green badge with car icon for personal delivery', () => {
    render(<DeliveryMethodCell cellData="personal" />)

    expect(screen.getByText(/Personală/)).toBeTruthy()

    const badge = screen.getByText(/🚗/).closest('span')
    expect(badge?.style.getPropertyValue('background-color')).toBeTruthy()
    expect(badge?.textContent).toContain('Personală')
  })

  it('renders a blue badge with package icon for curier delivery', () => {
    render(<DeliveryMethodCell cellData="curier" />)

    expect(screen.getByText(/Curier/)).toBeTruthy()

    const badge = screen.getByText(/📦/).closest('span')
    expect(badge?.style.getPropertyValue('background-color')).toBeTruthy()
    expect(badge?.textContent).toContain('Curier')
  })

  it('renders a dash fallback for null cellData', () => {
    render(<DeliveryMethodCell cellData={null as unknown as string} />)

    expect(screen.getByText('—')).toBeTruthy()
  })

  it('renders a dash fallback for an unknown delivery method', () => {
    render(<DeliveryMethodCell cellData="drone" />)

    expect(screen.getByText('—')).toBeTruthy()
  })
})

import { cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import { afterEach, describe, expect, it } from 'vitest'

import { type AddressFields, AddressForm } from '@/components/AddressForm'
import { JUDETE, LOCALITIES_BY_JUDET } from '@/data/ro-localities'

const noop = () => {}

afterEach(cleanup)

describe('AddressForm', () => {
  it('renders all 4 fields with correct labels', () => {
    render(
      <AddressForm
        values={{ judet: '', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    expect(screen.getByLabelText(/județ/i)).toBeTruthy()
    expect(screen.getByLabelText(/localitate/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/strada și numărul/i)).toBeTruthy()
    expect(screen.getByPlaceholderText(/bloc, scară, apartament/i)).toBeTruthy()
  })

  it('shows all 42 județe sorted alphabetically with a disabled placeholder', () => {
    render(
      <AddressForm
        values={{ judet: '', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    const select = screen.getByLabelText(/județ/i) as HTMLSelectElement
    const options = Array.from(select.options)

    // 42 counties + 1 disabled placeholder
    expect(options).toHaveLength(42 + 1)

    // First option is the disabled placeholder
    expect(options[0].disabled).toBe(true)
    expect(options[0].textContent).toBe('Selectează județul')

    // Remaining options are the 42 counties, sorted alphabetically by label
    const countyOptions = options.slice(1)
    const labels = countyOptions.map((o) => o.textContent ?? '')
    const sorted = [...labels].sort((a, b) => a.localeCompare(b, 'ro'))
    expect(labels).toEqual(sorted)

    // Verify all counties from the dataset are present
    const expectedLabels = JUDETE.map((j) => j.label)
    expect(labels).toEqual(expectedLabels)
  })

  it('shows no dropdown when no judet is selected', () => {
    render(
      <AddressForm
        values={{ judet: '', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    // The locality input is disabled, so no dropdown should appear
    const listbox = document.getElementById('address-form-localitati')
    expect(listbox).toBeNull()
  })

  it('shows matching localities for the selected judet when typing', () => {
    const { rerender } = render(
      <AddressForm
        values={{ judet: 'Sibiu', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={(v) =>
          rerender(
            <AddressForm values={v} onChange={noop} />,
          )
        }
      />,
    )

    const input = screen.getByLabelText(/localitate/i) as HTMLInputElement
    expect(input.disabled).toBe(false)

    // Type a query that should match Sibiu localities
    fireEvent.change(input, { target: { value: 'Sib' } })
    fireEvent.focus(input)

    // The dropdown should appear with matching localities
    const listbox = document.getElementById('address-form-localitati')
    expect(listbox).toBeTruthy()
    const items = listbox!.querySelectorAll('[role="option"]')
    expect(items.length).toBeGreaterThan(0)

    // All items should contain "Sib" (ignoring diacritics) in their text
    items.forEach((item) => {
      expect(item.textContent?.toLowerCase()).toContain('sib')
    })
  })

  it('shows "selectează mai întâi județul" placeholder when no judet is selected', () => {
    render(
      <AddressForm
        values={{ judet: '', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    expect(screen.getByPlaceholderText(/selectează mai întâi județul/i)).toBeTruthy()
  })

  it('shows min-chars placeholder when judet is selected but input is empty', () => {
    render(
      <AddressForm
        values={{ judet: 'Sibiu', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    expect(screen.getByPlaceholderText(/cel puțin 2 caractere/i)).toBeTruthy()
  })

  it('calls onChange with reset localitate when judet changes', () => {
    const changes: AddressFields[] = []
    const onChange = (v: AddressFields) => changes.push(v)

    render(
      <AddressForm
        values={{ judet: 'Sibiu', localitate: 'Sibiu', streetAddress: 'Str 1', addressDetails: '' }}
        onChange={onChange}
      />,
    )

    // Change judet to Cluj via the select
    const select = screen.getByLabelText(/județ/i)
    fireEvent.change(select, { target: { value: 'Cluj' } })

    expect(changes).toHaveLength(1)
    expect(changes[0].judet).toBe('Cluj')
    expect(changes[0].localitate).toBe('')
    // Other fields are preserved
    expect(changes[0].streetAddress).toBe('Str 1')
    expect(changes[0].addressDetails).toBe('')
  })

  it('renders error message and border-destructive class on fields with errors', () => {
    render(
      <AddressForm
        values={{ judet: '', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
        errors={{
          judet: 'Județul este obligatoriu',
          localitate: 'Localitatea este obligatorie',
          streetAddress: 'Strada este obligatorie',
        }}
      />,
    )

    // Error messages are rendered
    expect(screen.getByText('Județul este obligatoriu')).toBeTruthy()
    expect(screen.getByText('Localitatea este obligatorie')).toBeTruthy()
    expect(screen.getByText('Strada este obligatorie')).toBeTruthy()

    // Fields with errors have border-destructive class
    const judetSelect = document.getElementById('address-judet')
    expect(judetSelect?.className.includes('border-destructive')).toBe(true)

    const localitateInput = document.getElementById('address-localitate')
    expect(localitateInput?.className.includes('border-destructive')).toBe(true)

    const streetInput = document.getElementById('address-street')
    expect(streetInput?.className.includes('border-destructive')).toBe(true)

    // Field without error (addressDetails) does NOT have border-destructive
    const detailsTextarea = document.getElementById('address-details')
    expect(detailsTextarea?.className.includes('border-destructive')).toBe(false)
  })

  it('does not render error elements when no errors prop is provided', () => {
    render(
      <AddressForm
        values={{ judet: '', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    // No error text elements exist
    const errorElements = document.querySelectorAll('.text-destructive')
    // Only the * span indicators should have text-destructive, no error messages
    const errorMessages = Array.from(errorElements).filter(
      (el) => el.tagName === 'P',
    )
    expect(errorMessages).toHaveLength(0)

    // No field has border-destructive
    const judetSelect = document.getElementById('address-judet')
    expect(judetSelect?.className.includes('border-destructive')).toBe(false)
  })

  it('shows required indicator on judet, localitate, and streetAddress but not on addressDetails', () => {
    render(
      <AddressForm
        values={{ judet: '', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    // Required fields have labels ending with *
    const judetLabel = document.querySelector('label[for="address-judet"]')
    expect(judetLabel?.textContent).toContain('*')

    const localitateLabel = document.querySelector('label[for="address-localitate"]')
    expect(localitateLabel?.textContent).toContain('*')

    const streetLabel = document.querySelector('label[for="address-street"]')
    expect(streetLabel?.textContent).toContain('*')

    // Optional field does NOT have *
    const detailsLabel = document.querySelector('label[for="address-details"]')
    expect(detailsLabel?.textContent).not.toContain('*')
  })

  it('finds localities even when typing without diacritics', () => {
    const { rerender } = render(
      <AddressForm
        values={{ judet: 'Sibiu', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={(v) =>
          rerender(
            <AddressForm values={v} onChange={noop} />,
          )
        }
      />,
    )

    const input = screen.getByLabelText(/localitate/i) as HTMLInputElement

    // Type "cisna" (without diacritics) — should match "Cisnădie"
    fireEvent.change(input, { target: { value: 'cisna' } })
    fireEvent.focus(input)

    const listbox = document.getElementById('address-form-localitati')
    expect(listbox).toBeTruthy()
    const items = listbox!.querySelectorAll('[role="option"]')
    expect(items.length).toBeGreaterThan(0)

    // At least one result should be Cisnădie or Cisnădioara
    const texts = Array.from(items).map((i) => i.textContent ?? '')
    const hasCisna = texts.some((t) => t.toLowerCase().includes('cisnăd'))
    expect(hasCisna).toBe(true)
  })
})

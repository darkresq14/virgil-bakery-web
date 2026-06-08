import { cleanup, fireEvent, render, screen } from '@testing-library/react'
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

  it('shows no datalist options when no judet is selected', () => {
    render(
      <AddressForm
        values={{ judet: '', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    // jsdom does not populate HTMLDataListElement.options, use querySelectorAll
    const datalist = document.getElementById('address-form-localitati')
    const options = datalist?.querySelectorAll('option') ?? []
    expect(options).toHaveLength(0)
  })

  it('shows only localities for the selected judet in the datalist', () => {
    render(
      <AddressForm
        values={{ judet: 'Sibiu', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    const datalist = document.getElementById('address-form-localitati')
    const renderedOptions = datalist?.querySelectorAll('option') ?? []
    const sibiuLocalities = LOCALITIES_BY_JUDET['Sibiu']

    // Component deduplicates localities (some judete have duplicate entries)
    const uniqueValues = [...new Set(sibiuLocalities.map((l) => l.value))]
    expect(renderedOptions).toHaveLength(uniqueValues.length)

    const datalistValues = Array.from(renderedOptions).map((o) => o.getAttribute('value') ?? '')
    expect(datalistValues).toEqual(uniqueValues)
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

  it('shows "selectează localitatea" placeholder when judet is selected', () => {
    render(
      <AddressForm
        values={{ judet: 'Sibiu', localitate: '', streetAddress: '', addressDetails: '' }}
        onChange={noop}
      />,
    )

    expect(screen.getByPlaceholderText(/selectează localitatea/i)).toBeTruthy()
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
})

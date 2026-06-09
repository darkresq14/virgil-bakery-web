'use client'

import { useCallback, useEffect, useRef, useState } from 'react'

import { JUDETE, LOCALITIES_BY_JUDET } from '@/data/ro-localities'
import { stripRoDiacritics } from '@/utilities/stripRoDiacritics'

export interface AddressFields {
  judet: string
  localitate: string
  streetAddress: string
  addressDetails: string
}

export interface AddressFormProps {
  values: AddressFields
  onChange: (values: AddressFields) => void
  errors?: Partial<Record<keyof AddressFields, string>>
}

/** Minimum characters before showing suggestions. */
const MIN_CHARS = 2
/** Maximum visible suggestions. */
const MAX_SUGGESTIONS = 50

export function AddressForm({ values, onChange, errors }: AddressFormProps) {
  const localitati = values.judet ? (LOCALITIES_BY_JUDET[values.judet] ?? []) : []

  function handleChange(partial: Partial<AddressFields>) {
    onChange({ ...values, ...partial })
  }

  return (
    <div className="space-y-3">
      {/* Județ */}
      <div>
        <label htmlFor="address-judet" className="block text-sm font-sans font-medium mb-1">
          Județ <span className="text-destructive">*</span>
        </label>
        <select
          id="address-judet"
          value={values.judet}
          onChange={(e) => {
            const judet = e.target.value
            handleChange({ judet, localitate: '' })
          }}
          className={`${fieldBase} bg-background ${
            errors?.judet ? 'border-destructive' : 'border-input'
          }`}
        >
          <option value="" disabled>
            Selectează județul
          </option>
          {JUDETE.map((j) => (
            <option key={j.value} value={j.value}>
              {j.label}
            </option>
          ))}
        </select>
        {errors?.judet && (
          <p className={errorClass}>{errors.judet}</p>
        )}
      </div>

      {/* Localitate — custom autocomplete */}
      <LocalityAutocomplete
        options={localitati}
        value={values.localitate}
        disabled={!values.judet}
        error={errors?.localitate}
        onChange={(localitate) => handleChange({ localitate })}
      />

      {/* Strada + Număr */}
      <div>
        <label htmlFor="address-street" className="block text-sm font-sans font-medium mb-1">
          Strada și numărul <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="address-street"
          value={values.streetAddress}
          onChange={(e) => handleChange({ streetAddress: e.target.value })}
          className={`${fieldBase} ${
            errors?.streetAddress ? 'border-destructive' : 'border-input'
          }`}
          placeholder="Strada și numărul"
        />
        {errors?.streetAddress && (
          <p className={errorClass}>{errors.streetAddress}</p>
        )}
      </div>

      {/* Detalii suplimentare */}
      <div>
        <label htmlFor="address-details" className="block text-sm font-sans font-medium mb-1">
          Detalii suplimentare
        </label>
        <textarea
          id="address-details"
          value={values.addressDetails}
          onChange={(e) => handleChange({ addressDetails: e.target.value })}
          className={`${fieldBase} border-input resize-none`}
          rows={3}
          placeholder="Bloc, scară, apartament, interfon..."
        />
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/*  Locality autocomplete                                              */
/* ------------------------------------------------------------------ */

interface LocalityAutocompleteProps {
  options: { value: string; label: string }[]
  value: string
  disabled: boolean
  error?: string
  onChange: (value: string) => void
}

function LocalityAutocomplete({ options, value, disabled, error, onChange }: LocalityAutocompleteProps) {
  const [open, setOpen] = useState(false)
  const [highlightIndex, setHighlightIndex] = useState(-1)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const listboxId = 'address-form-localitati'

  const filtered = useCallback(() => {
    const q = stripRoDiacritics(value.trim().toLowerCase())
    if (q.length < MIN_CHARS) return []
    return options
      .filter((loc) => stripRoDiacritics(loc.label.toLowerCase()).includes(q))
      .slice(0, MAX_SUGGESTIONS)
  }, [value, options])()

  // Close dropdown on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  function handleSelect(label: string) {
    const match = options.find((o) => o.label === label)
    onChange(match?.value ?? label)
    setOpen(false)
    setHighlightIndex(-1)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (!open || filtered.length === 0) return

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        setHighlightIndex((i) => (i + 1) % filtered.length)
        break
      case 'ArrowUp':
        e.preventDefault()
        setHighlightIndex((i) => (i - 1 + filtered.length) % filtered.length)
        break
      case 'Enter':
        e.preventDefault()
        if (highlightIndex >= 0 && highlightIndex < filtered.length) {
          handleSelect(filtered[highlightIndex].label)
        }
        break
      case 'Escape':
        setOpen(false)
        setHighlightIndex(-1)
        break
    }
  }

  const showDropdown = open && filtered.length > 0

  return (
    <div ref={wrapperRef} className="relative">
      <label htmlFor="address-localitate" className="block text-sm font-sans font-medium mb-1">
        Localitate <span className="text-destructive">*</span>
      </label>
      <input
        type="text"
        id="address-localitate"
        value={value}
        onChange={(e) => {
          onChange(e.target.value)
          setOpen(true)
          setHighlightIndex(-1)
        }}
        onFocus={() => {
          if (value.trim().length >= MIN_CHARS) setOpen(true)
        }}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        role="combobox"
        aria-autocomplete="list"
        aria-expanded={showDropdown}
        aria-controls={listboxId}
        aria-activedescendant={highlightIndex >= 0 ? `${listboxId}-${highlightIndex}` : undefined}
        className={`${fieldBase} ${error ? 'border-destructive' : 'border-input'}`}
        placeholder={disabled ? 'Selectează mai întâi județul' : `Scrie cel puțin ${MIN_CHARS} caractere…`}
      />
      {showDropdown && (
        <div
          id={listboxId}
          role="listbox"
          className="absolute z-50 mt-1 w-full max-h-60 overflow-auto rounded-lg border border-border bg-popover shadow-lg"
        >
          {filtered.map((loc, i) => (
            <div
              key={loc.value}
              id={`${listboxId}-${i}`}
              role="option"
              tabIndex={-1}
              aria-selected={i === highlightIndex}
              className={`cursor-pointer px-3 py-1.5 text-sm font-sans ${
                i === highlightIndex
                  ? 'bg-primary/10 text-primary'
                  : 'hover:bg-secondary'
              }`}
              onMouseDown={(e) => {
                // Prevent blur from closing before click registers
                e.preventDefault()
                handleSelect(loc.label)
              }}
              onMouseEnter={() => setHighlightIndex(i)}
            >
              {loc.label}
            </div>
          ))}
        </div>
      )}
      {error && <p className={errorClass}>{error}</p>}
    </div>
  )
}

/* ------------------------------------------------------------------ */

const fieldBase = 'w-full rounded-lg border px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring'

const errorClass = 'text-xs text-destructive font-sans mt-1'

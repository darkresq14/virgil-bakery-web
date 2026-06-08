'use client'

import { JUDETE, LOCALITIES_BY_JUDET } from '@/data/ro-localities'

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

export function AddressForm({ values, onChange, errors }: AddressFormProps) {
  const rawLocalitati = values.judet ? (LOCALITIES_BY_JUDET[values.judet] ?? []) : []
  const localitati = dedupByValue(rawLocalitati)

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

      {/* Localitate */}
      <div>
        <label htmlFor="address-localitate" className="block text-sm font-sans font-medium mb-1">
          Localitate <span className="text-destructive">*</span>
        </label>
        <input
          type="text"
          id="address-localitate"
          list="address-form-localitati"
          value={values.localitate}
          onChange={(e) => handleChange({ localitate: e.target.value })}
          disabled={!values.judet}
          className={`${fieldBase} ${
            errors?.localitate ? 'border-destructive' : 'border-input'
          }`}
          placeholder={values.judet ? 'Selectează localitatea' : 'Selectează mai întâi județul'}
        />
        <datalist id="address-form-localitati">
          {localitati.map((loc) => (
            <option key={loc.value} value={loc.value} />
          ))}
        </datalist>
        {errors?.localitate && (
          <p className={errorClass}>{errors.localitate}</p>
        )}
      </div>

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

const fieldBase = 'w-full rounded-lg border px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring'

const errorClass = 'text-xs text-destructive font-sans mt-1'

function dedupByValue(items: { value: string; label: string }[]) {
  const seen = new Set<string>()
  return items.filter((item) => {
    if (seen.has(item.value)) return false
    seen.add(item.value)
    return true
  })
}

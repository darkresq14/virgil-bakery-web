'use client'

import { ArrowLeft, Minus, Plus, ShoppingBag, Trash2 } from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { useMemo, useState } from 'react'

import { AddressForm, type AddressFields } from '@/components/AddressForm'
import { useCart } from '@/providers/Cart'
import { buildWhatsAppMessage } from '@/utilities/buildWhatsAppMessage'
import { detectDeliveryMethod } from '@/utilities/detectDeliveryMethod'
import { getDeliveryDates } from '@/utilities/deliveryDates'
import { formatPrice } from '@/utilities/formatPrice'

const STORAGE_KEY = 'vb-repeat-customer'

export function CartPageClient() {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart()
  const emptyAddress: AddressFields = { judet: '', localitate: '', streetAddress: '', addressDetails: '' }
  const [form, setForm] = useState({ name: '', phone: '', deliveryDate: '' })
  const [address, setAddress] = useState<AddressFields>(emptyAddress)
  const [formError, setFormError] = useState('')
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(STORAGE_KEY) !== 'true'
  })
  const [fieldErrors, setFieldErrors] = useState({ name: '', phone: '', judet: '', localitate: '', streetAddress: '' })
  const [needsCourier, setNeedsCourier] = useState(false)

  const toggleFirstOrder = (value: boolean) => {
    setIsFirstOrder(value)
    localStorage.setItem(STORAGE_KEY, value ? 'false' : 'true')
    setFieldErrors({ name: '', phone: '', judet: '', localitate: '', streetAddress: '' })
    setNeedsCourier(false)
  }

  const deliveryInfo = useMemo(
    () => detectDeliveryMethod(address.judet, address.localitate),
    [address.judet, address.localitate],
  )

  const deliveryDates = useMemo(() => getDeliveryDates(), [])

  const defaultDeliveryLabel = useMemo(() => {
    const selectable = deliveryDates.find((d) => d.isSelectable)
    return selectable?.label ?? ''
  }, [deliveryDates])

  const selectedDelivery = form.deliveryDate || defaultDeliveryLabel

  const shippingCost = isFirstOrder
    ? (address.judet && address.localitate ? deliveryInfo.shippingCost : 0)
    : (needsCourier ? 25 : 0)

  const deliveryMethod = isFirstOrder
    ? (address.judet && address.localitate ? deliveryInfo.deliveryMethod : 'personal')
    : (needsCourier ? 'curier' : 'personal')

  const showTransport = shippingCost > 0

  const handleCheckout = async () => {
    if (!selectedDelivery) {
      setFormError('Selectează o dată de livrare')
      return
    }
    setFormError('')

    const errors = { name: '', phone: '', judet: '', localitate: '', streetAddress: '' }
    if (isFirstOrder) {
      if (!form.name.trim()) errors.name = 'Numele este obligatoriu'
      if (!form.phone.trim()) errors.phone = 'Telefonul este obligatoriu'
      if (!address.judet) errors.judet = 'Județul este obligatoriu'
      if (!address.localitate.trim()) errors.localitate = 'Localitatea este obligatorie'
      if (!address.streetAddress.trim()) errors.streetAddress = 'Strada este obligatorie'
    }
    setFieldErrors(errors)
    if (errors.name || errors.phone || errors.judet || errors.localitate || errors.streetAddress) return

    const selectedDate = deliveryDates.find((d) => d.label === selectedDelivery)

    const message = buildWhatsAppMessage({
      items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      subtotal: total,
      shippingCost,
      deliveryDate: selectedDelivery,
      deliveryMethod,
      ...(isFirstOrder ? {
        customerName: form.name || undefined,
        customerPhone: form.phone || undefined,
        judet: address.judet || undefined,
        localitate: address.localitate || undefined,
        streetAddress: address.streetAddress || undefined,
        addressDetails: address.addressDetails || undefined,
      } : {}),
    })

    try {
      await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: items.map((item) => ({
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            price: item.price,
          })),
          total: total + shippingCost,
          subtotal: total,
          deliveryMethod,
          shippingCost,
          deliveryDate: selectedDate?.date.toISOString(),
          customerName: form.name || undefined,
          customerPhone: form.phone || undefined,
          judet: address.judet || undefined,
          localitate: address.localitate || undefined,
          streetAddress: address.streetAddress || undefined,
          addressDetails: address.addressDetails || undefined,
          whatsappMessage: message,
          status: 'nou',
        }),
      })
    } catch {
      // Still open WhatsApp even if DB save fails
    }

    const url = `https://wa.me/40746245391?text=${encodeURIComponent(message)}`
    window.open(url, '_blank')
    if (!isFirstOrder) {
      localStorage.setItem(STORAGE_KEY, 'true')
    }
    clearCart()
  }

  if (items.length === 0) {
    return (
      <div className="py-20">
        <div className="container text-center">
          <ShoppingBag className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
          <h1 className="text-3xl font-heading mb-4">Coșul tău este gol</h1>
          <p className="text-muted-foreground font-sans mb-8">
            Descoperă produsele noastre și adaugă-le în coș.
          </p>
          <Link
            href="/produse"
            className="inline-flex items-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3 font-sans font-medium hover:bg-primary/90 transition-colors"
          >
            Vezi produsele
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="py-12">
      <div className="container">
        <h1 className="text-3xl font-heading mb-8">Coșul tău</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Cart items */}
          <div className="lg:col-span-2">
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.productId}
                  className="flex flex-col sm:flex-row sm:items-center gap-4 rounded-lg border border-border bg-card p-4"
                >
                  <div className="flex-1 min-w-0">
                    <Link
                      href={`/produse/${item.slug}`}
                      className="font-heading text-lg hover:text-primary transition-colors"
                    >
                      {item.name}
                    </Link>
                    {item.weight && (
                      <p className="text-sm text-muted-foreground font-sans">{item.weight}</p>
                    )}
                    <p className="font-sans text-primary font-medium mt-1">
                      {formatPrice(item.price)} / buc
                    </p>
                  </div>

                  <div className="flex items-center justify-between sm:gap-4">
                    {/* Quantity controls */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity - 1)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-border hover:bg-secondary transition-colors"
                        aria-label="Scade cantitatea"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-sans font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex items-center justify-center w-8 h-8 rounded-full border border-border hover:bg-secondary transition-colors"
                        aria-label="Crește cantitatea"
                      >
                        <Plus className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Subtotal */}
                    <span className="font-sans font-semibold min-w-20 text-right">
                      {formatPrice(item.price * item.quantity)}
                    </span>

                    {/* Remove */}
                    <button
                      type="button"
                      onClick={() => removeItem(item.productId)}
                      className="p-2 text-muted-foreground hover:text-destructive transition-colors"
                      aria-label={`Elimină ${item.name}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex items-center justify-between mt-6">
              <Link
                href="/produse"
                className="inline-flex items-center gap-2 text-sm font-sans text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="w-4 h-4" />
                Continuă cumpărăturile
              </Link>
              <button
                type="button"
                onClick={clearCart}
                className="text-sm font-sans text-destructive hover:underline"
              >
                Golește coșul
              </button>
            </div>
          </div>

          {/* Order form */}
          <div>
            <div className="rounded-xl border border-border bg-card p-6 sticky top-20">
              <h2 className="font-heading text-xl mb-4">Comandă</h2>

              <div className="mb-6 pb-4 border-b border-border space-y-2">
                <div className="flex justify-between">
                  <span className="font-sans text-muted-foreground">Subtotal ({itemCount} produse)</span>
                  <span className="font-sans font-medium">{formatPrice(total)}</span>
                </div>
                {showTransport && (
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">Transport (Curier Cargus)</span>
                    <span className="font-sans font-medium">{formatPrice(shippingCost)}</span>
                  </div>
                )}
                <div className="flex justify-between pt-2 border-t border-border">
                  <span className="font-sans text-lg font-bold">Total</span>
                  <span className="font-sans text-xl font-bold text-primary">
                    {formatPrice(total + shippingCost)}
                  </span>
                </div>
              </div>

              <div className="space-y-4 mb-6">
                {/* Delivery date — required */}
                <div>
                  <label htmlFor="delivery-date" className="block text-sm font-sans font-medium mb-1">Dată livrare *</label>
                  <select
                    id="delivery-date"
                    value={selectedDelivery}
                    onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  >
                    {deliveryDates.map((d) => (
                      <option key={d.label} value={d.label} disabled={!d.isSelectable}>
                        {d.label}
                        {!d.isSelectable ? ' — listă închisă' : ''}
                      </option>
                    ))}
                  </select>
                  {formError && (
                    <p className="text-xs text-destructive font-sans mt-1">{formError}</p>
                  )}
                </div>

                {/* First order pills */}
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={() => toggleFirstOrder(true)}
                    className={`rounded-full px-3 py-1 text-xs font-sans font-medium transition-all ${
                      isFirstOrder
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Prima comandă
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleFirstOrder(false)}
                    className={`rounded-full px-3 py-1 text-xs font-sans font-medium transition-all ${
                      !isFirstOrder
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    Am mai comandat
                  </button>
                </div>

                {/* Courier checkbox for returning customers */}
                {!isFirstOrder && (
                  <div className="space-y-3 pt-1">
                    <label className="flex items-center gap-2 text-sm font-sans cursor-pointer">
                      <input
                        type="checkbox"
                        checked={needsCourier}
                        onChange={(e) => setNeedsCourier(e.target.checked)}
                        className="rounded border-input"
                      />
                      Am nevoie de livrare prin curier (+25 lei)
                    </label>
                  </div>
                )}

                {/* Fields for first-time buyers */}
                {isFirstOrder && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label htmlFor="customer-name" className="block text-sm font-sans font-medium mb-1">
                        Nume <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="customer-name"
                        type="text"
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value })
                          setFieldErrors({ ...fieldErrors, name: '' })
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring ${
                          fieldErrors.name ? 'border-destructive' : 'border-input'
                        }`}
                        placeholder="Numele tău"
                      />
                      {fieldErrors.name && (
                        <p className="text-xs text-destructive font-sans mt-1">
                          {fieldErrors.name}
                        </p>
                      )}
                    </div>
                    <div>
                      <label htmlFor="customer-phone" className="block text-sm font-sans font-medium mb-1">
                        Telefon <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="customer-phone"
                        type="tel"
                        value={form.phone}
                        onChange={(e) => {
                          setForm({ ...form, phone: e.target.value })
                          setFieldErrors({ ...fieldErrors, phone: '' })
                        }}
                        className={`w-full rounded-lg border px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring ${
                          fieldErrors.phone ? 'border-destructive' : 'border-input'
                        }`}
                        placeholder="+40 7XX XXX XXX"
                      />
                      {fieldErrors.phone && (
                        <p className="text-xs text-destructive font-sans mt-1">
                          {fieldErrors.phone}
                        </p>
                      )}
                    </div>
                    <div>
                      <AddressForm
                        values={address}
                        onChange={setAddress}
                        errors={{
                          judet: fieldErrors.judet || undefined,
                          localitate: fieldErrors.localitate || undefined,
                          streetAddress: fieldErrors.streetAddress || undefined,
                        }}
                      />
                    </div>
                    {address.judet && address.localitate && (
                      <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm font-sans">
                        {deliveryInfo.deliveryMethod === 'personal' ? (
                          <>🚗 Livrare personală — Gratuită</>
                        ) : (
                          <>📦 Livrare prin curier — 25 lei</>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={handleCheckout}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white px-8 py-3 font-sans font-medium hover:bg-[#20bd5a] transition-colors"
              >
                <Image src="/WhatsApp_White.svg" alt="WhatsApp" width={24} height={24} />
                Comandă prin WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

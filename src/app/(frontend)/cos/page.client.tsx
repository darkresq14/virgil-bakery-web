'use client';

import {
  AlertCircle,
  ArrowLeft,
  CalendarOff,
  Minus,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';

import { type AddressFields, AddressForm } from '@/components/AddressForm';
import { useCart } from '@/providers/Cart';
import { buildWhatsAppMessage } from '@/utilities/buildWhatsAppMessage';
import {
  type DeliveryDateOption,
  formatRomanianDate,
  getDeliveryDates,
} from '@/utilities/deliveryDates';
import { detectDeliveryMethod } from '@/utilities/detectDeliveryMethod';
import { formatPrice } from '@/utilities/formatPrice';
import { holidayDates } from '@/utilities/holidayDates';
import {
  type AvailableDays,
  availabilityDaysToWeekdays,
  availableDaysLabel,
  inlineDeliveryLabel,
  intersectWeekdays,
  isEffectivelyPurchaseable,
  parseOneOffDate,
  weekdayListLabel,
} from '@/utilities/productAvailability';

const STORAGE_KEY = 'vb-repeat-customer';

/** Cached customer phone (prefill convenience only — the server never reads it). */
const PHONE_STORAGE_KEY = 'virgil-bakery-phone';

interface HolidayCartNoticeProps {
  holidayStartDate: Date;
  holidayEndDate: Date;
}

/** Persistent holiday info box on the cart page (survives modal dismissal). */
function HolidayCartNotice({ holidayStartDate, holidayEndDate }: HolidayCartNoticeProps) {
  const { lastDeliveryBefore, firstDeliveryAfter } = holidayDates({
    holidayStartDate,
    holidayEndDate,
  });
  if (!lastDeliveryBefore || !firstDeliveryAfter) return null;
  return (
    <div className="mb-8 flex items-start gap-3 rounded-xl border border-[oklch(89%_0.06_70deg)] bg-[oklch(96%_0.04_75deg)] p-4">
      <CalendarOff className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(55%_0.15_65deg)]" />
      <div className="font-sans text-sm leading-relaxed text-[oklch(30%_0.02_60deg)]">
        <p className="font-semibold text-[oklch(20%_0.02_60deg)]">Program concediu</p>
        <p className="mt-1">
          Vom lua o pauză scurtă. Ultima livrare înainte de concediu:{' '}
          <strong className="font-semibold">{formatRomanianDate(lastDeliveryBefore)}</strong>.
          Reluăm livrările:{' '}
          <strong className="font-semibold">{formatRomanianDate(firstDeliveryAfter)}</strong>.
        </p>
      </div>
    </div>
  );
}

interface CartPageClientProps {
  holidayStartDate?: Date | null;
  holidayEndDate?: Date | null;
  isNoticeActive?: boolean;
}

/**
 * Label precedence: holiday ("concediu") > cart availability ("indisponibil")
 * > ordering cutoff ("listă închisă").
 */
function formatDeliveryOptionLabel(option: DeliveryDateOption): string {
  if (option.isHoliday) return `${option.label} — concediu`;
  if (option.blockedReason === 'availability') return `${option.label} — indisponibil`;
  if (!option.isSelectable) return `${option.label} — listă închisă`;
  return option.label;
}

export function CartPageClient({
  holidayStartDate,
  holidayEndDate,
  isNoticeActive = false,
}: CartPageClientProps = {}) {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const emptyAddress: AddressFields = {
    judet: '',
    localitate: '',
    streetAddress: '',
    addressDetails: '',
  };
  const [form, setForm] = useState(() => ({
    name: '',
    phone: typeof window === 'undefined' ? '' : (localStorage.getItem(PHONE_STORAGE_KEY) ?? ''),
    deliveryDate: '',
  }));
  const [address, setAddress] = useState<AddressFields>(emptyAddress);
  const [formError, setFormError] = useState('');
  const [isFirstOrder, setIsFirstOrder] = useState<boolean>(() => {
    if (typeof window === 'undefined') return true;
    return localStorage.getItem(STORAGE_KEY) !== 'true';
  });
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    phone: '',
    judet: '',
    localitate: '',
    streetAddress: '',
  });
  const [needsCourier, setNeedsCourier] = useState(false);

  // Fresh availability from the server: catches products unpublished or marked
  // unavailable after they were saved to localStorage (see CONTEXT.md → Order).
  // null = fetch not finished yet (don't flag anything until it lands).
  const [freshProducts, setFreshProducts] = useState<Record<
    string,
    {
      available?: boolean | null;
      availableDays?: AvailableDays | null;
      availableOnDate?: string | null;
    }
  > | null>(null);
  const cartIdKey = items.map((item) => item.productId).join(',');
  useEffect(() => {
    if (!cartIdKey) return;
    fetch(`/api/products?where[id][in]=${encodeURIComponent(cartIdKey)}&limit=100&depth=0`)
      .then((res) => (res.ok ? res.json() : { docs: [] }))
      .then(
        ({
          docs,
        }: {
          docs: Array<{
            id: string;
            available?: boolean | null;
            availableDays?: AvailableDays | null;
            availableOnDate?: string | null;
          }>;
        }) => {
          const map: Record<
            string,
            {
              available?: boolean | null;
              availableDays?: AvailableDays | null;
              availableOnDate?: string | null;
            }
          > = {};
          for (const doc of docs) map[String(doc.id)] = doc;
          setFreshProducts(map);
        },
      )
      .catch(() => {
        // Network failure: keep localStorage view, server hook still guards the DB write
      });
  }, [cartIdKey]);

  /** Items whose product is gone (unpublished/deleted) or no longer
   * purchaseable (explicitly unavailable, or a One-off product outside its
   * purchase window). */
  const staleItemIds = useMemo(() => {
    if (freshProducts === null) return new Set<string>();
    return new Set(
      items
        .filter((item) => {
          const fresh = freshProducts[item.productId];
          if (fresh === undefined) return true;
          return !isEffectivelyPurchaseable({
            available: fresh.available,
            availableOnDate: fresh.availableOnDate ?? item.availableOnDate,
          });
        })
        .map((item) => item.productId),
    );
  }, [items, freshProducts]);

  // Per-item effective data (fresh server data wins over localStorage snapshots).
  const itemAvailability = useMemo(
    () =>
      items.map((item) => {
        const fresh = freshProducts?.[item.productId];
        return {
          item,
          oneOff: parseOneOffDate(fresh?.availableOnDate ?? item.availableOnDate),
          availableDays: fresh?.availableDays ?? item.availableDays,
        };
      }),
    [items, freshProducts],
  );

  // Availability Day intersection across the cart: one-off items contribute
  // their concrete weekday, recurring items their Availability Days.
  const cartAllowedDays = useMemo(
    () =>
      intersectWeekdays(
        itemAvailability.map((entry) =>
          entry.oneOff
            ? [entry.oneOff.getUTCDay()]
            : availabilityDaysToWeekdays(entry.availableDays),
        ),
      ),
    [itemAvailability],
  );

  // One-off Availability intersection: when any item is a one-off product, the
  // whole cart may only be delivered on dates shared by ALL one-off items.
  // Empty array = conflicting one-off dates -> nothing selectable.
  const cartAllowedDates = useMemo(() => {
    const oneOffs = itemAvailability
      .map((entry) => entry.oneOff)
      .filter((d): d is Date => d != null);
    if (oneOffs.length === 0) return null;
    const first = oneOffs[0].getTime();
    return oneOffs.every((d) => d.getTime() === first) ? [oneOffs[0]] : [];
  }, [itemAvailability]);

  const oneOffItems = useMemo(
    () => itemAvailability.filter((entry) => entry.oneOff != null),
    [itemAvailability],
  );

  const hasDayConflict = cartAllowedDays.length === 0;
  const hasDateConflict = cartAllowedDates != null && cartAllowedDates.length === 0;
  const restrictedItems = useMemo(
    () =>
      itemAvailability.filter(
        (entry) => entry.oneOff != null || availableDaysLabel(entry.availableDays) !== null,
      ),
    [itemAvailability],
  );

  const toggleFirstOrder = (value: boolean) => {
    setIsFirstOrder(value);
    localStorage.setItem(STORAGE_KEY, value ? 'false' : 'true');
    setFieldErrors({ name: '', phone: '', judet: '', localitate: '', streetAddress: '' });
    setNeedsCourier(false);
  };

  const deliveryInfo = useMemo(
    () => detectDeliveryMethod(address.judet, address.localitate),
    [address.judet, address.localitate],
  );

  const deliveryDates = useMemo(
    () =>
      getDeliveryDates({
        holidayStartDate,
        holidayEndDate,
        allowedDays: cartAllowedDays,
        allowedDates: cartAllowedDates,
      }),
    [holidayStartDate, holidayEndDate, cartAllowedDays, cartAllowedDates],
  );

  const defaultDeliveryLabel = useMemo(() => {
    const selectable = deliveryDates.find((d) => d.isSelectable);
    return selectable?.label ?? '';
  }, [deliveryDates]);

  // Selected date falls back to the first selectable option whenever the cart
  // changes what is orderable (e.g. a Friday-only product rules out Tuesday).
  const selectedDelivery =
    (form.deliveryDate && deliveryDates.some((d) => d.label === form.deliveryDate && d.isSelectable)
      ? form.deliveryDate
      : '') || defaultDeliveryLabel;

  const shippingCost = isFirstOrder
    ? address.judet && address.localitate
      ? deliveryInfo.shippingCost
      : 0
    : needsCourier
      ? 25
      : 0;

  const deliveryMethod = isFirstOrder
    ? address.judet && address.localitate
      ? deliveryInfo.deliveryMethod
      : 'personal'
    : needsCourier
      ? 'curier'
      : 'personal';

  const showTransport = shippingCost > 0;

  const handleCheckout = async () => {
    if (staleItemIds.size > 0) {
      setFormError('Elimină produsele indisponibile din coș pentru a continua');
      return;
    }
    if (hasDayConflict || hasDateConflict) {
      setFormError(
        hasDateConflict
          ? 'Produsele din coș au date de livrare diferite — elimină unul pentru a continua'
          : 'Produsele din coș nu pot fi livrate în aceeași zi — elimină unul',
      );
      return;
    }
    if (!selectedDelivery) {
      setFormError('Selectează o dată de livrare');
      return;
    }
    const preSelected = deliveryDates.find((d) => d.label === selectedDelivery);
    if (preSelected && !cartAllowedDays.includes(preSelected.date.getDay())) {
      setFormError('Data selectată nu este disponibilă pentru toate produsele din coș');
      return;
    }
    if (preSelected && !preSelected.isSelectable) {
      setFormError('Data selectată nu este disponibilă pentru toate produsele din coș');
      return;
    }
    setFormError('');

    const errors = { name: '', phone: '', judet: '', localitate: '', streetAddress: '' };
    // Phone is the customer identity for the whole pipeline — required on every order.
    if (!form.phone.trim()) errors.phone = 'Telefonul este obligatoriu';
    if (isFirstOrder) {
      if (!form.name.trim()) errors.name = 'Numele este obligatoriu';
      if (!address.judet) errors.judet = 'Județul este obligatoriu';
      if (!address.localitate.trim()) errors.localitate = 'Localitatea este obligatorie';
      if (!address.streetAddress.trim()) errors.streetAddress = 'Strada este obligatorie';
    }
    setFieldErrors(errors);
    if (errors.name || errors.phone || errors.judet || errors.localitate || errors.streetAddress)
      return;

    const selectedDate = deliveryDates.find((d) => d.label === selectedDelivery);

    const message = buildWhatsAppMessage({
      items: items.map((item) => ({ name: item.name, quantity: item.quantity, price: item.price })),
      subtotal: total,
      shippingCost,
      deliveryDate: selectedDelivery,
      deliveryMethod,
      ...(isFirstOrder
        ? {
            customerName: form.name || undefined,
            customerPhone: form.phone || undefined,
            judet: address.judet || undefined,
            localitate: address.localitate || undefined,
            streetAddress: address.streetAddress || undefined,
            addressDetails: address.addressDetails || undefined,
          }
        : {}),
    });

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
      });
    } catch {
      // Still open WhatsApp even if DB save fails
    }

    const url = `https://wa.me/40746245391?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
    // Cache the submitted phone so the next checkout prefills it (prefill only —
    // never overwrites what the customer typed this session).
    localStorage.setItem(PHONE_STORAGE_KEY, form.phone);
    if (!isFirstOrder) {
      localStorage.setItem(STORAGE_KEY, 'true');
    }
    clearCart();
  };

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
    );
  }

  return (
    <div className="py-12">
      <div className="container">
        <h1 className="text-3xl font-heading mb-8">Coșul tău</h1>

        {isNoticeActive && holidayStartDate && holidayEndDate && (
          <HolidayCartNotice holidayStartDate={holidayStartDate} holidayEndDate={holidayEndDate} />
        )}

        {/* Availability notices — explain why some delivery dates are unavailable */}
        {hasDayConflict || hasDateConflict ? (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="font-sans text-sm leading-relaxed text-foreground">
              <p className="font-semibold">Produse cu zile de livrare diferite</p>
              <p className="mt-1">
                {hasDateConflict
                  ? 'Coșul conține produse disponibile pentru date de livrare diferite — nu pot fi livrate în aceeași zi. Elimină unul dintre ele pentru a continua.'
                  : 'Coșul conține produse disponibile doar marți și produse disponibile doar vineri — nu pot fi livrate în aceeași zi. Elimină unul dintre ele pentru a continua.'}
              </p>
            </div>
          </div>
        ) : oneOffItems.length > 0 ? (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-[oklch(89%_0.06_70deg)] bg-[oklch(96%_0.04_75deg)] p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(55%_0.15_65deg)]" />
            <div className="font-sans text-sm leading-relaxed text-[oklch(30%_0.02_60deg)]">
              <p className="font-semibold text-[oklch(20%_0.02_60deg)]">
                Produs disponibil o singură dată
              </p>
              <p className="mt-1">
                {oneOffItems.map((entry) => entry.item.name).join(', ')} se poate comanda doar
                pentru {formatRomanianDate(oneOffItems[0].oneOff as Date)}. De aceea, restul zilelor
                de livrare sunt dezactivate.
              </p>
            </div>
          </div>
        ) : restrictedItems.length > 0 ? (
          <div className="mb-8 flex items-start gap-3 rounded-xl border border-[oklch(89%_0.06_70deg)] bg-[oklch(96%_0.04_75deg)] p-4">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-[oklch(55%_0.15_65deg)]" />
            <div className="font-sans text-sm leading-relaxed text-[oklch(30%_0.02_60deg)]">
              <p className="font-semibold text-[oklch(20%_0.02_60deg)]">Zile de livrare limitate</p>
              <p className="mt-1">
                Putem livra {restrictedItems.map((entry) => entry.item.name).join(', ')} doar{' '}
                {weekdayListLabel(cartAllowedDays)}. De aceea, celelalte zile de livrare sunt
                dezactivate.
              </p>
            </div>
          </div>
        ) : null}

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
                    {staleItemIds.has(item.productId) ? (
                      <p className="text-sm text-destructive font-sans mt-1">
                        Momentan indisponibil — elimină-l din coș pentru a continua
                      </p>
                    ) : (
                      (() => {
                        const entry = itemAvailability.find(
                          (e) => e.item.productId === item.productId,
                        );
                        const label = entry
                          ? inlineDeliveryLabel({
                              availableDays: entry.availableDays,
                              availableOnDate: entry.oneOff,
                            })
                          : null;
                        return label ? (
                          <p className="text-sm text-muted-foreground font-sans mt-1">
                            Se livrează {label}
                          </p>
                        ) : null;
                      })()
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
                  <span className="font-sans text-muted-foreground">
                    Subtotal ({itemCount} produse)
                  </span>
                  <span className="font-sans font-medium">{formatPrice(total)}</span>
                </div>
                {showTransport && (
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">
                      Transport (Curier Cargus)
                    </span>
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
                  <label
                    htmlFor="delivery-date"
                    className="block text-sm font-sans font-medium mb-1"
                  >
                    Dată livrare *
                  </label>
                  <select
                    id="delivery-date"
                    value={selectedDelivery}
                    onChange={(e) => setForm({ ...form, deliveryDate: e.target.value })}
                    className="w-full rounded-lg border border-input px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring bg-background"
                  >
                    {deliveryDates.map((d) => (
                      <option key={d.label} value={d.label} disabled={!d.isSelectable}>
                        {formatDeliveryOptionLabel(d)}
                      </option>
                    ))}
                  </select>
                  {formError && (
                    <p className="text-xs text-destructive font-sans mt-1">{formError}</p>
                  )}
                  {!hasDayConflict && !hasDateConflict && restrictedItems.length > 0 && (
                    <p className="text-xs text-muted-foreground font-sans mt-1">
                      {cartAllowedDates
                        ? `Se poate livra doar ${formatRomanianDate(cartAllowedDates[0])} — ${oneOffItems.map((e) => e.item.name).join(', ')} ${oneOffItems.length === 1 ? 'este disponibil' : 'sunt disponibile'} doar atunci.`
                        : `Se poate livra doar ${weekdayListLabel(cartAllowedDays)} — unele produse din coș nu sunt disponibile în alte zile.`}
                    </p>
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

                {/* Phone — required on every order (customer identity for order matching) */}
                <div>
                  <label
                    htmlFor="customer-phone"
                    className="block text-sm font-sans font-medium mb-1"
                  >
                    Telefon <span className="text-destructive">*</span>
                  </label>
                  <input
                    id="customer-phone"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    value={form.phone}
                    onChange={(e) => {
                      setForm({ ...form, phone: e.target.value });
                      setFieldErrors({ ...fieldErrors, phone: '' });
                    }}
                    className={`w-full rounded-lg border px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring ${
                      fieldErrors.phone ? 'border-destructive' : 'border-input'
                    }`}
                    placeholder="+40 7XX XXX XXX"
                  />
                  {fieldErrors.phone && (
                    <p className="text-xs text-destructive font-sans mt-1">{fieldErrors.phone}</p>
                  )}
                </div>

                {/* Name + address — first-order flow only */}
                {isFirstOrder && (
                  <div className="space-y-3 pt-1">
                    <div>
                      <label
                        htmlFor="customer-name"
                        className="block text-sm font-sans font-medium mb-1"
                      >
                        Nume <span className="text-destructive">*</span>
                      </label>
                      <input
                        id="customer-name"
                        type="text"
                        value={form.name}
                        onChange={(e) => {
                          setForm({ ...form, name: e.target.value });
                          setFieldErrors({ ...fieldErrors, name: '' });
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
                disabled={hasDayConflict || hasDateConflict || staleItemIds.size > 0}
                className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-[#25D366] text-white px-8 py-3 font-sans font-medium hover:bg-[#20bd5a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-[#25D366]"
              >
                <Image
                  unoptimized
                  src="/WhatsApp_White.svg"
                  alt="WhatsApp"
                  width={24}
                  height={24}
                />
                Comandă prin WhatsApp
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

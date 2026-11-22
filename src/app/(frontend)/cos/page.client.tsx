'use client';

import {
  AlertCircle,
  ArrowLeft,
  CalendarOff,
  Home,
  MapPin,
  Minus,
  Package,
  Plus,
  ShoppingBag,
  Trash2,
} from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';

import { type AddressFields, AddressForm } from '@/components/AddressForm';
import { GlsPointPicker } from '@/components/GlsPointPicker';
import { useCart } from '@/providers/Cart';
import {
  type DeliveryDateOption,
  formatRomanianDate,
  getDeliveryDates,
} from '@/utilities/deliveryDates';
import { formatPrice } from '@/utilities/formatPrice';
import {
  detectDeliveryZone,
  type GlsPoint,
  homeShippingCost,
  homeTierLabel,
  POINT_SHIPPING_COST,
  shippingCostFor,
} from '@/utilities/glsDelivery';
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
import { whatsappLink } from '@/utilities/whatsapp';

/** Cached checkout profile (issue #47): full form + delivery choice + GLS
 * point, prefilled on the next visit. Replaces the old phone-only cache and
 * the "Am mai comandat" mini-flow. */
const PROFILE_STORAGE_KEY = 'virgil-bakery-profile';

interface CachedProfile {
  name: string;
  phone: string;
  judet: string;
  localitate: string;
  streetAddress: string;
  addressDetails: string;
  glsChoice: 'punct' | 'acasa';
  glsPoint: GlsPoint | null;
}

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
  /** wa.me link from the siteConfig global; falls back to the shared default. */
  whatsappUrl?: string;
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
  whatsappUrl,
}: CartPageClientProps = {}) {
  const { items, updateQuantity, removeItem, clearCart, total, itemCount } = useCart();
  const emptyAddress: AddressFields = {
    judet: '',
    localitate: '',
    streetAddress: '',
    addressDetails: '',
  };
  const [form, setForm] = useState({
    name: '',
    phone: '',
    deliveryDate: '',
  });
  // Hydration-safe prefill (issue #47): localStorage is read only after
  // mount, so server and client first paint the same empty form. Cached
  // values never overwrite what the customer typed while they landed.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(PROFILE_STORAGE_KEY);
      if (raw) {
        const cached = JSON.parse(raw) as Partial<CachedProfile>;
        setForm((f) => ({
          ...f,
          name: f.name === '' ? (cached.name ?? '') : f.name,
          phone: f.phone === '' ? (cached.phone ?? '') : f.phone,
        }));
        if (cached.judet || cached.localitate || cached.streetAddress) {
          setAddress((a) => ({
            judet: a.judet === '' ? (cached.judet ?? '') : a.judet,
            localitate: a.localitate === '' ? (cached.localitate ?? '') : a.localitate,
            streetAddress: a.streetAddress === '' ? (cached.streetAddress ?? '') : a.streetAddress,
            addressDetails:
              a.addressDetails === '' ? (cached.addressDetails ?? '') : a.addressDetails,
          }));
        }
        if (cached.glsChoice === 'acasa') setGlsChoice('acasa');
        const cachedPoint = cached.glsPoint;
        if (cachedPoint?.matchcode) {
          setGlsPoint(cachedPoint);
          // Revalidation against the live feed is deferred to the effect
          // below — it only matters when the address is outside the zone.
        }
      }
    } catch {
      /* corrupt cache — start fresh */
    }
  }, []);
  const [address, setAddress] = useState<AddressFields>(emptyAddress);
  const [formError, setFormError] = useState('');
  // Two-step "Golește coșul": first tap arms the confirm, second one clears.
  const [confirmingClear, setConfirmingClear] = useState(false);
  const clearConfirmTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Focus target for the error summary after a failed submit (GOV.UK pattern:
  // announce what went wrong to keyboard and screen-reader users).
  const errorSummaryRef = useRef<HTMLDivElement>(null);
  const shouldFocusSummaryRef = useRef(false);
  const [fieldErrors, setFieldErrors] = useState({
    name: '',
    phone: '',
    judet: '',
    localitate: '',
    streetAddress: '',
    glsPoint: '',
  });
  // GLS delivery choice for out-of-zone customers (issue #47).
  const [glsChoice, setGlsChoice] = useState<'punct' | 'acasa'>('punct');
  const [glsPoint, setGlsPoint] = useState<GlsPoint | null>(null);
  const [pointWarning, setPointWarning] = useState(false);
  const openGlsWidgetRef = useRef<(() => void) | null>(null);
  // Widget script failed to load on the last open attempt (retry possible:
  // the picker reports null once a retry succeeds).
  const [glsWidgetFailed, setGlsWidgetFailed] = useState(false);
  // Issue #41 — double-submit guard. The ref locks synchronously (a second
  // click before re-render must not pass); the state only drives the disabled
  // button. Unlocks on failure so the customer can retry; on success the cart
  // is cleared and we navigate away, so staying locked is harmless.
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState(false);
  const submittingRef = useRef(false);
  const router = useRouter();

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

  const zone = useMemo(
    () => detectDeliveryZone(address.judet, address.localitate),
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

  // Resolved delivery method + shipping (issues #47, #61). Outside the zone
  // the customer's radio choice decides; home above 10 kg is unavailable
  // (null) and the checkout blocks on it. Shipping weight = unit grams ×
  // quantity across the cart.
  const deliveryMethod =
    zone !== 'out' ? 'personal' : glsChoice === 'punct' ? 'gls-punct' : 'gls-acasa';

  const totalWeight = items.reduce((sum, item) => sum + item.weight * item.quantity, 0);

  const shippingCost = shippingCostFor(deliveryMethod, zone, totalWeight);

  /** Home-delivery tier for the current cart (null = unavailable, >10 kg). */
  const homePrice = homeShippingCost(totalWeight);
  const homeTier = homeTierLabel(totalWeight);

  // A cached "acasă" choice can outlive its availability — the cart may have
  // grown past 10 kg since. Fall back to point delivery instead of leaving
  // the disabled radio checked and the only working option off.
  useEffect(() => {
    if (glsChoice === 'acasa' && homePrice == null) setGlsChoice('punct');
  }, [glsChoice, homePrice]);

  // A removed cached GLS point is caught server-side at order submit
  // (recomputeDeliveryPricing → glsPointExistsInFeed, fail-open) — the
  // client no longer downloads the 1.5 MB delivery-point feed.

  const showTransport = shippingCost != null && shippingCost > 0;
  // Summary/total need a concrete number; a null (home >10 kg) blocks submit
  // before the POST, so the fallback here is display-only.
  const displayShippingCost = shippingCost ?? 0;

  const handleCheckout = async () => {
    /** Any validation dead-end: arm the error-summary focus (after React
     * commits the summary to the DOM), then return. */
    const failValidation = () => {
      shouldFocusSummaryRef.current = true;
      requestAnimationFrame(() => {
        if (!shouldFocusSummaryRef.current) return;
        shouldFocusSummaryRef.current = false;
        errorSummaryRef.current?.focus();
      });
    };
    if (staleItemIds.size > 0) {
      failValidation();
      setFormError('Elimină produsele indisponibile din coș pentru a continua');
      return;
    }
    if (hasDayConflict || hasDateConflict) {
      failValidation();
      setFormError(
        hasDateConflict
          ? 'Produsele din coș au date de livrare diferite — elimină unul pentru a continua'
          : 'Produsele din coș nu pot fi livrate în aceeași zi — elimină unul',
      );
      return;
    }
    if (!selectedDelivery) {
      failValidation();
      setFormError('Selectează o dată de livrare');
      return;
    }
    const preSelected = deliveryDates.find((d) => d.label === selectedDelivery);
    if (preSelected && !cartAllowedDays.includes(preSelected.date.getDay())) {
      failValidation();
      setFormError('Data selectată nu este disponibilă pentru toate produsele din coș');
      return;
    }
    if (preSelected && !preSelected.isSelectable) {
      failValidation();
      setFormError('Data selectată nu este disponibilă pentru toate produsele din coș');
      return;
    }
    setFormError('');

    if (shippingCost == null) {
      // Home delivery above 10 kg — the radio is disabled; a stale cached
      // choice can still land here, so guard the submit too.
      failValidation();
      setFormError(
        'Livrarea acasă nu este disponibilă peste 10 kg — alege un punct GLS sau scrie-ne pe WhatsApp',
      );
      return;
    }

    const errors = {
      name: '',
      phone: '',
      judet: '',
      localitate: '',
      streetAddress: '',
      glsPoint: '',
    };
    // Phone is the customer identity for the whole pipeline — required on every
    // order. No format validation on purpose: any reachable number beats a
    // rejected order.
    if (!form.phone.trim()) errors.phone = 'Telefonul este obligatoriu';
    if (!form.name.trim()) errors.name = 'Numele este obligatoriu';
    if (!address.judet) errors.judet = 'Județul este obligatoriu';
    if (!address.localitate.trim()) errors.localitate = 'Localitatea este obligatorie';
    // Street is the destination for personal and home delivery; for GLS point
    // delivery the chosen locker/ParcelShop replaces it.
    if (deliveryMethod !== 'gls-punct' && !address.streetAddress.trim())
      errors.streetAddress = 'Strada și numărul sunt obligatorii';
    if (deliveryMethod === 'gls-punct' && !glsPoint) errors.glsPoint = 'Alege punctul GLS';
    setFieldErrors(errors);
    if (
      errors.name ||
      errors.phone ||
      errors.judet ||
      errors.localitate ||
      errors.streetAddress ||
      errors.glsPoint
    ) {
      failValidation();
      return;
    }
    if (submittingRef.current) return; // an order POST is already in flight
    submittingRef.current = true;
    setIsSubmitting(true);
    setSubmitError(false);

    const selectedDate = deliveryDates.find((d) => d.label === selectedDelivery);

    /** Failed submit: release the lock so the customer can retry, show the
     * error banner, keep the cart. Used for both non-2xx and network errors. */
    const failSubmit = () => {
      submittingRef.current = false;
      setIsSubmitting(false);
      setSubmitError(true);
    };

    try {
      const res = await fetch('/api/orders', {
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
          streetAddress:
            deliveryMethod === 'gls-punct' ? undefined : address.streetAddress || undefined,
          addressDetails:
            deliveryMethod === 'gls-punct' ? undefined : address.addressDetails || undefined,
          glsPoint:
            deliveryMethod === 'gls-punct' && glsPoint
              ? {
                  goldId: glsPoint.goldId ?? null,
                  matchcode: glsPoint.matchcode,
                  nume: glsPoint.nume,
                  adresa: glsPoint.adresa,
                  tip: glsPoint.tip,
                }
              : undefined,
          status: 'nou',
        }),
      });
      if (!res.ok) {
        // Order not persisted server-side: retryable failure. Payload
        // validation rejections (recomputed pricing, removed GLS point)
        // carry a field message — surface it instead of the generic banner.
        let message: string | null = null;
        let path = '';
        try {
          const body = (await res.json()) as {
            errors?: { message?: unknown; path?: unknown }[];
          };
          const first = body.errors?.find(
            (e): e is { message: string; path?: unknown } =>
              typeof e.message === 'string' && e.message !== '',
          );
          if (first) {
            message = first.message;
            path = typeof first.path === 'string' ? first.path : '';
          }
        } catch {
          /* not a Payload error body — generic failure below */
        }
        submittingRef.current = false;
        setIsSubmitting(false);
        if (!message) {
          setSubmitError(true);
          return;
        }
        const text = message;
        if (path === 'glsPoint') {
          // Confirmed-removed cached point: drop it so the re-pick UI shows
          // (pointWarning line below the button) and block the field.
          setGlsPoint(null);
          setPointWarning(true);
          setFieldErrors((prev) => ({ ...prev, glsPoint: text }));
        } else {
          setFormError(text);
        }
        failValidation();
        return;
      }
    } catch {
      // Network failure: same treatment — visible error, unlocked retry.
      failSubmit();
      return;
    }

    // Success: cache the checkout profile for the next visit prefill (the
    // full form — single flow for everyone now, issue #47), clear the cart,
    // go to the thank-you page.
    const profile: CachedProfile = {
      name: form.name,
      phone: form.phone,
      judet: address.judet,
      localitate: address.localitate,
      streetAddress: address.streetAddress,
      addressDetails: address.addressDetails,
      glsChoice,
      glsPoint: deliveryMethod === 'gls-punct' ? glsPoint : null,
    };
    try {
      localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(profile));
    } catch {
      /* storage full — prefill is a convenience, never a blocker */
    }
    clearCart();
    router.push('/multumim');
  };

  // Let an armed "Golește coșul" confirm disarm itself after a pause.
  useEffect(
    () => () => {
      if (clearConfirmTimerRef.current) clearTimeout(clearConfirmTimerRef.current);
    },
    [],
  );

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
                    {item.weight ? (
                      <p className="text-sm text-muted-foreground font-sans">{item.weight}g</p>
                    ) : null}
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
                        className="flex items-center justify-center h-11 w-11 rounded-full border border-border hover:bg-secondary transition-colors"
                        aria-label="Scade cantitatea"
                      >
                        <Minus className="w-3 h-3" />
                      </button>
                      <span className="w-8 text-center font-sans font-medium">{item.quantity}</span>
                      <button
                        type="button"
                        onClick={() => updateQuantity(item.productId, item.quantity + 1)}
                        className="flex items-center justify-center h-11 w-11 rounded-full border border-border hover:bg-secondary transition-colors"
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
                      className="flex h-11 w-11 items-center justify-center text-muted-foreground hover:text-destructive transition-colors"
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
                onClick={() => {
                  if (confirmingClear) {
                    if (clearConfirmTimerRef.current) clearTimeout(clearConfirmTimerRef.current);
                    setConfirmingClear(false);
                    clearCart();
                  } else {
                    setConfirmingClear(true);
                    // One stray thumb-tap must not destroy a checkout in
                    // progress; the confirm disarms itself after 3s.
                    clearConfirmTimerRef.current = setTimeout(
                      () => setConfirmingClear(false),
                      3000,
                    );
                  }
                }}
                className="text-sm font-sans text-destructive hover:underline"
              >
                {confirmingClear
                  ? 'Golește coșul — apasă din nou pentru a confirma'
                  : 'Golește coșul'}
              </button>
            </div>
          </div>

          {/* Order form */}
          <div>
            <div className="rounded-xl border border-border bg-card p-6 sticky top-20">
              <h2 className="font-heading text-xl mb-4">Comandă</h2>

              <form
                noValidate
                onSubmit={(e) => {
                  e.preventDefault();
                  handleCheckout();
                }}
              >
                {/* Error summary — the one announced, focusable place every failed
                  submit lands on (role=alert + focus), linking to the invalid
                  fields. Inline errors below stay as the per-field reminders. */}
                {(formError || Object.values(fieldErrors).some(Boolean)) && (
                  <div
                    ref={errorSummaryRef}
                    role="alert"
                    tabIndex={-1}
                    className="mb-4 rounded-xl border border-destructive/30 bg-destructive/5 p-4 focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <p className="font-sans text-sm font-semibold text-destructive">
                      {Object.values(fieldErrors).some(Boolean)
                        ? 'Completează câmpurile evidențiate'
                        : 'Corectează comanda'}
                    </p>
                    {formError && (
                      <p className="mt-1 font-sans text-sm leading-relaxed text-foreground">
                        {formError}
                      </p>
                    )}
                    <ul className="mt-1 list-inside space-y-0.5">
                      {fieldErrors.name && (
                        <li>
                          <a
                            href="#customer-name"
                            className="text-sm font-sans text-destructive underline"
                          >
                            {fieldErrors.name}
                          </a>
                        </li>
                      )}
                      {fieldErrors.phone && (
                        <li>
                          <a
                            href="#customer-phone"
                            className="text-sm font-sans text-destructive underline"
                          >
                            {fieldErrors.phone}
                          </a>
                        </li>
                      )}
                      {fieldErrors.judet && (
                        <li>
                          <a
                            href="#address-judet"
                            className="text-sm font-sans text-destructive underline"
                          >
                            {fieldErrors.judet}
                          </a>
                        </li>
                      )}
                      {fieldErrors.localitate && (
                        <li>
                          <a
                            href="#address-localitate"
                            className="text-sm font-sans text-destructive underline"
                          >
                            {fieldErrors.localitate}
                          </a>
                        </li>
                      )}
                      {fieldErrors.streetAddress && (
                        <li>
                          <a
                            href="#address-street"
                            className="text-sm font-sans text-destructive underline"
                          >
                            {fieldErrors.streetAddress}
                          </a>
                        </li>
                      )}
                      {fieldErrors.glsPoint && (
                        <li>
                          <a
                            href="#gls-punct-card"
                            className="text-sm font-sans text-destructive underline"
                          >
                            {fieldErrors.glsPoint}
                          </a>
                        </li>
                      )}
                    </ul>
                  </div>
                )}

                <div className="mb-6 pb-4 border-b border-border space-y-2">
                  <div className="flex justify-between">
                    <span className="font-sans text-muted-foreground">
                      Subtotal ({itemCount} {itemCount === 1 ? 'produs' : 'produse'})
                    </span>
                    <span className="font-sans font-medium">{formatPrice(total)}</span>
                  </div>
                  {showTransport && (
                    <div className="flex justify-between">
                      <span className="font-sans text-muted-foreground">Transport (GLS)</span>
                      <span className="font-sans font-medium">
                        {formatPrice(displayShippingCost)}
                      </span>
                    </div>
                  )}
                  {showTransport && deliveryMethod === 'gls-acasa' && homeTier && (
                    <p className="text-xs font-sans text-muted-foreground -mt-1">{homeTier}</p>
                  )}
                  {zone === 'out' && (
                    <div className="flex justify-between">
                      <span className="font-sans text-muted-foreground">
                        Greutate totală: {totalWeight}g
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between pt-2 border-t border-border">
                    <span className="font-sans text-lg font-bold">Total</span>
                    <span className="font-sans text-xl font-bold text-primary">
                      {formatPrice(total + displayShippingCost)}
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
                    {!hasDayConflict && !hasDateConflict && restrictedItems.length > 0 && (
                      <p className="text-xs text-muted-foreground font-sans mt-1">
                        {cartAllowedDates
                          ? `Se poate livra doar ${formatRomanianDate(cartAllowedDates[0])} — ${oneOffItems.map((e) => e.item.name).join(', ')} ${oneOffItems.length === 1 ? 'este disponibil' : 'sunt disponibile'} doar atunci.`
                          : `Se poate livra doar ${weekdayListLabel(cartAllowedDays)} — unele produse din coș nu sunt disponibile în alte zile.`}
                      </p>
                    )}
                  </div>

                  {/* Name — single flow for everyone (issue #47) */}
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
                      autoComplete="name"
                      value={form.name}
                      aria-invalid={fieldErrors.name ? true : undefined}
                      aria-describedby={fieldErrors.name ? 'customer-name-error' : undefined}
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
                      <p
                        id="customer-name-error"
                        className="text-xs text-destructive font-sans mt-1"
                      >
                        {fieldErrors.name}
                      </p>
                    )}
                  </div>

                  {/* Phone — required on every order; the customer identity the
                    whole pipeline (confirmation, sheet matching) keys on. Kept
                    next to the name so a typo surfaces before the customer
                    invests in the rest of the form. */}
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
                      aria-invalid={fieldErrors.phone ? true : undefined}
                      aria-describedby={fieldErrors.phone ? 'customer-phone-error' : undefined}
                      onChange={(e) => {
                        setForm({ ...form, phone: e.target.value });
                        setFieldErrors({ ...fieldErrors, phone: '' });
                      }}
                      className={`w-full rounded-lg border px-3 py-2 text-sm font-sans focus:outline-none focus:ring-2 focus:ring-ring ${
                        fieldErrors.phone ? 'border-destructive' : 'border-input'
                      }`}
                      placeholder="07XX XXX XXX"
                    />
                    {fieldErrors.phone && (
                      <p
                        id="customer-phone-error"
                        className="text-xs text-destructive font-sans mt-1"
                      >
                        {fieldErrors.phone}
                      </p>
                    )}
                  </div>

                  {/* Address — always; street hidden for GLS point delivery */}
                  <AddressForm
                    values={address}
                    onChange={setAddress}
                    hideStreetFields={deliveryMethod === 'gls-punct'}
                    errors={{
                      judet: fieldErrors.judet || undefined,
                      localitate: fieldErrors.localitate || undefined,
                      streetAddress: fieldErrors.streetAddress || undefined,
                    }}
                  />

                  {/* Zone-driven delivery info (issue #47) */}
                  {zone === 'in' && (
                    <div className="rounded-lg bg-secondary/50 px-3 py-2 text-sm font-sans">
                      🚗 Livrare personală — Gratuită
                    </div>
                  )}
                  {zone === 'unknown' && (
                    <p className="text-xs text-muted-foreground font-sans">
                      Completează județul și localitatea pentru a vedea opțiunile de livrare.
                    </p>
                  )}
                  {zone === 'out' && (
                    <div className="space-y-3" role="radiogroup" aria-label="Metodă de livrare GLS">
                      <p className="text-xs text-muted-foreground font-sans">
                        Suntem în afara zonei de livrare personală — trimitem prin GLS:
                      </p>

                      {/* Punct GLS card */}
                      <label
                        id="gls-punct-card"
                        className={`block rounded-xl border-2 p-3 cursor-pointer transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                          glsChoice === 'punct'
                            ? 'border-primary bg-primary/5'
                            : 'border-border hover:border-primary/40'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="gls-method"
                            className="mt-1"
                            checked={glsChoice === 'punct'}
                            onChange={() => {
                              setGlsChoice('punct');
                              // Point delivery replaces the street address —
                              // clear its stale submit error.
                              setFieldErrors((prev) => ({ ...prev, streetAddress: '' }));
                            }}
                          />
                          <span className="flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="font-sans font-semibold text-sm">
                                <Package className="mr-1 inline h-4 w-4 text-primary" />
                                Punct GLS
                              </span>
                              <span className="font-sans font-bold text-sm">
                                {POINT_SHIPPING_COST} lei
                              </span>
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground font-sans">
                              Locker sau ParcelShop — alegi punctul de pe hartă. Preț fix,
                              indiferent de numărul de produse.
                            </span>
                          </span>
                        </div>
                        {glsChoice === 'punct' && (
                          <div className="mt-3 space-y-2">
                            {glsPoint ? (
                              <>
                                <div className="flex items-start gap-2 rounded-lg border border-border bg-secondary/40 px-3 py-2">
                                  <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                                  <div className="min-w-0 text-sm font-sans">
                                    <p className="font-medium leading-tight">{glsPoint.nume}</p>
                                    <p className="text-muted-foreground leading-tight">
                                      {glsPoint.adresa || 'GLS'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                      {glsPoint.tip === 'parcel-shop' ? 'ParcelShop' : 'Locker GLS'}
                                      {glsPoint.goldId ? ` · ID ${glsPoint.goldId}` : ''}
                                    </p>
                                  </div>
                                </div>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openGlsWidgetRef.current?.();
                                  }}
                                  className="text-xs font-sans text-primary hover:underline"
                                >
                                  Schimbă punctul
                                </button>
                              </>
                            ) : (
                              <>
                                <p className="text-xs text-muted-foreground font-sans">
                                  În hartă, caută „{address.localitate || 'localitatea ta'}” sau
                                  folosește butonul de locație al hărții.
                                </p>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.preventDefault();
                                    openGlsWidgetRef.current?.();
                                  }}
                                  className="flex w-full items-center justify-center gap-2 rounded-lg border border-primary/40 bg-primary/10 px-3 py-2.5 text-sm font-sans font-medium text-primary hover:bg-primary/20 transition-colors"
                                >
                                  <MapPin className="h-4 w-4" />
                                  Alege punctul GLS pe hartă
                                </button>
                              </>
                            )}
                            {glsWidgetFailed && (
                              <p className="text-xs text-destructive font-sans">
                                Harta GLS nu se încarcă acum — verifică conexiunea și încearcă din
                                nou, sau comandă pe{' '}
                                <a
                                  href={whatsappUrl || whatsappLink()}
                                  className="underline hover:opacity-80"
                                >
                                  WhatsApp
                                </a>
                                .
                              </p>
                            )}
                            {pointWarning && !glsPoint && (
                              <p className="text-xs text-muted-foreground font-sans">
                                Punctul salvat anterior nu mai este disponibil — alege altul.
                              </p>
                            )}
                            {fieldErrors.glsPoint && (
                              <p className="text-xs text-destructive font-sans">
                                {fieldErrors.glsPoint}
                              </p>
                            )}
                          </div>
                        )}
                      </label>

                      {/* Acasă card */}
                      <label
                        className={`block rounded-xl border-2 p-3 transition-all has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring ${
                          homePrice != null
                            ? `cursor-pointer ${
                                glsChoice === 'acasa'
                                  ? 'border-primary bg-primary/5'
                                  : 'border-border hover:border-primary/40'
                              }`
                            : 'border-border opacity-50'
                        }`}
                      >
                        <div className="flex items-start gap-3">
                          <input
                            type="radio"
                            name="gls-method"
                            className="mt-1"
                            disabled={homePrice == null}
                            checked={glsChoice === 'acasa'}
                            onChange={() => {
                              setGlsChoice('acasa');
                              // Home delivery replaces the GLS point — clear
                              // its stale submit error.
                              setFieldErrors((prev) => ({ ...prev, glsPoint: '' }));
                            }}
                          />
                          <span className="flex-1">
                            <span className="flex items-baseline justify-between gap-2">
                              <span className="font-sans font-semibold text-sm">
                                <Home className="mr-1 inline h-4 w-4 text-primary" />
                                Livrare acasă
                              </span>
                              <span className="font-sans font-bold text-sm">
                                {homePrice != null ? `${homePrice} lei` : 'indisponibil'}
                              </span>
                            </span>
                            <span className="mt-0.5 block text-xs text-muted-foreground font-sans">
                              {homePrice != null ? (
                                <>
                                  Curier GLS livrează la adresa ta — {homePrice} lei · {homeTier}.
                                </>
                              ) : (
                                <>
                                  Peste 10 kg — alege un punct GLS sau{' '}
                                  <a
                                    href={whatsappUrl || whatsappLink()}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="underline"
                                  >
                                    scrie-ne pe WhatsApp
                                  </a>
                                  .
                                </>
                              )}
                            </span>
                          </span>
                        </div>
                      </label>
                    </div>
                  )}
                </div>

                {submitError && (
                  <div
                    role="alert"
                    className="mb-4 flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4"
                  >
                    <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
                    <div className="font-sans text-sm leading-relaxed text-foreground">
                      <p className="font-semibold">Comanda nu a putut fi trimisă</p>
                      <p className="mt-1">
                        Verifică conexiunea și apasă din nou butonul. Produsele din coș sunt
                        păstrate — nu trebuie să le adaugi din nou.
                      </p>
                    </div>
                  </div>
                )}

                <button
                  type="submit"
                  disabled={
                    hasDayConflict || hasDateConflict || staleItemIds.size > 0 || isSubmitting
                  }
                  className="w-full inline-flex items-center justify-center gap-2 rounded-full bg-primary text-primary-foreground px-8 py-3 font-sans font-medium hover:bg-primary/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-primary"
                >
                  {isSubmitting ? 'Se trimite…' : 'Trimite comanda'}
                </button>
              </form>
              <GlsPointPicker
                onSelect={(selected) => {
                  setGlsPoint(selected);
                  // Same contract as every text field: picking a valid point
                  // clears its validation error.
                  setFieldErrors((prev) => ({ ...prev, glsPoint: '' }));
                }}
                registerOpen={(open) => {
                  openGlsWidgetRef.current = open;
                }}
                onLoadResult={(error) => setGlsWidgetFailed(error != null)}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

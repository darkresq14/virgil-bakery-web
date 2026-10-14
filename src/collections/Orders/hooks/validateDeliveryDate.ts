import type { CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';
import { formatRomanianDate, isInHoliday } from '@/utilities/deliveryDates';
import {
  availabilityDaysToWeekdays,
  isOneOffPurchaseable,
  isSameRoDay,
  parseOneOffDate,
} from '@/utilities/productAvailability';

/**
 * Server-side guard for Availability Day, One-off Availability, availability
 * and holiday periods (see CONTEXT.md). The cart UI already filters delivery
 * dates, but the DB write must not trust the client: an order whose delivery
 * weekday is not allowed for some item, that references an unpublished/
 * unavailable product, that misses a one-off product's date/window, or whose
 * delivery date falls inside the holiday period, is rejected with 400.
 */
export const validateDeliveryDate: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data;

  const dataRecord = data as Record<string, unknown>;
  const rawItems = Array.isArray(dataRecord.items) ? dataRecord.items : [];
  const productIds = rawItems
    .map((item) => {
      const candidate = (item as { productId?: unknown }).productId;
      return candidate == null ? '' : String(candidate);
    })
    .filter(Boolean);

  const deliveryDate =
    typeof dataRecord.deliveryDate === 'string' || dataRecord.deliveryDate instanceof Date
      ? new Date(dataRecord.deliveryDate as string | Date)
      : null;
  const hasValidDate = deliveryDate != null && !Number.isNaN(deliveryDate.getTime());

  if (!productIds.length || !hasValidDate) return data;

  // The client sends ISO strings built from Romania-local midnight; read the
  // weekday back in Europe/Bucharest so it matches what the customer saw.
  const weekday = new Date(
    deliveryDate.toLocaleString('en-US', { timeZone: 'Europe/Bucharest' }),
  ).getDay();

  // Public read access returns published products only — unpublished/deleted
  // products simply won't be found.
  const products = await req.payload.find({
    collection: 'products',
    depth: 0,
    limit: 100,
    where: { id: { in: productIds } },
  });

  const fail = (message: string): never => {
    throw new ValidationError({
      errors: [{ message, path: 'items' }],
    });
  };

  // A holiday closes the bakery entirely — no delivery date inside the period
  // is ever orderable, regardless of products in the cart.
  const siteConfig = await req.payload.findGlobal({ slug: 'siteConfig', depth: 0 });
  if (isInHoliday(deliveryDate, siteConfig?.holidayStartDate, siteConfig?.holidayEndDate)) {
    fail('Nu livrăm în perioada de concediu — alege altă dată de livrare');
  }

  const found = new Map(products.docs.map((p) => [String(p.id), p]));
  for (const id of productIds) {
    if (!found.has(id)) {
      fail(`Unul dintre produse nu mai este disponibil (id: ${id})`);
    }
  }

  const now = new Date();
  for (const product of products.docs) {
    // One-off Availability has the highest priority: exact-date match plus a
    // live purchase window; it overrides the available flag and Availability Day.
    const oneOff = parseOneOffDate(product.availableOnDate);
    if (oneOff) {
      if (!isSameRoDay(deliveryDate, oneOff)) {
        fail(`${product.name} se poate comanda doar pentru ${formatRomanianDate(oneOff)}`);
      }
      if (!isOneOffPurchaseable(oneOff, now)) {
        fail(`${product.name} nu mai este disponibil pentru data selectată`);
      }
      continue;
    }
    if (product.available === false) {
      fail(`${product.name} este momentan indisponibil`);
    }
    const allowed = availabilityDaysToWeekdays(product.availableDays);
    if (!allowed.includes(weekday)) {
      fail(`${product.name} nu este disponibil în ziua de livrare selectată`);
    }
  }

  return data;
};

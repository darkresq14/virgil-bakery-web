import type { CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';

import { availabilityDaysToWeekdays } from '@/utilities/productAvailability';

/**
 * Server-side guard for Availability Day + availability (see CONTEXT.md).
 * The cart UI already filters delivery dates, but the DB write must not trust
 * the client: an order whose delivery weekday is not allowed for some item, or
 * that references an unpublished/unavailable product, is rejected with 400.
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

  const found = new Map(products.docs.map((p) => [String(p.id), p]));
  for (const id of productIds) {
    if (!found.has(id)) {
      fail(`Unul dintre produse nu mai este disponibil (id: ${id})`);
    }
  }

  for (const product of products.docs) {
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

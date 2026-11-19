import type { CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';

import { detectDeliveryZone, homeShippingCost, POINT_SHIPPING_COST } from '@/utilities/glsDelivery';
import { glsPointExistsInFeed } from '@/utilities/glsPointFeed';

/**
 * Server-side pricing guard for the anonymous checkout POST (code review on
 * #47): the public create never trusts client-computed subtotal /
 * shippingCost / total. Prices come from the Products collection, shipping
 * from the glsDelivery tiers + the zone derived from judet/localitate, and
 * the method must be consistent with the zone.
 *
 * Scoped to anonymous creates — admin-entered orders (manual / re-push,
 * including the legacy 'curier' passthrough, ADR 0007) keep their values.
 */
export const recomputeDeliveryPricing: CollectionBeforeChangeHook = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data;
  if (req.user) return data;

  const dataRecord = data as Record<string, unknown>;
  const rawItems = Array.isArray(dataRecord.items) ? dataRecord.items : [];
  const method = typeof dataRecord.deliveryMethod === 'string' ? dataRecord.deliveryMethod : '';

  // Function declaration (not const arrow): TS control-flow narrowing only
  // follows never-returning calls declared this way.
  function fail(message: string, path = 'deliveryMethod'): never {
    throw new ValidationError({ errors: [{ message, path }] });
  }

  const judet = typeof dataRecord.judet === 'string' ? dataRecord.judet : '';
  const localitate = typeof dataRecord.localitate === 'string' ? dataRecord.localitate : '';
  if (!judet || !localitate) {
    fail('Județul și localitatea sunt obligatorii pentru livrare', 'localitate');
  }

  // Quantities drive the home tier — a non-positive value would skew it.
  for (const item of rawItems as { quantity?: unknown }[]) {
    const quantity = Number(item?.quantity);
    if (!Number.isFinite(quantity) || quantity < 1) {
      fail('Coșul este invalid — cantități greșite', 'items');
    }
  }

  // Public read access returns published products only — same trust model
  // as validateDeliveryDate.
  const productIds = rawItems
    .map((item) => (item as { productId?: unknown }).productId)
    .filter((id): id is string => typeof id === 'string' && id !== '');
  if (!productIds.length) fail('Coșul este gol', 'items');

  const products = await req.payload.find({
    collection: 'products',
    depth: 0,
    limit: 100,
    where: { id: { in: productIds } },
    req,
  });
  const prices = new Map(products.docs.map((p) => [String(p.id), p.price as number]));

  let subtotal = 0;
  let itemCount = 0;
  const items = (rawItems as Record<string, unknown>[]).map((item) => {
    const id = String(item.productId ?? '');
    const price = prices.get(id);
    // Two guards, not one `||`: TS never-return narrowing only works on a
    // single condition — collapsing them widens `price` back to `number |
    // undefined` for the arithmetic below.
    if (price == null) {
      fail(`Unul dintre produse nu mai este disponibil (id: ${id})`, 'items');
    }
    if (!Number.isFinite(price)) {
      fail(`Unul dintre produse nu mai este disponibil (id: ${id})`, 'items');
    }
    const quantity = Number(item.quantity);
    subtotal += price * quantity;
    itemCount += quantity;
    return { ...item, price };
  });

  const zone = detectDeliveryZone(judet, localitate);

  let shippingCost: number;
  if (zone === 'in') {
    if (method !== 'personal') {
      fail('Adresa este în zona de livrare personală — metoda trebuie să fie personală');
    }
    shippingCost = 0;
  } else {
    if (method === 'gls-punct') {
      const matchcode = (dataRecord.glsPoint as { matchcode?: unknown } | undefined)?.matchcode;
      if (typeof matchcode !== 'string' || matchcode === '') {
        fail('Alege punctul GLS', 'glsPoint');
      }
      const goldId = (dataRecord.glsPoint as { goldId?: unknown } | undefined)?.goldId;
      // Cached-point existence check, fail-open (glsPointFeed.ts): only a
      // confirmed miss against a well-shaped live feed rejects — customers
      // no longer download the 1.5 MB feed at checkout mount.
      const exists = await glsPointExistsInFeed(
        matchcode,
        typeof goldId === 'string' ? goldId : null,
      );
      if (!exists) {
        fail('Punctul GLS ales nu mai este disponibil — alege alt punct', 'glsPoint');
      }
      shippingCost = POINT_SHIPPING_COST;
    } else if (method === 'gls-acasa') {
      const tier = homeShippingCost(itemCount);
      if (tier == null) {
        fail('Livrarea acasă nu este disponibilă peste 10 produse — alege un punct GLS');
      }
      shippingCost = tier;
    } else if (method === 'personal') {
      fail('Adresa este în afara zonei de livrare personală — alege o metodă GLS');
    } else {
      fail('Metodă de livrare invalidă');
    }
  }

  return {
    ...dataRecord,
    items,
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
  };
};

import type { CollectionBeforeChangeHook } from 'payload';
import { ValidationError } from 'payload';
import type { Order } from '@/payload-types';
import { detectDeliveryZone, shippingCostFor } from '@/utilities/glsDelivery';
import { glsPointExistsInFeed, glsPointGoldIdFor } from '@/utilities/glsPointFeed';

/**
 * Server-side pricing guard for the anonymous checkout POST (code review on
 * #47): the public create never trusts client-computed subtotal /
 * shippingCost / total. Prices and shipping weights come from the Products
 * collection, shipping from the glsDelivery tiers on the cart's weight sum
 * + the zone derived from judet/localitate, and the method must be
 * consistent with the zone.
 *
 * Scoped to anonymous creates — admin-entered orders (manual / re-push,
 * including the legacy 'curier' passthrough, ADR 0007) keep their values.
 */
export const recomputeDeliveryPricing: CollectionBeforeChangeHook<Order> = async ({
  data,
  operation,
  req,
}) => {
  if (operation !== 'create') return data;
  if (req.user) return data;

  // `items` is a JSON field, so its generated type is loose — one narrowing
  // for the untrusted array instead of per-use casts.
  const rawItems = Array.isArray(data.items) ? (data.items as Record<string, unknown>[]) : [];
  const method = data.deliveryMethod ?? '';

  // Function declaration (not const arrow): TS control-flow narrowing only
  // follows never-returning calls declared this way.
  function fail(message: string, path = 'deliveryMethod'): never {
    throw new ValidationError({ errors: [{ message, path }] });
  }

  const judet = data.judet ?? '';
  const localitate = data.localitate ?? '';
  if (!judet || !localitate) {
    fail('Județul și localitatea sunt obligatorii pentru livrare', 'localitate');
  }

  // Quantities scale the weight sum — fractional or non-positive values
  // would skew it (Number.isInteger implies finite).
  for (const item of rawItems) {
    const quantity = Number(item.quantity);
    if (!Number.isInteger(quantity) || quantity < 1) {
      fail('Coșul este invalid — cantitățile trebuie să fie numere întregi', 'items');
    }
  }

  // Public read access returns published products only — same trust model
  // as validateDeliveryDate.
  const productIds = rawItems
    .map((item) => item.productId)
    .filter((id): id is string => typeof id === 'string' && id !== '');
  if (!productIds.length) fail('Coșul este gol', 'items');

  // overrideAccess: false keeps Products read access in force: anonymous
  // requests resolve to published-only (authenticatedOrPublished), while
  // admin requests still see drafts. The Local API default (true) would
  // have let an anonymous order price a draft product.
  const products = await req.payload.find({
    collection: 'products',
    depth: 0,
    limit: 100,
    overrideAccess: false,
    where: { id: { in: productIds } },
    req,
  });
  const productsById = new Map(products.docs.map((p) => [String(p.id), p]));

  let subtotal = 0;
  let totalWeight = 0;
  const items = rawItems.map((item) => {
    const id = String(item.productId ?? '');
    const product = productsById.get(id);
    const price = product?.price;
    // Two guards, not one `||`: TS never-return narrowing only works on a
    // single condition — collapsing them widens `price` back to `number |
    // undefined` for the arithmetic below.
    if (price == null) {
      fail(`Unul dintre produse nu mai este disponibil (id: ${id})`, 'items');
    }
    if (!Number.isFinite(price)) {
      fail(`Unul dintre produse nu mai este disponibil (id: ${id})`, 'items');
    }
    // Weight drives the home tier — a missing/invalid value must reject
    // instead of silently mispricing (defense in depth under the required
    // field: required validates product saves, not order placement).
    const weight = product?.weight;
    if (weight == null) {
      fail(`Unul dintre produse nu are greutatea de livrare completată (id: ${id})`, 'items');
    }
    if (!Number.isInteger(weight) || weight < 1) {
      fail(`Unul dintre produse nu are greutatea de livrare completată (id: ${id})`, 'items');
    }
    const quantity = Number(item.quantity);
    subtotal += price * quantity;
    totalWeight += weight * quantity;
    return { ...item, price };
  });

  const zone = detectDeliveryZone(judet, localitate);

  let shippingCost: number;
  // Set only when the GLS point gains a feed-backfilled goldId — spread into
  // the returned data so the stored order (and the baker's sheet payload)
  // carries the complete point.
  let glsPoint: Order['glsPoint'];
  if (zone === 'in') {
    if (method !== 'personal') {
      fail('Adresa este în zona de livrare personală — metoda trebuie să fie personală');
    }
    shippingCost = 0;
  } else {
    if (method === 'gls-punct') {
      const point = data.glsPoint;
      const matchcode = point?.matchcode;
      if (typeof matchcode !== 'string' || matchcode === '') {
        fail('Alege punctul GLS', 'glsPoint');
      }
      let goldId = point?.goldId;
      if (typeof goldId !== 'string' || goldId === '') {
        // The widget never emits goldId (zero references in gls-dpm-modern.js)
        // but the feed carries it for every point — backfill it so the
        // baker's MyGLS PSDParameter.IntegerValue is set whenever the feed is
        // reachable. Best-effort: a miss never blocks the order.
        const fedGoldId = await glsPointGoldIdFor(matchcode);
        if (fedGoldId != null) {
          goldId = fedGoldId;
          glsPoint = { ...(point ?? {}), goldId };
        }
      }
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
    } else if (method === 'personal') {
      fail('Adresa este în afara zonei de livrare personală — alege o metodă GLS');
    } else if (method !== 'gls-acasa') {
      fail('Metodă de livrare invalidă');
    }
    // One pricing source (glsDelivery.ts) for every method — null means
    // home delivery above 10 kg, the only unavailable combination.
    const cost = shippingCostFor(method, zone, totalWeight);
    if (cost == null) {
      fail('Livrarea acasă nu este disponibilă peste 10 kg — alege un punct GLS');
    }
    shippingCost = cost;
  }

  return {
    ...data,
    ...(glsPoint ? { glsPoint } : {}),
    items,
    subtotal,
    shippingCost,
    total: subtotal + shippingCost,
  };
};

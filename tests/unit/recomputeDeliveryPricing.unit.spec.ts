import { describe, expect, it, vi } from 'vitest';

import { recomputeDeliveryPricing } from '@/collections/Orders/hooks/recomputeDeliveryPricing';

vi.mock('@/utilities/glsPointFeed', () => ({
  glsPointExistsInFeed: vi.fn().mockResolvedValue(true),
  glsPointGoldIdFor: vi.fn().mockResolvedValue(null),
}));

/**
 * Direct-invocation tests for the anonymous-checkout pricing recompute
 * (beforeChange). The DB write must never trust client-computed
 * subtotal/shippingCost/total (code-review finding on #59): prices come from
 * the Products collection, shipping from glsDelivery tiers + zone.
 */

type HookArgs = Parameters<typeof recomputeDeliveryPricing>[0];

const productsById: Record<string, { id: string; price: number; weight: number }> = {
  '1': { id: '1', price: 10, weight: 800 },
  '2': { id: '2', price: 20, weight: 1000 },
};

function makeArgs(
  data: Record<string, unknown>,
  { user = null as HookArgs['req']['user'] } = {},
): HookArgs {
  const find = vi.fn().mockResolvedValue({
    docs: Object.values(productsById),
  });
  return {
    data,
    operation: 'create',
    req: { user, payload: { find } },
  } as unknown as HookArgs;
}

/** Payload ValidationError carries field messages in data.errors. */
async function rejectionMessage(args: HookArgs): Promise<string> {
  try {
    await recomputeDeliveryPricing(args);
  } catch (error) {
    const e = error as { data?: { errors?: { message?: string }[] } };
    return e.data?.errors?.[0]?.message ?? '';
  }
  return '';
}

const outZoneAddress = { judet: 'Cluj', localitate: 'Cluj-Napoca' };
const inZoneAddress = { judet: 'Sibiu', localitate: 'Sibiu' };

/** Override the mocked Products lookup for a specific scenario. */
function withDocs(args: HookArgs, docs: unknown[]): HookArgs {
  (args.req.payload.find as ReturnType<typeof vi.fn>).mockResolvedValue({ docs });
  return args;
}

function items(quantity1 = 1, quantity2 = 2) {
  return [
    { productId: '1', name: 'Pâine', quantity: quantity1, price: 0.01 },
    { productId: '2', name: 'Cozonac', quantity: quantity2, price: 0.01 },
  ];
}

describe('recomputeDeliveryPricing — anonymous creates', () => {
  it('recomputes subtotal/shipping/total from stored weights (out zone, acasă, 2800g → 33 lei)', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'gls-acasa',
      ...outZoneAddress,
      total: 1,
      subtotal: 1,
      shippingCost: 1,
    };
    const result = (await recomputeDeliveryPricing(makeArgs(data))) as Record<string, unknown>;

    // 10×1 + 20×2 = 50 lei; 800×1 + 1000×2 = 2800 g → the ≤5 kg tier = 33
    // lei. The client's forged 1-lei values never survive.
    expect(result.subtotal).toBe(50);
    expect(result.shippingCost).toBe(33);
    expect(result.total).toBe(83);
    // Client-sent per-item prices are overwritten too.
    expect((result.items as { price: number }[])[0].price).toBe(10);
  });

  it('charges the flat point fee for gls-punct and keeps the stored point', async () => {
    const data = {
      items: items(1, 2),
      deliveryMethod: 'gls-punct',
      glsPoint: { matchcode: 'ABC', nume: 'Locker 1' },
      ...outZoneAddress,
      total: 999,
      subtotal: 999,
      shippingCost: 999,
    };
    const result = (await recomputeDeliveryPricing(makeArgs(data))) as Record<string, unknown>;

    expect(result.subtotal).toBe(50);
    expect(result.shippingCost).toBe(25);
    expect(result.total).toBe(75);
  });

  it('rejects gls-punct without a stored point', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'gls-punct',
      ...outZoneAddress,
    };
    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(/punctul gls/i);
  });

  it('rejects gls-punct when the feed check confirms the point is gone', async () => {
    const { glsPointExistsInFeed } = await import('@/utilities/glsPointFeed');
    vi.mocked(glsPointExistsInFeed).mockResolvedValueOnce(false);
    const data = {
      items: items(),
      deliveryMethod: 'gls-punct',
      glsPoint: { matchcode: 'GONE', goldId: '7', nume: 'LockerDispărut' },
      ...outZoneAddress,
    };

    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(
      /punctul gls ales nu mai este disponibil/i,
    );
    expect(glsPointExistsInFeed).toHaveBeenCalledWith('GONE', '7');
  });

  it('checks the cached point against the feed with its goldId', async () => {
    const { glsPointExistsInFeed } = await import('@/utilities/glsPointFeed');
    const data = {
      items: items(),
      deliveryMethod: 'gls-punct',
      glsPoint: { matchcode: 'ABC', goldId: '12345', nume: 'Locker 1' },
      ...outZoneAddress,
    };
    await recomputeDeliveryPricing(makeArgs(data));

    expect(glsPointExistsInFeed).toHaveBeenCalledWith('ABC', '12345');
  });

  it('backfills glsPoint.goldId from the feed when the widget omitted it', async () => {
    // The widget never emits goldId (verified: zero references in the
    // gls-dpm-modern.js bundle), but the feed carries it for every point —
    // the requirement's "id-ul, dacă îl dă widgetul" becomes "dacă îl știm".
    const { glsPointGoldIdFor, glsPointExistsInFeed } = await import('@/utilities/glsPointFeed');
    vi.mocked(glsPointGoldIdFor).mockResolvedValueOnce('12370');
    const data = {
      items: items(),
      deliveryMethod: 'gls-punct',
      glsPoint: { matchcode: 'RO030602-PARCELLOCK', nume: 'GLS Locker 1083 Mol Romania' },
      ...outZoneAddress,
    };

    const result = (await recomputeDeliveryPricing(makeArgs(data))) as Record<string, unknown>;

    expect(result.glsPoint).toEqual({
      matchcode: 'RO030602-PARCELLOCK',
      nume: 'GLS Locker 1083 Mol Romania',
      goldId: '12370',
    });
    // The backfilled id also strengthens the existence check.
    expect(glsPointExistsInFeed).toHaveBeenCalledWith('RO030602-PARCELLOCK', '12370');
  });

  it('leaves glsPoint untouched when the feed lookup misses', async () => {
    const { glsPointGoldIdFor } = await import('@/utilities/glsPointFeed');
    vi.mocked(glsPointGoldIdFor).mockResolvedValueOnce(null);
    const data = {
      items: items(),
      deliveryMethod: 'gls-punct',
      glsPoint: { matchcode: 'ABC', nume: 'Locker 1' },
      ...outZoneAddress,
    };

    const result = (await recomputeDeliveryPricing(makeArgs(data))) as Record<string, unknown>;

    expect(result.glsPoint).toEqual({ matchcode: 'ABC', nume: 'Locker 1' });
  });

  it('prices exactly 10 kg at the top home tier (inclusive bound)', async () => {
    // 2 × 4500 g + 1000 g = 10000 g — the "până la 10 kg" label promises
    // the top tier, not unavailability.
    const data = {
      items: items(2, 1),
      deliveryMethod: 'gls-acasa',
      ...outZoneAddress,
    };
    const result = (await recomputeDeliveryPricing(
      withDocs(makeArgs(data), [{ ...productsById['1'], weight: 4500 }, productsById['2']]),
    )) as Record<string, unknown>;

    expect(result.subtotal).toBe(40);
    expect(result.shippingCost).toBe(43);
    expect(result.total).toBe(83);
  });

  it('rejects gls-acasa above 10 kg', async () => {
    // 800 g + 10000 g = 10800 g — past the last tier.
    const data = {
      items: items(1, 1),
      deliveryMethod: 'gls-acasa',
      ...outZoneAddress,
    };
    const args = withDocs(makeArgs(data), [
      productsById['1'],
      { ...productsById['2'], weight: 10000 },
    ]);
    await expect(rejectionMessage(args)).resolves.toMatch(/peste 10 kg/i);
  });

  it('rejects when a cart product lacks its shipping weight (any method)', async () => {
    // Defense in depth under the required field: required validates
    // product saves, not order placement — a legacy row can still be NULL.
    const data = {
      items: items(),
      deliveryMethod: 'gls-punct',
      glsPoint: { matchcode: 'ABC', nume: 'Locker 1' },
      ...outZoneAddress,
    };
    const args = withDocs(makeArgs(data), [
      productsById['1'],
      { ...productsById['2'], weight: null },
    ]);
    await expect(rejectionMessage(args)).resolves.toMatch(
      /nu are greutatea de livrare completată/i,
    );
  });

  it('rejects when a cart product carries an invalid shipping weight', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'personal',
      ...inZoneAddress,
    };
    const args = withDocs(makeArgs(data), [{ ...productsById['1'], weight: 0 }, productsById['2']]);
    await expect(rejectionMessage(args)).resolves.toMatch(
      /nu are greutatea de livrare completată/i,
    );
  });

  it('keeps point delivery flat over 10 kg', async () => {
    // Same 10800 g cart that home delivery rejects — the locker fee is
    // weight-independent.
    const data = {
      items: items(1, 1),
      deliveryMethod: 'gls-punct',
      glsPoint: { matchcode: 'ABC', nume: 'Locker 1' },
      ...outZoneAddress,
    };
    const args = withDocs(makeArgs(data), [
      productsById['1'],
      { ...productsById['2'], weight: 10000 },
    ]);
    const result = (await recomputeDeliveryPricing(args)) as Record<string, unknown>;

    expect(result.shippingCost).toBe(25);
    expect(result.total).toBe(55);
  });

  it('keeps personal delivery free over 10 kg inside the zone', async () => {
    const data = {
      items: items(1, 1),
      deliveryMethod: 'personal',
      ...inZoneAddress,
    };
    const args = withDocs(makeArgs(data), [
      productsById['1'],
      { ...productsById['2'], weight: 10000 },
    ]);
    const result = (await recomputeDeliveryPricing(args)) as Record<string, unknown>;

    expect(result.shippingCost).toBe(0);
  });

  it('gives personal delivery zero shipping inside the zone', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'personal',
      ...inZoneAddress,
      total: 999,
      subtotal: 999,
      shippingCost: 999,
    };
    const result = (await recomputeDeliveryPricing(makeArgs(data))) as Record<string, unknown>;

    expect(result.subtotal).toBe(50);
    expect(result.shippingCost).toBe(0);
    expect(result.total).toBe(50);
  });

  it('rejects a courier method inside the personal zone', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'gls-punct',
      glsPoint: { matchcode: 'ABC' },
      ...inZoneAddress,
    };
    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(/zona de livrare personal/i);
  });

  it('rejects personal method outside the zone', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'personal',
      ...outZoneAddress,
    };
    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(/afara zonei/i);
  });

  it("rejects the retired 'curier' value outright", async () => {
    const data = {
      items: items(),
      deliveryMethod: 'curier',
      ...outZoneAddress,
    };
    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(/metodă de livrare/i);
  });

  it('rejects anonymous orders without judet/localitate', async () => {
    const data = { items: items(), deliveryMethod: 'personal' };
    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(/județul și localitatea/i);
  });

  it('rejects items referencing a product missing from the server', async () => {
    const args = makeArgs({
      items: [{ productId: 'gone', name: 'X', quantity: 1, price: 5 }],
      deliveryMethod: 'personal',
      ...inZoneAddress,
    });
    (args.req.payload.find as ReturnType<typeof vi.fn>).mockResolvedValue({ docs: [] });

    await expect(rejectionMessage(args)).resolves.toMatch(/nu mai este disponibil/i);
  });

  it('rejects malformed item quantities', async () => {
    const data = {
      items: [{ productId: '1', name: 'Pâine', quantity: 0, price: 5 }],
      deliveryMethod: 'personal',
      ...inZoneAddress,
    };
    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(/coș/i);
  });

  it('rejects fractional quantities — the tier basis needs whole items (commit 7fb9264 promised this guard)', async () => {
    const data = {
      items: [{ productId: '1', name: 'Pâine', quantity: 2.5, price: 5 }],
      deliveryMethod: 'personal',
      ...inZoneAddress,
    };
    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(/numere întregi/i);
  });
});

describe('recomputeDeliveryPricing — scope guards', () => {
  it('leaves admin-created orders untouched', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'curier',
      total: 1,
      subtotal: 1,
      shippingCost: 1,
      ...outZoneAddress,
    };
    const result = await recomputeDeliveryPricing(
      makeArgs(data, { user: { id: 'admin' } as unknown as HookArgs['req']['user'] }),
    );

    expect(result).toBe(data);
  });

  it('leaves updates untouched', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'curier',
      total: 1,
    };
    const args = makeArgs(data);
    (args as { operation: string }).operation = 'update';

    const result = await recomputeDeliveryPricing(args);
    expect(result).toBe(data);
  });
});

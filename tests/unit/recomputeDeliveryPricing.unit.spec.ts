import { describe, expect, it, vi } from 'vitest';

import { recomputeDeliveryPricing } from '@/collections/Orders/hooks/recomputeDeliveryPricing';

vi.mock('@/utilities/glsPointFeed', () => ({
  glsPointExistsInFeed: vi.fn().mockResolvedValue(true),
  glsPointGoldIdFor: vi.fn().mockResolvedValue(null),
}));

/**
 * Direct-invocation tests for the anonymous-checkout pricing recompute
 * (beforeChange). The DB write must never trust client-computed
 * subtotal/shippingCost/total (code-review finding on #47): prices come from
 * the Products collection, shipping from glsDelivery tiers + zone.
 */

type HookArgs = Parameters<typeof recomputeDeliveryPricing>[0];

const productsById: Record<string, { id: string; price: number }> = {
  '1': { id: '1', price: 10 },
  '2': { id: '2', price: 20 },
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

function items(quantity1 = 1, quantity2 = 2) {
  return [
    { productId: '1', name: 'Pâine', quantity: quantity1, price: 0.01 },
    { productId: '2', name: 'Cozonac', quantity: quantity2, price: 0.01 },
  ];
}

describe('recomputeDeliveryPricing — anonymous creates', () => {
  it('recomputes subtotal/shipping/total from server data (out zone, acasă, 3 items)', async () => {
    const data = {
      items: items(),
      deliveryMethod: 'gls-acasa',
      ...outZoneAddress,
      total: 1,
      subtotal: 1,
      shippingCost: 1,
    };
    const result = (await recomputeDeliveryPricing(makeArgs(data))) as Record<string, unknown>;

    // 10×1 + 20×2 = 50; home tier for 3 items = 30.
    expect(result.subtotal).toBe(50);
    expect(result.shippingCost).toBe(30);
    expect(result.total).toBe(80);
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

  it('rejects gls-acasa above 10 items', async () => {
    const data = {
      items: items(6, 6),
      deliveryMethod: 'gls-acasa',
      ...outZoneAddress,
    };
    await expect(rejectionMessage(makeArgs(data))).resolves.toMatch(/peste 10 produse/i);
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

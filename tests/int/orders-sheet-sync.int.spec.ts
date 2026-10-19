import { getPayload, type Payload } from 'payload';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import config from '@/payload.config';

/**
 * Issue #35 — sheetSyncStatus wiring on the real Payload harness.
 * The sheet-sync seam (pushOrderToSheet) talks to the web app via global
 * fetch, so stubbing fetch controls the sync outcome end to end.
 */

let payload: Payload;
const createdIds: number[] = [];

const WEBAPP_URL = 'https://script.google.com/macros/s/TEST_DEPLOYMENT/exec';
const WEBAPP_TOKEN = 'test-token';

interface ResponseLike {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}

function jsonResponse(body: unknown, status = 200): ResponseLike {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: async () => body,
  };
}

/** Records every fetch call and answers with the given script. */
function stubFetch(
  script: (url: string, init?: RequestInit) => ResponseLike | Promise<ResponseLike> | never,
) {
  const calls: { url: string; init: RequestInit | undefined }[] = [];
  const fetchMock = vi.fn(async (url: unknown, init?: RequestInit) => {
    calls.push({ url: String(url), init });
    return script(String(url), init);
  });
  vi.stubGlobal('fetch', fetchMock);
  return { calls, fetchMock };
}

/** Valid order — no productIds keeps validateDeliveryDate out of product checks. */
const orderData = () => ({
  items: [{ name: 'Pâine cu maia 500g', quantity: 2, price: 12 }],
  total: 24,
  subtotal: 24,
  shippingCost: 0,
  deliveryMethod: 'personal' as const,
  deliveryDate: '2030-07-10T00:00:00.000Z',
  customerName: 'Test Ion',
  customerPhone: '0740123456',
  status: 'nou' as const,
});

function setSyncEnv() {
  process.env.SHEETS_WEBAPP_URL = WEBAPP_URL;
  process.env.SHEETS_WEBAPP_TOKEN = WEBAPP_TOKEN;
}

describe('orders sheet sync', () => {
  beforeAll(async () => {
    payload = await getPayload({ config: await config });
  });

  afterAll(async () => {
    await payload.destroy();
  });

  afterEach(async () => {
    for (const id of createdIds.splice(0)) {
      await payload.delete({ collection: 'orders', id }).catch(() => {});
    }
    vi.unstubAllGlobals();
    setSyncEnv();
  });

  it('persists sheetSyncStatus synced when the push succeeds', async () => {
    setSyncEnv();
    const { fetchMock } = stubFetch(() => jsonResponse({ ok: true }));

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBe('synced');
  });

  it('persists sheetSyncStatus failed when fetch rejects, order still created', async () => {
    setSyncEnv();
    stubFetch(() => {
      throw new Error('network down');
    });

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));

    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBe('failed');
  });

  it('persists sheetSyncStatus failed on a non-ok script response', async () => {
    setSyncEnv();
    stubFetch(() => jsonResponse({ ok: false, eroare: 'bad secret' }));

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));

    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBe('failed');
  });

  it('does not re-push on update (create-only guard)', async () => {
    setSyncEnv();
    const { fetchMock } = stubFetch(() => jsonResponse({ ok: true }));

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));
    expect(fetchMock).toHaveBeenCalledTimes(1);

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { status: 'confirmat' },
      depth: 0,
      context: { disableRevalidate: true },
    });

    expect(fetchMock).toHaveBeenCalledTimes(1);
    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBe('synced');
  });

  it('skips the push entirely when sync env vars are missing', async () => {
    delete process.env.SHEETS_WEBAPP_URL;
    delete process.env.SHEETS_WEBAPP_TOKEN;
    const { fetchMock } = stubFetch(() => jsonResponse({ ok: true }));

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));

    expect(fetchMock).not.toHaveBeenCalled();
    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBeNull();
  });
});

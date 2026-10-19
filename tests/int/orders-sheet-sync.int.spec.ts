import { getPayload, type Payload } from 'payload';
import { afterAll, afterEach, beforeAll, describe, expect, it, vi } from 'vitest';
import config from '@/payload.config';
import { jsonPage, stubFetch } from '../helpers/fetchStub';

/**
 * Issue #35 — sheetSyncStatus wiring on the real Payload harness.
 * The sheet-sync seam (pushOrderToSheet) talks to the web app via global
 * fetch, so stubbing fetch controls the sync outcome end to end.
 */

let payload: Payload;
const createdIds: number[] = [];

const WEBAPP_URL = 'https://script.google.com/macros/s/TEST_DEPLOYMENT/exec';
const WEBAPP_TOKEN = 'test-token';

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
    const { fetchMock } = stubFetch(() => jsonPage({ ok: true }));

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
    stubFetch(() => jsonPage({ ok: false, eroare: 'bad secret' }));

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

  it('does not re-push on update when the previous sync succeeded', async () => {
    setSyncEnv();
    const { fetchMock } = stubFetch(() => jsonPage({ ok: true }));

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
    const { fetchMock } = stubFetch(() => jsonPage({ ok: true }));

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

  it('retries the push on update when the previous sync failed', async () => {
    setSyncEnv();
    // First push fails — order lands as failed.
    stubFetch(() => jsonPage({ ok: false, eroare: 'bad secret' }));

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));

    // Admin re-save = the retry (issue #33 story 13).
    const { fetchMock, calls } = stubFetch(() => jsonPage({ ok: true }));

    const updated = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { status: 'confirmat' },
      depth: 0,
      context: { disableRevalidate: true },
    });
    expect(updated.status).toBe('confirmat');
    expect(fetchMock).toHaveBeenCalledTimes(1);

    // The retry pushes this same order (idComanda dedup on the workbook side).
    const body = JSON.parse(String(calls[0]?.init?.body));
    expect(body.idComanda).toBe(String(order.id));

    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBe('synced');
  });

  it('persists failed and still completes the update when a retried push fails again', async () => {
    setSyncEnv();
    stubFetch(() => jsonPage({ ok: false, eroare: 'still broken' }));

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));

    // Re-save: retry still fails — the update itself must not throw.
    const updated = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { status: 'confirmat' },
      depth: 0,
      context: { disableRevalidate: true },
    });
    expect(updated.status).toBe('confirmat');

    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBe('failed');
  });

  it('does not re-push on update when the order was never synced (null status)', async () => {
    // Create with env missing — no push, status stays null.
    delete process.env.SHEETS_WEBAPP_URL;
    delete process.env.SHEETS_WEBAPP_TOKEN;

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));

    // Re-save with sync configured: previous status is null, not failed — no retry.
    setSyncEnv();
    const { fetchMock } = stubFetch(() => jsonPage({ ok: true }));

    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { status: 'confirmat' },
      depth: 0,
      context: { disableRevalidate: true },
    });

    expect(fetchMock).not.toHaveBeenCalled();
    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBeNull();
  });

  it('skips the retry without a status write when sync env vars are missing', async () => {
    setSyncEnv();
    // First push fails — order lands as failed.
    stubFetch(() => jsonPage({ ok: false, eroare: 'bad secret' }));

    const order = await payload.create({
      collection: 'orders',
      data: orderData(),
      draft: false,
      depth: 0,
      context: { disableRevalidate: true },
    });
    createdIds.push(Number(order.id));

    // Re-save with env missing: retry skipped, no throw, status untouched.
    delete process.env.SHEETS_WEBAPP_URL;
    delete process.env.SHEETS_WEBAPP_TOKEN;
    const { fetchMock } = stubFetch(() => jsonPage({ ok: true }));

    const updated = await payload.update({
      collection: 'orders',
      id: order.id,
      data: { status: 'confirmat' },
      depth: 0,
      context: { disableRevalidate: true },
    });
    expect(updated.status).toBe('confirmat');

    expect(fetchMock).not.toHaveBeenCalled();
    const persisted = await payload.findByID({
      collection: 'orders',
      id: order.id,
      depth: 0,
    });
    expect(persisted.sheetSyncStatus).toBe('failed');
  });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

import type { GlsPoint } from '@/components/GlsPointPicker';

/**
 * glsPointStillExists contract (code review on #47): fail-open on fetch/HTTP
 * errors AND on a feed whose entries carry no identifiers (shape mismatch —
 * a valid cached point must not be permanently rejected); fetch the full
 * ro.json feed at most once per page session.
 */

const FEED_URL = 'https://map.gls-romania.com/data/deliveryPoints/ro.json';

const point = (overrides: Partial<GlsPoint> = {}): GlsPoint => ({
  matchcode: 'LOCKER-01',
  goldId: '12345',
  nume: 'Locker McGuire',
  adresa: 'Str. Ex 1, Cluj',
  tip: 'parcel-locker',
  ...overrides,
});

async function loadStillExists() {
  const mod = await import('@/components/GlsPointPicker');
  return mod.glsPointStillExists;
}

beforeEach(() => {
  vi.resetModules(); // drop the module-level feed cache between tests
  vi.restoreAllMocks();
});

describe('glsPointStillExists', () => {
  it('accepts a cached point present in the feed (matchcode)', async () => {
    const glsPointStillExists = await loadStillExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json([{ id: 'LOCKER-01' }, { id: 'OTHER' }]),
    );

    await expect(glsPointStillExists(point())).resolves.toBe(true);
  });

  it('accepts a cached point matched by goldId', async () => {
    const glsPointStillExists = await loadStillExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([{ id: 'X', goldId: '12345' }]));

    await expect(glsPointStillExists(point({ matchcode: 'RENAMED' }))).resolves.toBe(true);
  });

  it('rejects a removed point', async () => {
    const glsPointStillExists = await loadStillExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json([{ id: 'OTHER' }, { id: 'ANOTHER' }]),
    );

    await expect(glsPointStillExists(point())).resolves.toBe(false);
  });

  it('fails open on a non-ok response', async () => {
    const glsPointStillExists = await loadStillExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 500 }));

    await expect(glsPointStillExists(point())).resolves.toBe(true);
  });

  it('fails open on a network error and allows a later retry', async () => {
    const glsPointStillExists = await loadStillExists();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue(Response.json([{ id: 'LOCKER-01' }]));

    await expect(glsPointStillExists(point())).resolves.toBe(true);
    await expect(glsPointStillExists(point())).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });

  it('fails open on a malformed feed (non-array)', async () => {
    const glsPointStillExists = await loadStillExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));

    await expect(glsPointStillExists(point())).resolves.toBe(true);
  });

  it('fails open when feed entries carry no identifiers (shape mismatch)', async () => {
    const glsPointStillExists = await loadStillExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([{}, {}, {}]));

    await expect(glsPointStillExists(point())).resolves.toBe(true);
  });

  it('fetches the feed once per page session (cached across calls)', async () => {
    const glsPointStillExists = await loadStillExists();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json([{ id: 'LOCKER-01' }]));

    await expect(glsPointStillExists(point())).resolves.toBe(true);
    await expect(glsPointStillExists(point({ matchcode: 'OTHER' }))).resolves.toBe(false);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(FEED_URL);
  });
});

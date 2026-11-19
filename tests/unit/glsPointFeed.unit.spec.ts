import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

/**
 * glsPointExistsInFeed contract (server-side port of the old client check,
 * follow-up to #47): fail-open on fetch/HTTP errors AND on a feed whose
 * entries carry no identifiers (shape mismatch — a valid cached point must
 * not be permanently rejected); fetch ro.json at most once per TTL window.
 */

const FEED_URL = 'https://map.gls-romania.com/data/deliveryPoints/ro.json';

const MATCHCODE = 'LOCKER-01';
const GOLD_ID = '12345';

async function loadExists() {
  const mod = await import('@/utilities/glsPointFeed');
  return mod.glsPointExistsInFeed;
}

beforeEach(() => {
  vi.resetModules(); // drop the module-level feed memo between tests
  vi.restoreAllMocks();
});

afterEach(() => {
  vi.useRealTimers();
});

describe('glsPointExistsInFeed', () => {
  it('accepts a point present in the feed (matchcode)', async () => {
    const glsPointExistsInFeed = await loadExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json([{ id: 'LOCKER-01' }, { id: 'OTHER' }]),
    );

    await expect(glsPointExistsInFeed(MATCHCODE, GOLD_ID)).resolves.toBe(true);
  });

  it('accepts a point matched by goldId alone', async () => {
    const glsPointExistsInFeed = await loadExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([{ id: 'X', goldId: '12345' }]));

    await expect(glsPointExistsInFeed('RENAMED', GOLD_ID)).resolves.toBe(true);
  });

  it('rejects a removed point', async () => {
    const glsPointExistsInFeed = await loadExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json([{ id: 'OTHER' }, { id: 'ANOTHER' }]),
    );

    await expect(glsPointExistsInFeed(MATCHCODE, GOLD_ID)).resolves.toBe(false);
  });

  it('fails open on a non-ok response', async () => {
    const glsPointExistsInFeed = await loadExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(new Response('err', { status: 500 }));

    await expect(glsPointExistsInFeed(MATCHCODE, GOLD_ID)).resolves.toBe(true);
  });

  it('fails open on a network error', async () => {
    const glsPointExistsInFeed = await loadExists();
    vi.spyOn(globalThis, 'fetch').mockRejectedValue(new Error('offline'));

    await expect(glsPointExistsInFeed(MATCHCODE, GOLD_ID)).resolves.toBe(true);
  });

  it('fails open on a malformed feed (non-array)', async () => {
    const glsPointExistsInFeed = await loadExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));

    await expect(glsPointExistsInFeed(MATCHCODE, GOLD_ID)).resolves.toBe(true);
  });

  it('fails open when feed entries carry no identifiers (shape mismatch)', async () => {
    const glsPointExistsInFeed = await loadExists();
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json([{}, {}, {}]));

    await expect(glsPointExistsInFeed(MATCHCODE, GOLD_ID)).resolves.toBe(true);
  });

  it('accepts without fetching when the point has no identifiers at all', async () => {
    const glsPointExistsInFeed = await loadExists();
    const fetchSpy = vi.spyOn(globalThis, 'fetch');

    await expect(glsPointExistsInFeed('', null)).resolves.toBe(true);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('fetches the feed once per TTL window, then refetches', async () => {
    const glsPointExistsInFeed = await loadExists();
    vi.useFakeTimers();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(Response.json([{ id: 'LOCKER-01' }]));

    await expect(glsPointExistsInFeed(MATCHCODE, null)).resolves.toBe(true);
    await expect(glsPointExistsInFeed('OTHER', null)).resolves.toBe(false); // memo hit
    expect(fetchSpy).toHaveBeenCalledTimes(1);
    expect(fetchSpy.mock.calls[0]?.[0]).toBe(FEED_URL);

    vi.advanceTimersByTime(15 * 60_000 + 1); // TTL expired
    await expect(glsPointExistsInFeed(MATCHCODE, null)).resolves.toBe(true);
    expect(fetchSpy).toHaveBeenCalledTimes(2);
  });
});

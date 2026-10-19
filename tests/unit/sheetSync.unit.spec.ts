import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { pushOrderToSheet, type SheetSyncOrder } from '@/utilities/sheetSync';

const WEBAPP_URL = 'https://script.google.com/macros/s/DEPLOYMENT_ID/exec';
const WEBAPP_TOKEN = '28201bfadbae4bffa3aa29950c4bb1d2';

/** Realistic created order (the doc shape the afterChange hook will pass). */
interface OrderFixture extends SheetSyncOrder {
  subtotal: number;
  shippingCost: number;
  status: string;
}

const ORDER: OrderFixture = {
  id: 123,
  items: [
    { productId: 'p1', name: 'Pâine cu maia 500g', quantity: 2, price: 12 },
    { productId: 'p2', name: 'Croissant cu unt', quantity: 3, price: 8 },
  ],
  total: 48,
  subtotal: 40,
  deliveryMethod: 'curier',
  shippingCost: 8,
  deliveryDate: '2026-07-20T21:00:00.000Z',
  customerName: 'Ion Popescu',
  customerPhone: '0740123456',
  judet: 'Brașov',
  localitate: 'Făgăraș',
  streetAddress: 'Str. Victoriei 10',
  addressDetails: 'etaj 2, ap 5',
  status: 'nou',
};

/** Stubbed global fetch: records every call, answers from a script. */
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

/** Minimal Response stand-in — keeps tests off any concrete fetch impl. */
interface ResponseLike {
  ok: boolean;
  status: number;
  headers: { get(name: string): string | null };
  json(): Promise<unknown>;
}

function jsonPage(body: unknown, status = 200): ResponseLike {
  return {
    ok: status >= 200 && status < 300,
    status,
    headers: { get: () => null },
    json: () => Promise.resolve(body),
  };
}

function redirectPage(location: string, status = 302): ResponseLike {
  return {
    ok: false,
    status,
    headers: { get: (name: string) => (name.toLowerCase() === 'location' ? location : null) },
    json: () => Promise.reject(new Error('no body on redirect')),
  };
}

const ECHO_URL = 'https://n-xxxxxx-script.googleusercontent.com/echo?user_content_key=abc';

afterEach(() => {
  vi.unstubAllEnvs();
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

describe('pushOrderToSheet — wire contract', () => {
  beforeEach(() => {
    vi.stubEnv('SHEETS_WEBAPP_URL', WEBAPP_URL);
    vi.stubEnv('SHEETS_WEBAPP_TOKEN', WEBAPP_TOKEN);
  });

  it('sends the exact contract the workbook script expects (curier order)', async () => {
    const { calls } = stubFetch((url) =>
      url === WEBAPP_URL ? redirectPage(ECHO_URL) : jsonPage({ ok: true }),
    );

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome).toEqual({ status: 'synced' });

    // POST: manual redirect, JSON body
    const [post, get] = calls;
    expect(calls).toHaveLength(2);
    expect(post.url).toBe(WEBAPP_URL);
    expect(post.init?.method).toBe('POST');
    expect(post.init?.redirect).toBe('manual');
    expect((post.init?.headers as Record<string, string>)['Content-Type']).toBe('application/json');

    // Field-by-field wire contract (dataLivrare: UTC 07-20 21:00 = Bucharest 07-21 00:00)
    expect(JSON.parse(String(post.init?.body))).toEqual({
      secret: WEBAPP_TOKEN,
      idComanda: '123',
      nume: 'Ion Popescu',
      telefon: '0740123456',
      dataLivrare: '2026-07-21',
      metoda: 'cargus',
      adresa: 'Str. Victoriei 10',
      localitate: 'Făgăraș',
      judet: 'Brașov',
      detalii: 'etaj 2, ap 5',
      total: 48,
      produse: [
        { denumire: 'Pâine cu maia 500g', cantitate: 2 },
        { denumire: 'Croissant cu unt', cantitate: 3 },
      ],
    });

    // GET: the Location echo URL carries the script's JSON result
    expect(get.url).toBe(ECHO_URL);
    expect(get.init?.method).toBe('GET');
  });

  it("maps deliveryMethod 'personal' to metoda 'personala'", async () => {
    const { calls } = stubFetch(() => redirectPage(ECHO_URL));

    await pushOrderToSheet({ ...ORDER, deliveryMethod: 'personal' });

    expect(JSON.parse(String(calls[0]?.init?.body)).metoda).toBe('personala');
  });

  it('renders dataLivrare in Europe/Bucharest also across the winter offset', async () => {
    const { calls } = stubFetch(() => redirectPage(ECHO_URL));

    // UTC 2026-01-14 22:00 = Bucharest 2026-01-15 00:00 (EET, UTC+2)
    await pushOrderToSheet({ ...ORDER, deliveryDate: '2026-01-14T22:00:00.000Z' });

    expect(JSON.parse(String(calls[0]?.init?.body)).dataLivrare).toBe('2026-01-15');
  });
});

describe('pushOrderToSheet — outcomes', () => {
  beforeEach(() => {
    vi.stubEnv('SHEETS_WEBAPP_URL', WEBAPP_URL);
    vi.stubEnv('SHEETS_WEBAPP_TOKEN', WEBAPP_TOKEN);
  });

  it('succeeds on a direct 200 {ok:true} response (no redirect)', async () => {
    stubFetch((url) => (url === WEBAPP_URL ? jsonPage({ ok: true }) : jsonPage({ ok: true })));

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome).toEqual({ status: 'synced' });
  });

  it("fails with the script's eroare on {ok:false}", async () => {
    stubFetch((url) =>
      url === WEBAPP_URL
        ? redirectPage(ECHO_URL)
        : jsonPage({ ok: false, eroare: 'secret invalid' }),
    );

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome).toEqual({
      status: 'failed',
      reason: expect.stringContaining('secret invalid'),
    });
  });

  it('fails (no throw) when fetch rejects on the network', async () => {
    stubFetch(() => {
      throw new Error('fetch failed');
    });

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome).toEqual({ status: 'failed', reason: expect.stringContaining('fetch failed') });
  });

  it('fails on a non-ok response (e.g. Google login wall)', async () => {
    stubFetch(() => jsonPage({ ok: true }, 403));

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome).toEqual({ status: 'failed', reason: expect.stringContaining('403') });
  });

  it('fails when the redirect carries no Location header', async () => {
    stubFetch(() => ({
      ok: false,
      status: 302,
      headers: { get: () => null },
      json: () => Promise.reject(new Error('no body')),
    }));

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome).toEqual({
      status: 'failed',
      reason: expect.stringContaining('Location'),
    });
  });
});

describe('pushOrderToSheet — environment', () => {
  it('skips (no fetch, no throw) when both env vars are missing or empty', async () => {
    vi.stubEnv('SHEETS_WEBAPP_URL', '');
    vi.stubEnv('SHEETS_WEBAPP_TOKEN', '');
    const { calls } = stubFetch(() => jsonPage({ ok: true }));

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome).toEqual({ status: 'skipped', reason: expect.stringContaining('SHEETS') });
    expect(calls).toHaveLength(0);
  });

  it('skips when only the URL is set', async () => {
    vi.stubEnv('SHEETS_WEBAPP_URL', WEBAPP_URL);
    vi.stubEnv('SHEETS_WEBAPP_TOKEN', '');
    const { calls } = stubFetch(() => jsonPage({ ok: true }));

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome.status).toBe('skipped');
    expect(calls).toHaveLength(0);
  });

  it('skips when only the token is set', async () => {
    vi.stubEnv('SHEETS_WEBAPP_URL', '');
    vi.stubEnv('SHEETS_WEBAPP_TOKEN', WEBAPP_TOKEN);
    const { calls } = stubFetch(() => jsonPage({ ok: true }));

    const outcome = await pushOrderToSheet(ORDER);

    expect(outcome.status).toBe('skipped');
    expect(calls).toHaveLength(0);
  });
});

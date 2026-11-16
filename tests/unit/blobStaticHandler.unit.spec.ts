import { describe, expect, it, vi } from 'vitest';

import { createBlobStaticHandler } from '@/utilities/blobStaticHandler';

const TOKEN = 'vercel_blob_rw_STOREID123_secret';
const PROD_ENV = { VERCEL_ENV: 'production', BLOB_READ_WRITE_TOKEN: TOKEN };
const BLOB_BASE = 'https://storeid123.public.blob.vercel-storage.com';

function makeReq(headers: Record<string, string> = {}) {
  return {
    headers: new Headers(headers),
    payload: { logger: { warn: vi.fn() } },
  } as never;
}

function args(filename: string, prefix?: string) {
  return {
    doc: { id: 1 },
    headers: new Headers({ 'access-control-allow-origin': '*' }),
    params: { collection: 'media', filename, prefix },
  } as never;
}

function blobOk(body = 'img', headers: Record<string, string> = {}) {
  return new Response(body, {
    status: 200,
    headers: {
      'content-type': 'image/jpeg',
      'content-length': String(body.length),
      etag: '"abc"',
      'x-vercel-cache': 'HIT',
      ...headers,
    },
  });
}

describe('blobStaticHandler', () => {
  it('fetches the public blob URL without head() or cache-busting query', async () => {
    const fetchImpl = vi.fn().mockResolvedValue(blobOk());
    const handler = createBlobStaticHandler({ env: PROD_ENV, fetchImpl });

    const res = (await handler(makeReq(), args('my file.jpg'))) as Response;

    expect(fetchImpl).toHaveBeenCalledTimes(1);
    expect(fetchImpl.mock.calls[0][0]).toBe(`${BLOB_BASE}/my%20file.jpg`);
    expect(res.status).toBe(200);
    expect(await res.text()).toBe('img');
  });

  it('passes through blob metadata, keeps base headers, sets 1y cache-control', async () => {
    const handler = createBlobStaticHandler({
      env: PROD_ENV,
      fetchImpl: vi.fn().mockResolvedValue(blobOk()),
    });

    const res = (await handler(makeReq(), args('a.jpg'))) as Response;

    expect(res.headers.get('content-type')).toBe('image/jpeg');
    expect(res.headers.get('content-length')).toBe('3');
    expect(res.headers.get('etag')).toBe('"abc"');
    expect(res.headers.get('cache-control')).toBe('public, max-age=31536000');
    expect(res.headers.get('access-control-allow-origin')).toBe('*');
    expect(res.headers.get('x-vercel-cache')).toBeNull();
  });

  it('adds a script-blocking CSP for SVGs', async () => {
    const handler = createBlobStaticHandler({
      env: PROD_ENV,
      fetchImpl: vi.fn().mockResolvedValue(blobOk('<svg/>', { 'content-type': 'image/svg+xml' })),
    });

    const res = (await handler(makeReq(), args('logo.svg'))) as Response;

    expect(res.headers.get('content-security-policy')).toBe("script-src 'none'");
  });

  it('forwards If-None-Match and returns 304 when the blob is unchanged', async () => {
    const fetchImpl = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 304, headers: { etag: '"abc"' } }));
    const handler = createBlobStaticHandler({ env: PROD_ENV, fetchImpl });

    const res = (await handler(makeReq({ 'if-none-match': '"abc"' }), args('a.jpg'))) as Response;

    expect(new Headers(fetchImpl.mock.calls[0][1].headers).get('if-none-match')).toBe('"abc"');
    expect(res.status).toBe(304);
  });

  it('falls through to the plugin handler when the blob is missing', async () => {
    const handler = createBlobStaticHandler({
      env: PROD_ENV,
      fetchImpl: vi.fn().mockResolvedValue(new Response('nope', { status: 404 })),
    });

    expect(await handler(makeReq(), args('gone.jpg'))).toBeUndefined();
  });

  it('falls through when fetch throws', async () => {
    const handler = createBlobStaticHandler({
      env: PROD_ENV,
      fetchImpl: vi.fn().mockRejectedValue(new Error('network')),
    });

    expect(await handler(makeReq(), args('a.jpg'))).toBeUndefined();
  });

  it('falls through for range requests without fetching', async () => {
    const fetchImpl = vi.fn();
    const handler = createBlobStaticHandler({ env: PROD_ENV, fetchImpl });

    expect(await handler(makeReq({ range: 'bytes=0-10' }), args('a.jpg'))).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('falls through for path-like filenames or traversal prefixes', async () => {
    const fetchImpl = vi.fn();
    const handler = createBlobStaticHandler({ env: PROD_ENV, fetchImpl });

    expect(await handler(makeReq(), args('../secret.jpg'))).toBeUndefined();
    expect(await handler(makeReq(), args('a.jpg', '../x'))).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('is inactive outside production/preview (dev uses local staticDir)', async () => {
    const fetchImpl = vi.fn();
    const handler = createBlobStaticHandler({
      env: { BLOB_READ_WRITE_TOKEN: TOKEN },
      fetchImpl,
    });

    expect(await handler(makeReq(), args('a.jpg'))).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });

  it('falls through when the token is missing or malformed', async () => {
    const fetchImpl = vi.fn();
    const handler = createBlobStaticHandler({
      env: { VERCEL_ENV: 'production', BLOB_READ_WRITE_TOKEN: 'bad' },
      fetchImpl,
    });

    expect(await handler(makeReq(), args('a.jpg'))).toBeUndefined();
    expect(fetchImpl).not.toHaveBeenCalled();
  });
});

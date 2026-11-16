import type { CollectionConfig } from 'payload';

import { isBlobStorageEnabled } from '@/utilities/blobStorage';
import { buildBlobFileUrl, getBlobBaseUrl } from '@/utilities/blobUrl';

/**
 * Lean `/api/media/file/*` handler that keeps media URLs on our own domain
 * while cutting Vercel Blob "simple operations".
 *
 * The storage plugin's own staticHandler (`storage-vercel-blob/dist/getFile.js`)
 * does, on every Vercel CDN miss:
 *   1. `head(fileUrl)` — 1 simple op, uncacheable, only for content-type/size/ETag;
 *   2. `fetch(fileUrl?<uploadedAt>)` with `no-store` — bypasses the Blob CDN
 *      cache, so effectively another op.
 * That pushed the Hobby quota (10k/month, hard block at 100%) to 75%.
 *
 * This handler skips `head()` and fetches the public blob URL plainly, so it
 * is served from the Blob CDN cache: 0 ops on a hit, 1 on a miss. Metadata
 * (content-type, length, ETag) is passed through from the blob response.
 *
 * Registered in Media's `upload.handlers`, which Payload runs BEFORE the
 * plugin's staticHandler. Returning `undefined` falls through to the plugin
 * handler — used for range requests, misconfiguration and any fetch failure,
 * so behaviour degrades to the old path rather than breaking images.
 * Blob 404s are answered directly: on this store a GET miss is definitive
 * (media read access is `anyone`), and falling through would only re-check
 * the same blob via the plugin's head() — one more op per miss.
 * Payload's collection `read` access check still runs before handlers.
 */

/** Matches the plugin's default `cacheControlMaxAge` (1 year). */
const CACHE_CONTROL = 'public, max-age=31536000';

/** Blob response headers worth forwarding to the client. */
const PASSTHROUGH_HEADERS = [
  'content-type',
  'content-length',
  'content-disposition',
  'etag',
  'last-modified',
] as const;

type UploadHandler = NonNullable<Extract<CollectionConfig['upload'], object>['handlers']>[number];

type HandlerDeps = {
  env?: {
    VERCEL_ENV?: string;
    BLOB_READ_WRITE_TOKEN?: string;
    STORAGE_VERCEL_BLOB_BASE_URL?: string;
  };
  fetchImpl?: typeof fetch;
};

export function createBlobStaticHandler({
  env = process.env,
  fetchImpl = fetch,
}: HandlerDeps = {}): UploadHandler {
  // Cast: Payload's type is `Promise<Response> | Promise<void>`, which a single
  // async fn returning `Response | undefined` can't satisfy; at runtime Payload
  // just checks for a returned Response and otherwise runs the next handler.
  return (async (req, { headers: baseHeaders, params: { filename, prefix } }) => {
    if (!isBlobStorageEnabled(env)) return; // dev: local staticDir serving

    const baseUrl = getBlobBaseUrl(env);
    if (!baseUrl) return;

    // Range requests are rare for images; the plugin handles them correctly.
    if (req.headers.get('range')) return;

    // Store keys are flat; leave anything path-like to the plugin's sanitizer.
    if (/[/\\]/.test(filename) || prefix?.split('/').includes('..')) return;

    const requestHeaders = new Headers();
    const ifNoneMatch = req.headers.get('if-none-match');
    if (ifNoneMatch) requestHeaders.set('if-none-match', ifNoneMatch);

    let blobResponse: Response;
    try {
      blobResponse = await fetchImpl(buildBlobFileUrl(baseUrl, filename, prefix), {
        headers: requestHeaders,
      });
    } catch (err) {
      req.payload.logger.warn({ err, msg: 'blobStaticHandler: fetch failed, falling back' });
      return;
    }

    // Blob 404 is definitive (public store, no per-doc access check) — the
    // plugin fallback would just head() the same missing blob and 404 again,
    // burning another simple op per miss.
    if (blobResponse.status === 404) {
      return new Response(null, { status: 404, headers: { 'cache-control': 'no-store' } });
    }

    if (blobResponse.status !== 304 && (!blobResponse.ok || !blobResponse.body)) {
      return; // let the plugin produce its own error response
    }

    const headers = new Headers(baseHeaders);
    for (const name of PASSTHROUGH_HEADERS) {
      const value = blobResponse.headers.get(name);
      if (value) headers.set(name, value);
    }
    headers.set('cache-control', CACHE_CONTROL);
    if (headers.get('content-type')?.startsWith('image/svg+xml')) {
      headers.set('content-security-policy', "script-src 'none'");
    }

    if (blobResponse.status === 304) {
      return new Response(null, { headers, status: 304 });
    }
    return new Response(blobResponse.body, { headers, status: 200 });
  }) as UploadHandler;
}

export const blobStaticHandler = createBlobStaticHandler();

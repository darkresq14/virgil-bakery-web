/**
 * Whether the Vercel Blob storage plugin should be active.
 *
 * Enabled in production AND on Vercel preview. In production it is the
 * read/write store. On preview it is effectively read-only: Media
 * `create`/`update`/`delete` are denied by `authenticatedExceptPreview`, so
 * the `BLOB_READ_WRITE_TOKEN` set at Preview scope is only used to generate
 * blob URLs (and the read-only staticHandler proxy) — never to upload or
 * delete production imagery. Preview needs the plugin enabled because the
 * replayed production Media rows carry only `filename`; the blob URL is
 * virtual (computed at read via the plugin's `generateURL`), and without the
 * plugin Payload falls back to the local `/api/media/file/` route, which 500s
 * on serverless (no persistent FS). Dev uploads still write to the local
 * `public/media` directory (ADR 0004).
 *
 * Per ADR 0004/0006, the gate is the deploy environment alone — token
 * presence is intentionally NOT part of it.
 */
export function isBlobStorageEnabled(env: { VERCEL_ENV?: string } = process.env): boolean {
  return env.VERCEL_ENV === 'production';
}

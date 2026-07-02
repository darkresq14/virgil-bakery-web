/**
 * Whether the Vercel Blob storage plugin should be active.
 *
 * Blob storage is a production-only concern: dev media uploads write to the
 * local `public/media` directory so they can never reach (or delete from)
 * the production blob store. Per ADR 0004, the gate is the deploy environment
 * alone — token presence is intentionally NOT part of it.
 */
export function isBlobStorageEnabled(env: { VERCEL_ENV?: string } = process.env): boolean {
  return env.VERCEL_ENV === 'production'
}

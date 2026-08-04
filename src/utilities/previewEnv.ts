/**
 * Whether the current deploy is a Vercel Preview Deployment.
 *
 * Vercel sets `VERCEL_ENV` to `'preview'` on preview builds and `'production'`
 * on prod builds; it is unset in local development (see `environment.d.ts`).
 * Used to make Media write operations read-only on preview so test uploads
 * cannot pollute the preview database — the blob plugin is production-gated
 * and Media's local upload directory only exists in dev, so uploads would have
 * nowhere to land. Per ADR 0006, `read` stays public so the frontend renders
 * the restored production blob URLs.
 */
export function isPreviewDeployment(env: { VERCEL_ENV?: string } = process.env): boolean {
  return env.VERCEL_ENV === 'preview';
}

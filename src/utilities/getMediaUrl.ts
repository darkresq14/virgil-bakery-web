/**
 * Returns the media URL to use as an image/file source.
 *
 * URLs are kept stable — no cache-buster query. A `?<updatedAt>` suffix was
 * corrupting the Vercel image-optimizer request and churning cache keys, so
 * media URLs never cached (see #23). Cache invalidation on edit is handled
 * separately, not via the URL.
 *
 * Local paths (e.g. `/api/media/file/image.webp`) are returned as-is so the
 * image optimizer treats them as local rather than fetching through
 * `remotePatterns`.
 */
export const getMediaUrl = (url: string | null | undefined): string => {
  if (!url) return '';
  return url;
};

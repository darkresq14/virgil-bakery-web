/**
 * Build public Vercel Blob URLs for Media files.
 *
 * Used by `blobStaticHandler` to fetch files straight from the Blob CDN
 * (no `head()` call) while public media URLs stay on our own
 * `/api/media/file/<filename>` route.
 *
 * The store id is parsed from the read/write token with the same regex the
 * plugin itself uses (`storage-vercel-blob/dist/index.js`).
 * `STORAGE_VERCEL_BLOB_BASE_URL` is honoured for emulator parity, exactly
 * like the plugin's own baseUrl resolution. Keys in this store are flat (no
 * collection/doc prefix) — prefix support is kept for safety in case folder
 * prefixes are ever introduced.
 */

const STORE_ID_FROM_TOKEN = /^vercel_blob_rw_([a-z\d]+)_[a-z\d]+$/i;

type BlobEnv = {
  BLOB_READ_WRITE_TOKEN?: string;
  STORAGE_VERCEL_BLOB_BASE_URL?: string;
};

export function getBlobBaseUrl(env: BlobEnv = process.env): string | null {
  if (env.STORAGE_VERCEL_BLOB_BASE_URL) return env.STORAGE_VERCEL_BLOB_BASE_URL;

  const storeId = env.BLOB_READ_WRITE_TOKEN?.match(STORE_ID_FROM_TOKEN)?.[1]?.toLowerCase();
  return storeId ? `https://${storeId}.public.blob.vercel-storage.com` : null;
}

export function buildBlobFileUrl(baseUrl: string, filename: string, prefix?: string): string {
  const fileKey = prefix ? `${prefix}/${filename}` : filename;
  const slash = fileKey.lastIndexOf('/');
  // Encode only the basename; keep directory segments verbatim — same
  // behaviour as the plugin's own generateURL (dirname + encoded basename).
  const dir = slash >= 0 ? fileKey.slice(0, slash) : '';
  const basename = slash >= 0 ? fileKey.slice(slash + 1) : fileKey;
  const encodedKey = dir ? `${dir}/${encodeURIComponent(basename)}` : encodeURIComponent(basename);
  return `${baseUrl}/${encodedKey}`;
}

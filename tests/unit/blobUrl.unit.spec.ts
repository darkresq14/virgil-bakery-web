import { describe, expect, it } from 'vitest';

import { buildBlobFileUrl, getBlobBaseUrl } from '@/utilities/blobUrl';

describe('getBlobBaseUrl', () => {
  it('derives the public base URL from the store id inside the read-write token', () => {
    expect(getBlobBaseUrl({ BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_STOREID123_secret' })).toBe(
      'https://storeid123.public.blob.vercel-storage.com',
    );
  });

  it('honours STORAGE_VERCEL_BLOB_BASE_URL for emulator parity, like the plugin', () => {
    expect(
      getBlobBaseUrl({
        BLOB_READ_WRITE_TOKEN: 'vercel_blob_rw_STOREID123_secret',
        STORAGE_VERCEL_BLOB_BASE_URL: 'http://localhost:9553',
      }),
    ).toBe('http://localhost:9553');
  });

  it('returns null when the token is missing or malformed', () => {
    expect(getBlobBaseUrl({})).toBeNull();
    expect(getBlobBaseUrl({ BLOB_READ_WRITE_TOKEN: 'not-a-blob-token' })).toBeNull();
  });
});

describe('buildBlobFileUrl', () => {
  const base = 'https://storeid123.public.blob.vercel-storage.com';

  it('builds a flat URL for a plain filename (no prefix)', () => {
    expect(buildBlobFileUrl(base, 'poza-14.jpg')).toBe(`${base}/poza-14.jpg`);
  });

  it('percent-encodes spaces and special characters in the filename', () => {
    expect(buildBlobFileUrl(base, 'my file (1).jpg')).toBe(`${base}/my%20file%20(1).jpg`);
  });

  it('encodes diacritics the way the plugin generator does', () => {
    expect(buildBlobFileUrl(base, 'pâine.jpg')).toBe(`${base}/p%C3%A2ine.jpg`);
  });

  it('joins a doc prefix without encoding the slash separators', () => {
    expect(buildBlobFileUrl(base, 'my file.jpg', 'folder/sub')).toBe(
      `${base}/folder/sub/my%20file.jpg`,
    );
  });

  it('keeps safe filenames unchanged', () => {
    expect(buildBlobFileUrl(base, 'PXL_20260319_121417485.PORTRAIT-1-640x480.jpg')).toBe(
      `${base}/PXL_20260319_121417485.PORTRAIT-1-640x480.jpg`,
    );
  });
});

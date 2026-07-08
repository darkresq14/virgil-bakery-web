import { describe, expect, it } from 'vitest';

import { getMediaUrl } from '@/utilities/getMediaUrl';

describe('getMediaUrl', () => {
  it('returns a local media path unchanged (stable URL, no cache-buster query)', () => {
    // A `?<updatedAt>` cache-buster on every media URL was corrupting the
    // Vercel image-optimizer request and churning cache keys. Media URLs must
    // be stable so the optimizer/edge cache can reuse them. See #23.
    expect(getMediaUrl('/api/media/file/loaf.jpg')).toBe('/api/media/file/loaf.jpg');
  });

  it('returns an absolute Blob URL unchanged', () => {
    expect(getMediaUrl('https://store.public.blob.vercel-storage.com/media/loaf-640x480.jpg')).toBe(
      'https://store.public.blob.vercel-storage.com/media/loaf-640x480.jpg',
    );
  });

  it('returns an empty string for empty, null, or undefined URLs', () => {
    expect(getMediaUrl('')).toBe('');
    expect(getMediaUrl(null)).toBe('');
    expect(getMediaUrl(undefined)).toBe('');
  });
});

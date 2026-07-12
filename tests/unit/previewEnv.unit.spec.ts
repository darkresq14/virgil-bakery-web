import { describe, expect, it } from 'vitest';

import { isPreviewDeployment } from '@/utilities/previewEnv';

describe('isPreviewDeployment', () => {
  it('is true on Vercel preview deployments, where VERCEL_ENV is preview', () => {
    expect(isPreviewDeployment({ VERCEL_ENV: 'preview' })).toBe(true);
  });

  it('is false in production, where VERCEL_ENV is production', () => {
    expect(isPreviewDeployment({ VERCEL_ENV: 'production' })).toBe(false);
  });

  it('is false in local development, where VERCEL_ENV is unset', () => {
    expect(isPreviewDeployment({})).toBe(false);
  });
});

import { describe, expect, it } from 'vitest'

import { isBlobStorageEnabled } from '@/utilities/blobStorage'

describe('isBlobStorageEnabled', () => {
  it('is enabled when VERCEL_ENV is production', () => {
    expect(isBlobStorageEnabled({ VERCEL_ENV: 'production' })).toBe(true)
  })

  it('is disabled in local development, where VERCEL_ENV is unset', () => {
    expect(isBlobStorageEnabled({})).toBe(false)
  })

  it('is disabled on Vercel preview deployments', () => {
    expect(isBlobStorageEnabled({ VERCEL_ENV: 'preview' })).toBe(false)
  })
})

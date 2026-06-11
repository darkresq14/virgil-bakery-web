const CONSENT_COOKIE_NAME = 'virgil_cookie_consent'
const CONSENT_COOKIE_MAX_AGE = 6 * 30 * 24 * 60 * 60 // 6 months in seconds

export type ConsentValue = 'accepted' | 'rejected'

// ---------------------------------------------------------------------------
// Consent cookie helpers
// ---------------------------------------------------------------------------

export function getConsentCookie(): ConsentValue | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(new RegExp(`(?:^|;\\s*)${CONSENT_COOKIE_NAME}=([^;]*)`))
  if (!match) return null
  const value = match[1]
  if (value === 'accepted' || value === 'rejected') return value
  return null
}

export function setConsentCookie(value: ConsentValue): void {
  if (typeof document === 'undefined') return
  // biome-ignore lint/suspicious/noDocumentCookie: Consent cookie requires document.cookie — Cookie Store API is not widely supported
  document.cookie = [
    `${CONSENT_COOKIE_NAME}=${value}`,
    `max-age=${CONSENT_COOKIE_MAX_AGE}`,
    'path=/',
    'SameSite=Lax',
  ].join('; ')
}

// ---------------------------------------------------------------------------
// Google Consent Mode v2
// ---------------------------------------------------------------------------

declare global {
  interface Window {
    gtag?: (...args: unknown[]) => void
  }
}

export function updateGtagConsent(granted: boolean): void {
  if (typeof window === 'undefined' || typeof window.gtag !== 'function') return
  window.gtag('consent', 'update', {
    analytics_storage: granted ? 'granted' : 'denied',
  })
}

// ---------------------------------------------------------------------------
// Banner trigger (cross-component communication)
// ---------------------------------------------------------------------------

let _showBanner: (() => void) | null = null

/**
 * Called by the CookieConsent banner on mount to register its show callback.
 * Returns an unregister function for cleanup.
 */
export function onBannerRequest(fn: () => void): () => void {
  _showBanner = fn
  return () => {
    _showBanner = null
  }
}

/**
 * Called by CookieSettingsButton in the footer to reopen the banner.
 */
export function requestConsentBanner(): void {
  _showBanner?.()
}

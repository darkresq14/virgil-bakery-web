'use client'

import { requestConsentBanner } from './consent'

export function CookieSettingsButton() {
  return (
    <button
      type="button"
      onClick={requestConsentBanner}
      className="text-sm text-background/70 hover:text-background transition-colors font-sans  cursor-pointer text-left"
    >
      Setări Cookies
    </button>
  )
}

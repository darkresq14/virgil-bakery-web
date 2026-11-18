/**
 * Single source of truth for the bakery's WhatsApp links.
 *
 * The canonical number lives in the `siteConfig` global (`whatsappNumber`,
 * editable in the Payload admin). This helper only holds the fallback used
 * when that global is unavailable — keep it in sync with the `defaultValue`
 * in `src/SiteConfig/config.ts`.
 */
export const WHATSAPP_NUMBER_FALLBACK = '+40746245391';

/** Builds a wa.me link from a possibly formatted phone number (e.g. "+40 746 245 391"). */
export function whatsappLink(number?: string | null): string {
  const digits = (number || WHATSAPP_NUMBER_FALLBACK).replace(/[^0-9]/g, '');
  return `https://wa.me/${digits}`;
}

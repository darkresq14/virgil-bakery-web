/**
 * Single source of truth for the bakery's WhatsApp number and links.
 *
 * The canonical, editable value lives in the `siteConfig` global
 * (`whatsappNumber`, admin-editable). `WHATSAPP_NUMBER_FALLBACK` is the
 * number's only hardcoded occurrence — the `defaultValue`s in
 * `src/SiteConfig/config.ts` import it from here, and `whatsappLink` falls
 * back to it when the global is unavailable.
 */
export const WHATSAPP_NUMBER_FALLBACK = '+40746245391';

const FALLBACK_DIGITS = WHATSAPP_NUMBER_FALLBACK.replace(/[^0-9]/g, '');

/** Builds a wa.me link from a possibly formatted phone number (e.g. "+40 746 245 391").
 * A configured number that strips down to no digits at all (e.g. "n/a") also
 * falls back — the link must never degenerate into a bare wa.me root. */
export function whatsappLink(number?: string | null): string {
  const digits = (number ?? '').replace(/[^0-9]/g, '');
  return `https://wa.me/${digits || FALLBACK_DIGITS}`;
}

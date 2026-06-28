/**
 * Canonical default SEO copy for the site.
 *
 * Single source of truth for the homepage's fallback title/description (used
 * when the Homepage global's SEO tab is empty) and the last-resort fallback for
 * any route that doesn't define its own meta. Keeping it here prevents the
 * strings from drifting between the root layout, the OpenGraph defaults, and the
 * `generateMeta` utility.
 */

/**
 * Brand name. The single source of truth — every SEO surface (title suffix,
 * schema publisher/brand, fallback title) should import this instead of
 * re-typing the string, which drifts and causes duplicated-brand title bugs.
 */
export const BRAND_NAME = 'Pâine cu Maia by Virgil';

export const SITE_TITLE = `${BRAND_NAME} — Pâine Artizanală cu Maia Naturală`;

export const SITE_DESCRIPTION =
  'Pâine artizanală cu maia naturală, fermentată lent și coaptă pe vatră. Comandă online cu livrare în Sibiu și în toată țara — Pâine cu Maia by Virgil.';

/**
 * Strips Romanian diacritics from a string, converting to plain ASCII.
 *
 * Handles both the correct comma-below forms (ș, ț) and the
 * legacy cedilla forms (ş, ţ) commonly found in older data.
 *
 * ă â → a | î → i | ș ş → s | ț ţ → t
 */
const RO_DIACRITICS_MAP: Record<string, string> = {
  'ă': 'a', // ă
  'â': 'a', // â
  'î': 'i', // î
  'ș': 's', // ș (s with comma below)
  'ş': 's', // ş (s with cedilla — legacy)
  'ț': 't', // ț (t with comma below)
  'ţ': 't', // ţ (t with cedilla — legacy)
  'Ă': 'A', // Ă
  'Â': 'A', // Â
  'Î': 'I', // Î
  'Ș': 'S', // Ș
  'Ş': 'S', // Ş
  'Ț': 'T', // Ț
  'Ţ': 'T', // Ţ
}

const RO_DIACRITICS_RE = /[ăâîșțĂÂÎȘȚşŞţŢ]/g

export function stripRoDiacritics(str: string): string {
  return str.replace(RO_DIACRITICS_RE, (ch) => RO_DIACRITICS_MAP[ch] ?? ch)
}

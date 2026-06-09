/**
 * Delivery zone detection for Virgil Bakery.
 *
 * The personal delivery zone covers localities near Sibiu where
 * free personal delivery is available:
 *   - Sibiu, Șura Mare, Șura Mică, Cisnădie, Cisnădioara
 *
 * Comparison is diacritics-insensitive so that both "Cisnădie" and "Cisnadie"
 * are recognised as valid delivery zone localities.
 */

import { stripRoDiacritics } from '@/utilities/stripRoDiacritics'

/** Localities eligible for personal delivery (all in Sibiu judet) */
const PERSONAL_DELIVERY_LOCALITIES: Set<string> = new Set([
  'sibiu',
  'sura mare',
  'sura mica',
  'cisnadie',
  'cisnadioara',
])

/** The judet where personal delivery is available */
const PERSONAL_DELIVERY_JUDET = 'sibiu'

/**
 * Returns true if the given judet + localitate qualifies for free personal delivery.
 * Inputs are normalised (trimmed, lowercased, diacritics stripped) before comparison.
 */
export function isPersonalDeliveryZone(judet: string, localitate: string): boolean {
  const normalizedJudet = stripRoDiacritics(judet.trim().toLowerCase())
  const normalizedLocalitate = stripRoDiacritics(localitate.trim().toLowerCase())

  return (
    normalizedJudet === PERSONAL_DELIVERY_JUDET &&
    PERSONAL_DELIVERY_LOCALITIES.has(normalizedLocalitate)
  )
}

/**
 * Delivery zone detection for Virgil Bakery.
 *
 * The personal delivery zone covers localities near Sibiu where
 * free personal delivery is available:
 *   - Sibiu, Șura Mare, Șura Mică, Cisnădie, Cisnădioara
 *
 * Values use the same ASCII form as the locality dataset (ro-localities.ts)
 * to ensure matching when values come from the UI dropdown.
 */

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
 * Inputs are normalized (trimmed, lowercased) before comparison.
 */
export function isPersonalDeliveryZone(judet: string, localitate: string): boolean {
  const normalizedJudet = judet.trim().toLowerCase()
  const normalizedLocalitate = localitate.trim().toLowerCase()

  return (
    normalizedJudet === PERSONAL_DELIVERY_JUDET &&
    PERSONAL_DELIVERY_LOCALITIES.has(normalizedLocalitate)
  )
}

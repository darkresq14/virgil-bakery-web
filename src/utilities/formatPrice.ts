/**
 * Formats a number as a Romanian-lei currency string.
 * Uses ro-RO locale for comma decimal separator and proper grouping.
 */
export function formatPrice(price: number): string {
  return new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(price)
}

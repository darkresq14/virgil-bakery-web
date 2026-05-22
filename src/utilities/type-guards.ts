export function isExpandedDoc<T extends object>(
  doc: number | string | T | null | undefined,
): doc is T {
  return typeof doc === 'object' && doc !== null
}

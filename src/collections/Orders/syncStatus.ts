/**
 * Single source of truth for sheetSyncStatus values: labels in the admin
 * select, badge look in the list Cell. Written only by the afterChange hook —
 * anything not in this map is not a sync outcome the app produced.
 */
export const SHEET_SYNC_STATUS: Record<
  'synced' | 'failed',
  { label: string; bg: string; text: string; border: string }
> = {
  synced: { label: 'Sync', bg: '#dcfce7', text: '#166534', border: '#86efac' },
  failed: { label: 'Eșuat', bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

/** Payload select options derived from the same map (labels never drift). */
export const SHEET_SYNC_STATUS_OPTIONS = Object.entries(SHEET_SYNC_STATUS).map(
  ([value, { label }]) => ({ label, value }),
);

/** Lookup for arbitrary stored/cell values: undefined when not a known outcome. */
export function sheetSyncStatusOf(value: string | null | undefined) {
  if (value !== 'synced' && value !== 'failed') return undefined;
  return SHEET_SYNC_STATUS[value];
}

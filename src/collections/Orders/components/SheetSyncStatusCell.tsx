'use client';

import { sheetSyncStatusOf } from '../syncStatus';

/** Read-only badge for the ops-workbook sync outcome (set only by the hook).
 * Unknown/null values render a neutral dash — they are not failures. */
export const SheetSyncStatusCell = ({ cellData }: { cellData: string | null }) => {
  const status = sheetSyncStatusOf(cellData);
  if (!status) return <span style={{ color: '#9ca3af' }}>—</span>;

  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: status.bg,
        color: status.text,
        border: `1px solid ${status.border}`,
      }}
    >
      {status.label}
    </span>
  );
};

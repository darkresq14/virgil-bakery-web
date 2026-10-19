'use client';

const SYNC_STYLES: Record<string, { bg: string; text: string; border: string }> = {
  synced: { bg: '#dcfce7', text: '#166534', border: '#86efac' },
  failed: { bg: '#fee2e2', text: '#991b1b', border: '#fca5a5' },
};

const SYNC_LABELS: Record<string, string> = {
  synced: 'Sync',
  failed: 'Eșuat',
};

/** Read-only badge for the ops-workbook sync outcome (set only by the hook). */
export const SheetSyncStatusCell = ({ cellData }: { cellData: string | null }) => {
  if (!cellData) return <span style={{ color: '#9ca3af' }}>—</span>;

  const style = SYNC_STYLES[cellData] ?? SYNC_STYLES.failed;
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 8px',
        borderRadius: '9999px',
        fontSize: '12px',
        fontWeight: 500,
        backgroundColor: style.bg,
        color: style.text,
        border: `1px solid ${style.border}`,
      }}
    >
      {SYNC_LABELS[cellData] ?? cellData}
    </span>
  );
};

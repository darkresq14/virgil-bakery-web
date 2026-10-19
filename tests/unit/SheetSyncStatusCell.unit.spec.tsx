import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { SheetSyncStatusCell } from '@/collections/Orders/components/SheetSyncStatusCell';

afterEach(cleanup);

describe('SheetSyncStatusCell', () => {
  it('renders a green Sync badge for synced orders', () => {
    render(<SheetSyncStatusCell cellData="synced" />);

    const badge = screen.getByText('Sync').closest('span');
    expect(badge?.style.getPropertyValue('background-color')).toBe('rgb(220, 252, 231)');
    expect(badge?.textContent).toContain('Sync');
  });

  it('renders a red Eșuat badge for failed orders', () => {
    render(<SheetSyncStatusCell cellData="failed" />);

    const badge = screen.getByText('Eșuat').closest('span');
    expect(badge?.style.getPropertyValue('background-color')).toBe('rgb(254, 226, 226)');
    expect(badge?.textContent).toContain('Eșuat');
  });

  it('renders a dash fallback when the push was skipped (null)', () => {
    render(<SheetSyncStatusCell cellData={null} />);

    expect(screen.getByText('—')).toBeTruthy();
  });

  it('renders a neutral dash (not a red badge) for an unrecognized status', () => {
    render(<SheetSyncStatusCell cellData="unexpected-value" />);

    expect(screen.getByText('—')).toBeTruthy();
    // Unknown ≠ failed: nothing may carry the failed badge styling
    const spans = document.querySelectorAll('span');
    expect(Array.from(spans).some((s) => s.style.getPropertyValue('background-color') !== '')).toBe(
      false,
    );
  });
});

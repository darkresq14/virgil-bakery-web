import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { HolidayBanner } from '@/components/HolidayBanner';

afterEach(cleanup);

describe('HolidayBanner', () => {
  it('renders null when lastDeliveryBefore is null', () => {
    const { container } = render(
      <HolidayBanner lastDeliveryBefore={null} firstDeliveryAfter={new Date('2026-07-21')} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders null when firstDeliveryAfter is null', () => {
    const { container } = render(
      <HolidayBanner lastDeliveryBefore={new Date('2026-07-10')} firstDeliveryAfter={null} />,
    );
    expect(container.firstChild).toBeNull();
  });

  it('renders both formatted Romanian dates when both props are provided', () => {
    render(
      <HolidayBanner
        lastDeliveryBefore={new Date('2026-07-10')}
        firstDeliveryAfter={new Date('2026-07-21')}
      />,
    );
    expect(screen.getByText(/vineri, 10 iulie/i)).toBeTruthy();
    expect(screen.getByText(/marți, 21 iulie/i)).toBeTruthy();
  });

  it('renders a dismiss control (banner is persistent)', () => {
    const { container } = render(
      <HolidayBanner
        lastDeliveryBefore={new Date('2026-07-10')}
        firstDeliveryAfter={new Date('2026-07-21')}
      />,
    );
    // No close/dismiss button anywhere
    expect(container.querySelector('button[aria-label]')).toBeNull();
    expect(screen.queryByRole('button')).toBeNull();
  });
});

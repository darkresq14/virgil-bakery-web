import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { HolidayModal } from '@/components/HolidayModal';

const STORAGE_KEY = 'vb-holiday-notice-seen';

beforeEach(() => {
  sessionStorage.clear();
});

afterEach(cleanup);

const defaultProps = {
  active: true,
  title: 'Vacanță!',
  message: 'Ne odihnim câteva zile.',
  imageUrl: null,
  lastDeliveryBefore: new Date('2026-07-10'),
  firstDeliveryAfter: new Date('2026-07-21'),
};

describe('HolidayModal', () => {
  it('renders nothing when active is false', () => {
    const { container } = render(<HolidayModal {...defaultProps} active={false} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders nothing when sessionStorage flag is already set', () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    const { container } = render(<HolidayModal {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });

  it('renders modal with title, message, dates, and dismiss button when active and not dismissed', () => {
    render(<HolidayModal {...defaultProps} />);
    expect(screen.getByText('Vacanță!')).toBeTruthy();
    expect(screen.getByText('Ne odihnim câteva zile.')).toBeTruthy();
    expect(screen.getByText(/vineri, 10 iulie/i)).toBeTruthy();
    expect(screen.getByText(/marți, 21 iulie/i)).toBeTruthy();
    expect(screen.getByRole('button', { name: /am înțeles/i })).toBeTruthy();
  });

  it('uses warm defaults when title and message are empty', () => {
    render(<HolidayModal {...defaultProps} title="" message="" />);
    // Warm default heading is non-empty and Romanian
    expect(screen.getByRole('heading', { level: 2 }).textContent).not.toBe('');
    expect(screen.getByRole('heading', { level: 2 }).textContent?.length).toBeGreaterThan(3);
    // Body fallback is non-empty
    expect(document.body.textContent).toMatch(/pastrăm|coacem|brută|pâine|maia|vacanță|concediu/i);
  });

  it('sets sessionStorage flag and unmounts modal on dismiss', () => {
    render(<HolidayModal {...defaultProps} />);
    fireEvent.click(screen.getByRole('button', { name: /am înțeles/i }));
    expect(sessionStorage.getItem(STORAGE_KEY)).toBe('1');
    expect(screen.queryByText('Vacanță!')).toBeNull();
  });

  it('does not reappear on subsequent renders in the same session', () => {
    sessionStorage.setItem(STORAGE_KEY, '1');
    const { container } = render(<HolidayModal {...defaultProps} />);
    expect(container.firstChild).toBeNull();
  });
});

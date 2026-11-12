import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';

import { ThankYouContent } from '@/app/(frontend)/multumim/ThankYouContent';

afterEach(() => {
  cleanup();
});

describe('ThankYouContent', () => {
  it('renders the fallback title and message when SiteConfig values are empty', () => {
    render(<ThankYouContent title="" message="" />);

    // Fallback copy: warm, registered-order confirmation, NO promise about
    // how/when the baker confirms (he confirms by phone, SMS, or whatever).
    expect(
      screen.getByRole('heading', { level: 1, name: /mulțumim pentru comandă/i }),
    ).toBeTruthy();
    expect(screen.getByText(/comanda ta a fost înregistrată/i)).toBeTruthy();
  });

  it('renders the SiteConfig title and message when provided', () => {
    render(<ThankYouContent title="Mulțumim frumos!" message="Pâinile pleacă vineri dimineață." />);

    expect(screen.getByRole('heading', { level: 1, name: /mulțumim frumos!/i })).toBeTruthy();
    expect(screen.getByText(/pâinile pleacă vineri dimineață/i)).toBeTruthy();
    expect(screen.queryByText(/comanda ta a fost înregistrată/i)).toBeNull();
  });

  it('links back to the products page', () => {
    render(<ThankYouContent title="" message="" />);

    const cta = screen.getByRole('link', { name: /înapoi la produse/i });
    expect(cta.getAttribute('href')).toBe('/produse');
  });

  it('whitespace-only values fall back too (admin may save empty strings)', () => {
    render(<ThankYouContent title="   " message="   " />);

    expect(
      screen.getByRole('heading', { level: 1, name: /mulțumim pentru comandă/i }),
    ).toBeTruthy();
    expect(screen.getByText(/comanda ta a fost înregistrată/i)).toBeTruthy();
  });
});

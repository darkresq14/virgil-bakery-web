import { cleanup, fireEvent, render, screen, within } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';

import { CartPageClient } from '@/app/(frontend)/cos/page.client';
import { useCart } from '@/providers/Cart';
import { getDeliveryDates } from '@/utilities/deliveryDates';

// Mock useCart to provide test cart items
vi.mock('@/providers/Cart', () => ({
  useCart: vi.fn(),
}));

// Mock getDeliveryDates to return predictable dates
vi.mock('@/utilities/deliveryDates', () => ({
  getDeliveryDates: vi.fn(() => [
    { date: new Date('2025-06-13'), label: 'Vineri, 13 Iunie', isSelectable: true },
    { date: new Date('2025-06-17'), label: 'Marți, 17 Iunie', isSelectable: true },
  ]),
}));

// Mock Next.js Image component
vi.mock('next/image', () => ({
  default: () => null,
}));

const mockCartItems = [
  {
    productId: '1',
    name: 'Pâine Albă',
    price: 10,
    quantity: 2,
    weight: '500g',
    productType: 'paine',
    slug: 'paine-alba',
  },
  {
    productId: '2',
    name: 'Scovergă',
    price: 10,
    quantity: 1,
    weight: '300g',
    productType: 'produs',
    slug: 'scoverga',
  },
];

const mockCartContext = {
  items: mockCartItems,
  addItem: vi.fn(),
  removeItem: vi.fn(),
  updateQuantity: vi.fn(),
  clearCart: vi.fn(),
  total: 30,
  itemCount: 3,
};

function setupCartPage(overrides?: Partial<typeof mockCartContext>) {
  vi.mocked(useCart).mockReturnValue({ ...mockCartContext, ...overrides });

  // Mock localStorage
  const store: Record<string, string> = {};
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    store[key] = value;
  });

  // Mock fetch
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));

  // Mock window.open
  vi.spyOn(window, 'open').mockReturnValue(null);

  return render(<CartPageClient />);
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CartPageClient — first-time buyer', () => {
  it('renders AddressForm with structured fields instead of address textarea', () => {
    setupCartPage();

    // First-time buyer should see the AddressForm, not a textarea
    // AddressForm renders: Județ, Localitate, Strada și numărul, Detalii suplimentare
    expect(screen.getByLabelText(/județ/i)).toBeTruthy();
    expect(screen.getByLabelText(/localitate/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/strada și numărul/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/bloc, scară, apartament/i)).toBeTruthy();

    // Old textarea for "Adresă de livrare" should NOT exist
    expect(screen.queryByPlaceholderText('Adresa completă de livrare')).toBeNull();
  });

  it('shows personal delivery indicator when Sibiu + Sibiu are selected', () => {
    setupCartPage();

    // Select Sibiu as judet
    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Sibiu' } });

    // Type Sibiu as localitate
    const localitateInput = screen.getByLabelText(/localitate/i);
    fireEvent.change(localitateInput, { target: { value: 'Sibiu' } });

    expect(screen.getByText(/livrare personală — gratuită/i)).toBeTruthy();
  });

  it('shows courier delivery indicator when judet is outside delivery zone', () => {
    setupCartPage();

    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Cluj' } });

    const localitateInput = screen.getByLabelText(/localitate/i);
    fireEvent.change(localitateInput, { target: { value: 'Cluj-Napoca' } });

    expect(screen.getByText(/livrare prin curier — 25 lei/i)).toBeTruthy();
  });

  it('does not show delivery indicator before both judet and localitate are filled', () => {
    setupCartPage();

    // Only judet selected, no localitate
    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Sibiu' } });

    expect(screen.queryByText(/livrare personală/i)).toBeNull();
    expect(screen.queryByText(/livrare prin curier/i)).toBeNull();
  });

  it('shows cost breakdown with Subtotal and Total for personal delivery zone', () => {
    setupCartPage();

    // Should show Subtotal and Total (no transport for personal delivery)
    expect(screen.getByText(/subtotal \(3 produse\)/i)).toBeTruthy();
    // "Total" appears as a separate label element — use a precise match
    const totalLabels = screen.getAllByText(/^total$/i);
    expect(totalLabels.length).toBeGreaterThanOrEqual(1);

    // No transport line when in personal delivery zone (default, no address selected)
    expect(screen.queryByText(/transport/i)).toBeNull();
  });

  it('shows transport line when address is outside delivery zone', () => {
    setupCartPage();

    // Select address outside delivery zone
    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Cluj' } });
    const localitateInput = screen.getByLabelText(/localitate/i);
    fireEvent.change(localitateInput, { target: { value: 'Cluj-Napoca' } });

    expect(screen.getByText(/transport \(curier cargus\)/i)).toBeTruthy();
  });

  it('shows validation errors for required address fields on submit', () => {
    setupCartPage();

    // Click checkout without filling address fields
    const checkoutButton = screen.getByText(/comandă prin whatsapp/i);
    fireEvent.click(checkoutButton);

    // Should show errors for judet, localitate, streetAddress
    expect(screen.getByText(/județul este obligatoriu/i)).toBeTruthy();
    expect(screen.getByText(/localitatea este obligatorie/i)).toBeTruthy();
    expect(screen.getByText(/strada este obligatorie/i)).toBeTruthy();
  });

  it('does not call fetch when address validation fails', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage();

    const checkoutButton = screen.getByText(/comandă prin whatsapp/i);
    fireEvent.click(checkoutButton);

    expect(fetchSpy).not.toHaveBeenCalled();
  });
});

describe('CartPageClient — returning customer', () => {
  function setupReturningCustomer() {
    return setupCartPage();
  }

  function switchToReturningCustomer() {
    const returningButton = screen.getByText(/am mai comandat/i);
    fireEvent.click(returningButton);
  }

  it('shows courier checkbox after switching to returning customer mode', () => {
    setupReturningCustomer();
    switchToReturningCustomer();

    expect(screen.getByLabelText(/am nevoie de livrare prin curier/i)).toBeTruthy();
  });

  it('does not show address fields for returning customers', () => {
    setupReturningCustomer();
    switchToReturningCustomer();

    expect(screen.queryByLabelText(/județ/i)).toBeNull();
    expect(screen.queryByLabelText(/localitate/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/strada și numărul/i)).toBeNull();
  });

  it('shows transport line and updated total when courier checkbox is checked', () => {
    setupReturningCustomer();
    switchToReturningCustomer();

    // No transport line initially
    expect(screen.queryByText(/transport \(curier cargus\)/i)).toBeNull();

    // Check the courier checkbox
    const checkbox = screen.getByLabelText(/am nevoie de livrare prin curier/i) as HTMLInputElement;
    fireEvent.click(checkbox);

    // Now transport line appears
    expect(screen.getByText(/transport \(curier cargus\)/i)).toBeTruthy();
  });

  it('removes transport line when courier checkbox is unchecked', () => {
    setupReturningCustomer();
    switchToReturningCustomer();

    // Check then uncheck
    const checkbox = screen.getByLabelText(/am nevoie de livrare prin curier/i) as HTMLInputElement;
    fireEvent.click(checkbox);
    expect(screen.getByText(/transport \(curier cargus\)/i)).toBeTruthy();

    fireEvent.click(checkbox);
    expect(screen.queryByText(/transport \(curier cargus\)/i)).toBeNull();
  });

  it('POSTs order with deliveryMethod and shippingCost when courier checkbox is checked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupReturningCustomer();
    switchToReturningCustomer();

    // Check courier checkbox
    const checkbox = screen.getByLabelText(/am nevoie de livrare prin curier/i) as HTMLInputElement;
    fireEvent.click(checkbox);

    // Submit
    const checkoutButton = screen.getByText(/comandă prin whatsapp/i);
    fireEvent.click(checkoutButton);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse((call![1] as RequestInit).body as string);
    expect(body.deliveryMethod).toBe('curier');
    expect(body.shippingCost).toBe(25);
    expect(body.subtotal).toBe(30);
    expect(body.total).toBe(55);
  });

  it('POSTs order with personal delivery when courier checkbox is unchecked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupReturningCustomer();
    switchToReturningCustomer();

    // Submit without checking courier
    const checkoutButton = screen.getByText(/comandă prin whatsapp/i);
    fireEvent.click(checkoutButton);

    expect(fetchSpy).toHaveBeenCalledTimes(1);
    const call = fetchSpy.mock.calls[0];
    const body = JSON.parse((call![1] as RequestInit).body as string);
    expect(body.deliveryMethod).toBe('personal');
    expect(body.shippingCost).toBe(0);
    expect(body.subtotal).toBe(30);
    expect(body.total).toBe(30);
  });
});

describe('CartPageClient — holiday-aware delivery dropdown', () => {
  it('renders a holiday date with the "concediu" suffix and disables it', () => {
    vi.mocked(getDeliveryDates).mockReturnValue([
      {
        date: new Date('2026-07-10'),
        label: 'Vineri, 10 Iulie',
        isSelectable: true,
        isHoliday: false,
      },
      {
        date: new Date('2026-07-14'),
        label: 'Marți, 14 Iulie',
        isSelectable: false,
        isHoliday: true,
      },
      {
        date: new Date('2026-07-21'),
        label: 'Marți, 21 Iulie',
        isSelectable: true,
        isHoliday: false,
      },
    ]);

    vi.mocked(useCart).mockReturnValue({ ...mockCartContext });
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    vi.spyOn(window, 'open').mockReturnValue(null);

    render(<CartPageClient />);

    const select = screen.getByLabelText(/dată livrare/i) as HTMLSelectElement;
    const holidayOption = Array.from(select.options).find(
      (o) => o.value === 'Marți, 14 Iulie',
    ) as HTMLOptionElement;
    expect(holidayOption).toBeTruthy();
    expect(holidayOption.textContent).toContain('concediu');
    expect(holidayOption.disabled).toBe(true);
  });

  it('prefers "concediu" over "listă închisă" for a date that is both past cutoff and in holiday', () => {
    vi.mocked(getDeliveryDates).mockReturnValue([
      {
        date: new Date('2026-07-10'),
        label: 'Vineri, 10 Iulie',
        isSelectable: false,
        isHoliday: false,
      },
      {
        date: new Date('2026-07-14'),
        label: 'Marți, 14 Iulie',
        isSelectable: false,
        isHoliday: true,
      },
      {
        date: new Date('2026-07-21'),
        label: 'Marți, 21 Iulie',
        isSelectable: true,
        isHoliday: false,
      },
    ]);

    vi.mocked(useCart).mockReturnValue({ ...mockCartContext });
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    vi.spyOn(window, 'open').mockReturnValue(null);

    render(<CartPageClient />);

    const select = screen.getByLabelText(/dată livrare/i) as HTMLSelectElement;
    const pastCutoffOnly = Array.from(select.options).find(
      (o) => o.value === 'Vineri, 10 Iulie',
    ) as HTMLOptionElement;
    const bothFlags = Array.from(select.options).find(
      (o) => o.value === 'Marți, 14 Iulie',
    ) as HTMLOptionElement;

    // 7/10 past cutoff only -> "listă închisă"
    expect(pastCutoffOnly.textContent).toContain('listă închisă');
    expect(pastCutoffOnly.textContent).not.toContain('concediu');
    // 7/14 past cutoff AND holiday -> "concediu" wins
    expect(bothFlags.textContent).toContain('concediu');
    expect(bothFlags.textContent).not.toContain('listă închisă');
  });
});

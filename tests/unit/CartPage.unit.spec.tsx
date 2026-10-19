import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CartPageClient } from '@/app/(frontend)/cos/page.client';
import { useCart } from '@/providers/Cart';
import { getDeliveryDates } from '@/utilities/deliveryDates';

// Mock useCart to provide test cart items
vi.mock('@/providers/Cart', () => ({
  useCart: vi.fn(),
}));

// Mock getDeliveryDates to return predictable dates
vi.mock('@/utilities/deliveryDates', async () => {
  const actual = await vi.importActual<typeof import('@/utilities/deliveryDates')>(
    '@/utilities/deliveryDates',
  );
  return {
    ...actual,
    getDeliveryDates: vi.fn(() => [
      { date: new Date('2025-06-13'), label: 'Vineri, 13 Iunie', isSelectable: true },
      { date: new Date('2025-06-17'), label: 'Marți, 17 Iunie', isSelectable: true },
    ]),
  };
});

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
    availableDays: 'both' as const,
    availableOnDate: null,
  },
  {
    productId: '2',
    name: 'Scovergă',
    price: 10,
    quantity: 1,
    weight: '300g',
    productType: 'produs',
    slug: 'scoverga',
    availableDays: 'both' as const,
    availableOnDate: null,
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

function setupCartPage(
  overrides?: Partial<typeof mockCartContext>,
  initialStorage: Record<string, string> = {},
) {
  vi.mocked(useCart).mockReturnValue({ ...mockCartContext, ...overrides });

  // Mock localStorage
  const store: Record<string, string> = { ...initialStorage };
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    store[key] = value;
  });

  // Mock fetch
  vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));

  // Mock window.open
  vi.spyOn(window, 'open').mockReturnValue(null);

  return { view: render(<CartPageClient />), store };
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

    // Only the mount-time availability revalidation may hit the network —
    // a failed validation must never POST an order.
    const orderPosts = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/orders'));
    expect(orderPosts).toHaveLength(0);
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

    // Phone is required on every order — fill it so submit passes validation
    fireEvent.change(screen.getByLabelText(/telefon/i), { target: { value: '0722 111 222' } });

    // Check courier checkbox
    const checkbox = screen.getByLabelText(/am nevoie de livrare prin curier/i) as HTMLInputElement;
    fireEvent.click(checkbox);

    // Submit
    const checkoutButton = screen.getByText(/comandă prin whatsapp/i);
    fireEvent.click(checkoutButton);

    // Ignore the mount-time /api/products availability fetch.
    const orderPosts = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/orders'));
    expect(orderPosts).toHaveLength(1);
    const body = JSON.parse((orderPosts[0]![1] as RequestInit).body as string);
    expect(body.deliveryMethod).toBe('curier');
    expect(body.shippingCost).toBe(25);
    expect(body.subtotal).toBe(30);
    expect(body.total).toBe(55);
  });

  it('POSTs order with personal delivery when courier checkbox is unchecked', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupReturningCustomer();
    switchToReturningCustomer();

    // Phone is required on every order — fill it so submit passes validation
    fireEvent.change(screen.getByLabelText(/telefon/i), { target: { value: '0722 111 222' } });

    // Submit without checking courier
    const checkoutButton = screen.getByText(/comandă prin whatsapp/i);
    fireEvent.click(checkoutButton);

    // Ignore the mount-time /api/products availability fetch.
    const orderPosts = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/orders'));
    expect(orderPosts).toHaveLength(1);
    const body = JSON.parse((orderPosts[0]![1] as RequestInit).body as string);
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
        blockedReason: null,
      },
      {
        date: new Date('2026-07-14'),
        label: 'Marți, 14 Iulie',
        isSelectable: false,
        isHoliday: true,
        blockedReason: null,
      },
      {
        date: new Date('2026-07-21'),
        label: 'Marți, 21 Iulie',
        isSelectable: true,
        isHoliday: false,
        blockedReason: null,
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
        blockedReason: 'cutoff',
      },
      {
        date: new Date('2026-07-14'),
        label: 'Marți, 14 Iulie',
        isSelectable: false,
        isHoliday: true,
        blockedReason: 'cutoff',
      },
      {
        date: new Date('2026-07-21'),
        label: 'Marți, 21 Iulie',
        isSelectable: true,
        isHoliday: false,
        blockedReason: null,
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

describe('CartPageClient — holiday info message', () => {
  beforeEach(() => {
    // Reset dropdown mock to non-holiday dates so the only holiday signal is
    // the info banner under test.
    vi.mocked(getDeliveryDates).mockReturnValue([
      {
        date: new Date('2025-06-13'),
        label: 'Vineri, 13 Iunie',
        isSelectable: true,
        isHoliday: false,
        blockedReason: null,
      },
      {
        date: new Date('2025-06-17'),
        label: 'Marți, 17 Iunie',
        isSelectable: true,
        isHoliday: false,
        blockedReason: null,
      },
    ]);
  });

  it('shows a holiday info banner when isNoticeActive is true', () => {
    vi.mocked(useCart).mockReturnValue({ ...mockCartContext });
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    vi.spyOn(window, 'open').mockReturnValue(null);

    render(
      <CartPageClient
        holidayStartDate={new Date('2026-07-13')}
        holidayEndDate={new Date('2026-07-19')}
        isNoticeActive
      />,
    );

    expect(screen.getByText(/program concediu/i)).toBeTruthy();
  });

  it('does not show a holiday info banner when isNoticeActive is false', () => {
    vi.mocked(useCart).mockReturnValue({ ...mockCartContext });
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    vi.spyOn(window, 'open').mockReturnValue(null);

    render(
      <CartPageClient
        holidayStartDate={new Date('2026-07-13')}
        holidayEndDate={new Date('2026-07-19')}
        isNoticeActive={false}
      />,
    );

    expect(screen.queryByText(/program concediu|reluăm livrările/i)).toBeNull();
  });
});

describe('CartPageClient — phone required on every order', () => {
  const PHONE_CACHE_KEY = 'virgil-bakery-phone';
  const REPEAT_KEY = 'vb-repeat-customer';

  function getPhoneInput() {
    return screen.getByLabelText(/telefon/i) as HTMLInputElement;
  }

  function submitOrder() {
    fireEvent.click(screen.getByText(/comandă prin whatsapp/i));
  }

  it('renders the phone input for a returning customer, not just first order', () => {
    setupCartPage();

    // Returning customer via the "Am mai comandat" pill
    fireEvent.click(screen.getByText(/am mai comandat/i));

    expect(getPhoneInput()).toBeTruthy();
  });

  it('phone input carries tel semantics for browsers and password managers', () => {
    // First-order view (default)
    setupCartPage();
    const firstOrderInput = getPhoneInput();
    expect(firstOrderInput.type).toBe('tel');
    expect(firstOrderInput.getAttribute('autocomplete')).toBe('tel');
    expect(firstOrderInput.getAttribute('inputmode')).toBe('tel');

    cleanup();

    // Returning-customer view (same field, rendered outside the first-order gate)
    setupCartPage(undefined, { [REPEAT_KEY]: 'true' });
    const returningInput = getPhoneInput();
    expect(returningInput.type).toBe('tel');
    expect(returningInput.getAttribute('autocomplete')).toBe('tel');
    expect(returningInput.getAttribute('inputmode')).toBe('tel');
  });

  it('blocks submit without phone for a returning customer and shows the standard validation error', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage(undefined, { [REPEAT_KEY]: 'true' });

    submitOrder();

    // Same validation style as the other required fields (error message + destructive border)
    expect(screen.getByText(/telefonul este obligatoriu/i)).toBeTruthy();
    expect(getPhoneInput().className).toContain('border-destructive');

    // Blocked submit must never POST an order (ignore mount-time availability fetch)
    const orderPosts = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/orders'));
    expect(orderPosts).toHaveLength(0);
  });

  it('prefills the phone from the cache for a returning customer', () => {
    setupCartPage(undefined, {
      [REPEAT_KEY]: 'true',
      [PHONE_CACHE_KEY]: '0722 111 222',
    });

    expect(getPhoneInput().value).toBe('0722 111 222');
  });

  it('submits the edited phone, not the cached one', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage(undefined, {
      [REPEAT_KEY]: 'true',
      [PHONE_CACHE_KEY]: '0722 111 222',
    });

    fireEvent.change(getPhoneInput(), { target: { value: '0733 000 111' } });
    submitOrder();

    const orderPosts = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/orders'));
    expect(orderPosts).toHaveLength(1);
    const body = JSON.parse((orderPosts[0]![1] as RequestInit).body as string);
    expect(body.customerPhone).toBe('0733 000 111');
  });

  it('caches the submitted phone after a successful order', async () => {
    const { store } = setupCartPage(undefined, { [REPEAT_KEY]: 'true' });

    fireEvent.change(getPhoneInput(), { target: { value: '0722 333 444' } });
    submitOrder();

    // The cache write happens after the fire-and-forget order POST resolves
    await waitFor(() => expect(store[PHONE_CACHE_KEY]).toBe('0722 333 444'));
  });

  it('cache does not overwrite a field the customer cleared before submit', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage(undefined, {
      [REPEAT_KEY]: 'true',
      [PHONE_CACHE_KEY]: '0722 111 222',
    });

    // Customer clears the prefilled field, then submits
    fireEvent.change(getPhoneInput(), { target: { value: '' } });
    submitOrder();

    // Submit is blocked with the validation error; the cleared field stays empty
    expect(screen.getByText(/telefonul este obligatoriu/i)).toBeTruthy();
    expect(getPhoneInput().value).toBe('');

    const orderPosts = fetchSpy.mock.calls.filter(([url]) => String(url).includes('/api/orders'));
    expect(orderPosts).toHaveLength(0);
  });

  it('keeps name and address gating unchanged for returning customers', () => {
    setupCartPage(undefined, { [REPEAT_KEY]: 'true' });

    // Phone is present, but name/address stay gated behind the first-order flow
    expect(getPhoneInput()).toBeTruthy();
    expect(screen.queryByLabelText(/nume/i)).toBeNull();
    expect(screen.queryByLabelText(/județ/i)).toBeNull();
    expect(screen.queryByLabelText(/localitate/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/strada și numărul/i)).toBeNull();
  });

  it('still requires name and address on the first-order flow', () => {
    setupCartPage();

    // Default = first order; empty submit shows name + address errors (phone too)
    submitOrder();

    expect(screen.getByText(/numele este obligatoriu/i)).toBeTruthy();
    expect(screen.getByText(/telefonul este obligatoriu/i)).toBeTruthy();
    expect(screen.getByText(/județul este obligatoriu/i)).toBeTruthy();
    expect(screen.getByText(/localitatea este obligatorie/i)).toBeTruthy();
    expect(screen.getByText(/strada este obligatorie/i)).toBeTruthy();
  });
});

describe('CartPageClient — delivery date labels for availability-restricted carts', () => {
  it('shows "indisponibil" (not "listă închisă") on Tuesdays when the cart holds a Friday-only product', async () => {
    // Real getDeliveryDates logic, pinned to Mon 2025-06-09 10:00:
    //   Fri 6/13 selectable (cutoff Wed 6/11 17:00 not reached)
    //   Tue 6/10 past cutoff AND not allowed (Friday-only cart)
    //   Tue 6/17 before cutoff but not allowed (the exact mislabelled case)
    const actual = await vi.importActual<typeof import('@/utilities/deliveryDates')>(
      '@/utilities/deliveryDates',
    );
    vi.mocked(getDeliveryDates).mockImplementation((input) =>
      actual.getDeliveryDates({
        ...input,
        referenceDate: new Date('2025-06-09T10:00:00'),
      }),
    );

    vi.mocked(useCart).mockReturnValue({
      ...mockCartContext,
      items: [
        {
          productId: '1',
          name: 'Pâine Albă',
          price: 10,
          quantity: 2,
          weight: '500g',
          productType: 'paine',
          slug: 'paine-alba',
          availableDays: 'friday',
        },
      ],
      total: 20,
      itemCount: 2,
    });
    const store: Record<string, string> = {};
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    // Fresh server data agrees with the cart: Friday-only.
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ docs: [{ id: '1', available: true, availableDays: 'friday' }] }),
    );
    vi.spyOn(window, 'open').mockReturnValue(null);

    render(<CartPageClient />);

    const select = screen.getByLabelText(/dată livrare/i) as HTMLSelectElement;
    const optionTexts = within(select)
      .getAllByRole('option')
      .map((o) => o.textContent ?? '');

    expect(optionTexts).toContain('Vineri, 13 Iunie');
    expect(optionTexts).toContain('Marți, 10 Iunie — indisponibil');
    expect(optionTexts).toContain('Marți, 17 Iunie — indisponibil');
    expect(optionTexts.join('\n')).not.toContain('Marți, 17 Iunie — listă închisă');
  });
});

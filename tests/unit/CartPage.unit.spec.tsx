import { cleanup, fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { CartPageClient } from '@/app/(frontend)/cos/page.client';
import { useCart } from '@/providers/Cart';
import { getDeliveryDates } from '@/utilities/deliveryDates';

// Mock useCart to provide test cart items (the rest of the module stays real —
// the legacy-cart tests below render the actual CartProvider).
vi.mock('@/providers/Cart', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@/providers/Cart')>();
  return { ...actual, useCart: vi.fn() };
});

// Cart redirects to the thank-you route on success — mock the Next router.
const pushMock = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: pushMock }),
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
    weight: 500,
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
    weight: 300,
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

/** Mount-time availability fetch answer: both cart products purchaseable. */
const availabilityResponse = () =>
  Response.json({
    docs: [
      { id: '1', available: true, availableDays: 'both' },
      { id: '2', available: true, availableDays: 'both' },
    ],
  });

/** Only the /api/orders POSTs, ignoring the mount-time availability fetch. */
const orderPostsOf = (spy: ReturnType<typeof vi.spyOn>) =>
  spy.mock.calls.filter(([url]: [input: RequestInfo | URL]) => String(url).includes('/api/orders'));

function setupCartPage(
  overrides?: Partial<typeof mockCartContext>,
  initialStorage: Record<string, string> = {},
  fetchImpl?: (input: RequestInfo | URL, init?: RequestInit) => Promise<Response>,
) {
  vi.mocked(useCart).mockReturnValue({ ...mockCartContext, ...overrides });

  // Mock localStorage
  const store: Record<string, string> = { ...initialStorage };
  vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
  vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
    store[key] = value;
  });

  // Mock fetch — a custom impl must be installed before render: mount-time
  // effects (availability, GLS feed revalidation) fetch during render().
  const fetchSpy = vi.spyOn(globalThis, 'fetch');
  if (fetchImpl) fetchSpy.mockImplementation(fetchImpl);
  else fetchSpy.mockResolvedValue(Response.json({ ok: true }));

  // Mock window.open
  vi.spyOn(window, 'open').mockReturnValue(null);

  return { view: render(<CartPageClient />), store };
}

afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
});

describe('CartPageClient — address + zone-driven delivery (issue #47)', () => {
  it('renders AddressForm with structured fields instead of address textarea', () => {
    setupCartPage();

    expect(screen.getByLabelText(/județ/i)).toBeTruthy();
    expect(screen.getByLabelText(/localitate/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/strada și numărul/i)).toBeTruthy();
    expect(screen.getByPlaceholderText(/bloc, scară, apartament/i)).toBeTruthy();

    expect(screen.queryByPlaceholderText('Adresa completă de livrare')).toBeNull();
  });

  it('shows personal delivery indicator when Sibiu + Sibiu are selected', () => {
    setupCartPage();

    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Sibiu' } });

    const localitateInput = screen.getByLabelText(/localitate/i);
    fireEvent.change(localitateInput, { target: { value: 'Sibiu' } });

    expect(screen.getByText(/livrare personală — gratuită/i)).toBeTruthy();
  });

  it('shows the GLS radio cards when judet is outside delivery zone', () => {
    setupCartPage();

    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Cluj' } });

    const localitateInput = screen.getByLabelText(/localitate/i);
    fireEvent.change(localitateInput, { target: { value: 'Cluj-Napoca' } });

    expect(screen.getByText(/suntem în afara zonei de livrare personală/i)).toBeTruthy();
    expect(screen.getByText('Punct GLS')).toBeTruthy();
    expect(screen.getByText('Livrare acasă')).toBeTruthy();
    // Flat 25 for the point option, tier price for home (1300 g → ≤2 kg tier = 26 lei).
    expect(screen.getByText('25 lei')).toBeTruthy();
    expect(screen.getByText('26 lei')).toBeTruthy();
  });

  it('defaults to the GLS point option with the flat fee in the summary', () => {
    setupCartPage();

    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Cluj' } });
    const localitateInput = screen.getByLabelText(/localitate/i);
    fireEvent.change(localitateInput, { target: { value: 'Cluj-Napoca' } });

    expect(screen.getByText(/transport \(gls\)/i)).toBeTruthy();
  });

  it('hides the street fields while the GLS point option is selected', () => {
    setupCartPage();

    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Cluj' } });
    const localitateInput = screen.getByLabelText(/localitate/i);
    fireEvent.change(localitateInput, { target: { value: 'Cluj-Napoca' } });

    // Point delivery: street + details are not the destination.
    expect(screen.queryByPlaceholderText(/strada și numărul/i)).toBeNull();
    expect(screen.queryByPlaceholderText(/bloc, scară, apartament/i)).toBeNull();
  });

  it('shows the street fields again when home delivery is selected', () => {
    setupCartPage();

    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Cluj' } });
    const localitateInput = screen.getByLabelText(/localitate/i);
    fireEvent.change(localitateInput, { target: { value: 'Cluj-Napoca' } });

    fireEvent.click(screen.getByLabelText(/livrare acasă/i));

    expect(screen.getByPlaceholderText(/strada și numărul/i)).toBeTruthy();
  });

  it('does not show delivery choice before both judet and localitate are filled', () => {
    setupCartPage();

    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Sibiu' } });

    expect(screen.queryByText(/livrare personală/i)).toBeNull();
    expect(screen.queryByText(/punct gls/i)).toBeNull();
  });

  it('shows cost breakdown with Subtotal and Total for personal delivery zone', () => {
    setupCartPage();

    expect(screen.getByText(/subtotal \(3 produse\)/i)).toBeTruthy();
    const totalLabels = screen.getAllByText(/^total$/i);
    expect(totalLabels.length).toBeGreaterThanOrEqual(1);

    expect(screen.queryByText(/transport/i)).toBeNull();
  });

  it('shows validation errors for required address fields on submit', () => {
    setupCartPage();

    const checkoutButton = screen.getByText(/trimite comanda/i);
    fireEvent.click(checkoutButton);

    expect(screen.getAllByText(/județul este obligatoriu/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/localitatea este obligatorie/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/strada și numărul sunt obligatorii/i).length).toBeGreaterThan(0);
  });

  it('requires a GLS point when point delivery is selected', () => {
    setupCartPage();

    fireEvent.change(screen.getByLabelText(/nume/i), { target: { value: 'Ion Pop' } });
    fireEvent.change(screen.getByLabelText(/telefon/i), { target: { value: '0722 111 222' } });
    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Cluj' } });
    fireEvent.change(screen.getByLabelText(/localitate/i), { target: { value: 'Cluj-Napoca' } });

    fireEvent.click(screen.getByText(/trimite comanda/i));

    expect(screen.getAllByText('Alege punctul GLS').length).toBeGreaterThan(0);
    // Street is not the destination for point delivery — no street error.
    expect(screen.queryByText(/strada și numărul sunt obligatorii/i)).toBeNull();
  });

  it('does not call fetch when address validation fails', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage();

    const checkoutButton = screen.getByText(/trimite comanda/i);
    fireEvent.click(checkoutButton);

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(0);
  });
});

describe('CartPageClient — single-form checkout (no returning-customer mini-flow)', () => {
  /** Fills every required field for an in-zone personal delivery order. */
  function fillCompleteForm({ outOfZone = false, home = false } = {}) {
    fireEvent.change(screen.getByLabelText(/nume/i), { target: { value: 'Ion Pop' } });
    fireEvent.change(screen.getByLabelText(/telefon/i), { target: { value: '0722 111 222' } });
    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: outOfZone ? 'Cluj' : 'Sibiu' } });
    fireEvent.change(screen.getByLabelText(/localitate/i), {
      target: { value: outOfZone ? 'Cluj-Napoca' : 'Sibiu' },
    });
    if (outOfZone && home) {
      fireEvent.click(screen.getByLabelText(/livrare acasă/i));
      fireEvent.change(screen.getByPlaceholderText(/strada și numărul/i), {
        target: { value: 'Str. Victoriei 10' },
      });
    }
    if (!outOfZone) {
      fireEvent.change(screen.getByPlaceholderText(/strada și numărul/i), {
        target: { value: 'Str. Cerului 1' },
      });
    }
  }

  it('renders one form for everyone — no pills, no courier checkbox', () => {
    setupCartPage();

    expect(screen.queryByText(/prima comandă/i)).toBeNull();
    expect(screen.queryByText(/am mai comandat/i)).toBeNull();
    expect(screen.queryByLabelText(/am nevoie de livrare prin curier/i)).toBeNull();
    // Name + address are always present now.
    expect(screen.getByLabelText(/nume/i)).toBeTruthy();
    expect(screen.getByLabelText(/județ/i)).toBeTruthy();
  });

  it('keeps the cart and unlocks retry when the order POST answers non-ok', async () => {
    // Site-only checkout (#45): a non-2xx POST is a hard failure — no
    // WhatsApp handoff anymore, so the cart must survive and the customer
    // must be able to retry.
    const availability = availabilityResponse();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(availability)
      .mockResolvedValueOnce(Response.json({ ok: false }, { status: 500 }))
      .mockResolvedValueOnce(Response.json({ ok: false }, { status: 500 }));
    const clearCart = vi.fn();
    setupCartPage({ clearCart });

    fillCompleteForm();
    fireEvent.click(screen.getByText(/trimite comanda/i));

    const orderPosts = () => orderPostsOf(fetchSpy);
    await waitFor(() => expect(orderPosts()).toHaveLength(1));

    expect(await screen.findByText(/comanda nu a putut fi trimisă/i)).toBeTruthy();
    expect(clearCart).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(/trimite comanda/i));
    await waitFor(() => expect(orderPosts()).toHaveLength(2));
    expect(clearCart).not.toHaveBeenCalled();
  });

  it('shows an error banner and keeps the cart when the order POST throws (network failure)', async () => {
    const availability = availabilityResponse();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(availability)
      .mockRejectedValueOnce(new TypeError('network down'));
    const clearCart = vi.fn();
    setupCartPage({ clearCart });

    fillCompleteForm();
    fireEvent.click(screen.getByText(/trimite comanda/i));

    expect(await screen.findByText(/comanda nu a putut fi trimisă/i)).toBeTruthy();
    expect(clearCart).not.toHaveBeenCalled();
    expect(pushMock).not.toHaveBeenCalled();

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(1);
  });

  it('POSTs order with deliveryMethod gls-acasa and the tiered shipping cost', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage({
      items: [{ ...mockCartItems[0], quantity: 3, weight: 800 }],
      itemCount: 3,
      total: 30,
    });

    // 3 × 800 g = 2400 g → ≤5 kg tier, 33 lei.
    fillCompleteForm({ outOfZone: true, home: true });
    fireEvent.click(screen.getByText(/trimite comanda/i));

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(1);
    const body = JSON.parse(String(orderPosts[0]?.[1]?.body));
    expect(body.deliveryMethod).toBe('gls-acasa');
    expect(body.shippingCost).toBe(33);
    expect(body.subtotal).toBe(30);
    expect(body.total).toBe(63);
  });

  it('ignores a second rapid checkout click while the order POST is in flight', () => {
    // Issue #41 — no double-submit guard: each impatient re-click created a
    // duplicate Payload order (prod incident: five orders in 10s).
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockImplementation(() => new Promise(() => {}));
    setupCartPage();

    fillCompleteForm();

    const checkoutButton = screen.getByText(/trimite comanda/i);
    fireEvent.click(checkoutButton);
    fireEvent.click(checkoutButton);

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(1);
  });

  it('POSTs order with personal delivery and zero shipping inside the zone', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage();

    fillCompleteForm();
    fireEvent.click(screen.getByText(/trimite comanda/i));

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(1);
    const body = JSON.parse(String(orderPosts[0]?.[1]?.body));
    expect(body.deliveryMethod).toBe('personal');
    expect(body.shippingCost).toBe(0);
    expect(body.subtotal).toBe(30);
    expect(body.total).toBe(30);
  });
});

describe('CartPageClient — site-only checkout submit', () => {
  const PROFILE_CACHE_KEY = 'virgil-bakery-profile';

  function fillForm() {
    fireEvent.change(screen.getByLabelText(/nume/i), { target: { value: 'Ion Pop' } });
    fireEvent.change(screen.getByLabelText(/telefon/i), { target: { value: '0722 111 222' } });
    fireEvent.change(screen.getByLabelText(/județ/i), { target: { value: 'Sibiu' } });
    fireEvent.change(screen.getByLabelText(/localitate/i), { target: { value: 'Sibiu' } });
    fireEvent.change(screen.getByPlaceholderText(/strada și numărul/i), {
      target: { value: 'Str. Cerului 1' },
    });
  }

  it('on success: clears the cart and navigates to /multumim, never opening WhatsApp', async () => {
    const availability = availabilityResponse();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(availability)
      .mockResolvedValueOnce(Response.json({ ok: true }, { status: 201 }));
    const clearCart = vi.fn();
    const openSpy = vi.spyOn(window, 'open').mockReturnValue(null);
    setupCartPage({ clearCart });

    fillForm();
    fireEvent.click(screen.getByText(/trimite comanda/i));

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/multumim'));
    expect(clearCart).toHaveBeenCalledTimes(1);
    expect(openSpy).not.toHaveBeenCalled();

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(1);
  });

  it('POSTs the Order without any WhatsApp message field', async () => {
    const availability = availabilityResponse();
    const fetchSpy = vi
      .spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(availability)
      .mockResolvedValueOnce(Response.json({ ok: true }, { status: 201 }));
    setupCartPage();

    fillForm();
    fireEvent.click(screen.getByText(/trimite comanda/i));

    const orderPosts = () => orderPostsOf(fetchSpy);
    await waitFor(() => expect(orderPosts()).toHaveLength(1));
    const body = JSON.parse(String(orderPosts()[0]?.[1]?.body));
    expect(body.whatsappMessage).toBeUndefined();
    expect(body.customerName).toBe('Ion Pop');
    expect(body.customerPhone).toBe('0722 111 222');
    expect(body.items).toHaveLength(2);
    expect(body.status).toBe('nou');
  });

  it('caches the full checkout profile only after a successful submit', async () => {
    const availability = availabilityResponse();
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(availability)
      .mockResolvedValueOnce(Response.json({ ok: true }, { status: 201 }));
    const { store } = setupCartPage();

    fillForm();
    fireEvent.click(screen.getByText(/trimite comanda/i));

    await waitFor(() => expect(store[PROFILE_CACHE_KEY]).toBeTruthy());
    const profile = JSON.parse(store[PROFILE_CACHE_KEY]);
    expect(profile.phone).toBe('0722 111 222');
    expect(profile.judet).toBe('Sibiu');
    expect(profile.streetAddress).toBe('Str. Cerului 1');
  });

  it('does not cache the profile when the submit fails', async () => {
    const availability = availabilityResponse();
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(availability)
      .mockResolvedValueOnce(Response.json({ ok: false }, { status: 500 }));
    const { store } = setupCartPage();

    fillForm();
    fireEvent.click(screen.getByText(/trimite comanda/i));

    await screen.findByText(/comanda nu a putut fi trimisă/i);
    expect(store[PROFILE_CACHE_KEY]).toBeUndefined();
  });

  it('renders no wa.me link anywhere on the cart page', () => {
    setupCartPage();
    expect(document.querySelector('a[href*="wa.me"]')).toBeNull();
    expect(document.body.textContent?.toLowerCase()).not.toContain('whatsapp');
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
  const PROFILE_CACHE_KEY = 'virgil-bakery-profile';

  function getPhoneInput() {
    return screen.getByLabelText(/telefon/i) as HTMLInputElement;
  }

  function submitOrder() {
    fireEvent.click(screen.getByText(/trimite comanda/i));
  }

  it('phone input carries tel semantics for browsers and password managers', () => {
    setupCartPage();
    const input = getPhoneInput();
    expect(input.type).toBe('tel');
    expect(input.getAttribute('autocomplete')).toBe('tel');
    expect(input.getAttribute('inputmode')).toBe('tel');
  });

  it('blocks submit without phone and shows the standard validation error', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage();

    submitOrder();

    expect(screen.getAllByText(/telefonul este obligatoriu/i).length).toBeGreaterThan(0);
    expect(getPhoneInput().className).toContain('border-destructive');

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(0);
  });

  it('prefills the whole form from the cached profile after mount (hydration-safe)', async () => {
    setupCartPage(undefined, {
      [PROFILE_CACHE_KEY]: JSON.stringify({
        name: 'Ion Pop',
        phone: '0722 111 222',
        judet: 'Sibiu',
        localitate: 'Sibiu',
        streetAddress: 'Str. Cerului 1',
        addressDetails: '',
        glsChoice: 'punct',
        glsPoint: null,
      }),
    });

    await waitFor(() => expect(getPhoneInput().value).toBe('0722 111 222'));
    expect((screen.getByLabelText(/nume/i) as HTMLInputElement).value).toBe('Ion Pop');
    expect((screen.getByPlaceholderText(/strada și numărul/i) as HTMLInputElement).value).toBe(
      'Str. Cerului 1',
    );
  });

  it('submits the edited phone, not the cached one', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage(undefined, {
      [PROFILE_CACHE_KEY]: JSON.stringify({
        name: 'Ion Pop',
        phone: '0722 111 222',
        judet: 'Sibiu',
        localitate: 'Sibiu',
        streetAddress: 'Str. Cerului 1',
        addressDetails: '',
        glsChoice: 'punct',
        glsPoint: null,
      }),
    });

    await waitFor(() => expect(getPhoneInput().value).toBe('0722 111 222'));
    fireEvent.change(getPhoneInput(), { target: { value: '0733 000 111' } });
    submitOrder();

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(1);
    const body = JSON.parse(String(orderPosts[0]?.[1]?.body));
    expect(body.customerPhone).toBe('0733 000 111');
  });

  it('cache does not overwrite a field the customer cleared before submit', () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ ok: true }));
    setupCartPage(undefined, {
      [PROFILE_CACHE_KEY]: JSON.stringify({
        name: 'Ion Pop',
        phone: '0722 111 222',
        judet: 'Sibiu',
        localitate: 'Sibiu',
        streetAddress: 'Str. Cerului 1',
        addressDetails: '',
        glsChoice: 'punct',
        glsPoint: null,
      }),
    });

    fireEvent.change(getPhoneInput(), { target: { value: '' } });
    submitOrder();

    expect(screen.getAllByText(/telefonul este obligatoriu/i).length).toBeGreaterThan(0);
    expect(getPhoneInput().value).toBe('');

    const orderPosts = orderPostsOf(fetchSpy);
    expect(orderPosts).toHaveLength(0);
  });

  it('still requires name and address on the single form', () => {
    setupCartPage();

    submitOrder();

    expect(screen.getAllByText(/numele este obligatoriu/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/telefonul este obligatoriu/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/județul este obligatoriu/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/localitatea este obligatorie/i).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/strada și numărul sunt obligatorii/i).length).toBeGreaterThan(0);
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
          weight: 500,
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

describe('CartPageClient — cached GLS choice + point revalidation (issue #47 hardening)', () => {
  const PROFILE_CACHE_KEY = 'virgil-bakery-profile';

  const cachedPoint = {
    matchcode: 'LOCKER-01',
    goldId: '12345',
    nume: 'Locker Ex',
    adresa: 'Str. Ex 1, Cluj',
    tip: 'parcel-locker',
  };

  function glsRadio(choice: 'punct' | 'acasa') {
    // Radios share name="gls-method"; the point card renders first.
    const radios = document.querySelectorAll<HTMLInputElement>('input[name="gls-method"]');
    return choice === 'punct' ? radios[0] : radios[1];
  }

  it('falls back to point delivery when a cached "acasă" is unavailable (>10 kg)', async () => {
    setupCartPage(
      {
        items: [{ ...mockCartItems[0], quantity: 14, weight: 800 }],
        itemCount: 14,
        total: 140,
      },
      {
        [PROFILE_CACHE_KEY]: JSON.stringify({
          name: 'Ion Pop',
          phone: '0722 111 222',
          judet: 'Cluj',
          localitate: 'Cluj-Napoca',
          streetAddress: 'Str. Ex 1',
          addressDetails: '',
          glsChoice: 'acasa',
          glsPoint: null,
        }),
      },
    );

    await waitFor(() => expect(glsRadio('punct').checked).toBe(true));
    expect(glsRadio('acasa').checked).toBe(false);
    expect(glsRadio('acasa').disabled).toBe(true);
  });

  it('keeps a cached "acasă" selected when the home tier is available', async () => {
    setupCartPage(undefined, {
      [PROFILE_CACHE_KEY]: JSON.stringify({
        name: 'Ion Pop',
        phone: '0722 111 222',
        judet: 'Cluj',
        localitate: 'Cluj-Napoca',
        streetAddress: 'Str. Ex 1',
        addressDetails: '',
        glsChoice: 'acasa',
        glsPoint: null,
      }),
    });

    await waitFor(() => expect(glsRadio('acasa').checked).toBe(true));
    expect(glsRadio('acasa').disabled).toBe(false);
  });

  it('clears the glsPoint validation error when the customer picks a point', async () => {
    setupCartPage(undefined, {
      [PROFILE_CACHE_KEY]: JSON.stringify({
        name: 'Ion Pop',
        phone: '0722 111 222',
        judet: 'Cluj',
        localitate: 'Cluj-Napoca',
        streetAddress: '',
        addressDetails: '',
        glsChoice: 'punct',
        glsPoint: null,
      }),
    });

    // Submit without a point → the error shows.
    fireEvent.click(screen.getByText(/trimite comanda/i));
    expect(screen.getAllByText('Alege punctul GLS').length).toBeGreaterThan(0);

    // The widget element fires `change` with the picked point.
    const widget = document.querySelector('gls-dpm-dialog');
    expect(widget).not.toBeNull();
    fireEvent(
      widget as Element,
      new CustomEvent('change', {
        detail: { id: 'LOCKER-01', goldId: '12345', name: 'Locker Ex', type: 'parcel-locker' },
      }),
    );

    await waitFor(() => expect(screen.queryByText('Alege punctul GLS')).toBeNull());
    // The picked point renders in its place.
    expect(screen.getByText('Locker Ex')).toBeTruthy();
  });

  it('does not fetch the GLS feed for an in-zone customer with a cached point', async () => {
    setupCartPage(undefined, {
      [PROFILE_CACHE_KEY]: JSON.stringify({
        name: 'Ion Pop',
        phone: '0722 111 222',
        judet: 'Sibiu',
        localitate: 'Sibiu',
        streetAddress: 'Str. Ex 1',
        addressDetails: '',
        glsChoice: 'punct',
        glsPoint: cachedPoint,
      }),
    });
    const fetchSpy = vi.spyOn(globalThis, 'fetch').mockResolvedValue(Response.json({ docs: [] }));

    await waitFor(() =>
      expect((screen.getByLabelText(/nume/i) as HTMLInputElement).value).toBe('Ion Pop'),
    );

    const feedCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes('map.gls-romania.com'),
    );
    expect(feedCalls).toHaveLength(0);
  });

  it('drops a cached point the server rejects at submit — no client feed download', async () => {
    const fetchSpy = vi.spyOn(globalThis, 'fetch');
    setupCartPage(
      undefined,
      {
        [PROFILE_CACHE_KEY]: JSON.stringify({
          name: 'Ion Pop',
          phone: '0722 111 222',
          judet: 'Cluj',
          localitate: 'Cluj-Napoca',
          streetAddress: '',
          addressDetails: '',
          glsChoice: 'punct',
          glsPoint: cachedPoint,
        }),
      },
      async (input, init) => {
        if (String(input).includes('/api/orders') && init?.method === 'POST') {
          // Payload ValidationError: feed check confirmed the point is gone.
          return new Response(
            JSON.stringify({
              errors: [
                {
                  message: 'Punctul GLS ales nu mai este disponibil — alege alt punct',
                  path: 'glsPoint',
                },
              ],
            }),
            { status: 400, headers: { 'Content-Type': 'application/json' } },
          );
        }
        return Response.json({
          docs: [
            { id: '1', available: true, availableDays: 'both' },
            { id: '2', available: true, availableDays: 'both' },
          ],
        });
      },
    );

    // Cached point is prefilled and shown before submit.
    await waitFor(() => expect(screen.getByText('Locker Ex')).toBeTruthy());

    fireEvent.click(screen.getByText(/trimite comanda/i));

    await waitFor(() =>
      expect(screen.getByText(/punctul salvat anterior nu mai este disponibil/i)).toBeTruthy(),
    );
    // Field-level error from the server response, under the picker.
    expect(
      screen.getAllByText('Punctul GLS ales nu mai este disponibil — alege alt punct').length,
    ).toBeGreaterThan(0);
    // The dead point is dropped — the re-pick button renders in its place.
    expect(screen.getByText(/Alege punctul GLS pe hartă/i)).toBeTruthy();

    // The feed is never downloaded client-side (server-side check only).
    const feedCalls = fetchSpy.mock.calls.filter(([url]) =>
      String(url).includes('map.gls-romania.com'),
    );
    expect(feedCalls).toHaveLength(0);
    // The order POST did reach the server (rejected there, not pre-empted).
    const orderPosts = fetchSpy.mock.calls.filter(
      ([url, init]) => String(url).includes('/api/orders') && init?.method === 'POST',
    );
    expect(orderPosts).toHaveLength(1);
  });
});

describe('CartPageClient — accessible errors + form ergonomics (critique fixes)', () => {
  function fillForm() {
    fireEvent.change(screen.getByLabelText(/nume/i), { target: { value: 'Ion Pop' } });
    fireEvent.change(screen.getByLabelText(/telefon/i), { target: { value: '0722 111 222' } });
    fireEvent.change(screen.getByLabelText(/județ/i), { target: { value: 'Sibiu' } });
    fireEvent.change(screen.getByLabelText(/localitate/i), { target: { value: 'Sibiu' } });
    fireEvent.change(screen.getByPlaceholderText(/strada și numărul/i), {
      target: { value: 'Str. Cerului 1' },
    });
  }

  it('moves focus to a focusable error summary on failed submit', async () => {
    setupCartPage();
    // Nothing filled — every required field invalid.
    fireEvent.click(screen.getByText(/trimite comanda/i));

    const summary = screen.getByRole('alert');
    await waitFor(() => expect(document.activeElement).toBe(summary));
    // Summary links to the invalid fields (GOV.UK pattern).
    expect(within(summary).getByRole('link', { name: /nume/i })).toBeTruthy();
  });

  it('marks invalid text fields with aria-invalid + aria-describedby', () => {
    setupCartPage();
    fireEvent.click(screen.getByText(/trimite comanda/i));

    const name = screen.getByLabelText(/nume/i) as HTMLInputElement;
    expect(name.getAttribute('aria-invalid')).toBe('true');
    const describedBy = name.getAttribute('aria-describedby');
    expect(describedBy).toBeTruthy();
    expect(document.getElementById(describedBy as string)).toBeTruthy();
  });

  it('submits via Enter key inside a real <form> element', async () => {
    const availability = availabilityResponse();
    vi.spyOn(globalThis, 'fetch')
      .mockResolvedValueOnce(availability)
      .mockResolvedValueOnce(Response.json({ ok: true }, { status: 201 }));
    const { view } = setupCartPage();
    fillForm();

    fireEvent.submit(view.container.querySelector('form') as HTMLFormElement);

    await waitFor(() => expect(pushMock).toHaveBeenCalledWith('/multumim'));
  });

  it('requires a second tap before clearing the cart', () => {
    const clearCart = vi.fn();
    setupCartPage({ clearCart });

    fireEvent.click(screen.getByText(/golește coșul/i));
    expect(clearCart).not.toHaveBeenCalled();

    fireEvent.click(screen.getByText(/apasă din nou/i));
    expect(clearCart).toHaveBeenCalledTimes(1);
  });
});

describe('CartPageClient — product weights in grams (#60)', () => {
  it('renders raw grams on cart line items — no kilogram conversion', () => {
    setupCartPage();

    // Fixtures: Pâine Albă 500 g ×2, Scovergă 300 g ×1.
    expect(screen.getByText('500g')).toBeTruthy();
    expect(screen.getByText('300g')).toBeTruthy();
    expect(screen.queryByText(/kg/i)).toBeNull();
  });

  it('keeps rendering weights for carts cached in the text-weight era', async () => {
    // Before #60 the cart persisted free-text weights. Rehydration must
    // coerce parseable ones to grams and strip the rest, without errors.
    const legacyCart = [
      {
        productId: '1',
        name: 'Pâine Albă',
        price: 10,
        quantity: 2,
        weight: '500g',
        productType: 'paine',
        slug: 'paine-alba',
        availableDays: 'both',
        availableOnDate: null,
      },
      {
        productId: '2',
        name: 'Coș',
        price: 10,
        quantity: 1,
        weight: 'Pachet',
        productType: 'produs',
        slug: 'cos',
        availableDays: 'both',
        availableOnDate: null,
      },
    ];
    const actual = await vi.importActual<typeof import('@/providers/Cart')>('@/providers/Cart');
    // Real provider + real hook: the page consumes what loadCart() rehydrates.
    vi.mocked(useCart).mockImplementation(actual.useCart);

    const store: Record<string, string> = {
      'virgil-bakery-cart': JSON.stringify(legacyCart),
    };
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation((key) => store[key] ?? null);
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation((key, value) => {
      store[key] = value;
    });
    vi.spyOn(globalThis, 'fetch').mockResolvedValue(
      Response.json({ docs: [{ id: '1', available: true, availableDays: 'both' }] }),
    );
    vi.spyOn(window, 'open').mockReturnValue(null);

    render(
      <actual.CartProvider>
        <CartPageClient />
      </actual.CartProvider>,
    );

    await waitFor(() => expect(screen.getByText('Pâine Albă')).toBeTruthy());
    expect(screen.getByText('500g')).toBeTruthy();
    // Unparseable legacy text is stripped, never rendered as-is.
    expect(screen.queryByText('Pachet')).toBeNull();
    expect(screen.queryByText('0g')).toBeNull();
  });
});

describe('CartPageClient — weight-based home tiers (#61)', () => {
  function chooseOutOfZoneAddress() {
    const judetSelect = screen.getByLabelText(/județ/i) as HTMLSelectElement;
    fireEvent.change(judetSelect, { target: { value: 'Cluj' } });
    fireEvent.change(screen.getByLabelText(/localitate/i), {
      target: { value: 'Cluj-Napoca' },
    });
  }

  function glsRadios() {
    return document.querySelectorAll<HTMLInputElement>('input[name="gls-method"]');
  }

  it('shows the cart total weight and the applied tier in the summary', () => {
    setupCartPage({
      items: [{ ...mockCartItems[0], quantity: 3, weight: 800 }],
      itemCount: 3,
      total: 30,
    });

    chooseOutOfZoneAddress();
    fireEvent.click(screen.getByLabelText(/livrare acasă/i));

    // 3 × 800 g = 2400 g → „până la 5 kg” tier.
    expect(screen.getByText('Greutate totală: 2400g')).toBeTruthy();
    expect(screen.getByText('până la 5 kg')).toBeTruthy();
  });

  it('marks home delivery unavailable above 10 kg while point stays offered', () => {
    setupCartPage({
      items: [{ ...mockCartItems[0], quantity: 14, weight: 800 }],
      itemCount: 14,
      total: 140,
    });

    chooseOutOfZoneAddress();

    // 14 × 800 g = 11 200 g — home is off, the locker stays at its flat fee.
    expect(screen.getByText(/peste 10 kg/i)).toBeTruthy();
    expect(glsRadios()[1].disabled).toBe(true);
    expect(screen.getByText('25 lei')).toBeTruthy();
  });
});

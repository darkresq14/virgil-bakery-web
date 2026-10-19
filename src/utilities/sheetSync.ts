import { roDayKey } from '@/utilities/deliveryDates';

/**
 * Sheet-sync seam — the ONLY module in the app that knows anything about the
 * bakery's Google Sheet ops workbook (Apps Script web-app intake). It maps a
 * created order to the verified wire contract and pushes it; callers get a
 * sync outcome and never a thrown error. See GitHub issue #33/#34.
 */

/** The order shape this seam needs (subset of the Payload `orders` doc). */
export interface SheetSyncOrder {
  id: number | string;
  items: unknown;
  total: number;
  deliveryMethod: 'personal' | 'curier';
  deliveryDate: string | Date;
  customerName?: string | null;
  customerPhone?: string | null;
  judet?: string | null;
  localitate?: string | null;
  streetAddress?: string | null;
  addressDetails?: string | null;
}

export type SheetSyncOutcome =
  | { status: 'synced' }
  | { status: 'failed'; reason: string }
  | { status: 'skipped'; reason: string };

/** JSON body the Apps Script intake expects (verified live against dev). */
interface WirePayload {
  secret: string;
  idComanda: string;
  nume: string;
  telefon: string;
  dataLivrare: string;
  metoda: 'personala' | 'cargus';
  adresa: string;
  localitate: string;
  judet: string;
  detalii: string;
  total: number;
  produse: { denumire: unknown; cantitate: unknown }[];
}

function coerceOrderItems(items: unknown): Record<string, unknown>[] {
  return Array.isArray(items) ? (items as Record<string, unknown>[]) : [];
}

function toWirePayload(order: SheetSyncOrder, secret: string): WirePayload {
  return {
    secret,
    idComanda: String(order.id),
    nume: order.customerName ?? '',
    telefon: order.customerPhone ?? '',
    dataLivrare: roDayKey(new Date(order.deliveryDate)),
    metoda: order.deliveryMethod === 'curier' ? 'cargus' : 'personala',
    adresa: order.streetAddress ?? '',
    localitate: order.localitate ?? '',
    judet: order.judet ?? '',
    detalii: order.addressDetails ?? '',
    total: order.total,
    produse: coerceOrderItems(order.items).map((item) => ({
      denumire: item.name,
      cantitate: item.quantity,
    })),
  };
}

/**
 * The web app's /exec endpoint answers 302 to a googleusercontent echo URL.
 * `redirect: 'follow'` drops the POST body (verified: the script then sees an
 * empty payload and rejects the secret), so the body is delivered with
 * `redirect: 'manual'` and the JSON result is read back by GETting the
 * Location header. This transport lives here only.
 */
/** Cap on each web-app fetch so a hanging Google response can never block
 * order creation (spec story 17). A timeout abort is just a transport error. */
const FETCH_TIMEOUT_MS = 10_000;

export async function pushOrderToSheet(
  order: SheetSyncOrder,
  { timeoutMs = FETCH_TIMEOUT_MS }: { timeoutMs?: number } = {},
): Promise<SheetSyncOutcome> {
  const url = process.env.SHEETS_WEBAPP_URL;
  const secret = process.env.SHEETS_WEBAPP_TOKEN;

  if (!url || !secret) {
    const missing = [!url && 'SHEETS_WEBAPP_URL', !secret && 'SHEETS_WEBAPP_TOKEN'].filter(Boolean);
    const reason = `Sheet sync skipped — missing env: ${missing.join(', ')}`;
    console.warn(`[sheetSync] ${reason}`);
    return { status: 'skipped', reason };
  }

  try {
    const post = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(toWirePayload(order, secret)),
      redirect: 'manual',
      signal: AbortSignal.timeout(timeoutMs),
    });

    let resultPage: Response;
    if (post.status >= 300 && post.status < 400) {
      const location = post.headers.get('location');
      if (!location) {
        return { status: 'failed', reason: `Redirect without Location header (${post.status})` };
      }
      resultPage = await fetch(location, { method: 'GET', signal: AbortSignal.timeout(timeoutMs) });
    } else {
      resultPage = post;
    }

    if (!resultPage.ok) {
      return { status: 'failed', reason: `HTTP ${resultPage.status} from web app` };
    }

    const result = (await resultPage.json()) as { ok?: unknown; eroare?: unknown };
    if (result.ok === true) return { status: 'synced' };

    const eroare = typeof result.eroare === 'string' ? result.eroare : JSON.stringify(result);
    return { status: 'failed', reason: `Script error: ${eroare}` };
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    return { status: 'failed', reason: `Transport error: ${reason}` };
  }
}

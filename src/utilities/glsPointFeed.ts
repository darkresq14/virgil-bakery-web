/**
 * Server-side GLS point-feed check (moved from the checkout client, follow-up
 * to #47): the public ro.json delivery-point feed (~1.5 MB) is fetched at
 * most once per TTL window per server instance and shared by all orders —
 * customers no longer download it at checkout mount.
 *
 * Fail-open by design: an unreachable, empty or malformed feed must never
 * block a bakery order. Only a confirmed miss against a well-shaped feed
 * rejects. Same trust model as the client check it replaced: the widget is
 * the source of truth at pick time; this only guards cached points reused
 * across visits.
 */

const FEED_URL = 'https://map.gls-romania.com/data/deliveryPoints/ro.json';
/** Mirrors GLS's own Cache-Control max-age (900 s). */
const FEED_TTL_MS = 15 * 60_000;
const FEED_TIMEOUT_MS = 5_000;

/** Feed entry shape — only identifiers matter for the existence check. */
interface FeedPoint {
  id?: unknown;
  goldId?: unknown;
}

let feedPromise: Promise<FeedPoint[] | null> | null = null;
let feedFetchedAt = 0;

/** Errors resolve to null — the memo holds the failure for one TTL window,
 * then a later order retries. Fail-open makes that harmless. */
async function fetchFeed(): Promise<FeedPoint[] | null> {
  try {
    const res = await fetch(FEED_URL, { signal: AbortSignal.timeout(FEED_TIMEOUT_MS) });
    if (!res.ok) return null;
    const feed = (await res.json()) as unknown;
    return Array.isArray(feed) && feed.length > 0 ? (feed as FeedPoint[]) : null;
  } catch {
    return null;
  }
}

function loadFeed(): Promise<FeedPoint[] | null> {
  if (!feedPromise || Date.now() - feedFetchedAt > FEED_TTL_MS) {
    feedFetchedAt = Date.now();
    feedPromise = fetchFeed();
  }
  return feedPromise;
}

/**
 * True when the point may stay on the order: found in the feed, the feed
 * was unreachable/empty (fail-open), or the feed's entries carry no
 * identifiers at all (shape drift — a format change must not permanently
 * reject valid points).
 */
export async function glsPointExistsInFeed(
  matchcode: string,
  goldId?: string | null,
): Promise<boolean> {
  if (matchcode === '' && (goldId == null || goldId === '')) return true;
  const feed = await loadFeed();
  if (!feed) return true;
  if (!feed.some((entry) => entry.id != null || entry.goldId != null)) return true;
  return feed.some(
    (entry) =>
      (matchcode !== '' && String(entry.id ?? '') === matchcode) ||
      (goldId != null && goldId !== '' && String(entry.goldId ?? '') === goldId),
  );
}

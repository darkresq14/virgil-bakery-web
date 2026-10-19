import { after } from 'next/server';
import type { CollectionAfterChangeHook } from 'payload';

import { pushOrderToSheet } from '@/utilities/sheetSync';

/**
 * Issue #35 — every created order (site checkout or hand-made in admin)
 * attempts a push to the ops workbook. Never throws: a failed push must not
 * block or fail order creation. Fires on create and again when an admin
 * re-saves a failed order (retry mechanism v1): the workbook dedupes on
 * `idComanda` and replaces quantities, so re-pushing the same order is safe.
 * Updates of synced or never-synced orders never re-push. Outcome is
 * persisted on the order via the DB adapter directly, bypassing hooks and
 * revalidation loops.
 *
 * Issue #41 — the push must not delay the order response either: the workbook
 * script takes 5–10s+ per push, which hung checkout and bred duplicate orders.
 * next/server after() runs the push once the response is on its way; Vercel
 * keeps the function alive for it (maxDuration pinned in vercel.json). Outside
 * a request scope (tests, cron, local API) after() throws — the fallback lets
 * the promise float on the long-lived process instead of blocking the caller.
 */
/** In-flight background pushes — lets tests await completion deterministically. */
const sheetSyncInflight = new Set<Promise<unknown>>();

/** Resolves once every background sheet push triggered so far has settled. */
export function settleSheetSyncs(): Promise<void> {
  return Promise.all([...sheetSyncInflight]).then(() => undefined);
}

export const syncOrderToSheet: CollectionAfterChangeHook = async ({
  doc,
  previousDoc,
  operation,
  collection,
  req,
}) => {
  // Push on create; on update, retry only a previously failed sync (admin
  // re-save of a failed order = the v1 retry mechanism, issue #33 story 13).
  const isFailedRetry = operation === 'update' && previousDoc?.sheetSyncStatus === 'failed';
  if (operation !== 'create' && !isFailedRetry) return doc;

  // Captured before the response ends; `req` itself is stale by the time the
  // callback runs, so the DB adapter is used without it.
  const payloadDb = req.payload;
  const orderId = doc.id;

  const push = (async () => {
    try {
      const outcome = await pushOrderToSheet(doc);

      // Missing env vars: the seam already warned; nothing to persist.
      if (outcome.status === 'skipped') return;

      if (outcome.status === 'failed') {
        console.error(`[orders] Sheet sync failed for order ${orderId}: ${outcome.reason}`);
      }

      await payloadDb.db.updateOne({
        collection: collection.slug,
        id: orderId,
        data: { sheetSyncStatus: outcome.status },
      });
    } catch (error) {
      // Belt and braces — the seam never throws, but order creation is sacred.
      console.error(`[orders] Sheet sync hook error for order ${orderId}:`, error);
    }
  })();

  sheetSyncInflight.add(push);
  const forget = () => sheetSyncInflight.delete(push);
  push.then(forget, forget);

  try {
    after(push);
  } catch {
    // No request scope: float the promise; it settles on the running process.
    void push;
  }

  return doc;
};

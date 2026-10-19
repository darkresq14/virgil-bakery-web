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
 */
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

  try {
    const outcome = await pushOrderToSheet(doc);

    // Missing env vars: the seam already warned; nothing to persist.
    if (outcome.status === 'skipped') return doc;

    if (outcome.status === 'failed') {
      console.error(`[orders] Sheet sync failed for order ${doc.id}: ${outcome.reason}`);
    }

    await req.payload.db.updateOne({
      collection: collection.slug,
      id: doc.id,
      data: { sheetSyncStatus: outcome.status },
      req,
    });

    return { ...doc, sheetSyncStatus: outcome.status };
  } catch (error) {
    // Belt and braces — the seam never throws, but order creation is sacred.
    console.error(`[orders] Sheet sync hook error for order ${doc.id}:`, error);
    return doc;
  }
};

import type { CollectionAfterChangeHook } from 'payload';

import { pushOrderToSheet } from '@/utilities/sheetSync';

/**
 * Issue #35 — every created order (site checkout or hand-made in admin)
 * attempts a push to the ops workbook. Never throws: a failed push must not
 * block or fail order creation. Fires on create only — re-saving an order
 * retries the push safely because the workbook dedupes on `idComanda`, but
 * plain updates never re-push. Outcome is persisted on the order via the DB
 * adapter directly, bypassing hooks and revalidation loops.
 */
export const syncOrderToSheet: CollectionAfterChangeHook = async ({
  doc,
  operation,
  collection,
  req,
}) => {
  if (operation !== 'create') return doc;

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

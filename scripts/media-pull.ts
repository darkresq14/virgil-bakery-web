/**
 * Pull missing media binaries from production into local `public/media`.
 *
 * `db:pull` copies the media *rows* (filenames + URLs) from prod Turso into
 * dev.db, but not the binary files themselves. Any row whose file isn't on
 * disk then 500s in dev (`/api/media/file/<name>` → "File ... is missing on
 * the disk"). This script closes that gap: for every media filename referenced
 * in dev.db (original + sized variants), if the file is absent locally it is
 * fetched from prod's public `/api/media/file/<name>` route and written to
 * `public/media`.
 *
 * Idempotent — already-present files are skipped. Safe to re-run any time.
 *
 * Stopgap only (see ADR 0004): the proper fix is migrating prod media into
 * Vercel Blob so dev renders straight from blob URLs after `db:pull`.
 *
 * Usage:
 *   PROD_SITE_URL=https://your-prod-domain.vercel.app pnpm media:pull
 */

import { createWriteStream, existsSync } from 'node:fs';
import { mkdir } from 'node:fs/promises';
import { dirname, join } from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { pipeline } from 'node:stream/promises';

export interface MediaPullOptions {
  prodSiteUrl?: string;
  devDbPath?: string;
  mediaDir?: string;
  concurrency?: number;
  fetchImpl?: typeof fetch;
  fs?: {
    existsSync: typeof existsSync;
    mkdir: typeof mkdir;
  };
}

const SIZE_COLUMNS = [
  'filename',
  'sizes_thumbnail_filename',
  'sizes_og_filename',
  'sizes_card_filename',
] as const;

export async function main(options?: MediaPullOptions): Promise<void> {
  const prodSiteUrl = (options?.prodSiteUrl ?? process.env.PROD_SITE_URL ?? '').replace(/\/+$/, '');

  if (!prodSiteUrl) {
    throw new Error(
      'PROD_SITE_URL is required (e.g. https://virgil-bakery-web.vercel.app). Pass it as an env var or MediaPullOptions.prodSiteUrl.',
    );
  }
  if (!/^https?:\/\//.test(prodSiteUrl)) {
    throw new Error(`PROD_SITE_URL must include the protocol (http/https). Got: ${prodSiteUrl}`);
  }

  const devDbPath = options?.devDbPath ?? 'dev.db';
  const mediaDir = options?.mediaDir ?? 'public/media';
  const concurrency = options?.concurrency ?? 6;
  const doFetch = options?.fetchImpl ?? fetch;
  const fsOps = options?.fs ?? { existsSync, mkdir };

  const db = new DatabaseSync(devDbPath, { readOnly: true });

  const rows = db.prepare(`SELECT ${SIZE_COLUMNS.join(', ')} FROM media`).all() as Record<
    string,
    unknown
  >[];

  const wanted = new Set<string>();
  for (const row of rows) {
    for (const col of SIZE_COLUMNS) {
      const name = row[col];
      if (typeof name === 'string' && name.length > 0) wanted.add(name);
    }
  }
  db.close();

  const missing = [...wanted].filter((name) => !fsOps.existsSync(join(mediaDir, name)));
  console.log(
    `media:pull → ${wanted.size} filenames referenced, ${missing.length} missing on disk. Source: ${prodSiteUrl}`,
  );

  if (missing.length === 0) {
    console.log('Nothing to fetch — all media files present locally.');
    return;
  }

  let fetched = 0;
  let failed = 0;
  const failures: { name: string; status: number }[] = [];

  // Simple bounded-concurrency worker pool.
  let cursor = 0;
  async function worker(workerId: number): Promise<void> {
    while (cursor < missing.length) {
      const index = cursor++;
      const name = missing[index];
      const dest = join(mediaDir, name);
      const url = `${prodSiteUrl}/api/media/file/${encodeURIComponent(name)}`;

      try {
        const res = await doFetch(url);
        if (!res.ok || !res.body) {
          failed++;
          failures.push({ name, status: res.status });
          console.log(`  [${workerId}] ✗ ${name} → HTTP ${res.status}`);
          continue;
        }

        await fsOps.mkdir(dirname(dest), { recursive: true });
        const stream = createWriteStream(dest);
        // @ts-expect-error — web ReadableStream pipes fine to a Node writable under Node fetch.
        await pipeline(res.body, stream);
        fetched++;
        console.log(`  [${workerId}] ✓ ${name}`);
      } catch (err) {
        failed++;
        failures.push({ name, status: 0 });
        console.log(`  [${workerId}] ✗ ${name} → ${(err as Error).message}`);
      }
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, missing.length) }, (_, i) => worker(i)),
  );

  console.log(`\nDone. Fetched: ${fetched}. Failed: ${failed}.`);
  if (failures.length > 0) {
    console.log('Failures (likely absent in prod too):');
    for (const f of failures) console.log(`  ${f.status || 'ERR'}  ${f.name}`);
  }
}

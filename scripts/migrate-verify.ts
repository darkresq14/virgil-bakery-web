// Local migration pre-flight: replay real migration SQL against a seeded
// SQLite fixture the way Payload runs migrations in prod — same driver
// (@libsql/client), same per-migration transaction wrapping, foreign keys
// enforced — then assert nothing was silently lost.
//
// Why this exists: 20261122_084906_product_weight_grams rebuilt products via
// DROP TABLE guarded by `PRAGMA foreign_keys=OFF`, which SQLite silently
// ignores inside a transaction, so live FK actions orphaned every product
// version and cascade-deleted tags/characteristics/gallery in prod
// (docs/retrospectives/2026-11-22-products-fk-cascade.md, ADR 0004).
// Dev push mode never executes migration SQL, so nothing caught it.
//
// Usage:
//   pnpm migrate:verify                     # verify the newest migration
//   pnpm migrate:verify <name> [<name>...]  # verify specific migrations, in order
//   pnpm migrate:verify --file <path.ts>    # verify an arbitrary migration file
//                                             (e.g. one extracted from git history)
//   pnpm migrate:verify --keep              # keep the fixture DB for inspection
//
// Name is a filename prefix: `20261122_084906` matches
// `20261122_084906_product_weight_grams`. Exits 1 if any assertion fails.

import { mkdtempSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { basename, isAbsolute, join } from 'node:path';
import { pathToFileURL } from 'node:url';
import { type Client, createClient } from '@libsql/client';

const MIGRATIONS_DIR = 'src/migrations';

// Tables the fixture seeds; every seeded row must survive every migration.
const SURVIVAL_TABLES = [
  'products',
  '_products_v',
  'products_tags',
  'products_characteristics',
  'products_gallery',
  '_products_v_version_tags',
  '_products_v_version_characteristics',
  '_products_v_version_gallery',
] as const;

// --- fixture: representative products FK graph (schema comes from the
// --- initial migration; only rows live here) --------------------------------
const SEED: Array<[table: string, columns: string, rows: string[]]> = [
  // 5 products: parseable weights, comma decimal, plain number, unparseable, draft
  [
    'products',
    '("id", "name", "weight", "price", "slug", "_status")',
    [
      "(1, 'Pâine albă', '800g', 12, 'paine-alba', 'published')",
      "(2, 'Biscuiți cu migdale', '1,5g', 9, 'biscuiti-migdale', 'published')",
      "(3, 'Cozonac floare', '650g', 25, 'cozonac-floare', 'published')",
      "(4, 'Pachet promo', 'Pachet', 30, 'pachet-promo', 'published')",
      "(5, 'Pâine cu seară', '-', 0, 'paine-cu-seara', 'draft')",
    ],
  ],
  // 8 versions: two for product 1 (draft latest + published), rest one each
  [
    '_products_v',
    '("id", "parent_id", "version_name", "version_weight", "version_slug", "version__status", "latest")',
    [
      "(101, 1, 'Pâine albă', '800g', 'paine-alba', 'published', 0)",
      "(102, 1, 'Pâine albă', '800g', 'paine-alba', 'draft', 1)",
      "(103, 2, 'Biscuiți cu migdale', '1,5g', 'biscuiti-migdale', 'published', 1)",
      "(104, 3, 'Cozonac floare', '650g', 'cozonac-floare', 'published', 1)",
      "(105, 4, 'Pachet promo', 'Pachet', 'pachet-promo', 'published', 1)",
      "(106, 5, 'Pâine cu seară', '-', 'paine-cu-seara', 'draft', 1)",
      "(107, 3, 'Cozonac floare', '650g', 'cozonac-floare', 'published', 0)",
      "(108, 2, 'Biscuiți cu migdale', '500', 'biscuiti-migdale', 'published', 0)",
    ],
  ],
  [
    'products_tags',
    '("order", "parent_id", "value", "id")',
    ["(0, 1, 'proaspăt', 1)", "(0, 2, 'fără zahăr', 2)", "(0, 3, 'de post', 3)"],
  ],
  [
    'products_characteristics',
    '("_order", "_parent_id", "id", "value")',
    ["(0, 1, 'char-a', 'măcinat la 1200g')", "(0, 3, 'char-b', 'copt pe vatră')"],
  ],
  [
    'products_gallery',
    '("_order", "_parent_id", "id", "image_id")',
    ["(0, 1, 'gal-a', NULL)", "(1, 1, 'gal-b', NULL)", "(0, 3, 'gal-c', NULL)"],
  ],
  [
    '_products_v_version_tags',
    '("order", "parent_id", "value", "id")',
    ["(0, 101, 'proaspăt', 201)", "(0, 102, 'proaspăt', 202)", "(0, 104, 'de post', 203)"],
  ],
  [
    '_products_v_version_characteristics',
    '("_order", "_parent_id", "id", "value", "_uuid")',
    ["(0, 101, 301, 'măcinat la 1200g', 'u1')", "(0, 104, 302, 'copt pe vatră', 'u2')"],
  ],
  [
    '_products_v_version_gallery',
    '("_order", "_parent_id", "id", "image_id", "_uuid")',
    ["(0, 101, 401, NULL, 'u3')", "(1, 101, 402, NULL, 'u4')"],
  ],
];

// --- drizzle SQL serializer: migrations call db.run(sql`...`); flatten the
// --- chunk tree to a statement string. Params are rejected — the fixture
// --- flow never needs them and silent skipping would hide data. -----------
type Chunk = { value?: unknown; queryChunks?: Chunk[] };
function serializeSql(chunk: Chunk, label: string): string {
  if (typeof chunk === 'string') return chunk;
  if (Array.isArray(chunk.value) && chunk.value.every((v) => typeof v === 'string')) {
    return chunk.value.join('');
  }
  if (Array.isArray(chunk.queryChunks)) {
    return chunk.queryChunks.map((c) => serializeSql(c, label)).join('');
  }
  throw new Error(
    `migrate:verify shim: parametrized or unsupported SQL chunk in ${label} — bind params are not supported by the fixture runner`,
  );
}

function makeDbShim(client: Client, label: string) {
  return {
    run: async (chunk: Chunk) => {
      const stmt = serializeSql(chunk, label).trim();
      if (!stmt) return;
      await client.execute(stmt);
    },
  };
}

async function runMigrationFile(client: Client, file: string): Promise<void> {
  const abs = isAbsolute(file) ? file : join(process.cwd(), file);
  const mod = await import(pathToFileURL(abs).href);
  if (typeof mod.up !== 'function') {
    throw new Error(`${file} has no exported up()`);
  }
  // Same shape as Payload's migrate: one transaction per migration
  // (@payloadcms/drizzle migrate.js: initTransaction → up → commit). This is
  // also what makes PRAGMA foreign_keys a silent no-op inside migrations —
  // the exact trap this harness exists to catch.
  await client.execute('BEGIN');
  try {
    await mod.up({ db: makeDbShim(client, file), payload: null, req: null });
    await client.execute('COMMIT');
  } catch (err) {
    await client.execute('ROLLBACK').catch(() => {});
    throw err;
  }
}

async function listMigrations(): Promise<string[]> {
  return readdirSync(join(process.cwd(), MIGRATIONS_DIR))
    .filter((f) => f.endsWith('.ts') && f !== 'index.ts')
    .map((f) => f.replace(/\.ts$/, ''))
    .sort();
}

function resolveTargets(args: string[], available: string[]): string[] {
  if (args.length === 0) return [available[available.length - 1]];
  return args.map((prefix) => {
    const matches = available.filter(
      (m) => m === prefix || m.startsWith(`${prefix}_`) || m.startsWith(prefix),
    );
    const unique = [...new Set(matches)];
    if (unique.length === 0) {
      throw new Error(`No migration matches "${prefix}". Available:\n  ${available.join('\n  ')}`);
    }
    if (unique.length > 1) {
      throw new Error(`"${prefix}" matches multiple migrations:\n  ${unique.join('\n  ')}`);
    }
    return unique[0];
  });
}

async function snapshotPks(client: Client, table: string): Promise<Set<string>> {
  const rows = await client.execute(`SELECT "id" AS v FROM "${table}"`);
  return new Set(rows.rows.map((r) => String(r.v)));
}

async function main(): Promise<void> {
  const keep = process.argv.includes('--keep');
  const rawArgs = process.argv.slice(2).filter((a) => a !== '--keep');
  const available = await listMigrations();

  // --file <path>: verify an arbitrary migration file (e.g. extracted from
  // git history with `git show <ref>:<path>`). Positioned by its basename.
  let fileOverride: string | null = null;
  const fileIdx = rawArgs.indexOf('--file');
  if (fileIdx !== -1) {
    fileOverride = rawArgs[fileIdx + 1];
    if (!fileOverride) throw new Error('--file requires a path');
    rawArgs.splice(fileIdx, 2);
  }

  const targets = fileOverride
    ? [basename(fileOverride).replace(/\.ts$/, '')]
    : resolveTargets(rawArgs, available);
  const sortedTargets = [...targets].sort();
  // Position of the first target decides the preamble; --file targets whose
  // name is not in the index run last. The initial migration always belongs
  // to the preamble — the seed needs its schema.
  const firstName = sortedTargets[0];
  let firstIdx = available.indexOf(firstName);
  if (firstIdx === -1) firstIdx = available.length;
  firstIdx = Math.max(firstIdx, 1);
  const preamble = available.slice(0, firstIdx);
  const effectiveTargets = sortedTargets.filter((n) => !preamble.includes(n));
  const targetFiles = new Map<string, string>(
    effectiveTargets.map((n) => [
      n,
      n === firstName && fileOverride ? fileOverride : `${MIGRATIONS_DIR}/${n}.ts`,
    ]),
  );
  if (effectiveTargets.length === 0) {
    throw new Error('Nothing to verify: target(s) are all part of the schema baseline');
  }

  const dir = mkdtempSync(join(tmpdir(), 'migrate-verify-'));
  const dbUrl = `file:${join(dir, 'fixture.db').split('\\').join('/')}`;
  const client = createClient({ url: dbUrl });

  try {
    const fkDefault = await client.execute('PRAGMA foreign_keys');
    if (String(fkDefault.rows[0]?.foreign_keys) !== '1') {
      await client.execute('PRAGMA foreign_keys=ON');
    }

    for (const name of preamble) {
      await runMigrationFile(client, `${MIGRATIONS_DIR}/${name}.ts`);
    }
    console.log(`preamble: ${preamble.length} migration(s) applied (schema baseline)`);

    for (const [table, columns, rows] of SEED) {
      for (const row of rows) {
        try {
          await client.execute(`INSERT INTO "${table}" ${columns} VALUES ${row}`);
        } catch (err) {
          throw new Error(`seed INSERT failed for ${table}: ${row}\n${String(err)}`);
        }
      }
    }
    console.log(`fixture: seeded ${SEED.length} tables (products FK graph)`);

    const before = new Map<string, Set<string>>();
    for (const table of SURVIVAL_TABLES) {
      before.set(table, await snapshotPks(client, table));
    }
    const orphanBaseline = Number(
      (await client.execute('SELECT count(*) AS n FROM "_products_v" WHERE "parent_id" IS NULL'))
        .rows[0].n,
    );

    for (const name of effectiveTargets) {
      console.log(
        `verify: applying ${name}${fileOverride && name === firstName ? ' (--file)' : ''}`,
      );
      await runMigrationFile(client, targetFiles.get(name));
    }

    // If a migration managed to switch FK enforcement off (outside a
    // transaction), the fixture diverges from prod semantics — say so.
    const fkAfter = String((await client.execute('PRAGMA foreign_keys')).rows[0]?.foreign_keys);

    const problems: string[] = [];

    const fkViolations = await client.execute('PRAGMA foreign_key_check');
    if (fkViolations.rows.length > 0) {
      problems.push(
        `foreign_key_check reported ${fkViolations.rows.length} violation(s): ${JSON.stringify(fkViolations.rows.slice(0, 5))}`,
      );
    }

    const losses: string[] = [];
    for (const table of SURVIVAL_TABLES) {
      const after = await snapshotPks(client, table);
      const seeded = [...(before.get(table) ?? [])];
      const missing = seeded.filter((pk) => !after.has(pk));
      if (missing.length > 0) {
        losses.push(
          `${table}: ${missing.length}/${seeded.length} seeded row(s) GONE (pk ${missing.slice(0, 5).join(', ')})`,
        );
      }
    }
    if (losses.length > 0) problems.push(`seeded rows deleted:\n  ${losses.join('\n  ')}`);

    const orphans = Number(
      (await client.execute('SELECT count(*) AS n FROM "_products_v" WHERE "parent_id" IS NULL'))
        .rows[0].n,
    );
    if (orphans > orphanBaseline) {
      problems.push(
        `orphans: ${orphans} _products_v row(s) with NULL parent_id (baseline ${orphanBaseline})`,
      );
    }

    if (fkAfter !== '1') {
      problems.push(
        `WARNING: foreign_keys enforcement is OFF after the run (${fkAfter}) — this diverges from prod (the pragma is a no-op inside migration transactions); results may be optimistic`,
      );
    }

    console.log('');
    if (problems.length > 0) {
      console.error('❌ DATA-LOSS RISK — migration(s) flagged:');
      for (const name of effectiveTargets) console.error(`  - ${name}`);
      console.error('');
      for (const p of problems) console.error(`  ${p}`);
      console.error('');
      console.error('See docs/adr/0004-database-topology-and-migrations.md (known pitfall) and');
      console.error(
        'docs/retrospectives/2026-11-22-products-fk-cascade.md for the incident this guards against.',
      );
      process.exitCode = 1;
    } else {
      console.log(
        `✅ OK — ${effectiveTargets.join(', ')}: no seeded rows lost, no orphans, FK integrity clean`,
      );
    }
    if (keep) console.log(`fixture kept at: ${join(dir, 'fixture.db')}`);
  } finally {
    client.close();
    if (!keep) {
      // Windows: the libsql file lock can outlive close() by a few ms — best effort.
      for (let i = 0; i < 3; i++) {
        try {
          rmSync(dir, { recursive: true, force: true });
          break;
        } catch {
          await new Promise((r) => setTimeout(r, 150));
        }
      }
    }
  }
}

await main();

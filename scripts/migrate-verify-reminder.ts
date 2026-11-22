// Soft pre-push reminder for pushed Payload migrations.
//
// Invoked by Lefthook's pre-push hook with {pushed_files}. Never blocks
// (always exits 0). Migrations reach production via the Vercel build's
// `payload migrate` — dev push mode never executes their SQL locally, so a
// destructive migration can ship unexercised (see ADR 0004 known pitfall and
// docs/retrospectives/2026-11-22-products-fk-cascade.md).
//
// Reminds to run `pnpm migrate:verify`, which replays migration SQL against
// a seeded SQLite fixture the way prod runs it (transaction-wrapped, FKs
// enforced) and fails loudly on silent data loss.

export {};

const MIGRATION_PATTERN = /^src\/migrations\/[^/]+\.ts$/;

function main(): void {
  const pushed = process.argv.slice(2);
  if (pushed.length === 0) return;

  const migrations = pushed.filter((f) => MIGRATION_PATTERN.test(f));
  if (migrations.length === 0) return;

  const names = migrations
    .map((f) => `     - ${f.replace(/^src\/migrations\//, '').replace(/\.ts$/, '')}`)
    .join('\n');

  console.error('\n⚠️  Migration(s) about to be pushed:');
  console.error(names);
  console.error('\n   These will run against production during the Vercel build.');
  console.error('   Replay them locally first — catches silent FK-cascade data loss:');
  console.error('     pnpm migrate:verify <name>');
  console.error('\n   See ADR 0004 (known pitfall) if the SQL contains DROP TABLE on a');
  console.error('   table with inbound foreign keys.\n');
}

main();

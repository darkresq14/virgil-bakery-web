// Soft pre-commit reminder for Payload schema changes.
//
// Invoked by Lefthook with the staged files matching `src/**/*.{ts,tsx}`.
// Never blocks (always exits 0). Prints a tailored message when a
// schema-bearing file is staged, and adjusts it if a migration is already
// staged. See CLAUDE.md > Schema change workflow.

const SCHEMA_PATTERNS: RegExp[] = [
  /^src\/payload\.config\.ts$/,
  /^src\/plugins\/index\.ts$/,
  /^src\/fields\/[^/]+\.ts$/,
  /^src\/collections\/[^/]+\.ts$/,
  /^src\/collections\/[^/]+\/index\.ts$/,
  /^src\/(Header|Footer|SiteConfig|Homepage)\/config\.ts$/,
  /^src\/blocks\/[^/]+\/config\.ts$/,
];

const MIGRATION_PATTERN = /^src\/migrations\//;

function main(): void {
  const staged = process.argv.slice(2);
  if (staged.length === 0) return;

  const schemaFiles = staged.filter((f) => SCHEMA_PATTERNS.some((p) => p.test(f)));
  if (schemaFiles.length === 0) return;

  const migrations = staged.filter((f) => MIGRATION_PATTERN.test(f));
  const list = (files: string[]) => files.map((f) => `     - ${f}`).join('\n');

  if (migrations.length > 0) {
    console.error('\n✅ Payload schema file(s) changed and a migration is already staged:');
    console.error(`   schema:\n${list(schemaFiles)}`);
    console.error(`   migration:\n${list(migrations)}`);
    console.error('\n   Assuming handled. If the staged migration is for a DIFFERENT change,');
    console.error('   also run `pnpm payload migrate:create <name>` for this one.\n');
    return;
  }

  console.error('\n⚠️  Payload schema file(s) changed but NO migration is staged:');
  console.error(list(schemaFiles));
  console.error(
    '\nIf schema-affecting (added/removed/renamed fields, type, relationTo, dbName, indexes):',
  );
  console.error('  1. Run:  pnpm payload migrate:create <descriptive_name>');
  console.error('  2. Review the generated SQL under src/migrations/');
  console.error('  3. Stage the new migration and commit it together with this change');
  console.error(
    '\nIf the generated SQL is empty/no-op, the change is NOT schema-affecting — discard it.',
  );
  console.error(
    'If this edit is hook / access / admin UI / label-only: no migration needed, ignore this.',
  );
  console.error('\nWorkflow: CLAUDE.md > Schema change workflow\n');
}

main();

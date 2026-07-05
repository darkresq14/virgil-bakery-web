# Claude Code

This project uses the Payload CMS skill at `.claude/skills/payload/`.
Start with `.claude/skills/payload/SKILL.md` for a quick reference, then see `.claude/skills/payload/reference/` for detailed docs.

## Agent skills

### Issue tracker

Issues live in GitHub Issues. Uses the `gh` CLI. See `docs/agents/issue-tracker.md`.

### Triage labels

Using default label vocabulary (needs-triage, needs-info, ready-for-agent, ready-for-human, wontfix). See `docs/agents/triage-labels.md`.

### Domain docs

Single-context layout — one `CONTEXT.md` + `docs/adr/` at the repo root. See `docs/agents/domain.md`.

## Schema change workflow

Production evolves through versioned Payload migrations (see [ADR 0004](docs/adr/0004-database-topology-and-migrations.md)). Dev uses push mode against a local SQLite file; prod runs migrations at build time via `scripts/migrate-guard.ts` (only when `VERCEL_ENV=production`).

**Schema-bearing files:** `src/payload.config.ts`, `src/plugins/index.ts`, `src/fields/*.ts`, `src/collections/*.ts`, `src/collections/*/index.ts`, `src/{Header,Footer,SiteConfig,Homepage}/config.ts`, `src/blocks/*/config.ts`.

When editing any of these:

1. **Decide if the change is schema-affecting.** It is, if it adds/removes/renames fields, or changes `type`, `relationTo`, `dbName`, or `indexes`. It is **not**, if it only touches `admin.*` UI, `hooks`, `access`, `labels`, or runtime logic.
2. **If schema-affecting:** run `pnpm payload migrate:create <descriptive_name>`, review the generated SQL under `src/migrations/`, and commit the migration together with the config change. If the generated SQL is empty/no-op, the change is **not** schema-affecting — discard the migration.
3. **If not schema-affecting:** no migration needed.

A Lefthook `pre-commit` reminder (`scripts/schema-change-reminder.ts`) prints a prompt when schema files are staged. It **does not block**. It detects whether a migration is already staged and adjusts the message. Hooks self-install via the `prepare` script on every `pnpm install`.

If `pnpm install` ever warns that `core.hooksPath` is set (e.g. left over from a prior Husky setup), run `lefthook install --reset-hooks-path` once to clear it. This is repo-local and does not affect other projects on the machine.

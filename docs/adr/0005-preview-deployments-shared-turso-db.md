# Preview deployments on a shared Turso DB with build-time migration canary

ADR 0004 rejected a live backend for Vercel Preview Deployments. Reversing that: preview now runs against a dedicated shared Turso DB, refreshed from prod on PR open, with Payload migrations applied at build time as a canary before prod. The dev/prod split and build-time-migrate pattern from 0004 stand; only the "no preview backend" rejection is overturned.

## Decision

- **Shared preview Turso DB** (`virgil-bakery-web-preview`), stable creds across refreshes. One DB for all open PRs.
- **Refresh = full wipe + replay prod dump** (`turso db export` → restore), verbatim including orders PII. Fires on PR `opened` + `reopened` + manual `workflow_dispatch`. Not on `synchronize` — per-push re-migrate is idempotent via the `payload_migrations` table and needs no wipe.
- **Migrate guard flipped** to include `VERCEL_ENV === 'preview'`. `pnpm ci` runs `payload migrate` on preview builds; a bad migration fails the build before prod sees it.
- **Refresh/build race** handled by the GH Action triggering a Vercel redeploy after restore completes; the initial raced build is accepted as waste.
- **Media read-only on preview.** Blob plugin stays production-gated; no preview blob store. Restored media rows carry prod blob URLs and render via the whitelisted `*.blob.vercel-storage.com` remote pattern. Media `create`/`update`/`delete` denied on preview.
- **Non-idempotent Payload migrations** (generated as-is, not hand-hardened): a half-applied migration cannot re-run in place. Recovery is a `workflow_dispatch` refresh — wipe to prod baseline, retry.
- **Concurrency hazard accepted.** Concurrent PRs share the DB; last-refresh-wins, cosmetic data mismatch only, never silent corruption (the `payload_migrations` table gates re-apply). Escape hatch: per-PR ephemeral DBs (`turso db create virgil-pr-N --from-dump`) if concurrency ever hurts.
- **GDPR deletion lag.** A prod-deleted order lingers in preview until the next refresh. On a real deletion request, run `workflow_dispatch` immediately after deleting from prod. Accepted: the API stays auth-gated (`Orders.read = authenticated`), so preview adds no public leak path beyond prod's own.

## Considered options (rejected)

- **Per-PR ephemeral DB.** Fully isolated, no concurrency hazard, but meaningfully more plumbing (create-on-open, destroy-on-close, per-PR creds). Premature for a solo maintainer with rarely-overlapping PRs. Recorded as the escape hatch.
- **Embedded libSQL replica.** Auto-syncs from prod, but writes forward to the prod primary — the exact hazard ADR 0004 rejected for dev. Only safe for read-only preview use; this project tests the order write flow in preview.
- **CI-side canary (migrate in GH Action, not build).** Full control, no race, but moves migrate authority out of the build and diverges from ADR 0004's build-time-migrate decision. Build-time keeps a single migrate authority.
- **Strip/anonymize orders on refresh.** Kills the Orders-admin QA value; no incremental leak path to justify it. Revisit only if a contributor without prod admin access needs preview access (condition already named in ADR 0004).
- **Persistent preview blob store.** Collects junk over time; existing media renders for free from prod URLs. Not worth the token plumbing.

# ADR 0005: Canonical consolidation, pagination deduplication, and sitemap completeness

## Status

Proposed

## Context

One month after launch, Google Search Console reported **27 of ~39 known URLs as not indexed**, across four reasons. Two of those reasons are structural defects in how the Next.js app emits canonical signals and builds its sitemaps — independent of the site's crawl-budget maturity. This ADR covers the fixable defects; the other two reasons are not structural and are handled outside this ADR.

### Structural defects (in scope)

1. **Duplicate without user-selected canonical.** `/posts/page/1` is a live duplicate of `/posts`: both return HTTP 200 with identical content, and neither emits a `<link rel="canonical">`. The pagination route's `generateStaticParams` emits page 1 even when `totalPages === 1`, so the duplicate is statically generated and discoverable.
2. **Listing routes lack self-canonicals.** `/produse` and `/posts` declare only `title`/`description` metadata — no `alternates.canonical`. The detail routes (products, posts, `[slug]` pages, and the homepage) already self-canonicalize via `@payloadcms/plugin-seo`'s `generateURL`, so the gap is confined to the two hand-written listing routes and the pagination route.
3. **Sitemap is incomplete and fragile.** The homepage `/` is served from the Homepage global rather than the `pages` collection, so `pages-sitemap.xml` omits it — the canonical entry URL is absent from every sitemap. Separately, the three sitemap route handlers each reimplement base-URL resolution inline and omit the `https://` scheme on the `VERCEL_PROJECT_PRODUCTION_URL` branch. Sitemaps render correct absolute URLs today only because `NEXT_PUBLIC_SERVER_URL` happens to be set; that is a latent regression one missing env var away.
4. **Pagination links are not crawlable.** The `Pagination` component drives navigation with `onClick` handlers and `router.push` rather than real `<a href>`, so deeper paginated archive pages (when they eventually exist) are invisible to crawlers that do not execute the click handlers.

### Non-structural reasons (out of scope)

- **"Page with redirect" (7 URLs)** — old WordPress URLs returning 308 to their canonical destinations. Handled correctly; the source URLs are correctly not indexed. No action.
- **"Discovered - currently not indexed" (18 URLs)** — pending crawl on a young, low-authority domain. Crawl-budget maturation, handled via GSC's request-indexing flow, not code.

### Options considered

**Canonical signals on listing/pagination routes:**

1. Hand-add `alternates.canonical` to each listing route's metadata (chosen — matches the existing homepage pattern, ~2 lines per route, explicit).
2. Extend `@payloadcms/plugin-seo`'s `generateURL` to cover listing routes — not applicable; the plugin's `generateURL` fires for collection docs, and listing routes are not collection docs.
3. Introduce a `withCanonical(path)` metadata helper — over-engineering for three routes.

**The `/posts/page/1` duplicate:**

1. Redirect `/posts/page/1` → `/posts` (308) and skip `pageNumber === 1` in `generateStaticParams` (chosen — removes the duplicate URL from the indexable set entirely, consistent with the existing WordPress-redirect strategy in the redirects config).
2. Self-canonicalize `/posts/page/1` to `/posts` and leave it live — weaker signal; leaves a redundant URL crawlable.

**Sitemap base-URL resolution:**

1. Route the three sitemap handlers through the existing `getServerSideURL()` utility, which already correctly prepends the scheme (chosen — kills the latent fragility and DRYs resolution to one place).
2. Leave inline resolution and rely on `NEXT_PUBLIC_SERVER_URL` always being set — preserves the latent regression.

**Pagination crawlability:**

1. Render real `<a href>` links (Next `<Link>`) and keep client-side navigation as progressive enhancement (chosen — crawlable by default, SPA feel preserved for JS clients).
2. Leave `onClick`-only navigation — non-crawlable; rejected.

## Decision

1. **Self-canonicalize every indexable route.** Add `alternates.canonical` to the products listing, posts listing, and posts pagination routes so every indexable URL emits a self-referential `<link rel="canonical">`. This closes the gap left by the plugin-seo `generateURL`, which only covers collection docs.
2. **Eliminate the `/posts/page/1` duplicate.** Add a permanent redirect `/posts/page/1` → `/posts` to the redirects config (alongside the existing WordPress redirects), and start the pagination route's `generateStaticParams` loop at page 2 so the duplicate is neither generated nor crawlable.
3. **Make the sitemap complete and scheme-correct.** Add the homepage `/` to `pages-sitemap.xml` (the Homepage global has no collection doc to emit it). Route all three sitemap handlers through `getServerSideURL()` for base-URL resolution, retiring the inline scheme-less fallback.
4. **Make pagination crawlable.** Convert the `Pagination` component to render real anchor-based links (`<a href>` / Next `<Link>`) with client-side navigation kept as progressive enhancement, so paginated archive pages are discoverable without executing click handlers.

## Consequences

### Positive

- **Removes the one "Duplicate without user-selected canonical" GSC flag** at its source, and prevents the listing routes from becoming the next one.
- **Self-canonicals everywhere** remove ambiguity for Google's canonical selection across the whole site, not just the flagged URL.
- **The homepage is represented in the sitemap**, signalling its priority and giving crawlers the canonical entry URL.
- **The sitemap no longer depends on `NEXT_PUBLIC_SERVER_URL` being set** to produce valid absolute URLs — the scheme is always resolved through `getServerSideURL()`.
- **Pagination is crawlable**, so future archive growth (more posts → multiple pages) is indexable by default.

### Negative

- **One more redirect to maintain** (`/posts/page/1`). Negligible; it lives in the same config as the WordPress redirects and follows the same pattern.
- **Pagination becomes a full page load when JavaScript is unavailable.** Acceptable — it is the crawlable fallback, and the posts archive carries no client state that a full load would lose.
- **The homepage `lastmod` is omitted** (as it already is for the `/posts` listing entry), because the Homepage global exposes no honest modified-date. Stamping build time would make it look perpetually fresh.

### Risks

- **Internal links to `/posts/page/1`.** If any internal link currently points at page 1, it now hits a redirect. A repo-wide check should confirm none exist; the Pagination component itself starts page numbering at the current page and only emits `> 1` links, so this is low risk.
- **Canonical changes can briefly re-shuffle indexing.** Adding self-canonicals where none existed is a consolidation signal, not a URL change, so the risk of a temporary drop is minimal.

## Further Notes

The two non-structural GSC reasons are intentionally excluded: "Page with redirect" needs no action, and "Discovered - currently not indexed" is a crawl-budget matter handled through GSC's request-indexing flow once the structural fixes are deployed.

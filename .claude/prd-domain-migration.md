## Problem Statement

The bakery's new Next.js site (painecumaiabyvirgil.ro) is ready, but the old WordPress site (painecumaya-byvirgil.ro) still holds all the Google-indexed content, search authority, and organic traffic. A crawl of the old site identified 31 indexed URLs, but the current redirect configuration only covers ~20 of them — and several have multi-hop chains that bleed PageRank. Before switching the domain, every indexed URL must resolve to a correct page on the new site via a single-hop redirect chain (domain-level 308 + path-level 301). Additionally, Google Search Console verification, Google Analytics 4, and canonical URL correctness are all missing or unverified.

## Solution

Complete all pre-migration SEO and redirect work so that when the old domain is pointed to Vercel as a redirect domain, Google transfers maximum authority to the new domain with zero 404s and minimal redirect chain loss. This involves three code changes (redirect gaps, GSC verification, GA4 integration) and a checklist of external configuration steps (Vercel domain setup, GSC properties, DNS, Change of Address).

## User Stories

1. As a site owner, I want every Google-indexed URL from the old WordPress site to 301-redirect to its equivalent on the new site, so that no visitor or crawler ever hits a 404 after migration.
2. As a site owner, I want all redirect chains flattened to a single hop (308 domain + 301 slug), so that I preserve maximum PageRank during the domain migration.
3. As a site owner, I want `/paine-cu-nuca` to redirect to `/produse/paine-cu-nuca`, so that this indexed product page doesn't lose its search authority.
4. As a site owner, I want `/maia-de-17-ani-analizata-healthferm` to redirect to `/posts/17-ani-de-maia`, so that this indexed blog post resolves correctly.
5. As a site owner, I want `/despre-painea-cu-maia-repetitie-si-lucruri-care-nu-se-invata-din-retete` to redirect to the correct new blog post, so that this indexed page doesn't 404.
6. As a site owner, I want `/blog-vechi` to redirect to `/posts`, so that this indexed archive page resolves to the blog listing.
7. As a site owner, I want `/paine-integrala` and `/paine-mixta` to redirect directly to their new product pages without going through the intermediate WordPress redirects, so that I avoid 3-hop chains.
8. As a site owner, I want all old WordPress tag URLs (`/tag/*`) to redirect to `/posts`, so that tag archive pages land on the blog listing instead of 404ing.
9. As a site owner, I want all old WordPress category URLs (`/category/*`) to redirect to `/posts`, so that category archive pages land on the blog listing instead of 404ing.
10. As a site owner, I want the old WordPress author URL (`/author/*`) to redirect to the homepage, so that author archive pages don't 404.
11. As a site owner, I want the blog redirect in redirects.ts to match the actual live URL slugs (with the correct suffixes), so that the redirect actually fires when Google crawls.
12. As a site owner, I want Google Search Console verification meta tag in the layout, so that I can verify ownership of the new domain and submit sitemaps.
13. As a site owner, I want Google Analytics 4 installed on the new site, so that I have full traffic analytics and Google's ranking signals from day one.
14. As a site owner, I want the GA4 measurement ID to be configurable via environment variable, so that I don't hardcode credentials in the codebase.
15. As a site owner, I want `NEXT_PUBLIC_SERVER_URL` set to `https://painecumaiabyvirgil.ro` in production, so that all canonical URLs, sitemaps, and OG tags reference the correct domain after migration.
16. As a site owner, I want the existing sitemap routes verified to produce correct URLs under the new domain, so that Google indexes the right canonical URLs.
17. As a site owner, I want a complete pre-migration checklist documented, so that I can verify every step before flipping the DNS switch.
18. As a site owner, I want the Google Search Console Change of Address tool used after migration, so that Google transfers authority from the old domain to the new domain.
19. As a site owner, I want to submit all three sitemaps (pages, products, posts) to GSC for the new domain, so that Google discovers and indexes every page quickly.
20. As a site owner, I want to add the old domain (painecumaya-byvirgil.ro) as a GSC property too, so that I can monitor redirect errors on the old domain after migration.
21. As a site owner, I want Vercel configured with painecumaya-byvirgil.ro as a redirect domain to painecumaiabyvirgil.ro, so that every request to the old domain permanently redirects to the new one.
22. As a site owner, I want DNS for painecumaya-byvirgil.ro pointing to Vercel, so that the old domain actually reaches the Vercel redirect.
23. As a developer, I want to verify the full redirect chain for every old URL in the CSV (domain 308 + path 301) resolves to a 200 OK page on the new site, so that I'm confident no paths are broken.

## Implementation Decisions

### Module 1: Redirect Gap Fix — redirects.ts

The current redirects.ts is missing 5 specific old WordPress URLs that return 200 OK on the old site and would 404 after migration. Additionally, 2 URLs need chain flattening and the blog post redirect targets a slug that doesn't exist on the live site.

**Additions to redirects.ts:**

| Source | Destination | Reason |
|--------|-------------|--------|
| `/paine-cu-nuca` | `/produse/paine-cu-nuca` | Missing product, indexed |
| `/maia-de-17-ani-analizata-healthferm` | `/posts/17-ani-de-maia` | Missing blog post, indexed |
| `/despre-painea-cu-maia-repetitie-si-lucruri-care-nu-se-invata-din-retete` | `/posts/17-ani-de-maia` | Missing blog post, indexed (same post, different slug) |
| `/blog-vechi` | `/posts` | Missing page, indexed |
| `/paine-integrala` | `/produse/paine-integrala` | Chain flattening (skip -cu-maia hop) |
| `/paine-mixta` | `/produse/paine-mixta` | Chain flattening (skip -cu-maia hop) |

**Fix existing redirect:** The slug `/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu` in redirects.ts targets a URL that doesn't exist on the live site (missing -2 suffix on WordPress). The actual WordPress redirect chain is from `...-tarziu-2` to `maia-de-17-ani-analizata-healthferm`. Since both of those are now added above, the existing entry can stay for safety but the -2 variant should also be added explicitly.

**Catch-all archive redirects:**

| Pattern | Destination | Reason |
|---------|-------------|--------|
| `/tag/:slug*` | `/posts` | 7 tag archive pages indexed |
| `/category/:slug*` | `/posts` | 1 category archive page indexed |
| `/author/:slug*` | `/` | 1 author archive page indexed |

Note: `/cum-comand` does NOT need a path-level redirect because the new site has the same slug at `/cum-comand`. The domain-level 308 redirect handles it.

### Module 2: Google Search Console Verification — layout.tsx

Add a verification field to the metadata export in the root frontend layout. The Google verification code will be set via environment variable to avoid committing secrets.

```
metadata.verification.google = process.env.NEXT_PUBLIC_GSC_VERIFICATION || ''
```

This allows ownership verification for both the old and new domain properties in GSC.

### Module 3: Google Analytics 4 — layout.tsx + package.json

Install `@next/third-parties` and add the GoogleAnalytics component inside the body in the frontend layout. The GA4 measurement ID will come from an environment variable.

```tsx
import { GoogleAnalytics } from '@next/third-parties/react'
// Inside <body>:
<GoogleAnalytics gaId={process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID || ''} />
```

The component renders conditionally — if the env var is empty, it renders nothing (safe for dev/local).

### Module 4: Environment Configuration for New Domain

The `NEXT_PUBLIC_SERVER_URL` environment variable must be set to `https://painecumaiabyvirgil.ro` in Vercel production. This variable controls:
- Canonical URLs in generateMeta.ts
- Sitemap URLs in all three sitemap routes
- Open Graph URLs
- The metadataBase in root layout metadata

No code change needed — this is a Vercel environment variable update. But it should be verified that setting this value causes all canonical/sitemap/OG URLs to reference painecumaiabyvirgil.ro correctly.

### Module 5: Vercel Domain Redirect Configuration (External)

This is an external configuration step, not a code change:
1. Add painecumaiabyvirgil.ro as the primary domain on the Vercel project
2. Add painecumaya-byvirgil.ro as a redirect domain on the same Vercel project
3. Configure DNS for both domains to point to Vercel

The redirect domain feature sends a 308 permanent redirect for every request to the old domain, preserving the request path. Combined with the path-level 301 redirects in redirects.ts, this creates the correct chain: old-domain/old-slug -> 308 -> new-domain/old-slug -> 301 -> new-domain/new-slug.

### Module 6: Google Search Console Post-Migration (External)

External checklist after the domain switch:
1. Add painecumaiabyvirgil.ro as a GSC property and verify via the meta tag
2. Add painecumaya-byvirgil.ro as a GSC property and verify via the meta tag
3. Submit all 3 sitemaps to the new domain property
4. Use the Change of Address tool in GSC (old domain property -> new domain)
5. Use the URL Inspection tool to request indexing for key pages (home, /produse, /cum-comand, /maiaua-mea)
6. Monitor the Page Indexing report for crawl errors on both properties for 2-4 weeks

## Testing Decisions

### What makes a good test
Tests should verify external behavior (redirect correctness) not implementation details. For each old URL from the CSV, the test should confirm the final destination is a 200 OK page on the new domain with the expected path.

### Modules to test

**Redirect configuration** — the most critical module:
- For every entry in the old-site CSV, assert that the redirect chain resolves correctly
- Verify no 404s for any indexed old URL
- Verify redirect chains are at most 2 hops (308 domain + 301 slug)
- Verify catch-all patterns (/tag/*, /category/*, /author/*) redirect to expected destinations
- Verify the blog post redirect matches the actual live WordPress slug

**Canonical URLs** — verify that with NEXT_PUBLIC_SERVER_URL=https://painecumaiabyvirgil.ro, the generateMeta function produces canonical URLs on the new domain.

**Sitemap URLs** — verify that all three sitemap routes produce URLs under painecumaiabyvirgil.ro.

### Prior art
The project does not currently have automated tests for redirects. These would be new tests. Integration tests using Next.js test utilities or simple HTTP-based tests against a running server would be appropriate.

## Out of Scope

- **Google Business Profile setup** (SEO_IMPROVEMENTS.md item 3) — external configuration, not a code change
- **IndexNow protocol** (item 4) — nice-to-have, not migration-blocking
- **ItemList schema** (item 6) — SEO enhancement, not migration-blocking
- **Author attribution on blog posts** (item 7) — SEO enhancement, not migration-blocking
- **Author pages** (item 8) — new feature, not migration-blocking
- **FAQPage/HowTo schema** (item 9) — new feature, not migration-blocking
- **RSS feed** (item 10) — nice-to-have, not migration-blocking
- **Content migration** (products, testimonials, blog posts) — assumed already complete
- **Media migration** (images to Vercel Blob) — assumed already complete
- **DNS provisioning** — assumed the user controls both domains
- **SSL certificate setup** — handled automatically by Vercel

## Further Notes

### Redirect chain architecture

```
Old URL: painecumaya-byvirgil.ro/paine-mixta-cu-maia
  -> 308 (Vercel domain redirect) -> painecumaiabyvirgil.ro/paine-mixta-cu-maia
  -> 301 (Next.js redirects.ts)  -> painecumaiabyvirgil.ro/produse/paine-mixta
  -> 200 (page renders)
```

### Pre-migration order of operations

1. Code changes: fix redirects.ts, add GSC verification, add GA4
2. Deploy to Vercel (production already on painecumaiabyvirgil.ro)
3. Verify redirects and canonicals on the new domain
4. Add old domain as redirect domain in Vercel
5. Configure DNS for old domain -> Vercel
6. Verify GSC on both domains
7. Submit sitemaps to new domain GSC property
8. Use Change of Address tool in old domain GSC property
9. Monitor for 2-4 weeks

### The CSV data source

The old site crawl (internal_html.csv) contains 31 rows representing all indexed URLs on painecumaya-byvirgil.ro. This is the authoritative list for redirect mapping. The migration plan doc (WORDPRESS_MIGRATION_PLAN.md) has a redirect mapping that predates the crawl data and is less complete — the CSV is the source of truth.

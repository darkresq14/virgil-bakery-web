# SEO Improvements — Backlog

> **Already implemented:** robots.txt, multi-sitemap (pages/products/posts), dynamic meta tags, Open Graph + Twitter Cards, JSON-LD structured data (Bakery, Product, BlogPosting, BreadcrumbList), canonical URLs, web manifest, 301 WordPress redirects, ISR revalidation, Vercel Analytics + Speed Insights, skip-to-content link, `lang="ro"`, `font-display: swap`.

---

## 1. Google Search Console Setup 🔴

**Priority:** Critical — this is how you "force" Google to index your pages.

**Steps (external):**
1. Go to [search.google.com/search-console](https://search.google.com/search-console)
2. Add your production domain as a property
3. Verify ownership — add a meta tag to `src/app/(frontend)/layout.tsx`:
   ```ts
   verification: {
     google: 'your-verification-code-here',
   }
   ```
4. Submit all 3 sitemaps: `pages-sitemap.xml`, `products-sitemap.xml`, `posts-sitemap.xml`
5. Use the **URL Inspection tool** to manually request indexing for key pages (home, `/produse`, individual products)
6. Monitor the **Page Indexing** report for crawl errors

## 2. Google Analytics 4 🔴

**Priority:** High — Vercel Analytics is server-side only; GA4 gives the full picture and contributes to Google's ranking signals.

**Files to modify:** `src/app/(frontend)/layout.tsx`, `package.json`

```bash
pnpm add @next/third-parties
```

```tsx
import { GoogleAnalytics } from '@next/third-parties/react'
// Inside <body>:
<GoogleAnalytics gaId="G-XXXXXXXXXX" />
```

## 3. Google Business Profile 🟡

**Priority:** High for local SEO ("pâine artizanală lângă mine").

**Steps (external):**
1. Claim/create business at [business.google.com](https://business.google.com)
2. Fill in: name, address, phone, hours, photos, menu link, description
3. The existing `Bakery` schema in `schema.ts` should mirror the GBP data (name, address, phone)
4. Consider adding `aggregateRating` and `review` schema once real reviews accumulate
5. Link the website URL in the GBP dashboard back to the site

## 4. IndexNow Protocol (Instant Indexing) 🟡

**Priority:** Medium — pings Google/Bing immediately when content changes instead of waiting for crawls.

**Files to modify:** `src/collections/Products/hooks/revalidateProduct.ts`, `src/collections/Posts/hooks/revalidatePost.ts`, `src/collections/Pages/hooks/revalidatePage.ts`

Add a ping after each revalidation:
```ts
const encodedUrl = encodeURIComponent(`${serverUrl}/${slug}`)
await fetch(`https://api.indexnow.org/indexnow?url=${encodedUrl}&key=YOUR_API_KEY`)
```

## 5. Add `lastmod` to Dynamic Sitemaps 🟡

**Priority:** Medium — Google uses `<lastmod>` dates to prioritize recrawls.

**Files to modify:** `src/app/(frontend)/(sitemaps)/products-sitemap.xml/route.ts`, `posts-sitemap.xml/route.ts`, `pages-sitemap.xml/route.ts`

Ensure each `<url>` entry includes:
```xml
<lastmod>2026-06-01T12:00:00+00:00</lastmod>
```

## 6. ItemList Schema on Product Listing Page

**Files to modify:** `src/app/(frontend)/produse/page.tsx`, `src/utilities/schema.ts`

Add an `ItemList` schema to `/produse` so Google understands the product list and can show rich results (product carousels in SERPs). Each item should reference the individual product URL. Follow the same pattern as `productSchema()` — add an `itemListSchema()` function and render it as a `<script type="application/ld+json">` block.

## 7. Author Attribution on Blog Posts

**Files to modify:** `src/app/(frontend)/posts/[slug]/page.tsx`, possibly `src/heros/PostHero.tsx`

Blog posts already store `populatedAuthors` (from the `populateAuthors` hook) and the `BlogPosting` schema already reads `populatedAuthors[0].name`. But the **public-facing post page doesn't display the author's name**. Add a visible byline (e.g. "de Virgil" or "de [Author Name]") near the post title or in the PostHero. This strengthens E-E-A-T signals.

## 8. Author Pages

**Files to create:** `src/app/(frontend)/autori/[slug]/page.tsx`

Dedicated author pages listing all posts by that author. Each blog post would link to the author page. This creates a stronger E-E-A-T footprint (Google can verify the author as a real person with a body of work). Requires a public-facing author slug or using the user ID.

## 9. FAQPage / HowTo Schema

**Files to modify:** `src/utilities/schema.ts`, relevant page or block components

For bakery-related content pages (e.g. "Cum păstrezi pâinea cu maia proaspătă"), add `FAQPage` or `HowTo` structured data. These qualify for rich results (expandable FAQ snippets in Google). Could be implemented as a new Payload block type (`FAQBlock`) with a `faqSchema()` function, or hard-coded on specific pages.

## 10. RSS Feed for Blog Posts 🟢

**Priority:** Low — helps with content discovery and gives aggregators another way to find posts.

**Files to create:** `src/app/(frontend)/feed.xml/route.ts`

Generate an Atom/RSS feed from published posts. Auto-discovery link should be added to the root layout `<head>`.

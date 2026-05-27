# SEO Improvements — Backlog

## 1. ItemList Schema on Product Listing Page

**File to modify:** `src/app/(frontend)/produse/page.tsx`, `src/utilities/schema.ts`

Add an `ItemList` schema to `/produse` so Google understands the product list and can show rich results (product carousels in SERPs). Each item should reference the individual product URL. Follow the same pattern as `productSchema()` — add an `itemListSchema()` function and render it as a `<script type="application/ld+json">` block.

## 2. Author Attribution on Blog Posts

**Files to modify:** `src/app/(frontend)/posts/[slug]/page.tsx`, possibly `src/heros/PostHero.tsx`

Blog posts already store `populatedAuthors` (from the `populateAuthors` hook) and the `BlogPosting` schema already reads `populatedAuthors[0].name`. But the **public-facing post page doesn't display the author's name**. Add a visible byline (e.g. "de Virgil" or "de [Author Name]") near the post title or in the PostHero. This strengthens E-E-A-T signals.

## 3. Author Pages

**Files to create:** `src/app/(frontend)/autori/[slug]/page.tsx`

Dedicated author pages listing all posts by that author. Each blog post would link to the author page. This creates a stronger E-E-A-T footprint (Google can verify the author as a real person with a body of work). Requires a public-facing author slug or using the user ID.

## 4. FAQPage / HowTo Schema

**Files to modify:** `src/utilities/schema.ts`, relevant page or block components

For bakery-related content pages (e.g. "Cum păstrezi pâinea cu maia proaspătă"), add `FAQPage` or `HowTo` structured data. These qualify for rich results (expandable FAQ snippets in Google). Could be implemented as a new Payload block type (`FAQBlock`) with a `faqSchema()` function, or hard-coded on specific pages.

## 5. Google Business Profile Integration

**External:** Google Business Profile dashboard, `src/utilities/schema.ts`

Ensure the Google Business Profile is claimed, verified, and fully filled out (photos, hours, menu link, description). The existing `Bakery` schema in `schema.ts` should mirror the GBP data (name, address, phone). Consider adding `aggregateRating` and `review` schema once real reviews accumulate. Also link the website URL in the GBP dashboard back to the site.

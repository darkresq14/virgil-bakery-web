# ADR 0003: Keep Vercel Image Optimization with a centralized, slot-based image component

## Status

Proposed

## Context

The site renders all imagery through Next.js `<Image>` (`/_next/image`), optimized at runtime by Vercel. The free tier hit its 5,000/month Image Optimization Transformations cap mid-period, after which additional transforms error — breaking images. Root cause, read from the usage dashboard:

- **`minimumCacheTTL` was at its 60s default.** The optimizer's output cache expired before reuse — *Image Optimization Cache Reads = 0* against 5K transforms and 76K cache writes. Every pageview re-transformed instead of serving from cache, so transforms scaled with traffic rather than catalog size.
- **`qualities: [100]` + `quality={100}`** made every transform maximum-size — no compression benefit, maximal bytes, maximal cache writes.
- **Latent bug:** the `qualities: [100]` allowlist permitted only q=100, but 4 of 5 image call sites rendered `<Image>` with no `quality` prop (default 75) — those requests were being rejected or clamped by the optimizer.

Image rendering was also fragmented across 5 separate `<Image>` call sites (Hero, About, ProductCard, ProductDetail, and the central `ImageMedia`), each with its own quality, `sizes`, and source-selection logic — so there was no single place to enforce a fix or prevent future drift.

Key reframe: **once caching works, transformations scale with catalog size, not traffic.** Fixing the TTL bounds the transform count to (distinct images × requested widths × formats) to warm the cache, then ~0 — a few hundred for ~50 products, regardless of visit volume.

Options considered:

1. **Keep Vercel Image Optimization, configure caching + centralize rendering** (chosen).
2. **Bypass the optimizer** (`unoptimized: true`) and serve Payload's pre-generated upload sizes directly via hand-built srcsets — zero transforms ever, but loses on-the-fly AVIF and granular widths, and requires manual srcset wiring per slot.
3. **Offload media to an external image CDN** (Cloudflare Images / Cloudinary / Bunny) — decouples cost from Vercel entirely, but is a real media migration with a new vendor, unjustified at current scale.
4. **Add Payload upload sizes for hero/detail** (e.g. `large` ~1600, `square` ~800) and regenerate existing uploads — bounds origin fetch for big slots, but with a 31-day TTL the origin-fetch cost (~300MB/mo against a 10GB cap) is negligible, so the migration isn't justified now.
5. **AVIF-only** (`formats: ['image/avif']`) — halves variants, but the 2× warm cost is negligible once caching works and AVIF-only serves raw originals to older browsers; keep the avif+webp default.
6. **Explicit `sizeName` per call site** — least churn, but ties every caller to Payload's storage taxonomy and relies on each future developer picking the right source; weakest against drift.

## Decision

Keep Next.js/Vercel Image Optimization as the image pipeline, and fix it through configuration plus centralization rather than replacing it.

1. **Configure the optimizer** in `next.config.ts`: `minimumCacheTTL: 2678400` (31 days), `qualities: [75]`, `deviceSizes` capped at 1920 (drop 828/2048/3840), leave `formats` at the avif+webp default.
2. **Centralize all image rendering into `ImageMedia`** as a server component — drop the cargo-culted `'use client'` (only `VideoMedia` needs client directives). Migrate Hero, About, ProductCard, ProductDetail, and the generic Card onto it.
3. **Slot-based source selection.** `ImageMedia` takes a `slot` prop (`hero | detail | card | thumbnail`). One internal map owns the Payload source-size per slot: `hero`/`detail` → original (output capped by `deviceSizes`), `card` → the 640 `card` upload size, `thumbnail` → the 300 `thumbnail` upload size. Quality is uniform (75). Payload's upload `imageSizes` are used as **source caps** (max input resolution/crop the optimizer downscales from), not as deliverables.
4. **Keep the existing 3 Payload upload sizes** (`thumbnail` / `card` / `og`). `og` is load-bearing — served as a direct URL in OG `<meta>` tags, which bypass the optimizer entirely.

## Consequences

### Positive
- **Transform cost is bounded by catalog, not traffic.** A few hundred transforms warm the cache once per cycle; subsequent visits are free Cache Reads. The 5K free-tier cap has ample headroom.
- **One enforcement point.** Source selection and quality live in the `ImageMedia` slot map, so the strategy can't silently drift across 5 sites again.
- **Two latent bugs fixed in passing:** the `[100]` allowlist that rejected default-q75 requests, and ProductDetail's 80px thumbnails pulling multi-megabyte originals.
- **No media migration, no new vendor, no new upload sizes.**

### Negative
- **No automated billing tripwire.** A future regression (someone re-breaks caching, or adds a format) could silently grow the bill again. The owner accepted this; centralization is the structural safeguard.
- **Big slots (hero, detail) feed the optimizer the original**, so a cache-miss fetches a multi-megabyte file from Blob. Negligible at 31-day TTL (~300MB/mo), but a real origin-fetch cost that adding upload sizes would eliminate — revisit if Blob Data Transfer approaches its cap.
- **Site stays degraded through the current billing period.** The chosen stopgap is to deploy the fix and accept that cache-miss transforms error until the cycle resets (rather than flipping `unoptimized` temporarily).

### Risks
- **Catalog growth.** Adding many products widens the warm-cost math, but it remains O(catalog), not O(traffic). Only a 10×+ catalog increase would warrant revisiting (at which point option 3 or 4 above become relevant).
- **`deviceSizes` capped at 1920** slightly softens hero imagery on 2× DPR / 4K screens. Acceptable for a photographic background; revisit if visual quality complaints arise.

# Task: Improve the blog (posts) listing page header

**Status:** ready-for-agent
**Scope:** UI / styling, two files, no logic changes.

## Why

The blog listing pages currently render a bare `<h1>Blog</h1>` inside a `prose`
block. The rest of the site uses a polished, on-brand header language — Playfair
Display headings, an uppercase eyebrow label, a warm cream/terracotta palette
(`--primary`, `--secondary`) — so the blog header looks unfinished by comparison.

Replace it with a **centered editorial header on a warm cream band** that matches
the existing section style (see the "Contact" / "Cum funcționează" sections in
`src/app/(frontend)/page.tsx`).

## Files to edit (apply the SAME change to both)

1. `src/app/(frontend)/posts/page.tsx`
2. `src/app/(frontend)/posts/page/[pageNumber]/page.tsx`

This is a Next.js App Router + Payload project. Both pages are **server
components** — keep them server-side (no `'use client'`).

### Replace this exact block

```tsx
      <div className="container mb-16">
        <div className="prose dark:prose-invert max-w-none">
          <h1>Blog</h1>
        </div>
      </div>
```

### With this exact block

```tsx
      <section className="bg-secondary">
        <div className="container py-16 md:py-20 text-center">
          <span className="inline-block text-sm font-sans uppercase tracking-[0.2em] text-primary/60 mb-4">
            De la cuptorul nostru
          </span>
          <h1 className="text-4xl md:text-5xl font-heading mb-4">Blog</h1>
          <p className="text-lg font-sans text-muted-foreground max-w-2xl mx-auto">
            Pâinea cu maia, fermentația lentă și secretele brutăriei artizanale.
          </p>
          <div className="flex items-center justify-center gap-3 mt-8 text-primary/50">
            <span className="block h-px w-10 sm:w-16 bg-current" />
            <span className="inline-block w-1.5 h-1.5 rotate-45 bg-current" />
            <span className="block h-px w-10 sm:w-16 bg-current" />
          </div>
        </div>
      </section>
```

## Design tokens (reuse these — do NOT invent new colors/fonts)

- Headings: `font-heading` (Playfair Display). Body/eyebrow: `font-sans` (Inter).
- Colors: `bg-secondary` (warm cream), `text-primary` (terracotta),
  `text-primary/60`, `text-primary/50`, `text-muted-foreground`.
- The eyebrow class `text-sm font-sans uppercase tracking-[0.2em] text-primary/60`
  is the site's existing pattern.
- The cream band must be **full-bleed** (edge to edge): the
  `<section className="bg-secondary">` is NOT wrapped in `container`; only its
  inner content uses `container`.

## Constraints (important)

- **Keep the `<h1>` text exactly `Blog`**, and keep it an `<h1>` (SEO + matches the
  page metadata title). Do not change the eyebrow or subtitle copy or the Romanian
  diacritics (`ț`, `ă`, `ș`, `î`, `â`).
- **Do NOT wrap the header in `ScrollReveal`.** It is above the fold on a
  `force-static` / SEO-indexed page — animating it hurts LCP. Render it statically.
- Leave everything else in each file unchanged: `force-static`, `revalidate`,
  `generateMetadata`, `generateStaticParams`, the data fetch, `PageClient`,
  `CollectionArchive`, `PageRange`, `Pagination`.
- The page wrapper stays `pt-24 pb-24`; the old `mb-16` is dropped (the section has
  its own vertical padding). Keep the `PageRange` container's `mb-8`.

## Done criteria

- Both blog routes (`/posts` and `/posts/page/[pageNumber]`) show the new centered
  editorial header on a cream band.
- No build / type errors. Run the repo's lint + typecheck (see `package.json`
  scripts) and fix anything you introduce.
- Report the exact diff applied and the verification commands + their results.

# Pâine cu Maia — Final Implementation Plan

## Context

Migrate painecumaya-byvirgil.ro from WordPress to a modern Next.js + Payload CMS 3.0 architecture. The WordPress export (4MB XML) contains 27 products (9 with full detail pages), 14 testimonials, 1 blog post, static pages, and 426 media files (110MB). The new site will be a $0/month artisanal bakery website with WhatsApp-based ordering.

This plan replaces `WORDPRESS_MIGRATION_PLAN.md` and `artisanal-bakery-blueprint.md` with resolved decisions from the design interview.

---

## 1. Project Initialization

### Step 1: Scaffold with create-payload-app
```bash
pnpm create payload-app@latest painecumaya-byvirgil -t website
```
This gives us: Payload 3.0 + Next.js App Router + `posts` collection + `pages` collection + `media` collection + `users` collection + Tailwind CSS.

### Step 2: Install additional dependencies
```bash
# Database adapters
pnpm add @payloadcms/db-sqlite    # Local dev
pnpm add @payloadcms/db-turso     # Production (libSQL)

# Storage
pnpm add @payloadcms/storage-vercel-blob

# SEO
pnpm add @payloadcms/plugin-seo

# Rich text (likely already in website template)
pnpm add @payloadcms/richtext-lexical

# UI utilities
pnpm add tailwindcss-animate class-variance-authority clsx tailwind-merge

# shadcn/ui
npx shadcn-ui@latest init
npx shadcn-ui@latest add button card input textarea select badge separator sheet toast
```

### Step 3: Configure environment
```env
# .env.local
DATABASE_URL="file:./payload.db"
PAYLOAD_SECRET="generate-a-random-secret"
BLOB_READ_WRITE_TOKEN=""
NEXT_PUBLIC_SERVER_URL="http://localhost:3000"
```

### Step 4: Configure payload.config.ts
- `db`: `sqliteAdapter` with `file:./payload.db` for local dev
- `editor`: `lexicalEditor`
- `plugins`: `vercelBlobStorage` (media collection), `@payloadcms/plugin-seo`
- `collections`: `[pages, posts, media, products, testimonials, users]`
- `globals`: `[siteConfig, homepage]`
- `i18n`: Romanian labels on fields, English UI chrome
- Localization config: enabled but only `ro` locale for now

---

## 2. Payload Collections & Globals

### Products Collection (`src/collections/Products.ts`)
```
Fields:
- name (text, required) — Nume produs
- slug (slug field, auto from name, editable) — generated via field hook
- shortDescription (text, required) — Scurtă descriere
- introProduct (textarea) — Introducere produs
- description (richText) — Descriere detaliată
- characteristics (array of text fields) — Caracteristici
- ingredients (textarea) — Ingrediente
- allergens (textarea) — Alergeni
- nutritionalValues (richText) — Valori nutritionale
- weight (text, required) — Greutate
- price (number, required) — Preț (RON)
- category (select: regular | sweet | occasional, required) — Categorie
- available (checkbox, default: true) — Disponibil
- availabilityText (text) — Text disponibilitate
- featured (checkbox, default: false) — Produs recomandat (for homepage)
- featuredImage (upload → media, required) — Imagine principală
- gallery (array of upload → media) — Galerie imagini
- orderingInfo (richText) — Informații comandă
- SEO field group (via @payloadcms/plugin-seo)
```

### Testimonials Collection (`src/collections/Testimonials.ts`)
```
Fields:
- author (text, required) — Autor
- content (textarea, required) — Conținut
- language (select: ro | en | de, required) — Limbă
- published (checkbox, default: true) — Publicat
```

### Posts Collection (from website template, customized)
- Keep existing fields from template
- Ensure `slug` field, `content` (richText), `excerpt`, `featuredImage`, `publishedDate`
- Add SEO via plugin

### Pages Collection (from website template)
- Used for: Privacy Policy, Maiaua Mea, and future pages
- Rich text content field

### Media Collection (from website template)
- Single collection for all uploads
- Vercel Blob storage in production

### Globals

#### siteConfig Global
```
Fields:
- whatsappNumber (text, default: "+40 746 245 391")
- contactEmail (text, default: "bucsavirgil@yahoo.com")
- contactPhone (text, default: "+40 746 245 391")
- facebookUrl (text)
- instagramUrl (text)
- deliveryInfo (richText) — Livrare în Sibiu: marți și vineri / național prin curier
- orderingProcess (richText) — Cum se comandă
```

#### homepage Global
```
Fields:
- heroHeading (text, default: "Pâine cu Maia by Virgil")
- heroSubheading (text, default: "Pâine artizanală, fermentată lent, coaptă pe vatră")
- heroBackgroundImage (upload → media)
- aboutHeading (richText) — The WordPress "Când totul se face cu multă pasiune..." heading
- aboutDescription (richText) — The "Cine sunt eu", "Care sunt principiile", "Cum a început totul" sections
- aboutImage1 (upload → media) — poza-6.jpg
- aboutImage2 (upload → media) — poza-5.jpg
- contactSection (group)
  - address (text)
  - deliverySchedule (text)
```

---

## 3. Next.js Pages & Routing

### Frontend Route Structure
```
src/app/
├── (frontend)/
│   ├── page.tsx                    — Homepage (single-page scroll)
│   ├── produse/
│   │   ├── page.tsx                — Products grid with filters
│   │   └── [slug]/page.tsx         — Individual product page
│   ├── maiaua-mea/page.tsx         — About the baker + sourdough intro
│   ├── blog/
│   │   ├── page.tsx                — Blog listing (magazine layout)
│   │   └── [slug]/page.tsx         — Individual blog posts
│   ├── cos/page.tsx                — Cart page
│   ├── politica-de-confidentialitate/page.tsx — Privacy policy
│   └── layout.tsx                  — Frontend layout with nav/footer
├── (payload)/
│   └── admin/[[...segments]]/
│       └── page.tsx                — Payload admin panel
└── layout.tsx                      — Root layout
```

### ISR Configuration
- All frontend pages use `generateStaticParams` + on-demand ISR
- Payload collection hooks trigger `revalidatePath()` on content changes
- Homepage revalidates when any product/testimonial/global changes
- Product pages revalidate on product update

### 301 Redirects (in next.config.js)
All redirects from the original plan (pages, 9 products, blog post, testimonials) — see Section 9.

---

## 4. Homepage Structure

### Section 1: Hero (100vh)
- Full-screen background image (from `home_baker2_pic*` set — evaluate visually)
- Gradient overlay
- Heading: "Pâine cu Maia by Virgil" (Playfair Display)
- Subheading: "Pâine artizanală, fermentată lent, coaptă pe vatră"
- CTA: "Vezi produsele" → scrolls to featured products section

### Section 2: About (Despre mine)
- Heading from WP: "Când totul se face cu multă **pasiune**, timpul parcă stă în loc..."
- Three subsections: "Cine sunt eu?", "Care sunt principiile?", "Cum a început totul?"
- Two images (poza-6.jpg, poza-5.jpg)
- Link: "Află mai multe despre maiaua mea →" → /maiaua-mea

### Section 3: Featured Products
- 4-6 products with `featured: true`
- Product cards with image, name, short description, price, category badge
- "Vezi toate produsele" CTA → /produse

### Section 4: Testimonials Carousel
- Classic quote carousel, auto-rotate every 5 seconds
- Show 1 testimonial at a time on mobile, 2-3 on desktop
- Quote marks, italic text, author name below
- All 14 testimonials cycle through

### Section 5: Delivery & Ordering Info
- "Livrare în Sibiu: marți și vineri"
- "Livrare națională prin curier"
- WhatsApp ordering process explanation
- Managed via `siteConfig` Global

### Section 6: Contact
- Phone: +40 746 245 391
- Email: bucsavirgil@yahoo.com
- WhatsApp CTA button
- Social links (Facebook, Instagram, WhatsApp)

### Footer
- Logo
- Quick links: Acasă, Produse, Despre, Blog, Politica de Confidențialitate
- Contact info
- Social media icons (Facebook, Instagram, WhatsApp)
- Copyright

---

## 5. Component Architecture

### Layout Components
- `Navigation.tsx` — Fixed header, logo left, nav center, cart+menu right. Mobile: hamburger → full-screen overlay.
- `Footer.tsx` — Logo, quick links, contact, social icons, copyright.
- `WhatsAppButton.tsx` — Scroll-triggered floating button (appears after hero), green, pulsing, bottom-right.

### Product Components
- `ProductCard.tsx` — Rounded shadow card with image, category badge, name, description, price (RON format), weight, "Adaugă în coș" button.
- `ProductFilters.tsx` — Pill-shaped filter buttons: Toate, Curente, Dulci, Ocazionale.
- `ProductDetail.tsx` — Full product page sections: intro, description, characteristics, ingredients, allergens, nutritional table, weight, availability, add-to-cart.

### Cart Components
- `CartIcon.tsx` — Header cart icon with item count badge.
- `CartItem.tsx` — Cart line item with +/- quantity controls and remove button.
- `CartCheckout.tsx` — Order form (name, phone, address) + WhatsApp checkout button.
- `Toast.tsx` — Notification when product added to cart.

### Testimonials
- `TestimonialsCarousel.tsx` — Auto-rotating classic quote carousel.

### UI Utilities
- `ScrollReveal.tsx` — Intersection Observer wrapper for subtle fade-in animations.

---

## 6. Cart System

### State Management
- React Context + localStorage
- `src/lib/cart.ts` — Cart state: items array with {id, name, price, quantity, weight, category, slug}
- Add, remove, update quantity, clear, getTotal, getCount

### WhatsApp Checkout (`src/lib/whatsapp.ts`)
```typescript
generateWhatsAppMessage(items, total, formData) → string
createWhatsAppLink(message, whatsappNumber) → URL
```

Message format:
```
Bună ziua! Doresc să comand:

• 2x Paine mixta (800g) - 46,00 RON
• 1x Paine integrala (800g) - 26,00 RON

Total: 72,00 RON

Nume: [name]
Telefon: [phone]
Adresă: [address]

Mulțumesc!
```

### Cart Page (/cos)
- Cart items list with +/- controls and remove
- Subtotal in RON format (Intl.NumberFormat('ro-RO', {style: 'currency', currency: 'RON'}))
- Order form: name, phone, address (all required)
- "Comandă prin WhatsApp" button → opens wa.me link

---

## 7. Content Inventory (from WordPress XML)

> **Full content data** for all products (descriptions, ingredients, allergens, nutritional values), all 14 testimonials with complete text, the blog post, and homepage content is in [CONTENT_DATA.md](CONTENT_DATA.md). The tables below summarize the product/image/price mapping for quick reference.

### Products (27 total) with Image Mapping

**Regular Products (9):**
| Product | Image File | Price | Weight | Slug |
|---------|-----------|-------|--------|------|
| Paine mixta | PXL_20260319_121417485.PORTRAIT-scaled.jpg | 23 lei | 800g | paine-mixta |
| Paine de secara | PXL_20260319_121337121.jpg | 28 lei | 800g | paine-de-secara |
| Paine San Joaquin | PXL_20231113_161014336.PORTRAIT-scaled.jpg | 24 lei | 800g | paine-san-joaquin |
| Paine integrala | PXL_20250403_072532656.PORTRAIT-scaled.jpg | 26 lei | 800g | paine-integrala |
| Bagheta integrala cu piper | PXL_20241014_153333505.PORTRAIT.jpg | 35 lei | 800g | bagheta-integrala-cu-piper |
| Bagheta mixta cu piper | PXL_20241014_153325148.PORTRAIT-1.jpg | 32 lei | 800g | bagheta-mixta-cu-piper |
| Chifle | PXL_20260504_151443071.PORTRAIT.jpg | 20 lei | Set 5 buc | chifle |
| Bagheta cu unt | Gilu-118-1.jpg | 23 lei | 400g | bagheta-cu-unt |
| Paine fara gluten | PXL_20231107_194546274.jpg | 32 lei | 500g | paine-fara-gluten |

**Sweet Products (1):**
| Product | Image File | Price | Weight |
|---------|-----------|-------|--------|
| Biscotti cu portocala si ghimbir | PXL_20241031_191358190.PORTRAIT.ORIGINAL.jpg | 41 lei | 200g |

**Occasional Products (17):**
| Product | Image File | Price | Weight |
|---------|-----------|-------|--------|
| Biscotti clasici | PXL_20240406_061225132-1.jpg | 34 lei | 200g |
| Cos cadou artizanal | PXL_20231223_122930747.PORTRAIT.jpg | 350 lei | - |
| Cozonac cu nuca | PXL_20231124_114503546.PORTRAIT.jpg | 150 lei | 1000g |
| Cozonac cu mac | PXL_20231213_193853377.PORTRAIT.jpg | 150 lei | 1000g |
| Hencleș | PXL_20251212_094323699.jpg | 120 lei | Pachet |
| Mini cozonac Top Floare | PXL_20260404_091130984.PORTRAIT.jpg | 180 lei | - |
| Paine cu chili si sos de rosii | PXL_20240328_194726772.PORTRAIT.jpg | 32 lei | 800g |
| Paine cu nuca | PXL_20240220_202328428.PORTRAIT.jpg | 35 lei | 800g |
| Paine cu ceapa si cartof copt | PXL_20231123_200235625.PORTRAIT.ORIGINAL.jpg | 32 lei | 800g |
| Paine cu usturoi copt | PXL_20231123_190310170.jpg | 32 lei | 800g |
| Paine cu dovleac copt si seminte | IMG-20211022-WA0016.jpg | 32 lei | 800g |
| Paine Oshawa | 20210419_191126.jpg | 32 lei | 600g |
| Focaccia cu rosii cherry si masline | 20211118_160936.jpg | 37 lei | 300g |
| Focaccia Barese | PXL_20260319_121228725.PORTRAIT.ORIGINAL.jpg | 39 lei | 300g |
| Focaccia cu ceapa si otet balsamic | PXL_20260319_121156319.PORTRAIT.ORIGINAL.jpg | 39 lei | 300g |
| Paine cu malai | PXL_20260115_201717622.PORTRAIT.jpg | 32 lei | 800g |
| Saleuri | original_99a76956-..._PXL_20240405_175212098.PORTRAIT.ORIGINAL.jpg | 35 lei | 200g |
| Paine ornamentala | PXL_20231120_131658897-1.jpg | 40 lei | 850g |

### Testimonials (14 total)
1. **Oana** (ro): "O pâine autentică și echilibrată pe care o mănânc până la ultima firimitură..."
2. **Vanesa** (ro): "O pâine sănătoasă, delicioasa, cu ingrediente naturale..."
3. **Delia** (ro): "O recomand! Este o pâine gustoasă si sănătoasă..."
4. **Cristina** (ro): "Foarte gustoasa. Recomand cu mult drag..."
5. **Liliana** (ro): "Este deosebit de gustoasa! Recomand cu caldura!"
6. **Ioana** (ro): "Paine cu maia, gustul bun si sănătos, satioasa si foarte gustoasă!..."
7. **Andreea** (ro): "Gustul e unic! Daca ai avut norocul sa mananci paine adevarata..."
8. **Birgit și Werner** (ro): "De ani de zile, Virgil ne aduce la ușă..."
9. **Birgit și Werner** (de): "Wir werden schon seit Jahren zweimal die Woche..."
10. **Ivan** (ro): "Eu avind ceva probleme cu digestia si glutenul..."
11. **Laura** (ro): "Nu pot sa zic ca eram fan paine cu maia..."
12. **doctor Iuliana Lambru** (ro): "Consum paine de la Virgil de peste 4 ani..."
13. **Moga Liliana** (ro): "Apreciez calitatea painii cu maia 'by Virgil'..."
14. **Mirela** (ro): "Mă bucur mult că am descoperit Pâinea cu Maia by Virgil..."

### Blog Posts (1)
- **"De ce am făcut o maia de la zero — și ce a găsit un studiu european în ea, 17 ani mai târziu"**
  - Slug: `17-ani-de-maia`
  - Full content about 17-year sourdough, ETH Zurich study, Lactobacillus sanfranciscensis

### Static Pages
- **Privacy Policy** — Full GDPR content, managed via Pages collection
- **Maiaua Mea** — About the baker (from WP homepage about section) + sourdough intro + link to blog post

### Logo Files (evaluate visually during implementation)
- Header logo: TBD from {LOGO-GILU-MARE-SCRIS-ALB-BUN, Logo-Gilu-mare-2, logo-gilu-export-1, etc.}
- Footer logo: TBD from {Logo-Footer, Logo-Gilu-Footer, etc.}
- Favicon: Fav-Icon.png

### Hero Images (evaluate visually)
- Primary candidates: home_baker2_pic23-3.jpg, home_baker2_pic1.jpg

---

## 8. Content Hierarchy (About Section)

Three levels of depth:
1. **Homepage Section 2**: Short "Who am I" excerpt + "Află mai multe →" link to /maiaua-mea
2. **/maiaua-mea page**: Full about-the-baker content (from WP homepage: "Cine sunt eu", "Principii", "Cum a început") + sourdough intro + "Citește articolul complet →" link to blog post
3. **/blog/17-ani-de-maia**: Full technical blog post about the 17-year sourdough journey and ETH Zurich study

---

## 9. 301 Redirects (next.config.js)

```javascript
async redirects() {
  return [
    // Pages
    { source: '/acasa', destination: '/', permanent: true },
    { source: '/privacy-policy', destination: '/politica-de-confidentialitate', permanent: true },
    { source: '/despre-mine', destination: '/maiaua-mea', permanent: true },
    { source: '/cum-comand', destination: '/#comanda', permanent: true },
    { source: '/produsele-mele-2', destination: '/produse', permanent: true },
    { source: '/shop', destination: '/produse', permanent: true },
    { source: '/cart', destination: '/cos', permanent: true },
    { source: '/checkout', destination: '/cos', permanent: true },
    { source: '/my-account', destination: '/#contact', permanent: true },

    // Products
    { source: '/paine-mixta-cu-maia', destination: '/produse/paine-mixta', permanent: true },
    { source: '/paine-integrala-cu-maia', destination: '/produse/paine-integrala', permanent: true },
    { source: '/paine-fara-gluten', destination: '/produse/paine-fara-gluten', permanent: true },
    { source: '/paine-san-joaquin-cu-maia', destination: '/produse/paine-san-joaquin', permanent: true },
    { source: '/paine-de-secara-cu-maia', destination: '/produse/paine-de-secara', permanent: true },
    { source: '/chifle-cu-maia', destination: '/produse/chifle', permanent: true },
    { source: '/bagheta-mixta-cu-piper', destination: '/produse/bagheta-mixta-cu-piper', permanent: true },
    { source: '/bagheta-integrala-cu-piper', destination: '/produse/bagheta-integrala-cu-piper', permanent: true },
    { source: '/bagheta-cu-unt', destination: '/produse/bagheta-cu-unt', permanent: true },

    // Blog
    { source: '/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu', destination: '/blog/17-ani-de-maia', permanent: true },

    // Testimonials
    { source: '/testimonial/:path*', destination: '/', permanent: true },
  ]
}
```

---

## 10. Design System

### Typography
- **H1-H6**: Playfair Display (editorial serif, elegant)
- **Body**: Merriweather (readable serif, warm)
- **UI/Controls**: Inter (modern sans-serif)
- Load via `next/font/google`

### Color Palette
- Background: stone-50 (#fafaf9) — warm off-white
- Text primary: stone-900 (#1c1917)
- Text secondary: stone-700 (#44403c)
- Accent: amber-500 (#f59e0b) — warm copper
- CTA/WhatsApp: #25D366 (green)
- Cards: white with subtle shadow

### Component Styles
- Product cards: rounded corners, shadow-md, hover:shadow-lg transition
- Buttons: rounded-lg, amber-500 primary, green WhatsApp
- Filter pills: rounded-full, amber-500 active, stone-100 inactive
- Inputs: stone-300 border, rounded-lg
- Testimonials: large quote marks, italic, stone-200 background

### Animations
- Subtle scroll-triggered fade-in using Intersection Observer
- WhatsApp button: gentle pulse animation
- Card hover: shadow transition
- No parallax, no complex animations

### Currency Formatting
```typescript
new Intl.NumberFormat('ro-RO', { style: 'currency', currency: 'RON' }).format(price)
// Output: "23,00 RON"
```

---

## 11. Navigation

### Header
- Fixed top, white/95 backdrop-blur
- Left: Logo
- Center (desktop): Acasă | Produse | Despre | Blog | Contact
- Right: Cart icon (with count badge) + hamburger (mobile)

### Mobile Menu
- Full-screen overlay, white background
- Nav links centered, large text
- WhatsApp CTA at bottom
- Close button (X) top-right

### Navigation Links
- Acasă → /
- Produse → /produse
- Despre → /maiaua-mea
- Blog → /blog
- Contact → /#contact (anchor on homepage)

---

## 12. Implementation Order

### Phase 1: Foundation (Estimated: ~2 hours)
1. Run `create-payload-app` with website template
2. Install all dependencies
3. Configure payload.config.ts (DB, editor, plugins)
4. Create Products collection
5. Create Testimonials collection
6. Create siteConfig Global
7. Create homepage Global
8. Verify admin panel loads at /admin

### Phase 2: Content Population (Estimated: ~2 hours)
1. Upload product images to media collection
2. Create all 27 products with data from XML
3. Create all 14 testimonials
4. Create the blog post (17-ani-de-maia)
5. Create Privacy Policy page
6. Create Maiaua Mea page
7. Populate siteConfig Global (WhatsApp, contact, delivery)
8. Populate homepage Global (hero, about text)
9. Upload logo/favicon files
10. Set featured products (4-6 regular products)

### Phase 3: Frontend — Layout & Navigation (Estimated: ~2 hours)
1. Root layout with fonts (Playfair, Merriweather, Inter)
2. Navigation component (desktop + mobile overlay)
3. Footer component
4. WhatsApp floating button
5. Cart context provider + localStorage utility
6. Cart icon in header
7. Toast notification component

### Phase 4: Frontend — Pages (Estimated: ~4 hours)
1. Homepage (all 6 sections + footer)
2. Products listing page (/produse) with filters
3. Individual product page (/produse/[slug]) with all sections
4. Cart page (/cos) with WhatsApp checkout
5. Blog listing page (/blog) — magazine layout
6. Blog post page (/blog/[slug])
7. Maiaua Mea page (/maiaua-mea)
8. Privacy policy page (/politica-de-confidentialitate)

### Phase 5: ISR & SEO (Estimated: ~1 hour)
1. Configure on-demand revalidation hooks in Payload
2. Add generateMetadata to all pages
3. Configure 301 redirects in next.config.js
4. Set up sitemap generation
5. Test all redirects

### Phase 6: Polish & Testing (Estimated: ~2 hours)
1. Scroll reveal animations
2. Responsive testing (mobile, tablet, desktop)
3. Cart flow end-to-end (add → cart → WhatsApp)
4. Image optimization verification
5. Accessibility check (alt text, ARIA, keyboard nav, contrast)
6. Performance audit (Lighthouse)

### Phase 7: Deployment (Estimated: ~1 hour)
1. Push to GitHub
2. Connect to Vercel
3. Configure production environment variables (Turso DB, Blob token, etc.)
4. Switch DB adapter to Turso for production
5. Deploy to preview branch
6. Client review
7. DNS switch
8. Submit sitemap to Google Search Console
9. Enable Vercel Analytics

---

## 13. Key Decisions Summary

| Decision | Choice |
|----------|--------|
| Testimonials | All 14 migrated |
| Product categories | 3: regular, sweet, occasional (Biscotti clasici = occasional) |
| Cos cadou / Mini cozonac | Kept in occasional category |
| Payload version | 3.0 (latest) |
| Project init | create-payload-app -t website |
| Database | SQLite (dev) + Turso (prod) |
| Blog collection slug | `posts` (from template) |
| Media collection | Single `media` collection |
| Slug handling | Built-in Payload slug field (auto-gen from name) |
| Localization | Romanian only, i18n config ready |
| Admin UI | English chrome, Romanian field labels |
| Navigation | Home \| Produse \| Despre \| Blog \| Contact |
| Footer | Standard: logo, links, contact, social, copyright |
| Social media | Facebook + Instagram + WhatsApp |
| Product page | Full detail template (hide empty sections) |
| Product gallery | Featured image + optional gallery array |
| Product page CTA | Add to cart button only |
| Cart UX | Toast notification + header count update |
| Hero image | Evaluate visually from home_baker2_pic* files |
| Homepage about | Editable via Payload Global, pre-populated with WP content |
| Homepage products | 4-6 featured only, link to /produse |
| Delivery info | Homepage section only (no separate page) |
| Paine fara gluten | Friday only |
| Products page | Filterable grid (Toate/Curente/Dulci/Ocazionale) |
| Checkout | WhatsApp only |
| Blog layout | Magazine with featured post |
| Privacy policy | Pages collection entry |
| Maiaua mea | Pages collection entry |
| Content hierarchy | Homepage → /maiaua-mea → /blog/17-ani-de-maia |
| Blog post location | Posts collection at /blog/17-ani-de-maia |
| ISR | On-demand via Payload hooks |
| SEO | @payloadcms/plugin-seo |
| Storage | Vercel Blob (prod only), local (dev) |
| Analytics | Vercel Analytics only |
| Search | No search functionality |
| Mobile menu | Full-screen overlay |
| Accessibility | Standard web a11y |
| Design aesthetic | Warm rustic bakery |
| Light/dark | Light mode only |
| Product cards | Rounded shadow cards |
| Animations | Subtle scroll reveals |
| Testimonials UI | Classic quote carousel |
| Currency format | Intl.NumberFormat('ro-RO', RON) |

---

## 14. Verification Checklist

### Functional Testing
- [ ] Admin panel loads at /admin with all collections
- [ ] Can create/edit/delete products in Payload
- [ ] Can toggle product availability
- [ ] Can mark products as featured
- [ ] All 27 products display on /produse with correct data
- [ ] Category filters work (Toate/Curente/Dulci/Ocazionale)
- [ ] Individual product pages show all populated sections
- [ ] Empty sections are hidden on product pages
- [ ] Cart: add product, see toast, header count updates
- [ ] Cart page: items list, +/- quantity, remove, subtotal
- [ ] WhatsApp checkout generates correct message with RON format
- [ ] WhatsApp link opens correctly
- [ ] Testimonials carousel auto-rotates
- [ ] Blog listing shows posts in magazine layout
- [ ] Blog post page renders full content
- [ ] Maiaua Mea page renders about content
- [ ] Privacy policy page renders
- [ ] All 301 redirects work (test with curl)
- [ ] Mobile navigation opens/closes correctly
- [ ] WhatsApp floating button appears after scrolling past hero

### Performance
- [ ] Lighthouse score >90 on all pages
- [ ] Images load as WebP via Next.js Image
- [ ] ISR working (page updates after Payload edit)
- [ ] No layout shifts (CLS < 0.1)

### SEO
- [ ] All pages have meta title and description
- [ ] Open Graph tags present
- [ ] Sitemap.xml generated
- [ ] Robots.txt configured
- [ ] Canonical URLs set

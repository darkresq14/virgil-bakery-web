# WordPress Content Migration Plan - Pâine cu Maia by Virgil

## Context
This plan outlines the content migration strategy from the existing WordPress site (painecumaya-byvirgil.ro) to the new Next.js + Payload CMS architecture. The WordPress export contains pages, blog posts, products (stored as pages), testimonials, and media assets that need to be extracted and restructured for the new system.

---

## Content Inventory

### 1. Static Pages (Published)

| Page Title | Slug | Content Status | Notes |
|------------|------|----------------|-------|
| Acasa | `acasa` | Test content | Home page with slider "baker21" |
| Privacy Policy | `privacy-policy` | Full content | GDPR compliance page with contact info |
| Maiaua Mea | `maiaua-mea` | Full content | About the 17-year sourdough starter, ETH Zurich study |
| Despre Mine | `despre-mine` | Empty | About page - WILL BE REMOVED, redirect to maiaua-mea |
| Cum Comand | `cum-comand` | Test content | How to order page with slider |
| Blog | `blog` | Empty | Blog listing page |
| Produsele Mele | `produsele-mele-2` | Empty | Products listing page |
| Refund Returns | `refund_returns` | Draft | Refund policy (draft status) |

### 2. Product Catalog (Complete with Pricing from Product Grid)

**Regular Products** (Available Tuesday & Friday):
| Product Name | Slug | Price | Weight | Short Description |
|--------------|------|-------|--------|-------------------|
| Paine mixta | `paine-mixta` | 23 lei | 800g | Miez aerat si coaja subtire |
| Paine de secara | `paine-de-secara` | 28 lei | 800g | Gust intens specific secarei |
| Paine San Joaquin | `paine-san-joaquin` | 24 lei | 800g | Fermentatie lenta si coaja crocanta |
| Paine integrala | `paine-integrala` | 26 lei | 800g | Gust intens si aroma bogata |
| Bagheta integrala cu piper | `bagheta-integrala-cu-piper` | 35 lei | 800g | Aroma intensa si gust bogat |
| Bagheta mixta cu piper | `bagheta-mixta-cu-piper` | 32 lei | 800g | Aroma intensa si coaja crocanta |
| Chifle (set 5) | `chifle` | 20 lei | Set 5 buc | Miez moale si coaja subtire |
| Bagheta cu unt | `bagheta-cu-unt` | 23 lei | 400g | Miez moale si aroma fina de unt |
| Paine fara gluten | `paine-fara-gluten` | 32 lei | 500g | Miez umed si coaja crocanta (VINEREA DOAR) |

**Sweet Products** (Available Tuesday & Friday):
| Product Name | Price | Weight | Short Description |
|--------------|-------|--------|-------------------|
| Biscotti cu portocala si ghimbir | 41 lei | 200g | Aroma intensa de portocala si ghimbir |
| Biscotti clasici | 34 lei | 200g | Biscotti cu migdale si textura crocanta |

**Occasional Products** (Seasonal/Special):
| Product Name | Price | Weight | Category | Short Description |
|--------------|-------|--------|----------|-------------------|
| Cos cadou artizanal | 350 lei | - | Gift | Selectie de produse artizanale |
| Cozonac cu nuca | 150 lei | 1000g | Seasonal | Umplutura bogata de nuca |
| Cozonac cu mac | 150 lei | 1000g | Seasonal | Umplutura bogata de mac |
| Hencleș | 120 lei | Pachet | Seasonal | Desert traditional cu aluat dospit |
| Mini cozonac Top Floare | 180 lei | - | Special | Decor ornamental si umplutura bogata |
| Paine cu chili si sos de rosii | 32 lei | 800g | Occasional | Gust intens si aroma usor picanta |
| Paine cu nuca | 35 lei | 800g | Occasional | Miez aromat cu nuca crocanta |
| Paine cu ceapa si cartof copt | 32 lei | 800g | Occasional | Aroma intensa de ceapa coapta |
| Paine cu usturoi copt | 32 lei | 800g | Occasional | Gust bogat si aroma intensa |
| Paine cu dovleac copt si seminte | 32 lei | 800g | Occasional | Miez moale si aroma de dovleac |
| Paine Oshawa | 32 lei | 600g | Occasional | Paine integrala cu gust rustic |
| Focaccia cu rosii cherry si masline | 37 lei | 300g | Occasional | Rosii cherry, masline si rozmarin |
| Focaccia Barese | 39 lei | 300g | Occasional | Preparata din grau dur si rosii cherry |
| Focaccia cu ceapa si otet balsamic | 39 lei | 300g | Occasional | Gust intens si aroma dulce-acrisoara |
| Paine cu malai | 32 lei | 800g | Occasional | Gust rustic si textura bogata |
| Saleuri | 35 lei | 200g | Occasional | Fragede si intens aromate |
| Paine ornamentala | 40 lei | 850g | Special | Baza San Joaquin cu decor din aluat integral |

### 3. Blog Posts (Published)

| Post Title | Slug | Content Status |
|------------|------|----------------|
| De ce am făcut o maia de la zero... | `de-ce-am-facut-o-maia` | Full content about the 17-year sourdough journey |

### 4. Testimonials (Custom Post Type)

| Author | Language | Content Preview |
|--------|----------|-----------------|
| Oana | Romanian | "O pâine autentică și echilibrată..." |
| Vanesa | Romanian | "O pâine sănătoasă, delicioasa..." |
| Delia | Romanian | "O recomand! Este o pâine gustoasă..." |
| Cristina | Romanian | "Foarte gustoasa. Recomand cu mult drag..." |
| Andreea | Romanian | (Content not fully visible) |
| Birgit și Werner | Romanian | "De ani de zile, Virgil ne aduce la ușă..." |
| Birgit und Werner | German | "Wir werden schon seit Jahren..." |
| Ivan | (not visible) | (not visible) |

---

## Cart Functionality Specification

### Cart State Management
```javascript
// localStorage structure
{
  items: [
    {
      id: 'product-slug',
      name: 'Paine mixta',
      price: 23,
      quantity: 2,
      weight: '800g',
      category: 'regular'
    }
  ],
  updatedAt: '2026-05-19T12:00:00Z'
}
```

### Cart Features
- Add/remove items with quantity controls
- Persistent in localStorage (no expiration)
- Cart icon in header shows item count
- `/cos` (cart) page displays:
  - Product list with images, names, quantities
  - Line item totals
  - Subtotal calculation
  - WhatsApp checkout button

### WhatsApp Checkout Format
```
Bună ziua! Doresc să comand:

• 2x Paine mixta (800g) - 46 lei
• 1x Paine integrala (800g) - 26 lei

Total: 72 lei

Nume: [client name]
Telefon: [client phone]
Adresă: [client address]

Mulțumesc!
```

### URL Encoded WhatsApp Link
```
https://wa.me/40746245391?text={encoded_message}
```

---

## Final Decisions (Made with Client)

### 1. ✅ Pricing
All 27 products have pricing extracted from the product grid meta tags. Price will be a required field in the products collection.

### 2. ✅ About Page
Remove "Despre Mine" page and 301 redirect to "maiaua-mea" (the sourdough story page).

### 3. ✅ Product Categories
Single `products` collection with a `category` field (regular/sweet/occasional) for filtering.

### 4. ✅ Product Availability
Add an `available` checkbox field in Payload. Regular products default to available, seasonal products can be toggled on/off.

### 5. ✅ Product Display
Show all products on "Produsele Mele" page with category badges and filters. Use a standard 3-column responsive grid.

### 6. ✅ WhatsApp Integration
Scroll-triggered floating WhatsApp button (appears after hero) + dedicated `/cos` (cart) page with WhatsApp checkout containing all cart items.

### 7. ✅ Testimonials
Display as a rotating carousel on the home page (3-5 testimonials visible). No dedicated testimonials page needed.

### 8. ✅ Blog
Migrate the existing blog post AND set up full blog infrastructure in Payload for future posts.

### 9. ✅ Homepage Structure
Single-page scroll layout with sections: Hero → About → Featured Products → All Products → Testimonials → Delivery Info → Contact → Footer.

### 10. ✅ Navigation
Mobile-first responsive navigation with full-screen menu on small screens, horizontal nav on desktop.

### 11. ✅ Cart Persistence
Client-side localStorage only (no server backup).

### 12. ✅ Image Optimization
Next.js Image component + Vercel Blob storage with automatic WebP/AVIF conversion.

### 13. ✅ URL Structure
`/produse/[product-slug]` pattern for all products.

### 14. ✅ 301 Redirects
Create comprehensive redirect mappings in next.config.js for ALL old URLs (27 products + pages).

### 15. ✅ Migration Workflow
Preview branch development → Client review → DNS switch. Zero downtime migration.

### 16. ✅ Content Review
Give client direct Payload CMS admin access to review and edit migrated content.

### 17. ✅ WhatsApp Phone Number
Store +40 746 245 391 in Payload Globals for easy updates.

---

## URL Mapping for 301 Redirects

### Page Redirects
| Old WordPress URL | New Next.js Route |
|-------------------|-------------------|
| `/acasa` | `/` |
| `/privacy-policy` | `/politica-de-confidentialitate` |
| `/maiaua-mea` | `/maiaua-mea` |
| `/despre-mine` | `/maiaua-mea` (301 redirect) |
| `/cum-comand` | `/#comanda` (anchor on home) |
| `/blog` | `/blog` |
| `/produsele-mele-2` | `/produse` |
| `/shop` | `/produse` |
| `/cart` | `/cos` |
| `/checkout` | `/cos` |
| `/my-account` | `/#contact` (anchor on home) |

### Product Redirects (9 main products)
| Old WordPress URL | New Next.js Route |
|-------------------|-------------------|
| `/paine-mixta-cu-maia` | `/produse/paine-mixta` |
| `/paine-integrala-cu-maia` | `/produse/paine-integrala` |
| `/paine-fara-gluten` | `/produse/paine-fara-gluten` |
| `/paine-san-joaquin-cu-maia` | `/produse/paine-san-joaquin` |
| `/paine-de-secara-cu-maia` | `/produse/paine-de-secara` |
| `/chifle-cu-maia` | `/produse/chifle` |
| `/bagheta-mixta-cu-piper` | `/produse/bagheta-mixta-cu-piper` |
| `/bagheta-integrala-cu-piper` | `/produse/bagheta-integrala-cu-piper` |
| `/bagheta-cu-unt` | `/produse/bagheta-cu-unt` |

### Blog Post Redirects
| Old WordPress URL | New Next.js Route |
|-------------------|-------------------|
| `/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu` | `/blog/17-ani-de-maia` |

### Testimonial Redirects (if needed)
| Old WordPress URL | New Next.js Route |
|-------------------|-------------------|
| `/testimonial/oana` | `/` (testimonials now on home page) |
| `/testimonial/vanesa` | `/` |
| `/testimonial/delia` | `/` |
| `/testimonial/cristina` | `/` |
| `/testimonial/andreea` | `/` |
| `/testimonial/birgit-si-werner` | `/` |
| `/testimonial/birgit-si-werner-2` | `/` |
| `/testimonial/ivan` | `/` |

---

## Verification Checklist

### Phase 1: Content Migration
- [ ] All 27 products migrated with complete fields (name, slug, price, weight, category, description, images)
- [ ] All 8 testimonials migrated (oana, vanesa, delia, cristina, andreea, birgit-si-werner x2, ivan)
- [ ] 1 blog post migrated with full content
- [ ] Static pages content migrated (privacy policy, maiaua mea, home, etc.)
- [ ] SEO metadata preserved for all content (title, description, keywords)

### Phase 2: Media Migration
- [ ] All 800+ images downloaded from WordPress media library
- [ ] Images uploaded to Vercel Blob storage
- [ ] Image references updated in all migrated content
- [ ] Featured images properly assigned to products
- [ ] Image optimization working (Next.js Image + WebP/AVIF conversion)

### Phase 3: Configuration & Routing
- [ ] WhatsApp number (+40 746 245 391) configured in Payload Globals
- [ ] All 30+ 301 redirects configured and tested in next.config.js
- [ ] Product URLs working: `/produse/[product-slug]`
- [ ] Blog URLs working: `/blog/[post-slug]`
- [ ] Cart page working: `/cos`
- [ ] About page redirect working: `/despre-mine` → `/maiaua-mea`

### Phase 4: Cart & Checkout
- [ ] Cart state management working (localStorage)
- [ ] Add/remove product functionality working
- [ ] Cart page displays items correctly
- [ ] WhatsApp checkout generates formatted message
- [ ] WhatsApp link opens correctly with cart contents

### Phase 5: UI & UX
- [ ] Mobile-first navigation working
- [ ] Scroll-triggered WhatsApp button appears after hero
- [ ] Product filters working (regular/sweet/occasional)
- [ ] Product availability toggle working in Payload
- [ ] Testimonials carousel displaying correctly on home page
- [ ] Single-page scroll layout working

### Phase 6: Client Access & Training
- [ ] Payload CMS admin access configured for client
- [ ] Client trained on basic CMS operations (edit products, toggle availability)
- [ ] Client reviewed and approved all migrated content
- [ ] Client tested cart and WhatsApp checkout

### Phase 7: Deployment
- [ ] Site deployed to Vercel preview branch
- [ ] Client preview approved
- [ ] DNS switched to Vercel
- [ ] SSL certificate active
- [ ] sitemap.xml submitted to Google Search Console
- [ ] Google Analytics configured (if needed)

---

## Key Files to Create

### Payload Collections
1. `src/payload/collections/Products.ts` - Products collection (27 items)
2. `src/payload/collections/Testimonials.ts` - Testimonials collection (8 items)
3. `src/payload/collections/Posts.ts` - Blog posts collection (1+ items)
4. `src/payload/globals/index.ts` - Site globals (WhatsApp, defaults, etc.)

### Next.js Pages
1. `src/app/page.tsx` - Homepage (single-page scroll)
2. `src/app/produse/page.tsx` - Products grid with filters
3. `src/app/produse/[slug]/page.tsx` - Individual product pages
4. `src/app/cos/page.tsx` - Cart page
5. `src/app/blog/page.tsx` - Blog listing
6. `src/app/blog/[slug]/page.tsx` - Individual blog posts
7. `src/app/maiaua-mea/page.tsx` - About/sourdough story page
8. `src/app/politica-de-confidentialitate/page.tsx` - Privacy policy

### Components
1. `src/components/ProductCard.tsx` - Product grid card component
2. `src/components/CartIcon.tsx` - Header cart icon with count
3. `src/components/WhatsAppButton.tsx` - Scroll-triggered floating button
4. `src/components/TestimonialsCarousel.tsx` - Home page testimonials
5. `src/components/Navigation.tsx` - Mobile-first responsive nav

### Utilities
1. `src/lib/cart.ts` - Cart state management (localStorage)
2. `src/lib/whatsapp.ts` - WhatsApp message formatting
3. `src/lib/redirects.ts` - 301 redirect mappings

---

## Implementation Priority Order

1. **Foundation**: Payload setup, collections, globals
2. **Content Migration**: Import all products, testimonials, blog post
3. **Media**: Download and upload images to Vercel Blob
4. **Core Pages**: Home, products listing, individual products
5. **Cart System**: Cart state, cart page, WhatsApp checkout
6. **Navigation**: Mobile-first nav, scroll-triggered WhatsApp button
7. **Content Pages**: Blog, about, privacy policy
8. **Redirects**: Configure 301 redirects in next.config.js
9. **Testing**: Full end-to-end testing
10. **Deployment**: Preview branch → client approval → DNS switch

---

## Payload Collections Schema

### Products Collection (Complete with All Fields)
```typescript
{
  slug: 'products',
  fields: [
    // Basic Info
    {
      name: 'name',
      type: 'text',
      required: true,
      label: 'Nume produs'
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
      label: 'Slug (URL)'
    },
    {
      name: 'shortDescription',
      type: 'text',
      required: true,
      label: 'Scurtă descriere (pentru card)'
    },

    // Detailed Content (from individual product pages)
    {
      name: 'introProduct',
      type: 'textarea',
      label: 'Introducere produs (intro-produs)'
    },
    {
      name: 'description',
      type: 'richText',
      label: 'Descriere detaliată'
    },
    {
      name: 'characteristics',
      type: 'array',
      fields: [{ name: 'characteristic', type: 'text' }],
      label: 'Caracteristici (bullet list)'
    },
    {
      name: 'ingredients',
      type: 'textarea',
      label: 'Ingrediente'
    },
    {
      name: 'allergens',
      type: 'textarea',
      label: 'Alergeni (IMPORTANT LEGALLY)'
    },
    {
      name: 'nutritionalValues',
      type: 'richText',
      label: 'Valori nutritionale (IMPORTANT LEGALLY)'
    },

    // Product Details
    {
      name: 'weight',
      type: 'text',
      required: true,
      label: 'Greutate'
    },
    {
      name: 'price',
      type: 'number',
      required: true,
      label: 'Preț (lei)'
    },
    {
      name: 'category',
      type: 'select',
      options: [
        { value: 'regular', label: 'Produs curent' },
        { value: 'sweet', label: 'Produs dulce' },
        { value: 'occasional', label: 'Produs ocazional' }
      ],
      required: true,
      label: 'Categorie'
    },
    {
      name: 'available',
      type: 'checkbox',
      default: true,
      label: 'Disponibil'
    },
    {
      name: 'availabilityText',
      type: 'text',
      label: 'Text disponibilitate (ex: "Disponibilă doar vinerea")'
    },
    {
      name: 'orderingInfo',
      type: 'richText',
      label: 'Informații comandă'
    },

    // Media
    {
      name: 'featuredImage',
      type: 'upload',
      required: true,
      label: 'Imagine principală'
    },
    {
      name: 'gallery',
      type: 'array',
      fields: [{ name: 'image', type: 'upload' }],
      label: 'Galerie imagini suplimentare'
    },

    // SEO
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO Titlu'
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'SEO Descriere'
    },
    {
      name: 'seoKeywords',
      type: 'text',
      label: 'SEO Cuvinte cheie'
    }
  ]
}
```

### Testimonials Collection
```typescript
{
  slug: 'testimonials',
  fields: [
    {
      name: 'author',
      type: 'text',
      required: true,
      label: 'Autor'
    },
    {
      name: 'content',
      type: 'textarea',
      required: true,
      label: 'Conținut'
    },
    {
      name: 'language',
      type: 'select',
      options: [
        { value: 'ro', label: 'Română' },
        { value: 'en', label: 'English' },
        { value: 'de', label: 'Deutsch' }
      ],
      required: true,
      label: 'Limbă'
    },
    {
      name: 'published',
      type: 'checkbox',
      default: true,
      label: 'Publicat'
    }
  ]
}
```

### Posts Collection
```typescript
{
  slug: 'posts',
  fields: [
    {
      name: 'title',
      type: 'text',
      required: true,
      label: 'Titlu'
    },
    {
      name: 'slug',
      type: 'text',
      unique: true,
      required: true,
      label: 'Slug (URL)'
    },
    {
      name: 'content',
      type: 'richText',
      required: true,
      label: 'Conținut articol'
    },
    {
      name: 'excerpt',
      type: 'textarea',
      label: 'Excerpt (rezumat)'
    },
    {
      name: 'publishedDate',
      type: 'date',
      required: true,
      label: 'Data publicare'
    },
    {
      name: 'featuredImage',
      type: 'upload',
      label: 'Imagine articol'
    },
    {
      name: 'seoTitle',
      type: 'text',
      label: 'SEO Titlu'
    },
    {
      name: 'seoDescription',
      type: 'textarea',
      label: 'SEO Descriere'
    }
  ]
}
```

---

## next.config.js Redirects Configuration

```javascript
module.exports = {
  async redirects() {
    return [
      // Page redirects
      { source: '/acasa', destination: '/', permanent: true },
      { source: '/privacy-policy', destination: '/politica-de-confidentialitate', permanent: true },
      { source: '/despre-mine', destination: '/maiaua-mea', permanent: true },
      { source: '/cum-comand', destination: '/#comanda', permanent: true },
      { source: '/produsele-mele-2', destination: '/produse', permanent: true },
      { source: '/shop', destination: '/produse', permanent: true },
      { source: '/cart', destination: '/cos', permanent: true },
      { source: '/checkout', destination: '/cos', permanent: true },
      { source: '/my-account', destination: '/#contact', permanent: true },

      // Product redirects (main 9)
      { source: '/paine-mixta-cu-maia', destination: '/produse/paine-mixta', permanent: true },
      { source: '/paine-integrala-cu-maia', destination: '/produse/paine-integrala', permanent: true },
      { source: '/paine-fara-gluten', destination: '/produse/paine-fara-gluten', permanent: true },
      { source: '/paine-san-joaquin-cu-maia', destination: '/produse/paine-san-joaquin', permanent: true },
      { source: '/paine-de-secara-cu-maia', destination: '/produse/paine-de-secara', permanent: true },
      { source: '/chifle-cu-maia', destination: '/produse/chifle', permanent: true },
      { source: '/bagheta-mixta-cu-piper', destination: '/produse/bagheta-mixta-cu-piper', permanent: true },
      { source: '/bagheta-integrala-cu-piper', destination: '/produse/bagheta-integrala-cu-piper', permanent: true },
      { source: '/bagheta-cu-unt', destination: '/produse/bagheta-cu-unt', permanent: true },

      // Blog post redirect
      { source: '/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu', destination: '/blog/17-ani-de-maia', permanent: true },

      // Testimonial redirects (all to home)
      { source: '/testimonial/:path*', destination: '/', permanent: true },
    ]
  }
}
```

---

## Homepage Structure Specification

### Section 1: Hero
- Full-width background image
- Headline: "Pâine cu Maia by Virgil"
- Subheadline about artisanal bread
- Scroll indicator

### Section 2: About
- "Despre mine" section
- Story about the 17-year sourdough
- ETH Zurich study reference
- Link to full "Maiaua Mea" page

### Section 3: Featured Products
- 6-8 highlighted products
- Carousel or grid layout
- Category badges (regular/sweet/occasional)
- "Vezi toate produsele" CTA

### Section 4: All Products
- Complete product grid (27 items)
- Filter buttons: Toate, Curente, Dulci, Ocazionale
- 3-column responsive grid
- Add to cart functionality

### Section 5: Testimonials
- Carousel showing 3-5 testimonials
- Auto-rotate every 5 seconds
- Author names and quotes
- Language badges (ro/en/de)

### Section 6: Delivery Info
- "Livrare în Sibiu: marți și vineri"
- "Livrare națională prin curier"
- WhatsApp order process explanation

### Section 7: Contact
- Phone: +40 746 245 391
- Email: bucsavirgil@yahoo.com
- WhatsApp CTA button
- "Contact" anchor section

### Footer
- Logo
- Quick links
- Social media links (if any)
- Copyright

---

## Media Migration Strategy

### Phase 1: Download
- Use existing PowerShell script in `WP_BACKUP/download-wordpress-media.ps1`
- Download all 800+ images from WordPress media library
- Organize by product/category into folders

### Phase 2: Upload to Vercel Blob
- Create Vercel Blob storage account
- Upload all images using Blob CLI or SDK
- Generate new Blob URLs for each image

### Phase 3: Update Content References
- Parse WordPress content for image URLs
- Replace old URLs with new Blob URLs
- Update featured image references in Payload
- Test all images load correctly

### Phase 4: Optimize
- Configure Next.js Image component
- Enable WebP/AVIF conversion
- Set up image caching headers
- Test image loading performance

---

## Client Training Checklist

### Payload CMS Basics
- [ ] Login to `/admin`
- [ ] Navigate to Products collection
- [ ] Edit existing product (price, description, availability)
- [ ] Create new product
- [ ] Upload and manage images
- [ ] Toggle product availability on/off

### Content Management
- [ ] Edit static pages via Globals
- [ ] Update WhatsApp phone number
- [ ] Manage testimonials
- [ ] Create/edit blog posts

### Cart & Order Testing
- [ ] Add product to cart
- [ ] Update quantities
- [ ] Remove from cart
- [ ] Proceed to WhatsApp checkout
- [ ] Verify message formatting
- [ ] Test WhatsApp link opens correctly

---

## Post-Launch Considerations

### Performance Monitoring
- Set up Vercel Analytics
- Monitor Core Web Vitals
- Track image loading performance
- Measure cart abandonment rate

### SEO Maintenance
- Monitor Google Search Console
- Check 301 redirects are working
- Submit updated sitemap
- Monitor keyword rankings

### Content Updates
- Regular product availability updates (toggle seasonal products)
- Price updates as needed
- New blog posts
- Fresh testimonials collection

### Technical Maintenance
- Monitor Vercel Blob storage usage (250GB limit)
- Regular backups of Turso database
- Update dependencies regularly
- Monitor error logs

---

## Tech Stack Setup: Initial Project Initialization

### Prerequisites
- Node.js 18+ and npm
- Git
- Vercel account (for deployment)
- Turso account (for database)

### Step 1: Create Next.js Project with Payload CMS 3.0
```bash
# Create new Next.js project with App Router
npx create-next-app@latest painecumaya-byvirgil --typescript --tailwind --eslint

# Navigate to project
cd painecumaya-byvirgil

# Install Payload CMS 3.0
npm install @payloadcms/payload @payloadcms/bundler-webpack @payloadcms/db-postgres
npm install @payloadcms/db-turso payload-cloud-previews

# Install additional dependencies
npm install @payloadcms/richtext-lexical
npm install @payloadcms/bundler-cloud
npm install @payloadcms/storage-vercel-blob

# Install UI components
npm install tailwindcss-animate class-variance-authority
npm install clsx tailwind-merge

# Install shadcn/ui
npx shadcn-ui@latest init
```

### Step 2: Configure Payload CMS
Create `src/payload/payload.config.ts`:
```typescript
import { buildConfig } from 'payload/config'
import { postgresAdapter } from '@payloadcms/db-postgres'
import { tursoAdapter } from '@payloadcms/db-turso'
import { lexicalEditor } from '@payloadcms/richtext-lexical'
import { vercelBlobStorage } from '@payloadcms/storage-vercel-blob'
import path from 'path'

export default buildConfig({
  serverURL: process.env.NEXT_PUBLIC_SERVER_URL || 'http://localhost:3000',
  admin: {
    user: 'admin',
    build: {
      outputDir: path.resolve(__dirname, 'admin')
    }
  },
  db: tursoAdapter({
    url: process.env.TURSO_DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  }),
  editor: lexicalEditor(),
  collections: [
    // Products, Testimonials, Posts collections will be added here
  ],
  globals: [
    // Site globals for WhatsApp, contact info, etc.
  ],
  typescript: {
    outputFile: path.resolve(__dirname, 'payload-types.ts'),
  },
})
```

### Step 3: Environment Variables
Create `.env.local`:
```env
# Database
TURSO_DATABASE_URL='file:../local.db'
TURSO_AUTH_TOKEN='your-turso-auth-token'

# Payload
PAYLOAD_SECRET='your-payload-secret-key'

# Vercel Blob
BLOB_READ_WRITE_TOKEN='your-vercel-blob-token'

# WhatsApp
NEXT_PUBLIC_WHATSAPP_NUMBER='40746245391'
NEXT_PUBLIC_WHATSAPP_MESSAGE='Buna ziua! Doresc sa comand...'

# Vercel
NEXT_PUBLIC_SERVER_URL='http://localhost:3000'
```

### Step 4: Configure Tailwind CSS
Update `tailwind.config.js`:
```javascript
import { fontFamily } from 'tailwindcss.config'

const theme = {
  extend: {
    fontFamily: {
      sans: ['var(--font-inter)', 'sans-serif'],
      serif: ['Playfair Display', 'Merriweather', 'serif'],
      body: ['var(--font-body)', 'sans-serif'],
    },
    colors: {
      // Earthy artisanal bakery theme
      stone: {
        50: '#fafaf9',  // background
        100: '#f5f5f4',
        200: '#e7e5e4',
        300: '#d6d3d1',
        400: '#a8a29e',
        500: '#78716c',
        600: '#57534e',
        700: '#44403c',  // text primary
        800: '#292524',
        900: '#1c1917',  // text secondary
      },
      // Warm copper/amber accents
      amber: {
        DEFAULT: '#f59e0b',
        50: '#fffbeb',
        100: '#fef3c7',
        200: '#fde68a',
        300: '#fcd34d',
        400: '#fbbf24',
        500: '#f59e0b',
        600: '#d97706',
      },
      // WhatsApp green
      whatsapp: {
        DEFAULT: '#25D366',
      }
    }
  }
}
```

### Step 5: Add shadcn/ui Components
```bash
# Install essential shadcn components
npx shadcn-ui@latest add button card input textarea
npx shadcn-ui@latest add select carousel badge
npx shadcn-ui@latest add dialog separator sheet
```

### Step 6: Configure Next.js
Update `next.config.js` with redirects and image optimization:
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.vercel-storage.com',
      },
    ],
  },
  async redirects() {
    return [
      // Page redirects
      { source: '/acasa', destination: '/', permanent: true },
      { source: '/privacy-policy', destination: '/politica-de-confidentialitate', permanent: true },
      { source: '/despre-mine', destination: '/maiaua-mea', permanent: true },
      { source: '/cum-comand', destination: '/#comanda', permanent: true },
      { source: '/produsele-mele-2', destination: '/produse', permanent: true },
      { source: '/shop', destination: '/produse', permanent: true },
      { source: '/cart', destination: '/cos', permanent: true },
      { source: '/checkout', destination: '/cos', permanent: true },
      { source: '/my-account', destination: '/#contact', permanent: true },

      // Product redirects
      { source: '/paine-mixta-cu-maia', destination: '/produse/paine-mixta', permanent: true },
      { source: '/paine-integrala-cu-maia', destination: '/produse/paine-integrala', permanent: true },
      { source: '/paine-fara-gluten', destination: '/produse/paine-fara-gluten', permanent: true },
      { source: '/paine-san-joaquin-cu-maia', destination: '/produse/paine-san-joaquin', permanent: true },
      { source: '/paine-de-secara-cu-maia', destination: '/produse/paine-de-secara', permanent: true },
      { source: '/chifle-cu-maia', destination: '/produse/chifle', permanent: true },
      { source: '/bagheta-mixta-cu-piper', destination: '/produse/bagheta-mixta-cu-piper', permanent: true },
      { source: '/bagheta-integrala-cu-piper', destination: '/produse/bagheta-integrala-cu-piper', permanent: true },
      { source: '/bagheta-cu-unt', destination: '/produse/bagheta-cu-unt', permanent: true },

      // Blog post redirect
      { source: '/de-ce-am-facut-o-maia-de-la-zero-si-ce-a-gasit-un-studiu-european-in-ea-17-ani-mai-tarziu', destination: '/blog/17-ani-de-maia', permanent: true },

      // Testimonial redirects
      { source: '/testimonial/:path*', destination: '/', permanent: true },
    ]
  },
}

module.exports = nextConfig
```

---

## Styling & Design System

### Design Tokens & Theme Configuration

The site uses an editorial serif + earthy tones aesthetic inspired by artisanal bakeries:

**Typography:**
- **Headings (h1-h6)**: Playfair Display (editorial serif, elegant)
- **Body text**: Merriweather (readable serif, warm)
- **UI elements**: Inter (modern sans-serif for controls)

**Color Palette:**
- **Backgrounds**: stone-50 (#fafaf9) - warm off-white
- **Text Primary**: stone-900 (#1c1917) - near black
- **Text Secondary**: stone-700 (#44403c) - dark gray
- **Accents**: amber-500 (#f59e0b) - warm copper/orange
- **Call-to-Actions**: whatsapp green (#25D366)

**Component Examples:**
```tsx
// Product card with warm bakery aesthetic
<div className="bg-stone-50 rounded-lg overflow-hidden shadow-md hover:shadow-lg transition-shadow">
  <img src={product.featuredImage.url} alt={product.name} className="w-full h-48 object-cover" />
  <div className="p-6">
    <span className="inline-block px-2 py-1 text-xs font-semibold text-amber-600 bg-amber-50 rounded-full mb-2">
      {product.category === 'regular' ? 'Curent' : 'Ocazional'}
    </span>
    <h3 className="text-xl font-serif text-stone-900 mb-2">{product.name}</h3>
    <p className="text-stone-700 mb-4">{product.shortDescription}</p>
    <div className="flex items-center justify-between">
      <span className="text-2xl font-bold text-amber-600">{product.price} lei</span>
      <span className="text-stone-500 text-sm">{product.weight}</span>
    </div>
    <button className="w-full mt-4 bg-amber-500 hover:bg-amber-600 text-stone-50 py-2 rounded-lg font-semibold transition-colors">
      Adaugă în coș
    </button>
  </div>
</div>
```

### Section Styling Patterns

**Hero Section:**
- Full-screen height with overlay
- Background image with gradient overlay
- Large serif headline
- WhatsApp CTA button (scroll-triggered)

**Products Grid:**
- Responsive 3-column grid (desktop)
- 2-column (tablet)
- 1-column (mobile)
- Category filter buttons (pill-shaped)
- Product cards with hover effects

**Testimonials Carousel:**
- Auto-rotating every 5 seconds
- Fade transitions
- Quote styling with attribution
- Language badges (RO/EN/DE)

**WhatsApp Integration:**
- Scroll-triggered floating button (appears after hero section)
- Pulsing animation for attention
- Green WhatsApp color (#25D366)
- Fixed position: bottom-right, 20px margin

---

## Media Migration Strategy (Updated)

### Current State
All 800+ images are already downloaded in `./WP_BACKUP/wordpress-media/`

### Phase 1: Organize Existing Files
```bash
# Create organized structure
cd WP_BACKUP/wordpress-media

# Create category folders
mkdir -p products/{regular,sweet,occasional}
mkdir -p logos
mkdir -p testimonials
mkdir -p blog

# Move images by category (manual process based on WordPress export mapping)
# Example:
mv PXL_20260319_121417485.PORTRAIT.jpg products/regular/
mv Gilu-118-1.jpg products/regular/
```

### Phase 2: Selective Upload to Vercel Blob
**Strategy**: Only upload images that are actually referenced in content, not all 800+ files.

**Process:**
1. Parse WordPress XML for all image references
2. Create mapping table: old URL → local file path
3. Upload ONLY used images to Vercel Blob
4. Generate new Blob URLs
5. Update content with new URLs

**Selective Upload Script Concept:**
```javascript
// Parse WordPress export, extract used images
const usedImages = parseImageReferences('painecumaia.WordPress.2026-05-19.xml')

// Upload only used images to Vercel Blob
usedImages.forEach(async (image) => {
  const blobUrl = await uploadToVercelBlob(image.localPath)
  image.blobUrl = blobUrl
})

// Update content references in migrated products
products.forEach(product => {
  product.description = replaceImageUrls(product.description, imageMapping)
})
```

### Phase 3: Logo Files
Identify and organize logo variants:
- Logo header (main site logo)
- Logo footer (smaller variant)
- Fav icon (site icon)

---

## Homepage Sections: Detailed Content Breakdown

### Section 1: Hero (100vh)
**Content:**
- Background: Product collage image or baker at work
- Headline: "Pâine cu Maia by Virgil" (Playfair Display, large)
- Subheadline: "Pâine artizanală, fermentată lent, coaptă pe vatră"
- CTA: "Vezi produsele" (scrolls to products section)

**Styling:**
```tsx
<section className="relative h-screen flex items-center justify-center bg-stone-900">
  {/* Background image with overlay */}
  <div className="absolute inset-0 bg-cover bg-center" style={{backgroundImage: 'url(/images/hero-bg.jpg)'}} />
  <div className="absolute inset-0 bg-gradient-to-b from-black/70 via-black/50 to-black/80" />

  {/* Content */}
  <div className="relative z-10 text-center px-6">
    <h1 className="text-5xl md:text-7xl font-serif text-white mb-6">
      Pâine cu Maia by Virgil
    </h1>
    <p className="text-xl md:text-2xl text-stone-200 mb-8 max-w-2xl mx-auto">
      Pâine artizanală, fermentată lent, coaptă pe vatră
    </p>
    <a href="#produse" className="inline-block bg-amber-500 hover:bg-amber-600 text-stone-50 px-8 py-4 rounded-lg text-lg font-semibold transition-colors">
      Vezi produsele
    </a>
  </div>
</section>
```

### Section 2: About (maiaua-mea excerpt)
**Content:**
- Heading: "Despre pâinea noastră"
- 2-3 paragraphs about the 17-year sourdough journey
- ETH Zurich study mention
- Link: "Citește mai mult →" (links to full /maiaua-mea page)

### Section 3: Featured Products
**Content:**
- Heading: "Produsele noastre de bază"
- 6-8 products carousel or highlighted grid
- Focus on regular products available Tuesday/Friday

### Section 4: All Products
**Content:**
- Heading: "Toate produsele"
- Filter buttons: "Toate", "Curente", "Dulci", "Ocazionale"
- 27 products in responsive grid
- Category badges and availability indicators

### Section 5: Testimonials
**Content:**
- Heading: "Ce spun clienții noștri"
- 3-5 testimonials visible, auto-rotating
- Author names and language badges

### Section 6: Delivery Info
**Content:**
- Heading: "Cum comandăm și livrăm"
- "Livrare în Sibiu: marți și vineri"
- "Livrare națională prin curier"
- WhatsApp order process explanation

### Section 7: Contact
**Content:**
- Heading: "Contact"
- Phone: +40 746 245 391
- Email: bucsavirgil@yahoo.com
- WhatsApp CTA

---

## Product Page Template Structure

Each individual product page (`/produse/[slug]`) follows this structure:

```html
<h1>{Product Name}</h1>

<p class="intro-produs">
  {Short introduction for product cards}
</p>

<h2>Descriere</h2>
<p>{Detailed product description}</p>

<h2>Caracteristici</h2>
<ul>
  <li>Characteristic 1</li>
  <li>Characteristic 2</li>
  ...
</ul>

<h2>Ingrediente</h2>
<p>{Ingredients list}</p>

<h2>Alergeni</h2>
<p>{Allergen information} (IMPORTANT: legally required)</p>

<h2>Valori nutritionale</h2>
<p class="nota-produs">Valori aproximative / 100 g</p>
<table>
  <tr><th>Energie</th><td>{value} kcal</td></tr>
  <tr><td>Proteine</th><td>{value} g</td></tr>
  <tr><th>Carbohidrati</th><td>{value} g</td></tr>
  <tr><th>Zaharuri</th><td>{value} g</td></tr>
  <tr><th>Grasimi</th><td>{value} g</td></tr>
  <tr><th>Fibre</th><td>{value} g</td></tr>
  <tr><th>Sare</th><td>{value} g</td></tr>
</table>

<h2>Greutate</h2>
<p>{Weight information}</p>

<h2>Disponibilitate</h2>
<p>{Availability text}</p>

<h2>Comandă</h2>
<p>{Ordering instructions or WhatsApp button}</p>
```

---

## Cart System: Detailed Implementation

### Cart Context Provider
```typescript
// src/context/CartContext.tsx
interface CartItem {
  id: string
  name: string
  price: number
  quantity: number
  weight: string
  category: string
  slug: string
}

interface CartState {
  items: CartItem[]
  addItem: (product: Product) => void
  removeItem: (id: string) => void
  updateQuantity: (id: string, quantity: number) => void
  clearCart: () => void
  getTotalPrice: () => number
  getItemCount: () => number
}
```

### WhatsApp Message Generator
```typescript
// src/lib/whatsapp.ts
export function generateWhatsAppMessage(cart: CartState, formData: OrderFormData): string {
  const items = cart.items.map(item =>
    `• ${item.quantity}x ${item.name} (${item.weight}) - ${item.price * item.quantity} lei`
  ).join('\n')

  const total = cart.getTotalPrice()

  return `Bună ziua! Doresc să comand:

${items}

Total: ${total} lei

Nume: ${formData.name}
Telefon: ${formData.phone}
Adresă: ${formData.address}

Mulțumesc!`
}
```

### Cart Page Structure
```tsx
// src/app/cos/page.tsx
<section className="max-w-4xl mx-auto py-16 px-6">
  <h1 className="text-4xl font-serif text-stone-900 mb-8">Coșul tău</h1>

  {/* Cart items list */}
  <div className="space-y-4 mb-8">
    {cartItems.map(item => (
      <CartItem key={item.id} item={item} />
    ))}
  </div>

  {/* Order summary */}
  <div className="bg-stone-50 rounded-lg p-6">
    <div className="flex justify-between mb-4">
      <span className="text-lg font-semibold">Total:</span>
      <span className="text-2xl font-bold text-amber-600">{totalPrice} lei</span>
    </div>

    {/* Order form */}
    <form onSubmit={handleWhatsAppCheckout} className="space-y-4">
      <input name="name" placeholder="Nume" required />
      <input name="phone" placeholder="Telefon" required />
      <input name="address" placeholder="Adresă" required />
      <button type="submit" className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold">
        Comandă prin WhatsApp
      </button>
    </form>
  </div>
</section>
```

---

## Navigation Component (Mobile-First)

```tsx
// src/components/Navigation.tsx
'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { CartIcon } from './CartIcon'

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false)
  const [showWhatsApp, setShowWhatsApp] = useState(false)

  useEffect(() => {
    const handleScroll = () => {
      setShowWhatsApp(window.scrollY > 800)
    }
    window.addEventListener('scroll', handleScroll)
    return () => window.removeEventListener('scroll', handleScroll)
  }, [])

  return (
    <>
      <header className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm z-50 border-b border-stone-200">
        <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
          {/* Logo */}
          <Link href="/" className="text-xl font-serif text-stone-900">
            Pâine cu Maia
          </Link>

          {/* Desktop Navigation */}
          <ul className="hidden md:flex space-x-8">
            <li><Link href="/produse" className="text-stone-700 hover:text-stone-900">Produse</Link></li>
            <li><Link href="/maiaua-mea" className="text-stone-700 hover:text-stone-900">Despre</Link></li>
            <li><Link href="/blog" className="text-stone-700 hover:text-stone-900">Blog</Link></li>
            <li><Link href="/#contact" className="text-stone-700 hover:text-stone-900">Contact</Link></li>
          </ul>

          {/* Cart & Mobile Menu */}
          <div className="flex items-center space-x-4">
            <CartIcon />
            <button onClick={() => setIsOpen(!isOpen)} className="md:hidden">
              {isOpen ? '✕' : '☰'}
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Menu */}
      {isOpen && (
        <div className="md:hidden fixed inset-0 bg-white z-40 pt-20 px-6">
          <ul className="space-y-4">
            <li><Link href="/produse" className="block text-lg py-2">Produse</Link></li>
            <li><Link href="/maiaua-mea" className="block text-lg py-2">Despre</Link></li>
            <li><Link href="/blog" className="block text-lg py-2">Blog</Link></li>
            <li><Link href="/#contact" className="block text-lg py-2">Contact</Link></li>
          </ul>
        </div>
      )}

      {/* Scroll-triggered WhatsApp Button */}
      {showWhatsApp && (
        <a
          href="https://wa.me/40746245391"
          target="_blank"
          rel="noopener noreferrer"
          className="fixed bottom-6 right-6 z-50 bg-green-500 hover:bg-green-600 text-white p-4 rounded-full shadow-lg animate-pulse"
        >
          <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
            <path d="M17.472 14.382c-.297-.149-1.758-.687-2.03-1.207-.626-.741-1.702-1.236-1.702-1.236-1.423-4.674-3.421-4.674-3.421z"/>
          </svg>
        </a>
      )}
    </>
  )
}
```

---

## Product Filtering Implementation

```typescript
// src/components/ProductFilters.tsx
'use client'

import { useState } from 'react'

interface ProductFiltersProps {
  onFilter: (category: string) => void
}

export function ProductFilters({ onFilter }: ProductFiltersProps) {
  const [activeFilter, setActiveFilter] = useState('toate')

  const filters = [
    { value: 'toate', label: 'Toate' },
    { value: 'regular', label: 'Curente' },
    { value: 'sweet', label: 'Dulci' },
    { value: 'occasional', label: 'Ocazionale' },
  ]

  return (
    <div className="flex flex-wrap gap-2 mb-8">
      {filters.map((filter) => (
        <button
          key={filter.value}
          onClick={() => {
            setActiveFilter(filter.value)
            onFilter(filter.value)
          }}
          className={`px-4 py-2 rounded-full font-medium transition-colors ${
            activeFilter === filter.value
              ? 'bg-amber-500 text-white'
              : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
          }`}
        >
          {filter.label}
        </button>
      ))}
    </div>
  )
}
```

---

## WhatsApp Integration: Complete Implementation

### WhatsApp Checkout Function
```typescript
// src/lib/whatsapp.ts
export interface OrderFormData {
  name: string
  phone: string
  address: string
}

export interface CartItem {
  name: string
  price: number
  quantity: number
  weight: string
}

export function generateWhatsAppMessage(
  items: CartItem[],
  total: number,
  formData: OrderFormData
): string {
  const itemsList = items
    .map(item => `• ${item.quantity}x ${item.name} (${item.weight}) - ${item.price * item.quantity} lei`)
    .join('\n')

  return `Bună ziua! Doresc să comand:

${itemsList}

Total: ${total} lei

Nume: ${formData.name}
Telefon: ${formData.phone}
Adresă: ${formData.address}

Mulțumesc!`
}

export function createWhatsAppLink(message: string): string {
  const encoded = encodeURIComponent(message)
  return `https://wa.me/40746245391?text=${encoded}`
}
```

### Cart Checkout Component
```typescript
// src/components/CartCheckout.tsx
'use client'

import { useState } from 'react'
import { generateWhatsAppMessage, createWhatsAppLink } from '@/lib/whatsapp'
import { useCart } from '@/context/CartContext'

export function CartCheckout() {
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: ''
  })
  const { items, getTotalPrice } = useCart()

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const message = generateWhatsAppMessage(items, getTotalPrice(), formData)
    const whatsappUrl = createWhatsAppLink(message)
    window.open(whatsappUrl, '_blank')
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="text"
        placeholder="Nume complet"
        value={formData.name}
        onChange={(e) => setFormData({...formData, name: e.target.value})}
        required
        className="w-full px-4 py-2 border border-stone-300 rounded-lg"
      />
      <input
        type="tel"
        placeholder="Telefon"
        value={formData.phone}
        onChange={(e) => setFormData({...formData, phone: e.target.value})}
        required
        className="w-full px-4 py-2 border border-stone-300 rounded-lg"
      />
      <input
        type="text"
        placeholder="Adresă livrare"
        value={formData.address}
        onChange={(e) => setFormData({...formData, address: e.target.value})}
        required
        className="w-full px-4 py-2 border border-stone-300 rounded-lg"
      />
      <button
        type="submit"
        className="w-full bg-green-500 hover:bg-green-600 text-white py-3 rounded-lg font-semibold"
      >
        Comandă prin WhatsApp
      </button>
    </form>
  )
}
```

---

## Appendix: WordPress Export File Reference

**File**: `painecumaia.WordPress.2026-05-19.xml`
**Size**: 4MB
**Total Items**: 800+ (mostly attachments)
**Structure**: WXR format with items, categories, and metadata

**Key Sections Analyzed**:
- Lines 18365-19050: Product grid with pricing
- Lines 16150-16180: Privacy policy content
- Lines 16900-16940: Maiaua mea page content
- Lines 20220-20244: Blog post content
- Lines 23330-23610: Testimonials content

---

## Quick Reference: Product Data Extraction

The pricing data was found in the WordPress export in the `mfn-page-items-seo` meta field, formatted as product cards with inline buttons and pricing info:

```html
Paine mixta
<img src="..." alt=""/>
<p>800g • 23 lei</p>
<p>Disponibila marti si vineri</p>
<p>Miez aerat si coaja subtire</p>
<button onclick="adauga('paine mixta')" style="...">Adauga in comanda</button>
```

This format was used for the product grid on the "Produsele Mele" page, and is the source of truth for product pricing and availability information.

# WordPress Migration Planning Interview Summary

**Project**: Pâine cu Maia by Virgil
**Date**: 2026-05-19
**Purpose**: Q&A session to define all design decisions before creating the comprehensive migration plan

---

## Interview Process Overview

This document captures the question-and-answer session where all design decisions were made for migrating the WordPress site (painecumaya-byvirgil.ro) to Next.js + Payload CMS. Each question included recommended answers based on best practices for small artisanal businesses.

---

## Question 1: Product Pricing Strategy

**Question**: How should we handle product pricing in the new system?

**Options Presented**:
- A) Make price optional and let client add it later
- B) Extract pricing from WordPress export (if available)
- C) Start all products at 0 lei and client fills in later
- D) Make pricing a required field from day one

**User Feedback**:
"You are wrong, it exists but it's a bit hidden inside some custom code like `<p>800g • 23 lei</p>`"

**Final Decision**: ✅ **Option B with D** - Extract all pricing from WordPress product grid (found in `mfn-page-items-seo` meta field) and make price a required field in the products collection.

**Implementation**: All 27 products with complete pricing were extracted from lines 18365-19050 of the WordPress XML.

---

## Question 2: About Page Strategy

**Question**: What should we do with the "Despre Mine" (About) page which is currently empty?

**Options Presented**:
- A) Keep it and create new content for it
- B) Remove it entirely
- C) 301 redirect to the "Maiaua Mea" (sourdough story) page
- D) Merge it into the home page

**User Decision**: "Remove page entirely and 301 redirect to maiaua-mea"

**Final Decision**: ✅ **Option C** - Remove "Despre Mine" page and set up 301 redirect to `/maiaua-mea`.

**Rationale**: The sourdough story page ("Maiaua Mea") already contains the personal story about Virgil and the 17-year sourdough starter. A separate empty about page would be redundant.

---

## Question 3: Product Categories Structure

**Question**: How should we organize products in the CMS?

**Options Presented**:
- A) Separate collections for each category (regularProducts, sweetProducts, occasionalProducts)
- B) Single `products` collection with a `category` field for filtering
- C) No categories, just use tags
- D) Create custom taxonomies

**User Decision**: "Single products collection with a category field"

**Final Decision**: ✅ **Option B** - Single `products` collection with a `category` field (regular/sweet/occasional).

**Rationale**:
- Easier to manage in one place
- Simple filtering on frontend
- Better searchability
- Scales well if new categories are added later

---

## Question 4: Product Availability Management

**Question**: How should we handle product availability (especially for seasonal products)?

**Options Presented**:
- A) Delete seasonal products when out of stock
- B) Add an `available` checkbox field to toggle visibility
- C) Use inventory numbers
- D) Keep seasonal products visible but mark as "out of stock"

**User Decision**: "There needs to be a way of toggling in the backend as well if a product is available or if it isn't"

**Final Decision**: ✅ **Option B** - Add an `available` checkbox field in Payload. Regular products default to available, seasonal products can be toggled on/off.

**Implementation**:
- Field: `available` (checkbox, default: true)
- Field: `availabilityText` (text, for custom messages like "Disponibilă doar vinerea")
- Products with `available: false` won't show on product grid

---

## Question 5: Product Display Layout

**Question**: How should we display products on the "Produsele Mele" page?

**Options Presented**:
- A) List view with details
- B) Grid view (2 columns)
- C) Grid view (3 columns)
- D) Masonry layout

**User Decision**: "All products with category badges and filters. 3-column grid."

**Final Decision**: ✅ **Option C with filters** - Show all products with category badges and filter buttons. Use a responsive 3-column grid (3 desktop, 2 tablet, 1 mobile).

**Implementation**:
- Filter buttons: "Toate", "Curente", "Dulci", "Ocazionale"
- Product cards with: image, name, short description, price, weight, category badge
- "Add to cart" button on each card

---

## Question 6: WhatsApp Integration Strategy

**Question**: How should WhatsApp be integrated for ordering?

**Options Presented**:
- A) Simple WhatsApp link on contact page
- B) WhatsApp button on each product
- C) Full cart system with WhatsApp checkout
- D) WhatsApp chat widget

**User Decision**: "We will have a cart page from where we can finish the order by sending a whatsapp message"

**Final Decision**: ✅ **Option C** - Two-tier WhatsApp approach:
1. Scroll-triggered floating WhatsApp button (appears after hero section)
2. Dedicated `/cos` (cart) page with full cart contents and formatted WhatsApp checkout

**Implementation**:
- Cart stored in localStorage (no server backup needed)
- Cart page shows all items with quantities and totals
- Form for customer name, phone, address
- "Comandă prin WhatsApp" button generates formatted message with all order details

---

## Question 7: Testimonials Display

**Question**: How should we display customer testimonials?

**Options Presented**:
- A) Dedicated testimonials page
- B) Sidebar on home page
- C) Carousel/rotator on home page
- D) Scattered throughout the site

**User Decision**: "What is the default go-to for this for a small artisanal manufacturing business? I think maybe a carousel or something on the main page"

**Final Decision**: ✅ **Option C** - Display as a rotating carousel on the home page showing 3-5 testimonials. No dedicated testimonials page needed.

**Implementation**:
- Auto-rotate every 5 seconds
- Show author name and language badge (RO/EN/DE)
- Fade transitions between testimonials
- 8 testimonials total from WordPress export

---

## Question 8: Blog Strategy

**Question**: How should we handle the blog section?

**Options Presented**:
- A) Skip the blog entirely (only 1 post exists)
- B) Migrate the existing post but no future posts
- C) Full blog infrastructure for future posts
- D) Use a third-party blogging platform

**User Decision**: "Migrate the existing blog post AND set up full blog infrastructure in Payload"

**Final Decision**: ✅ **Option C** - Set up complete blog infrastructure in Payload for future posts.

**Implementation**:
- `posts` collection with: title, slug, content, excerpt, publishedDate, featuredImage, SEO fields
- Blog listing page at `/blog`
- Individual blog posts at `/blog/[slug]`
- Migrate existing post: "De ce am făcut o maia de la zero..."

---

## Question 9: Homepage Structure

**Question**: What should the homepage layout be?

**Options Presented**:
- A) Traditional multi-page site with navigation
- B) Single-page scroll layout with sections
- C) Immersive hero + separate content pages
- D) Dashboard-style layout

**User Decision**: After reviewing screenshot options: "Single-page scroll layout or immersive hero + sections both work great here"

**Final Decision**: ✅ **Option B** - Single-page scroll layout with sections.

**Homepage Sections**:
1. Hero (full viewport) - Background image, main headline, CTA
2. About - Excerpt from "Maiaua Mea" story with "read more" link
3. Featured Products - 6-8 highlighted products
4. All Products - Complete product grid with filters
5. Testimonials - Carousel showing 3-5 testimonials
6. Delivery Info - Tuesday/Friday delivery schedule explanation
7. Contact - Phone, email, WhatsApp CTA
8. Footer

---

## Question 10: Navigation Design

**Question**: What navigation approach should we use?

**Options Presented**:
- A) Traditional top horizontal nav
- B) Sidebar navigation
- C) Mobile-first with hamburger menu
- D) Bottom navigation bar

**User Decision**: "Mobile-first responsive navigation with full-screen menu on small screens"

**Final Decision**: ✅ **Option C** - Mobile-first responsive navigation.

**Implementation**:
- Small screens: Full-screen menu with hamburger toggle
- Desktop screens: Horizontal navigation bar
- Fixed header with backdrop blur
- Logo on left, nav links center, cart icon and menu toggle on right

---

## Question 11: Cart Persistence Strategy

**Question**: How should we persist cart data?

**Options Presented**:
- A) Server-side database storage
- B) Client-side localStorage only
- C) Hybrid approach (localStorage + server backup)
- D) Session storage only

**User Decision**: "Client-side localStorage only"

**Final Decision**: ✅ **Option B** - Client-side localStorage only (no server backup).

**Rationale**:
- Simpler implementation
- Zero database costs
- No user accounts needed
- Cart persists across sessions
- Sufficient for WhatsApp checkout flow

---

## Question 12: Image Optimization Strategy

**Question**: How should we handle images for performance?

**Options Presented**:
- A) Manual optimization before upload
- B) Next.js Image component with CDN
- C) Third-party image service
- D) No optimization (raw images)

**User Decision**: "Next.js Image + Vercel Blob"

**Final Decision**: ✅ **Option B** - Next.js Image component + Vercel Blob storage.

**Implementation**:
- Upload images to Vercel Blob storage
- Use Next.js Image component with automatic WebP/AVIF conversion
- Configure image domains in next.config.js
- Lazy loading for below-fold images
- Responsive images with srcset

---

## Question 13: URL Structure Strategy

**Question**: What should the product URL structure be?

**Options Presented**:
- A) `/product/[slug]`
- B) `/produse/[slug]`
- C) `/shop/[slug]`
- D) `/p/[slug]`

**User Decision**: "/produse/[product-slug]"

**Final Decision**: ✅ **Option B** - `/produse/[slug]` pattern for all products.

**Examples**:
- `/produse/paine-mixta`
- `/produse/bagheta-cu-unt`
- `/produse/paine-fara-gluten`

---

## Question 14: 301 Redirect Strategy

**Question**: How should we handle old WordPress URLs for SEO?

**Options Presented**:
- A) No redirects (start fresh)
- B) Redirect only important pages
- C) Comprehensive redirects for all URLs
- D) Use redirect plugin

**User Decision**: "Create comprehensive redirect mappings for ALL old URLs"

**Final Decision**: ✅ **Option C** - Create comprehensive 301 redirects for all 27 products + pages.

**Implementation**:
- Configure redirects in `next.config.js`
- Map old WordPress URLs to new Next.js routes
- Test all redirects before launch
- Submit new sitemap to Google Search Console

**Total Redirects**: 30+ (pages, products, blog posts, testimonials)

---

## Question 15: Migration Workflow

**Question**: What should our deployment/migration workflow be?

**Options Presented**:
- A) Big bang switch (replace site immediately)
- B) Preview branch → client review → DNS switch
- C) Subdomain staging → migration
- D) Parallel running with A/B testing

**User Decision**: "Preview branch development → Client review → DNS switch"

**Final Decision**: ✅ **Option B** - Zero downtime migration workflow.

**Process**:
1. Build new site on Vercel preview branch
2. Client reviews and tests on preview URL
3. Fix any issues based on feedback
4. Once approved, switch DNS to point to Vercel
5. Monitor for issues
6. Keep old WordPress site for a few days as backup

---

## Question 16: Content Management Access

**Question**: How should the client manage content after launch?

**Options Presented**:
- A) Developer makes all changes
- B) Direct database access
- C) Payload CMS admin interface
- D) Static content files

**User Decision**: "Give client direct Payload CMS admin access"

**Final Decision**: ✅ **Option C** - Client gets direct Payload CMS admin access.

**Training Areas**:
- Login to `/admin`
- Edit product prices, descriptions, availability
- Upload and manage images
- Update static pages via Globals
- Manage testimonials and blog posts
- Toggle product availability on/off

---

## Question 17: WhatsApp Phone Number Management

**Question**: How should the WhatsApp phone number be stored?

**Options Presented**:
- A) Hardcoded in components
- B) Environment variable
- C) Payload CMS Global
- D) Database config table

**User Decision**: "Store in Payload Globals for easy updates"

**Final Decision**: ✅ **Option C** - Store WhatsApp number in Payload Globals.

**Implementation**:
- Create `site-config` Global with `whatsappNumber` field
- Default value: `+40 746 245 391`
- Client can update via Payload CMS admin
- Used in WhatsApp checkout and floating button

---

## Important Corrections During Interview

### Correction 1: Product Data Completeness
**Issue**: Initially stated that product pages only had basic info.
**User Correction**: "Each product besides the short description contains also a dedicated page with another short intro description, a long description, characteristics, ingredients, allergens, nutritional values (very important legally), weight, availability and order"
**Fix**: Updated product schema to include all fields including legally-required allergens and nutritional values.

### Correction 2: Media Migration Strategy
**Issue**: Initially planned to download all images from WordPress.
**User Correction**: "All media assets are already in that folder, we can skip it. Not all WordPress assets will need to be uploaded to Vercel Blob. We will try to keep it to a minimum"
**Fix**: Updated strategy to organize existing files and use selective upload (only used images).

### Correction 3: Missing Technical Setup
**Issue**: Plan lacked project initialization instructions.
**User Correction**: "Add a section with how we prepare the initial project with the latest tech stack"
**Fix**: Added comprehensive tech stack setup section with npm commands, Payload config, Tailwind config, and shadcn/ui installation.

### Correction 4: Missing Styling Information
**Issue**: No design system or styling details in plan.
**User Correction**: "There is no mentions about the style in the plan. It seems a lot of info that we discussed in the questions and grill-me session is missing"
**Fix**: Added complete styling system with typography, colors, component examples, navigation component, and WhatsApp integration.

---

## Design Principles Established

1. **Client Empowerment**: Non-technical client can manage all content via Payload CMS
2. **Zero Cost**: $0 monthly infrastructure cost (Vercel Hobby, Turso free tier)
3. **Performance**: Edge delivery with ISR, no database cold starts
4. **SEO Preservation**: Comprehensive 301 redirects for all old URLs
5. **Legal Compliance**: Include allergens and nutritional values on all products
6. **Mobile-First**: Responsive design optimized for mobile devices
7. **WhatsApp-Native**: Checkout flow designed for Romanian market preference for WhatsApp
8. **Editorial Aesthetic**: Serif typography with earthy, artisanal bakery feel

---

## Next Steps After Interview

1. ✅ Created comprehensive WORDPRESS_MIGRATION_PLAN.md document
2. ✅ Included all 27 products with complete pricing
3. ✅ Defined complete Payload collection schemas
4. ✅ Added tech stack setup instructions
5. ✅ Added styling system with Tailwind + shadcn/ui
6. ✅ Added cart implementation with WhatsApp integration
7. ✅ Added 301 redirect mappings for all URLs
8. ⏳ Awaiting user approval to begin implementation

---

**Interview Duration**: ~2 hours
**Total Questions Asked**: 17
**Decisions Made**: 17
**Corrections Applied**: 4
**Final Plan Status**: ✅ Complete and Ready for Implementation

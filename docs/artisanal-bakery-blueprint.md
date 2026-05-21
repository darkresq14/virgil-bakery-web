# 🥖 Artisanal Bakery Website Blueprint

A highly optimized, modern, and zero-cost web architecture tailored for an artisanal bakery website migration from WordPress to Next.js and Payload CMS.

---

## 🏗️ 1. Core Stack & Infrastructure
* **Frontend Framework:** Next.js (App Router) hosted on **Vercel (Hobby Tier)**.
* **Content Management:** **Payload CMS 3.0** (running natively inside the Next.js app at `/admin`).
* **Database:** **Turso** (SQLite/libSQL) utilizing a single production database instance for both local development and production.
* **Asset Storage:** **Vercel Blob** (handling logos, backgrounds, and product images up to 250MB).
* **Total Monthly Infrastructure Cost:** **$0**.

---

## ⚡ 2. Rendering, Performance & SEO
* **Strategy:** **On-Demand Incremental Static Regeneration (ISR)**.
* **Edge Delivery:** Next.js compiles the entire site into static HTML at build time. Vercel serves pages instantly from its global edge network, securing flawless Google PageSpeed and Core Web Vitals scores.
* **No Database Cold Starts:** Because pages are statically cached at the edge, visitors never experience wake-up delays from the database.
* **Background Updates:** When content or prices change in Payload, a native CMS collection hook triggers an on-demand revalidation (`revalidatePath`), keeping the site completely fresh without runtime overhead.

---

## 🎨 3. Frontend & Cart Architecture
* **Styling & UI Components:** **Tailwind CSS + shadcn/ui**.
* **Visual Identity:** Customized theme with elegant editorial serif headings (*e.g., Playfair Display / Merriweather*) paired with organic, earthy tones (*stone-50 backgrounds, stone-900 text, and warm copper/amber accents*).
* **Cart Logic:** Lightweight frontend-only architecture using React Context and `localStorage`.
* **Checkout Workflow:** A custom utility compiles the cart array into a clean, readable text string formatted in Romanian, encodes it, and redirects the user directly via a `wa.me` WhatsApp checkout link. Zero database tracking required.

---

## 🔒 4. Admin Experience & Handoff Guardrails
* **Localization:** Built natively in Romanian (`ro`) with Payload's localization array enabled from day one for seamless multi-language expansion in the future.
* **Static Pages (Home/About):** Managed via **Fixed Fields (Payload Globals)**. The non-technical client can update text strings and switch images safely without any risk of breaking layouts.
* **Repeating Content (Products):** Managed via rigid, structured fields (`name`, `price`, `description`, `image`), providing an ideal framework for the client's AI copywriting tools to drop content directly into specified boxes.

---

## 🚀 5. Migration & Launch Plan
* **Parallel Development:** Build the new site completely on a Vercel preview branch while keeping the legacy WordPress site live at the main domain.
* **Manual Content Lift:** Download assets from the WordPress Media Library and manually populate the clean Turso/Payload production database.
* **SEO Protection:** Document existing WordPress URL paths and map them to the new clean structure using permanent `301 redirects` inside `next.config.js`.
* **Domain Switchover:** Point domain DNS records to Vercel, generate free SSL certificates, and immediately submit the new `sitemap.xml` to **Google Search Console** to force a swift re-crawl.

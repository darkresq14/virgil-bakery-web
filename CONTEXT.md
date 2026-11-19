# Domain Glossary

## Core Concepts

### Order (Comandă)
A customer's request for bakery products, submitted via the site checkout: the cart POSTs the Order to the site (database save + Google Sheets sync) and redirects to the `/multumim` thank-you page. Each order has a delivery method, a delivery date, line items, and customer contact info. WhatsApp is not part of the ordering flow; historical orders may still carry a stored WhatsApp message from the old dual-track flow.

### Delivery Method (Metodă de livrare)
How the order reaches the customer. Determined by the Delivery Zone:

- **Personal Delivery (Livrare personală)** — Free. Delivered by the baker in person on Tuesdays and Fridays, between 08:00–16:00. The only method offered inside the Delivery Zone (Sibiu, Șura Mare, Șura Mică, Cisnădie, Cisnădioara, Șelimbăr).
- **GLS Point Delivery (Livrare la punct GLS)** — 25 lei flat. Outside the zone only. Customer picks a parcel locker or ParcelShop on the official GLS map widget; the chosen point is the shipping destination. Package dispatched the day before the delivery date.
- **GLS Home Delivery (Livrare GLS acasă)** — Outside the zone only. Tiered by total item quantity: 1–2 → 26 lei, 3 → 30, 4–5 → 39, 6–10 → 53. Above 10 items, home delivery is unavailable (locker still is).

All delivery methods share the same delivery dates (Tuesdays and Fridays) and the same cutoff schedule.

### Delivery Date (Dată de livrare)
The date the customer receives their order. Always a Tuesday or Friday. Cutoff for ordering:
- Tuesday delivery → order by Sunday 17:00 (Romania time)
- Friday delivery → order by Wednesday 17:00 (Romania time)

### Delivery Zone (Zonă de livrare)
The geographic area eligible for free personal delivery. Defined as Judet=Sibiu AND Localitate ∈ {Sibiu, Șura Mare, Șura Mică, Cisnădie, Cisnădioara, Șelimbăr}. Orders outside this zone must choose a GLS delivery method (point or home).

### Subtotal
Sum of all product line items (quantity × price). Does not include transport.

### Shipping Cost (Cost transport)
0 lei for personal delivery. 25 lei flat for GLS Point Delivery. Tiered by total item quantity for GLS Home Delivery (see Delivery Method). Stored separately from subtotal.

### Total (Grand Total)
Subtotal + Shipping Cost. The amount the customer pays.

## Bakery Availability

### Availability Day (Zi de disponibilitate)
The weekday(s) a product can be delivered on: both delivery days (default), Tuesday only, or Friday only. Set per product in the admin ("Zile disponibilitate"). Distinct from Delivery Date, which is the concrete date chosen at checkout. Drives delivery-date filtering at checkout (a Friday-only product rules out Tuesday delivery), add-to-cart hints, product badges, and server-side order validation. Days excluded by the cart's availability intersection render in the delivery-date dropdown grayed out with an "— indisponibil" suffix (distinct from "— listă închisă", the ordering-cutoff label, and "— concediu", the holiday label; holiday takes precedence). Mixed carts containing both Tuesday-only and Friday-only products cannot be checked out. Replaces the old free-text `availabilityText` field, which was display-only and never enforced.

### One-off Availability (Disponibilitate o singură dată)
A product orderable exclusively for ONE concrete delivery date (e.g. "Friday, October 31"), for special breads baked a single time. Set per product in the admin ("Disponibil o singură dată", Tuesdays or Fridays only, never inside a holiday period — the admin rejects the combination at save time, since the date could never be delivered). Has the highest priority: while set, it overrides both Availability Day and the "Disponibil" checkbox — the emergency brake for a sold-out one-off product is clearing the date. Effective availability is computed at runtime, never stored: the purchase window opens at the previous cycle's cutoff — Wednesday 17:00, nine days before a Friday — which is normally the moment the date first becomes selectable in the delivery-date picker (a holiday that pushes the picker forward can surface the date earlier; the product still stays unavailable until the window opens) and closes at the date's own cutoff (17:00, two days before). Outside the window the product renders as a normal unavailable product. While purchaseable, it is pinned to the top of the product list and the homepage featured grid, and badged with the exact date ("Doar vineri, 31 octombrie"). At checkout, a cart containing a one-off product offers only that date (other dates grayed out "— indisponibil"); carts mixing two different one-off dates cannot be checked out. The server-side order validation rejects delivery dates that don't match the product's date or orders placed outside the window.

### Holiday Period (Perioadă de concediu)
A date range during which the bakery is closed — no baking, no deliveries. Defined by a start date and end date (both inclusive). At most one holiday period is active at any time. Any delivery date that falls within the holiday range is shown as disabled ("— concediu") in the delivery date dropdown, identical in treatment to "lista închisă" dates. Visitors can still browse all pages and products, add items to cart, and place orders for the first available delivery date after the holiday.

### Holiday Notice (Notificare concediu)
The two-part UI that communicates the holiday to visitors. Activates based on a **delivery-date trigger**: the moment the first holiday-overlapping delivery date enters the delivery date dropdown (i.e., after the cutoff of the previous delivery round). This is earlier than the holiday start date — it begins when customers would first see a disrupted delivery schedule.
- **Holiday Banner** — a persistent, minimal top bar visible on every page while the holiday notice is active. Hardcoded layout. Automatically displays the last available delivery date before the holiday and the first after. Not dismissible.
- **Holiday Modal** — a richer, warmer popup shown on the first page load of each session (gated via sessionStorage). CMS-editable: heading, image, and body message (all optional with warm defaults). Dismissed once per session.

### Holiday Settings (Configurare concediu)
A tab in the SiteConfig global with the following fields:
- **Data început** (required date) — holiday start date, inclusive.
- **Data sfârșit** (required date) — holiday end date, inclusive.
- **Titlu modal** (optional text) — modal heading. Defaults to a generic warm heading if empty.
- **Imagine modal** (optional upload) — modal image. Falls back to a default if empty.
- **Mesaj modal** (optional text) — modal body text. Falls back to a default warm message if empty.

No toggle — the holiday is active purely based on dates. Auto-clears when today passes the end date.

## Customer Types

### First-Time Buyer (Prima comandă)
A customer with no cached checkout profile. Provides: name, phone, and structured address (judet, localitate, strada+număr, optional detalii). The system auto-detects the delivery zone from judet+localitate: inside → personal delivery, outside → choice of GLS point or GLS home delivery.

### Cached Checkout Profile (Profil salvat)
What replaced the old "Am mai comandat" mini-flow: the full checkout form (name, phone, address, delivery choice including a chosen GLS point) is cached in localStorage after an order and prefilled on the next visit. Everything stays editable; there is no separate reduced flow. A cached GLS point is shown for review but is validated server-side at order submit against GLS's public delivery-point feed (fail-open) — the customer must re-pick if it no longer exists. Phone remains the customer identity used to match the client in the ops workbook.

## Address Model

### Structured Address
Consists of:
- **Judet** (required) — one of 42 Romanian counties. Selected from a dropdown.
- **Localitate** (required) — depends on the chosen judet. Autocomplete from a static dataset of all Romanian localities.
- **Strada + Număr** (required) — combined text field.
- **Detalii suplimentare** (optional) — bloc, scară, apartament, interfon, etc.

### Personal Delivery Localities
Sibiu, Șura Mare, Șura Mică, Cisnădie, Cisnădioara, Șelimbăr — the six localities in Judet Sibiu where personal (free) delivery is available.

## Order States

| Status | Meaning |
|---|---|
| Nou | New order, not yet reviewed |
| Confirmat | Baker has confirmed the order |
| Livrat | Order has been delivered |
| Anulat | Order has been cancelled |

## Compliance

### Cookie Consent (Consimțământ Cookie)
Binary opt-in for analytics cookies (Google Analytics 4). The user sees a floating banner on first visit and can Accept or Reject. Choice is stored in a strictly-necessary cookie (`virgil_cookie_consent`) for 6 months. A footer link allows changing the choice at any time. GA4 is gated via Google Consent Mode v2 — defaults to denied, updates to granted only on explicit Accept. Vercel Analytics and Speed Insights are server-side and cookieless — no consent required.

### Privacy Policy (Politica de Confidențialitate)
CMS-managed page at `/politica-de-confidentialitate`. Covers personal data handling (orders), cookie usage (GA4), and GDPR rights. Linked from the cookie consent banner and the footer.

## Channels

### WhatsApp
A questions & announcements channel only — never an ordering channel. Customers order exclusively through the site cart. WhatsApp surfaces as: the floating button, the footer link, the header CTA ("Întrebări? Scrie-ne"), the homepage teaser card, and the group section on the "Cum Comanzi" page. The announcement group is used for new-product and last-minute leftovers posts.

### Thank-You Page (Pagină Mulțumire)
The `/multumim` page customers land on after a successful order submit. Title and message come from two optional SiteConfig fields (General tab); empty values fall back to warm default copy that confirms the order was registered without promising how the baker confirms it. Noindex and excluded from the sitemap.

# ADR 0007: GLS delivery model and the checkout wire contract

## Status

Accepted

## Context

The bakery switched couriers from Cargus to GLS (#47). The old model had exactly two delivery methods (personal / flat-25 courier), a reduced "Am mai comandat" checkout flow for returning customers (phone + courier checkbox, no address), and a wire contract to the baker's Apps Script that sent `metoda: 'personala' | 'cargus'`. GLS introduces two distinct courier destinations (parcel locker/ParcelShop vs home address), quantity-tiered home pricing, and an official map widget for point selection — the two-method model and the boolean courier flag cannot express any of this.

## Decision

**Zone-driven three-method model.** The delivery zone (Judet Sibiu + 6 localities) decides what the checkout offers: inside → personal delivery only; outside → a radio choice between *GLS Point Delivery* (flat 25 lei, destination = a locker/ParcelShop picked on the official GLS DPM widget) and *GLS Home Delivery* (tiered by total item quantity: 26/30/39/53 lei for 1-2/3/4-5/6-10 items; above 10, home is unavailable and only point delivery is offered).

**One form, cached profile.** The "Prima comandă / Am mai comandat" mini-flow is removed. Everyone gets the same form; after a successful order the full profile (name, phone, address, delivery choice, chosen GLS point) is cached in localStorage and prefilled on the next visit. A cached GLS point is revalidated against GLS's public delivery-point feed before reuse. Phone remains the customer identity for the ops workbook.

**Wire contract: clean break.** The site sends `metoda: 'personala' | 'gls-punct' | 'gls-acasa'` plus `punctGoldId`, `punctMatchcode`, `punctNume`, `punctAdresa`, `punctTip` for point orders (the goldId/matchcode pair maps directly to MyGLS PSD parameters for label generation). The `'cargus'` value is not emulated or migrated — the baker adapts his script to the new contract at the switchover date. Historical orders re-pushed by an admin re-save still send their stored `'cargus'` value (legacy passthrough).

**No feature flag.** The Cargus → GLS text swap ships with the code; the merge date *is* the switchover date, coordinated through #57.

## Considered alternatives

- **Feature flag / provider constant for the Cargus→GLS swap.** Rejected — the work lives unmerged on a branch until the baker's go-date; holding the merge is a simpler gate than shipping a flag that exists to be flipped once and deleted.
- **Keep `metoda: 'cargus'` wire value for compatibility.** Rejected — the baker is rewriting his intake for GLS anyway; keeping a value named after the retired courier in a contract meant to express GLS destinations would be permanent confusion.
- **Separate UI options for locker vs ParcelShop.** Rejected — identical price and identical UX (same widget, same wire fields); the point `tip` travels in the contract, so the baker can diverge prices later without a site change.
- **Admin-managed (SiteConfig) pricing.** Rejected — six numbers that change rarely; hardcoded in one module (`detectDeliveryMethod.ts`) until the baker confirms exact prices (#57), revisited if he starts tuning them often.
- **Server-side caching of the GLS point feed.** Deferred — the feed is fetched once per checkout-with-cached-point for revalidation, fail-open; if GLS's map host becomes a availability problem, cache `ro.json` server-side per its 15-minute `max-age`.

## Consequences

- Merging the branch is a breaking change for the baker's Apps Script — #57 (field contract + confirmations + go-date) must be resolved with him first.
- Home-delivery tier prices are the baker's indicative values until he confirms; they live in exactly one module.
- The `curier` delivery-method option stays in the Orders schema (and `DeliveryMethodCell`) so historical orders keep rendering.

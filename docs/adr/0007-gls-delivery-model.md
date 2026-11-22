# ADR 0007: GLS delivery model and the checkout wire contract

## Status

Accepted

## Context

The bakery switched couriers from Cargus to GLS (#47). The old model had exactly two delivery methods (personal / flat-25 courier), a reduced "Am mai comandat" checkout flow for returning customers (phone + courier checkbox, no address), and a wire contract to the baker's Apps Script that sent `metoda: 'personala' | 'cargus'`. GLS introduces two distinct courier destinations (parcel locker/ParcelShop vs home address), tiered home pricing, and an official map widget for point selection — the two-method model and the boolean courier flag cannot express any of this.

## Decision

**Zone-driven three-method model.** The delivery zone (Judet Sibiu + 6 localities) decides what the checkout offers: inside → personal delivery only; outside → a radio choice between *GLS Point Delivery* (flat 25 lei, destination = a locker/ParcelShop picked on the official GLS DPM widget) and *GLS Home Delivery* (tiered by the cart's total shipping weight, tier bounds inclusive: ≤2 kg → 26 lei, ≤5 kg → 33 lei, ≤10 kg → 43 lei; above 10 kg, home is unavailable and only point delivery is offered).

**Quantity tiers → weight tiers.** Home pricing started quantity-based (26/30/39/53 lei for 1-2/3/4-5/6-10 items), marked indicative pending the baker's confirmation. He confirmed weight-based tiers instead (comms, 2026-11-21): parcel weight tracks GLS's real cost, item count did not — two 800g breads and two 200g biscotti packs priced identically despite a 4× difference in real parcel weight. Each product carries a shipping weight in whole grams (*Greutate de livrare*, GLOSSARY.md); the tiers price the cart's weight sum (unit weight × quantity).

**One form, cached profile.** The "Prima comandă / Am mai comandat" mini-flow is removed. Everyone gets the same form; after a successful order the full profile (name, phone, address, delivery choice, chosen GLS point) is cached in localStorage and prefilled on the next visit. A cached GLS point is revalidated server-side against GLS's public delivery-point feed when the order is submitted (fail-open). Phone remains the customer identity for the ops workbook.

**Wire contract: clean break.** The site sends `metoda: 'personala' | 'gls-punct' | 'gls-acasa'` plus `punctGoldId`, `punctMatchcode`, `punctNume`, `punctAdresa`, `punctTip` for point orders (the goldId/matchcode pair maps directly to MyGLS PSD parameters for label generation). The `'cargus'` value is not emulated or migrated — the baker adapts his script to the new contract at the switchover date. Historical orders re-pushed by an admin re-save still send their stored `'cargus'` value (legacy passthrough).

**No feature flag.** The Cargus → GLS text swap ships with the code; the merge date *is* the switchover date, coordinated through #57.

## Considered alternatives

- **Feature flag / provider constant for the Cargus→GLS swap.** Rejected — the work lives unmerged on a branch until the baker's go-date; holding the merge is a simpler gate than shipping a flag that exists to be flipped once and deleted.
- **Keep `metoda: 'cargus'` wire value for compatibility.** Rejected — the baker is rewriting his intake for GLS anyway; keeping a value named after the retired courier in a contract meant to express GLS destinations would be permanent confusion.
- **Separate UI options for locker vs ParcelShop.** Rejected — identical price and identical UX (same widget, same wire fields); the point `tip` travels in the contract, so the baker can diverge prices later without a site change.
- **Admin-managed (SiteConfig) pricing.** Rejected — a few numbers that change rarely; hardcoded in one module (`glsDelivery.ts`), revisited if he starts tuning them often.
- **Server-side caching of the GLS point feed.** Originally shipped client-side (each out-of-zone checkout downloaded the 1.5 MB `ro.json` to validate a cached point, fail-open). Moved server-side: the Orders `beforeChange` hook checks the point against the feed, fetched at most once per 15-minute window per server instance and shared by all orders (still fail-open) — customers download nothing, and the check no longer races a fast submit.

## Consequences

- Merging the branch is a breaking change for the baker's Apps Script — #57 (field contract + confirmations + go-date) must be resolved with him first.
- Home-delivery tier prices are baker-confirmed (comms, 2026-11-21); they live in exactly one module.
- The anonymous checkout POST never trusts client pricing: subtotal/shipping/total are recomputed in an Orders `beforeChange` hook from Products prices + shipping
weights + zone + method (admin manual orders keep their entered values).
- The `curier` delivery-method option stays in the Orders schema (and `DeliveryMethodCell`) so historical orders keep rendering.

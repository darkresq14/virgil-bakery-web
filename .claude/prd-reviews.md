## Problem Statement

As the one-person bakery (Pâine cu Maia by Virgil), the product pages currently trigger two warnings in Google's Rich Results Test: **"Missing field 'review'"** and **"Missing field 'aggregateRating'"** on the `Product` structured data. These are the only two remaining rich-result warnings after the Bakery/PostalAddress fixes. They cannot be cleared by simply adding fields — Google's structured-data policy forbids self-serving or fabricated ratings, and doing so risks a manual penalty that strips *all* rich results. The bakery therefore needs a **genuine product-review system**: real ratings from real customers, aggregated honestly, and surfaced both in structured data and visibly on the page.

The bakery's ordering channel is WhatsApp-based with no customer accounts or login, which makes "who is allowed to review, and how do we prove they actually bought the product?" the central design question.

## Solution

Introduce a real review system tied to products: a new **Reviews** collection stores per-product star ratings (1–5) plus written text from customers. The product structured-data utility is extended to emit `review[]` and `aggregateRating` computed from published reviews — only when at least one exists. Reviews are also rendered visibly on the product page (Google requires the markup to mirror page content). To stay legitimate, the system never fabricates ratings, computes `aggregateRating` as the true average of stored ratings, and keeps reviews on **Products only** (never on the Bakery/LocalBusiness schema, which would be a self-serving-review violation).

The exact mechanism for collecting and verifying reviews (invite-after-delivery vs. baker-curated) is the primary open decision pending refinement — see *Implementation Decisions*.

## User Stories

1. As the baker, I want to collect genuine product reviews from customers who received their order, so that I can show trustworthy ratings in Google search results.
2. As the baker, I want each review tied to a specific product, so that ratings reflect that product rather than the bakery in general.
3. As the baker, I want a 1–5 star rating on every review, so that an overall average can be computed honestly.
4. As the baker, I want to moderate reviews before they appear publicly, so that I can filter spam or inappropriate content.
5. As the baker, I want to mark a review as coming from a verified purchase, so that Google and customers know it is genuine.
6. As the baker, I want to invite a delivered-order customer to leave a review (mechanism TBD), so that reviews come from real buyers rather than random visitors.
7. As the baker, I want to read, publish, unpublish, and delete reviews from the admin panel, so that I stay in control of what is shown.
8. As the baker, I want the average rating and review count to update automatically as reviews are published, so that I never compute them by hand.
9. As the baker, I want reviews to appear only on product pages, so that I comply with Google's rule against business-level self-serving reviews.
10. As a customer who just received an order, I want to easily leave a rating and comment for the products I bought, so that I can share my experience.
11. As a customer leaving a review, I want to rate each product separately, so that my rating reflects the specific product.
12. As a customer, I want my name shown alongside my review, so that it feels personal.
13. As a customer, I want the review form to be quick and mobile-friendly, so that I can complete it from WhatsApp on my phone.
14. As a customer, I want confirmation that my review was received, so that I trust it was submitted.
15. As a visitor, I want to see a product's average star rating and total review count, so that I can judge its quality at a glance.
16. As a visitor, I want to read individual written reviews on the product page, so that I can decide whether to order.
17. As a visitor, I want to see which reviews come from verified purchases, so that I can trust the ratings.
18. As a visitor, I want reviews presented in Romanian (with language handling), so that they are useful to me.
19. As the site owner, I want the Product structured data to include `review` and `aggregateRating`, so that the two Rich Results Test warnings are resolved.
20. As the site owner, I want `aggregateRating` to be the true average of stored ratings, so that it complies with Google's policy against fabricated ratings.
21. As the site owner, I want the review markup to mirror the reviews visible on the page, so that it complies Google's content-mirroring requirement.
22. As the site owner, I want to avoid placing reviews/ratings on the Bakery (LocalBusiness) schema, so that I do not trigger a self-serving-review penalty.
23. As a developer, I want the rating-aggregation logic to be a pure function, so that it is easy to test and reason about.
24. As a developer, I want review-token signing/verification isolated and framework-free, so that it is testable and reusable.
25. As a developer, I want the product schema utility to emit reviews/ratings only when published reviews exist, so that review-less products stay clean.

## Implementation Decisions

> **Refinement gate (blocking `ready-for-agent`):** two decisions are intentionally left open and must be settled before implementation begins — (a) the **collection & verification mechanism**, and (b) **test scope**. Everything below marked *Locked* is decided; items marked *Open* are the refinement surface.

### Locked decisions

**New `Reviews` collection (not extending Testimonials).** Reviews are a distinct concept from the existing curated Testimonials: they carry a rating, a product relationship, an optional order link, and verification state, with different create-access semantics. Keeping them separate avoids mixing curated general praise with verified product ratings. Testimonials is left untouched.

Reviews fields:
- `product` — relationship to `products` (required).
- `order` — relationship to `orders` (optional; present when the review originates from a verified purchase).
- `author` — text, the reviewer's display name (required).
- `rating` — number 1–5 (required, validated).
- `content` — textarea, the written review body (required; maps to `reviewBody`).
- `language` — select (ro/en/de), reusing the Testimonials pattern (optional, defaults to `ro`).
- `verifiedPurchase` — checkbox (default false; true only when produced by the verified-purchase flow).
- `published` — checkbox (moderation gate).
- standard timestamps.

Access:
- `read` — public for published reviews only (so aggregation and the page show only moderated content).
- `create` — depends on the mechanism (Open): either a token-validated server route, or `authenticated` (baker-curated), or both.
- `update` / `delete` — `authenticated` (baker moderates).

**`aggregateRating` is computed, never hand-entered.** A pure utility takes the list of published reviews for a product and returns a schema.org `AggregateRating` (with `ratingValue` as the true average rounded to one decimal, `reviewCount`, `bestRating: 5`, `worstRating: 1`), or `null` when there are no published reviews. This is the single source of truth for the displayed and the marked-up average, guaranteeing they match.

**`reviewToSchema` mapping.** A pure utility maps a stored review to a schema.org `Review` (`author` → `Person`, `reviewRating` → `Rating` with `ratingValue`/`bestRating`/`worstRating`, `datePublished`, `reviewBody`).

**Product schema extension.** The existing product schema utility gains optional `review[]` and `aggregateRating`, sourced from the product's published reviews. Both are emitted only when at least one published review exists (story 25). The brand, offers, return-policy, and shipping-details behaviour is unchanged.

**Reviews are visible on the product page.** Google requires structured data to reflect page content, so the product page renders a rating summary (average + count) and the list of published reviews. The markup and the visible UI read from the same published-reviews source.

**No reviews or ratings on the Bakery (LocalBusiness) schema.** This is a hard compliance rule: ratings stay on `Product` only (story 22). The Bakery schema work done separately must not gain `aggregateRating`/`review`.

### Open decisions (pending refinement)

**Collection & verification mechanism — the core fork.** Three candidates, to be decided:

- **A. Verified-purchase invites (recommended for legitimacy).** When an order moves to `livrat`, the baker sends the customer a signed review link (via WhatsApp) whose token binds to that order and its products. The customer lands on a review page scoped to exactly those products and submits a rating + text per product. Stored with `verifiedPurchase: true` and the order link. Pure-token sign/verify utilities (below) back this. Largest scope; most Google-safe; auto-scoped to real buyers.
- **B. Baker-curated (lighter MVP).** The baker transcribes real feedback received (WhatsApp/verbal) into reviews, linked to products with a rating; `aggregateRating` is computed from these. Honest if the feedback is genuine, much smaller scope, but admin-entered reviews receive more Google scrutiny and carry no "verified" signal. Could serve as a stepping stone toward A.
- **C. Public unverified form.** Anyone may submit. Least legitimate and Google-risky; **not recommended** and likely out of scope.

Choosing A also implies: token sign/verify utilities, an invite trigger/UX after `livrat`, a public submission route + mobile form, and a dedup rule (one review per order+product).

**Token utilities (only needed under mechanism A).** `signReviewToken(payload, secret)` and `verifyReviewToken(token, secret)`, where payload is `{ orderId, productIds[], exp }`, using HMAC. Framework-free and the dedup/verification primitive for the submission route.

**Submission route + form (only under mechanism A).** A public Next route verifies the token, asserts the product is in the order, rejects duplicates, validates the 1–5 rating, and creates the `Reviews` document (optionally held for moderation depending on the chosen `published` default).

**Moderation & `published` default.** Whether verified reviews auto-publish or require a baker look first. Affects trust vs. baker workload.

**Minimum count for `aggregateRating`.** Emit at ≥1 published review (Google's minimum), or set a small threshold before showing an average to avoid a single-review skew. To be decided.

**Invite trigger UX (only under mechanism A).** How the baker fires the invite after `livrat` — an admin action, an auto-generated WhatsApp link, etc.

### Data flow

```
Order (status: livrat) ──[mechanism A]──► signed token (orderId, productIds)
                                                  │
Customer ──► review form (token-scoped) ──► submission route ──► Reviews (verifiedPurchase)
                                                                        │
                                  published reviews ◄──────────────────┘
                                        │
              ┌─────────────────────────┴──────────────────────────┐
              ▼                                                    ▼
   computeAggregateRating + reviewToSchema               Product page reviews UI
              │                                                    │
              ▼                                                    ▼
        productSchema (review[] + aggregateRating) ◄──── same published source ────┘
```

Under mechanism B the left branch is replaced by the baker creating `Reviews` directly in the admin panel; the right side (aggregation + schema + UI) is identical.

## Testing Decisions

### What makes a good test
Tests verify external behaviour (inputs and outputs), not implementation details. Pure utilities are exercised with known inputs and asserted on returned values; schema utilities are asserted on the emitted shape; API guards are exercised through the Payload/Next API surface. (Final test scope is itself an open refinement item.)

### Candidate test targets (pending refinement selection)
- **`computeAggregateRating`** — averaging, rounding to one decimal, `reviewCount`, and returning `null` when there are no published reviews. Prior art: `schema.unit.spec.ts`, `deliveryZone.unit.spec.ts`.
- **`reviewToSchema`** — correct schema.org `Review` shape with author, rating, date, and body.
- **Product schema review output** — extends the existing product-schema tests: emits `review[]` + `aggregateRating` only when published reviews exist, and omits them otherwise. Prior art: `schema.unit.spec.ts`.
- **Token sign/verify** (mechanism A only) — signs a valid token, rejects tampered and expired tokens, and scopes correctly to the order's products.
- **Submission API guard** (mechanism A only) — accepts a valid token, rejects invalid/expired tokens and duplicates, and validates the rating range. Prior art: `api.int.spec.ts`.

## Out of Scope

- **Fabricated or self-serving ratings.** No hardcoded, estimated, or invented `aggregateRating` or `review` values. This is the entire reason the PRD exists.
- **Reviews/ratings on the Bakery (LocalBusiness) schema.** Explicitly excluded to comply with Google's self-serving-review policy.
- **Removing or migrating Testimonials.** The existing curated Testimonials collection stays as-is; reviews live in the new collection.
- **Customer accounts / login.** The bakery remains WhatsApp-based and accountless. Verification (if chosen) is token-based, not identity-based.
- **Review-author email collection or marketing.** No newsletter, accounts, or outreach built on review data.
- **Business (owner) replies to reviews.** A separate concern; not part of clearing the rich-result warnings.
- **Multilingual review translation.** Language is stored and surfaced as-is; no auto-translation.

## Further Notes

- **Google policy is the governing constraint.** Reviews must be genuine customer opinions; `aggregateRating` must be the honest aggregate; markup must mirror visible page content; reviews must not be attached to the organization/business. Any chosen mechanism must satisfy these. [Google review snippet guidelines](https://developers.google.com/search/docs/appearance/structured-data/review-snippet) are the reference.
- **The collection mechanism is the single biggest decision.** Mechanism A (verified-purchase invites) is the most legitimate and future-proof but the largest scope; mechanism B (baker-curated) is a credible smaller MVP. This should be settled in refinement before flipping the issue to `ready-for-agent`.
- **Domain glossary.** `CONTEXT.md` should gain Review-related concepts (Review, Rating, Verified Purchase, Aggregate Rating) once the mechanism is chosen and vocabulary stabilises — mirroring how the Holiday Mode PRD extended the glossary.
- **This issue is labelled `needs-triage` (not `ready-for-agent`)** because the verification mechanism and test scope are explicitly pending refinement; an agent cannot resolve that product/policy fork.

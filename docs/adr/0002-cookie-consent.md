# ADR 0002: Custom cookie consent banner with Google Consent Mode v2

## Status

Proposed

## Context

The site uses Google Analytics 4 for traffic analytics. As a Romanian (EU) website, GDPR and the ePrivacy Directive require that non-essential cookies (analytics) only be set after the user gives informed, prior, opt-in consent. Currently, GA4 loads unconditionally on every page — no consent mechanism exists.

Options considered:
1. **Third-party CMP** (Cookiebot, Usercentrics, etc.) — full-featured consent management platform with audit logs, auto-updating legal language, and multi-category support. Monthly cost, heavy external script.
2. **Custom banner with Consent Mode v2** — lightweight, zero-cost, tailored to the site's single analytics tracker. Full design control but no server-side consent audit log.

## Decision

Build a custom cookie consent banner with Google Consent Mode v2 integration.

## Consequences

### Positive
- **Zero additional cost** — no monthly CMP subscription.
- **Lightweight** — ~5KB of custom code vs 100KB+ external CMP script. No extra DNS lookups or third-party domains.
- **Full design control** — banner matches the bakery's design system (Tailwind tokens, Playfair Display, warm tones).
- **Consent Mode v2 compliant** — GA4 loads in denied mode by default, switches to granted only on explicit user action. Cookieless pings before consent maintain GA data modeling.
- **Simple logic** — binary Accept/Reject for a single non-essential tracker. No multi-category complexity.

### Negative
- **No server-side consent audit log** — consent preference stored client-side only. A CMP would provide timestamped proof of consent for regulatory audits. Acceptable risk for a small Romanian bakery — enforcement focus is on systemic violators.
- **Manual maintenance** — if more trackers are added later (marketing pixels, ad retargeting), the banner needs manual updates to support additional cookie categories.
- **Legal text is DIY** — the cookie section in the privacy policy is self-drafted, not lawyer-reviewed.

### Risks
- **Scope creep** — if the site adds Google Ads, Meta Pixel, or other trackers, the binary Accept/Reject may need to become granular. At that point, re-evaluate whether a CMP is warranted.
- **Consent Mode race conditions** — mitigated by placing the consent default script in `<head>` (before GA loads in `<body>`). The order is deterministic, not async.

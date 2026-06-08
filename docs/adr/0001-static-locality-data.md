# ADR 0001: Static Romanian locality dataset instead of geocoding API

## Status

Accepted

## Context

The checkout page needs structured address input (Judet → Localitate) to auto-detect whether an order qualifies for free personal delivery (Sibiu area) or requires courier delivery (+25 lei). This requires a locality lookup that depends on the selected judet.

Options considered:
1. **Nominatim (OpenStreetMap API)** — free geocoding/search API. Provides localities and streets on demand.
2. **Static JSON dataset** — bundle all Romanian localities (~12,000 entries) per judet as a static file.

## Decision

Use a static JSON dataset bundled with the application. No external API calls during checkout.

## Consequences

### Positive
- **Zero external dependency at checkout** — the flow works even if Nominatim is down or rate-limited.
- **Instant response** — no network latency for locality lookup.
- **Simple implementation** — standard HTML datalist or combobox over a static array.
- **Accurate zone detection** — the 5 personal delivery localities are guaranteed to be in the dataset.

### Negative
- **Data staleness** — if a new locality appears in Romania, the dataset needs manual updating. In practice, Romanian administrative divisions change very rarely.
- **Bundle size** — ~200KB gzipped for all localities. Acceptable for a single-page load.
- **No street-level autocomplete** — streets remain a free-text field. Acceptable because street data in OSM for smaller Romanian towns is often incomplete anyway.

### Risks
- Dataset maintenance: needs a clear source and update process documented in the code.

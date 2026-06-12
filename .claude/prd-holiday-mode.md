## Problem Statement

As a one-person bakery (Pâine cu Maia by Virgil), when the baker goes on holiday, there is currently no way to inform website visitors that orders cannot be fulfilled during that period. Customers may place orders for delivery dates when the bakery is closed, leading to unfulfilled orders and a poor customer experience.

## Solution

Add a Holiday Mode to the website that communicates upcoming and active holidays to visitors through a persistent informational banner and a warm modal popup, while keeping the full website (products, pages) accessible. Orders can still be placed for delivery dates after the holiday ends, but delivery dates falling within the holiday period are clearly marked as unavailable in the delivery date dropdown. A server-side guard also prevents orders with holiday delivery dates from being submitted.

## User Stories

1. As the baker, I want to configure a holiday period (start date and end date) in the admin panel, so that the website automatically communicates my absence to customers.
2. As the baker, I want to set a custom heading for the holiday modal, so that the tone matches how I want to communicate with my customers.
3. As the baker, I want to upload an image for the holiday modal, so that the notice feels warm and personal rather than generic.
4. As the baker, I want to set a custom body message for the holiday modal, so that I can include specific information about my return or special instructions.
5. As the baker, I want the holiday to activate automatically based on the dates I set, so that I don't have to remember to flip a toggle before leaving.
6. As the baker, I want the holiday mode to deactivate automatically after the end date passes, so that the website returns to normal without any manual action when I return.
7. As a visitor, I want to see a banner at the top of every page when a holiday is approaching or active, so that I'm immediately aware of the bakery's availability.
8. As a visitor, I want the banner to show the last available delivery date before the holiday and the first available delivery date after, so that I know exactly when I can receive my order.
9. As a visitor, I want to see a warm modal popup on my first visit during the holiday notice period, so that I clearly understand the bakery's situation without being alarmed.
10. As a visitor, I want the modal to only appear once per browsing session, so that it doesn't interrupt my browsing on subsequent page views.
11. As a visitor, I want to dismiss the modal and continue browsing, so that I can explore the website normally.
12. As a visitor, I want to browse all products and pages during the holiday, so that I can see what the bakery offers even while it's closed.
13. As a visitor, I want to add products to my cart during the holiday, so that I can prepare an order for when the bakery reopens.
14. As a visitor, I want to see delivery dates that fall within the holiday marked as "concediu" in the delivery date dropdown, so that I understand which dates are unavailable.
15. As a visitor, I want to select a delivery date after the holiday ends and place a normal order, so that I can plan ahead for my first delivery after the baker returns.
16. As a visitor, I want the delivery date dropdown to always show at least 2 selectable dates, so that I have a choice of when to receive my order.
17. As a visitor, I want an additional holiday information message on the cart page, so that the holiday context is clear even if I dismissed the modal.
18. As the baker, I want the website to reject orders with delivery dates during the holiday at the API level, so that even if someone bypasses the frontend, no holiday-date orders are saved.

## Implementation Decisions

### Module 1: Holiday Date Logic (`holidayDates` utility)

A new pure utility module with no framework or CMS dependencies. Encapsulates all logic for determining whether the holiday notice should be active and computing the key dates for display.

**Interface:**
- Input: holiday start date, holiday end date, reference date (defaults to "now" in Romania timezone)
- Output: `{ isNoticeActive: boolean, lastDeliveryBefore: Date | null, firstDeliveryAfter: Date | null }`
- The notice is active when the first holiday-overlapping delivery date has entered the delivery date window (i.e., after the cutoff of the previous delivery round before the holiday start). This means the banner appears before the holiday actually starts — specifically from the moment a customer would first see a disrupted delivery schedule.
- `lastDeliveryBefore` is the last Tuesday or Friday delivery date before the holiday start that is still selectable (not past cutoff).
- `firstDeliveryAfter` is the first Tuesday or Friday delivery date on or after the day after the holiday end.

### Module 2: SiteConfig Holiday Tab (Payload config change)

Add a new "Concediu" tab to the existing `SiteConfig` global config. Fields:
- `holidayStartDate` — required date field (day-only picker)
- `holidayEndDate` — required date field (day-only picker)
- `holidayModalTitle` — optional text field, warm default heading if empty
- `holidayModalImage` — optional upload field (relation to `media`), default fallback if empty
- `holidayModalMessage` — optional text field, warm default message if empty

All holiday fields live in a single tab so the baker can configure the entire holiday in one place. No toggle — the holiday is active purely based on dates. The existing `revalidateSiteConfig` hook handles cache invalidation.

### Module 3: Enhanced Delivery Dates (`deliveryDates` utility enhancement)

Extend the existing `getDeliveryDates()` function to accept optional holiday dates. The `DeliveryDateOption` interface gains an `isHoliday` boolean flag.

- When holiday dates are provided, any delivery date falling within `[holidayStartDate, holidayEndDate]` is marked `isSelectable: false, isHoliday: true`.
- The cart page dropdown renders holiday dates with "— concediu" suffix, identical in treatment to "— lista închisă" dates.
- The function still guarantees at least 2 selectable dates in the result set. If holiday dates consume the normal selectable window, the function extends forward to find the next available delivery dates after the holiday.
- The existing no-holiday call pattern (no arguments) continues to work identically, maintaining backward compatibility.

### Module 4: Holiday Banner (React component)

A server-rendered component rendered in the root layout, above the header. Takes `lastDeliveryBefore` and `firstDeliveryAfter` dates as props. Displays a minimal, persistent top bar with the two key dates. Hardcoded layout — no CMS-editable content. Not dismissible. Only rendered when the holiday notice is active.

### Module 5: Holiday Modal (React component)

A client component gated by `sessionStorage`. On first page load of a session where the holiday notice is active, renders a centered modal with:
- CMS-editable heading (from SiteConfig, with warm default)
- CMS-editable image (from SiteConfig, with default fallback)
- CMS-editable body message (from SiteConfig, with warm default)
- Date range display
- "Am înțeles" dismiss button
- On dismiss, sets a sessionStorage flag. Does not reappear until the next session.

### Module 6: Order Holiday Guard (Payload `beforeChange` hook)

A `beforeChange` hook added to the `Orders` collection. Before an order is created or updated:
1. Fetches the SiteConfig global.
2. If holiday dates are set, checks whether the order's `deliveryDate` falls within `[holidayStartDate, holidayEndDate]`.
3. If it does, throws a validation error preventing the order from being saved.
4. This runs server-side regardless of frontend behavior, catching any direct API calls.

### Module 7: Layout Integration

The root layout (`layout.tsx`) already fetches `siteConfig` and `homepage` globals. It will:
1. Also read the holiday fields from the `siteConfig` data.
2. Call the `holidayDates` utility to determine if the notice is active and compute the key dates.
3. Conditionally render the Holiday Banner above the header.
4. Pass holiday data (modal content + dates) to a client-side wrapper that conditionally renders the Holiday Modal.
5. The cart page client component will receive holiday data and pass it to the enhanced `getDeliveryDates()`, displaying an additional holiday info message on the cart page.

### Data flow

```
SiteConfig (CMS) → holiday dates + modal content
  ├── holidayDates utility → isNoticeActive, lastDeliveryBefore, firstDeliveryAfter
  │     ├── Banner (server component, rendered in layout)
  │     └── Modal trigger (passed to client, gated by sessionStorage)
  ├── deliveryDates utility → dropdown options with isHoliday flag
  │     └── Cart page delivery date dropdown
  └── Orders beforeChange hook → server-side guard
```

## Testing Decisions

### What makes a good test
Tests should verify external behavior (inputs and outputs), not implementation details. Pure utility functions are tested by calling them with known inputs and asserting on the returned values. React components are tested by rendering them and asserting on what appears in the DOM. Hooks are tested by exercising them through the Payload API surface.

### Test targets

**Module 1: `holidayDates` utility (unit tests)**
- Notice is inactive when no holiday dates are set.
- Notice is inactive when today is well before the holiday (no delivery dates overlap yet).
- Notice activates the moment the first holiday-overlapping delivery date enters the dropdown window.
- Correctly computes `lastDeliveryBefore` as the last selectable delivery date before the holiday.
- Correctly computes `firstDeliveryAfter` as the first delivery date on or after the day after the holiday end.
- Notice deactivates when today passes the holiday end date.
- Edge case: holiday starts on a Tuesday or Friday (delivery day itself is blocked).
- Edge case: holiday is very short (1-2 days, may not overlap with any delivery date — notice may not activate).

Prior art: `tests/unit/deliveryZone.unit.spec.ts` — similar pure utility test pattern.

**Module 3: Enhanced `deliveryDates` utility (unit tests)**
- Without holiday dates, behaves identically to the current function (backward compatibility).
- Delivery dates within the holiday range are marked `isHoliday: true, isSelectable: false`.
- Delivery dates outside the holiday range are unaffected.
- When holiday dates consume selectable dates, the function extends forward to guarantee 2 selectable dates.
- Cutoff logic ("lista închisă") still works correctly alongside holiday marking.
- A date can be both past cutoff AND within the holiday — it should show as "concediu" (holiday takes visual precedence).

Prior art: `tests/unit/deliveryZone.unit.spec.ts`, `tests/unit/detectDeliveryMethod.unit.spec.ts`.

**Module 6: Order Holiday Guard (integration test)**
- Order with a delivery date within the holiday period is rejected with a validation error.
- Order with a delivery date outside the holiday period is accepted normally.
- Order is accepted when no holiday dates are configured in SiteConfig.

Prior art: `tests/int/api.int.spec.ts` — existing integration test for the API layer.

## Out of Scope

- **Multiple concurrent holiday periods** — the system supports one active holiday at a time. Pre-configuring a future holiday while a current one is active is not supported.
- **Scheduled/auto-activating holidays** — the baker sets dates and the system activates based on the delivery-date trigger. No manual toggle needed, but no cron-based activation either.
- **WhatsApp auto-reply** — the floating WhatsApp button remains unchanged. Any "away message" is outside the website's scope.
- **Product page "Adaugă în coș" button changes** — no visual or functional changes to the add-to-cart button during the holiday.
- **Email/notification to existing customers** — no proactive notification system.
- **Holiday-specific SEO or meta tag changes** — no impact on search engine indexing.

## Further Notes

- The domain glossary (`CONTEXT.md`) has been updated with the new concepts: Holiday Period, Holiday Notice (Banner + Modal), and Holiday Settings.
- The holiday notice trigger is delivery-date-driven, not calendar-driven. This means the banner and modal start appearing before the holiday actually begins — specifically when the first affected delivery date enters the customer-visible dropdown window. This gives customers fair warning that their usual delivery schedule is disrupted.
- The modal uses `sessionStorage` (not `localStorage`) so it reappears in each new browser session, ensuring returning visitors are reminded.
- All CMS fields for the modal (heading, image, message) are optional with warm defaults, so the baker can set up a holiday with just the two required dates and get a reasonable experience.

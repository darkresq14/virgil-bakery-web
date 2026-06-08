# Domain Glossary

## Core Concepts

### Order (Comandă)
A customer's request for bakery products, submitted via WhatsApp. Each order has a delivery method, a delivery date, line items, and customer contact info.

### Delivery Method (Metodă de livrare)
How the order reaches the customer. Exactly one of:

- **Personal Delivery (Livrare personală)** — Free. Delivered by the baker in person on Tuesdays and Fridays, between 08:00–16:00. Available only in: Sibiu, Șura Mare, Șura Mică, Cisnădie, Cisnădioara.
- **Courier Delivery (Livrare prin curier)** — 25 lei flat fee. Shipped via Cargus nationwide. Package dispatched the day before the delivery date.

Both methods share the same delivery dates (Tuesdays and Fridays) and the same cutoff schedule.

### Delivery Date (Dată de livrare)
The date the customer receives their order. Always a Tuesday or Friday. Cutoff for ordering:
- Tuesday delivery → order by Sunday 17:00 (Romania time)
- Friday delivery → order by Wednesday 17:00 (Romania time)

### Delivery Zone (Zonă de livrare)
The geographic area eligible for free personal delivery. Defined as Judet=Sibiu AND Localitate ∈ {Sibiu, Șura Mare, Șura Mică, Cisnădie, Cisnădioara}. Orders outside this zone incur a 25 lei courier fee.

### Subtotal
Sum of all product line items (quantity × price). Does not include transport.

### Shipping Cost (Cost transport)
0 lei for personal delivery. 25 lei flat for courier delivery (up to 10 products per package). Stored separately from subtotal.

### Total (Grand Total)
Subtotal + Shipping Cost. The amount the customer pays.

## Customer Types

### First-Time Buyer (Prima comandă)
A customer who has not ordered before. Must provide: name, phone, and structured address (judet, localitate, strada+număr, optional detalii). The system auto-detects the delivery zone from judet+localitate and applies the courier fee if outside the personal delivery zone.

### Returning Customer (Am mai comandat)
A customer who has ordered before, identified by a localStorage flag. Only provides: delivery date, and optionally checks "Am nevoie de livrare prin curier (+25 lei)." No address or contact fields — the baker already has this info from previous orders.

## Address Model

### Structured Address
Consists of:
- **Judet** (required) — one of 42 Romanian counties. Selected from a dropdown.
- **Localitate** (required) — depends on the chosen judet. Autocomplete from a static dataset of all Romanian localities.
- **Strada + Număr** (required) — combined text field.
- **Detalii suplimentare** (optional) — bloc, scară, apartament, interfon, etc.

### Personal Delivery Localities
Sibiu, Șura Mare, Șura Mică, Cisnădie, Cisnădioara — the five localities in Judet Sibiu where personal (free) delivery is available.

## Order States

| Status | Meaning |
|---|---|
| Nou | New order, not yet reviewed |
| Confirmat | Baker has confirmed the order |
| Livrat | Order has been delivered |
| Anulat | Order has been cancelled |

## Channels

### WhatsApp
The primary ordering channel. The cart page generates a pre-formatted WhatsApp message with all order details and opens it in the customer's WhatsApp app. The order is also saved to the database, but WhatsApp is the communication backbone.

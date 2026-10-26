# Delivery APIs for LUKU (Kenya + global)

Reference for cheap delivery/shipping APIs that work in Kenya and ideally globally. Use in the orders/shipping flow after payment.

## Options

| Provider | Best for | Kenya | Global | Pricing / notes |
|----------|----------|--------|--------|------------------|
| **Terminal Africa (T-Ship)** | Kenya + Africa first | Yes – 20+ local/international partners, KES support | Africa-focused | Single API for addresses, carriers, parcels, rates, shipments. Get quotes in KES. Docs: https://docs.terminal.africa/tship |
| **Ufanisi Courier** | Kenya-only | Yes – local courier, shipment registration + tracking | No | API for registering shipments and tracking. Contact: https://ufanisicourier.co.ke |
| **Easyship** | Global + Kenya | Yes – dedicated Kenya guide, multiple couriers to/from Kenya | Yes – 220+ countries, 550+ couriers | Volume discounts, up to ~91% off rates; free tier to start. Strong for international into/out of Kenya. |
| **Shippo** | Global | Limited Kenya-specific docs; DHL/FedEx/UPS international | Yes – 85+ carriers | Discounts on carrier rates; better for US/Europe-centric flows. |
| **Tracktry** | Tracking only | Yes – Kenya Post + 410+ carriers | Yes | REST API + webhooks for tracking only (no rate/label). Use alongside a shipping API for labels. |

## Recommendation

- **Primary (Kenya + Africa):** **Terminal Africa T-Ship** – one API, KES, multiple carriers. Add **Easyship** if you need strong international rates (e.g. shipping from outside Africa into Kenya).
- **Tracking:** **Tracktry** or **Track123** for multi-carrier tracking and webhooks once you have a tracking number.
- **Kenya-only, low cost:** **Ufanisi** if you only need a single local courier and minimal integration.

## Implementation (orders flow)

1. After payment: call chosen API for rates/quotes (origin = seller address, destination = buyer shipping address).
2. Store selected rate and carrier on the order (or in a `shipments` table).
3. After handover to courier: store tracking number; optionally sync status via tracking API webhooks for "shipped" / "delivered" updates.

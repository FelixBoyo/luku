# Unified marketplace epic

**Program:** Phase 3 — Phases 1–2 of [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md)  
**Owner (platform):** John  
**Supersedes:** "listings not in catalog" and "peer checkout out of scope" in member specs 02 and 04.

---

## Goal

One discoverable, purchasable feed for **catalog products** and **peer listings**. Peer resale is the primary product feature — not a side flow.

---

## Current vs target

| | Today | Target |
|---|--------|--------|
| Discovery | `products` only on Home/Discover | `products` + **Active** `listings` |
| Seller on card | Placeholder in `productAdapter.ts` | Live profile or business account |
| Checkout | `products` + `create_order_with_stock_check` | Same flow extended for `listing_id` |
| Sold state | Manual toggle on listing | Auto **sold** on successful payment (Phase 2) |

---

## MarketplaceItem DTO (stub — MP-01)

Platform lead defines in `packages/contracts/` before Phase 1 coding:

```ts
// Target shape (illustrative — finalize in ADR)
type MarketplaceItemSource = 'catalog' | 'peer_listing';

interface MarketplaceItem {
  id: string;                    // product id OR listing id
  source: MarketplaceItemSource;
  title: string;
  price: number;
  currency: string;
  imageUrl: string;
  seller: {
    id: string;
    displayName: string;
    avatarUrl?: string;
    type: 'business' | 'peer';
  };
  // catalog-only
  productId?: string;
  businessId?: string;
  // peer-only
  listingId?: string;
  wardrobeItemId?: string;
  condition?: string;
  status?: 'active' | 'paused' | 'sold';
}
```

**API:** `GET /v1/api/marketplace` or extend products with `?include=listings` — John locks in [`CONTRACT_MATRIX.md`](../api/CONTRACT_MATRIX.md).

**RPC:** `search_marketplace_paginated` — unions `products` (active, in stock) with `listings` (status = active), paginated, filterable.

---

## Phase gates

| Phase | Entry | Exit |
|-------|-------|------|
| **1 — Discovery** | Phase 0 on `zeus` | Active peer listings visible on Home/Discover/search; pagination |
| **2 — Checkout** | Phase 1 live | Cart accepts listing lines; payment completes; listing → sold; seller notified |

---

## Task IDs

| ID | Owner | Task | Phase |
|----|-------|------|-------|
| MP-01 | John (platform) | `MarketplaceItem` DTO + ADR | 1 |
| MP-02 | John (platform) | `search_marketplace_paginated` RPC + BFF route | 1 |
| MP-03 | Brian | Home + Discover consume unified feed | 1 |
| MP-04 | Brian | Search/filters on unified feed | 1 |
| MP-05 | John (M1) | Real seller display on cards | 1 |
| MP-06 | Felix | Active/sold/paused lifecycle affects feed visibility | 1 |
| MP-10 | Shannon | Cart line type for peer listing | 2 |
| MP-11 | Shannon | Checkout + payment for listing orders; seller notify v1 | 2 |
| MP-12 | Felix | Auto sold on payment; wardrobe hide rules | 2 |
| MP-13 | Brian | Product/listing detail — single Add to cart | 2 |
| MP-14 | John (platform) | Order schema / RPC for mixed cart | 2 |
| MP-15 | John (M1) | Inbox thread from purchase (optional v1) | 2 |

---

## Out of scope (this epic)

- Business admin portal (seeds only)
- Escrow / buyer confirms receipt (Phase 3 — BL-02)
- Recommendation scoring (Phase 5 — BL-01)
- Multi-photo galleries (BL-03)

---

## Regression — do not break

- Catalog checkout for seed business products
- M3 sell flow (quick-list, pause, edit, manual sold until Phase 2 ships)
- Wishlist on catalog products (extend, don't replace, in Phase 1)

---

## Sign-off

| Gate | Date | Signed by |
|------|------|-----------|
| MP-01 ADR approved | | John |
| Phase 1 feed QA | | John |
| Phase 2 peer checkout QA | | John |

# Member 2 (Brian) — Catalog & discovery

**Owner:** Brian  
**Depends on:** Platform gate + M1 Bearer tokens

> **Phase 1+:** Unified marketplace — see [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md). Below is Phase 2 spec + Phase 0 remediation.

## Phase 0 — your status (Brian)

**Wait for team go**, then branch `fix/m2-catalog-qa` from `zeus`.  
**Live dashboard:** [`PHASE0_STATUS.md`](./PHASE0_STATUS.md)

| ID | Status | What to do |
|----|--------|------------|
| M2-01 | Partial | Persist OK; display fails smoke — see M2-03 |
| M2-04 | Done | Toast on add to cart — QA only |
| M2-05 | **Pending — start here** | Dedupe ProductDetail Similar items keys |
| M2-03 | Partial | Hydrate wishlist name/price/image |
| M2-07 | Pending | Remove Buy Now on `ProductDetailScreen.tsx` |
| M2-02 | Pending | Discover pagination |

**Do next (Brian):**

1. `git checkout zeus && git pull` after team go.
2. **M2-05** — fix duplicate key on ProductDetail similar items.
3. **M2-03** — wishlist rows show real product data (not "Loading…").
4. **M2-07** — single Add to Cart button on product detail.
5. Run [`02_member_catalog_checklist.md`](../qa/02_member_catalog_checklist.md).

**Do not touch:** Cart, wardrobe/listings, inbox, payments.

---

## Original spec (reference)

## Dev environment

- Seed: `npm run db:seed`
- Login: `dev+buyer@luku.app` / `LukuDev2026!`
- API: `npm run dev:api`
- Mobile: `EXPO_PUBLIC_USE_MOCK_DATA=false`, `EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3001`

## Tables in scope (`mobile-v1`)

- `products`
- `wishlist`

## Tables indirect (FK / joins only — no seller portal UI)

- `business_accounts` — catalog products reference `business_id`
- `products_with_ratings` (view) — used by `search_products_paginated`

## Do not use

- `listings` — peer resale is **M3**, not catalog
- `trips`, `mood_boards*`, `promotions`, `product_tags`, `product_views`

## Commerce model

**Business marketplace catalog** — `products` sold by `business_accounts`. This is **not** the peer `listings` table (M3 Sell flow).

## Goal

All product discovery surfaces use Express products + wishlist APIs with `EXPO_PUBLIC_USE_MOCK_DATA=false`.

## Mock data policy

When your BFF ships, replace `createEmptyWishlistRepository` (and ensure `createApiProductsRepository` is wired) in `repositories/index.ts` only. Do **not** import `data/mock/` in screens — use `types/domain` and repositories. See [`../../apps/mobile/docs/MOCK_DATA_POLICY.md`](../../apps/mobile/docs/MOCK_DATA_POLICY.md).

## Where to put code

| Layer | Path |
|-------|------|
| DTOs | `packages/contracts/src/products.ts` |
| Routes | `backend/router/v1/products.ts`, `wishlist.ts` |
| Services | `backend/services/productsService.ts`, `wishlistService.ts` |
| Mobile adapters | `apps/mobile/src/lib/productAdapter.ts` |
| Mobile repos | `productsRepository`, `wishlistRepository` → `createApi*` |
| Screens | Home, Discover, ProductDetail, Trending, Wishlist, BrandDetail, StyleDetail |

## Reference implementation (platform gate)

- [`createApiProductsRepository`](../../apps/mobile/src/repositories/productsRepository.ts)
- [`bffProducts.ts`](../../apps/mobile/src/api/bffProducts.ts)
- `GET /v1/api/products` — live with seeded catalog

## API endpoints

Contract matrix: products + wishlist (M2).

## Tasks

- [ ] Extend products route: filters, pagination via `search_products_paginated` (RPC parse fixed in platform gate)
- [ ] Wishlist CRUD routes (`wishlist` table)
- [ ] `createApiWishlistRepository`
- [ ] Wire Discover infinite scroll to paginated API
- [ ] Bookmark sync across Discover, Home, Me, WishlistScreen
- [ ] Remove any remaining direct `supabase.from('products')` in mobile

## Acceptance

- [ ] Discover loads live products with filters
- [ ] Wishlist toggle persists server-side
- [ ] ProductDetail loads by id from API
- [ ] `lint:check` passes

## Out of scope

Cart, orders, wardrobe, listings, AI

## Post-merge QA

After merging M2 onto `zeus`, use [`../qa/02_member_catalog_checklist.md`](../qa/02_member_catalog_checklist.md) for integration checks and sign-off.

**Remediation tasks:** [`../qa/ZEUS_REMEDIATION.md`](../qa/ZEUS_REMEDIATION.md) § M2

# Schema map (mobile v1)

**Live state:** Introspection `2026-06-11` — [`live-snapshot.json`](./live-snapshot.json). Migrations `003`–`008` applied; seed via `npm run db:seed`.

**Full table tags:** [`TABLE_SCOPE.md`](./TABLE_SCOPE.md)

## Mobile v1 map

| Table / RPC | Scope | Domain | Repository | Member | Migration |
|-------------|-------|--------|------------|--------|-----------|
| `auth.users` | shared-infra | Auth | AuthContext | M1 | Supabase built-in |
| `profiles` | mobile-v1 | Profile | profileRepository | M1 | 003 |
| `user_follows` / `user_blocks` | mobile-v1 | Social | connectionsRepository | M1 | 003 |
| `products` | mobile-v1 | Catalog | productsRepository | M2 | 001 |
| `business_accounts` | mobile-v1-indirect | Catalog | — | M2/M4 | 001 (FK only) |
| `products_with_ratings` | mobile-v1-indirect | Catalog | — | M2 | 001 view |
| `search_products_paginated` | shared-infra | Catalog | productsRepository | M2 | 006 |
| `wishlist` | mobile-v1 | Wishlist | wishlistRepository | M2 | 001 + 006 |
| `wardrobe_items` | mobile-v1 | Wardrobe | wardrobeRepository | M3 | 004 |
| `wardrobe_wear_log` | mobile-v1 | Wardrobe | wardrobeRepository | M3 | 004 |
| `outfits` / `outfit_pieces` | mobile-v1 | Outfits | outfitsRepository | M3 | 004 |
| `listings` | mobile-v1 | Sell | listingsRepository | M3 | 005 |
| `cart_items` | mobile-v1 | Cart | AppStateContext | M4 | 006 |
| `orders` | mobile-v1 | Orders | — | M4 | 001 |
| `create_order_with_stock_check` | shared-infra | Orders | — | M4 | 006 |
| `inbox_threads` / `inbox_messages` | mobile-v1 | Inbox | inboxRepository | M4 | 007 |
| `inbox_thread_reads` | mobile-v1 | Inbox | inboxRepository | M4 | 007 |
| `wardrobe-images` bucket | shared-infra | Uploads | uploads route | M3 | 008 |

## Not in mobile v1 (see TABLE_SCOPE)

Web-legacy tables (`trips`, `mood_boards*`, `clothing_items`, `albums`, KYC, etc.) remain on dev DB but are **out of scope** for Phase 2 member specs.

Legacy SQL reference: `database/legacy/`.

Web slice cross-reference: `apps/web-legacy/store/slices/` → scope column in [`LEGACY_REFERENCE_GUIDE.md`](../team/LEGACY_REFERENCE_GUIDE.md).

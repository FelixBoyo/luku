# Table scope (Phase 2 mobile)

**Purpose:** Tag every public table on dev Supabase so members know what to build against vs ignore.

**Source:** [`live-snapshot.json`](./live-snapshot.json) (2026-06-11). Re-run `npm run db:introspect` after schema changes.

## Scope definitions

| Scope | Members |
|-------|---------|
| `mobile-v1` | Implement Express routes + mobile repos |
| `mobile-v1-indirect` | FK/joins only — **no CRUD UI or member routes** |
| `web-legacy` | Archived web app only — **do not query from mobile Phase 2** |
| `mobile-phase-2b` | Coming Soon screens — defer |
| `shared-infra` | Auth, RPCs, views, buckets — platform/BFF |

## Commerce models (do not conflate)

| Model | Tables | Member | Mobile surfaces |
|-------|--------|--------|-----------------|
| Business marketplace | `products` ← `business_accounts` | M2, M4 | Discover, Product Detail, Cart, Orders |
| Peer resale | `listings` ← `wardrobe_items` | M3 | Sell, Me listings, Listing Detail |

`business_accounts` has **no seller portal UI** in Phase 2; it exists because catalog `products` and `orders` reference it.

---

## Full inventory

| Table / object | Scope | Member | Notes |
|----------------|-------|--------|-------|
| `profiles` | mobile-v1 | M1 | Extended in 003 |
| `user_follows` | mobile-v1 | M1 | |
| `user_blocks` | mobile-v1 | M1 | |
| `user_preferences` | mobile-phase-2b | — | Onboarding local for v1 |
| `user_profile_images` | web-legacy | — | Virtual try-on web |
| `products` | mobile-v1 | M2 | Business catalog |
| `wishlist` | mobile-v1 | M2 | |
| `product_reviews` | mobile-v1-indirect | M2 | Via views / detail later |
| `product_tags` | web-legacy | — | |
| `product_views` | web-legacy | — | Analytics |
| `promotions` | web-legacy | — | |
| `business_accounts` | mobile-v1-indirect | M2/M4 | FK on products/orders |
| `business_kyc` | web-legacy | — | Seller portal |
| `seller_kyc` | web-legacy | — | |
| `orders` | mobile-v1 | M4 | |
| `returns` | web-legacy | — | |
| `cart_items` | mobile-v1 | M4 | |
| `wardrobe_items` | mobile-v1 | M3 | Mobile canonical wardrobe |
| `wardrobe_wear_log` | mobile-v1 | M3 | |
| `outfits` | mobile-v1 | M3 | Extended in 004 |
| `outfit_pieces` | mobile-v1 | M3 | Mobile outfit join |
| `listings` | mobile-v1 | M3 | Peer sell — not `products` |
| `inbox_threads` | mobile-v1 | M4 | |
| `inbox_messages` | mobile-v1 | M4 | |
| `inbox_thread_reads` | mobile-v1 | M4 | Unread badges |
| `clothing_items` | web-legacy | — | Use `wardrobe_items` |
| `outfit_items` | web-legacy | — | Use `outfit_pieces` |
| `albums` | web-legacy | — | |
| `album_outfits` | web-legacy | — | |
| `trips` | web-legacy | — | Trip planner web |
| `mood_boards` | mobile-phase-2b | — | |
| `mood_board_pins` | mobile-phase-2b | — | |
| `mood_board_collaborators` | mobile-phase-2b | — | |
| `mood_board_share_links` | mobile-phase-2b | — | |
| `mood_board_ai_insights` | mobile-phase-2b | — | |
| `style_playground_sessions` | web-legacy | — | |
| `style_customizations` | web-legacy | — | |
| `style_queries` | web-legacy | — | |
| `mannequin_settings` | web-legacy | — | Virtual try-on |
| `classified_pins` (view) | mobile-phase-2b | — | Mood boards |
| `products_with_ratings` (view) | mobile-v1-indirect | M2 | `search_products_paginated` |
| `products_with_tags` (view) | web-legacy | — | |
| `auth.users` | shared-infra | M1 | Via Supabase Auth / BFF |
| `search_products_paginated` | shared-infra | M2 | RPC |
| `create_order_with_stock_check` | shared-infra | M4 | RPC |
| `product-images` bucket | shared-infra | M2 | Catalog images |
| `wardrobe-images` bucket | shared-infra | M3 | Uploads |
| `user-profile-images` bucket | web-legacy | — | |
| `style-playground-images` bucket | web-legacy | — | |
| `business-assets` bucket | web-legacy | — | |
| `mood-board-images` bucket | mobile-phase-2b | — | |

---

## Member quick reference

| Member | `mobile-v1` tables |
|--------|-------------------|
| M1 | `profiles`, `user_follows`, `user_blocks` |
| M2 | `products`, `wishlist` |
| M3 | `wardrobe_items`, `wardrobe_wear_log`, `outfits`, `outfit_pieces`, `listings` |
| M4 | `cart_items`, `orders`, `inbox_threads`, `inbox_messages`, `inbox_thread_reads` |

**Rule:** If scope is `web-legacy` or `mobile-phase-2b`, do not add routes or `supabase.from()` calls for that table in Phase 2.

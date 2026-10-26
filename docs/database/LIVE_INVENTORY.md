# Live Supabase inventory

**Purpose:** Snapshot of what exists on the **dev** Supabase project today. Use this to diff against [`database/legacy/`](../../database/legacy/), [`SCHEMA.md`](./SCHEMA.md), and planned migrations `003`–`008`.

**How to refresh**

1. Set `SUPABASE_DB_URL` in root `.env.local` (Postgres connection string from Supabase Dashboard).
2. Run `npm run db:introspect` from repo root.
3. Read `docs/database/exports/<date>/summary.md` and [`live-snapshot.json`](./live-snapshot.json).
4. Full per-section JSON is in `docs/database/exports/` (gitignored).
5. Update **Gap analysis** below and [`SCHEMA.md`](./SCHEMA.md) when migrations land.

| Field | Value |
|-------|-------|
| Captured on | 2026-06-11 |
| Project ref | szubfkpamgpicteuybiw |
| Captured by | `npm run db:introspect` |
| Migrations applied | 000 partial; 001/002 legacy via web; **003–008 applied** |

---

## Summary (2026-06-11)

| Area | Live count |
|------|------------|
| Public tables | 39 |
| Public views | 3 (`classified_pins`, `products_with_ratings`, `products_with_tags`) |
| RPCs | 13 (includes platform gate RPCs) |
| Storage buckets | 7 (includes `wardrobe-images`) |
| Active products | 9 (after `npm run db:seed`) |

---

## Gap analysis

Compared live dev ↔ repo migrations (after applying `003`–`008` on 2026-06-11).

| Item | In live DB? | In `database/legacy/`? | Migration | Action |
|------|-------------|------------------------|-----------|--------|
| `products` | yes | `ecommerce_schema.sql` | 001 | OK |
| `orders` | yes | `ecommerce_schema.sql` | 001 | OK |
| `wishlist` | yes | `ecommerce_schema.sql` | 001 | OK |
| `profiles` | yes (extended) | `supabaseClient.ts` comment | 003 | OK |
| `user_follows` / `user_blocks` | yes | — | 003 | OK |
| `clothing_items` | yes | web legacy | — | OK |
| `outfits` / `outfit_pieces` | yes | web legacy | 004 | OK |
| `wardrobe_items` | yes | — | 004 | OK |
| `wardrobe_wear_log` | yes | — | 004 | OK |
| `listings` | yes | — | 005 | OK |
| `cart_items` | yes | — | 006 | OK |
| `inbox_threads` / `inbox_messages` | yes | — | 007 | OK |
| `search_products_paginated` | yes | `backend_optimizations.sql` | 006 | OK |
| `create_order_with_stock_check` | yes | `backend_optimizations.sql` | 006 | OK |
| `product-images` bucket | yes | web comments | — | OK |
| `business-assets` bucket | yes | web comments | — | OK |
| `user-profile-images` bucket | yes | web comments | — | OK |
| `style-playground-images` bucket | yes | web comments | — | OK |
| `wardrobe-images` bucket | yes | — | 008 | OK |

**Drift notes:** Live dev has web-era tables (`mood_boards`, `trips`, `style_playground_sessions`, etc.) not in mobile v1. See [`TABLE_SCOPE.md`](./TABLE_SCOPE.md) for per-table tags. Mobile migrations are additive and do not drop legacy objects.

---

## Health checks

- [x] `search_products_paginated` exists
- [x] `create_order_with_stock_check` exists
- [x] `active_products` count > 0 (9 after seed)

---

## Next steps (platform lead)

1. ~~Apply `database/migrations/003` … `008`~~ done via `npm run db:migrate`
2. ~~Re-run `npm run db:introspect`~~ done
3. ~~Run seed~~ done via `npm run db:seed`
4. Sign off [`docs/team/00_PLATFORM_GATE.md`](../team/00_PLATFORM_GATE.md)
5. Distribute member specs `01`–`04`

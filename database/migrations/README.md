# Database migrations

Ordered SQL migrations for LUKU Supabase (PostgreSQL).

## Apply order

| # | File | Source | Mobile v1 |
|---|------|--------|-----------|
| 000 | `000_extensions.sql` | new | required |
| 001 | `001_ecommerce_core.sql` | `legacy/ecommerce_schema.sql` | required |
| 002 | `002_backend_rpcs.sql` | `legacy/backend_optimizations.sql` | required |
| 003 | `003_profiles_connections.sql` | Profile columns + follows/blocks | Member 1 |
| 004 | `004_wardrobe_outfits.sql` | `wardrobe_items`, wear log, outfit extensions | Member 3 |
| 005 | `005_listings.sql` | Peer listings (Sell flow) | Member 3 |
| 006 | `006_cart_wishlist.sql` | `cart_items` + RPCs from 002 if missing | Member 2/4 |
| 007 | `007_inbox_notifications.sql` | `inbox_threads`, `inbox_messages` | Member 4 |
| 007 | `007_update_search_rpc.sql` | Marketplace search RPC update. **Duplicate number** — apply after `007_inbox_notifications.sql` | Platform |
| 008 | `008_storage_policies.sql` | `wardrobe-images` bucket + policies | Member 3 |
| 009 | `009_handle_new_user.sql` | Harden signup profile trigger | Member 1 |
| 010 | `010_search_rpc_catalog_fields.sql` | Marketplace search RPC catalog fields | Platform |
| 011 | `011_backfill_handles.sql` | Backfill `profiles.handle` | Platform |
| 012 | `012_escrow_orders.sql` | Escrow statuses, `payments`, webhook dedupe, peer orders (C-CORE-1) | Platform |
| 013 | `013_notifications.sql` | `notifications` + order-status webhook trigger (Brian C-NOTIF-1) | Brian |
| 014 | `014_push_tokens.sql` | Expo `push_tokens` (Brian C-NOTIF-2) | Brian |
| 015 | `015_seller_payout_details.sql` | Seller Paystack transfer recipient (Felix C-CORE-4/5). **Not yet applied** — Felix to apply; `seller_id` is an `auth.users` id, resolved from an order via `resolveSellerUserId` | Platform |
| 016 | `016_ensure_payment_record.sql` | Checkout payment upsert (`SECURITY DEFINER`). Apply with `node scripts/apply-migrations.mjs 16 16` | Platform |

## Claim your number before you write the file

`013` and `014` were claimed on `zeus` while a `013_seller_payout_details.sql`
was being written in parallel elsewhere. The payout migration was renumbered to
`015` after the fact, which is cheap now and expensive once a migration has run
against shared dev.

**Add your row to this table on `zeus` first, then write the file.** A conflict
in this README is a five-second fix; two files claiming `016` discovered during
a deploy is not.

`007` is already duplicated — `007_inbox_notifications.sql` and
`007_update_search_rpc.sql` both exist. Apply them in that order. It has not
caused a problem yet, but it is why this rule exists rather than being assumed.

## How to apply

1. Introspect live dev DB first — [`docs/database/introspection.sql`](../../docs/database/introspection.sql) → [`docs/database/LIVE_INVENTORY.md`](../../docs/database/LIVE_INVENTORY.md).
2. Open Supabase SQL Editor (dev project).
3. Run migrations in numeric order.
4. Run `npm run db:seed` after 001–008.
5. Verify with queries in [`docs/database/MIGRATION_RUNBOOK.md`](../../docs/database/MIGRATION_RUNBOOK.md).

## Legacy files

Original flat SQL files live in [`../legacy/`](../legacy/). Migrations 001–002 are copies/splits of those files. Do not edit legacy files for new work — add a new numbered migration.

## Ownership

**Platform lead only** may add migrations 003+. Members reference tables in specs; they do not alter schema without review.

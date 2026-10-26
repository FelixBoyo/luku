# Database migration runbook

**Owner:** Platform lead only.

## Prerequisites

- Supabase dev project
- SQL Editor access

## Before you migrate (recommended)

1. Run [`introspection.sql`](./introspection.sql) in SQL Editor on the **current** dev project.
2. Record results in [`LIVE_INVENTORY.md`](./LIVE_INVENTORY.md) (gap analysis vs `database/legacy/`).
3. Only then apply migrations below — avoids applying SQL blindly when live DB already has partial schema.

Or from repo root (uses `SUPABASE_DB_URL` in `.env.local`):

```bash
npm run db:migrate        # default: 003–008
npm run db:migrate 3 8    # explicit range
npm run db:introspect     # verify after migrate
```

To dump full DDL locally (optional):

```bash
npx supabase db dump --db-url "$SUPABASE_DB_URL" -f schema.sql
```

Use the database connection string from Supabase → Project Settings → Database (not the anon key).

## Apply steps

1. Run `database/migrations/000_extensions.sql`
2. Paste and run full `database/legacy/ecommerce_schema.sql` (migration 001)
3. Paste and run full `database/legacy/backend_optimizations.sql` (migration 002)
4. Run migrations `003_profiles_connections.sql` … `008_storage_policies.sql` (in order)
5. Run `npm run db:seed` (or `database/seeds/dev_seed.sql` after auth users exist)

## Verify RPCs

```sql
SELECT routine_name
FROM information_schema.routines
WHERE routine_schema = 'public'
  AND routine_name IN (
    'search_products_paginated',
    'create_order_with_stock_check'
  );
```

## Verify products

```sql
SELECT count(*) FROM public.products WHERE is_active = true;
```

## Server env after migrate

Copy [`.env.example`](../../.env.example) → `.env.local`:

```bash
SUPABASE_URL=https://<project>.supabase.co
SUPABASE_SERVICE_ROLE_KEY=<required for BFF auth + products>
SUPABASE_ANON_KEY=<anon>
ALLOWED_ORIGINS=exp://localhost:8081,http://localhost:8081
```

Expo on device: add your LAN origin to `ALLOWED_ORIGINS`.

## Rollback

Supabase does not auto-rollback. Keep migration files additive; use new migration to drop/alter.

## Member rule

Members **do not** add migrations without platform lead review. Request schema changes in PR to `docs/database/SCHEMA.md` first.

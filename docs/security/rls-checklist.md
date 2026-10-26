# Supabase RLS Checklist

This checklist enumerates Supabase resources referenced in code and the expected access policy baseline.

## How to use this checklist

- Confirm `alter table ... enable row level security` is set for each table.
- Confirm explicit policies exist for `select`, `insert`, `update`, and `delete` as required.
- Confirm no policy grants wider access than product requirements.
- Document exceptions and rationale.

## Verification Query Pack (run in Supabase SQL Editor)

```sql
-- Table RLS and policy inventory
select
  n.nspname as schema_name,
  c.relname as table_name,
  c.relrowsecurity as rls_enabled
from pg_class c
join pg_namespace n on n.oid = c.relnamespace
where n.nspname = 'public'
  and c.relkind in ('r', 'v')
order by c.relname;

select
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public'
order by tablename, policyname;
```

## Tables and Views Referenced in Code

| Resource | Kind | Expected access policy baseline | Actual policy (audit run) | Status |
| --- | --- | --- | --- | --- |
| `albums` | table | Owner-only CRUD: `auth.uid() = user_id` | Pending policy export | Pending |
| `album_outfits` | table | Only rows linked to albums owned by `auth.uid()` | Pending policy export | Pending |
| `analytics/events` -> `events` | table | Insert by authenticated users/service role only; read restricted to owner/admin analytics scope | Pending policy export | Pending |
| `business_accounts` | table | Owner can CRUD own record; public read only for explicitly public storefront fields | Pending policy export | Pending |
| `business_kyc` | table | Owner-only read/write plus tightly scoped admin/compliance read | Pending policy export | Pending |
| `clothing_items` | table | Owner-only CRUD | Policy sample exists in `services/supabaseClient.ts` comments | Needs verification |
| `mannequin_settings` | table | Owner-only CRUD | Pending policy export | Pending |
| `orders` | table | Buyer can read own orders; seller can read orders for own products/business; updates tightly scoped by role/state | Pending policy export | Pending |
| `outfits` | table | Owner-only CRUD | Policy sample exists in `services/supabaseClient.ts` comments | Needs verification |
| `outfit_items` | table | Access only through outfits owned by `auth.uid()` | Policy sample exists in `services/supabaseClient.ts` comments | Needs verification |
| `product_reviews` | table | Public read optional; write/update/delete only by reviewer user, with order ownership checks if required | Pending policy export | Pending |
| `product_tags` | table | Read policy based on product visibility; write policy restricted to seller/admin workflows | Pending policy export | Pending |
| `product_views` | table | Insert allowed for authenticated users (or anon with abuse controls), read limited to analytics role/owner | Pending policy export | Pending |
| `products` | table | Public read for active listings as needed; write/delete restricted to owning seller/admin | Pending policy export | Pending |
| `products_with_ratings` | view | View should only expose rows user is allowed to read from underlying `products`/ratings tables | Pending policy export | Pending |
| `profiles` | table | User owns row for write; read limited to approved public profile fields | Policy sample exists in `services/supabaseClient.ts` comments | Needs verification |
| `promotions` | table | Seller/admin scoped CRUD only | Pending policy export | Pending |
| `returns` | table | Buyer and relevant seller access only; status updates role-constrained | Pending policy export | Pending |
| `seller_kyc` | table | Owner-only read/write + tightly scoped admin/compliance access | Pending policy export | Pending |
| `style_customizations` | table | Owner-only CRUD | Pending policy export | Pending |
| `style_playground_sessions` | table | Owner-only CRUD | Pending policy export | Pending |
| `style_queries` | table | Owner-only CRUD | Pending policy export | Pending |
| `trips` | table | Owner-only CRUD | Policy sample exists in `services/supabaseClient.ts` comments | Needs verification |
| `user_profile_images` | table | Owner-only CRUD | Pending policy export | Pending |
| `wishlist` | table | Owner-only CRUD | Pending policy export | Pending |

## Storage Buckets Referenced in Code (Object Policies)

Storage uses bucket/object policies rather than table RLS. Verify equivalent owner scoping:

| Bucket | Expected object policy baseline | Actual object policy (audit run) | Status |
| --- | --- | --- | --- |
| `business-assets` | Upload/write only for authenticated owner prefix; read only for intended audience (public assets only if explicitly required) | Pending storage policy export | Pending |
| `product-images` | Seller upload/write to own prefix; read aligned to product visibility rules | Pending storage policy export | Pending |
| `style-playground-images` | Owner-only upload/read/delete unless product feature requires sharing | Pending storage policy export | Pending |
| `user-profile-images` | Owner-only upload/read/delete | Pending storage policy export | Pending |

## Verification Notes

- Ensure policies reference `auth.uid()` and avoid trusting client-provided `user_id`.
- For relational policies (e.g. `album_outfits`, `outfit_items`), verify ownership checks via safe joins/subqueries.
- For views (`products_with_ratings`), confirm no hidden bypass via underlying table policies.
- Track policy SQL location/version so audits are repeatable.
- Record auditor name/date and link to policy dump evidence when this checklist is executed.

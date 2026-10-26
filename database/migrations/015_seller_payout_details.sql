-- 015_seller_payout_details.sql
-- Seller payout destination for C-CORE-4 / C-CORE-5 (Felix).
--
-- Numbered 015, not 013: Brian's notifications work is already on `zeus` and
-- claimed 013_notifications.sql and 014_push_tokens.sql.
--
-- Column names below are taken from the code on `phase3-seller-payout`
-- (backend/services/payoutDetailsService.ts) rather than invented here:
-- savePayoutDetails upserts { seller_id, type, label, account_name,
-- recipient_code } with onConflict 'seller_id', getPayoutDetails filters on
-- seller_id, and deletePayoutDetails hard-deletes by seller_id.
--
-- OPEN with Felix before this is applied: which id space `seller_id` holds.
-- See the note at the bottom.

-- ---------------------------------------------------------------------------
-- seller_payout_details — one Paystack transfer recipient per seller (v1)
-- ---------------------------------------------------------------------------
create table if not exists public.seller_payout_details (
    id uuid not null default gen_random_uuid() primary key,
    seller_id uuid not null references auth.users on delete cascade,
    type text not null check (type in ('nuban', 'mobile_money')),
    -- Display-only, already masked by the recipients handler
    -- ("M-Pesa •••• 1234"). The raw account number and bank code are
    -- deliberately not stored: Paystack holds them behind recipient_code.
    label text not null,
    account_name text not null,
    recipient_code text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    -- A real unique constraint, not a partial unique index: PostgREST's
    -- onConflict='seller_id' upsert cannot target a predicated index.
    constraint seller_payout_details_seller_id_key unique (seller_id)
);

create index if not exists idx_seller_payout_details_recipient_code
    on public.seller_payout_details (recipient_code);

drop trigger if exists update_seller_payout_details_updated_at on public.seller_payout_details;
create trigger update_seller_payout_details_updated_at
    before update on public.seller_payout_details
    for each row execute procedure public.update_updated_at_column();

alter table public.seller_payout_details enable row level security;

-- The BFF reaches this table as service_role and bypasses RLS. These policies
-- exist so a direct-from-client read stays scoped to the owner if one is ever
-- added, and so the table is not silently open.
drop policy if exists "Sellers can view own payout details" on public.seller_payout_details;
create policy "Sellers can view own payout details"
    on public.seller_payout_details for select
    using (auth.uid() = seller_id);

drop policy if exists "Sellers can insert own payout details" on public.seller_payout_details;
create policy "Sellers can insert own payout details"
    on public.seller_payout_details for insert
    with check (auth.uid() = seller_id);

drop policy if exists "Sellers can update own payout details" on public.seller_payout_details;
create policy "Sellers can update own payout details"
    on public.seller_payout_details for update
    using (auth.uid() = seller_id)
    with check (auth.uid() = seller_id);

drop policy if exists "Sellers can delete own payout details" on public.seller_payout_details;
create policy "Sellers can delete own payout details"
    on public.seller_payout_details for delete
    using (auth.uid() = seller_id);

-- ---------------------------------------------------------------------------
-- OPEN QUESTION — which seller id does payoutOnRelease pass?
-- ---------------------------------------------------------------------------
-- `orders` (012) carries two mutually exclusive seller columns:
--   * seller_id      -> business_accounts.id   (catalog sale)
--   * seller_user_id -> auth.users.id          (peer listing sale)
--
-- This table references auth.users, because that is the only id an RLS policy
-- can compare against auth.uid(), and it matches listings.seller_id.
--
-- So payoutOnRelease({ sellerId }) must be handed the seller's *user* id. For
-- a catalog order that means resolving business_accounts.user_id from
-- orders.seller_id first. If a caller passes orders.seller_id straight through,
-- getPayoutDetails returns null and every business-seller payout fails with
-- "no payout details on file" even though the seller registered them.
--
-- Felix to confirm before this is applied to shared dev.

-- KYC tables for personal sellers and business accounts (Option B: separate business_kyc)
-- Run after ecommerce_schema.sql in Supabase SQL Editor

-- 1. seller_kyc (personal sellers: one row per user when they opt in to sell)
create table if not exists public.seller_kyc (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    legal_name text not null,
    phone text not null,
    address_line1 text not null,
    city text not null,
    state_region text,
    postal_code text not null,
    country text not null,
    date_of_birth date,
    id_type text,
    id_number text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id)
);

alter table public.seller_kyc enable row level security;

create policy "Users can manage their own seller_kyc."
    on public.seller_kyc for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

create index idx_seller_kyc_user_id on public.seller_kyc(user_id);

-- 2. business_kyc (business account KYC: one row per business)
create table if not exists public.business_kyc (
    id uuid not null default gen_random_uuid() primary key,
    business_id uuid not null references public.business_accounts on delete cascade,
    legal_entity_name text not null,
    address_line1 text not null,
    city text not null,
    state_region text,
    postal_code text not null,
    country text not null,
    registration_number text,
    representative_legal_name text not null,
    representative_phone text not null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(business_id)
);

alter table public.business_kyc enable row level security;

-- Only the user who owns the business can read/insert/update business_kyc
create policy "Business owners can manage their business_kyc."
    on public.business_kyc for all
    using (
        exists (
            select 1 from public.business_accounts
            where id = business_id and user_id = auth.uid()
        )
    )
    with check (
        exists (
            select 1 from public.business_accounts
            where id = business_id and user_id = auth.uid()
        )
    );

create index idx_business_kyc_business_id on public.business_kyc(business_id);

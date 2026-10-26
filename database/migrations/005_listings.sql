-- 005: Peer-to-peer seller listings (Member 3 — Sell flow)
-- Distinct from business products table (001).

create table if not exists public.listings (
    id uuid not null default gen_random_uuid() primary key,
    seller_id uuid not null references auth.users on delete cascade,
    wardrobe_item_id uuid references public.wardrobe_items on delete set null,
    product_id uuid references public.products on delete set null,
    title text not null,
    description text,
    price integer not null check (price >= 0),
    currency text not null default 'KES',
    category text,
    size text,
    condition text,
    image_url text not null,
    status text not null default 'Draft'
        check (status in ('Active', 'Draft', 'Sold', 'Paused')),
    view_count integer not null default 0,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_listings_seller_id
    on public.listings (seller_id);
create index if not exists idx_listings_status
    on public.listings (status);
create index if not exists idx_listings_created_at
    on public.listings (created_at desc);
create index if not exists idx_listings_wardrobe_item_id
    on public.listings (wardrobe_item_id);

alter table public.listings enable row level security;

drop policy if exists "Active listings are viewable by everyone" on public.listings;
create policy "Active listings are viewable by everyone"
    on public.listings for select
    using (status = 'Active');

drop policy if exists "Sellers can view all their listings" on public.listings;
create policy "Sellers can view all their listings"
    on public.listings for select
    using (auth.uid() = seller_id);

drop policy if exists "Sellers can create listings" on public.listings;
create policy "Sellers can create listings"
    on public.listings for insert
    with check (auth.uid() = seller_id);

drop policy if exists "Sellers can update their listings" on public.listings;
create policy "Sellers can update their listings"
    on public.listings for update
    using (auth.uid() = seller_id);

drop policy if exists "Sellers can delete their listings" on public.listings;
create policy "Sellers can delete their listings"
    on public.listings for delete
    using (auth.uid() = seller_id);

drop trigger if exists update_listings_updated_at on public.listings;
create trigger update_listings_updated_at
    before update on public.listings
    for each row execute procedure public.update_updated_at_column();

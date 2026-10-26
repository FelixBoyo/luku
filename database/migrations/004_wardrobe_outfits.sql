-- 004: Mobile wardrobe + outfit extensions
-- Live dev has clothing_items/outfits/outfit_items (web legacy); adds wardrobe_items for mobile v1.

-- ---------------------------------------------------------------------------
-- Wardrobe inventory (Member 3)
-- ---------------------------------------------------------------------------
create table if not exists public.wardrobe_items (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    name text not null,
    category text not null,
    brand text,
    color text,
    size text,
    condition text,
    description text,
    image_url text not null,
    image_urls text[] not null default '{}',
    purchase_price integer not null default 0,
    wear_count integer not null default 0,
    source text not null default 'manual'
        check (source in ('manual', 'purchase')),
    clothing_item_id uuid references public.clothing_items on delete set null,
    order_id uuid references public.orders on delete set null,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_wardrobe_items_user_id
    on public.wardrobe_items (user_id);
create index if not exists idx_wardrobe_items_category
    on public.wardrobe_items (category);
create index if not exists idx_wardrobe_items_clothing_item_id
    on public.wardrobe_items (clothing_item_id);

alter table public.wardrobe_items enable row level security;

drop policy if exists "Users manage their own wardrobe items" on public.wardrobe_items;
create policy "Users manage their own wardrobe items"
    on public.wardrobe_items for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop trigger if exists update_wardrobe_items_updated_at on public.wardrobe_items;
create trigger update_wardrobe_items_updated_at
    before update on public.wardrobe_items
    for each row execute procedure public.update_updated_at_column();

-- ---------------------------------------------------------------------------
-- Wear log (log-wear action)
-- ---------------------------------------------------------------------------
create table if not exists public.wardrobe_wear_log (
    id uuid not null default gen_random_uuid() primary key,
    wardrobe_item_id uuid not null references public.wardrobe_items on delete cascade,
    user_id uuid not null references auth.users on delete cascade,
    worn_on date not null default current_date,
    occasion text,
    created_at timestamptz not null default now()
);

create index if not exists idx_wardrobe_wear_log_item_id
    on public.wardrobe_wear_log (wardrobe_item_id, worn_on desc);

alter table public.wardrobe_wear_log enable row level security;

drop policy if exists "Users manage their own wear log" on public.wardrobe_wear_log;
create policy "Users manage their own wear log"
    on public.wardrobe_wear_log for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

-- ---------------------------------------------------------------------------
-- Outfit extensions for mobile (created vs inspiration, cover image)
-- ---------------------------------------------------------------------------
alter table public.outfits
    add column if not exists occasion text,
    add column if not exists cover_image_url text,
    add column if not exists kind text not null default 'created'
        check (kind in ('created', 'inspiration')),
    add column if not exists updated_at timestamptz not null default now();

drop trigger if exists update_outfits_updated_at on public.outfits;
create trigger update_outfits_updated_at
    before update on public.outfits
    for each row execute procedure public.update_updated_at_column();

-- Mobile outfit pieces (legacy outfit_items + clothing_items unchanged for web)
create table if not exists public.outfit_pieces (
    id uuid not null default gen_random_uuid() primary key,
    outfit_id uuid not null references public.outfits on delete cascade,
    wardrobe_item_id uuid references public.wardrobe_items on delete cascade,
    product_id uuid references public.products on delete cascade,
    clothing_item_id uuid references public.clothing_items on delete cascade,
    piece_type text not null check (piece_type in ('wardrobe', 'product', 'clothing')),
    sort_order integer not null default 0,
    created_at timestamptz not null default now(),
    constraint outfit_pieces_single_ref check (
        num_nonnulls(wardrobe_item_id, product_id, clothing_item_id) = 1
    )
);

create index if not exists idx_outfit_pieces_outfit_id
    on public.outfit_pieces (outfit_id, sort_order);

alter table public.outfit_pieces enable row level security;

drop policy if exists "Users manage pieces in their own outfits" on public.outfit_pieces;
create policy "Users manage pieces in their own outfits"
    on public.outfit_pieces for all
    using (
        auth.uid() = (select user_id from public.outfits where id = outfit_id)
    )
    with check (
        auth.uid() = (select user_id from public.outfits where id = outfit_id)
    );

-- 006: Cart persistence + wishlist hardening + platform RPCs from 002
-- Live dev already has wishlist (001); cart_items is new.
-- Includes search_products_paginated + create_order_with_stock_check if 002 was not applied.

-- ---------------------------------------------------------------------------
-- Cart (Member 4 — AppStateContext migration target)
-- ---------------------------------------------------------------------------
create table if not exists public.cart_items (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    product_id uuid not null references public.products on delete cascade,
    quantity integer not null default 1 check (quantity > 0),
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique (user_id, product_id)
);

create index if not exists idx_cart_items_user_id
    on public.cart_items (user_id);

alter table public.cart_items enable row level security;

drop policy if exists "Users manage their own cart" on public.cart_items;
create policy "Users manage their own cart"
    on public.cart_items for all
    using (auth.uid() = user_id)
    with check (auth.uid() = user_id);

drop trigger if exists update_cart_items_updated_at on public.cart_items;
create trigger update_cart_items_updated_at
    before update on public.cart_items
    for each row execute procedure public.update_updated_at_column();

-- Wishlist already exists from 001; ensure index coverage for mobile list queries
create index if not exists idx_wishlist_user_created
    on public.wishlist (user_id, created_at desc);

-- ---------------------------------------------------------------------------
-- RPC: create_order_with_stock_check (from legacy/backend_optimizations.sql)
-- ---------------------------------------------------------------------------
create or replace function public.create_order_with_stock_check(
    p_buyer_id uuid,
    p_product_id uuid,
    p_quantity integer,
    p_shipping_address jsonb,
    p_stripe_payment_intent_id text
)
returns jsonb as $$
declare
    v_product record;
    v_order_id uuid;
    v_seller_id uuid;
    v_price_per_unit decimal(10, 2);
    v_total_price decimal(10, 2);
begin
    select id, business_id, price, stock_quantity
    into v_product
    from public.products
    where id = p_product_id
    for update;

    if not found then
        return jsonb_build_object('success', false, 'error', 'Product not found');
    end if;

    if v_product.stock_quantity < p_quantity then
        return jsonb_build_object(
            'success', false,
            'error', 'Insufficient stock',
            'available_stock', v_product.stock_quantity
        );
    end if;

    v_seller_id := v_product.business_id;
    v_price_per_unit := v_product.price;
    v_total_price := v_price_per_unit * p_quantity;

    insert into public.orders (
        buyer_id,
        seller_id,
        product_id,
        quantity,
        price_per_unit,
        total_price,
        shipping_address,
        stripe_payment_intent_id,
        status
    ) values (
        p_buyer_id,
        v_seller_id,
        p_product_id,
        p_quantity,
        v_price_per_unit,
        v_total_price,
        p_shipping_address,
        p_stripe_payment_intent_id,
        'pending'
    )
    returning id into v_order_id;

    update public.products
    set stock_quantity = stock_quantity - p_quantity
    where id = p_product_id;

    return jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'total_price', v_total_price
    );
exception
    when others then
        return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$ language plpgsql security definer;

grant execute on function public.create_order_with_stock_check to authenticated;

-- ---------------------------------------------------------------------------
-- RPC: search_products_paginated (requires products_with_ratings view from 001)
-- ---------------------------------------------------------------------------
create or replace function public.search_products_paginated(
    p_search_term text default null,
    p_category text default null,
    p_color text default null,
    p_style text default null,
    p_min_price decimal default null,
    p_max_price decimal default null,
    p_page integer default 1,
    p_page_size integer default 20
)
returns table (
    products jsonb,
    total_count bigint,
    total_pages integer
) as $$
declare
    v_offset integer;
    v_total bigint;
    v_pages integer;
begin
    v_offset := (p_page - 1) * p_page_size;

    select count(*)
    into v_total
    from public.products_with_ratings p
    where p.is_active = true
        and (p_search_term is null or
             to_tsvector('english', p.name || ' ' || coalesce(p.description, ''))
             @@ plainto_tsquery('english', p_search_term))
        and (p_category is null or p.category = p_category)
        and (p_color is null or p.color = p_color)
        and (p_style is null or p.style = p_style)
        and (p_min_price is null or p.price >= p_min_price)
        and (p_max_price is null or p.price <= p_max_price);

    v_pages := ceil(v_total::numeric / p_page_size);

    return query
    select
        jsonb_agg(
            jsonb_build_object(
                'id', p.id,
                'name', p.name,
                'description', p.description,
                'price', p.price,
                'category', p.category,
                'color', p.color,
                'style', p.style,
                'season', p.season,
                'size', p.size,
                'stock_quantity', p.stock_quantity,
                'image_urls', p.image_urls,
                'is_featured', p.is_featured,
                'average_rating', p.average_rating,
                'review_count', p.review_count,
                'created_at', p.created_at
            )
        ) as products,
        v_total as total_count,
        v_pages as total_pages
    from (
        select *
        from public.products_with_ratings p
        where p.is_active = true
            and (p_search_term is null or
                 to_tsvector('english', p.name || ' ' || coalesce(p.description, ''))
                 @@ plainto_tsquery('english', p_search_term))
            and (p_category is null or p.category = p_category)
            and (p_color is null or p.color = p_color)
            and (p_style is null or p.style = p_style)
            and (p_min_price is null or p.price >= p_min_price)
            and (p_max_price is null or p.price <= p_max_price)
        order by p.created_at desc
        limit p_page_size
        offset v_offset
    ) p;
end;
$$ language plpgsql security definer;

grant execute on function public.search_products_paginated to authenticated;

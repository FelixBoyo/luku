-- Backend Optimizations for LUKU
-- Run this SQL in your Supabase SQL Editor to enhance backend performance and scalability

-- ============================================================================
-- 1. ATOMIC STOCK MANAGEMENT FUNCTION
-- Prevents race conditions when creating orders
-- ============================================================================
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
    v_result jsonb;
begin
    -- Lock the product row for update to prevent concurrent modifications
    select id, business_id, price, stock_quantity
    into v_product
    from public.products
    where id = p_product_id
    for update;
    
    -- Check if product exists
    if not found then
        return jsonb_build_object(
            'success', false,
            'error', 'Product not found'
        );
    end if;
    
    -- Check stock availability
    if v_product.stock_quantity < p_quantity then
        return jsonb_build_object(
            'success', false,
            'error', 'Insufficient stock',
            'available_stock', v_product.stock_quantity
        );
    end if;
    
    -- Calculate prices
    v_seller_id := v_product.business_id;
    v_price_per_unit := v_product.price;
    v_total_price := v_price_per_unit * p_quantity;
    
    -- Create the order
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
    
    -- Update stock atomically
    update public.products
    set stock_quantity = stock_quantity - p_quantity
    where id = p_product_id;
    
    -- Return success with order details
    return jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'total_price', v_total_price
    );
exception
    when others then
        return jsonb_build_object(
            'success', false,
            'error', sqlerrm
        );
end;
$$ language plpgsql security definer;

-- Grant execute permission to authenticated users
grant execute on function public.create_order_with_stock_check to authenticated;

-- ============================================================================
-- 2. OPTIMIZED ANALYTICS FUNCTION
-- Server-side calculation for better performance
-- ============================================================================
create or replace function public.get_business_analytics(
    p_business_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz
)
returns jsonb as $$
declare
    v_result jsonb;
    v_total_revenue decimal(10, 2);
    v_total_orders integer;
    v_average_order_value decimal(10, 2);
    v_total_products integer;
    v_active_listings integer;
    v_low_stock_products integer;
begin
    -- Calculate revenue and orders
    select 
        coalesce(sum(total_price), 0),
        count(*)
    into v_total_revenue, v_total_orders
    from public.orders
    where seller_id = p_business_id
        and created_at >= p_start_date
        and created_at <= p_end_date;
    
    -- Calculate average order value
    v_average_order_value := case 
        when v_total_orders > 0 then v_total_revenue / v_total_orders
        else 0
    end;
    
    -- Get product statistics
    select 
        count(*),
        count(*) filter (where is_active = true),
        count(*) filter (where stock_quantity < 10)
    into v_total_products, v_active_listings, v_low_stock_products
    from public.products
    where business_id = p_business_id;
    
    -- Build result
    v_result := jsonb_build_object(
        'total_revenue', v_total_revenue,
        'total_orders', v_total_orders,
        'average_order_value', v_average_order_value,
        'total_products', v_total_products,
        'active_listings', v_active_listings,
        'low_stock_products', v_low_stock_products
    );
    
    return v_result;
end;
$$ language plpgsql security definer;

grant execute on function public.get_business_analytics to authenticated;

-- ============================================================================
-- 3. TOP SELLING PRODUCTS FUNCTION
-- Optimized query for analytics dashboard
-- ============================================================================
create or replace function public.get_top_selling_products(
    p_business_id uuid,
    p_start_date timestamptz,
    p_end_date timestamptz,
    p_limit integer default 10
)
returns table (
    product_id uuid,
    product_name text,
    total_sold integer,
    revenue decimal(10, 2)
) as $$
begin
    return query
    select 
        p.id as product_id,
        p.name as product_name,
        sum(o.quantity)::integer as total_sold,
        sum(o.total_price) as revenue
    from public.orders o
    join public.products p on o.product_id = p.id
    where o.seller_id = p_business_id
        and o.created_at >= p_start_date
        and o.created_at <= p_end_date
    group by p.id, p.name
    order by revenue desc
    limit p_limit;
end;
$$ language plpgsql security definer;

grant execute on function public.get_top_selling_products to authenticated;

-- ============================================================================
-- 4. MOOD BOARD PRODUCT RECOMMENDATIONS FUNCTION
-- Integrates albums (mood boards) with marketplace products
-- ============================================================================
create or replace function public.get_mood_board_product_recommendations(
    p_album_id uuid,
    p_limit integer default 10
)
returns table (
    product_id uuid,
    product_name text,
    price decimal(10, 2),
    category text,
    color text,
    style text,
    image_urls text[],
    average_rating numeric,
    relevance_score integer
) as $$
declare
    v_categories text[];
    v_colors text[];
    v_styles text[];
begin
    -- Extract categories, colors, and styles from album outfits
    select 
        array_agg(distinct ci.category),
        array_agg(distinct ci.color),
        array_agg(distinct ci.style)
    into v_categories, v_colors, v_styles
    from public.albums a
    join public.album_outfits ao on a.id = ao.album_id
    join public.outfits o on ao.outfit_id = o.id
    join public.outfit_items oi on o.id = oi.outfit_id
    join public.clothing_items ci on oi.item_id = ci.id
    where a.id = p_album_id;
    
    -- Return products matching the mood board style
    return query
    select 
        p.id as product_id,
        p.name as product_name,
        p.price,
        p.category,
        p.color,
        p.style,
        p.image_urls,
        coalesce(pr.avg_rating, 0) as average_rating,
        (
            case when p.category = any(v_categories) then 1 else 0 end +
            case when p.color = any(v_colors) then 2 else 0 end +
            case when p.style = any(v_styles) then 2 else 0 end
        )::integer as relevance_score
    from public.products p
    left join (
        select 
            product_id,
            avg(rating) as avg_rating
        from public.product_reviews
        group by product_id
    ) pr on p.id = pr.product_id
    where p.is_active = true
        and (
            p.category = any(v_categories)
            or p.color = any(v_colors)
            or p.style = any(v_styles)
        )
    order by relevance_score desc, p.created_at desc
    limit p_limit;
end;
$$ language plpgsql security definer;

grant execute on function public.get_mood_board_product_recommendations to authenticated;

-- ============================================================================
-- 5. ADDITIONAL INDEXES FOR PERFORMANCE
-- ============================================================================

-- Composite index for product filtering
create index if not exists idx_products_filtering 
    on public.products(is_active, category, color, style, created_at desc);

-- Composite index for order queries with date range
create index if not exists idx_orders_seller_date 
    on public.orders(seller_id, created_at desc) 
    where status != 'cancelled';

-- Index for full-text search on products
create index if not exists idx_products_search 
    on public.products using gin(to_tsvector('english', name || ' ' || coalesce(description, '')));

-- Index for album queries
create index if not exists idx_album_outfits_album_id 
    on public.album_outfits(album_id);

-- Index for outfit items
create index if not exists idx_outfit_items_outfit_id 
    on public.outfit_items(outfit_id);

-- ============================================================================
-- 6. MATERIALIZED VIEW FOR PRODUCT STATISTICS (Optional - refresh as needed)
-- ============================================================================
create materialized view if not exists public.product_statistics as
select 
    p.id as product_id,
    p.business_id,
    p.name,
    p.category,
    p.color,
    p.style,
    p.price,
    p.stock_quantity,
    coalesce(avg(pr.rating), 0) as average_rating,
    count(pr.id) as review_count,
    sum(case when o.status != 'cancelled' then o.quantity else 0 end) as total_sold,
    sum(case when o.status != 'cancelled' then o.total_price else 0 end) as total_revenue
from public.products p
left join public.product_reviews pr on p.id = pr.product_id
left join public.orders o on p.id = o.product_id
group by p.id, p.business_id, p.name, p.category, p.color, p.style, p.price, p.stock_quantity;

create unique index if not exists idx_product_statistics_product_id 
    on public.product_statistics(product_id);

-- Function to refresh materialized view (call periodically)
create or replace function public.refresh_product_statistics()
returns void as $$
begin
    refresh materialized view concurrently public.product_statistics;
end;
$$ language plpgsql;

-- ============================================================================
-- 7. ENHANCED PRODUCT SEARCH FUNCTION WITH PAGINATION
-- ============================================================================
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
    
    -- Get total count
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
    
    -- Return paginated results
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

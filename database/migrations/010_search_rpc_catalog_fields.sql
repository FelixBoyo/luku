-- 010: Include business_id and is_active in search_products_paginated JSON payload
-- (stock_quantity was already present; business_id/is_active required for BFF mapRowToDto)

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
             p.name ilike '%' || p_search_term || '%' or
             coalesce(p.description, '') ilike '%' || p_search_term || '%')
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
                'is_active', p.is_active,
                'business_id', p.business_id,
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
                 p.name ilike '%' || p_search_term || '%' or
                 coalesce(p.description, '') ilike '%' || p_search_term || '%')
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

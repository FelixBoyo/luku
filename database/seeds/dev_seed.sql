-- LUKU dev seed — run after migrations 001–008
-- Apply: npm run db:seed (creates auth users + runs this file)
--
-- Dev credentials (local only):
--   dev+buyer@luku.app   / LukuDev2026!  → Shannon Martinez (buyer)
--   dev+seller@luku.app  / LukuDev2026!  → Chic Boutique (seller)
--   dev+seller2@luku.app / LukuDev2026!  → Vintage Vibes (seller)
--
-- Fixed UUIDs (must match scripts/apply-seed.mjs):
--   buyer   f0000001-0000-4000-8000-000000000001
--   seller1 f0000001-0000-4000-8000-000000000002
--   seller2 f0000001-0000-4000-8000-000000000003

-- ---------------------------------------------------------------------------
-- Profiles
-- ---------------------------------------------------------------------------
insert into public.profiles (
    id,
    email,
    display_name,
    handle,
    bio,
    avatar_url,
    location,
    website,
    style_preferences
) values
    (
        'f0000001-0000-4000-8000-000000000001',
        'dev+buyer@luku.app',
        'Shannon Martinez',
        '@shannonm',
        'Minimalist style enthusiast · Sustainable fashion advocate',
        'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=400',
        'Nairobi, Kenya',
        'https://shannonmartinez.example',
        array['Minimalist', 'Sustainable', 'Vintage']
    ),
    (
        'f0000001-0000-4000-8000-000000000002',
        'dev+seller@luku.app',
        'Chic Boutique',
        '@chicboutique',
        'Curated contemporary pieces with fast shipping across Kenya.',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400',
        'Nairobi, Kenya',
        null,
        array['Contemporary', 'Professional']
    ),
    (
        'f0000001-0000-4000-8000-000000000003',
        'dev+seller2@luku.app',
        'Vintage Vibes',
        '@vintagevibes',
        'Timeless vintage finds — authenticated and photographed in natural light.',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=400',
        'Mombasa, Kenya',
        null,
        array['Vintage', 'Retro']
    )
on conflict (id) do update set
    email = excluded.email,
    display_name = excluded.display_name,
    handle = excluded.handle,
    bio = excluded.bio,
    avatar_url = excluded.avatar_url,
    location = excluded.location,
    website = excluded.website,
    style_preferences = excluded.style_preferences,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Business accounts (marketplace sellers)
-- ---------------------------------------------------------------------------
insert into public.business_accounts (
    id,
    user_id,
    business_name,
    business_description,
    logo_url,
    contact_email,
    is_verified
) values
    (
        'b0000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000002',
        'Chic Boutique',
        'Contemporary wardrobe staples and occasion wear.',
        'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200',
        'dev+seller@luku.app',
        true
    ),
    (
        'b0000001-0000-4000-8000-000000000002',
        'f0000001-0000-4000-8000-000000000003',
        'Vintage Vibes',
        'Authenticated vintage leather, denim, and accessories.',
        'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200',
        'dev+seller2@luku.app',
        true
    )
on conflict (id) do update set
    business_name = excluded.business_name,
    business_description = excluded.business_description,
    logo_url = excluded.logo_url,
    contact_email = excluded.contact_email,
    is_verified = excluded.is_verified,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Catalog products (aligned with apps/mobile mock catalog)
-- ---------------------------------------------------------------------------
insert into public.products (
    id,
    business_id,
    name,
    description,
    price,
    category,
    color,
    style,
    season,
    size,
    stock_quantity,
    image_urls,
    is_featured,
    is_active
) values
    (
        'c0000001-0000-4000-8000-000000000001',
        'b0000001-0000-4000-8000-000000000002',
        'Vintage Leather Jacket',
        'Classic vintage leather jacket in excellent condition. Authentic distressing and a timeless cut.',
        12500.00,
        'Outerwear',
        'Brown',
        'Vintage',
        'All Season',
        'M',
        3,
        array['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800'],
        true,
        true
    ),
    (
        'c0000001-0000-4000-8000-000000000002',
        'b0000001-0000-4000-8000-000000000001',
        'Wool Trench Coat',
        'Tailored wool trench in neutral beige. Structured shoulders and a belted waist.',
        18900.00,
        'Outerwear',
        'Beige',
        'Classic',
        'Autumn',
        'L',
        2,
        array['https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800'],
        true,
        true
    ),
    (
        'c0000001-0000-4000-8000-000000000003',
        'b0000001-0000-4000-8000-000000000001',
        'Minimalist Handbag',
        'Clean-lined structured handbag in camel leather with magnetic closure.',
        9800.00,
        'Accessories',
        'Camel',
        'Minimalist',
        'All Season',
        'One Size',
        5,
        array['https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=800'],
        false,
        true
    ),
    (
        'c0000001-0000-4000-8000-000000000004',
        'b0000001-0000-4000-8000-000000000001',
        'Silk Midi Dress',
        'Fluid silk midi dress with a subtle sheen. Desk to dinner ready.',
        7500.00,
        'Dresses',
        'Green',
        'Elegant',
        'Spring',
        'S',
        4,
        array['https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=800'],
        false,
        true
    ),
    (
        'c0000001-0000-4000-8000-000000000005',
        'b0000001-0000-4000-8000-000000000002',
        'Leather Ankle Boots',
        'Hand-finished leather ankle boots with stacked heel and side zip.',
        11200.00,
        'Shoes',
        'Brown',
        'Heritage',
        'Winter',
        '8',
        2,
        array['https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800'],
        false,
        true
    ),
    (
        'c0000001-0000-4000-8000-000000000006',
        'b0000001-0000-4000-8000-000000000001',
        'Cashmere Sweater',
        'Pure cashmere crew-neck sweater in versatile oatmeal.',
        8900.00,
        'Tops',
        'Oatmeal',
        'Minimalist',
        'Winter',
        'M',
        6,
        array['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800'],
        false,
        true
    ),
    (
        'c0000001-0000-4000-8000-000000000007',
        'b0000001-0000-4000-8000-000000000002',
        'Vintage Denim Jacket',
        'Light-wash vintage denim with classic trucker silhouette.',
        6500.00,
        'Outerwear',
        'Blue',
        'Vintage',
        'All Season',
        'M',
        1,
        array['https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400'],
        true,
        true
    ),
    (
        'c0000001-0000-4000-8000-000000000008',
        'b0000001-0000-4000-8000-000000000001',
        'Linen Summer Dress',
        'Breathable linen midi dress in soft ivory for warm days.',
        5400.00,
        'Dresses',
        'Ivory',
        'Casual',
        'Summer',
        'M',
        3,
        array['https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=800'],
        false,
        true
    )
on conflict (id) do update set
    name = excluded.name,
    description = excluded.description,
    price = excluded.price,
    category = excluded.category,
    color = excluded.color,
    style = excluded.style,
    season = excluded.season,
    size = excluded.size,
    stock_quantity = excluded.stock_quantity,
    image_urls = excluded.image_urls,
    is_featured = excluded.is_featured,
    is_active = excluded.is_active,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Buyer wardrobe
-- ---------------------------------------------------------------------------
insert into public.wardrobe_items (
    id,
    user_id,
    name,
    category,
    brand,
    color,
    size,
    condition,
    description,
    image_url,
    image_urls,
    purchase_price,
    wear_count,
    source
) values
    (
        'd0000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        'Wool Coat',
        'Outerwear',
        'Massimo Dutti',
        'Camel',
        'M',
        'Gently Used',
        'Structured wool coat for cool evenings.',
        'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=800',
        array['https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=800'],
        18500,
        12,
        'manual'
    ),
    (
        'd0000001-0000-4000-8000-000000000002',
        'f0000001-0000-4000-8000-000000000001',
        'Cashmere Sweater',
        'Tops',
        'COS',
        'Cream',
        'S',
        'Gently Used',
        null,
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
        array['https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800'],
        9800,
        24,
        'manual'
    ),
    (
        'd0000001-0000-4000-8000-000000000003',
        'f0000001-0000-4000-8000-000000000001',
        'Leather Ankle Boots',
        'Shoes',
        'Clarks',
        'Dark Brown',
        '42',
        'Used',
        null,
        'https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?w=800',
        array['https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?w=800'],
        8900,
        20,
        'manual'
    )
on conflict (id) do update set
    name = excluded.name,
    category = excluded.category,
    brand = excluded.brand,
    color = excluded.color,
    size = excluded.size,
    condition = excluded.condition,
    image_url = excluded.image_url,
    image_urls = excluded.image_urls,
    purchase_price = excluded.purchase_price,
    wear_count = excluded.wear_count,
    updated_at = now();

insert into public.wardrobe_wear_log (id, wardrobe_item_id, user_id, worn_on, occasion)
values
    (
        'd1000001-0000-4000-8000-000000000001',
        'd0000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        current_date - 3,
        'Dinner with friends'
    )
on conflict (id) do nothing;

-- ---------------------------------------------------------------------------
-- Peer listings (Sell flow samples)
-- ---------------------------------------------------------------------------
insert into public.listings (
    id,
    seller_id,
    wardrobe_item_id,
    title,
    description,
    price,
    category,
    size,
    condition,
    image_url,
    status,
    view_count
) values
    (
        'e0000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        'd0000001-0000-4000-8000-000000000002',
        'Cashmere Sweater',
        'Soft cream cashmere, lightly worn.',
        4200,
        'Tops',
        'S',
        'Gently Used',
        'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
        'Active',
        31
    ),
    (
        'e0000001-0000-4000-8000-000000000002',
        'f0000001-0000-4000-8000-000000000001',
        null,
        'Vintage Denim Jacket',
        'Listing from closet clean-out.',
        8900,
        'Outerwear',
        'M',
        'Gently Used',
        'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        'Draft',
        0
    )
on conflict (id) do update set
    title = excluded.title,
    price = excluded.price,
    status = excluded.status,
    view_count = excluded.view_count,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Wishlist + cart
-- ---------------------------------------------------------------------------
insert into public.wishlist (id, user_id, product_id)
values
    (
        'f1000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        'c0000001-0000-4000-8000-000000000001'
    ),
    (
        'f1000001-0000-4000-8000-000000000002',
        'f0000001-0000-4000-8000-000000000001',
        'c0000001-0000-4000-8000-000000000003'
    )
on conflict (user_id, product_id) do nothing;

insert into public.cart_items (id, user_id, product_id, quantity)
values
    (
        'a0000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        'c0000001-0000-4000-8000-000000000004',
        1
    )
on conflict (user_id, product_id) do update set
    quantity = excluded.quantity,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- Outfit + pieces
-- ---------------------------------------------------------------------------
insert into public.outfits (
    id,
    user_id,
    outfit_name,
    description,
    occasion,
    cover_image_url,
    kind
) values
    (
        'a0000002-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        'Casual Weekend',
        'Relaxed layers for brunch and errands.',
        'Weekend',
        'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600',
        'created'
    )
on conflict (id) do update set
    outfit_name = excluded.outfit_name,
    description = excluded.description,
    occasion = excluded.occasion,
    cover_image_url = excluded.cover_image_url,
    updated_at = now();

insert into public.outfit_pieces (id, outfit_id, wardrobe_item_id, piece_type, sort_order)
values
    (
        'a0000003-0000-4000-8000-000000000001',
        'a0000002-0000-4000-8000-000000000001',
        'd0000001-0000-4000-8000-000000000001',
        'wardrobe',
        0
    ),
    (
        'a0000003-0000-4000-8000-000000000002',
        'a0000002-0000-4000-8000-000000000001',
        'd0000001-0000-4000-8000-000000000003',
        'wardrobe',
        1
    )
on conflict (id) do update set
    sort_order = excluded.sort_order;

-- ---------------------------------------------------------------------------
-- Social graph
-- ---------------------------------------------------------------------------
insert into public.user_follows (follower_id, following_id)
values
    ('f0000001-0000-4000-8000-000000000001', 'f0000001-0000-4000-8000-000000000002'),
    ('f0000001-0000-4000-8000-000000000001', 'f0000001-0000-4000-8000-000000000003')
on conflict (follower_id, following_id) do nothing;

-- ---------------------------------------------------------------------------
-- Inbox sample thread (buyer ↔ seller)
-- ---------------------------------------------------------------------------
insert into public.inbox_threads (
    id,
    participant_one_id,
    participant_two_id,
    listing_id,
    last_message_body,
    last_message_at
) values
    (
        '90000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000002',
        'e0000001-0000-4000-8000-000000000001',
        'Yes, the sweater is still available!',
        now() - interval '2 minutes'
    )
on conflict (id) do update set
    last_message_body = excluded.last_message_body,
    last_message_at = excluded.last_message_at;

insert into public.inbox_messages (id, thread_id, sender_id, body, created_at)
values
    (
        '90000002-0000-4000-8000-000000000001',
        '90000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000001',
        'Hi! Is the cashmere sweater still available in size S?',
        now() - interval '10 minutes'
    ),
    (
        '90000002-0000-4000-8000-000000000002',
        '90000001-0000-4000-8000-000000000001',
        'f0000001-0000-4000-8000-000000000002',
        'Yes, the sweater is still available!',
        now() - interval '2 minutes'
    )
on conflict (id) do nothing;

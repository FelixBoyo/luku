-- eCommerce Marketplace Feature Database Schema
-- Run this SQL in your Supabase SQL Editor to set up the eCommerce tables

-- 1. Create business_accounts table
create table public.business_accounts (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    business_name text not null,
    business_description text,
    logo_url text,
    banner_url text,
    contact_email text not null,
    is_verified boolean not null default false,
    stripe_account_id text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(user_id)
);

-- Enable RLS
alter table public.business_accounts enable row level security;

-- RLS Policies for business_accounts
create policy "Business accounts are viewable by everyone." 
    on public.business_accounts for select 
    using (true);

create policy "Users can insert their own business account." 
    on public.business_accounts for insert 
    with check (auth.uid() = user_id);

create policy "Users can update their own business account." 
    on public.business_accounts for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own business account." 
    on public.business_accounts for delete 
    using (auth.uid() = user_id);

-- Indexes
create index idx_business_accounts_user_id on public.business_accounts(user_id);
create index idx_business_accounts_verified on public.business_accounts(is_verified);

-- 2. Create products table
create table public.products (
    id uuid not null default gen_random_uuid() primary key,
    business_id uuid not null references public.business_accounts on delete cascade,
    name text not null,
    description text,
    price decimal(10, 2) not null,
    category text not null,
    color text not null,
    style text not null,
    season text not null,
    size text not null,
    stock_quantity integer not null default 0,
    image_urls text[] not null default '{}',
    is_featured boolean not null default false,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.products enable row level security;

-- RLS Policies for products
create policy "Active products are viewable by everyone." 
    on public.products for select 
    using (is_active = true);

create policy "Business owners can view all their products." 
    on public.products for select 
    using (
        exists (
            select 1 from public.business_accounts 
            where id = business_id and user_id = auth.uid()
        )
    );

create policy "Business owners can insert products." 
    on public.products for insert 
    with check (
        exists (
            select 1 from public.business_accounts 
            where id = business_id and user_id = auth.uid()
        )
    );

create policy "Business owners can update their products." 
    on public.products for update 
    using (
        exists (
            select 1 from public.business_accounts 
            where id = business_id and user_id = auth.uid()
        )
    );

create policy "Business owners can delete their products." 
    on public.products for delete 
    using (
        exists (
            select 1 from public.business_accounts 
            where id = business_id and user_id = auth.uid()
        )
    );

-- Indexes
create index idx_products_business_id on public.products(business_id);
create index idx_products_category on public.products(category);
create index idx_products_color on public.products(color);
create index idx_products_style on public.products(style);
create index idx_products_featured on public.products(is_featured);
create index idx_products_active on public.products(is_active);

-- 3. Create orders table
create table public.orders (
    id uuid not null default gen_random_uuid() primary key,
    buyer_id uuid not null references auth.users on delete cascade,
    seller_id uuid not null references public.business_accounts on delete cascade,
    product_id uuid not null references public.products on delete restrict,
    quantity integer not null,
    price_per_unit decimal(10, 2) not null,
    total_price decimal(10, 2) not null,
    status text not null default 'pending' check (status in ('pending', 'confirmed', 'shipped', 'delivered', 'cancelled')),
    shipping_address jsonb not null,
    stripe_payment_intent_id text not null,
    tracking_number text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

-- Enable RLS
alter table public.orders enable row level security;

-- RLS Policies for orders
create policy "Buyers can view their own orders." 
    on public.orders for select 
    using (auth.uid() = buyer_id);

create policy "Sellers can view orders for their products." 
    on public.orders for select 
    using (
        exists (
            select 1 from public.business_accounts 
            where id = seller_id and user_id = auth.uid()
        )
    );

create policy "Users can create orders." 
    on public.orders for insert 
    with check (auth.uid() = buyer_id);

create policy "Sellers can update order status." 
    on public.orders for update 
    using (
        exists (
            select 1 from public.business_accounts 
            where id = seller_id and user_id = auth.uid()
        )
    );

-- Indexes
create index idx_orders_buyer_id on public.orders(buyer_id);
create index idx_orders_seller_id on public.orders(seller_id);
create index idx_orders_product_id on public.orders(product_id);
create index idx_orders_status on public.orders(status);
create index idx_orders_created_at on public.orders(created_at);

-- 4. Create product_reviews table
create table public.product_reviews (
    id uuid not null default gen_random_uuid() primary key,
    product_id uuid not null references public.products on delete cascade,
    order_id uuid not null references public.orders on delete cascade,
    user_id uuid not null references auth.users on delete cascade,
    rating integer not null check (rating >= 1 and rating <= 5),
    review_text text,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    unique(order_id) -- One review per order
);

-- Enable RLS
alter table public.product_reviews enable row level security;

-- RLS Policies for product_reviews
create policy "Reviews are viewable by everyone." 
    on public.product_reviews for select 
    using (true);

create policy "Users can create reviews for their orders." 
    on public.product_reviews for insert 
    with check (
        auth.uid() = user_id and
        exists (
            select 1 from public.orders 
            where id = order_id and buyer_id = auth.uid()
        )
    );

create policy "Users can update their own reviews." 
    on public.product_reviews for update 
    using (auth.uid() = user_id);

create policy "Users can delete their own reviews." 
    on public.product_reviews for delete 
    using (auth.uid() = user_id);

-- Indexes
create index idx_product_reviews_product_id on public.product_reviews(product_id);
create index idx_product_reviews_order_id on public.product_reviews(order_id);
create index idx_product_reviews_user_id on public.product_reviews(user_id);
create index idx_product_reviews_rating on public.product_reviews(rating);

-- 5. Create promotions table
create table public.promotions (
    id uuid not null default gen_random_uuid() primary key,
    business_id uuid not null references public.business_accounts on delete cascade,
    product_id uuid references public.products on delete cascade,
    promotion_type text not null check (promotion_type in ('discount', 'bundle', 'flash_sale')),
    discount_percentage integer check (discount_percentage >= 0 and discount_percentage <= 100),
    discount_amount decimal(10, 2) check (discount_amount >= 0),
    start_date timestamptz not null,
    end_date timestamptz not null,
    is_active boolean not null default true,
    created_at timestamptz not null default now(),
    check (end_date > start_date)
);

-- Enable RLS
alter table public.promotions enable row level security;

-- RLS Policies for promotions
create policy "Active promotions are viewable by everyone." 
    on public.promotions for select 
    using (is_active = true and now() >= start_date and now() <= end_date);

create policy "Business owners can view all their promotions." 
    on public.promotions for select 
    using (
        exists (
            select 1 from public.business_accounts 
            where id = business_id and user_id = auth.uid()
        )
    );

create policy "Business owners can manage their promotions." 
    on public.promotions for all 
    using (
        exists (
            select 1 from public.business_accounts 
            where id = business_id and user_id = auth.uid()
        )
    );

-- Indexes
create index idx_promotions_business_id on public.promotions(business_id);
create index idx_promotions_product_id on public.promotions(product_id);
create index idx_promotions_active on public.promotions(is_active);
create index idx_promotions_dates on public.promotions(start_date, end_date);

-- 6. Create wishlist table
create table public.wishlist (
    id uuid not null default gen_random_uuid() primary key,
    user_id uuid not null references auth.users on delete cascade,
    product_id uuid not null references public.products on delete cascade,
    created_at timestamptz not null default now(),
    unique(user_id, product_id)
);

-- Enable RLS
alter table public.wishlist enable row level security;

-- RLS Policies for wishlist
create policy "Users can view their own wishlist." 
    on public.wishlist for select 
    using (auth.uid() = user_id);

create policy "Users can manage their own wishlist." 
    on public.wishlist for all 
    using (auth.uid() = user_id);

-- Indexes
create index idx_wishlist_user_id on public.wishlist(user_id);
create index idx_wishlist_product_id on public.wishlist(product_id);

-- Function to update updated_at timestamp
create or replace function public.update_updated_at_column()
returns trigger as $$
begin
    new.updated_at = now();
    return new;
end;
$$ language plpgsql;

-- Triggers for updated_at
create trigger update_business_accounts_updated_at
    before update on public.business_accounts
    for each row execute procedure public.update_updated_at_column();

create trigger update_products_updated_at
    before update on public.products
    for each row execute procedure public.update_updated_at_column();

create trigger update_orders_updated_at
    before update on public.orders
    for each row execute procedure public.update_updated_at_column();

create trigger update_product_reviews_updated_at
    before update on public.product_reviews
    for each row execute procedure public.update_updated_at_column();

-- Function to calculate product average rating
create or replace function public.calculate_product_rating(product_uuid uuid)
returns numeric as $$
declare
    avg_rating numeric;
begin
    select coalesce(avg(rating), 0) into avg_rating
    from public.product_reviews
    where product_id = product_uuid;
    return round(avg_rating, 2);
end;
$$ language plpgsql;

-- View for products with ratings
create view public.products_with_ratings as
select 
    p.*,
    coalesce(avg(pr.rating), 0) as average_rating,
    count(pr.id) as review_count
from public.products p
left join public.product_reviews pr on p.id = pr.product_id
group by p.id;


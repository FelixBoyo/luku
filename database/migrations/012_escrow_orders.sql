-- 012: Escrow data foundation (C-CORE-1)
-- Implements ADR-11 (docs/architecture/ESCROW_POLICY.md): escrow order statuses,
-- per-transition timestamps, payment truth keyed by Paystack reference, DB-backed
-- webhook dedupe, and peer-listing orderability.
--
-- Safe to re-run. Order matters: the legacy status CHECK is dropped before the
-- backfill so legacy values can be rewritten, and the new CHECK is added last.

-- ---------------------------------------------------------------------------
-- 1. Drop the legacy status CHECK (blocks every escrow state)
-- ---------------------------------------------------------------------------
do $$
declare
    c record;
begin
    for c in
        select con.conname
        from pg_constraint con
        join pg_class rel on rel.oid = con.conrelid
        join pg_namespace nsp on nsp.oid = rel.relnamespace
        where nsp.nspname = 'public'
          and rel.relname = 'orders'
          and con.contype = 'c'
          and pg_get_constraintdef(con.oid) ilike '%status%'
    loop
        execute format('alter table public.orders drop constraint %I', c.conname);
    end loop;
end $$;

-- ---------------------------------------------------------------------------
-- 2. Per-transition timestamps + escrow deadlines
-- ---------------------------------------------------------------------------
alter table public.orders add column if not exists paid_at timestamptz;
alter table public.orders add column if not exists shipped_at timestamptz;
alter table public.orders add column if not exists delivered_at timestamptz;
alter table public.orders add column if not exists released_at timestamptz;
alter table public.orders add column if not exists cancelled_at timestamptz;
alter table public.orders add column if not exists refunded_at timestamptz;
alter table public.orders add column if not exists disputed_at timestamptz;

-- D3: seller must mark shipped before ship_by_at, else auto-cancel.
alter table public.orders add column if not exists ship_by_at timestamptz;
-- D2: funds auto-release at auto_release_at unless the buyer acts first.
alter table public.orders add column if not exists auto_release_at timestamptz;

-- ---------------------------------------------------------------------------
-- 3. Peer sellers and peer items
-- Catalog sales point at products/business_accounts; peer sales point at
-- listings/auth.users. Exactly one item source, at least one seller target.
-- ---------------------------------------------------------------------------
alter table public.orders alter column product_id drop not null;
alter table public.orders alter column seller_id drop not null;

alter table public.orders add column if not exists listing_id uuid
    references public.listings on delete restrict;
alter table public.orders add column if not exists seller_user_id uuid
    references auth.users on delete restrict;

alter table public.orders drop constraint if exists orders_item_source_check;
alter table public.orders add constraint orders_item_source_check
    check (
        (product_id is not null and listing_id is null)
        or (product_id is null and listing_id is not null)
    );

alter table public.orders drop constraint if exists orders_seller_target_check;
alter table public.orders add constraint orders_seller_target_check
    check (seller_id is not null or seller_user_id is not null);

-- ---------------------------------------------------------------------------
-- 4. payments — one row per provider charge, keyed by reference
-- The unique reference is what makes webhook processing exactly-once.
-- ---------------------------------------------------------------------------
create table if not exists public.payments (
    id uuid not null default gen_random_uuid() primary key,
    provider text not null default 'paystack',
    reference text not null unique,
    buyer_id uuid not null references auth.users on delete cascade,
    amount_minor integer not null check (amount_minor >= 0),
    currency text not null default 'KES',
    status text not null default 'pending'
        check (status in ('pending', 'success', 'failed', 'abandoned', 'reversed')),
    channel text check (channel is null or channel in ('mpesa', 'card')),
    raw_payload jsonb,
    paid_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now()
);

create index if not exists idx_payments_buyer_id
    on public.payments (buyer_id);
create index if not exists idx_payments_status
    on public.payments (status);
create index if not exists idx_payments_created_at
    on public.payments (created_at desc);

drop trigger if exists update_payments_updated_at on public.payments;
create trigger update_payments_updated_at
    before update on public.payments
    for each row execute procedure public.update_updated_at_column();

-- One payment funds many order rows. Single-seller v1 (D9) keeps this 1:1 in
-- practice, but the FK means multi-seller splitting needs no new migration.
alter table public.orders add column if not exists payment_id uuid
    references public.payments on delete restrict;

-- ---------------------------------------------------------------------------
-- 5. processed_webhook_events — DB-backed idempotency (C-CORE-3)
-- Replaces the in-memory store so a restart cannot double-process an event.
-- ---------------------------------------------------------------------------
create table if not exists public.processed_webhook_events (
    key text not null primary key,
    provider text not null,
    reference text not null,
    event_type text,
    payload jsonb,
    processed_at timestamptz not null default now()
);

create index if not exists idx_processed_webhook_events_reference
    on public.processed_webhook_events (provider, reference);

-- ---------------------------------------------------------------------------
-- 6. RLS
-- ---------------------------------------------------------------------------
alter table public.payments enable row level security;

drop policy if exists "Buyers can view their payments" on public.payments;
create policy "Buyers can view their payments"
    on public.payments for select
    using (auth.uid() = buyer_id);

-- Webhook bookkeeping is service-role only: RLS on, no policies.
alter table public.processed_webhook_events enable row level security;

-- Catalog sellers already have a policy from 001; peer sellers need their own.
drop policy if exists "Peer sellers can view their orders" on public.orders;
create policy "Peer sellers can view their orders"
    on public.orders for select
    using (auth.uid() = seller_user_id);

-- ---------------------------------------------------------------------------
-- 7. Indexes for escrow reads and timer scans
-- ---------------------------------------------------------------------------
create index if not exists idx_orders_payment_id
    on public.orders (payment_id);
create index if not exists idx_orders_seller_user_id
    on public.orders (seller_user_id);
create index if not exists idx_orders_listing_id
    on public.orders (listing_id);

-- Partial indexes: timer jobs only ever scan rows with a pending deadline.
create index if not exists idx_orders_ship_by_at_pending
    on public.orders (ship_by_at)
    where ship_by_at is not null and shipped_at is null;
create index if not exists idx_orders_auto_release_at_pending
    on public.orders (auto_release_at)
    where auto_release_at is not null and released_at is null;

-- ---------------------------------------------------------------------------
-- 8. Backfill existing rows
-- Existing orders are only created after a successful charge, so legacy
-- 'pending'/'confirmed' rows are really 'paid'.
-- ---------------------------------------------------------------------------
insert into public.payments (
    provider,
    reference,
    buyer_id,
    amount_minor,
    currency,
    status,
    paid_at,
    created_at
)
select
    'paystack',
    o.stripe_payment_intent_id,
    o.buyer_id,
    -- Approximate: pre-012 rows never stored the charged total, only line items.
    (round(sum(o.total_price) * 100))::integer,
    'KES',
    'success',
    min(o.created_at),
    min(o.created_at)
from public.orders o
where o.stripe_payment_intent_id is not null
  and o.stripe_payment_intent_id <> ''
group by o.stripe_payment_intent_id, o.buyer_id
on conflict (reference) do nothing;

update public.orders o
set payment_id = p.id
from public.payments p
where p.reference = o.stripe_payment_intent_id
  and o.payment_id is null;

update public.orders
set
    status = 'paid',
    paid_at = coalesce(paid_at, created_at)
where status in ('pending', 'confirmed');

update public.orders
set paid_at = coalesce(paid_at, created_at)
where status in ('shipped', 'delivered')
  and paid_at is null;

-- Backfilled rows intentionally keep ship_by_at / auto_release_at null so the
-- timer jobs never treat pre-escrow history as overdue.

-- ---------------------------------------------------------------------------
-- 9. New status constraint + default (added last, after backfill)
-- ---------------------------------------------------------------------------
alter table public.orders drop constraint if exists orders_status_check;
alter table public.orders add constraint orders_status_check
    check (status in (
        'pending_payment',
        'paid',
        'in_escrow',
        'shipped',
        'delivered',
        'released',
        'completed',
        'cancelled',
        'refunded',
        'disputed'
    ));

alter table public.orders alter column status set default 'pending_payment';

create index if not exists idx_orders_status_paid_at
    on public.orders (status, paid_at desc);

-- ---------------------------------------------------------------------------
-- 10. RPC: create_escrow_order
-- Supersedes create_order_with_stock_check. Handles catalog products (stock
-- locked and decremented) and peer listings (single item, flipped to Sold).
-- ---------------------------------------------------------------------------
create or replace function public.create_escrow_order(
    p_buyer_id uuid,
    p_payment_id uuid,
    p_payment_reference text,
    p_product_id uuid,
    p_listing_id uuid,
    p_quantity integer,
    p_shipping_address jsonb,
    p_ship_by_days integer
)
returns jsonb as $$
declare
    v_product record;
    v_listing record;
    v_order_id uuid;
    v_seller_id uuid;
    v_seller_user_id uuid;
    v_price_per_unit decimal(10, 2);
    v_total_price decimal(10, 2);
    v_quantity integer;
    v_ship_by_days integer;
begin
    if (p_product_id is null) = (p_listing_id is null) then
        return jsonb_build_object(
            'success', false,
            'error', 'Exactly one of product_id or listing_id is required'
        );
    end if;

    v_ship_by_days := greatest(coalesce(p_ship_by_days, 3), 1);

    if p_product_id is not null then
        select id, business_id, price, stock_quantity
        into v_product
        from public.products
        where id = p_product_id
        for update;

        if not found then
            return jsonb_build_object('success', false, 'error', 'Product not found');
        end if;

        v_quantity := greatest(coalesce(p_quantity, 1), 1);

        if v_product.stock_quantity < v_quantity then
            return jsonb_build_object(
                'success', false,
                'error', 'Insufficient stock',
                'available_stock', v_product.stock_quantity
            );
        end if;

        v_seller_id := v_product.business_id;
        v_price_per_unit := v_product.price;
    else
        select id, seller_id, price, status
        into v_listing
        from public.listings
        where id = p_listing_id
        for update;

        if not found then
            return jsonb_build_object('success', false, 'error', 'Listing not found');
        end if;

        if v_listing.status <> 'Active' then
            return jsonb_build_object('success', false, 'error', 'Listing is no longer available');
        end if;

        if v_listing.seller_id = p_buyer_id then
            return jsonb_build_object('success', false, 'error', 'Cannot buy your own listing');
        end if;

        -- A listing is a single physical item.
        v_quantity := 1;
        v_seller_user_id := v_listing.seller_id;
        v_price_per_unit := v_listing.price;
    end if;

    v_total_price := v_price_per_unit * v_quantity;

    insert into public.orders (
        buyer_id,
        seller_id,
        seller_user_id,
        product_id,
        listing_id,
        quantity,
        price_per_unit,
        total_price,
        shipping_address,
        stripe_payment_intent_id,
        payment_id,
        status,
        paid_at,
        ship_by_at
    ) values (
        p_buyer_id,
        v_seller_id,
        v_seller_user_id,
        p_product_id,
        p_listing_id,
        v_quantity,
        v_price_per_unit,
        v_total_price,
        p_shipping_address,
        p_payment_reference,
        p_payment_id,
        'paid',
        now(),
        now() + make_interval(days => v_ship_by_days)
    )
    returning id into v_order_id;

    if p_product_id is not null then
        update public.products
        set stock_quantity = stock_quantity - v_quantity
        where id = p_product_id;
    else
        update public.listings
        set status = 'Sold', updated_at = now()
        where id = p_listing_id;
    end if;

    return jsonb_build_object(
        'success', true,
        'order_id', v_order_id,
        'quantity', v_quantity,
        'total_price', v_total_price
    );
exception
    when others then
        return jsonb_build_object('success', false, 'error', sqlerrm);
end;
$$ language plpgsql security definer;

grant execute on function public.create_escrow_order to authenticated;

-- ---------------------------------------------------------------------------
-- 11. Keep the superseded RPC valid under the new status constraint
-- It inserted 'pending', which the constraint in step 9 now rejects. Anything
-- still calling it gets an escrow-valid row instead of a constraint violation.
-- ---------------------------------------------------------------------------
create or replace function public.create_order_with_stock_check(
    p_buyer_id uuid,
    p_product_id uuid,
    p_quantity integer,
    p_shipping_address jsonb,
    p_stripe_payment_intent_id text
)
returns jsonb as $$
begin
    return public.create_escrow_order(
        p_buyer_id := p_buyer_id,
        p_payment_id := null,
        p_payment_reference := p_stripe_payment_intent_id,
        p_product_id := p_product_id,
        p_listing_id := null,
        p_quantity := p_quantity,
        p_shipping_address := p_shipping_address,
        p_ship_by_days := 3
    );
end;
$$ language plpgsql security definer;

grant execute on function public.create_order_with_stock_check to authenticated;

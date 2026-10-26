/**
 * Verifies migration 012_escrow_orders.sql against the connected database.
 *
 * Structural checks are read-only. Behavioural checks run inside a transaction
 * that is always rolled back, so this leaves no rows behind and is safe to run
 * against dev repeatedly.
 *
 *   node scripts/verify-escrow-migration.mjs
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });

const connectionString = process.env.SUPABASE_DB_URL;
if (!connectionString) {
    console.error('verify-escrow-migration failed: SUPABASE_DB_URL is not set in .env.local');
    process.exit(1);
}

const EXPECTED_STATUSES = [
    'pending_payment',
    'paid',
    'in_escrow',
    'shipped',
    'delivered',
    'released',
    'completed',
    'cancelled',
    'refunded',
    'disputed',
];

const EXPECTED_ORDER_COLUMNS = [
    'paid_at',
    'shipped_at',
    'delivered_at',
    'released_at',
    'cancelled_at',
    'refunded_at',
    'disputed_at',
    'ship_by_at',
    'auto_release_at',
    'payment_id',
    'listing_id',
    'seller_user_id',
];

const EXPECTED_PAYMENT_COLUMNS = [
    'id',
    'provider',
    'reference',
    'buyer_id',
    'amount_minor',
    'currency',
    'status',
    'channel',
    'raw_payload',
    'paid_at',
    'created_at',
    'updated_at',
];

const client = new pg.Client({ connectionString, ssl: { rejectUnauthorized: false } });

const results = [];

const record = (status, name, detail) => {
    results.push({ status, name, detail });
    const icon = status === 'pass' ? '  ok  ' : status === 'skip' ? ' skip ' : ' FAIL ';
    console.log(`${icon} ${name}${detail ? ` — ${detail}` : ''}`);
};

const check = async (name, fn) => {
    try {
        const detail = await fn();
        record('pass', name, detail || '');
    } catch (error) {
        record('fail', name, error.message);
    }
};

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const one = async (sql, params = []) => {
    const { rows } = await client.query(sql, params);
    return rows[0];
};

const all = async (sql, params = []) => {
    const { rows } = await client.query(sql, params);
    return rows;
};

async function structuralChecks() {
    console.log('\nStructure\n---------');

    await check('orders has all escrow columns', async () => {
        const rows = await all(
            `select column_name, is_nullable
             from information_schema.columns
             where table_schema = 'public' and table_name = 'orders'`
        );
        const present = new Set(rows.map((r) => r.column_name));
        const missing = EXPECTED_ORDER_COLUMNS.filter((c) => !present.has(c));
        assert(missing.length === 0, `missing: ${missing.join(', ')}`);
        return `${EXPECTED_ORDER_COLUMNS.length} columns present`;
    });

    await check('orders.product_id and seller_id are nullable', async () => {
        const rows = await all(
            `select column_name, is_nullable
             from information_schema.columns
             where table_schema = 'public' and table_name = 'orders'
               and column_name in ('product_id', 'seller_id')`
        );
        for (const row of rows) {
            assert(row.is_nullable === 'YES', `${row.column_name} is still NOT NULL`);
        }
        assert(rows.length === 2, 'expected both columns to exist');
        return 'both nullable';
    });

    await check('orders_status_check allows exactly the 10 escrow states', async () => {
        const row = await one(
            `select pg_get_constraintdef(con.oid) as def
             from pg_constraint con
             join pg_class rel on rel.oid = con.conrelid
             join pg_namespace nsp on nsp.oid = rel.relnamespace
             where nsp.nspname = 'public' and rel.relname = 'orders'
               and con.conname = 'orders_status_check'`
        );
        assert(row, 'constraint orders_status_check not found');
        for (const status of EXPECTED_STATUSES) {
            assert(row.def.includes(`'${status}'`), `missing status ${status}`);
        }
        for (const legacy of ['pending', 'confirmed']) {
            const legacyPattern = new RegExp(`'${legacy}'::`);
            assert(!legacyPattern.test(row.def), `legacy status ${legacy} still allowed`);
        }
        return '10 states, no legacy values';
    });

    await check('orders.status defaults to pending_payment', async () => {
        const row = await one(
            `select column_default
             from information_schema.columns
             where table_schema = 'public' and table_name = 'orders' and column_name = 'status'`
        );
        assert(
            row && String(row.column_default).includes('pending_payment'),
            `default is ${row?.column_default}`
        );
        return 'pending_payment';
    });

    await check('item-source and seller-target constraints exist', async () => {
        const rows = await all(
            `select con.conname
             from pg_constraint con
             join pg_class rel on rel.oid = con.conrelid
             join pg_namespace nsp on nsp.oid = rel.relnamespace
             where nsp.nspname = 'public' and rel.relname = 'orders'
               and con.conname in ('orders_item_source_check', 'orders_seller_target_check')`
        );
        assert(rows.length === 2, `found ${rows.length} of 2`);
        return 'both present';
    });

    await check('payments table has the expected shape', async () => {
        const rows = await all(
            `select column_name
             from information_schema.columns
             where table_schema = 'public' and table_name = 'payments'`
        );
        assert(rows.length > 0, 'payments table not found');
        const present = new Set(rows.map((r) => r.column_name));
        const missing = EXPECTED_PAYMENT_COLUMNS.filter((c) => !present.has(c));
        assert(missing.length === 0, `missing: ${missing.join(', ')}`);
        return `${EXPECTED_PAYMENT_COLUMNS.length} columns present`;
    });

    await check('payments.reference is unique', async () => {
        const row = await one(
            `select con.conname
             from pg_constraint con
             join pg_class rel on rel.oid = con.conrelid
             join pg_namespace nsp on nsp.oid = rel.relnamespace
             where nsp.nspname = 'public' and rel.relname = 'payments'
               and con.contype = 'u'
               and pg_get_constraintdef(con.oid) ilike '%(reference)%'`
        );
        assert(row, 'no unique constraint on payments.reference');
        return row.conname;
    });

    await check('payments has an updated_at trigger', async () => {
        const row = await one(
            `select tgname from pg_trigger
             where tgrelid = 'public.payments'::regclass and not tgisinternal`
        );
        assert(row, 'no trigger on payments');
        return row.tgname;
    });

    await check('processed_webhook_events exists with text primary key', async () => {
        const row = await one(
            `select pg_get_constraintdef(con.oid) as def
             from pg_constraint con
             where con.conrelid = 'public.processed_webhook_events'::regclass
               and con.contype = 'p'`
        );
        assert(row, 'no primary key found');
        assert(row.def.includes('key'), `primary key is ${row.def}`);
        return row.def;
    });

    await check('RLS is enabled on payments and processed_webhook_events', async () => {
        const rows = await all(
            `select relname, relrowsecurity
             from pg_class
             where oid in ('public.payments'::regclass, 'public.processed_webhook_events'::regclass)`
        );
        for (const row of rows) {
            assert(row.relrowsecurity, `RLS not enabled on ${row.relname}`);
        }
        return 'both enabled';
    });

    await check('processed_webhook_events has no policies (service-role only)', async () => {
        const rows = await all(
            `select policyname from pg_policies
             where schemaname = 'public' and tablename = 'processed_webhook_events'`
        );
        assert(rows.length === 0, `found ${rows.length} policies`);
        return '0 policies';
    });

    await check('buyer + peer-seller policies exist', async () => {
        const rows = await all(
            `select tablename, policyname from pg_policies
             where schemaname = 'public'
               and policyname in ('Buyers can view their payments', 'Peer sellers can view their orders')`
        );
        assert(rows.length === 2, `found ${rows.length} of 2`);
        return 'both present';
    });

    await check('escrow indexes exist', async () => {
        const expected = [
            'idx_orders_payment_id',
            'idx_orders_seller_user_id',
            'idx_orders_listing_id',
            'idx_orders_ship_by_at_pending',
            'idx_orders_auto_release_at_pending',
            'idx_payments_buyer_id',
        ];
        const rows = await all(
            `select indexname from pg_indexes where schemaname = 'public' and indexname = any($1)`,
            [expected]
        );
        const present = new Set(rows.map((r) => r.indexname));
        const missing = expected.filter((i) => !present.has(i));
        assert(missing.length === 0, `missing: ${missing.join(', ')}`);
        return `${expected.length} indexes`;
    });

    await check('create_escrow_order and legacy RPC both exist', async () => {
        const rows = await all(
            `select proname from pg_proc p
             join pg_namespace n on n.oid = p.pronamespace
             where n.nspname = 'public'
               and proname in ('create_escrow_order', 'create_order_with_stock_check')`
        );
        const names = new Set(rows.map((r) => r.proname));
        assert(names.has('create_escrow_order'), 'create_escrow_order missing');
        assert(names.has('create_order_with_stock_check'), 'legacy RPC missing');
        return 'both present';
    });
}

async function backfillChecks() {
    console.log('\nBackfill\n--------');

    await check('no orders left on legacy statuses', async () => {
        const row = await one(
            `select count(*)::int as n from public.orders where status in ('pending', 'confirmed')`
        );
        assert(row.n === 0, `${row.n} rows still legacy`);
        return '0 legacy rows';
    });

    await check('every order with a reference has a payment_id', async () => {
        const row = await one(
            `select count(*)::int as n from public.orders
             where coalesce(stripe_payment_intent_id, '') <> '' and payment_id is null`
        );
        assert(row.n === 0, `${row.n} orders missing payment_id`);
        return 'all linked';
    });

    await check('payments row count matches distinct order references', async () => {
        const row = await one(
            `select
                (select count(distinct stripe_payment_intent_id) from public.orders
                  where coalesce(stripe_payment_intent_id, '') <> '')::int as refs,
                (select count(*) from public.payments)::int as payments`
        );
        assert(
            row.payments >= row.refs,
            `${row.payments} payments for ${row.refs} distinct references`
        );
        return `${row.payments} payments / ${row.refs} references`;
    });

    await check('paid orders have paid_at set', async () => {
        const row = await one(
            `select count(*)::int as n from public.orders
             where status in ('paid', 'shipped', 'delivered') and paid_at is null`
        );
        assert(row.n === 0, `${row.n} paid orders missing paid_at`);
        return 'all set';
    });

    await check('backfilled history has no escrow deadlines', async () => {
        const row = await one(
            `select count(*)::int as n from public.orders
             where payment_id is not null and auto_release_at is not null and released_at is null
               and shipped_at is null`
        );
        assert(row.n === 0, `${row.n} unshipped orders already have auto_release_at`);
        return 'no premature deadlines';
    });
}

async function behaviouralChecks() {
    console.log('\nBehaviour (transaction, rolled back)\n------------------------------------');

    await client.query('begin');

    try {
        const buyerId = (await one(`select gen_random_uuid() as id`)).id;
        const sellerId = (await one(`select gen_random_uuid() as id`)).id;

        let fixturesReady = true;
        try {
            await client.query(
                `insert into auth.users (id, email) values ($1, $2), ($3, $4)`,
                [buyerId, `verify-buyer-${buyerId}@example.com`, sellerId, `verify-seller-${sellerId}@example.com`]
            );
        } catch (error) {
            fixturesReady = false;
            record('skip', 'behavioural fixtures', `cannot insert auth.users: ${error.message}`);
        }

        if (!fixturesReady) {
            return;
        }

        const paymentId = (
            await one(
                `insert into public.payments (provider, reference, buyer_id, amount_minor, status)
                 values ('paystack', $1, $2, 100000, 'success')
                 returning id`,
                [`verify_ref_${Date.now()}`, buyerId]
            )
        ).id;

        const listingId = (
            await one(
                `insert into public.listings (seller_id, title, price, image_url, status)
                 values ($1, 'Verify Jacket', 2500, 'https://example.com/j.jpg', 'Active')
                 returning id`,
                [sellerId]
            )
        ).id;

        const callRpc = async (overrides = {}) => {
            const args = {
                buyer: buyerId,
                payment: paymentId,
                reference: 'verify_ref',
                product: null,
                listing: null,
                quantity: 1,
                shipBy: 3,
                ...overrides,
            };
            const row = await one(
                `select public.create_escrow_order(
                    p_buyer_id => $1,
                    p_payment_id => $2,
                    p_payment_reference => $3,
                    p_product_id => $4,
                    p_listing_id => $5,
                    p_quantity => $6,
                    p_shipping_address => '{"name":"V","street":"1","city":"Nairobi","postal":"00100","phone":"+254700000000"}'::jsonb,
                    p_ship_by_days => $7
                 ) as result`,
                [
                    args.buyer,
                    args.payment,
                    args.reference,
                    args.product,
                    args.listing,
                    args.quantity,
                    args.shipBy,
                ]
            );
            return row.result;
        };

        await check('peer listing order is created and marked paid', async () => {
            const result = await callRpc({ listing: listingId });
            assert(result.success, `RPC failed: ${result.error}`);

            const order = await one(`select * from public.orders where id = $1`, [result.order_id]);
            assert(order.status === 'paid', `status is ${order.status}`);
            assert(order.product_id === null, 'product_id should be null for peer orders');
            assert(order.listing_id === listingId, 'listing_id not set');
            assert(order.seller_user_id === sellerId, 'seller_user_id not set');
            assert(order.seller_id === null, 'seller_id should be null for peer orders');
            assert(order.paid_at !== null, 'paid_at not set');
            assert(order.ship_by_at !== null, 'ship_by_at not set');
            assert(Number(order.quantity) === 1, `quantity is ${order.quantity}`);
            assert(Number(order.price_per_unit) === 2500, `price is ${order.price_per_unit}`);
            return `order ${result.order_id.slice(0, 8)} paid`;
        });

        await check('ship_by_at honours p_ship_by_days', async () => {
            const row = await one(
                `select round(extract(epoch from (ship_by_at - paid_at)) / 86400) as days
                 from public.orders where listing_id = $1`,
                [listingId]
            );
            assert(Number(row.days) === 3, `expected 3 days, got ${row.days}`);
            return '3 days';
        });

        await check('listing flips to Sold', async () => {
            const row = await one(`select status from public.listings where id = $1`, [listingId]);
            assert(row.status === 'Sold', `listing status is ${row.status}`);
            return 'Sold';
        });

        // RLS is only meaningful under a non-bypass role. The BFF uses the
        // service role and never hits these policies — these checks exist so a
        // broken policy cannot ship unnoticed.
        await check('buyer can select their own payment under RLS', async () => {
            await client.query('savepoint rls_buyer_payment');
            try {
                await client.query(`select set_config('request.jwt.claims', $1, true)`, [
                    JSON.stringify({ sub: buyerId, role: 'authenticated' }),
                ]);
                await client.query('set local role authenticated');
                const row = await one(
                    `select count(*)::int as n from public.payments where id = $1`,
                    [paymentId]
                );
                assert(row.n === 1, `buyer saw ${row.n} payments, expected 1`);
                return 'buyer sees own payment';
            } finally {
                await client.query('rollback to savepoint rls_buyer_payment');
            }
        });

        await check('non-buyer cannot select another payment under RLS', async () => {
            await client.query('savepoint rls_stranger_payment');
            try {
                await client.query(`select set_config('request.jwt.claims', $1, true)`, [
                    JSON.stringify({ sub: sellerId, role: 'authenticated' }),
                ]);
                await client.query('set local role authenticated');
                const row = await one(
                    `select count(*)::int as n from public.payments where id = $1`,
                    [paymentId]
                );
                assert(row.n === 0, `stranger saw ${row.n} payments, expected 0`);
                return 'stranger blocked';
            } finally {
                await client.query('rollback to savepoint rls_stranger_payment');
            }
        });

        await check('peer seller can select their order under RLS', async () => {
            await client.query('savepoint rls_peer_seller');
            try {
                await client.query(`select set_config('request.jwt.claims', $1, true)`, [
                    JSON.stringify({ sub: sellerId, role: 'authenticated' }),
                ]);
                await client.query('set local role authenticated');
                const row = await one(
                    `select count(*)::int as n from public.orders
                     where listing_id = $1 and seller_user_id = $2`,
                    [listingId, sellerId]
                );
                assert(row.n === 1, `peer seller saw ${row.n} orders, expected 1`);
                return 'peer seller sees own order';
            } finally {
                await client.query('rollback to savepoint rls_peer_seller');
            }
        });

        await check('a Sold listing cannot be bought again', async () => {
            const result = await callRpc({ listing: listingId });
            assert(!result.success, 'RPC unexpectedly succeeded');
            assert(
                String(result.error).includes('no longer available'),
                `unexpected error: ${result.error}`
            );
            return result.error;
        });

        await check('buying your own listing is rejected', async () => {
            const ownListing = (
                await one(
                    `insert into public.listings (seller_id, title, price, image_url, status)
                     values ($1, 'Own Item', 100, 'https://example.com/o.jpg', 'Active')
                     returning id`,
                    [buyerId]
                )
            ).id;
            const result = await callRpc({ listing: ownListing });
            assert(!result.success, 'RPC unexpectedly succeeded');
            assert(
                String(result.error).includes('Cannot buy your own listing'),
                `unexpected error: ${result.error}`
            );
            return result.error;
        });

        await check('supplying both product and listing is rejected', async () => {
            const product = await one(
                `select id from public.products where is_active = true limit 1`
            );
            const productId = product?.id ?? (await one(`select gen_random_uuid() as id`)).id;
            const result = await callRpc({ listing: listingId, product: productId });
            assert(!result.success, 'RPC unexpectedly succeeded');
            assert(
                String(result.error).includes('Exactly one of'),
                `unexpected error: ${result.error}`
            );
            return result.error;
        });

        await check('supplying neither product nor listing is rejected', async () => {
            const result = await callRpc({});
            assert(!result.success, 'RPC unexpectedly succeeded');
            assert(
                String(result.error).includes('Exactly one of'),
                `unexpected error: ${result.error}`
            );
            return result.error;
        });

        await check('orders_item_source_check rejects a direct bad insert', async () => {
            await client.query('savepoint bad_insert');
            try {
                await client.query(
                    `insert into public.orders
                        (buyer_id, seller_user_id, product_id, listing_id, quantity,
                         price_per_unit, total_price, shipping_address, stripe_payment_intent_id, status)
                     values ($1, $2, null, null, 1, 10, 10, '{}'::jsonb, 'verify_bad', 'paid')`,
                    [buyerId, sellerId]
                );
                await client.query('rollback to savepoint bad_insert');
                throw new Error('insert with neither product nor listing was allowed');
            } catch (error) {
                await client.query('rollback to savepoint bad_insert');
                assert(
                    error.message.includes('orders_item_source_check'),
                    `unexpected error: ${error.message}`
                );
                return 'constraint enforced';
            }
        });

        await check('orders_status_check rejects an invalid status', async () => {
            await client.query('savepoint bad_status');
            try {
                await client.query(
                    `insert into public.orders
                        (buyer_id, seller_user_id, listing_id, quantity, price_per_unit,
                         total_price, shipping_address, stripe_payment_intent_id, status)
                     values ($1, $2, $3, 1, 10, 10, '{}'::jsonb, 'verify_bad_status', 'pending')`,
                    [buyerId, sellerId, listingId]
                );
                await client.query('rollback to savepoint bad_status');
                throw new Error("legacy status 'pending' was allowed");
            } catch (error) {
                await client.query('rollback to savepoint bad_status');
                assert(
                    error.message.includes('orders_status_check'),
                    `unexpected error: ${error.message}`
                );
                return 'legacy status rejected';
            }
        });

        const product = await one(
            `select id, stock_quantity from public.products
             where is_active = true and stock_quantity > 0 limit 1`
        );

        if (!product) {
            record('skip', 'catalog order decrements stock', 'no in-stock product in this database');
        } else {
            await check('catalog order decrements stock and sets business seller', async () => {
                const before = Number(product.stock_quantity);
                const result = await callRpc({ product: product.id, quantity: 1 });
                assert(result.success, `RPC failed: ${result.error}`);

                const order = await one(`select * from public.orders where id = $1`, [
                    result.order_id,
                ]);
                assert(order.listing_id === null, 'listing_id should be null for catalog orders');
                assert(order.seller_id !== null, 'seller_id not set from product business_id');
                assert(order.status === 'paid', `status is ${order.status}`);

                const after = await one(`select stock_quantity from public.products where id = $1`, [
                    product.id,
                ]);
                assert(
                    Number(after.stock_quantity) === before - 1,
                    `stock went ${before} -> ${after.stock_quantity}`
                );
                return `stock ${before} -> ${after.stock_quantity}`;
            });
        }

        await check('legacy RPC delegates and no longer writes pending', async () => {
            const listing = await one(
                `select id from public.products where is_active = true and stock_quantity > 0 limit 1`
            );
            if (!listing) {
                return 'skipped, no in-stock product';
            }
            const row = await one(
                `select public.create_order_with_stock_check(
                    p_buyer_id => $1,
                    p_product_id => $2,
                    p_quantity => 1,
                    p_shipping_address => '{}'::jsonb,
                    p_stripe_payment_intent_id => 'verify_legacy'
                 ) as result`,
                [buyerId, listing.id]
            );
            assert(row.result.success, `legacy RPC failed: ${row.result.error}`);
            const order = await one(`select status from public.orders where id = $1`, [
                row.result.order_id,
            ]);
            assert(order.status === 'paid', `status is ${order.status}`);
            return 'delegates to create_escrow_order';
        });
    } finally {
        await client.query('rollback');
        console.log('\n(transaction rolled back — no rows persisted)');
    }
}

/**
 * The BFF reads orders through PostgREST, which resolves embedded resources by
 * foreign key. A valid schema can still fail here if an embed alias is wrong,
 * and that surfaces as a broken GET /v1/api/orders rather than a SQL error.
 */
async function apiSurfaceChecks() {
    console.log('\nAPI surface (PostgREST)\n-----------------------');

    const url = process.env.SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        record('skip', 'ORDER_SELECT embed resolves', 'SUPABASE_URL or service role key missing');
        return;
    }

    const { createClient } = await import('@supabase/supabase-js');
    const supabase = createClient(url, serviceKey, { auth: { persistSession: false } });

    await check('ORDER_SELECT embed resolves through PostgREST', async () => {
        const select =
            '*, product:products(*), seller:business_accounts(*), listing:listings(*), payment:payments(*)';
        const { error } = await supabase.from('orders').select(select).limit(1);
        assert(!error, error?.message || 'unknown PostgREST error');
        return 'orders + product + seller + listing + payment';
    });

    await check('payments and processed_webhook_events are readable by service role', async () => {
        for (const table of ['payments', 'processed_webhook_events']) {
            const { error } = await supabase.from(table).select('*').limit(1);
            assert(!error, `${table}: ${error?.message}`);
        }
        return 'both readable';
    });
}

async function main() {
    await client.connect();

    try {
        await structuralChecks();
        await backfillChecks();
        await behaviouralChecks();
    } finally {
        await client.end();
    }

    await apiSurfaceChecks();

    const failed = results.filter((r) => r.status === 'fail');
    const skipped = results.filter((r) => r.status === 'skip');
    const passed = results.filter((r) => r.status === 'pass');

    console.log(
        `\nSummary: ${passed.length} passed, ${failed.length} failed, ${skipped.length} skipped`
    );

    if (failed.length > 0) {
        console.error('\nFailures:');
        for (const failure of failed) {
            console.error(`  - ${failure.name}: ${failure.detail}`);
        }
        process.exit(1);
    }
}

main().catch(async (error) => {
    console.error('\nverify-escrow-migration crashed:', error.message);
    process.exit(1);
});

/**
 * End-to-end smoke of POST/GET /v1/api/orders against a running BFF.
 *
 * Unlike verify:escrow (which rolls back), this writes real rows — then deletes
 * the order(s) and payment it created (and restores stock / listing status).
 *
 * Requires:
 *   - npm run dev:api already running
 *   - .env.local with SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY + SUPABASE_ANON_KEY
 *   - seeded buyer (dev+buyer@luku.app)
 *
 * Modes:
 *   npm run verify:order-api              # catalog productId (default)
 *   npm run verify:order-api -- --peer    # peer listingId
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });

const API_BASE = process.env.ORDER_API_BASE || `http://localhost:${process.env.PORT || 3001}`;
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL || 'dev+buyer@luku.app';
const BUYER_PASSWORD = process.env.SMOKE_BUYER_PASSWORD || 'LukuDev2026!';
/** Seeded peer seller from `npm run db:seed` — used when no foreign Active listing exists. */
const PEER_SELLER_ID =
    process.env.SMOKE_PEER_SELLER_ID || 'f0000001-0000-4000-8000-000000000002';
const PEER_MODE =
    process.argv.includes('--peer') || process.env.SMOKE_ORDER_MODE === 'peer';

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey) {
    console.error('verify:order-api failed: SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY required');
    process.exit(1);
}

if (!anonKey) {
    console.error('verify:order-api failed: SUPABASE_ANON_KEY required to sign in the smoke buyer');
    process.exit(1);
}

const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const api = async (method, pathname, { token, body } = {}) => {
    const response = await fetch(`${API_BASE}${pathname}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: body ? JSON.stringify(body) : undefined,
    });
    const json = await response.json().catch(() => ({}));
    return { status: response.status, json };
};

const reference = `smoke_${PEER_MODE ? 'peer' : 'catalog'}_${Date.now()}`;
let paymentId = null;
let orderRowIds = [];
let productId = null;
let stockBefore = null;
let listingId = null;
let listingStatusBefore = null;
/** True when the smoke script inserted the listing itself (delete on cleanup). */
let listingCreatedBySmoke = false;

const cleanup = async () => {
    if (orderRowIds.length > 0) {
        const { error } = await admin.from('orders').delete().in('id', orderRowIds);
        if (error) {
            console.warn(`cleanup orders failed: ${error.message}`);
        } else {
            console.log(`cleaned up ${orderRowIds.length} order row(s)`);
        }
    }
    if (paymentId) {
        const { error } = await admin.from('payments').delete().eq('id', paymentId);
        if (error) {
            console.warn(`cleanup payment failed: ${error.message}`);
        } else {
            console.log(`cleaned up payment ${paymentId}`);
        }
    }
    if (productId != null && stockBefore != null) {
        const { error } = await admin
            .from('products')
            .update({ stock_quantity: stockBefore })
            .eq('id', productId);
        if (error) {
            console.warn(`restore stock failed: ${error.message}`);
        } else {
            console.log(`restored product stock to ${stockBefore}`);
        }
    }
    if (listingId != null) {
        if (listingCreatedBySmoke) {
            const { error } = await admin.from('listings').delete().eq('id', listingId);
            if (error) {
                console.warn(`cleanup listing failed: ${error.message}`);
            } else {
                console.log(`deleted smoke listing ${listingId}`);
            }
        } else if (listingStatusBefore != null) {
            const { error } = await admin
                .from('listings')
                .update({ status: listingStatusBefore })
                .eq('id', listingId);
            if (error) {
                console.warn(`restore listing status failed: ${error.message}`);
            } else {
                console.log(`restored listing ${listingId} to ${listingStatusBefore}`);
            }
        }
    }
};

async function resolveItem(buyerId) {
    if (PEER_MODE) {
        let listing = null;
        const { data: existing, error } = await admin
            .from('listings')
            .select('id, seller_id, status, title, price')
            .eq('status', 'Active')
            .neq('seller_id', buyerId)
            .limit(1)
            .maybeSingle();

        if (error) {
            throw new Error(`listing lookup failed: ${error.message}`);
        }

        if (existing?.id) {
            listing = existing;
            listingStatusBefore = existing.status;
        } else {
            // Dev DBs often only have listings owned by the buyer; create a
            // throwaway Active listing under the seeded peer seller.
            const { data: created, error: createError } = await admin
                .from('listings')
                .insert({
                    seller_id: PEER_SELLER_ID,
                    title: `Smoke Peer Jacket ${Date.now()}`,
                    price: 2500,
                    image_url: 'https://example.com/smoke-peer.jpg',
                    status: 'Active',
                })
                .select('id, seller_id, status, title, price')
                .single();

            if (createError) {
                throw new Error(
                    `could not create peer listing fixture: ${createError.message}. Ensure seeded seller ${PEER_SELLER_ID} exists (npm run db:seed).`
                );
            }
            listing = created;
            listingCreatedBySmoke = true;
            console.log(`created temporary peer listing under seller ${PEER_SELLER_ID}`);
        }

        listingId = listing.id;
        console.log(
            `peer listing ${listing.id} (“${listing.title}”, seller ${listing.seller_id})`
        );
        return { listingId: listing.id, quantity: 1 };
    }

    const { data: product, error: productError } = await admin
        .from('products')
        .select('id, stock_quantity, price')
        .eq('is_active', true)
        .gt('stock_quantity', 0)
        .limit(1)
        .maybeSingle();

    if (productError) {
        throw new Error(`product lookup failed: ${productError.message}`);
    }
    assert(product?.id, 'no in-stock active product available for smoke order');
    productId = product.id;
    stockBefore = Number(product.stock_quantity);
    console.log(`catalog product ${product.id} (stock ${stockBefore})`);
    return { productId: product.id, quantity: 1 };
}

async function main() {
    console.log(`smoke-order-api → ${API_BASE} [${PEER_MODE ? 'peer' : 'catalog'}]`);
    console.log(`payment reference: ${reference}`);
    console.log(
        'NOTE: this script writes real rows, then deletes the order(s) and payment it created.\n'
    );

    try {
        const probe = await fetch(`${API_BASE}/v1/api/payments/config`);
        assert(
            probe.ok || probe.status === 401 || probe.status === 403,
            `BFF probe returned ${probe.status}`
        );
    } catch (error) {
        throw new Error(
            `Cannot reach BFF at ${API_BASE}. Start it with \`npm run dev:api\` first. (${error.message})`
        );
    }

    const { data: signIn, error: signInError } = await anon.auth.signInWithPassword({
        email: BUYER_EMAIL,
        password: BUYER_PASSWORD,
    });
    if (signInError || !signIn.session?.access_token) {
        throw new Error(
            `sign-in as ${BUYER_EMAIL} failed: ${signInError?.message || 'no access token'}. Run \`npm run db:seed\` if the buyer is missing.`
        );
    }
    const token = signIn.session.access_token;
    const buyerId = signIn.user.id;
    console.log(`signed in as ${BUYER_EMAIL} (${buyerId})`);

    const item = await resolveItem(buyerId);

    const createBody = {
        paymentReference: reference,
        shippingAddress: {
            name: 'Smoke Buyer',
            street: '1 Test Street',
            city: 'Nairobi',
            postal: '00100',
            phone: '+254700000000',
        },
        items: [item],
    };

    const created = await api('POST', '/v1/api/orders', { token, body: createBody });
    assert(
        created.status === 201,
        `POST /orders returned ${created.status}: ${JSON.stringify(created.json)}`
    );
    assert(created.json?.success === true, 'POST envelope missing success=true');
    const order = created.json.data;
    assert(order?.id === reference, `order.id is ${order?.id}, expected ${reference}`);
    assert(
        order?.status === 'paid' || order?.status === 'in_escrow',
        `order.status is ${order?.status}, expected paid or in_escrow`
    );
    assert(order?.paymentReference === reference, 'paymentReference missing on order');
    assert(order?.payment?.reference === reference, 'embedded payment.reference missing');
    assert(typeof order?.shipByAt === 'string' && order.shipByAt.length > 0, 'shipByAt missing');
    assert(order?.autoReleaseAt == null, 'autoReleaseAt should be null until shipped');
    assert(Array.isArray(order?.items) && order.items.length >= 1, 'order.items empty');

    if (PEER_MODE) {
        const peerItem = order.items[0];
        assert(
            peerItem.listingId === listingId || peerItem.sellerType === 'peer' || !!peerItem.sellerName,
            `peer item shape unexpected: ${JSON.stringify(peerItem)}`
        );
        assert(order.sellerType === 'peer' || order.sellerId || peerItem.sellerType === 'peer',
            'peer seller identity missing on order');

        const { data: listingAfter, error: listingError } = await admin
            .from('listings')
            .select('status, seller_id')
            .eq('id', listingId)
            .single();
        if (listingError) {
            throw new Error(`listing status check failed: ${listingError.message}`);
        }
        assert(listingAfter.status === 'Sold', `listing status is ${listingAfter.status}, expected Sold`);

        const { data: orderRow, error: orderRowError } = await admin
            .from('orders')
            .select('listing_id, product_id, seller_user_id, seller_id')
            .eq('stripe_payment_intent_id', reference)
            .limit(1)
            .single();
        if (orderRowError) {
            throw new Error(`peer order row check failed: ${orderRowError.message}`);
        }
        assert(orderRow.listing_id === listingId, 'order.listing_id mismatch');
        assert(orderRow.product_id == null, 'peer order should have null product_id');
        assert(orderRow.seller_user_id != null, 'peer order missing seller_user_id');
        assert(orderRow.seller_id == null, 'peer order should have null seller_id');
        console.log(`ok  POST /v1/api/orders — peer ${order.status}, listing Sold, seller_user_id set`);
    } else {
        console.log(`ok  POST /v1/api/orders — ${order.status}, grouped, deadlines set`);
    }

    const { data: paymentRow, error: paymentLookupError } = await admin
        .from('payments')
        .select('id, amount_minor, status')
        .eq('reference', reference)
        .single();
    if (paymentLookupError) {
        throw new Error(`payment lookup failed: ${paymentLookupError.message}`);
    }
    paymentId = paymentRow.id;
    assert(paymentRow.status === 'success', `payment status is ${paymentRow.status}`);
    assert(Number(paymentRow.amount_minor) > 0, 'payment.amount_minor was not updated');

    const { data: orderRows, error: orderLookupError } = await admin
        .from('orders')
        .select('id')
        .eq('payment_id', paymentId);
    if (orderLookupError) {
        throw new Error(`order row lookup failed: ${orderLookupError.message}`);
    }
    orderRowIds = (orderRows ?? []).map((row) => row.id);
    assert(orderRowIds.length >= 1, 'no order rows linked to the smoke payment');

    const listed = await api('GET', '/v1/api/orders', { token });
    assert(listed.status === 200, `GET /orders returned ${listed.status}`);
    const foundInList = (listed.json.data ?? []).find((o) => o.id === reference);
    assert(foundInList, 'created order missing from GET /v1/api/orders');
    assert(foundInList.payment?.id === paymentId, 'list embed payment.id mismatch');
    console.log('ok  GET /v1/api/orders — order present with payment embed');

    const byId = await api('GET', `/v1/api/orders/${encodeURIComponent(reference)}`, {
        token,
    });
    assert(byId.status === 200, `GET /orders/:id returned ${byId.status}`);
    assert(byId.json.data?.id === reference, 'GET by id returned wrong order');
    assert(byId.json.data?.payment?.reference === reference, 'GET by id missing payment embed');
    assert(byId.json.data?.shipByAt, 'GET by id missing shipByAt');
    console.log('ok  GET /v1/api/orders/:id — grouped + embedded payment');

    console.log(`\nsmoke-order-api (${PEER_MODE ? 'peer' : 'catalog'}) passed`);
}

main()
    .catch(async (error) => {
        console.error(`\nsmoke-order-api failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await cleanup();
        process.exit(process.exitCode ?? 0);
    });

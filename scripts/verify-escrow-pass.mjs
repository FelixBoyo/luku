/**
 * Repeatable Phase 3 escrow pass against a running BFF.
 *
 * Creates temporary peer listings / orders, drives signed synthetic Paystack
 * webhooks (no real charge), then deletes the rows it created.
 *
 * Requires: npm run dev:api, .env.local with Supabase keys + PAYSTACK_SECRET_KEY
 * (or PAYSTACK_WEBHOOK_SECRET). RECONCILE_SECRET needed for stuck-orders.
 *
 *   npm run verify:escrow-pass
 */
import { createHmac } from 'node:crypto';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });

const API_BASE = process.env.ORDER_API_BASE || `http://localhost:${process.env.PORT || 3001}`;
const BUYER_EMAIL = process.env.SMOKE_BUYER_EMAIL || 'dev+buyer@luku.app';
const SELLER_EMAIL = process.env.SMOKE_SELLER_EMAIL || 'dev+seller@luku.app';
const PASSWORD = process.env.SMOKE_BUYER_PASSWORD || 'LukuDev2026!';
const SELLER_ID = process.env.SMOKE_PEER_SELLER_ID || 'f0000001-0000-4000-8000-000000000002';
const DUMMY_RECIPIENT = 'RCP_escrow_pass_dummy';
const WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;
const RECONCILE_SECRET = process.env.RECONCILE_SECRET;

const url = process.env.SUPABASE_URL;
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
const anonKey = process.env.SUPABASE_ANON_KEY;

if (!url || !serviceKey || !anonKey) {
    console.error('verify:escrow-pass failed: SUPABASE_URL, SERVICE_ROLE_KEY, and ANON_KEY required');
    process.exit(1);
}
if (!WEBHOOK_SECRET) {
    console.error('verify:escrow-pass failed: PAYSTACK_SECRET_KEY or PAYSTACK_WEBHOOK_SECRET required');
    process.exit(1);
}

const admin = createClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});
const anon = createClient(url, anonKey, {
    auth: { persistSession: false, autoRefreshToken: false },
});

const created = {
    listingIds: [],
    paymentIds: [],
    orderRowIds: [],
    references: [],
    userIds: [],
    insertedPayout: false,
};

const assert = (condition, message) => {
    if (!condition) {
        throw new Error(message);
    }
};

const api = async (method, pathname, { token, body, headers, timeoutMs = 25_000 } = {}) => {
    const response = await fetch(`${API_BASE}${pathname}`, {
        method,
        headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
            ...headers,
        },
        body: body ? JSON.stringify(body) : undefined,
        signal: AbortSignal.timeout(timeoutMs),
    });
    const json = await response.json().catch(() => ({}));
    return { status: response.status, json };
};

const signIn = async (email) => {
    const { data, error } = await anon.auth.signInWithPassword({ email, password: PASSWORD });
    if (error || !data.session?.access_token) {
        throw new Error(`sign-in ${email} failed: ${error?.message || 'no token'}`);
    }
    return { token: data.session.access_token, userId: data.user.id };
};

const postWebhook = async (payload) => {
    const body = JSON.stringify(payload);
    const sig = createHmac('sha512', WEBHOOK_SECRET).update(body).digest('hex');
    const res = await fetch(`${API_BASE}/webhooks/paystack`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'x-paystack-signature': sig },
        body,
        signal: AbortSignal.timeout(20_000),
    });
    const text = await res.text();
    return { status: res.status, text };
};

const orderStatus = async (token, reference) => {
    const res = await api('GET', `/v1/api/orders/${encodeURIComponent(reference)}`, { token });
    assert(res.status === 200, `GET order ${reference} → ${res.status} ${JSON.stringify(res.json)}`);
    return String(res.json.data?.status ?? res.json.data?.escrowStatus ?? '');
};

const createPeerOrder = async (buyerToken, label) => {
    const reference = `escrow_pass_${label}_${Date.now()}`;
    created.references.push(reference);
    const { data: listing, error: listingError } = await admin
        .from('listings')
        .insert({
            seller_id: SELLER_ID,
            title: `Escrow pass ${label} ${Date.now()}`,
            price: 1500,
            image_url: 'https://example.com/escrow-pass.jpg',
            status: 'Active',
        })
        .select('id')
        .single();
    if (listingError || !listing?.id) {
        throw new Error(`listing insert failed: ${listingError?.message}`);
    }
    created.listingIds.push(listing.id);

    const createdOrder = await api('POST', '/v1/api/orders', {
        token: buyerToken,
        body: {
            paymentReference: reference,
            shippingAddress: {
                name: 'Escrow Buyer',
                street: '1 Test Street',
                city: 'Nairobi',
                postal: '00100',
                phone: '+254700000000',
            },
            items: [{ listingId: listing.id, quantity: 1 }],
        },
    });
    assert(
        createdOrder.status === 201,
        `POST /orders ${label} → ${createdOrder.status} ${JSON.stringify(createdOrder.json)}`
    );

    const { data: payment } = await admin.from('payments').select('id').eq('reference', reference).maybeSingle();
    if (payment?.id) created.paymentIds.push(payment.id);
    const { data: rows } = await admin.from('orders').select('id').eq('stripe_payment_intent_id', reference);
    for (const row of rows ?? []) created.orderRowIds.push(row.id);

    const webhook = await postWebhook({
        event: 'charge.success',
        data: { reference, status: 'success', amount: 150000, currency: 'KES', channel: 'mobile_money' },
    });
    assert(webhook.status === 200, `charge.success ${reference} → ${webhook.status} ${webhook.text}`);

    const status = await orderStatus(buyerToken, reference);
    assert(status === 'in_escrow', `${label} expected in_escrow, got ${status}`);
    console.log(`ok  ${label}: create+webhook → in_escrow`);
    return { reference, listingId: listing.id };
};

const listingStatus = async (listingId) => {
    const { data, error } = await admin.from('listings').select('status').eq('id', listingId).single();
    if (error) throw new Error(`listing status: ${error.message}`);
    return data.status;
};

const cleanup = async () => {
    if (created.orderRowIds.length) {
        await admin.from('orders').delete().in('id', created.orderRowIds);
    }
    if (created.paymentIds.length) {
        await admin.from('payments').delete().in('id', created.paymentIds);
    }
    if (created.listingIds.length) {
        await admin.from('listings').delete().in('id', created.listingIds);
    }
    if (created.insertedPayout) {
        await admin
            .from('seller_payout_details')
            .delete()
            .eq('seller_id', SELLER_ID)
            .eq('recipient_code', DUMMY_RECIPIENT);
    }
    if (created.references.length) {
        const { error } = await admin
            .from('processed_webhook_events')
            .delete()
            .in('reference', created.references);
        if (error) console.warn(`cleanup processed_webhook_events failed: ${error.message}`);
    }
    for (const userId of created.userIds) {
        for (const reference of created.references) {
            const { error } = await admin
                .from('notifications')
                .delete()
                .eq('user_id', userId)
                .like('body', `%${reference}%`);
            if (error) console.warn(`cleanup notifications failed: ${error.message}`);
        }
    }
};

const leftoverRows = async () => {
    if (!created.references.length) return 0;
    const { count: webhookCount } = await admin
        .from('processed_webhook_events')
        .select('key', { count: 'exact', head: true })
        .in('reference', created.references);
    const { count: orderCount } = await admin
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .in('stripe_payment_intent_id', created.references);
    let notificationCount = 0;
    for (const reference of created.references) {
        const { count } = await admin
            .from('notifications')
            .select('id', { count: 'exact', head: true })
            .like('body', `%${reference}%`);
        notificationCount += count ?? 0;
    }
    return (webhookCount ?? 0) + (orderCount ?? 0) + notificationCount;
};

async function main() {
    console.log(`verify:escrow-pass → ${API_BASE}`);
    const probe = await fetch(`${API_BASE}/health`);
    assert(probe.ok, `API not healthy at ${API_BASE}. Start npm run dev:api first.`);

    const buyer = await signIn(BUYER_EMAIL);
    const seller = await signIn(SELLER_EMAIL);
    created.userIds.push(buyer.userId, seller.userId);

    const { data: existingPayout, error: payoutLookupError } = await admin
        .from('seller_payout_details')
        .select('seller_id')
        .eq('seller_id', seller.userId)
        .maybeSingle();
    if (payoutLookupError) {
        throw new Error(`payout lookup failed (is 015 applied?): ${payoutLookupError.message}`);
    }
    if (!existingPayout) {
        const { error: insertError } = await admin.from('seller_payout_details').insert({
            seller_id: seller.userId,
            type: 'mobile_money',
            label: 'M-Pesa •••• 0000',
            account_name: 'Escrow Pass Seller',
            recipient_code: DUMMY_RECIPIENT,
        });
        if (insertError) {
            throw new Error(`payout insert failed: ${insertError.message}`);
        }
        created.insertedPayout = true;
        console.log('inserted dummy payout details (Transfers remain off)');
    }

    const happy = await createPeerOrder(buyer.token, 'happy');
    const shipHappy = await api('POST', `/v1/api/orders/${encodeURIComponent(happy.reference)}/ship`, {
        token: seller.token,
    });
    assert(shipHappy.status === 200, `ship happy → ${shipHappy.status} ${JSON.stringify(shipHappy.json)}`);
    const confirmStarted = Date.now();
    const confirmHappy = await api(
        'POST',
        `/v1/api/orders/${encodeURIComponent(happy.reference)}/confirm-receipt`,
        { token: buyer.token, timeoutMs: 20_000 }
    );
    const confirmMs = Date.now() - confirmStarted;
    assert(
        confirmHappy.status === 200,
        `confirm happy → ${confirmHappy.status} ${JSON.stringify(confirmHappy.json)}`
    );
    assert(confirmMs < 20_000, `confirm took ${confirmMs}ms, expected under 20s`);
    const released = await orderStatus(buyer.token, happy.reference);
    assert(released === 'released', `expected released, got ${released}`);
    console.log(`ok  happy path → released in ${confirmMs}ms (Transfer skipped while Transfers off)`);

    const dispute = await createPeerOrder(buyer.token, 'dispute');
    const shipDispute = await api('POST', `/v1/api/orders/${encodeURIComponent(dispute.reference)}/ship`, {
        token: seller.token,
    });
    assert(shipDispute.status === 200, `ship dispute → ${shipDispute.status} ${JSON.stringify(shipDispute.json)}`);
    const report = await api('POST', `/v1/api/orders/${encodeURIComponent(dispute.reference)}/dispute`, {
        token: buyer.token,
        timeoutMs: 20_000,
    });
    assert(report.status === 200, `dispute → ${report.status} ${JSON.stringify(report.json)}`);
    const disputed = await orderStatus(buyer.token, dispute.reference);
    assert(disputed === 'disputed', `expected disputed, got ${disputed}`);
    console.log('ok  dispute path → disputed  (watch API log for [Escrow] DISPUTE_OPENED)');

    const miss = await createPeerOrder(buyer.token, 'shipby');
    const { error: deadlineError } = await admin
        .from('orders')
        .update({ ship_by_at: new Date(Date.now() - 60_000).toISOString() })
        .eq('stripe_payment_intent_id', miss.reference);
    if (deadlineError) {
        throw new Error(`ship_by_at update failed: ${deadlineError.message}`);
    }

    if (RECONCILE_SECRET) {
        const timers = await api('POST', '/v1/api/internal/timers/process', {
            headers: { 'x-reconcile-secret': RECONCILE_SECRET },
        });
        assert(timers.status === 200, `timers/process → ${timers.status} ${JSON.stringify(timers.json)}`);
    } else {
        console.warn('RECONCILE_SECRET unset — cannot POST /internal/timers/process; ship-by miss will stay in_escrow');
    }

    const afterTimer = await orderStatus(buyer.token, miss.reference);
    if (RECONCILE_SECRET) {
        assert(
            afterTimer === 'cancelled' || afterTimer === 'refunded',
            `expected cancelled/refunded after ship-by miss, got ${afterTimer}`
        );
        const relisted = await listingStatus(miss.listingId);
        assert(relisted === 'Active', `expected listing Active after cancel (MP-12), got ${relisted}`);
        console.log(
            `ok  ship-by miss → ${afterTimer}, listing ${relisted} (MP-12; synthetic refund may fail)`
        );
    }

    if (RECONCILE_SECRET) {
        const stuck = await api('GET', '/v1/api/internal/stuck-orders', {
            headers: { 'x-reconcile-secret': RECONCILE_SECRET },
        });
        assert(stuck.status === 200, `stuck-orders → ${stuck.status} ${JSON.stringify(stuck.json)}`);
        const ids = (stuck.json.data ?? []).map((row) => row.id || row.paymentReference);
        assert(
            ids.includes(dispute.reference),
            `stuck-orders missing disputed ${dispute.reference}: ${JSON.stringify(ids)}`
        );
        console.log('ok  stuck-orders includes the disputed order');
    } else {
        console.warn('RECONCILE_SECRET unset — skipped stuck-orders check');
    }

    for (const payload of [
        { event: 'transfer.success', data: { reference: happy.reference, transfer_code: 'TRF_pass', amount: 1 } },
        { event: 'transfer.failed', data: { reference: happy.reference, transfer_code: 'TRF_fail', amount: 1 } },
        {
            event: 'refund.processed',
            data: { transaction_reference: miss.reference, amount: 1, id: 'rfd_pass' },
        },
    ]) {
        const result = await postWebhook(payload);
        assert(result.status === 200, `${payload.event} → ${result.status} ${result.text}`);
        console.log(`ok  ${payload.event} webhook → 200`);
    }
    console.log(
        'watch API log for [Escrow] TRANSFER_SUCCESS, [Escrow] TRANSFER_FAILED, [Escrow] REFUND_PROCESSED'
    );

    console.log('\nverify:escrow-pass passed');
}

main()
    .catch((error) => {
        console.error(`\nverify:escrow-pass failed: ${error.message}`);
        process.exitCode = 1;
    })
    .finally(async () => {
        await cleanup();
        const leftover = await leftoverRows();
        if (leftover > 0) {
            console.error(`cleanup left ${leftover} escrow-pass row(s) behind`);
            process.exitCode = 1;
        } else {
            console.log('cleaned up escrow-pass fixtures (no leftover webhook, order, or notification rows)');
        }
        process.exit(process.exitCode ?? 0);
    });

/**
 * Reports Paystack charges that were captured without producing an order.
 *
 * A checkout that fails after capture leaves no `payments` row at all, so this
 * has to start from Paystack rather than the database. Read-only: it never
 * writes, refunds, or creates orders — use the output to decide that manually.
 *
 *   node scripts/triage-orphan-payments.mjs [--days 7] [--strict]
 *
 * --strict exits 1 when any orphan is found, so it can gate CI later.
 */
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
dotenv.config({ path: path.join(repoRoot, '.env.local') });

const args = process.argv.slice(2);
const strict = args.includes('--strict');
const daysIndex = args.indexOf('--days');
const days = daysIndex >= 0 ? Number(args[daysIndex + 1]) : 7;

if (!Number.isFinite(days) || days <= 0) {
    console.error('triage-orphan-payments failed: --days must be a positive number');
    process.exit(1);
}

const secretKey = process.env.PAYSTACK_SECRET_KEY;
const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

const missing = [
    !secretKey && 'PAYSTACK_SECRET_KEY',
    !supabaseUrl && 'SUPABASE_URL',
    !serviceRoleKey && 'SUPABASE_SERVICE_ROLE_KEY',
].filter(Boolean);

if (missing.length > 0) {
    console.error(`triage-orphan-payments failed: missing ${missing.join(', ')} in .env.local`);
    process.exit(1);
}

/** Keeps buyer identifiers out of terminal scrollback and CI logs. */
const mask = (value) => {
    if (!value) return '-';
    const text = String(value);
    if (text.includes('@')) {
        const [user, domain] = text.split('@');
        return `${user.slice(0, 2)}***@${domain}`;
    }
    return `***${text.slice(-4)}`;
};

const fetchSuccessfulTransactions = async (from) => {
    const transactions = [];

    for (let page = 1; page <= 20; page += 1) {
        const url = new URL('https://api.paystack.co/transaction');
        url.searchParams.set('status', 'success');
        url.searchParams.set('perPage', '100');
        url.searchParams.set('page', String(page));
        url.searchParams.set('from', from);

        const res = await fetch(url, {
            headers: { Authorization: `Bearer ${secretKey}` },
        });

        if (!res.ok) {
            throw new Error(`Paystack returned ${res.status} listing transactions`);
        }

        const body = await res.json();
        const batch = Array.isArray(body?.data) ? body.data : [];
        transactions.push(...batch);

        if (batch.length < 100) {
            break;
        }
    }

    return transactions;
};

const main = async () => {
    const from = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const supabase = createClient(supabaseUrl, serviceRoleKey, {
        auth: { persistSession: false, autoRefreshToken: false },
    });

    const transactions = await fetchSuccessfulTransactions(from);
    if (transactions.length === 0) {
        console.log(`No successful Paystack transactions in the last ${days} day(s).`);
        return;
    }

    const references = transactions.map((t) => String(t.reference));

    const { data: paymentRows, error: paymentsError } = await supabase
        .from('payments')
        .select('reference')
        .in('reference', references);
    if (paymentsError) {
        throw new Error(`Reading payments failed: ${paymentsError.message}`);
    }

    const { data: orderRows, error: ordersError } = await supabase
        .from('orders')
        .select('stripe_payment_intent_id')
        .in('stripe_payment_intent_id', references);
    if (ordersError) {
        throw new Error(`Reading orders failed: ${ordersError.message}`);
    }

    const withPayment = new Set((paymentRows ?? []).map((r) => String(r.reference)));
    const withOrder = new Set(
        (orderRows ?? []).map((r) => String(r.stripe_payment_intent_id))
    );

    const report = transactions.map((t) => {
        const reference = String(t.reference);
        const hasOrder = withOrder.has(reference);
        const hasPayment = withPayment.has(reference);
        const verdict = hasOrder
            ? 'ok'
            : hasPayment
              ? 'order_missing'
              : 'payment_row_missing';

        return {
            reference,
            amount: `${(Number(t.amount ?? 0) / 100).toFixed(2)} ${t.currency ?? ''}`.trim(),
            paidAt: t.paid_at ?? t.paidAt ?? '-',
            customer: mask(t.customer?.email ?? t.customer?.phone),
            verdict,
        };
    });

    console.table(report);

    const orphans = report.filter((row) => row.verdict !== 'ok');
    console.log(
        `\n${transactions.length} successful charge(s) in the last ${days} day(s); ${orphans.length} without an order.`
    );

    if (orphans.length > 0) {
        console.log(
            'Captured money with no order. Refund in Paystack or create the order manually — this script changes nothing.'
        );
        if (strict) {
            process.exitCode = 1;
        }
    }
};

main().catch((err) => {
    console.error(`triage-orphan-payments failed: ${err.message}`);
    process.exit(1);
});

/**
 * Manual test script — NOT for commit.
 * Run with: npx tsx scratch-test-payout.ts
 * (or: npx ts-node scratch-test-payout.ts, depending on what this repo uses)
 *
 * Requires PAYSTACK_SECRET_KEY and other env vars to already be loaded the
 * same way server.ts loads them — if this script can't find your env,
 * either run it via a script that also does dotenv.config(), or copy the
 * dotenv.config({ path: ... }) lines from the top of server.ts into here.
 */

import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '..', '.env.local') });

import { calculatePayout, payoutOnRelease } from './payments/payout';
import { refundOrder } from './payments/refund';

const SELLER2_ID = 'f0000001-0000-4000-8000-000000000003';

const runPayoutMathTests = () => {
    console.log('\n=== calculatePayout (pure math, no network) ===');

    const cases = [500000, 1050000, 1050001, 999, 1];
    for (const price of cases) {
        try {
            const result = calculatePayout(price);
            console.log(`itemPriceMinor=${price} ->`, result);
        } catch (err) {
            console.log(`itemPriceMinor=${price} -> THROWS:`, (err as Error).message);
        }
    }

    console.log('\n-- expect these to throw --');
    for (const bad of [0, -100, 1.5]) {
        try {
            calculatePayout(bad);
            console.log(`itemPriceMinor=${bad} -> DID NOT THROW (unexpected!)`);
        } catch (err) {
            console.log(`itemPriceMinor=${bad} -> correctly threw:`, (err as Error).message);
        }
    }
};

const runPayoutOnReleaseTest = async () => {
    console.log('\n=== payoutOnRelease (hits DB + Paystack test-mode Transfer) ===');
    console.log('Requires seller_payout_details to exist AND seller2 to have saved recipient details first.');
    try {
        const result = await payoutOnRelease({
            orderId: 'manual-test-order-1',
            seller_user_id: SELLER2_ID,
            itemPriceMinor: 500000, // KES 5,000
        });
        console.log('payoutOnRelease result:', result);
    } catch (err) {
        console.log('payoutOnRelease FAILED:', (err as Error).message);
    }
};

const runRefundTest = async () => {
    console.log('\n=== refundOrder (hits Paystack test-mode Refund) ===');
    const PAYMENT_REFERENCE = 'mpesa_9f0fab2f-fe85-4b58-acdf-654425eb54cd';
    try {
        const result = await refundOrder({
            orderId: 'manual-test-order-1',
            paymentReference: PAYMENT_REFERENCE,
            amountPaidMinor: 500000,
        });
        console.log('refundOrder result:', result);
    } catch (err) {
        console.log('refundOrder FAILED:', (err as Error).message);
    }
};

const main = async () => {
    runPayoutMathTests();
    await runPayoutOnReleaseTest();
    await runRefundTest();
};

void main();

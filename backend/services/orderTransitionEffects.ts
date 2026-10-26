import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { safeLogger } from '../http/redact';
import { payoutOnRelease } from '../payments/payout';
import { refundOrder } from '../payments/refund';
import type { OrderStatus } from '../../packages/contracts/src/orders';
import {
    transitionOrder,
    OrderNotFoundError,
    IllegalOrderTransitionError,
} from './orderStateMachine';

/**
 * Money and follow-on status writes after a successful CAS in `transitionOrder`.
 * Failures are logged; they must not roll back the status that already committed.
 */
export const runTransitionEffects = async (
    orderId: string,
    toStatus: OrderStatus
): Promise<void> => {
    if (toStatus === 'delivered') {
        await followOnTransition(orderId, 'released');
        return;
    }

    if (toStatus === 'released') {
        // Confirm-receipt must return after `released` commits. Paystack
        // Transfers (or a dead fetch) must not hold the buyer spinner.
        void payoutReleasedOrder(orderId);
        return;
    }

    if (toStatus === 'cancelled') {
        // MP-12 — return the listing even when Paystack refund fails (synthetic
        // charges, "Transaction not found"). Refund success still follows on
        // to `refunded`; the Sold guard makes a second relist a no-op.
        await relistCancelledListing(orderId);
        const refunded = await refundCancelledOrder(orderId);
        if (refunded) {
            await followOnTransition(orderId, 'refunded');
        }
        return;
    }

    if (toStatus === 'disputed') {
        await logDisputeOpened(orderId);
        return;
    }

    if (toStatus === 'refunded') {
        // Ops-driven disputed → refunded (buyer wins) also returns the listing.
        await relistCancelledListing(orderId);
    }
};

const followOnTransition = async (
    orderId: string,
    toStatus: 'released' | 'refunded'
): Promise<void> => {
    try {
        await transitionOrder({ orderId, toStatus, actor: 'system' });
    } catch (error) {
        if (error instanceof OrderNotFoundError || error instanceof IllegalOrderTransitionError) {
            return;
        }
        safeLogger.error('[Escrow] Follow-on transition failed', { orderId, toStatus, error });
    }
};

const payoutReleasedOrder = async (orderId: string): Promise<void> => {
    try {
        const rows = await loadOrderMoneyRows(orderId);
        if (rows.length === 0) {
            safeLogger.warn('[Escrow] Payout skipped — order rows missing', { orderId });
            return;
        }

        const itemPriceMinor = rows.reduce(
            (sum, row) => sum + Math.round(Number(row.total_price) * 100),
            0
        );
        if (itemPriceMinor <= 0) {
            safeLogger.warn('[Escrow] Payout skipped — non-positive subtotal', { orderId });
            return;
        }

        await payoutOnRelease({
            orderId,
            seller_id: rows[0].seller_id,
            seller_user_id: rows[0].seller_user_id,
            itemPriceMinor,
        });
    } catch (error) {
        safeLogger.error('[Escrow] Payout on release failed', { orderId, error });
    }
};

const refundCancelledOrder = async (orderId: string): Promise<boolean> => {
    try {
        const supabase = getSupabaseAdmin();
        const { data: payment, error } = await supabase
            .from('payments')
            .select('reference, amount_minor')
            .eq('reference', orderId)
            .maybeSingle();

        if (error) {
            throw new Error(error.message);
        }

        const amountPaidMinor = Number(payment?.amount_minor ?? 0);
        if (!Number.isInteger(amountPaidMinor) || amountPaidMinor <= 0) {
            safeLogger.warn('[Escrow] Refund skipped — missing capture amount', { orderId });
            return false;
        }

        await refundOrder({
            orderId,
            paymentReference: String(payment?.reference || orderId),
            amountPaidMinor,
        });

        return true;
    } catch (error) {
        safeLogger.error('[Escrow] Refund on cancel failed', { orderId, error });
        return false;
    }
};

/**
 * MP-12 — flip a peer listing back to Active after a buyer-win refund.
 *
 * Catalog product orders have no listing_id and are silently skipped.
 * The `.eq('status', 'Sold')` guard prevents double-relisting if this
 * runs more than once.
 */
const relistCancelledListing = async (orderId: string): Promise<void> => {
    try {
        const supabase = getSupabaseAdmin();

        const { data, error } = await supabase
            .from('orders')
            .select('listing_id')
            .eq('stripe_payment_intent_id', orderId)
            .not('listing_id', 'is', null)
            .limit(1)
            .maybeSingle();

        if (error) {
            safeLogger.warn('[Escrow] Relist skipped — could not load listing_id', {
                orderId,
                error: error.message,
            });
            return;
        }

        if (!data?.listing_id) {
            // Catalog order — no listing to relist.
            return;
        }

        const { error: updateError } = await supabase
            .from('listings')
            .update({ status: 'Active', updated_at: new Date().toISOString() })
            .eq('id', data.listing_id)
            .eq('status', 'Sold'); // guard: only flip if still Sold

        if (updateError) {
            safeLogger.warn('[Escrow] Relist failed — could not update listing status', {
                orderId,
                listingId: data.listing_id,
                error: updateError.message,
            });
            return;
        }

        safeLogger.info('[Escrow] LISTING_RELISTED', {
            orderId,
            listingId: data.listing_id,
        });
    } catch (error) {
        safeLogger.error('[Escrow] Relist threw unexpectedly', { orderId, error });
    }
};

const logDisputeOpened = async (orderId: string): Promise<void> => {
    try {
        const rows = await loadOrderMoneyRows(orderId);
        const first = rows[0];
        safeLogger.warn('[Escrow] DISPUTE_OPENED', {
            orderId,
            buyerId: first?.buyer_id ?? null,
            sellerUserId: first?.seller_user_id ?? null,
        });
    } catch (error) {
        safeLogger.error('[Escrow] DISPUTE_OPENED log failed', { orderId, error });
    }
};

type MoneyRow = {
    buyer_id: string | null;
    seller_id: string | null;
    seller_user_id: string | null;
    total_price: number | string;
};

const loadOrderMoneyRows = async (orderId: string): Promise<MoneyRow[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('orders')
        .select('buyer_id, seller_id, seller_user_id, total_price')
        .eq('stripe_payment_intent_id', orderId);

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []) as MoneyRow[];
};
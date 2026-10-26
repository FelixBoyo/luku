import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { safeLogger } from '../http/redact';
import type { PaystackWebhookEvent } from '../handlers/webhooks/paystack';
import type { PaymentChannel, OrderStatus } from '../../packages/contracts/src/orders';
import {
    transitionOrder,
    OrderNotFoundError,
    IllegalOrderTransitionError,
    type OrderActor,
} from './orderStateMachine';

const PAYSTACK_CHANNEL_MAP: Record<string, PaymentChannel> = {
    mobile_money: 'mpesa',
    card: 'card',
};

/**
 * `charge.success` -> payment truth + escrow state machine (C-CORE-3).
 *
 * Records the payment, then chains the order `pending_payment -> paid ->
 * in_escrow` so it lands where the downstream escrow work expects it (seller
 * ship, buyer confirm, and Brian's ship-by timer all start from `in_escrow`).
 *
 * Order creation (`createOrder`) already inserts rows at `paid` once the app's
 * M-Pesa poll succeeds, and can run before or after this webhook fires. Both
 * "no payment row yet" and "order already paid" are expected races here, not
 * failures — C-CORE-6 (reconciliation) is the backstop for a webhook that
 * never arrives at all.
 */
export const processPaystackChargeSuccess = async (
    event: PaystackWebhookEvent
): Promise<void> => {
    if (event.event !== 'charge.success') {
        safeLogger.info('[Webhook] Ignoring non-charge.success Paystack event', {
            event: event.event,
        });
        return;
    }

    const { reference, amount, currency, channel } = event.data;
    const supabase = getSupabaseAdmin();

    const { data: existingPayment, error: lookupError } = await supabase
        .from('payments')
        .select('id')
        .eq('reference', reference)
        .maybeSingle();

    if (lookupError) {
        throw new Error(lookupError.message);
    }

    if (existingPayment?.id) {
        const { error: updateError } = await supabase
            .from('payments')
            .update({
                status: 'success',
                amount_minor: amount,
                currency: currency || 'KES',
                channel: channel ? (PAYSTACK_CHANNEL_MAP[channel] ?? null) : null,
                paid_at: new Date().toISOString(),
                raw_payload: event,
            })
            .eq('id', existingPayment.id);

        if (updateError) {
            throw new Error(updateError.message);
        }
    } else {
        // Order creation owns buyer_id; without it we cannot insert a payments
        // row. Reconciliation (C-CORE-6) repairs this case from Paystack Verify.
        safeLogger.warn('[Webhook] charge.success for unknown payment reference', {
            reference,
        });
    }

    // Payment truth is recorded; now walk the order into escrow. `createOrder`
    // (the M-Pesa poll path) may already have moved it to `paid` — or a retried
    // webhook may already have run — so each step is best-effort: an
    // already-applied transition is a no-op, not a failure. Chaining
    // `paid -> in_escrow` here is what lets Brian's ship-by timer
    // (`in_escrow -> cancelled`) ever fire; the webhook used to stop at `paid`.
    await advanceOrder(reference, 'paid', 'webhook');
    await advanceOrder(reference, 'in_escrow', 'system');
};

/**
 * One best-effort escrow transition for the webhook path. `OrderNotFoundError`
 * (order not created yet — reconciliation is the backstop) and
 * `IllegalOrderTransitionError` (order already at or past `toStatus`) are both
 * expected races here, not errors. Anything else propagates so the webhook
 * retries.
 */
const advanceOrder = async (
    reference: string,
    toStatus: OrderStatus,
    actor: OrderActor
): Promise<void> => {
    try {
        await transitionOrder({ orderId: reference, toStatus, actor });
    } catch (error) {
        if (error instanceof OrderNotFoundError || error instanceof IllegalOrderTransitionError) {
            safeLogger.info('[Webhook] Skipped order transition', {
                reference,
                toStatus,
                reason: error.message,
            });
            return;
        }
        throw error;
    }
};

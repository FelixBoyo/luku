/**
 * Refunds (C-CORE-5).
 *
 * Fires when an order moves to `refunded` — either ops resolving a dispute
 * in the buyer's favor (`disputed` -> `refunded`), or the ship-by deadline
 * being missed and the order auto-cancelling (`cancelled` -> `refunded`,
 * D3/C-CORE-7). Per D11, a refund is always 100% of what the buyer paid;
 * commission (D7) is only ever earned at `released`, so a reversed sale has
 * nothing to subtract. Partial refunds are manual-ops-only in v1 and are not
 * handled by this module.
 *
 * Reference: https://paystack.com/docs/api/refund
 */

import { safeLogger } from '../http/redact';
import { readPaystackJson } from './paystackResponse';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export type RefundStatus = 'processed' | 'pending' | 'failed';

export interface RefundResult {
    status: RefundStatus;
    refundReference: string;
    amountMinor: number;
}

/**
 * Reverses a Paystack charge in full. amountMinor should be the total the
 * buyer actually paid (item price + VAT/shipping) — never the discounted
 * item-only total, and never with commission subtracted (D11).
 *
 * Note: `payments.amount_minor` is currently the line-item total only, not
 * the full charged amount (tax/shipping are added client-side) — pending
 * C-CORE-6 reconciliation. Callers should pass the amount they've confirmed
 * is correct rather than assuming this function will look it up itself.
 */
const requestRefund = async (
    paymentReference: string,
    amountMinor: number,
): Promise<{ status: RefundStatus; refundReference: string }> => {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key is not configured');
    }

    if (!paymentReference) {
        throw new Error('A payment reference is required to issue a refund.');
    }

    if (!Number.isInteger(amountMinor) || amountMinor <= 0) {
        throw new Error(`amountMinor must be a positive integer. Received ${amountMinor}.`);
    }

    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/refund`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                transaction: paymentReference,
                amount: amountMinor, // full amount — D11, no partial refunds here
            }),
        });

        if (!response.ok) {
            const errorData = await readPaystackJson<unknown>(response);
            const errorMessage = errorData.message || `Paystack API returned ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await readPaystackJson<{
            status?: string;
            id?: number | string;
        }>(response);

        const refundReference = data.data?.id !== undefined ? String(data.data.id) : undefined;
        if (!refundReference) {
            throw new Error('Paystack response did not include a refund reference');
        }

        // Paystack refund status vocabulary: 'processed' | 'pending' | 'failed'
        // (also seen: 'processing') — normalize anything not explicitly
        // processed/failed to 'pending' so callers don't chase every variant.
        const rawStatus = data.data?.status;
        const status: RefundStatus =
            rawStatus === 'processed'
                ? 'processed'
                : rawStatus === 'failed'
                  ? 'failed'
                  : 'pending';

        return { status, refundReference };
    } catch (error: any) {
        safeLogger.error('Paystack refund error', { error, paymentReference });

        let errorMessage = 'There was a problem processing this refund.';
        if (error.message?.includes('already')) {
            errorMessage = 'This transaction has already been refunded.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

/**
 * Orchestrates a refund for a single order.
 *
 * Callers are expected to have already confirmed the order is genuinely
 * refundable per the state machine (`disputed` resolved for buyer, or
 * `cancelled` from a missed ship-by deadline) — this function trusts the
 * order/payment data it's given rather than re-deriving order status itself.
 *
 * Never called with a partial amount — D11 refunds are always 100% of what
 * the buyer paid. Manual partial refunds on a dispute happen outside this
 * function, directly through ops tooling / the Paystack dashboard.
 */
export const refundOrder = async (params: {
    orderId: string;
    paymentReference: string;
    amountPaidMinor: number;
}): Promise<RefundResult> => {
    const { orderId, paymentReference, amountPaidMinor } = params;

    const { status, refundReference } = await requestRefund(paymentReference, amountPaidMinor);

    if (status === 'failed') {
        safeLogger.error('Refund failed for order', { orderId, refundReference });
    }

    return { status, refundReference, amountMinor: amountPaidMinor };
};
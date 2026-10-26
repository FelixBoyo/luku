/**
 * Payout on release (C-CORE-4).
 *
 * When an order transitions to `released` (buyer confirmed receipt, or the
 * auto-release timer fired — C-CORE-7), this module computes the seller's
 * cut and sends it via Paystack Transfers (D6 — transfers after release,
 * not subaccounts, so escrow can actually hold and reverse funds).
 *
 * Transfers stay off until `PAYSTACK_TRANSFERS_ENABLED=true` (Paystack Starter
 * cannot initiate third-party payouts). Confirm still commits `released`.
 *
 * Reference: https://paystack.com/docs/api/transfer
 */

import { safeLogger } from '../http/redact';
import { readPaystackJson } from './paystackResponse';
import { getEscrowPolicy } from './escrowPolicy';
import { getPayoutDetails } from '../services/payoutDetailsService';
import { resolveSellerUserId } from '../services/sellerIdentity';

const PAYSTACK_BASE_URL = 'https://api.paystack.co';
const TRANSFER_FETCH_TIMEOUT_MS = 15_000;

const transfersEnabled = (): boolean => process.env.PAYSTACK_TRANSFERS_ENABLED === 'true';

export interface PayoutCalculation {
    itemPriceMinor: number;
    commissionMinor: number;
    payoutMinor: number;
    commissionRate: number;
}

/**
 * D7 — platform commission is taken only here, at release. Refunds (D11)
 * never call this: a reversed sale earns nothing, so there's nothing to
 * subtract.
 */
export const calculatePayout = (itemPriceMinor: number): PayoutCalculation => {
    if (!Number.isInteger(itemPriceMinor) || itemPriceMinor <= 0) {
        throw new Error(`itemPriceMinor must be a positive integer. Received ${itemPriceMinor}.`);
    }

    const { commissionRate } = getEscrowPolicy();

    const commissionMinor = Math.round(itemPriceMinor * commissionRate);
    const payoutMinor = itemPriceMinor - commissionMinor;

    return { itemPriceMinor, commissionMinor, payoutMinor, commissionRate };
};

export type TransferStatus = 'success' | 'pending' | 'failed';

export interface TransferResult {
    status: TransferStatus;
    transferCode: string;
    payoutMinor: number;
    commissionMinor: number;
}

/**
 * Sends the seller's cut via Paystack Transfer. Transfers are async — a
 * 'success' here means Paystack accepted the request, not that funds have
 * definitively landed. Treat 'pending' as normal; the transfer.success /
 * transfer.failed webhook (not yet built) is what should confirm the final
 * state. Do not poll in a tight loop from a webhook handler.
 */
const sendTransfer = async (
    recipientCode: string,
    payoutMinor: number,
    reason: string,
): Promise<{ status: TransferStatus; transferCode: string }> => {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;

    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key is not configured');
    }

    try {
        const response = await fetch(`${PAYSTACK_BASE_URL}/transfer`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                source: 'balance',
                amount: payoutMinor,
                recipient: recipientCode,
                reason,
            }),
            signal: AbortSignal.timeout(TRANSFER_FETCH_TIMEOUT_MS),
        });

        if (!response.ok) {
            const errorData = await readPaystackJson<unknown>(response);
            const errorMessage = errorData.message || `Paystack API returned ${response.status}`;
            throw new Error(errorMessage);
        }

        const data = await readPaystackJson<{
            status?: string;
            transfer_code?: string;
        }>(response);

        const transferCode = data.data?.transfer_code;
        if (!transferCode) {
            throw new Error('Paystack response did not include a transfer code');
        }

        // Paystack: 'success' (test mode, instant), 'pending' (needs OTP/approval
        // in live mode), 'otp' — normalize anything not explicitly success/failed
        // to 'pending' so callers don't have to know Paystack's exact vocabulary.
        const rawStatus = data.data?.status;
        const status: TransferStatus =
            rawStatus === 'success' ? 'success' : rawStatus === 'failed' ? 'failed' : 'pending';

        return { status, transferCode };
    } catch (error: any) {
        safeLogger.error('Paystack transfer error', { error, recipientCode });

        let errorMessage = 'There was a problem sending the seller payout.';
        if (error.message?.includes('balance')) {
            errorMessage = 'Platform balance is insufficient to complete this transfer.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

/**
 * Orchestrates payout for a single released order.
 *
 * Callers are expected to have already confirmed the order is genuinely
 * `released` (the state machine is the source of truth for that — this
 * function does not re-derive order status, it trusts what it's given).
 *
 * itemPriceMinor should come from the order's line-item total in minor
 * units. Note amount_minor on `payments` is not yet authoritative pending
 * C-CORE-6 reconciliation — pass the value the caller considers correct
 * rather than assuming this function should look it up itself.
 */
export const payoutOnRelease = async (params: {
    orderId: string;
    seller_id?: string | null;
    seller_user_id?: string | null;
    itemPriceMinor: number;
}): Promise<TransferResult> => {
    const { orderId, seller_id, seller_user_id, itemPriceMinor } = params;

    const sellerUserId = await resolveSellerUserId({
        seller_id,
        seller_user_id,
    });

    const { commissionMinor, payoutMinor } = calculatePayout(itemPriceMinor);

    if (!transfersEnabled()) {
        safeLogger.info('[Escrow] Payout deferred — transfers disabled', {
            orderId,
            sellerUserId,
            itemPriceMinor,
        });
        return { status: 'pending', transferCode: '', payoutMinor, commissionMinor };
    }

    const recipient = await getPayoutDetails(sellerUserId);

    if (!recipient) {
        throw new Error(
            `Seller ${sellerUserId} has no payout details on file — cannot release funds for order ${orderId}.`,
        );
    }

    const { status, transferCode } = await sendTransfer(
        recipient.recipientCode,
        payoutMinor,
        `LUKU payout for order ${orderId}`,
    );

    return { status, transferCode, payoutMinor, commissionMinor };
};


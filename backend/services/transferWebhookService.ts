/**
 * Async Paystack webhook handlers for transfer and refund events.
 *
 * `sendTransfer` in payout.ts notes these as "not yet built" — this module
 * closes that gap. Wire into server.ts by replacing:
 *
 *   processEvent: processPaystackChargeSuccess
 *
 * with:
 *
 *   processEvent: processPaystackEvent
 *
 * and import processPaystackEvent from here.
 *
 * What each handler does:
 *
 *   transfer.success  — log that funds landed; no state change needed because
 *                       the order is already `released`. Useful for ops audit.
 *
 *   transfer.failed   — log the failure. Per team docs, status is NOT rolled
 *                       back from `released`. Ops must manually retry via the
 *                       Paystack dashboard or a future retry ticket.
 *
 *   refund.processed  — confirm Paystack settled the refund. Order is already
 *                       `refunded` in our state machine — this is the async
 *                       confirmation only. No DB write needed; state machine
 *                       already stamped `refunded_at` on `orders`.
 */

import { safeLogger } from '../http/redact';
import type { PaystackWebhookEvent } from '../handlers/webhooks/paystack';
import { processPaystackChargeSuccess } from './paymentWebhookService';

// ---------------------------------------------------------------------------
// transfer.success
// ---------------------------------------------------------------------------

const processTransferSuccess = async (event: PaystackWebhookEvent): Promise<void> => {
    const transferCode = event.data?.transfer_code ?? event.data?.reference;
    const amount = event.data?.amount;
    const recipient = event.data?.recipient;

    // Order is already `released` — this is the async confirmation that funds
    // landed. Log for ops audit; no state change required.
    safeLogger.info('[Escrow] TRANSFER_SUCCESS', {
        transferCode,
        amount,
        recipientCode: recipient?.recipient_code ?? null,
        recipientName: recipient?.name ?? null,
    });
};

// ---------------------------------------------------------------------------
// transfer.failed
// ---------------------------------------------------------------------------

const processTransferFailed = async (event: PaystackWebhookEvent): Promise<void> => {
    const transferCode = event.data?.transfer_code ?? event.data?.reference;
    const failureReason = event.data?.gateway_response ?? 'unknown';
    const recipient = event.data?.recipient;

    // Per team docs: do NOT roll back `released`. Log for ops to manually
    // retry payout via Paystack dashboard or a future retry ticket.
    safeLogger.error('[Escrow] TRANSFER_FAILED — manual ops retry required', {
        transferCode,
        failureReason,
        recipientCode: recipient?.recipient_code ?? null,
        recipientName: recipient?.name ?? null,
    });
};

// ---------------------------------------------------------------------------
// refund.processed
// ---------------------------------------------------------------------------

const processRefundProcessed = async (event: PaystackWebhookEvent): Promise<void> => {
    const refundReference = String(event.data?.id ?? event.data?.reference ?? '');
    const amount = event.data?.amount;
    const transactionReference = event.data?.transaction?.reference ?? event.data?.reference;

    // Order is already `refunded` in our state machine; `refunded_at` on
    // `orders` is already stamped by transitionOrder. This is the async
    // Paystack confirmation — log for ops audit only.
    safeLogger.info('[Escrow] REFUND_PROCESSED', {
        refundReference,
        amount,
        transactionReference,
    });
};

// ---------------------------------------------------------------------------
// Top-level router — replaces processPaystackChargeSuccess as processEvent
// ---------------------------------------------------------------------------

/**
 * Drop-in replacement for processPaystackChargeSuccess in server.ts.
 *
 * Routes every Paystack event type we care about. Unknown events are logged
 * and ignored — Paystack sends many event types; silence on unknown ones is
 * correct behaviour.
 */
export const processPaystackEvent = async (event: PaystackWebhookEvent): Promise<void> => {
    switch (event.event) {
        case 'charge.success':
            await processPaystackChargeSuccess(event);
            break;

        case 'transfer.success':
            await processTransferSuccess(event);
            break;

        case 'transfer.failed':
        case 'transfer.reversed':
            await processTransferFailed(event);
            break;

        case 'refund.processed':
            await processRefundProcessed(event);
            break;

        default:
            safeLogger.info('[Webhook] Unhandled Paystack event type — ignored', {
                event: event.event,
            });
    }
};

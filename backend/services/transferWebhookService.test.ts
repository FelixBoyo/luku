import { describe, expect, it, vi, beforeEach } from 'vitest';
import { processPaystackEvent } from './transferWebhookService';
import { processPaystackChargeSuccess } from './paymentWebhookService';
import { transitionOrder } from './orderStateMachine';
import { safeLogger } from '../http/redact';

vi.mock('./paymentWebhookService', () => ({
    processPaystackChargeSuccess: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./orderStateMachine', () => ({
    transitionOrder: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../http/redact', () => ({
    safeLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const event = (type: string, data: Record<string, unknown> = {}) =>
    ({
        event: type,
        data: {
            reference: 'ref_1',
            status: 'success',
            amount: 1000,
            currency: 'KES',
            ...data,
        },
    }) as any;

describe('processPaystackEvent', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('routes charge.success to processPaystackChargeSuccess', async () => {
        const payload = event('charge.success');
        await processPaystackEvent(payload);
        expect(processPaystackChargeSuccess).toHaveBeenCalledWith(payload);
    });

    it('logs TRANSFER_SUCCESS without touching order status', async () => {
        await processPaystackEvent(
            event('transfer.success', { transfer_code: 'TRF_1', recipient: { recipient_code: 'RCP_1' } })
        );
        expect(safeLogger.info).toHaveBeenCalledWith(
            '[Escrow] TRANSFER_SUCCESS',
            expect.objectContaining({ transferCode: 'TRF_1' })
        );
        expect(transitionOrder).not.toHaveBeenCalled();
        expect(processPaystackChargeSuccess).not.toHaveBeenCalled();
    });

    it('logs TRANSFER_FAILED and does not roll back released', async () => {
        await processPaystackEvent(event('transfer.failed', { transfer_code: 'TRF_2' }));
        await processPaystackEvent(event('transfer.reversed', { transfer_code: 'TRF_3' }));
        expect(safeLogger.error).toHaveBeenCalledWith(
            '[Escrow] TRANSFER_FAILED — manual ops retry required',
            expect.objectContaining({ transferCode: 'TRF_2' })
        );
        expect(transitionOrder).not.toHaveBeenCalled();
    });

    it('logs REFUND_PROCESSED', async () => {
        await processPaystackEvent(
            event('refund.processed', { id: 'rfd_1', transaction: { reference: 'ref_1' } })
        );
        expect(safeLogger.info).toHaveBeenCalledWith(
            '[Escrow] REFUND_PROCESSED',
            expect.objectContaining({ refundReference: 'rfd_1', transactionReference: 'ref_1' })
        );
        expect(transitionOrder).not.toHaveBeenCalled();
    });

    it('ignores unknown events', async () => {
        await processPaystackEvent(event('subscription.create'));
        expect(safeLogger.info).toHaveBeenCalledWith(
            '[Webhook] Unhandled Paystack event type — ignored',
            { event: 'subscription.create' }
        );
        expect(processPaystackChargeSuccess).not.toHaveBeenCalled();
        expect(transitionOrder).not.toHaveBeenCalled();
    });
});

import { createHmac } from 'node:crypto';
import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
    handlePaystackWebhook,
    handlePaystackWebhookRequest,
    resolveWebhookReference,
    verifyPaystackSignature,
    WebhookAuthError,
} from './paystack';
import type { IdempotencyRecord, IdempotencyStore } from '../../payments/idempotencyStore';

class TestIdempotencyStore implements IdempotencyStore {
    private readonly records = new Map<string, IdempotencyRecord>();

    async hasProcessed(key: string): Promise<boolean> {
        return this.records.has(key);
    }

    async markProcessed(key: string, record: IdempotencyRecord): Promise<void> {
        this.records.set(key, record);
    }
}

const webhookBody = JSON.stringify({
    event: 'charge.success',
    data: {
        reference: 'order-ref-123',
        status: 'success',
        amount: 1000,
        currency: 'KES',
    },
});

const sign = (secret: string, body: string): string =>
    createHmac('sha512', secret).update(body).digest('hex');

describe('paystack webhook verification', () => {
    const originalWebhookSecret = process.env.PAYSTACK_WEBHOOK_SECRET;
    const originalPaystackSecret = process.env.PAYSTACK_SECRET_KEY;

    beforeEach(() => {
        process.env.PAYSTACK_WEBHOOK_SECRET = 'whsec_test_secret';
        delete process.env.PAYSTACK_SECRET_KEY;
    });

    afterEach(() => {
        process.env.PAYSTACK_WEBHOOK_SECRET = originalWebhookSecret;
        process.env.PAYSTACK_SECRET_KEY = originalPaystackSecret;
        vi.restoreAllMocks();
    });

    it('accepts a valid signature', () => {
        const signature = sign('whsec_test_secret', webhookBody);
        expect(verifyPaystackSignature(signature, webhookBody)).toBe(true);
    });

    it('rejects an invalid signature', () => {
        expect(verifyPaystackSignature('invalid', webhookBody)).toBe(false);
    });

    it('accepts a signature when only PAYSTACK_SECRET_KEY is set', async () => {
        delete process.env.PAYSTACK_WEBHOOK_SECRET;
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_fallback';

        const signature = sign('sk_test_fallback', webhookBody);
        expect(verifyPaystackSignature(signature, webhookBody)).toBe(true);
        await expect(
            handlePaystackWebhook(signature, webhookBody, {
                idempotencyStore: new TestIdempotencyStore(),
                processEvent: async () => undefined,
            })
        ).resolves.toBeUndefined();
    });

    it('rejects when webhook secret and secret key are both missing', async () => {
        delete process.env.PAYSTACK_WEBHOOK_SECRET;
        delete process.env.PAYSTACK_SECRET_KEY;

        const signature = sign('whsec_test_secret', webhookBody);
        await expect(handlePaystackWebhook(signature, webhookBody)).rejects.toBeInstanceOf(
            WebhookAuthError
        );
    });

    it('rejects when signature is missing', async () => {
        await expect(handlePaystackWebhook(undefined, webhookBody)).rejects.toBeInstanceOf(
            WebhookAuthError
        );
    });
});

describe('paystack webhook idempotency', () => {
    const originalSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

    beforeEach(() => {
        process.env.PAYSTACK_WEBHOOK_SECRET = 'whsec_test_secret';
    });

    afterEach(() => {
        process.env.PAYSTACK_WEBHOOK_SECRET = originalSecret;
        vi.restoreAllMocks();
    });

    it('processes first delivery and ignores duplicate deliveries', async () => {
        const signature = sign('whsec_test_secret', webhookBody);
        const idempotencyStore = new TestIdempotencyStore();
        const processEvent = vi.fn(async () => undefined);

        await handlePaystackWebhook(signature, webhookBody, {
            idempotencyStore,
            processEvent,
        });
        await handlePaystackWebhook(signature, webhookBody, {
            idempotencyStore,
            processEvent,
        });

        expect(processEvent).toHaveBeenCalledTimes(1);
    });

    it('still processes refund.processed after charge.success on the same reference', async () => {
        const charge = JSON.stringify({
            event: 'charge.success',
            data: { reference: 'shared-ref', status: 'success', amount: 100, currency: 'KES' },
        });
        const refund = JSON.stringify({
            event: 'refund.processed',
            data: { transaction_reference: 'shared-ref', amount: 100 },
        });
        const store = new TestIdempotencyStore();
        const processEvent = vi.fn(async () => undefined);

        await handlePaystackWebhook(sign('whsec_test_secret', charge), charge, {
            idempotencyStore: store,
            processEvent,
        });
        await handlePaystackWebhook(sign('whsec_test_secret', refund), refund, {
            idempotencyStore: store,
            processEvent,
        });

        expect(processEvent).toHaveBeenCalledTimes(2);
        const secondEvent = processEvent.mock.calls.at(1)?.at(0) as { event?: string } | undefined;
        expect(secondEvent?.event).toBe('refund.processed');
    });
});

describe('resolveWebhookReference', () => {
    it('falls back to transaction_reference then transaction.reference', () => {
        expect(
            resolveWebhookReference({
                event: 'refund.processed',
                data: { transaction_reference: 'txn_ref', amount: 1, currency: 'KES', status: 'processed' },
            } as any)
        ).toBe('txn_ref');
        expect(
            resolveWebhookReference({
                event: 'refund.processed',
                data: { transaction: { reference: 'nested_ref' }, amount: 1, currency: 'KES', status: 'processed' },
            } as any)
        ).toBe('nested_ref');
        expect(
            resolveWebhookReference({
                event: 'refund.processed',
                data: { amount: 1, currency: 'KES', status: 'processed' },
            } as any)
        ).toBeNull();
    });
});

describe('handlePaystackWebhookRequest', () => {
    const originalSecret = process.env.PAYSTACK_WEBHOOK_SECRET;

    beforeEach(() => {
        process.env.PAYSTACK_WEBHOOK_SECRET = 'whsec_test_secret';
    });

    afterEach(() => {
        process.env.PAYSTACK_WEBHOOK_SECRET = originalSecret;
    });

    const mockRes = () => {
        const res: any = {};
        res.status = vi.fn(() => res);
        res.send = vi.fn(() => res);
        return res;
    };

    it('returns 200 for a signed charge.success', async () => {
        const res = mockRes();
        const processEvent = vi.fn(async () => undefined);
        await handlePaystackWebhookRequest(
            {
                headers: { 'x-paystack-signature': sign('whsec_test_secret', webhookBody) },
                body: Buffer.from(webhookBody),
            } as any,
            res,
            { processEvent, idempotencyStore: new TestIdempotencyStore() }
        );

        expect(res.status).toHaveBeenCalledWith(200);
        expect(res.send).toHaveBeenCalledWith('OK');
        expect(processEvent).toHaveBeenCalledTimes(1);
    });

    it('returns 401 for a bad or missing signature', async () => {
        const bad = mockRes();
        await handlePaystackWebhookRequest(
            {
                headers: { 'x-paystack-signature': 'nope' },
                body: Buffer.from(webhookBody),
            } as any,
            bad
        );
        expect(bad.status).toHaveBeenCalledWith(401);

        const missing = mockRes();
        await handlePaystackWebhookRequest(
            { headers: {}, body: Buffer.from(webhookBody) } as any,
            missing
        );
        expect(missing.status).toHaveBeenCalledWith(401);
    });

    it('returns 400 when no reference can be resolved', async () => {
        const body = JSON.stringify({ event: 'refund.processed', data: { amount: 1 } });
        const res = mockRes();
        await handlePaystackWebhookRequest(
            {
                headers: { 'x-paystack-signature': sign('whsec_test_secret', body) },
                body: Buffer.from(body),
            } as any,
            res
        );
        expect(res.status).toHaveBeenCalledWith(400);
    });
});

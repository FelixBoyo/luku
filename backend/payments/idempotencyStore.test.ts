import { describe, expect, it, vi, beforeEach } from 'vitest';
import { DbIdempotencyStore, buildWebhookIdempotencyKey } from './idempotencyStore';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

const chainable = (result: { data: any; error: any }) => {
    const builder: any = {};
    builder.select = vi.fn(() => builder);
    builder.insert = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = (onfulfilled: any, onrejected?: any) =>
        Promise.resolve(result).then(onfulfilled, onrejected);
    return builder;
};

describe('DbIdempotencyStore', () => {
    let mockSupabase: any;
    let store: DbIdempotencyStore;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = { from: vi.fn() };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
        store = new DbIdempotencyStore();
    });

    describe('hasProcessed', () => {
        it('returns false when no row exists for the key', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: null, error: null })
            );

            await expect(store.hasProcessed('paystack:ref_1')).resolves.toBe(false);
        });

        it('returns true when a row exists — survives across "restarts" since nothing is in-memory', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: { key: 'paystack:ref_1' }, error: null })
            );

            await expect(store.hasProcessed('paystack:ref_1')).resolves.toBe(true);
        });

        it('propagates a Supabase read error', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: null, error: { message: 'db unreachable' } })
            );

            await expect(store.hasProcessed('paystack:ref_1')).rejects.toThrow('db unreachable');
        });
    });

    describe('markProcessed', () => {
        const record = {
            provider: 'paystack',
            reference: 'ref_1',
            eventType: 'charge.success',
            processedAt: '2026-08-07T00:00:00.000Z',
        };

        it('inserts a row keyed by the idempotency key', async () => {
            let insertBuilder: any;
            mockSupabase.from.mockImplementationOnce(() => {
                insertBuilder = chainable({ data: null, error: null });
                return insertBuilder;
            });

            await store.markProcessed('paystack:ref_1', record);

            expect(insertBuilder.insert).toHaveBeenCalledWith({
                key: 'paystack:ref_1',
                provider: 'paystack',
                reference: 'ref_1',
                event_type: 'charge.success',
                processed_at: record.processedAt,
            });
        });

        it('treats a duplicate-key race as success, not a failure', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: null, error: { code: '23505', message: 'duplicate key' } })
            );

            await expect(store.markProcessed('paystack:ref_1', record)).resolves.toBeUndefined();
        });

        it('propagates a non-duplicate-key insert error', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: null, error: { code: '42501', message: 'permission denied' } })
            );

            await expect(store.markProcessed('paystack:ref_1', record)).rejects.toThrow(
                'permission denied'
            );
        });
    });

    it('builds provider:reference keys', () => {
        expect(buildWebhookIdempotencyKey('paystack', 'ref_1')).toBe('paystack:ref_1');
        expect(buildWebhookIdempotencyKey('paystack', 'ref_1', 'charge.success')).toBe(
            'paystack:ref_1'
        );
        expect(buildWebhookIdempotencyKey('paystack', 'ref_1', 'refund.processed')).toBe(
            'paystack:refund.processed:ref_1'
        );
    });
});

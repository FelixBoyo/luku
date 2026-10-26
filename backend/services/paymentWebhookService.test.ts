import { describe, expect, it, vi, beforeEach } from 'vitest';
import { processPaystackChargeSuccess } from './paymentWebhookService';
import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { transitionOrder, OrderNotFoundError, IllegalOrderTransitionError } from './orderStateMachine';
import type { PaystackWebhookEvent } from '../handlers/webhooks/paystack';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

vi.mock('./orderStateMachine', async () => {
    const actual = await vi.importActual<typeof import('./orderStateMachine')>(
        './orderStateMachine'
    );
    return {
        ...actual,
        transitionOrder: vi.fn(),
    };
});

const chainable = (result: { data: any; error: any }) => {
    const builder: any = {};
    builder.select = vi.fn(() => builder);
    builder.update = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = (onfulfilled: any, onrejected?: any) =>
        Promise.resolve(result).then(onfulfilled, onrejected);
    return builder;
};

const chargeSuccessEvent = (overrides: Partial<PaystackWebhookEvent['data']> = {}): PaystackWebhookEvent => ({
    event: 'charge.success',
    data: {
        reference: 'pi_test_123',
        status: 'success',
        amount: 150000,
        currency: 'KES',
        channel: 'mobile_money',
        ...overrides,
    },
});

describe('processPaystackChargeSuccess', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = { from: vi.fn() };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
        vi.mocked(transitionOrder).mockResolvedValue(undefined);
    });

    it('ignores non-charge.success events without touching the database', async () => {
        await processPaystackChargeSuccess({
            event: 'charge.failed',
            data: { reference: 'pi_test', status: 'failed', amount: 100, currency: 'KES' },
        });

        expect(mockSupabase.from).not.toHaveBeenCalled();
        expect(transitionOrder).not.toHaveBeenCalled();
    });

    it('updates an existing payment row and maps mobile_money to mpesa', async () => {
        let updateBuilder: any;
        mockSupabase.from
            .mockImplementationOnce(() =>
                chainable({ data: { id: 'pay_1' }, error: null })
            )
            .mockImplementationOnce(() => {
                updateBuilder = chainable({ data: null, error: null });
                return updateBuilder;
            });

        await processPaystackChargeSuccess(chargeSuccessEvent());

        expect(updateBuilder.update).toHaveBeenCalledWith(
            expect.objectContaining({
                status: 'success',
                amount_minor: 150000,
                currency: 'KES',
                channel: 'mpesa',
            })
        );
        expect(updateBuilder.eq).toHaveBeenCalledWith('id', 'pay_1');
    });

    it('maps the card channel through untouched', async () => {
        let updateBuilder: any;
        mockSupabase.from
            .mockImplementationOnce(() => chainable({ data: { id: 'pay_1' }, error: null }))
            .mockImplementationOnce(() => {
                updateBuilder = chainable({ data: null, error: null });
                return updateBuilder;
            });

        await processPaystackChargeSuccess(chargeSuccessEvent({ channel: 'card' }));

        expect(updateBuilder.update).toHaveBeenCalledWith(
            expect.objectContaining({ channel: 'card' })
        );
    });

    it('warns and skips the payment write when no payment row exists yet', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({ data: null, error: null })
        );

        await expect(processPaystackChargeSuccess(chargeSuccessEvent())).resolves.toBeUndefined();

        // Only the lookup ran — no update attempted without a row to update.
        expect(mockSupabase.from).toHaveBeenCalledTimes(1);
        expect(transitionOrder).toHaveBeenCalledWith({
            orderId: 'pi_test_123',
            toStatus: 'paid',
            actor: 'webhook',
        });
    });

    it('chains paid -> in_escrow through the state machine', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => chainable({ data: { id: 'pay_1' }, error: null }))
            .mockImplementationOnce(() => chainable({ data: null, error: null }));

        await processPaystackChargeSuccess(chargeSuccessEvent());

        expect(transitionOrder).toHaveBeenNthCalledWith(1, {
            orderId: 'pi_test_123',
            toStatus: 'paid',
            actor: 'webhook',
        });
        expect(transitionOrder).toHaveBeenNthCalledWith(2, {
            orderId: 'pi_test_123',
            toStatus: 'in_escrow',
            actor: 'system',
        });
    });

    it('still promotes to in_escrow when the order was already paid via createOrder', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => chainable({ data: { id: 'pay_1' }, error: null }))
            .mockImplementationOnce(() => chainable({ data: null, error: null }));
        // paid -> paid is rejected; the in_escrow step must still run.
        vi.mocked(transitionOrder).mockRejectedValueOnce(
            new IllegalOrderTransitionError('paid', 'paid')
        );

        await expect(processPaystackChargeSuccess(chargeSuccessEvent())).resolves.toBeUndefined();

        expect(transitionOrder).toHaveBeenCalledTimes(2);
        expect(transitionOrder).toHaveBeenNthCalledWith(2, {
            orderId: 'pi_test_123',
            toStatus: 'in_escrow',
            actor: 'system',
        });
    });

    it('propagates a payment lookup error', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({ data: null, error: { message: 'db unreachable' } })
        );

        await expect(processPaystackChargeSuccess(chargeSuccessEvent())).rejects.toThrow(
            'db unreachable'
        );
    });

    it('propagates a payment update error', async () => {
        mockSupabase.from
            .mockImplementationOnce(() => chainable({ data: { id: 'pay_1' }, error: null }))
            .mockImplementationOnce(() =>
                chainable({ data: null, error: { message: 'update failed' } })
            );

        await expect(processPaystackChargeSuccess(chargeSuccessEvent())).rejects.toThrow(
            'update failed'
        );
    });

    it('swallows OrderNotFoundError from the state machine as an expected race', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({ data: { id: 'pay_1' }, error: null })
        );
        mockSupabase.from.mockImplementationOnce(() => chainable({ data: null, error: null }));
        vi.mocked(transitionOrder).mockRejectedValueOnce(
            new OrderNotFoundError('Order "pi_test_123" not found.')
        );

        await expect(processPaystackChargeSuccess(chargeSuccessEvent())).resolves.toBeUndefined();
    });

    it('swallows IllegalOrderTransitionError — order already paid via the create-order RPC', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({ data: { id: 'pay_1' }, error: null })
        );
        mockSupabase.from.mockImplementationOnce(() => chainable({ data: null, error: null }));
        vi.mocked(transitionOrder).mockRejectedValueOnce(
            new IllegalOrderTransitionError('paid', 'paid')
        );

        await expect(processPaystackChargeSuccess(chargeSuccessEvent())).resolves.toBeUndefined();
    });

    it('propagates unexpected errors from the state machine', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({ data: { id: 'pay_1' }, error: null })
        );
        mockSupabase.from.mockImplementationOnce(() => chainable({ data: null, error: null }));
        vi.mocked(transitionOrder).mockRejectedValueOnce(new Error('unexpected db failure'));

        await expect(processPaystackChargeSuccess(chargeSuccessEvent())).rejects.toThrow(
            'unexpected db failure'
        );
    });
});

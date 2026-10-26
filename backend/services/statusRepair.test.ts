import { describe, expect, it, vi, beforeEach } from 'vitest';
import { statusRepairPort } from './statusRepair';
import {
    transitionOrder,
    OrderNotFoundError,
    IllegalOrderTransitionError,
} from './orderStateMachine';

vi.mock('./orderStateMachine', async () => {
    const actual = await vi.importActual<typeof import('./orderStateMachine')>('./orderStateMachine');
    return { ...actual, transitionOrder: vi.fn() };
});

const input = (reference = 'pi_test_1') => ({
    reference,
    amountMinor: 150000,
    currency: 'KES',
    paidAt: '2026-08-31T00:00:00.000Z',
    raw: { provider: 'paystack' },
});

describe('statusRepairPort.markPaidFromProvider', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(transitionOrder).mockResolvedValue(undefined);
    });

    it('chains paid -> in_escrow for a stranded order and reports ok', async () => {
        const result = await statusRepairPort.markPaidFromProvider(input());

        expect(result).toEqual({ ok: true });
        expect(transitionOrder).toHaveBeenNthCalledWith(1, {
            orderId: 'pi_test_1',
            toStatus: 'paid',
            actor: 'webhook',
        });
        expect(transitionOrder).toHaveBeenNthCalledWith(2, {
            orderId: 'pi_test_1',
            toStatus: 'in_escrow',
            actor: 'system',
        });
    });

    it('still promotes to in_escrow when the order was already paid', async () => {
        vi.mocked(transitionOrder).mockRejectedValueOnce(
            new IllegalOrderTransitionError('paid', 'paid')
        );

        const result = await statusRepairPort.markPaidFromProvider(input());

        expect(result).toEqual({ ok: true });
        expect(transitionOrder).toHaveBeenCalledTimes(2);
        expect(transitionOrder).toHaveBeenNthCalledWith(2, {
            orderId: 'pi_test_1',
            toStatus: 'in_escrow',
            actor: 'system',
        });
    });

    it('is a no-op ok when the order is already in escrow or beyond', async () => {
        vi.mocked(transitionOrder)
            .mockRejectedValueOnce(new IllegalOrderTransitionError('shipped', 'paid'))
            .mockRejectedValueOnce(new IllegalOrderTransitionError('shipped', 'in_escrow'));

        await expect(statusRepairPort.markPaidFromProvider(input())).resolves.toEqual({ ok: true });
    });

    it('reports order_not_found when no order exists (never invents one)', async () => {
        vi.mocked(transitionOrder).mockRejectedValueOnce(
            new OrderNotFoundError('Order "pi_test_1" not found.')
        );

        const result = await statusRepairPort.markPaidFromProvider(input());

        expect(result).toEqual({ ok: false, reason: 'order_not_found' });
        // No second attempt once the order is known to be absent.
        expect(transitionOrder).toHaveBeenCalledTimes(1);
    });

    it('propagates an unexpected error from the state machine', async () => {
        vi.mocked(transitionOrder).mockRejectedValueOnce(new Error('supabase down'));

        await expect(statusRepairPort.markPaidFromProvider(input())).rejects.toThrow('supabase down');
    });
});

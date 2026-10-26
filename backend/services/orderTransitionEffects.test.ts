import { describe, expect, it, vi, beforeEach } from 'vitest';
import { runTransitionEffects } from './orderTransitionEffects';
import { transitionOrder } from './orderStateMachine';
import { payoutOnRelease } from '../payments/payout';
import { refundOrder } from '../payments/refund';
import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { safeLogger } from '../http/redact';

vi.mock('./orderStateMachine', () => {
    class OrderNotFoundError extends Error {}
    class IllegalOrderTransitionError extends Error {
        constructor(
            public from: string,
            public to: string
        ) {
            super(`Cannot transition order from "${from}" to "${to}".`);
            this.name = 'IllegalOrderTransitionError';
        }
    }
    return {
        transitionOrder: vi.fn().mockResolvedValue(undefined),
        OrderNotFoundError,
        IllegalOrderTransitionError,
    };
});

vi.mock('../payments/payout', () => ({
    payoutOnRelease: vi.fn().mockResolvedValue({
        status: 'success',
        transferCode: 'TRF_1',
        payoutMinor: 900,
        commissionMinor: 100,
    }),
}));

vi.mock('../payments/refund', () => ({
    refundOrder: vi.fn().mockResolvedValue({
        status: 'processed',
        refundReference: 'rfd_1',
        amountMinor: 1160,
    }),
}));

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

vi.mock('../http/redact', () => ({
    safeLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

const chainable = (result: { data: any; error: any }) => {
    const builder: any = {};
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.not = vi.fn(() => builder);
    builder.limit = vi.fn(() => builder);
    builder.update = vi.fn(() => builder);
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    builder.then = (onfulfilled: any, onrejected?: any) =>
        Promise.resolve(result).then(onfulfilled, onrejected);
    return builder;
};

const mockFromByTable = (tables: Record<string, { data: any; error: any }>) => {
    return (table: string) => chainable(tables[table] ?? { data: null, error: null });
};

describe('runTransitionEffects', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = { from: vi.fn() };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
        vi.mocked(transitionOrder).mockResolvedValue(undefined);
    });

    it('on delivered, drives system released (D1 confirm → release)', async () => {
        await runTransitionEffects('pi_test', 'delivered');

        expect(transitionOrder).toHaveBeenCalledWith({
            orderId: 'pi_test',
            toStatus: 'released',
            actor: 'system',
        });
        expect(payoutOnRelease).not.toHaveBeenCalled();
    });

    it('on released, pays out the line-item subtotal not amount_minor', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({
                data: [
                    {
                        seller_id: 'biz_1',
                        seller_user_id: null,
                        total_price: 10,
                    },
                    {
                        seller_id: 'biz_1',
                        seller_user_id: null,
                        total_price: 5,
                    },
                ],
                error: null,
            })
        );

        await runTransitionEffects('pi_test', 'released');
        await vi.waitFor(() => {
            expect(payoutOnRelease).toHaveBeenCalledWith({
                orderId: 'pi_test',
                seller_id: 'biz_1',
                seller_user_id: null,
                itemPriceMinor: 1500,
            });
        });
    });

    it('on cancelled, refunds the captured amount then moves to refunded', async () => {
        mockSupabase.from.mockImplementation(
            mockFromByTable({
                payments: { data: { reference: 'pi_test', amount_minor: 1740 }, error: null },
                orders: { data: { listing_id: 'listing_1' }, error: null },
                listings: { data: null, error: null },
            })
        );

        await runTransitionEffects('pi_test', 'cancelled');

        expect(refundOrder).toHaveBeenCalledWith({
            orderId: 'pi_test',
            paymentReference: 'pi_test',
            amountPaidMinor: 1740,
        });
        expect(transitionOrder).toHaveBeenCalledWith({
            orderId: 'pi_test',
            toStatus: 'refunded',
            actor: 'system',
        });
    });

    it('leaves the order cancelled when the Paystack refund fails', async () => {
        mockSupabase.from.mockImplementation(
            mockFromByTable({
                payments: { data: { reference: 'pi_test', amount_minor: 1740 }, error: null },
                orders: { data: { listing_id: 'listing_1' }, error: null },
                listings: { data: null, error: null },
            })
        );
        vi.mocked(refundOrder).mockRejectedValueOnce(new Error('Insufficient balance'));

        await runTransitionEffects('pi_test', 'cancelled');

        expect(transitionOrder).not.toHaveBeenCalled();
        expect(safeLogger.info).toHaveBeenCalledWith(
            '[Escrow] LISTING_RELISTED',
            expect.objectContaining({ orderId: 'pi_test', listingId: 'listing_1' })
        );
    });

    it('does not throw when payout fails', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({
                data: [{ seller_id: 'biz_1', seller_user_id: null, total_price: 10 }],
                error: null,
            })
        );
        vi.mocked(payoutOnRelease).mockRejectedValueOnce(new Error('no recipient'));

        await expect(runTransitionEffects('pi_test', 'released')).resolves.toBeUndefined();
        await vi.waitFor(() => {
            expect(payoutOnRelease).toHaveBeenCalled();
        });
    });

    it('returns before payoutOnRelease settles', async () => {
        let finishPayout = () => {};
        vi.mocked(payoutOnRelease).mockImplementation(
            () =>
                new Promise((resolve) => {
                    finishPayout = () =>
                        resolve({
                            status: 'success',
                            transferCode: 'TRF_1',
                            payoutMinor: 900,
                            commissionMinor: 100,
                        });
                })
        );
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({
                data: [{ seller_id: 'biz_1', seller_user_id: null, total_price: 10 }],
                error: null,
            })
        );

        await expect(runTransitionEffects('pi_test', 'released')).resolves.toBeUndefined();
        await vi.waitFor(() => {
            expect(payoutOnRelease).toHaveBeenCalled();
        });

        finishPayout();
    });

    it('on disputed, logs DISPUTE_OPENED and does not refund or pay out', async () => {
        mockSupabase.from.mockImplementationOnce(() =>
            chainable({
                data: [
                    {
                        buyer_id: 'buyer_1',
                        seller_id: 'biz_1',
                        seller_user_id: 'seller_1',
                        total_price: 10,
                    },
                ],
                error: null,
            })
        );

        await runTransitionEffects('pi_test', 'disputed');

        expect(safeLogger.warn).toHaveBeenCalledWith('[Escrow] DISPUTE_OPENED', {
            orderId: 'pi_test',
            buyerId: 'buyer_1',
            sellerUserId: 'seller_1',
        });
        expect(refundOrder).not.toHaveBeenCalled();
        expect(payoutOnRelease).not.toHaveBeenCalled();
        expect(transitionOrder).not.toHaveBeenCalled();
    });

    it('relists a Sold peer listing after a buyer-win refund', async () => {
        let listingBuilder: any;
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                return chainable({ data: { listing_id: 'listing_1' }, error: null });
            }
            listingBuilder = chainable({ data: null, error: null });
            return listingBuilder;
        });

        await runTransitionEffects('pi_test', 'refunded');

        expect(listingBuilder.update).toHaveBeenCalledWith(
            expect.objectContaining({ status: 'Active' })
        );
        expect(listingBuilder.eq).toHaveBeenCalledWith('id', 'listing_1');
        expect(listingBuilder.eq).toHaveBeenCalledWith('status', 'Sold');
        expect(safeLogger.info).toHaveBeenCalledWith(
            '[Escrow] LISTING_RELISTED',
            expect.objectContaining({ orderId: 'pi_test', listingId: 'listing_1' })
        );
    });

    it('skips relist for catalog orders with no listing_id', async () => {
        const listingFrom = vi.fn();
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'listings') {
                listingFrom();
            }
            return chainable({ data: { listing_id: null }, error: null });
        });

        await runTransitionEffects('pi_catalog', 'refunded');

        expect(listingFrom).not.toHaveBeenCalled();
        expect(safeLogger.info).not.toHaveBeenCalledWith(
            '[Escrow] LISTING_RELISTED',
            expect.anything()
        );
    });
});

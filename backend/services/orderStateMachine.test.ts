import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    transitionOrder,
    markOrderShipped,
    confirmOrderDelivery,
    reportOrderProblem,
    OrderNotFoundError,
    IllegalOrderTransitionError,
    UnauthorizedOrderTransitionError,
    timeTransitionStep,
    SLOW_TRANSITION_STEP_MS,
} from './orderStateMachine';
import { runTransitionEffects } from './orderTransitionEffects';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

vi.mock('./orderTransitionEffects', () => ({
    runTransitionEffects: vi.fn().mockResolvedValue(undefined),
}));

/** One mock query-builder result, chainable through select/update/eq/maybeSingle. */
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

const orderRow = (overrides: Record<string, any> = {}) => ({
    id: 'row_1',
    status: 'paid',
    buyer_id: 'buyer_1',
    seller_id: 'business_1',
    seller_user_id: null,
    ...overrides,
});

describe('orderStateMachine', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = { from: vi.fn() };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    describe('seller -> shipped', () => {
        it('ships a paid catalog order for the owning business seller', async () => {
            mockSupabase.from
                .mockImplementationOnce(() => chainable({ data: [orderRow()], error: null })) // read
                .mockImplementationOnce(() =>
                    chainable({ data: { user_id: 'seller_1' }, error: null })
                ) // business_accounts lookup
                .mockImplementationOnce(() =>
                    chainable({ data: [{ id: 'row_1' }], error: null })
                ); // update

            await expect(
                markOrderShipped('pi_test', 'seller_1')
            ).resolves.toBeUndefined();

            expect(mockSupabase.from).toHaveBeenCalledTimes(3);
        });

        it('ships an in_escrow peer listing order for the owning peer seller', async () => {
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({
                        data: [
                            orderRow({
                                status: 'in_escrow',
                                seller_id: null,
                                seller_user_id: 'peer_seller_1',
                            }),
                        ],
                        error: null,
                    })
                )
                .mockImplementationOnce(() =>
                    chainable({ data: [{ id: 'row_1' }], error: null })
                );

            await expect(
                markOrderShipped('pi_peer', 'peer_seller_1')
            ).resolves.toBeUndefined();

            // No business_accounts lookup for a peer seller.
            expect(mockSupabase.from).toHaveBeenCalledTimes(2);
        });

        it('stamps auto_release_at when the seller ships', async () => {
            let updateBuilder: any;
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({
                        data: [
                            orderRow({
                                status: 'in_escrow',
                                seller_id: null,
                                seller_user_id: 'peer_seller_1',
                            }),
                        ],
                        error: null,
                    })
                )
                .mockImplementationOnce(() => {
                    updateBuilder = chainable({ data: [{ id: 'row_1' }], error: null });
                    return updateBuilder;
                });

            await markOrderShipped('pi_peer', 'peer_seller_1');

            expect(updateBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({
                    status: 'shipped',
                    auto_release_at: expect.any(String),
                })
            );
            expect(runTransitionEffects).toHaveBeenCalledWith('pi_peer', 'shipped');
        });

        it('rejects a buyer attempting to ship as an illegal transition, not a permission error', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: [orderRow()], error: null })
            );

            await expect(
                transitionOrder({ orderId: 'pi_test', toStatus: 'shipped', actor: 'buyer', userId: 'buyer_1' })
            ).rejects.toThrow(IllegalOrderTransitionError);
        });

        it('rejects a business seller who does not own the order', async () => {
            mockSupabase.from
                .mockImplementationOnce(() => chainable({ data: [orderRow()], error: null }))
                .mockImplementationOnce(() =>
                    chainable({ data: { user_id: 'seller_1' }, error: null })
                );

            await expect(markOrderShipped('pi_test', 'someone_else')).rejects.toThrow(
                UnauthorizedOrderTransitionError
            );
        });

        it('rejects a peer seller who does not own the order', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({
                    data: [orderRow({ seller_id: null, seller_user_id: 'peer_seller_1' })],
                    error: null,
                })
            );

            await expect(markOrderShipped('pi_peer', 'someone_else')).rejects.toThrow(
                UnauthorizedOrderTransitionError
            );
        });
    });

    describe('buyer -> delivered', () => {
        it('confirms delivery for the owning buyer', async () => {
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({ data: [orderRow({ status: 'shipped' })], error: null })
                )
                .mockImplementationOnce(() =>
                    chainable({ data: [{ id: 'row_1' }], error: null })
                );

            await expect(confirmOrderDelivery('pi_test', 'buyer_1')).resolves.toBeUndefined();
            expect(runTransitionEffects).toHaveBeenCalledWith('pi_test', 'delivered');
        });

        it('rejects confirming delivery before the order has shipped', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: [orderRow({ status: 'paid' })], error: null })
            );

            await expect(confirmOrderDelivery('pi_test', 'buyer_1')).rejects.toThrow(
                IllegalOrderTransitionError
            );
        });

        it('rejects a non-owning buyer', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: [orderRow({ status: 'shipped' })], error: null })
            );

            await expect(confirmOrderDelivery('pi_test', 'someone_else')).rejects.toThrow(
                UnauthorizedOrderTransitionError
            );
        });

        it('rejects the seller attempting to confirm their own delivery', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: [orderRow({ status: 'shipped' })], error: null })
            );

            await expect(
                transitionOrder({
                    orderId: 'pi_test',
                    toStatus: 'delivered',
                    actor: 'seller',
                    userId: 'business_1',
                })
            ).rejects.toThrow(IllegalOrderTransitionError);
        });
    });

    describe('buyer -> disputed', () => {
        it('reports a problem while in escrow (pre-shipment)', async () => {
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({ data: [orderRow({ status: 'in_escrow' })], error: null })
                )
                .mockImplementationOnce(() =>
                    chainable({ data: [{ id: 'row_1' }], error: null })
                );

            await expect(reportOrderProblem('pi_test', 'buyer_1')).resolves.toBeUndefined();
        });

        it('reports a problem after shipment', async () => {
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({ data: [orderRow({ status: 'shipped' })], error: null })
                )
                .mockImplementationOnce(() =>
                    chainable({ data: [{ id: 'row_1' }], error: null })
                );

            await expect(reportOrderProblem('pi_test', 'buyer_1')).resolves.toBeUndefined();
        });

        it('rejects reporting a problem on an already-delivered order', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: [orderRow({ status: 'delivered' })], error: null })
            );

            await expect(reportOrderProblem('pi_test', 'buyer_1')).rejects.toThrow(
                IllegalOrderTransitionError
            );
        });
    });

    describe('system / webhook transitions', () => {
        it('allows the webhook to move pending_payment -> paid without a userId', async () => {
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({ data: [orderRow({ status: 'pending_payment' })], error: null })
                )
                .mockImplementationOnce(() =>
                    chainable({ data: [{ id: 'row_1' }], error: null })
                );

            await expect(
                transitionOrder({ orderId: 'pi_test', toStatus: 'paid', actor: 'webhook' })
            ).resolves.toBeUndefined();
        });

        it('rejects a buyer trying to drive the paid transition', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: [orderRow({ status: 'pending_payment' })], error: null })
            );

            await expect(
                transitionOrder({
                    orderId: 'pi_test',
                    toStatus: 'paid',
                    actor: 'buyer',
                    userId: 'buyer_1',
                })
            ).rejects.toThrow(IllegalOrderTransitionError);
        });

        it('allows system to release funds after delivery', async () => {
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({ data: [orderRow({ status: 'delivered' })], error: null })
                )
                .mockImplementationOnce(() =>
                    chainable({ data: [{ id: 'row_1' }], error: null })
                );

            await expect(
                transitionOrder({ orderId: 'pi_test', toStatus: 'released', actor: 'system' })
            ).resolves.toBeUndefined();
            expect(runTransitionEffects).toHaveBeenCalledWith('pi_test', 'released');
        });

        it('allows system to auto-release from shipped (D2)', async () => {
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({ data: [orderRow({ status: 'shipped' })], error: null })
                )
                .mockImplementationOnce(() =>
                    chainable({ data: [{ id: 'row_1' }], error: null })
                );

            await expect(
                transitionOrder({ orderId: 'pi_test', toStatus: 'released', actor: 'system' })
            ).resolves.toBeUndefined();
        });
    });

    describe('guardrails', () => {
        it('throws OrderNotFoundError when no rows match the order id', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: [], error: null })
            );

            await expect(confirmOrderDelivery('pi_missing', 'buyer_1')).rejects.toThrow(
                OrderNotFoundError
            );
        });

        it('rejects buyer/seller actors missing a userId before any query runs', async () => {
            await expect(
                transitionOrder({ orderId: 'pi_test', toStatus: 'delivered', actor: 'buyer' })
            ).rejects.toThrow(UnauthorizedOrderTransitionError);

            expect(mockSupabase.from).not.toHaveBeenCalled();
        });

        it('treats a lost race (0 rows updated) as an illegal transition', async () => {
            mockSupabase.from
                .mockImplementationOnce(() =>
                    chainable({ data: [orderRow({ status: 'shipped' })], error: null })
                )
                // Another writer already moved it; compare-and-swap matches 0 rows.
                .mockImplementationOnce(() => chainable({ data: [], error: null }));

            await expect(confirmOrderDelivery('pi_test', 'buyer_1')).rejects.toThrow(
                IllegalOrderTransitionError
            );
        });

        it('propagates a Supabase read error', async () => {
            mockSupabase.from.mockImplementationOnce(() =>
                chainable({ data: null, error: { message: 'db unreachable' } })
            );

            await expect(confirmOrderDelivery('pi_test', 'buyer_1')).rejects.toThrow(
                'db unreachable'
            );
        });

        it('transitions every row sharing the order id in one update', async () => {
            const rows = [
                orderRow({ id: 'row_1', status: 'shipped' }),
                orderRow({ id: 'row_2', status: 'shipped' }),
            ];
            let updateBuilder: any;

            mockSupabase.from
                .mockImplementationOnce(() => chainable({ data: rows, error: null }))
                .mockImplementationOnce(() => {
                    updateBuilder = chainable({
                        data: [{ id: 'row_1' }, { id: 'row_2' }],
                        error: null,
                    });
                    return updateBuilder;
                });

            await confirmOrderDelivery('pi_multi_item', 'buyer_1');

            expect(updateBuilder.update).toHaveBeenCalledWith(
                expect.objectContaining({ status: 'delivered' })
            );
            expect(updateBuilder.eq).toHaveBeenCalledWith('stripe_payment_intent_id', 'pi_multi_item');
        });
    });

    describe('timeTransitionStep', () => {
        it('warns with the step label when a step runs long, and still returns its value', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            const clock = [0, SLOW_TRANSITION_STEP_MS + 50];
            const value = await timeTransitionStep('update status', 'pi_slow', async () => 'ok', () =>
                clock.shift()!
            );

            expect(value).toBe('ok');
            expect(warn).toHaveBeenCalledWith(
                expect.stringContaining('slow step "update status" for pi_slow')
            );
            warn.mockRestore();
        });

        it('stays quiet for fast steps and rethrows failures', async () => {
            const warn = vi.spyOn(console, 'warn').mockImplementation(() => {});
            await expect(
                timeTransitionStep('read order', 'pi_fast', async () => {
                    throw new Error('boom');
                }, () => 0)
            ).rejects.toThrow('boom');

            expect(warn).not.toHaveBeenCalled();
            warn.mockRestore();
        });
    });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { processEscrowTimers } from './timersService';
import { transitionOrder } from './orderStateMachine';
import { getSupabaseAdmin, resetSupabaseAdmin } from '../data/supabaseAdmin';
import { sendPushNotification } from './pushService';

vi.mock('./orderStateMachine', () => ({
    transitionOrder: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
    resetSupabaseAdmin: vi.fn(),
    isSupabaseFetchFailed: (error: unknown) => {
        if (error == null) return false;
        if (typeof error === 'string') return /fetch failed/i.test(error);
        const record = error as { message?: unknown; details?: unknown };
        return (
            /fetch failed/i.test(String(record.message ?? '')) ||
            /fetch failed/i.test(String(record.details ?? ''))
        );
    },
}));

vi.mock('../http/redact', () => ({
    safeLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

vi.mock('../payments/escrowPolicy', () => ({
    getEscrowPolicy: () => ({
        sellerReminderDays: [2],
        buyerReminderDays: [3, 6],
        autoReleaseDays: 7,
        shipByDays: 3,
        commissionRate: 0.1,
        vatRate: 0.16,
    }),
}));

vi.mock('./pushService', () => ({
    sendPushNotification: vi.fn().mockResolvedValue(undefined),
}));

const daysAgo = (days: number): string =>
    new Date(Date.now() - (days * 24 * 60 * 60 * 1000 + 5000)).toISOString();

const chainable = (result: { data: any; error: any }) => {
    const builder: any = {};
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.not = vi.fn(() => builder);
    builder.lt = vi.fn(() => builder);
    builder.like = vi.fn(() => builder);
    builder.limit = vi.fn(() => builder);
    builder.insert = vi.fn(() => Promise.resolve(result));
    builder.then = (onfulfilled: any, onrejected?: any) =>
        Promise.resolve(result).then(onfulfilled, onrejected);
    return builder;
};

describe('processEscrowTimers', () => {
    let mockSupabase: any;
    let inserts: any[];

    beforeEach(() => {
        vi.clearAllMocks();
        inserts = [];
        mockSupabase = {
            from: vi.fn((table: string) => {
                if (table === 'notifications') {
                    const builder = chainable({ data: [], error: null });
                    builder.insert = vi.fn((row: any) => {
                        inserts.push(row);
                        return Promise.resolve({ data: row, error: null });
                    });
                    return builder;
                }
                return chainable({ data: [], error: null });
            }),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
        vi.mocked(transitionOrder).mockResolvedValue(undefined);
    });

    it('cancels in_escrow orders past ship_by_at', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                return chainable({
                    data: [
                        {
                            stripe_payment_intent_id: 'pi_late_ship',
                            ship_by_at: daysAgo(1),
                        },
                    ],
                    error: null,
                });
            }
            return chainable({ data: [], error: null });
        });
        // First from('orders') is in_escrow, second is shipped — distinguish by call order.
        let orderCalls = 0;
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                orderCalls += 1;
                if (orderCalls === 1) {
                    return chainable({
                        data: [
                            {
                                stripe_payment_intent_id: 'pi_late_ship',
                                ship_by_at: daysAgo(1),
                            },
                        ],
                        error: null,
                    });
                }
                return chainable({ data: [], error: null });
            }
            return chainable({ data: [], error: null });
        });

        await processEscrowTimers();

        expect(transitionOrder).toHaveBeenCalledWith({
            orderId: 'pi_late_ship',
            toStatus: 'cancelled',
            actor: 'system',
        });
    });

    it('auto-releases shipped orders past auto_release_at (D2), not delivered', async () => {
        let orderCalls = 0;
        let shippedBuilder: any;
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                orderCalls += 1;
                if (orderCalls === 1) {
                    return chainable({ data: [], error: null });
                }
                shippedBuilder = chainable({
                    data: [
                        {
                            stripe_payment_intent_id: 'pi_silent_buyer',
                            auto_release_at: daysAgo(1),
                        },
                    ],
                    error: null,
                });
                return shippedBuilder;
            }
            return chainable({ data: [], error: null });
        });

        await processEscrowTimers();

        expect(shippedBuilder.eq).toHaveBeenCalledWith('status', 'shipped');
        expect(transitionOrder).toHaveBeenCalledWith({
            orderId: 'pi_silent_buyer',
            toStatus: 'released',
            actor: 'system',
        });
    });

    it('dedupes multiple line rows sharing a payment reference', async () => {
        let orderCalls = 0;
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                orderCalls += 1;
                if (orderCalls === 1) {
                    return chainable({
                        data: [
                            { stripe_payment_intent_id: 'pi_multi', ship_by_at: daysAgo(1) },
                            { stripe_payment_intent_id: 'pi_multi', ship_by_at: daysAgo(1) },
                        ],
                        error: null,
                    });
                }
                return chainable({ data: [], error: null });
            }
            return chainable({ data: [], error: null });
        });

        await processEscrowTimers();

        expect(transitionOrder).toHaveBeenCalledTimes(1);
        expect(transitionOrder).toHaveBeenCalledWith({
            orderId: 'pi_multi',
            toStatus: 'cancelled',
            actor: 'system',
        });
    });

    it('resets the Supabase admin client when a timer query hits fetch failed', async () => {
        let orderCalls = 0;
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                orderCalls += 1;
                if (orderCalls === 1) {
                    return chainable({
                        data: null,
                        error: {
                            message: 'TypeError: fetch failed',
                            details: 'TypeError: fetch failed',
                        },
                    });
                }
                return chainable({ data: [], error: null });
            }
            return chainable({ data: [], error: null });
        });

        await processEscrowTimers();

        expect(resetSupabaseAdmin).toHaveBeenCalled();
        expect(transitionOrder).not.toHaveBeenCalled();
    });

    it('nudges the seller at day 2 and the buyer at days 3 and 6', async () => {
        let orderCalls = 0;
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                orderCalls += 1;
                if (orderCalls === 1) {
                    return chainable({
                        data: [
                            {
                                stripe_payment_intent_id: 'pi_seller',
                                seller_user_id: 'seller_1',
                                paid_at: daysAgo(2),
                                ship_by_at: new Date(Date.now() + 86_400_000).toISOString(),
                            },
                        ],
                        error: null,
                    });
                }
                return chainable({
                    data: [
                        {
                            stripe_payment_intent_id: 'pi_buyer',
                            buyer_id: 'buyer_1',
                            shipped_at: daysAgo(7),
                            auto_release_at: new Date(Date.now() + 86_400_000).toISOString(),
                        },
                    ],
                    error: null,
                });
            }
            const builder = chainable({ data: [], error: null });
            builder.insert = vi.fn((row: any) => {
                inserts.push(row);
                return Promise.resolve({ data: row, error: null });
            });
            return builder;
        });

        await processEscrowTimers();

        expect(inserts.map((row) => row.title)).toEqual([
            'Shipping Reminder',
            'Confirm Receipt Reminder',
            'Confirm Receipt Reminder',
        ]);
        expect(inserts.map((row) => row.body)).toEqual([
            "Don't forget to ship order pi_seller! It has been 2 days since payment.",
            'Your order pi_buyer has been marked shipped for 3 days. Please confirm receipt if it has arrived.',
            'Your order pi_buyer has been marked shipped for 6 days. Please confirm receipt if it has arrived.',
        ]);
        expect(inserts.every((row) => !/\[(buyer|seller):d\d+\]/.test(row.body))).toBe(true);
        expect(sendPushNotification).toHaveBeenCalledTimes(3);
        expect(transitionOrder).not.toHaveBeenCalled();
    });

    it('does not re-send a reminder that already exists', async () => {
        let orderCalls = 0;
        let notificationBuilder: any;
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'orders') {
                orderCalls += 1;
                if (orderCalls === 1) {
                    return chainable({
                        data: [
                            {
                                stripe_payment_intent_id: 'pi_seller',
                                seller_user_id: 'seller_1',
                                paid_at: daysAgo(2),
                                ship_by_at: new Date(Date.now() + 86_400_000).toISOString(),
                            },
                        ],
                        error: null,
                    });
                }
                return chainable({ data: [], error: null });
            }
            notificationBuilder = chainable({ data: [{ id: 'existing' }], error: null });
            return notificationBuilder;
        });

        await processEscrowTimers();

        expect(notificationBuilder.eq).toHaveBeenCalledWith(
            'body',
            "Don't forget to ship order pi_seller! It has been 2 days since payment."
        );
        expect(notificationBuilder.insert).not.toHaveBeenCalled();
        expect(sendPushNotification).not.toHaveBeenCalled();
    });

    it('never queries disputed rows', async () => {
        const builders: any[] = [];
        mockSupabase.from.mockImplementation((table: string) => {
            const builder = chainable({ data: [], error: null });
            if (table === 'orders') {
                builders.push(builder);
            }
            return builder;
        });

        await processEscrowTimers();

        expect(builders).toHaveLength(2);
        expect(builders[0].eq).toHaveBeenCalledWith('status', 'in_escrow');
        expect(builders[1].eq).toHaveBeenCalledWith('status', 'shipped');
        expect(builders.flatMap((b) => b.eq.mock.calls)).not.toContainEqual(['status', 'disputed']);
    });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    getOrders,
    getOrderById,
    createOrder,
    resolvePaymentReference,
} from './ordersService';
import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { removeCartProducts } from './cartService';
import { SingleSellerViolationError } from './sellerKey';
import { CannotBuyOwnItemError } from './cannotBuyOwnItem';
import { transitionOrder, IllegalOrderTransitionError } from './orderStateMachine';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

vi.mock('./cartService', () => ({
    removeCartProducts: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('./orderStateMachine', () => ({
    transitionOrder: vi.fn().mockResolvedValue(undefined),
    OrderNotFoundError: class OrderNotFoundError extends Error {},
    IllegalOrderTransitionError: class IllegalOrderTransitionError extends Error {
        constructor(
            public from: string,
            public to: string
        ) {
            super(`Cannot transition order from "${from}" to "${to}".`);
            this.name = 'IllegalOrderTransitionError';
        }
    },
}));

type MockResult = { data: any; error: any };

/**
 * Results are consumed in order; the last one repeats. `createOrder` queries
 * `orders` twice — once for the idempotency check, once to return the new order —
 * so those tests need distinct results per call.
 */
const createMockBuilder = (results: MockResult | MockResult[]) => {
    const queue = Array.isArray(results) ? [...results] : [results];
    const builder: any = {
        select: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        update: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        or: vi.fn(() => builder),
        not: vi.fn(() => builder),
        lt: vi.fn(() => builder),
        order: vi.fn(() => builder),
        maybeSingle: vi.fn(() => builder),
        single: vi.fn(() => builder),
        then: (onfulfilled: any) => {
            const result = queue.length > 1 ? queue.shift()! : queue[0];
            return Promise.resolve(result).then(onfulfilled);
        },
    };
    return builder;
};

/** Routes per-table builders so payment lookups do not resolve to order rows. */
const mockTables = (
    mockSupabase: any,
    tables: Record<string, MockResult | MockResult[]>
) => {
    const builders: Record<string, any> = {};

    for (const [table, result] of Object.entries(tables)) {
        builders[table] = createMockBuilder(result);
    }

    mockSupabase.from.mockImplementation((table: string) => {
        if (!builders[table]) {
            builders[table] = createMockBuilder({ data: [], error: null });
        }
        return builders[table];
    });

    return builders;
};

/**
 * Checkout now talks to two RPCs. Route by name so a blanket mockResolvedValue
 * cannot make `ensure_payment_record` return an escrow payload (or the reverse).
 */
const mockCheckoutRpcs = (
    mockSupabase: any,
    options: {
        paymentId?: string;
        escrow?: MockResult | ((args: Record<string, unknown>) => MockResult);
    } = {}
) => {
    const paymentId = options.paymentId ?? 'pay_1';
    mockSupabase.rpc.mockImplementation((name: string, args: Record<string, unknown> = {}) => {
        if (name === 'ensure_payment_record') {
            return Promise.resolve({ data: paymentId, error: null });
        }
        if (typeof options.escrow === 'function') {
            return Promise.resolve(options.escrow(args));
        }
        return Promise.resolve(
            options.escrow ?? {
                data: { success: true, order_id: 'ord_new', total_price: 1000 },
                error: null,
            }
        );
    });
};

describe('ordersService', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            from: vi.fn(),
            rpc: vi.fn(),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    describe('getOrders', () => {
        it('retrieves orders, groups them by stripe_payment_intent_id, and calculates pricing correctly', async () => {
            const dbOrderRows = [
                {
                    id: 'ord_1',
                    buyer_id: 'user_123',
                    product_id: 'prod_1',
                    quantity: 1,
                    price_per_unit: 1000,
                    total_price: 1000,
                    stripe_payment_intent_id: 'pi_test_123',
                    status: 'pending',
                    created_at: '2026-06-27T10:00:00.000Z',
                    updated_at: '2026-06-27T10:00:00.000Z',
                    tracking_number: null,
                    shipping_address: {
                        name: 'Jane Doe',
                        street: '123 Main St',
                        city: 'Nairobi',
                        postal: '00100',
                        phone: '+254700000000',
                    },
                    product: { name: 'Jacket', image_urls: ['jacket.jpg'] },
                    seller: { business_name: 'Super Seller' },
                },
                {
                    id: 'ord_2',
                    buyer_id: 'user_123',
                    product_id: 'prod_2',
                    quantity: 2,
                    price_per_unit: 2000,
                    total_price: 4000,
                    stripe_payment_intent_id: 'pi_test_123',
                    status: 'pending',
                    created_at: '2026-06-27T10:00:00.000Z',
                    updated_at: '2026-06-27T10:00:00.000Z',
                    tracking_number: null,
                    shipping_address: {
                        name: 'Jane Doe',
                        street: '123 Main St',
                        city: 'Nairobi',
                        postal: '00100',
                        phone: '+254700000000',
                    },
                    product: { name: 'Jeans', image_urls: ['jeans.jpg'] },
                    seller: { business_name: 'Cool Store' },
                },
            ];

            mockSupabase.from.mockReturnValue(createMockBuilder({ data: dbOrderRows, error: null }));

            const orders = await getOrders('user_123');

            expect(mockSupabase.from).toHaveBeenCalledWith('orders');
            // Check grouping: 2 DB rows, but 1 grouped OrderDto
            expect(orders).toHaveLength(1);
            
            const group = orders[0];
            expect(group.id).toBe('pi_test_123');
            
            // Subtotal = 1000 + 4000 = 5000.
            // Tax = 5000 * 0.16 = 800.
            // Buyer arranges delivery, so no shipping fee: total = 5800.
            expect(group.total).toBe(5800);
            expect(group.items).toHaveLength(2);
            expect(group.items[0].name).toBe('Jacket');
            expect(group.items[1].name).toBe('Jeans');
            
            // Check status stepper
            expect(group.timeline[0].label).toBe('Placed');
            expect(group.timeline[0].completed).toBe(true);
            expect(group.timeline[0].current).toBe(true); // Since it's pending, placed is current
            expect(group.timeline[1].label).toBe('Confirmed');
            expect(group.timeline[1].completed).toBe(false);
        });

        it('correctly updates timeline step completions for delivered orders', async () => {
            const dbOrderRows = [
                {
                    id: 'ord_3',
                    buyer_id: 'user_123',
                    product_id: 'prod_1',
                    quantity: 1,
                    price_per_unit: 1000,
                    total_price: 1000,
                    stripe_payment_intent_id: 'pi_delivered',
                    status: 'delivered',
                    created_at: '2026-06-27T10:00:00.000Z',
                    updated_at: '2026-06-27T15:00:00.000Z',
                    product: {},
                    seller: {},
                },
            ];

            mockSupabase.from.mockReturnValue(createMockBuilder({ data: dbOrderRows, error: null }));

            const orders = await getOrders('user_123');
            const timeline = orders[0].timeline;

            expect(timeline[0].completed).toBe(true); // Placed
            expect(timeline[1].completed).toBe(true); // Confirmed
            expect(timeline[2].completed).toBe(true); // Shipped
            expect(timeline[3].completed).toBe(true); // Delivered
            expect(timeline[3].current).toBe(true); // Delivered is current
        });

        const haltedRow = (overrides: Record<string, any>) => ({
            id: 'ord_h',
            buyer_id: 'user_123',
            product_id: 'prod_1',
            quantity: 1,
            price_per_unit: 1000,
            total_price: 1000,
            stripe_payment_intent_id: 'pi_halted',
            created_at: '2026-06-27T10:00:00.000Z',
            updated_at: '2026-06-29T10:00:00.000Z',
            paid_at: '2026-06-27T10:05:00.000Z',
            product: {},
            seller: {},
            ...overrides,
        });

        const timelineOf = async (row: Record<string, any>) => {
            mockSupabase.from.mockReturnValue(createMockBuilder({ data: [row], error: null }));
            const [order] = await getOrders('user_123');
            return order.timeline.map((step) => ({
                label: step.label,
                completed: step.completed,
                current: Boolean(step.current),
            }));
        };

        it('keeps shipped progress and ends on "On hold" for a disputed order', async () => {
            const timeline = await timelineOf(
                haltedRow({
                    status: 'disputed',
                    shipped_at: '2026-06-28T10:00:00.000Z',
                    disputed_at: '2026-06-29T10:00:00.000Z',
                })
            );

            expect(timeline).toEqual([
                { label: 'Placed', completed: true, current: false },
                { label: 'Confirmed', completed: true, current: false },
                { label: 'Shipped', completed: true, current: false },
                { label: 'On hold', completed: true, current: true },
            ]);
        });

        it('ends a ship-by miss on "Cancelled" without a Shipped step', async () => {
            const timeline = await timelineOf(
                haltedRow({ status: 'cancelled', cancelled_at: '2026-06-30T10:00:00.000Z' })
            );

            expect(timeline.map((s) => s.label)).toEqual(['Placed', 'Confirmed', 'Cancelled']);
            expect(timeline.at(-1)?.current).toBe(true);
        });

        it('shows Cancelled then Refunded for a refunded ship-by miss', async () => {
            const timeline = await timelineOf(
                haltedRow({
                    status: 'refunded',
                    cancelled_at: '2026-06-30T10:00:00.000Z',
                    refunded_at: '2026-06-30T10:01:00.000Z',
                })
            );

            expect(timeline.map((s) => s.label)).toEqual([
                'Placed',
                'Confirmed',
                'Cancelled',
                'Refunded',
            ]);
            expect(timeline.at(-1)?.current).toBe(true);
        });
    });

    describe('getOrderById', () => {
        it('retrieves and returns a single grouped order', async () => {
            const dbOrderRows = [
                {
                    id: 'ord_1',
                    buyer_id: 'user_123',
                    product_id: 'prod_1',
                    price_per_unit: 1000,
                    total_price: 1000,
                    stripe_payment_intent_id: 'pi_test_123',
                    status: 'pending',
                    created_at: '2026-06-27T10:00:00.000Z',
                    updated_at: '2026-06-27T10:00:00.000Z',
                    product: {},
                    seller: {},
                },
            ];

            mockSupabase.from.mockReturnValue(createMockBuilder({ data: dbOrderRows, error: null }));

            const order = await getOrderById('user_123', 'pi_test_123');

            expect(order).not.toBeNull();
            expect(order!.id).toBe('pi_test_123');
        });

        it('returns null if order does not exist', async () => {
            mockSupabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

            const order = await getOrderById('user_123', 'pi_nonexistent');

            expect(order).toBeNull();
        });

        it('returns an order when the viewer is the seller, not the buyer', async () => {
            const dbOrderRows = [
                {
                    id: 'ord_1',
                    buyer_id: 'buyer_other',
                    seller_id: 'biz_1',
                    seller_user_id: 'seller_123',
                    product_id: 'prod_1',
                    price_per_unit: 1000,
                    total_price: 1000,
                    stripe_payment_intent_id: 'pi_seller_view',
                    status: 'in_escrow',
                    created_at: '2026-06-27T10:00:00.000Z',
                    updated_at: '2026-06-27T10:00:00.000Z',
                    product: {},
                    seller: {},
                },
            ];

            mockSupabase.from.mockReturnValue(createMockBuilder({ data: dbOrderRows, error: null }));

            const order = await getOrderById('seller_123', 'pi_seller_view');

            expect(order).not.toBeNull();
            expect(order?.id).toBe('pi_seller_view');
            expect(order?.viewerRole).toBe('seller');
        });
    });

    describe('createOrder', () => {
        const shippingAddress = {
            name: 'Jane Doe',
            street: '123 Main St',
            city: 'Nairobi',
            postal: '00100',
            phone: '+254700000000',
        };

        const createdOrderRow = (overrides: Record<string, any> = {}) => ({
            id: 'ord_new',
            buyer_id: 'user_123',
            product_id: 'prod_1',
            price_per_unit: 1000,
            total_price: 1000,
            quantity: 1,
            stripe_payment_intent_id: 'pi_new_order',
            payment_id: 'pay_1',
            status: 'paid',
            paid_at: '2026-06-27T10:00:00.000Z',
            created_at: '2026-06-27T10:00:00.000Z',
            updated_at: '2026-06-27T10:00:00.000Z',
            product: {},
            seller: {},
            ...overrides,
        });

        it('creates the payment record and calls create_escrow_order per item', async () => {
            const createRequest = {
                paymentReference: 'pi_new_order',
                shippingAddress,
                items: [
                    { productId: 'prod_1', quantity: 1 },
                    { productId: 'prod_2', quantity: 2 },
                ],
            };

            mockCheckoutRpcs(mockSupabase);

            mockTables(mockSupabase, {
                products: {
                    data: [
                        { id: 'prod_1', business_id: 'biz_1' },
                        { id: 'prod_2', business_id: 'biz_1' },
                    ],
                    error: null,
                },
                orders: [
                    { data: [], error: null },
                    { data: [createdOrderRow()], error: null },
                ],
            });

            const result = await createOrder('user_123', createRequest);

            // insert → two escrow lines → amount write. Four RPCs, none of them
            // a table insert: that is the whole point of 016.
            expect(mockSupabase.rpc).toHaveBeenCalledTimes(4);
            expect(mockSupabase.rpc).toHaveBeenNthCalledWith(1, 'ensure_payment_record', {
                p_buyer_id: 'user_123',
                p_reference: 'pi_new_order',
                p_provider: 'paystack',
                p_amount_minor: 0,
                p_currency: 'KES',
                p_status: 'success',
            });
            expect(mockSupabase.rpc).toHaveBeenNthCalledWith(2, 'create_escrow_order', {
                p_buyer_id: 'user_123',
                p_payment_id: 'pay_1',
                p_payment_reference: 'pi_new_order',
                p_product_id: 'prod_1',
                p_listing_id: null,
                p_quantity: 1,
                p_shipping_address: shippingAddress,
                p_ship_by_days: 3,
            });

            // D12 — what Paystack captured, not the payout base: two lines at
            // 1000 is a 200000 minor subtotal, plus 16% VAT.
            expect(mockSupabase.rpc).toHaveBeenNthCalledWith(4, 'ensure_payment_record', {
                p_buyer_id: 'user_123',
                p_reference: 'pi_new_order',
                p_provider: 'paystack',
                p_amount_minor: 232000,
                p_currency: 'KES',
                p_status: 'success',
            });
            expect(removeCartProducts).toHaveBeenCalledWith('user_123', ['prod_1', 'prod_2']);
            expect(transitionOrder).toHaveBeenCalledWith({
                orderId: 'pi_new_order',
                toStatus: 'in_escrow',
                actor: 'system',
            });
            expect(result.id).toBe('pi_new_order');
        });

        it('still returns the order if paid → in_escrow is already done', async () => {
            vi.mocked(transitionOrder).mockRejectedValueOnce(
                new IllegalOrderTransitionError('in_escrow', 'in_escrow')
            );

            mockCheckoutRpcs(mockSupabase);
            mockTables(mockSupabase, {
                products: {
                    data: [{ id: 'prod_1', business_id: 'biz_1' }],
                    error: null,
                },
                orders: [
                    { data: [], error: null },
                    { data: [createdOrderRow({ status: 'in_escrow' })], error: null },
                ],
            });

            const result = await createOrder('user_123', {
                paymentReference: 'pi_new_order',
                shippingAddress,
                items: [{ productId: 'prod_1', quantity: 1 }],
            });

            expect(result.id).toBe('pi_new_order');
            expect(transitionOrder).toHaveBeenCalled();
        });

        it('passes a peer listing through as p_listing_id', async () => {
            mockCheckoutRpcs(mockSupabase, {
                paymentId: 'pay_2',
                escrow: {
                    data: { success: true, order_id: 'ord_peer', total_price: 2500 },
                    error: null,
                },
            });

            mockTables(mockSupabase, {
                listings: {
                    data: [{ id: 'listing_1', seller_id: 'seller_user_1' }],
                    error: null,
                },
                orders: [
                    { data: [], error: null },
                    {
                        data: [
                            createdOrderRow({
                                product_id: null,
                                listing_id: 'listing_1',
                                seller_user_id: 'seller_user_1',
                                listing: { title: 'Vintage Jacket', image_url: 'jacket.jpg' },
                                product: null,
                            }),
                        ],
                        error: null,
                    },
                ],
                profiles: {
                    data: [{ id: 'seller_user_1', display_name: 'Achieng', handle: 'achieng' }],
                    error: null,
                },
            });

            const result = await createOrder('user_123', {
                paymentReference: 'pi_new_order',
                shippingAddress,
                items: [{ listingId: 'listing_1', quantity: 1 }],
            });

            expect(mockSupabase.rpc).toHaveBeenCalledWith(
                'create_escrow_order',
                expect.objectContaining({
                    p_listing_id: 'listing_1',
                    p_product_id: null,
                })
            );

            expect(result.items[0].listingId).toBe('listing_1');
            expect(result.items[0].name).toBe('Vintage Jacket');
            expect(result.items[0].sellerName).toBe('Achieng');
            expect(result.items[0].sellerType).toBe('peer');
            expect(result.sellerType).toBe('peer');
        });

        it('accepts the deprecated stripePaymentIntentId alias', async () => {
            mockCheckoutRpcs(mockSupabase);

            mockTables(mockSupabase, {
                products: {
                    data: [{ id: 'prod_1', business_id: 'biz_1' }],
                    error: null,
                },
                orders: [
                    { data: [], error: null },
                    { data: [createdOrderRow()], error: null },
                ],
            });

            const result = await createOrder('user_123', {
                stripePaymentIntentId: 'pi_new_order',
                shippingAddress,
                items: [{ productId: 'prod_1', quantity: 1 }],
            });

            expect(mockSupabase.rpc).toHaveBeenCalledWith(
                'create_escrow_order',
                expect.objectContaining({ p_payment_reference: 'pi_new_order' })
            );
            expect(result.id).toBe('pi_new_order');
        });

        it('returns the existing order when the reference already has one', async () => {
            const builders = mockTables(mockSupabase, {
                orders: { data: [createdOrderRow()], error: null },
            });

            const result = await createOrder('user_123', {
                paymentReference: 'pi_new_order',
                shippingAddress,
                items: [{ productId: 'prod_1', quantity: 1 }],
            });

            expect(result.id).toBe('pi_new_order');
            // A retry after a captured charge must not bill or create anything again.
            expect(mockSupabase.rpc).not.toHaveBeenCalled();
            expect(builders.orders.insert).not.toHaveBeenCalled();
            expect(removeCartProducts).not.toHaveBeenCalled();
            expect(transitionOrder).not.toHaveBeenCalled();
        });

        it('throws when no payment reference is supplied', async () => {
            mockTables(mockSupabase, {});

            await expect(
                createOrder('user_123', {
                    shippingAddress,
                    items: [{ productId: 'prod_1', quantity: 1 }],
                })
            ).rejects.toThrow('Payment transaction reference is required');

            expect(mockSupabase.rpc).not.toHaveBeenCalled();
        });

        it('throws an error if RPC stock check returns failure', async () => {
            mockCheckoutRpcs(mockSupabase, {
                paymentId: 'pay_3',
                escrow: {
                    data: { success: false, error: 'Insufficient stock' },
                    error: null,
                },
            });

            mockTables(mockSupabase, {
                products: {
                    data: [{ id: 'prod_out_of_stock', business_id: 'biz_1' }],
                    error: null,
                },
            });

            await expect(
                createOrder('user_123', {
                    paymentReference: 'pi_failed',
                    shippingAddress,
                    items: [{ productId: 'prod_out_of_stock', quantity: 5 }],
                })
            ).rejects.toThrow('Insufficient stock');
        });

        it('rejects mixed catalog sellers before creating a payment', async () => {
            mockTables(mockSupabase, {
                products: {
                    data: [
                        { id: 'prod_1', business_id: 'biz_1' },
                        { id: 'prod_2', business_id: 'biz_2' },
                    ],
                    error: null,
                },
            });

            await expect(
                createOrder('user_123', {
                    paymentReference: 'pi_mixed',
                    shippingAddress,
                    items: [
                        { productId: 'prod_1', quantity: 1 },
                        { productId: 'prod_2', quantity: 1 },
                    ],
                })
            ).rejects.toThrow(SingleSellerViolationError);

            expect(mockSupabase.rpc).not.toHaveBeenCalled();
        });

        it('rejects mixing a catalog product with a peer listing', async () => {
            mockTables(mockSupabase, {
                products: {
                    data: [{ id: 'prod_1', business_id: 'biz_1' }],
                    error: null,
                },
                listings: {
                    data: [{ id: 'listing_1', seller_id: 'seller_user_1' }],
                    error: null,
                },
            });

            await expect(
                createOrder('user_123', {
                    paymentReference: 'pi_mixed_peer',
                    shippingAddress,
                    items: [
                        { productId: 'prod_1', quantity: 1 },
                        { listingId: 'listing_1', quantity: 1 },
                    ],
                })
            ).rejects.toThrow(SingleSellerViolationError);

            expect(mockSupabase.rpc).not.toHaveBeenCalled();
        });

        it('rejects buying your own catalog product', async () => {
            mockTables(mockSupabase, {
                products: {
                    data: [{ id: 'prod_1', business_id: 'biz_1' }],
                    error: null,
                },
                business_accounts: {
                    data: [{ id: 'biz_1', user_id: 'user_123' }],
                    error: null,
                },
            });

            await expect(
                createOrder('user_123', {
                    paymentReference: 'pi_own',
                    shippingAddress,
                    items: [{ productId: 'prod_1', quantity: 1 }],
                })
            ).rejects.toThrow(CannotBuyOwnItemError);

            expect(mockSupabase.rpc).not.toHaveBeenCalled();
        });

        it('rejects buying your own peer listing', async () => {
            mockTables(mockSupabase, {
                listings: {
                    data: [{ id: 'listing_1', seller_id: 'user_123' }],
                    error: null,
                },
            });

            await expect(
                createOrder('user_123', {
                    paymentReference: 'pi_own_listing',
                    shippingAddress,
                    items: [{ listingId: 'listing_1', quantity: 1 }],
                })
            ).rejects.toThrow(CannotBuyOwnItemError);

            expect(mockSupabase.rpc).not.toHaveBeenCalled();
        });
    });

    describe('resolvePaymentReference', () => {
        it('prefers paymentReference and trims whitespace', () => {
            expect(
                resolvePaymentReference({
                    paymentReference: '  ref_new  ',
                    stripePaymentIntentId: 'ref_old',
                    shippingAddress: {} as any,
                    items: [],
                })
            ).toBe('ref_new');
        });

        it('falls back to the deprecated alias and empty string', () => {
            expect(
                resolvePaymentReference({
                    stripePaymentIntentId: 'ref_old',
                    shippingAddress: {} as any,
                    items: [],
                })
            ).toBe('ref_old');

            expect(
                resolvePaymentReference({ shippingAddress: {} as any, items: [] })
            ).toBe('');
        });
    });
});

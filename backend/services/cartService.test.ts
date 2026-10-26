import { describe, expect, it, vi, beforeEach } from 'vitest';
import {
    getCart,
    addToCart,
    updateCartQty,
    deleteCartItem,
    removeCartProducts,
    clearCart,
} from './cartService';
import { CannotBuyOwnItemError } from './cannotBuyOwnItem';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

const createMockBuilder = (result: { data: any; error: any }) => {
    const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        in: vi.fn(() => builder),
        order: vi.fn(() => builder),
        maybeSingle: vi.fn(() => builder),
        single: vi.fn(() => builder),
        update: vi.fn(() => builder),
        insert: vi.fn(() => builder),
        delete: vi.fn(() => builder),
        then: (onfulfilled: any) => {
            return Promise.resolve(result).then(onfulfilled);
        },
    };
    return builder;
};

describe('cartService', () => {
    let mockSupabase: any;

    /**
     * Cart reads hydrate seller names from `business_accounts`; unless a test
     * supplies rows, that lookup should resolve empty rather than crash.
     */
    const routeTables = (
        handlers: Record<string, (callIndex: number) => any>,
        businessRows: any[] = [],
    ) => {
        const callCounts: Record<string, number> = {};
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'business_accounts') {
                return createMockBuilder({ data: businessRows, error: null });
            }
            callCounts[table] = (callCounts[table] ?? 0) + 1;
            const handler = handlers[table];
            return handler
                ? handler(callCounts[table])
                : createMockBuilder({ data: null, error: null });
        });
    };

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            from: vi.fn(),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    describe('getCart', () => {
        it('retrieves cart items and maps database fields to DTOs', async () => {
            const dbCartRows = [
                {
                    id: '1',
                    user_id: 'user_123',
                    product_id: 'prod_abc',
                    quantity: 2,
                    created_at: '2026-06-27T00:00:00.000Z',
                    updated_at: '2026-06-27T00:00:00.000Z',
                    product: {
                        id: 'prod_abc',
                        name: 'Cool Jacket',
                        price: 3500,
                        category: 'Outerwear',
                        color: 'Black',
                        style: 'Casual',
                        size: 'L',
                        image_urls: ['image1.jpg'],
                        is_featured: true,
                        is_active: true,
                        average_rating: 4.5,
                        review_count: 10,
                        stock_quantity: 4,
                        business_id: 'biz_789',
                    },
                },
            ];

            routeTables(
                { cart_items: () => createMockBuilder({ data: dbCartRows, error: null }) },
                [
                    {
                        id: 'biz_789',
                        user_id: 'user_seller',
                        business_name: 'Cool Store',
                        logo_url: 'logo.png',
                    },
                ],
            );

            const cart = await getCart('user_123');

            expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
            expect(cart).toHaveLength(1);
            expect(cart[0]).toEqual({
                id: '1',
                userId: 'user_123',
                productId: 'prod_abc',
                quantity: 2,
                createdAt: '2026-06-27T00:00:00.000Z',
                updatedAt: '2026-06-27T00:00:00.000Z',
                product: {
                    id: 'prod_abc',
                    name: 'Cool Jacket',
                    description: null,
                    price: 3500,
                    category: 'Outerwear',
                    color: 'Black',
                    style: 'Casual',
                    size: 'L',
                    imageUrls: ['image1.jpg'],
                    isFeatured: true,
                    isActive: true,
                    averageRating: 4.5,
                    reviewCount: 10,
                    stockQuantity: 4,
                    businessId: 'biz_789',
                    sellerName: 'Cool Store',
                    sellerUserId: 'user_seller',
                    sellerAvatarUrl: 'logo.png',
                },
            });
        });

        it('throws an error if DB query fails', async () => {
            mockSupabase.from.mockReturnValue(
                createMockBuilder({ data: null, error: { message: 'DB Error' } } as any)
            );

            await expect(getCart('user_123')).rejects.toThrow('DB Error');
        });
    });

    describe('addToCart', () => {
        it('adds quantity to existing cart item if it exists', async () => {
            const existingItem = { id: 'item_1', quantity: 3 };
            const updatedItem = {
                id: 'item_1',
                user_id: 'user_123',
                product_id: 'prod_abc',
                quantity: 5,
                created_at: '2026-06-27T00:00:00.000Z',
                updated_at: '2026-06-27T00:00:00.000Z',
                product: null,
            };

            routeTables(
                {
                    products: () =>
                        createMockBuilder({
                            data: {
                                id: 'prod_abc',
                                business_id: 'biz_1',
                                is_active: true,
                            },
                            error: null,
                        }),
                    cart_items: (n) =>
                        n === 1
                            ? createMockBuilder({ data: existingItem, error: null })
                            : createMockBuilder({ data: updatedItem, error: null }),
                },
                [{ id: 'biz_1', user_id: 'seller_other' }],
            );

            const result = await addToCart('user_123', 'prod_abc', 2);

            expect(result.quantity).toBe(5);
            expect(result.productId).toBe('prod_abc');
        });

        it('inserts new cart item if it does not exist', async () => {
            const newItem = {
                id: 'new_item_id',
                user_id: 'user_123',
                product_id: 'prod_abc',
                quantity: 1,
                created_at: '2026-06-27T00:00:00.000Z',
                updated_at: '2026-06-27T00:00:00.000Z',
                product: null,
            };

            let cartCallCount = 0;
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'cart_items') {
                    cartCallCount++;
                    if (cartCallCount === 1) {
                        return createMockBuilder({ data: null, error: null });
                    }
                    return createMockBuilder({ data: newItem, error: null });
                }
                if (table === 'products') {
                    return createMockBuilder({
                        data: {
                            id: 'prod_abc',
                            business_id: 'biz_1',
                            is_active: true,
                        },
                        error: null,
                    });
                }
                if (table === 'business_accounts') {
                    return createMockBuilder({
                        data: { user_id: 'seller_other' },
                        error: null,
                    });
                }
            });

            const result = await addToCart('user_123', 'prod_abc', 1);

            expect(result.id).toBe('new_item_id');
            expect(result.quantity).toBe(1);
        });

        it('allows a product from a different business (checkout enforces one seller)', async () => {
            const newItem = {
                id: 'new_item_id',
                user_id: 'user_123',
                product_id: 'prod_other',
                quantity: 1,
                created_at: '2026-06-27T00:00:00.000Z',
                updated_at: '2026-06-27T00:00:00.000Z',
                product: null,
            };

            let cartCallCount = 0;
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'cart_items') {
                    cartCallCount++;
                    if (cartCallCount === 1) {
                        return createMockBuilder({ data: null, error: null });
                    }
                    return createMockBuilder({ data: newItem, error: null });
                }
                if (table === 'products') {
                    return createMockBuilder({
                        data: {
                            id: 'prod_other',
                            business_id: 'biz_2',
                            is_active: true,
                        },
                        error: null,
                    });
                }
                if (table === 'business_accounts') {
                    return createMockBuilder({
                        data: { user_id: 'seller_other' },
                        error: null,
                    });
                }
            });

            await expect(addToCart('user_123', 'prod_other', 1)).resolves.toMatchObject({
                productId: 'prod_other',
            });
        });

        it('rejects an inactive product', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'cart_items') {
                    return createMockBuilder({ data: null, error: null });
                }
                if (table === 'products') {
                    return createMockBuilder({
                        data: {
                            id: 'prod_inactive',
                            business_id: 'biz_1',
                            is_active: false,
                        },
                        error: null,
                    });
                }
            });

            await expect(addToCart('user_123', 'prod_inactive', 1)).rejects.toThrow(
                'Product is not available'
            );
        });

        it('rejects adding your own catalog product', async () => {
            mockSupabase.from.mockImplementation((table: string) => {
                if (table === 'products') {
                    return createMockBuilder({
                        data: {
                            id: 'prod_mine',
                            business_id: 'biz_mine',
                            is_active: true,
                        },
                        error: null,
                    });
                }
                if (table === 'business_accounts') {
                    return createMockBuilder({
                        data: { user_id: 'user_123' },
                        error: null,
                    });
                }
                return createMockBuilder({ data: null, error: null });
            });

            await expect(addToCart('user_123', 'prod_mine', 1)).rejects.toThrow(
                CannotBuyOwnItemError
            );
        });
    });

    describe('updateCartQty', () => {
        it('updates quantity of existing cart item', async () => {
            const updatedItem = {
                id: 'item_1',
                user_id: 'user_123',
                product_id: 'prod_abc',
                quantity: 4,
                created_at: '2026-06-27T00:00:00.000Z',
                updated_at: '2026-06-27T00:00:00.000Z',
                product: null,
            };

            mockSupabase.from.mockReturnValue(createMockBuilder({ data: updatedItem, error: null }));

            const result = await updateCartQty('user_123', 'prod_abc', 4);

            expect(result).not.toBeNull();
            expect(result!.quantity).toBe(4);
        });

        it('deletes cart item if updated quantity is <= 0', async () => {
            mockSupabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

            const result = await updateCartQty('user_123', 'prod_abc', 0);

            expect(result).toBeNull();
            expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
        });
    });

    describe('deleteCartItem', () => {
        it('deletes specific product from user cart', async () => {
            mockSupabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

            await deleteCartItem('user_123', 'prod_abc');

            expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
        });
    });

    describe('removeCartProducts', () => {
        it('deletes only the supplied products', async () => {
            const builder = createMockBuilder({ data: null, error: null });
            mockSupabase.from.mockReturnValue(builder);

            await removeCartProducts('user_123', ['prod_a', 'prod_b', 'prod_a']);

            expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
            expect(builder.in).toHaveBeenCalledWith('product_id', ['prod_a', 'prod_b']);
        });

        it('is a no-op when no products are supplied', async () => {
            await removeCartProducts('user_123', []);

            expect(mockSupabase.from).not.toHaveBeenCalled();
        });
    });

    describe('clearCart', () => {
        it('deletes all products in user cart', async () => {
            mockSupabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

            await clearCart('user_123');

            expect(mockSupabase.from).toHaveBeenCalledWith('cart_items');
        });
    });
});

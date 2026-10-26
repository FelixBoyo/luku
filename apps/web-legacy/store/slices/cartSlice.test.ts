import { describe, it, expect, beforeEach } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import cartReducer, {
    addToCart,
    removeFromCart,
    updateQuantity,
    clearCart,
} from './cartSlice';
import { Product } from '../../types';

describe('cartSlice', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                cart: cartReducer,
            },
        });
    });

    const mockProduct: Product = {
        id: '1',
        business_id: 'b1',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Top',
        color: 'Blue',
        style: 'Casual',
        season: 'Spring',
        size: 'M',
        stock_quantity: 10,
        image_urls: ['https://example.com/image.jpg'],
        is_featured: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    const mockProduct2: Product = {
        ...mockProduct,
        id: '2',
        name: 'Test Product 2',
        price: 149.99,
    };

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = store.getState().cart;
            expect(state.items).toEqual([]);
        });
    });

    describe('addToCart', () => {
        it('should add a new product to cart', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 1 }));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(1);
            expect(state.items[0].product.id).toBe('1');
            expect(state.items[0].quantity).toBe(1);
        });

        it('should update quantity when adding existing product', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 2 }));
            store.dispatch(addToCart({ product: mockProduct, quantity: 3 }));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(1);
            expect(state.items[0].quantity).toBe(5);
        });

        it('should add multiple different products', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 1 }));
            store.dispatch(addToCart({ product: mockProduct2, quantity: 2 }));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(2);
            expect(state.items[0].product.id).toBe('1');
            expect(state.items[1].product.id).toBe('2');
        });

        it('should handle adding zero quantity', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 0 }));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(1);
            expect(state.items[0].quantity).toBe(0);
        });

        it('should handle negative quantity', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: -1 }));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(1);
            expect(state.items[0].quantity).toBe(-1);
        });
    });

    describe('removeFromCart', () => {
        it('should remove product from cart', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 1 }));
            store.dispatch(addToCart({ product: mockProduct2, quantity: 1 }));
            store.dispatch(removeFromCart('1'));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(1);
            expect(state.items[0].product.id).toBe('2');
        });

        it('should handle removing non-existent product', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 1 }));
            store.dispatch(removeFromCart('999'));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(1);
        });

        it('should handle removing from empty cart', () => {
            store.dispatch(removeFromCart('1'));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(0);
        });
    });

    describe('updateQuantity', () => {
        beforeEach(() => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 2 }));
        });

        it('should update quantity for existing item', () => {
            store.dispatch(updateQuantity({ productId: '1', quantity: 5 }));
            const state = store.getState().cart;
            expect(state.items[0].quantity).toBe(5);
        });

        it('should remove item when quantity is set to zero', () => {
            store.dispatch(updateQuantity({ productId: '1', quantity: 0 }));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(0);
        });

        it('should remove item when quantity is negative', () => {
            store.dispatch(updateQuantity({ productId: '1', quantity: -1 }));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(0);
        });

        it('should handle updating non-existent product', () => {
            store.dispatch(updateQuantity({ productId: '999', quantity: 5 }));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(1);
            expect(state.items[0].quantity).toBe(2);
        });

        it('should handle large quantities', () => {
            store.dispatch(updateQuantity({ productId: '1', quantity: 1000 }));
            const state = store.getState().cart;
            expect(state.items[0].quantity).toBe(1000);
        });
    });

    describe('clearCart', () => {
        it('should clear all items from cart', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 1 }));
            store.dispatch(addToCart({ product: mockProduct2, quantity: 2 }));
            store.dispatch(clearCart());
            const state = store.getState().cart;
            expect(state.items).toHaveLength(0);
        });

        it('should handle clearing empty cart', () => {
            store.dispatch(clearCart());
            const state = store.getState().cart;
            expect(state.items).toHaveLength(0);
        });
    });

    describe('edge cases', () => {
        it('should handle multiple operations in sequence', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 1 }));
            store.dispatch(addToCart({ product: mockProduct2, quantity: 2 }));
            store.dispatch(updateQuantity({ productId: '1', quantity: 3 }));
            store.dispatch(addToCart({ product: mockProduct, quantity: 1 }));
            store.dispatch(removeFromCart('2'));
            const state = store.getState().cart;
            expect(state.items).toHaveLength(1);
            expect(state.items[0].product.id).toBe('1');
            expect(state.items[0].quantity).toBe(4);
        });

        it('should maintain product reference integrity', () => {
            store.dispatch(addToCart({ product: mockProduct, quantity: 1 }));
            const state = store.getState().cart;
            expect(state.items[0].product).toEqual(mockProduct);
        });
    });
});

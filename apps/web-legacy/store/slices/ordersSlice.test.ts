// Import the mock first to set up environment
import '@/src/test/mocks/supabaseClient';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import ordersReducer, {
    fetchBuyerOrders,
    fetchSellerOrders,
    fetchOrder,
    createOrder,
    updateOrderStatus,
    clearOrders,
    clearCurrentOrder,
} from './ordersSlice';
import { Order } from '../../types';

describe('ordersSlice', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                orders: ordersReducer,
            },
        });
        vi.clearAllMocks();
    });

    const mockOrder: Order = {
        id: 'order-1',
        buyer_id: 'buyer-1',
        seller_id: 'seller-1',
        product_id: 'product-1',
        quantity: 2,
        price_per_unit: 99.99,
        total_price: 199.98,
        status: 'pending',
        shipping_address: {
            street: '123 Main St',
            city: 'New York',
            state: 'NY',
            zip: '10001',
            country: 'USA',
        },
        stripe_payment_intent_id: 'pi_123',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = store.getState().orders;
            expect(state.orders).toEqual([]);
            expect(state.currentOrder).toBeNull();
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
            // pagination can be null initially
            expect(state.pagination === null || typeof state.pagination === 'object').toBe(true);
        });
    });

    describe('fetchBuyerOrders', () => {
        it('should handle fetchBuyerOrders.pending', () => {
            store.dispatch({ type: 'orders/fetchBuyerOrders/pending' });
            const state = store.getState().orders;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchBuyerOrders.fulfilled with pagination', () => {
            const payload = {
                orders: [mockOrder],
                totalCount: 1,
                totalPages: 1,
                currentPage: 1,
            };
            store.dispatch({
                type: 'orders/fetchBuyerOrders/fulfilled',
                payload,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.orders).toEqual([mockOrder]);
            expect(state.pagination).toEqual({
                totalCount: 1,
                totalPages: 1,
                currentPage: 1,
            });
        });

        it('should handle fetchBuyerOrders.rejected', () => {
            const errorMessage = 'Failed to fetch orders';
            store.dispatch({
                type: 'orders/fetchBuyerOrders/rejected',
                payload: errorMessage,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('fetchSellerOrders', () => {
        it('should handle fetchSellerOrders.pending', () => {
            store.dispatch({ type: 'orders/fetchSellerOrders/pending' });
            const state = store.getState().orders;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchSellerOrders.fulfilled with filters', () => {
            const payload = {
                orders: [mockOrder],
                totalCount: 1,
                totalPages: 1,
                currentPage: 1,
            };
            store.dispatch({
                type: 'orders/fetchSellerOrders/fulfilled',
                payload,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.orders).toEqual([mockOrder]);
        });

        it('should handle fetchSellerOrders.rejected', () => {
            const errorMessage = 'Failed to fetch seller orders';
            store.dispatch({
                type: 'orders/fetchSellerOrders/rejected',
                payload: errorMessage,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('fetchOrder', () => {
        it('should handle fetchOrder.pending', () => {
            store.dispatch({ type: 'orders/fetchOrder/pending' });
            const state = store.getState().orders;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchOrder.fulfilled', () => {
            store.dispatch({
                type: 'orders/fetchOrder/fulfilled',
                payload: mockOrder,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.currentOrder).toEqual(mockOrder);
        });

        it('should handle fetchOrder.rejected', () => {
            const errorMessage = 'Order not found';
            store.dispatch({
                type: 'orders/fetchOrder/rejected',
                payload: errorMessage,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('createOrder', () => {
        it('should handle createOrder.pending', () => {
            store.dispatch({ type: 'orders/createOrder/pending' });
            const state = store.getState().orders;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle createOrder.fulfilled', () => {
            store.dispatch({
                type: 'orders/createOrder/fulfilled',
                payload: mockOrder,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.orders).toHaveLength(1);
            expect(state.orders[0]).toEqual(mockOrder);
        });

        it('should handle createOrder.rejected', () => {
            const errorMessage = 'Insufficient stock';
            store.dispatch({
                type: 'orders/createOrder/rejected',
                payload: errorMessage,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('updateOrderStatus', () => {
        beforeEach(() => {
            store.dispatch({
                type: 'orders/fetchBuyerOrders/fulfilled',
                payload: {
                    orders: [mockOrder],
                    totalCount: 1,
                    totalPages: 1,
                    currentPage: 1,
                },
            });
        });

        it('should handle updateOrderStatus.pending', () => {
            store.dispatch({ type: 'orders/updateOrderStatus/pending' });
            const state = store.getState().orders;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle updateOrderStatus.fulfilled', () => {
            const updatedOrder = { ...mockOrder, status: 'confirmed' as const };
            store.dispatch({
                type: 'orders/updateOrderStatus/fulfilled',
                payload: updatedOrder,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.orders[0].status).toBe('confirmed');
        });

        it('should update currentOrder if it matches', () => {
            store.dispatch({
                type: 'orders/fetchOrder/fulfilled',
                payload: mockOrder,
            });
            const updatedOrder = { ...mockOrder, status: 'shipped' as const, tracking_number: 'TRACK123' };
            store.dispatch({
                type: 'orders/updateOrderStatus/fulfilled',
                payload: updatedOrder,
            });
            const state = store.getState().orders;
            expect(state.currentOrder?.status).toBe('shipped');
            expect(state.currentOrder?.tracking_number).toBe('TRACK123');
        });

        it('should handle updateOrderStatus.rejected', () => {
            const errorMessage = 'Invalid order status';
            store.dispatch({
                type: 'orders/updateOrderStatus/rejected',
                payload: errorMessage,
            });
            const state = store.getState().orders;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('clearOrders', () => {
        it('should clear all orders and current order', () => {
            store.dispatch({
                type: 'orders/fetchBuyerOrders/fulfilled',
                payload: {
                    orders: [mockOrder],
                    totalCount: 1,
                    totalPages: 1,
                    currentPage: 1,
                },
            });
            store.dispatch({
                type: 'orders/fetchOrder/fulfilled',
                payload: mockOrder,
            });

            store.dispatch(clearOrders());
            const state = store.getState().orders;
            expect(state.orders).toEqual([]);
            expect(state.currentOrder).toBeNull();
        });
    });

    describe('clearCurrentOrder', () => {
        it('should clear only current order', () => {
            store.dispatch({
                type: 'orders/fetchBuyerOrders/fulfilled',
                payload: {
                    orders: [mockOrder],
                    totalCount: 1,
                    totalPages: 1,
                    currentPage: 1,
                },
            });
            store.dispatch({
                type: 'orders/fetchOrder/fulfilled',
                payload: mockOrder,
            });

            store.dispatch(clearCurrentOrder());
            const state = store.getState().orders;
            expect(state.orders).toHaveLength(1);
            expect(state.currentOrder).toBeNull();
        });
    });

    describe('pagination', () => {
        it('should handle pagination data correctly', () => {
            const payload = {
                orders: [mockOrder],
                totalCount: 25,
                totalPages: 3,
                currentPage: 2,
            };
            store.dispatch({
                type: 'orders/fetchBuyerOrders/fulfilled',
                payload,
            });
            const state = store.getState().orders;
            expect(state.pagination).toEqual({
                totalCount: 25,
                totalPages: 3,
                currentPage: 2,
            });
        });
    });
});

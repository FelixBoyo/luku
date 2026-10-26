// Import the mock first to set up environment
import '@/src/test/mocks/supabaseClient';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import promotionsReducer, {
    fetchBusinessPromotions,
    fetchProductPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
    clearPromotions,
} from './promotionsSlice';
import { Promotion } from '../../types';

describe('promotionsSlice', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                promotions: promotionsReducer,
            },
        });
        vi.clearAllMocks();
    });

    const now = new Date();
    const startDate = new Date(now.getTime() - 86400000).toISOString(); // Yesterday
    const endDate = new Date(now.getTime() + 86400000).toISOString(); // Tomorrow

    const mockPromotion: Promotion = {
        id: 'promo-1',
        business_id: 'business-1',
        product_id: 'product-1',
        promotion_type: 'discount',
        discount_percentage: 20,
        start_date: startDate,
        end_date: endDate,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = store.getState().promotions;
            expect(state.promotions).toEqual([]);
            expect(state.activePromotions).toEqual([]);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('fetchBusinessPromotions', () => {
        it('should handle fetchBusinessPromotions.pending', () => {
            store.dispatch({ type: 'promotions/fetchBusinessPromotions/pending' });
            const state = store.getState().promotions;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchBusinessPromotions.fulfilled', () => {
            store.dispatch({
                type: 'promotions/fetchBusinessPromotions/fulfilled',
                payload: [mockPromotion],
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.promotions).toEqual([mockPromotion]);
            expect(state.activePromotions).toHaveLength(1);
        });

        it('should filter active promotions correctly', () => {
            const expiredPromo = {
                ...mockPromotion,
                id: 'promo-2',
                start_date: new Date(now.getTime() - 172800000).toISOString(), // 2 days ago
                end_date: new Date(now.getTime() - 86400000).toISOString(), // Yesterday
            };
            store.dispatch({
                type: 'promotions/fetchBusinessPromotions/fulfilled',
                payload: [mockPromotion, expiredPromo],
            });
            const state = store.getState().promotions;
            expect(state.activePromotions).toHaveLength(1);
            expect(state.activePromotions[0].id).toBe('promo-1');
        });

        it('should handle fetchBusinessPromotions.rejected', () => {
            const errorMessage = 'Failed to fetch promotions';
            store.dispatch({
                type: 'promotions/fetchBusinessPromotions/rejected',
                payload: errorMessage,
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('fetchProductPromotions', () => {
        it('should handle fetchProductPromotions.pending', () => {
            store.dispatch({ type: 'promotions/fetchProductPromotions/pending' });
            const state = store.getState().promotions;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchProductPromotions.fulfilled', () => {
            store.dispatch({
                type: 'promotions/fetchProductPromotions/fulfilled',
                payload: [mockPromotion],
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.activePromotions).toEqual([mockPromotion]);
        });

        it('should handle fetchProductPromotions.rejected', () => {
            const errorMessage = 'Failed to fetch product promotions';
            store.dispatch({
                type: 'promotions/fetchProductPromotions/rejected',
                payload: errorMessage,
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('createPromotion', () => {
        it('should handle createPromotion.pending', () => {
            store.dispatch({ type: 'promotions/createPromotion/pending' });
            const state = store.getState().promotions;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle createPromotion.fulfilled with active promotion', () => {
            store.dispatch({
                type: 'promotions/createPromotion/fulfilled',
                payload: mockPromotion,
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.promotions).toHaveLength(1);
            expect(state.activePromotions).toHaveLength(1);
        });

        it('should not add inactive promotion to activePromotions', () => {
            const inactivePromo = { ...mockPromotion, is_active: false };
            store.dispatch({
                type: 'promotions/createPromotion/fulfilled',
                payload: inactivePromo,
            });
            const state = store.getState().promotions;
            expect(state.promotions).toHaveLength(1);
            expect(state.activePromotions).toHaveLength(0);
        });

        it('should handle createPromotion.rejected', () => {
            const errorMessage = 'Invalid promotion data';
            store.dispatch({
                type: 'promotions/createPromotion/rejected',
                payload: errorMessage,
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('updatePromotion', () => {
        beforeEach(() => {
            store.dispatch({
                type: 'promotions/fetchBusinessPromotions/fulfilled',
                payload: [mockPromotion],
            });
        });

        it('should handle updatePromotion.pending', () => {
            store.dispatch({ type: 'promotions/updatePromotion/pending' });
            const state = store.getState().promotions;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle updatePromotion.fulfilled', () => {
            const updatedPromo = {
                ...mockPromotion,
                discount_percentage: 30,
            };
            store.dispatch({
                type: 'promotions/updatePromotion/fulfilled',
                payload: updatedPromo,
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.promotions[0].discount_percentage).toBe(30);
        });

        it('should add to activePromotions when promotion becomes active', () => {
            const inactivePromo = { ...mockPromotion, is_active: false };
            store.dispatch({
                type: 'promotions/fetchBusinessPromotions/fulfilled',
                payload: [inactivePromo],
            });
            const activatedPromo = { ...inactivePromo, is_active: true };
            store.dispatch({
                type: 'promotions/updatePromotion/fulfilled',
                payload: activatedPromo,
            });
            const state = store.getState().promotions;
            expect(state.activePromotions).toHaveLength(1);
        });

        it('should remove from activePromotions when promotion becomes inactive', () => {
            const deactivatedPromo = { ...mockPromotion, is_active: false };
            store.dispatch({
                type: 'promotions/updatePromotion/fulfilled',
                payload: deactivatedPromo,
            });
            const state = store.getState().promotions;
            expect(state.activePromotions).toHaveLength(0);
        });

        it('should handle updatePromotion.rejected', () => {
            const errorMessage = 'Failed to update promotion';
            store.dispatch({
                type: 'promotions/updatePromotion/rejected',
                payload: errorMessage,
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('deletePromotion', () => {
        beforeEach(() => {
            store.dispatch({
                type: 'promotions/fetchBusinessPromotions/fulfilled',
                payload: [mockPromotion],
            });
        });

        it('should handle deletePromotion.pending', () => {
            store.dispatch({ type: 'promotions/deletePromotion/pending' });
            const state = store.getState().promotions;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle deletePromotion.fulfilled', () => {
            store.dispatch({
                type: 'promotions/deletePromotion/fulfilled',
                payload: 'promo-1',
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.promotions).toHaveLength(0);
            expect(state.activePromotions).toHaveLength(0);
        });

        it('should handle deletePromotion.rejected', () => {
            const errorMessage = 'Failed to delete promotion';
            store.dispatch({
                type: 'promotions/deletePromotion/rejected',
                payload: errorMessage,
            });
            const state = store.getState().promotions;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('clearPromotions', () => {
        it('should clear all promotions', () => {
            store.dispatch({
                type: 'promotions/fetchBusinessPromotions/fulfilled',
                payload: [mockPromotion],
            });
            store.dispatch(clearPromotions());
            const state = store.getState().promotions;
            expect(state.promotions).toEqual([]);
            expect(state.activePromotions).toEqual([]);
        });
    });

    describe('date validation', () => {
        it('should correctly identify active promotions based on dates', () => {
            const futurePromo = {
                ...mockPromotion,
                id: 'promo-2',
                start_date: new Date(now.getTime() + 86400000).toISOString(), // Tomorrow
                end_date: new Date(now.getTime() + 172800000).toISOString(), // Day after tomorrow
            };
            store.dispatch({
                type: 'promotions/fetchBusinessPromotions/fulfilled',
                payload: [mockPromotion, futurePromo],
            });
            const state = store.getState().promotions;
            expect(state.activePromotions).toHaveLength(1);
            expect(state.activePromotions[0].id).toBe('promo-1');
        });
    });
});

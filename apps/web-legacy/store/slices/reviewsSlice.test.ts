// Import the mock first to set up environment
import '@/src/test/mocks/supabaseClient';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import reviewsReducer, {
    fetchProductReviews,
    createReview,
    updateReview,
    deleteReview,
    clearReviews,
} from './reviewsSlice';
import { ProductReview } from '../../types';

describe('reviewsSlice', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                reviews: reviewsReducer,
            },
        });
        vi.clearAllMocks();
    });

    const mockReview: ProductReview = {
        id: 'review-1',
        product_id: 'product-1',
        user_id: 'user-1',
        order_id: 'order-1',
        rating: 5,
        review_text: 'Great product!',
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = store.getState().reviews;
            expect(state.reviews).toEqual([]);
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('fetchProductReviews', () => {
        it('should handle fetchProductReviews.pending', () => {
            store.dispatch({ type: 'reviews/fetchProductReviews/pending' });
            const state = store.getState().reviews;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchProductReviews.fulfilled', () => {
            store.dispatch({
                type: 'reviews/fetchProductReviews/fulfilled',
                payload: [mockReview],
            });
            const state = store.getState().reviews;
            expect(state.loading).toBe(false);
            expect(state.reviews).toEqual([mockReview]);
        });

        it('should handle fetchProductReviews.rejected', () => {
            const errorMessage = 'Failed to fetch reviews';
            store.dispatch({
                type: 'reviews/fetchProductReviews/rejected',
                payload: errorMessage,
            });
            const state = store.getState().reviews;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });

        it('should handle empty reviews array', () => {
            store.dispatch({
                type: 'reviews/fetchProductReviews/fulfilled',
                payload: [],
            });
            const state = store.getState().reviews;
            expect(state.reviews).toEqual([]);
        });
    });

    describe('createReview', () => {
        it('should handle createReview.pending', () => {
            store.dispatch({ type: 'reviews/createReview/pending' });
            const state = store.getState().reviews;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle createReview.fulfilled', () => {
            store.dispatch({
                type: 'reviews/createReview/fulfilled',
                payload: mockReview,
            });
            const state = store.getState().reviews;
            expect(state.loading).toBe(false);
            expect(state.reviews).toHaveLength(1);
            expect(state.reviews[0]).toEqual(mockReview);
        });

        it('should add new review to beginning of array', () => {
            const existingReview = { ...mockReview, id: 'review-2' };
            store.dispatch({
                type: 'reviews/fetchProductReviews/fulfilled',
                payload: [existingReview],
            });
            store.dispatch({
                type: 'reviews/createReview/fulfilled',
                payload: mockReview,
            });
            const state = store.getState().reviews;
            expect(state.reviews).toHaveLength(2);
            expect(state.reviews[0]).toEqual(mockReview);
            expect(state.reviews[1]).toEqual(existingReview);
        });

        it('should handle createReview.rejected', () => {
            const errorMessage = 'Order not found or unauthorized';
            store.dispatch({
                type: 'reviews/createReview/rejected',
                payload: errorMessage,
            });
            const state = store.getState().reviews;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('updateReview', () => {
        beforeEach(() => {
            store.dispatch({
                type: 'reviews/fetchProductReviews/fulfilled',
                payload: [mockReview],
            });
        });

        it('should handle updateReview.pending', () => {
            store.dispatch({ type: 'reviews/updateReview/pending' });
            const state = store.getState().reviews;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle updateReview.fulfilled', () => {
            const updatedReview = {
                ...mockReview,
                rating: 4,
                review_text: 'Updated review text',
            };
            store.dispatch({
                type: 'reviews/updateReview/fulfilled',
                payload: updatedReview,
            });
            const state = store.getState().reviews;
            expect(state.loading).toBe(false);
            expect(state.reviews[0].rating).toBe(4);
            expect(state.reviews[0].review_text).toBe('Updated review text');
        });

        it('should handle updating non-existent review', () => {
            const updatedReview = {
                ...mockReview,
                id: 'non-existent',
                rating: 3,
            };
            store.dispatch({
                type: 'reviews/updateReview/fulfilled',
                payload: updatedReview,
            });
            const state = store.getState().reviews;
            expect(state.reviews[0]).toEqual(mockReview); // Unchanged
        });

        it('should handle updateReview.rejected', () => {
            const errorMessage = 'Failed to update review';
            store.dispatch({
                type: 'reviews/updateReview/rejected',
                payload: errorMessage,
            });
            const state = store.getState().reviews;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('deleteReview', () => {
        beforeEach(() => {
            store.dispatch({
                type: 'reviews/fetchProductReviews/fulfilled',
                payload: [mockReview, { ...mockReview, id: 'review-2' }],
            });
        });

        it('should handle deleteReview.pending', () => {
            store.dispatch({ type: 'reviews/deleteReview/pending' });
            const state = store.getState().reviews;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle deleteReview.fulfilled', () => {
            store.dispatch({
                type: 'reviews/deleteReview/fulfilled',
                payload: 'review-1',
            });
            const state = store.getState().reviews;
            expect(state.loading).toBe(false);
            expect(state.reviews).toHaveLength(1);
            expect(state.reviews[0].id).toBe('review-2');
        });

        it('should handle deleting non-existent review', () => {
            store.dispatch({
                type: 'reviews/deleteReview/fulfilled',
                payload: 'non-existent',
            });
            const state = store.getState().reviews;
            expect(state.reviews).toHaveLength(2); // Unchanged
        });

        it('should handle deleteReview.rejected', () => {
            const errorMessage = 'Failed to delete review';
            store.dispatch({
                type: 'reviews/deleteReview/rejected',
                payload: errorMessage,
            });
            const state = store.getState().reviews;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('clearReviews', () => {
        it('should clear all reviews', () => {
            store.dispatch({
                type: 'reviews/fetchProductReviews/fulfilled',
                payload: [mockReview],
            });
            store.dispatch(clearReviews());
            const state = store.getState().reviews;
            expect(state.reviews).toEqual([]);
        });
    });
});

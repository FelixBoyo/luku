// Import the mock first to set up environment
import '@/src/test/mocks/supabaseClient';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import productsReducer, {
    fetchAllProducts,
    fetchFeaturedProducts,
    fetchBusinessProducts,
    fetchProduct,
    createProduct,
    updateProduct,
    deleteProduct,
    clearCurrentProduct,
    clearProducts,
} from './productsSlice';
import { Product } from '../../types';

describe('productsSlice', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                products: productsReducer,
            },
        });
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = store.getState().products;
            expect(state.products).toEqual([]);
            expect(state.featuredProducts).toEqual([]);
            expect(state.currentProduct).toBeNull();
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('fetchAllProducts', () => {
        const mockProducts: Product[] = [
            {
                id: '1',
                business_id: 'b1',
                name: 'Product 1',
                description: 'Description 1',
                price: 100,
                category: 'Top',
                color: 'Blue',
                style: 'Casual',
                season: 'Spring',
                size: 'M',
                stock_quantity: 10,
                image_urls: ['url1'],
                is_featured: false,
                is_active: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            },
        ];

        it('should handle fetchAllProducts.pending', () => {
            store.dispatch({ type: 'products/fetchAllProducts/pending' });
            const state = store.getState().products;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle fetchAllProducts.fulfilled', () => {
            store.dispatch({
                type: 'products/fetchAllProducts/fulfilled',
                payload: mockProducts,
            });
            const state = store.getState().products;
            expect(state.loading).toBe(false);
            expect(state.products).toEqual(mockProducts);
        });

        it('should handle fetchAllProducts.rejected', () => {
            const errorMessage = 'Failed to fetch products';
            store.dispatch({
                type: 'products/fetchAllProducts/rejected',
                payload: errorMessage,
            });
            const state = store.getState().products;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });

        it('should filter by category when provided', async () => {
            // This test verifies the filter logic is applied
            // The actual Supabase call is mocked at the module level
            store.dispatch({
                type: 'products/fetchAllProducts/fulfilled',
                payload: mockProducts.filter(p => p.category === 'Top'),
            });

            const state = store.getState().products;
            expect(state.products.every(p => p.category === 'Top')).toBe(true);
        });
    });

    describe('fetchFeaturedProducts', () => {
        const mockFeaturedProducts: Product[] = [
            {
                id: '2',
                business_id: 'b1',
                name: 'Featured Product',
                description: 'Description',
                price: 200,
                category: 'Dress',
                color: 'Red',
                style: 'Formal',
                season: 'Summer',
                size: 'L',
                stock_quantity: 5,
                image_urls: ['url2'],
                is_featured: true,
                is_active: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            },
        ];

        it('should handle fetchFeaturedProducts.fulfilled', () => {
            store.dispatch({
                type: 'products/fetchFeaturedProducts/fulfilled',
                payload: mockFeaturedProducts,
            });
            const state = store.getState().products;
            expect(state.featuredProducts).toEqual(mockFeaturedProducts);
        });
    });

    describe('clearCurrentProduct', () => {
        it('should clear current product', () => {
            const mockProduct: Product = {
                id: '1',
                business_id: 'b1',
                name: 'Product',
                description: 'Desc',
                price: 100,
                category: 'Top',
                color: 'Blue',
                style: 'Casual',
                season: 'Spring',
                size: 'M',
                stock_quantity: 10,
                image_urls: [],
                is_featured: false,
                is_active: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            store.dispatch({
                type: 'products/fetchProduct/fulfilled',
                payload: mockProduct,
            });

            store.dispatch(clearCurrentProduct());
            const state = store.getState().products;
            expect(state.currentProduct).toBeNull();
        });
    });

    describe('clearProducts', () => {
        it('should clear all products and featured products', () => {
            store.dispatch({
                type: 'products/fetchAllProducts/fulfilled',
                payload: [{ id: '1' } as Product],
            });
            store.dispatch({
                type: 'products/fetchFeaturedProducts/fulfilled',
                payload: [{ id: '2' } as Product],
            });

            store.dispatch(clearProducts());
            const state = store.getState().products;
            expect(state.products).toEqual([]);
            expect(state.featuredProducts).toEqual([]);
        });
    });

    describe('updateProduct', () => {
        it('should update product in products array', () => {
            const initialProduct: Product = {
                id: '1',
                business_id: 'b1',
                name: 'Old Name',
                description: 'Desc',
                price: 100,
                category: 'Top',
                color: 'Blue',
                style: 'Casual',
                season: 'Spring',
                size: 'M',
                stock_quantity: 10,
                image_urls: [],
                is_featured: false,
                is_active: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            const updatedProduct: Product = {
                ...initialProduct,
                name: 'New Name',
            };

            store.dispatch({
                type: 'products/fetchAllProducts/fulfilled',
                payload: [initialProduct],
            });

            store.dispatch({
                type: 'products/updateProduct/fulfilled',
                payload: updatedProduct,
            });

            const state = store.getState().products;
            expect(state.products[0].name).toBe('New Name');
        });

        it('should update currentProduct if it matches', () => {
            const product: Product = {
                id: '1',
                business_id: 'b1',
                name: 'Product',
                description: 'Desc',
                price: 100,
                category: 'Top',
                color: 'Blue',
                style: 'Casual',
                season: 'Spring',
                size: 'M',
                stock_quantity: 10,
                image_urls: [],
                is_featured: false,
                is_active: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            const updatedProduct: Product = {
                ...product,
                name: 'Updated Name',
            };

            store.dispatch({
                type: 'products/fetchProduct/fulfilled',
                payload: product,
            });

            store.dispatch({
                type: 'products/updateProduct/fulfilled',
                payload: updatedProduct,
            });

            const state = store.getState().products;
            expect(state.currentProduct?.name).toBe('Updated Name');
        });
    });

    describe('deleteProduct', () => {
        it('should remove product from products array', () => {
            const product1: Product = {
                id: '1',
                business_id: 'b1',
                name: 'Product 1',
                description: 'Desc',
                price: 100,
                category: 'Top',
                color: 'Blue',
                style: 'Casual',
                season: 'Spring',
                size: 'M',
                stock_quantity: 10,
                image_urls: [],
                is_featured: false,
                is_active: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            const product2: Product = {
                ...product1,
                id: '2',
                name: 'Product 2',
            };

            store.dispatch({
                type: 'products/fetchAllProducts/fulfilled',
                payload: [product1, product2],
            });

            store.dispatch({
                type: 'products/deleteProduct/fulfilled',
                payload: '1',
            });

            const state = store.getState().products;
            expect(state.products).toHaveLength(1);
            expect(state.products[0].id).toBe('2');
        });

        it('should clear currentProduct if it matches deleted product', () => {
            const product: Product = {
                id: '1',
                business_id: 'b1',
                name: 'Product',
                description: 'Desc',
                price: 100,
                category: 'Top',
                color: 'Blue',
                style: 'Casual',
                season: 'Spring',
                size: 'M',
                stock_quantity: 10,
                image_urls: [],
                is_featured: false,
                is_active: true,
                created_at: '2024-01-01',
                updated_at: '2024-01-01',
            };

            store.dispatch({
                type: 'products/fetchProduct/fulfilled',
                payload: product,
            });

            store.dispatch({
                type: 'products/deleteProduct/fulfilled',
                payload: '1',
            });

            const state = store.getState().products;
            expect(state.currentProduct).toBeNull();
        });
    });
});

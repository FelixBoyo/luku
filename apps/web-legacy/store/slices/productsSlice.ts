import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { Product } from '../../types';
import { validateProductData, isValidUUID, getValidationErrorMessage } from '@core/validation';
import { getWardrobeBasedRecommendations, WardrobeRecommendation } from '../../services/marketplaceService';
import { withRetry } from '../../services/retryHandler';

interface ProductsState {
    products: Product[];
    featuredProducts: Product[];
    currentProduct: Product | null;
    wardrobeRecommendations: WardrobeRecommendation[];
    loading: boolean;
    error: string | null;
    pagination: {
        totalCount: number;
        totalPages: number;
        currentPage: number;
    } | null;
}

const initialState: ProductsState = {
    products: [],
    featuredProducts: [],
    currentProduct: null,
    wardrobeRecommendations: [],
    loading: false,
    error: null,
    pagination: null,
};

const SUPABASE_RETRY_OPTIONS = {
    maxRetries: 3,
    initialDelay: 500,
    retryableErrors: ['PGRST116', 'NetworkError', 'Failed to fetch', 'TIMEOUT'],
} as const;

// Fetch all active products (for marketplace) with pagination support
export const fetchAllProducts = createAsyncThunk(
    'products/fetchAllProducts',
    async (params: {
        filters?: {
            category?: string;
            color?: string;
            style?: string;
            minPrice?: number;
            maxPrice?: number;
            search?: string;
        };
        page?: number;
        pageSize?: number;
        usePagination?: boolean;
    } = {}, { rejectWithValue }) => {
        try {
            const { filters, page = 1, pageSize = 20, usePagination = false } = params;

            // Use optimized database function for paginated search with fallback
            if (usePagination) {
                try {
                    const data = await withRetry(
                        async () => {
                            const { data, error } = await supabase.rpc('search_products_paginated', {
                                p_search_term: filters?.search || null,
                                p_category: filters?.category || null,
                                p_color: filters?.color || null,
                                p_style: filters?.style || null,
                                p_min_price: filters?.minPrice || null,
                                p_max_price: filters?.maxPrice || null,
                                p_page: page,
                                p_page_size: pageSize,
                            });

                            if (error) {
                                throw error;
                            }

                            return data;
                        },
                        SUPABASE_RETRY_OPTIONS
                    );

                    const result = data?.[0];
                    return {
                        products: result?.products || [],
                        totalCount: result?.total_count || 0,
                        totalPages: result?.total_pages || 0,
                        currentPage: page,
                    };
                } catch (error: any) {
                    // Fall through to manual query if RPC fails
                    if (error.code === '42883' || error.message?.includes('function') || error.message?.includes('does not exist')) {
                        console.warn('RPC function not available, using fallback pagination');
                    } else {
                        throw error;
                    }
                }
            }

            // Fallback to direct query for backward compatibility
            const applyFilters = <T extends { eq: Function; gte: Function; lte: Function; or: Function }>(query: T) => {
                let q: any = query;

                if (filters?.category) {
                    q = q.eq('category', filters.category);
                }
                if (filters?.color) {
                    q = q.eq('color', filters.color);
                }
                if (filters?.style) {
                    q = q.eq('style', filters.style);
                }
                if (filters?.minPrice) {
                    q = q.gte('price', filters.minPrice);
                }
                if (filters?.maxPrice) {
                    q = q.lte('price', filters.maxPrice);
                }
                if (filters?.search) {
                    q = q.or(`name.ilike.%${filters.search}%,description.ilike.%${filters.search}%`);
                }

                return q;
            };

            // Apply pagination even in fallback mode
            const from = pageSize ? (page - 1) * pageSize : 0;
            const to = pageSize ? from + pageSize - 1 : undefined;

            const [countResult, dataResult] = await Promise.all([
                withRetry(
                    async () => {
                        const { error, count } = await applyFilters(
                            supabase
                                .from('products_with_ratings')
                                .select('*', { count: 'exact', head: true })
                                .eq('is_active', true)
                        );

                        if (error) {
                            throw error;
                        }

                        return { count };
                    },
                    SUPABASE_RETRY_OPTIONS
                ),
                withRetry(
                    async () => {
                        let query = applyFilters(
                            supabase
                                .from('products_with_ratings')
                                .select('*')
                                .eq('is_active', true)
                                .order('created_at', { ascending: false })
                        );

                        if (to !== undefined) {
                            query = query.range(from, to);
                        }

                        const { data, error } = await query;

                        if (error) {
                            throw error;
                        }

                        return { data };
                    },
                    SUPABASE_RETRY_OPTIONS
                ),
            ]);

            const totalCount = countResult.count || 0;

            return {
                products: dataResult.data || [],
                totalCount,
                totalPages: pageSize ? Math.ceil(totalCount / pageSize) : 1,
                currentPage: page,
            };
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Fetch featured products
export const fetchFeaturedProducts = createAsyncThunk(
    'products/fetchFeaturedProducts',
    async (_, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('products_with_ratings')
                .select('*')
                .eq('is_active', true)
                .eq('is_featured', true)
                .order('created_at', { ascending: false })
                .limit(12);

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Fetch products for a business
export const fetchBusinessProducts = createAsyncThunk(
    'products/fetchBusinessProducts',
    async (businessId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('products')
                .select('*')
                .eq('business_id', businessId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Fetch single product
export const fetchProduct = createAsyncThunk(
    'products/fetchProduct',
    async (productId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('products_with_ratings')
                .select('*')
                .eq('id', productId)
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Create product
export const createProduct = createAsyncThunk(
    'products/createProduct',
    async (productData: {
        business_id: string;
        name: string;
        description: string;
        price: number;
        category: string;
        color: string;
        style: string;
        season: string;
        size: string;
        stock_quantity: number;
        image_urls: string[];
    }, { rejectWithValue }) => {
        try {
            // Validate business_id
            if (!isValidUUID(productData.business_id)) {
                return rejectWithValue('Invalid business ID format');
            }

            // Validate product data
            const validation = validateProductData(productData);
            if (!validation.isValid) {
                return rejectWithValue(getValidationErrorMessage(validation.errors));
            }

            const { data, error } = await supabase
                .from('products')
                .insert(productData)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to create product');
        }
    }
);

// Update product
export const updateProduct = createAsyncThunk(
    'products/updateProduct',
    async ({ id, updates }: { id: string; updates: Partial<Product> }, { rejectWithValue }) => {
        try {
            // Validate product ID
            if (!isValidUUID(id)) {
                return rejectWithValue('Invalid product ID format');
            }

            // Validate updates if provided
            if (Object.keys(updates).length > 0) {
                const validation = validateProductData(updates as any);
                if (!validation.isValid) {
                    // Only return errors for fields that are being updated
                    const relevantErrors: Record<string, string> = {};
                    Object.keys(updates).forEach(key => {
                        if (validation.errors[key as keyof typeof validation.errors]) {
                            relevantErrors[key] = validation.errors[key as keyof typeof validation.errors]!;
                        }
                    });
                    if (Object.keys(relevantErrors).length > 0) {
                        return rejectWithValue(getValidationErrorMessage(relevantErrors));
                    }
                }
            }

            const { data, error } = await supabase
                .from('products')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to update product');
        }
    }
);

// Delete product
export const deleteProduct = createAsyncThunk(
    'products/deleteProduct',
    async (productId: string, { rejectWithValue }) => {
        try {
            // Validate product ID
            if (!isValidUUID(productId)) {
                return rejectWithValue('Invalid product ID format');
            }

            const { error } = await supabase
                .from('products')
                .delete()
                .eq('id', productId);

            if (error) throw error;
            return productId;
        } catch (error: any) {
            return rejectWithValue(error.message || 'Failed to delete product');
        }
    }
);

const productsSlice = createSlice({
    name: 'products',
    initialState,
    reducers: {
        clearCurrentProduct: (state) => {
            state.currentProduct = null;
        },
        clearProducts: (state) => {
            state.products = [];
            state.featuredProducts = [];
        },
        clearWardrobeRecommendations: (state) => {
            state.wardrobeRecommendations = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchAllProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchAllProducts.fulfilled, (state, action) => {
                state.loading = false;
                if (action.payload && typeof action.payload === 'object' && 'products' in action.payload) {
                    state.products = action.payload.products;
                    state.pagination = {
                        totalCount: action.payload.totalCount,
                        totalPages: action.payload.totalPages,
                        currentPage: action.payload.currentPage,
                    };
                } else {
                    // Backward compatibility
                    state.products = action.payload as any;
                    state.pagination = null;
                }
            })
            .addCase(fetchAllProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchFeaturedProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchFeaturedProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.featuredProducts = action.payload;
            })
            .addCase(fetchFeaturedProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchBusinessProducts.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBusinessProducts.fulfilled, (state, action) => {
                state.loading = false;
                state.products = action.payload;
            })
            .addCase(fetchBusinessProducts.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.currentProduct = action.payload;
            })
            .addCase(fetchProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products.unshift(action.payload);
            })
            .addCase(createProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateProduct.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.products.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.products[index] = action.payload;
                }
                if (state.currentProduct?.id === action.payload.id) {
                    state.currentProduct = action.payload;
                }
            })
            .addCase(updateProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteProduct.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteProduct.fulfilled, (state, action) => {
                state.loading = false;
                state.products = state.products.filter(p => p.id !== action.payload);
                if (state.currentProduct?.id === action.payload) {
                    state.currentProduct = null;
                }
            })
            .addCase(deleteProduct.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearCurrentProduct, clearProducts, clearWardrobeRecommendations } = productsSlice.actions;
export default productsSlice.reducer;


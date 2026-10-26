import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { ProductReview } from '../../types';

interface ReviewsState {
    reviews: ProductReview[];
    loading: boolean;
    error: string | null;
}

const initialState: ReviewsState = {
    reviews: [],
    loading: false,
    error: null,
};

// Fetch reviews for a product
export const fetchProductReviews = createAsyncThunk(
    'reviews/fetchProductReviews',
    async (productId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('product_reviews')
                .select('*')
                .eq('product_id', productId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Create review
export const createReview = createAsyncThunk(
    'reviews/createReview',
    async (reviewData: {
        product_id: string;
        order_id: string;
        rating: number;
        review_text?: string;
    }, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            // Verify order belongs to user
            const { data: order, error: orderError } = await supabase
                .from('orders')
                .select('id, buyer_id')
                .eq('id', reviewData.order_id)
                .single();

            if (orderError || !order || order.buyer_id !== user.id) {
                throw new Error('Order not found or unauthorized');
            }

            const { data, error } = await supabase
                .from('product_reviews')
                .insert({
                    ...reviewData,
                    user_id: user.id,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Update review
export const updateReview = createAsyncThunk(
    'reviews/updateReview',
    async ({ reviewId, updates }: {
        reviewId: string;
        updates: { rating?: number; review_text?: string };
    }, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('product_reviews')
                .update(updates)
                .eq('id', reviewId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Delete review
export const deleteReview = createAsyncThunk(
    'reviews/deleteReview',
    async (reviewId: string, { rejectWithValue }) => {
        try {
            const { error } = await supabase
                .from('product_reviews')
                .delete()
                .eq('id', reviewId);

            if (error) throw error;
            return reviewId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const reviewsSlice = createSlice({
    name: 'reviews',
    initialState,
    reducers: {
        clearReviews: (state) => {
            state.reviews = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchProductReviews.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductReviews.fulfilled, (state, action) => {
                state.loading = false;
                state.reviews = action.payload;
            })
            .addCase(fetchProductReviews.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createReview.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createReview.fulfilled, (state, action) => {
                state.loading = false;
                state.reviews.unshift(action.payload);
            })
            .addCase(createReview.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateReview.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateReview.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.reviews.findIndex(r => r.id === action.payload.id);
                if (index !== -1) {
                    state.reviews[index] = action.payload;
                }
            })
            .addCase(updateReview.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deleteReview.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deleteReview.fulfilled, (state, action) => {
                state.loading = false;
                state.reviews = state.reviews.filter(r => r.id !== action.payload);
            })
            .addCase(deleteReview.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearReviews } = reviewsSlice.actions;
export default reviewsSlice.reducer;


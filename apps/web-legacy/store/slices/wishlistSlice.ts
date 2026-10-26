import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { Product } from '../../types';
import { trackEvent } from '../../analytics/events';

interface WishlistItem {
    id: string;
    product_id: string;
    created_at: string;
    product?: Product;
}

interface WishlistState {
    items: WishlistItem[];
    productIds: string[];
    loading: boolean;
    error: string | null;
}

const initialState: WishlistState = {
    items: [],
    productIds: [],
    loading: false,
    error: null,
};

// Fetch user's wishlist
export const fetchWishlist = createAsyncThunk(
    'wishlist/fetchWishlist',
    async (_, { rejectWithValue }) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('wishlist')
                .select('*, product:products(*)')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Add product to wishlist
export const addToWishlist = createAsyncThunk(
    'wishlist/addToWishlist',
    async (productId: string, { rejectWithValue }) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('wishlist')
                .insert({
                    user_id: user.id,
                    product_id: productId,
                })
                .select('*, product:products(*)')
                .single();

            if (error) throw error;

            // Track wishlist add
            try {
                await trackEvent('product_added_to_wishlist', {
                    productId,
                });
            } catch {
                // Non-fatal
            }

            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Remove product from wishlist
export const removeFromWishlist = createAsyncThunk(
    'wishlist/removeFromWishlist',
    async (productId: string, { rejectWithValue }) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { error } = await supabase
                .from('wishlist')
                .delete()
                .eq('user_id', user.id)
                .eq('product_id', productId);

            if (error) throw error;
            return productId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Check if product is in wishlist
export const checkWishlistStatus = createAsyncThunk(
    'wishlist/checkWishlistStatus',
    async (productIds: string[], { rejectWithValue }) => {
        try {
            const {
                data: { user },
            } = await supabase.auth.getUser();
            if (!user) return [] as string[];

            const { data, error } = await supabase
                .from('wishlist')
                .select('product_id')
                .eq('user_id', user.id)
                .in('product_id', productIds);

            if (error) throw error;
            return (data || []).map((item) => item.product_id);
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const wishlistSlice = createSlice({
    name: 'wishlist',
    initialState,
    reducers: {
        clearWishlist: (state) => {
            state.items = [];
            state.productIds = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWishlist.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchWishlist.fulfilled, (state, action) => {
                state.loading = false;
                state.items = action.payload;
                state.productIds = action.payload.map(
                    (item) => item.product_id
                );
            })
            .addCase(fetchWishlist.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(addToWishlist.fulfilled, (state, action) => {
                state.items.push(action.payload);
                if (!state.productIds.includes(action.payload.product_id)) {
                    state.productIds.push(action.payload.product_id);
                }
            })
            .addCase(removeFromWishlist.fulfilled, (state, action) => {
                state.items = state.items.filter(
                    (item) => item.product_id !== action.payload
                );
                state.productIds = state.productIds.filter(
                    (id) => id !== action.payload
                );
            })
            .addCase(checkWishlistStatus.fulfilled, (state, action) => {
                state.productIds = action.payload;
            });
    },
});

export const { clearWishlist } = wishlistSlice.actions;
export default wishlistSlice.reducer;

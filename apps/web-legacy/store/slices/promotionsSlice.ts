import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { Promotion } from '../../types';
import { trackEvent } from '../../analytics/events';

interface PromotionsState {
    promotions: Promotion[];
    activePromotions: Promotion[];
    loading: boolean;
    error: string | null;
}

const initialState: PromotionsState = {
    promotions: [],
    activePromotions: [],
    loading: false,
    error: null,
};

// Fetch promotions for a business
export const fetchBusinessPromotions = createAsyncThunk(
    'promotions/fetchBusinessPromotions',
    async (businessId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('promotions')
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

// Fetch active promotions for a product
export const fetchProductPromotions = createAsyncThunk(
    'promotions/fetchProductPromotions',
    async (productId: string, { rejectWithValue }) => {
        try {
            const now = new Date().toISOString();
            const { data, error } = await supabase
                .from('promotions')
                .select('*')
                .eq('is_active', true)
                .or(`product_id.eq.${productId},product_id.is.null`)
                .lte('start_date', now)
                .gte('end_date', now)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Create promotion
export const createPromotion = createAsyncThunk(
    'promotions/createPromotion',
    async (promotionData: {
        business_id: string;
        product_id?: string;
        promotion_type: 'discount' | 'bundle' | 'flash_sale';
        discount_percentage?: number;
        discount_amount?: number;
        start_date: string;
        end_date: string;
    }, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .insert(promotionData)
                .select()
                .single();

            if (error) throw error;

            const created = data as Promotion;

            try {
                await trackEvent('promotion_created', {
                    promotionType: created.promotion_type,
                    discountType: created.discount_percentage
                        ? 'percentage'
                        : created.discount_amount
                        ? 'amount'
                        : undefined,
                    discountValue:
                        created.discount_percentage ??
                        (created.discount_amount
                            ? Number(created.discount_amount)
                            : undefined),
                });
            } catch {
                // Non-fatal
            }

            return created;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Update promotion
export const updatePromotion = createAsyncThunk(
    'promotions/updatePromotion',
    async ({ id, updates }: { id: string; updates: Partial<Promotion> }, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('promotions')
                .update(updates)
                .eq('id', id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Delete promotion
export const deletePromotion = createAsyncThunk(
    'promotions/deletePromotion',
    async (promotionId: string, { rejectWithValue }) => {
        try {
            const { error } = await supabase
                .from('promotions')
                .delete()
                .eq('id', promotionId);

            if (error) throw error;
            return promotionId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const promotionsSlice = createSlice({
    name: 'promotions',
    initialState,
    reducers: {
        clearPromotions: (state) => {
            state.promotions = [];
            state.activePromotions = [];
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBusinessPromotions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBusinessPromotions.fulfilled, (state, action) => {
                state.loading = false;
                state.promotions = action.payload;
                state.activePromotions = action.payload.filter(
                    p => p.is_active && new Date(p.start_date) <= new Date() && new Date(p.end_date) >= new Date()
                );
            })
            .addCase(fetchBusinessPromotions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(fetchProductPromotions.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProductPromotions.fulfilled, (state, action) => {
                state.loading = false;
                state.activePromotions = action.payload;
            })
            .addCase(fetchProductPromotions.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createPromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createPromotion.fulfilled, (state, action) => {
                state.loading = false;
                state.promotions.unshift(action.payload);
                if (action.payload.is_active) {
                    state.activePromotions.push(action.payload);
                }
            })
            .addCase(createPromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updatePromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updatePromotion.fulfilled, (state, action) => {
                state.loading = false;
                const index = state.promotions.findIndex(p => p.id === action.payload.id);
                if (index !== -1) {
                    state.promotions[index] = action.payload;
                }
                // Update active promotions
                const activeIndex = state.activePromotions.findIndex(p => p.id === action.payload.id);
                if (action.payload.is_active && new Date(action.payload.start_date) <= new Date() && new Date(action.payload.end_date) >= new Date()) {
                    if (activeIndex === -1) {
                        state.activePromotions.push(action.payload);
                    } else {
                        state.activePromotions[activeIndex] = action.payload;
                    }
                } else if (activeIndex !== -1) {
                    state.activePromotions.splice(activeIndex, 1);
                }
            })
            .addCase(updatePromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(deletePromotion.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(deletePromotion.fulfilled, (state, action) => {
                state.loading = false;
                state.promotions = state.promotions.filter(p => p.id !== action.payload);
                state.activePromotions = state.activePromotions.filter(p => p.id !== action.payload);
            })
            .addCase(deletePromotion.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearPromotions } = promotionsSlice.actions;
export default promotionsSlice.reducer;


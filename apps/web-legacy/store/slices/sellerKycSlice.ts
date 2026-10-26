import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import type { SellerKyc } from '../../types';

interface SellerKycState {
    data: SellerKyc | null;
    loading: boolean;
    error: string | null;
}

const initialState: SellerKycState = {
    data: null,
    loading: false,
    error: null,
};

export const fetchSellerKyc = createAsyncThunk(
    'sellerKyc/fetch',
    async (_, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('seller_kyc')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const upsertSellerKyc = createAsyncThunk(
    'sellerKyc/upsert',
    async (
        payload: {
            legal_name: string;
            phone: string;
            address_line1: string;
            city: string;
            state_region?: string;
            postal_code: string;
            country: string;
            date_of_birth?: string;
            id_type?: string;
            id_number?: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const row = {
                user_id: user.id,
                ...payload,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('seller_kyc')
                .upsert(row, {
                    onConflict: 'user_id',
                    ignoreDuplicates: false,
                })
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

const sellerKycSlice = createSlice({
    name: 'sellerKyc',
    initialState,
    reducers: {
        clearSellerKyc: (state) => {
            state.data = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchSellerKyc.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchSellerKyc.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchSellerKyc.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.data = null;
            })
            .addCase(upsertSellerKyc.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(upsertSellerKyc.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(upsertSellerKyc.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearSellerKyc } = sellerKycSlice.actions;
export default sellerKycSlice.reducer;

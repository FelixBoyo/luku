import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import type { BusinessKyc } from '../../types';
import { trackEvent } from '../../analytics/events';

interface BusinessKycState {
    data: BusinessKyc | null;
    loading: boolean;
    error: string | null;
}

const initialState: BusinessKycState = {
    data: null,
    loading: false,
    error: null,
};

export const fetchBusinessKyc = createAsyncThunk(
    'businessKyc/fetch',
    async (businessId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('business_kyc')
                .select('*')
                .eq('business_id', businessId)
                .single();

            if (error && error.code !== 'PGRST116') throw error;
            return data;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

export const upsertBusinessKyc = createAsyncThunk(
    'businessKyc/upsert',
    async (
        payload: {
            business_id: string;
            legal_entity_name: string;
            address_line1: string;
            city: string;
            state_region?: string;
            postal_code: string;
            country: string;
            registration_number?: string;
            representative_legal_name: string;
            representative_phone: string;
        },
        { rejectWithValue }
    ) => {
        try {
            const row = {
                ...payload,
                updated_at: new Date().toISOString(),
            };

            const { data, error } = await supabase
                .from('business_kyc')
                .upsert(row, {
                    onConflict: 'business_id',
                    ignoreDuplicates: false,
                })
                .select()
                .single();

            if (error) throw error;

            try {
                await trackEvent('kyc_step_completed', {
                    personaType: 'business',
                    stepName: 'business_kyc_submitted',
                });
            } catch {
                // Non-fatal
            }

            return data;
        } catch (err: any) {
            return rejectWithValue(err.message);
        }
    }
);

const businessKycSlice = createSlice({
    name: 'businessKyc',
    initialState,
    reducers: {
        clearBusinessKyc: (state) => {
            state.data = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBusinessKyc.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBusinessKyc.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(fetchBusinessKyc.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.data = null;
            })
            .addCase(upsertBusinessKyc.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(upsertBusinessKyc.fulfilled, (state, action) => {
                state.loading = false;
                state.data = action.payload;
            })
            .addCase(upsertBusinessKyc.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearBusinessKyc } = businessKycSlice.actions;
export default businessKycSlice.reducer;

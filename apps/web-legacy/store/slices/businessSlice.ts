import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { BusinessAccount } from '../../types';
import { trackEvent } from '../../analytics/events';

interface BusinessState {
    currentBusiness: BusinessAccount | null;
    loading: boolean;
    error: string | null;
}

const initialState: BusinessState = {
    currentBusiness: null,
    loading: false,
    error: null,
};

// Fetch current user's business account
export const fetchBusinessAccount = createAsyncThunk(
    'business/fetchBusinessAccount',
    async (_, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('business_accounts')
                .select('*')
                .eq('user_id', user.id)
                .single();

            if (error && error.code !== 'PGRST116') {
                throw error;
            }

            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Create business account
export const createBusinessAccount = createAsyncThunk(
    'business/createBusinessAccount',
    async (accountData: {
        business_name: string;
        business_description: string;
        contact_email: string;
        logo_url?: string;
        banner_url?: string;
    }, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('business_accounts')
                .insert({
                    user_id: user.id,
                    ...accountData,
                })
                .select()
                .single();

            if (error) throw error;

            const created = data as BusinessAccount;

            try {
                await trackEvent('business_account_created', {
                    businessType: null,
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

// Update business account
export const updateBusinessAccount = createAsyncThunk(
    'business/updateBusinessAccount',
    async (updates: Partial<BusinessAccount>, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('business_accounts')
                .update(updates)
                .eq('user_id', user.id)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const businessSlice = createSlice({
    name: 'business',
    initialState,
    reducers: {
        clearBusiness: (state) => {
            state.currentBusiness = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchBusinessAccount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBusinessAccount.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBusiness = action.payload;
            })
            .addCase(fetchBusinessAccount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
                state.currentBusiness = null;
            })
            .addCase(createBusinessAccount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(createBusinessAccount.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBusiness = action.payload;
            })
            .addCase(createBusinessAccount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(updateBusinessAccount.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(updateBusinessAccount.fulfilled, (state, action) => {
                state.loading = false;
                state.currentBusiness = action.payload;
            })
            .addCase(updateBusinessAccount.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    },
});

export const { clearBusiness } = businessSlice.actions;
export default businessSlice.reducer;


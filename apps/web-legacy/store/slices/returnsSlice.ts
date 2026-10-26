import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';

export interface Return {
    id: string;
    order_id: string;
    user_id: string;
    reason: string;
    status: 'pending' | 'approved' | 'rejected' | 'refunded' | 'completed';
    refund_amount?: number;
    return_photos?: string[];
    notes?: string;
    created_at: string;
    updated_at: string;
}

interface ReturnsState {
    returns: Return[];
    loading: boolean;
    error: string | null;
}

const initialState: ReturnsState = {
    returns: [],
    loading: false,
    error: null,
};

// Fetch buyer's returns
export const fetchBuyerReturns = createAsyncThunk(
    'returns/fetchBuyerReturns',
    async (_, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('returns')
                .select('*')
                .eq('user_id', user.id)
                .order('created_at', { ascending: false });

            if (error) throw error;
            return data || [];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Create return request
export const createReturn = createAsyncThunk(
    'returns/createReturn',
    async (returnData: {
        order_id: string;
        reason: string;
        return_photos?: string[];
        notes?: string;
    }, { rejectWithValue }) => {
        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error('User not authenticated');

            const { data, error } = await supabase
                .from('returns')
                .insert({
                    ...returnData,
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

// Update return status (seller)
export const updateReturnStatus = createAsyncThunk(
    'returns/updateReturnStatus',
    async ({ returnId, status, refund_amount }: {
        returnId: string;
        status: Return['status'];
        refund_amount?: number;
    }, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('returns')
                .update({
                    status,
                    refund_amount,
                    updated_at: new Date().toISOString(),
                })
                .eq('id', returnId)
                .select()
                .single();

            if (error) throw error;
            return data;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const returnsSlice = createSlice({
    name: 'returns',
    initialState,
    reducers: {},
    extraReducers: (builder) => {
        builder
            .addCase(fetchBuyerReturns.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchBuyerReturns.fulfilled, (state, action) => {
                state.loading = false;
                state.returns = action.payload;
            })
            .addCase(fetchBuyerReturns.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(createReturn.fulfilled, (state, action) => {
                state.returns.unshift(action.payload);
            })
            .addCase(updateReturnStatus.fulfilled, (state, action) => {
                const index = state.returns.findIndex(r => r.id === action.payload.id);
                if (index !== -1) {
                    state.returns[index] = action.payload;
                }
            });
    },
});

export default returnsSlice.reducer;

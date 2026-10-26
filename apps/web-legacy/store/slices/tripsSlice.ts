import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { generateTripPlan as generateTripPlanAPI } from '../../services/geminiService';
import { Trip, TripPlan, ClothingItem } from '../../types';
import { trackEvent } from '../../analytics/events';

interface TripsState {
  trip: Trip | null; // Assuming one trip at a time for simplicity
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: TripsState = {
  trip: null,
  loading: 'idle',
  error: null,
};

export const fetchLatestTrip = createAsyncThunk('trips/fetchLatest', async (_, { rejectWithValue }) => {
    try {
        const { data, error } = await supabase
            .from('trips')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(1);
        
        if (error) {
            // Handle 406 (Not Acceptable) - usually RLS or format issue
            if (error.code === 'PGRST301' || error.message?.includes('406')) {
                // Return null instead of rejecting - no trips exist or RLS blocking
                return null;
            }
            return rejectWithValue(error.message);
        }
        
        // Return the first trip if exists, otherwise null
        return data && data.length > 0 ? data[0] : null;
    } catch (error: any) {
        return rejectWithValue(error.message || 'Failed to fetch trip');
    }
});

export interface TripDetails {
    name: string;
    destination: string;
    startDate: string;
    endDate: string;
    notes?: string;
}

export const generateAndSaveTripPlan = createAsyncThunk('trips/generateAndSave', async ({ details, cleanWardrobeItems }: { details: TripDetails, cleanWardrobeItems: ClothingItem[]}, { rejectWithValue, getState }) => {
    const { auth } = getState() as { auth: { session: { user: { id: string } } } };
    const user = auth.session.user;

    const plan = await generateTripPlanAPI(cleanWardrobeItems, details);
    
    const tripToInsert = {
        user_id: user.id,
        name: details.name,
        destination: details.destination,
        start_date: details.startDate,
        end_date: details.endDate,
        notes: details.notes,
        plan: plan as any,
    };

    const { data, error } = await supabase.from('trips').insert(tripToInsert).select().single();
    if (error) return rejectWithValue(error.message);

    const trip = data as Trip;

    // Track trip plan generation
    try {
        await trackEvent('trip_plan_generated', {
            destinationType: details.destination,
            tripDurationDays: details.startDate && details.endDate
                ? Math.max(
                      1,
                      Math.round(
                          (new Date(details.endDate).getTime() -
                              new Date(details.startDate).getTime()) /
                              (1000 * 60 * 60 * 24)
                      )
                  )
                : null,
        });
    } catch {
        // Non-fatal
    }

    return trip;
});

const tripsSlice = createSlice({
    name: 'trips',
    initialState,
    reducers: {
        clearTrip: (state) => {
            state.trip = null;
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchLatestTrip.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(fetchLatestTrip.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.trip = action.payload;
                state.error = null;
            })
            .addCase(fetchLatestTrip.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
                state.trip = null;
            })
            .addCase(generateAndSaveTripPlan.pending, (state) => {
                state.loading = 'pending';
                state.error = null;
            })
            .addCase(generateAndSaveTripPlan.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.trip = action.payload;
            })
            .addCase(generateAndSaveTripPlan.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
            })
    }
});

export const { clearTrip } = tripsSlice.actions;
export default tripsSlice.reducer;

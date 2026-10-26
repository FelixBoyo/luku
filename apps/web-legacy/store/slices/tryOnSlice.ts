import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { MannequinSettings, UserProfileImage, TryOnMode, Outfit } from '../../types';

export interface QueuedOutfit {
    outfit: Outfit;
    timestamp: number;
    source: string; // "discover", "lifestyle_hub", "outfit_of_the_day", etc.
}

interface TryOnState {
    mode: TryOnMode;
    profileImages: UserProfileImage[];
    mannequinSettings: MannequinSettings | null;
    selectedImageId: string | null;
    loading: boolean;
    error: string | null;
    queuedOutfit: QueuedOutfit | null;
    autoVisualize: boolean;
    tryOnHistory: QueuedOutfit[];
}

const initialState: TryOnState = {
    mode: TryOnMode.Mannequin,
    profileImages: [],
    mannequinSettings: null,
    selectedImageId: null,
    loading: false,
    error: null,
    queuedOutfit: null,
    autoVisualize: false,
    tryOnHistory: [],
};

// Fetch user's profile images
export const fetchProfileImages = createAsyncThunk(
    'tryOn/fetchProfileImages',
    async (userId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('user_profile_images')
                .select('*')
                .eq('user_id', userId)
                .order('is_default', { ascending: false })
                .order('created_at', { ascending: false });

            if (error) throw error;

            return data as UserProfileImage[];
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Upload new profile image
export const uploadProfileImage = createAsyncThunk(
    'tryOn/uploadProfileImage',
    async (
        {
            userId,
            imageBlob,
            setAsDefault,
        }: { userId: string; imageBlob: Blob; setAsDefault: boolean },
        { rejectWithValue }
    ) => {
        try {
            // Upload to Supabase Storage
            const fileName = `profile/${userId}/${Date.now()}.jpg`;
            const { error: uploadError } = await supabase.storage
                .from('user-profile-images')
                .upload(fileName, imageBlob, {
                    contentType: 'image/jpeg',
                });

            if (uploadError) throw uploadError;

            const {
                data: { publicUrl },
            } = supabase.storage
                .from('user-profile-images')
                .getPublicUrl(fileName);

            // Save to database
            const { data, error } = await supabase
                .from('user_profile_images')
                .insert({
                    user_id: userId,
                    image_url: publicUrl,
                    is_default: setAsDefault,
                })
                .select()
                .single();

            if (error) throw error;

            return data as UserProfileImage;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Delete profile image
export const deleteProfileImage = createAsyncThunk(
    'tryOn/deleteProfileImage',
    async (
        { imageId, imageUrl }: { imageId: string; imageUrl: string },
        { rejectWithValue }
    ) => {
        try {
            // Extract file path from URL
            const urlParts = imageUrl.split('/');
            const filePath = urlParts
                .slice(urlParts.indexOf('user-profile-images') + 1)
                .join('/');

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('user-profile-images')
                .remove([filePath]);

            if (storageError) throw storageError;

            // Delete from database
            const { error } = await supabase
                .from('user_profile_images')
                .delete()
                .eq('id', imageId);

            if (error) throw error;

            return imageId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Fetch mannequin settings
export const fetchMannequinSettings = createAsyncThunk(
    'tryOn/fetchMannequinSettings',
    async (userId: string, { rejectWithValue }) => {
        try {
            const { data, error } = await supabase
                .from('mannequin_settings')
                .select('*')
                .eq('user_id', userId)
                .single();

            if (error) {
                if (error.code === 'PGRST116') return null; // No settings found
                throw error;
            }

            return data as MannequinSettings;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Save mannequin settings
export const saveMannequinSettings = createAsyncThunk(
    'tryOn/saveMannequinSettings',
    async (
        {
            userId,
            settings,
        }: {
            userId: string;
            settings: Omit<
                MannequinSettings,
                'id' | 'user_id' | 'created_at' | 'updated_at'
            >;
        },
        { rejectWithValue }
    ) => {
        try {
            const { data, error } = await supabase
                .from('mannequin_settings')
                .upsert(
                    {
                        user_id: userId,
                        ...settings,
                        updated_at: new Date().toISOString(),
                    },
                    {
                        onConflict: 'user_id',
                    }
                )
                .select()
                .single();

            if (error) throw error;

            return data as MannequinSettings;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

// Set default profile image
export const setDefaultProfileImage = createAsyncThunk(
    'tryOn/setDefaultProfileImage',
    async (imageId: string, { rejectWithValue }) => {
        try {
            const { error } = await supabase
                .from('user_profile_images')
                .update({ is_default: true })
                .eq('id', imageId);

            if (error) throw error;

            return imageId;
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const tryOnSlice = createSlice({
    name: 'tryOn',
    initialState,
    reducers: {
        setTryOnMode: (state, action: PayloadAction<TryOnMode>) => {
            state.mode = action.payload;
        },
        setSelectedImageId: (state, action: PayloadAction<string | null>) => {
            state.selectedImageId = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
        /**
         * Queue an outfit to be visualized when the user lands in Virtual Try-On.
         * This is set from multiple entry points (Discover, Lifestyle Hub, Trip Planner, etc.).
         */
        queueOutfitForTryOn: (
            state,
            action: PayloadAction<{
                outfit: Outfit;
                source: string;
                autoVisualize?: boolean;
            }>
        ) => {
            state.queuedOutfit = {
                outfit: action.payload.outfit,
                source: action.payload.source,
                timestamp: Date.now(),
            };

            // Allow callers to opt into auto-visualization for this queued outfit.
            if (action.payload.autoVisualize !== undefined) {
                state.autoVisualize = action.payload.autoVisualize;
            }
        },
        /**
         * Clear any queued outfit once visualization has started or the user dismisses it.
         */
        clearQueuedOutfit: (state) => {
            state.queuedOutfit = null;
            state.autoVisualize = false;
        },
        /**
         * Explicitly toggle whether a queued outfit should auto-visualize when conditions are met.
         */
        setAutoVisualize: (state, action: PayloadAction<boolean>) => {
            state.autoVisualize = action.payload;
        },
        /**
         * Keep an in-memory history of try-on requests so we can show recent activity.
         */
        addToTryOnHistory: (state, action: PayloadAction<QueuedOutfit>) => {
            state.tryOnHistory.unshift(action.payload);
            // Prevent unbounded growth – keep the most recent 50 entries.
            if (state.tryOnHistory.length > 50) {
                state.tryOnHistory.pop();
            }
        },
        clearTryOnHistory: (state) => {
            state.tryOnHistory = [];
        },
    },
    extraReducers: (builder) => {
        builder
            // Fetch profile images
            .addCase(fetchProfileImages.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchProfileImages.fulfilled, (state, action) => {
                state.loading = false;
                state.profileImages = action.payload;
                const defaultImage = action.payload.find(
                    (img) => img.is_default
                );
                if (defaultImage) {
                    state.selectedImageId = defaultImage.id;
                }
            })
            .addCase(fetchProfileImages.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Upload profile image
            .addCase(uploadProfileImage.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(uploadProfileImage.fulfilled, (state, action) => {
                state.loading = false;
                state.profileImages.push(action.payload);
                if (action.payload.is_default) {
                    state.selectedImageId = action.payload.id;
                }
            })
            .addCase(uploadProfileImage.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Delete profile image
            .addCase(deleteProfileImage.fulfilled, (state, action) => {
                state.profileImages = state.profileImages.filter(
                    (img) => img.id !== action.payload
                );
                if (state.selectedImageId === action.payload) {
                    state.selectedImageId = null;
                }
            })
            // Fetch mannequin settings
            .addCase(fetchMannequinSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(fetchMannequinSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.mannequinSettings = action.payload;
            })
            .addCase(fetchMannequinSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Save mannequin settings
            .addCase(saveMannequinSettings.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(saveMannequinSettings.fulfilled, (state, action) => {
                state.loading = false;
                state.mannequinSettings = action.payload;
            })
            .addCase(saveMannequinSettings.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            // Set default image
            .addCase(setDefaultProfileImage.fulfilled, (state, action) => {
                state.profileImages = state.profileImages.map((img) => ({
                    ...img,
                    is_default: img.id === action.payload,
                }));
                state.selectedImageId = action.payload;
            });
    },
});

export const { 
    setTryOnMode, 
    setSelectedImageId, 
    clearError,
    queueOutfitForTryOn,
    clearQueuedOutfit,
    setAutoVisualize,
    addToTryOnHistory,
    clearTryOnHistory,
} = tryOnSlice.actions;
export default tryOnSlice.reducer;

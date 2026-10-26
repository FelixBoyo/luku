import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { analyzeClothingItem } from '../../services/geminiService';
import { ClothingItem } from '../../types';
import { trackEvent } from '../../analytics/events';

interface WardrobeState {
    items: ClothingItem[];
    loading: 'idle' | 'pending' | 'succeeded' | 'failed';
    error: string | null;
}

const initialState: WardrobeState = {
    items: [],
    loading: 'idle',
    error: null,
};

export const fetchWardrobeItems = createAsyncThunk(
    'wardrobe/fetchItems',
    async (_, { rejectWithValue }) => {
        const { data, error } = await supabase
            .from('clothing_items')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) return rejectWithValue(error.message);
        const items: ClothingItem[] = data.map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            name: item.name,
            category: item.category,
            color: item.color,
            style: item.style,
            season: item.season,
            dateAdded: new Date(item.created_at).getTime(),
            useCount: 0, // This will be calculated in the frontend
            status: item.status,
        }));
        return items;
    }
);

export const addClothingItem = createAsyncThunk(
    'wardrobe/addItem',
    async (
        images: { base64Image: string; mimeType: string }[],
        { rejectWithValue, getState }
    ) => {
        const { auth } = getState() as {
            auth: { session: { user: { id: string } } };
        };
        const user = auth.session.user;

        const analysisPromises = images.map((image) =>
            analyzeClothingItem(image.base64Image, image.mimeType)
        );
        const itemDetailsArray = await Promise.all(analysisPromises);

        const newItemsToInsert = itemDetailsArray.map((details, index) => {
            const originalImage = images[index];
            const imageUrl = `data:${originalImage.mimeType};base64,${originalImage.base64Image}`; // This is not ideal for Supabase storage, but matches current logic.
            return {
                user_id: user.id,
                image_url: imageUrl,
                ...details,
            };
        });

        const { data, error } = await supabase
            .from('clothing_items')
            .insert(newItemsToInsert)
            .select();
        if (error) return rejectWithValue(error.message);

        const newItems: ClothingItem[] = data.map((item) => ({
            id: item.id,
            imageUrl: item.image_url,
            name: item.name,
            category: item.category,
            color: item.color,
            style: item.style,
            season: item.season,
            dateAdded: new Date(item.created_at).getTime(),
            useCount: 0,
            status: item.status,
        }));

        // Track wardrobe item additions (one event per inserted item)
        try {
            await Promise.all(
                newItems.map((item) =>
                    trackEvent('wardrobe_item_added', {
                        category: item.category,
                        color: item.color,
                        styleTags: [item.style],
                        hasImage: !!item.imageUrl,
                    })
                )
            );
        } catch {
            // Tracking failures are non-fatal
        }

        return newItems;
    }
);

export const updateItemStatus = createAsyncThunk(
    'wardrobe/updateStatus',
    async (
        { itemId, status }: { itemId: string; status: ClothingItem['status'] },
        { rejectWithValue }
    ) => {
        const { error } = await supabase
            .from('clothing_items')
            .update({ status })
            .eq('id', itemId);
        if (error) return rejectWithValue(error.message);
        return { itemId, status };
    }
);

export const deleteClothingItem = createAsyncThunk(
    'wardrobe/deleteItem',
    async (itemId: string, { rejectWithValue }) => {
        const { error } = await supabase
            .from('clothing_items')
            .delete()
            .eq('id', itemId);
        if (error) return rejectWithValue(error.message);
        return itemId;
    }
);

const wardrobeSlice = createSlice({
    name: 'wardrobe',
    initialState,
    reducers: {
        finishLaundry(state) {
            state.items = state.items.map((item) =>
                item.status === 'in wash' ? { ...item, status: 'clean' } : item
            );
        },
    },
    extraReducers: (builder) => {
        builder
            .addCase(fetchWardrobeItems.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(fetchWardrobeItems.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.items = action.payload;
            })
            .addCase(fetchWardrobeItems.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
            })
            .addCase(addClothingItem.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(addClothingItem.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.items.unshift(...action.payload);
            })
            .addCase(addClothingItem.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
            })
            .addCase(updateItemStatus.fulfilled, (state, action) => {
                const { itemId, status } = action.payload;
                const itemIndex = state.items.findIndex(
                    (item) => item.id === itemId
                );
                if (itemIndex !== -1) {
                    state.items[itemIndex].status = status;
                }
            })
            .addCase(deleteClothingItem.pending, (state) => {
                state.loading = 'pending';
            })
            .addCase(deleteClothingItem.fulfilled, (state, action) => {
                state.loading = 'succeeded';
                state.items = state.items.filter(
                    (item) => item.id !== action.payload
                );
            })
            .addCase(deleteClothingItem.rejected, (state, action) => {
                state.loading = 'failed';
                state.error = action.payload as string;
            });
    },
});

export const { finishLaundry } = wardrobeSlice.actions;
export default wardrobeSlice.reducer;

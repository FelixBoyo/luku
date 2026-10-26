import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import { Album, Outfit, ClothingItem } from '../../types';
import { trackEvent } from '../../analytics/events';

interface AlbumsState {
  albums: Album[];
  loading: 'idle' | 'pending' | 'succeeded' | 'failed';
  error: string | null;
}

const initialState: AlbumsState = {
  albums: [],
  loading: 'idle',
  error: null,
};

// Fetches albums and their associated outfits and items
export const fetchAlbums = createAsyncThunk('albums/fetchAlbums', async (_, { rejectWithValue }) => {
    const { data: albumsData, error: albumsError } = await supabase.from('albums').select(`
        id, name,
        album_outfits (
            outfits (
                id, outfit_name, description, created_at,
                outfit_items (
                    clothing_items (*)
                )
            )
        )
    `);

    if (albumsError) return rejectWithValue(albumsError.message);

    const albums: Album[] = albumsData.map((album: any) => ({
        id: album.id,
        name: album.name,
        outfits: album.album_outfits.map((ao: any) => ({
            id: ao.outfits.id,
            outfitName: ao.outfits.outfit_name,
            description: ao.outfits.description,
            dateFavorited: new Date(ao.outfits.created_at).getTime(),
            items: ao.outfits.outfit_items.map((oi: any) => ({
                id: oi.clothing_items.id,
                imageUrl: oi.clothing_items.image_url,
                name: oi.clothing_items.name,
                category: oi.clothing_items.category,
                color: oi.clothing_items.color,
                style: oi.clothing_items.style,
                season: oi.clothing_items.season,
                dateAdded: new Date(oi.clothing_items.created_at).getTime(),
                status: oi.clothing_items.status,
                useCount: 0,
            } as ClothingItem)),
        } as Outfit)),
    }));

    return albums;
});

export const createAlbum = createAsyncThunk('albums/createAlbum', async (name: string, { rejectWithValue, getState }) => {
    const { auth } = getState() as { auth: { session: { user: { id: string } } } };
    const user = auth.session.user;
    const { data, error } = await supabase.from('albums').insert({ name, user_id: user.id }).select().single();
    if (error) return rejectWithValue(error.message);
    return { id: data.id, name: data.name, outfits: [] };
});

export const saveOutfitToAlbum = createAsyncThunk(
    'albums/saveOutfit',
    async (
        {
            outfit,
            albumId,
        }: { outfit: Omit<Outfit, 'id'>; albumId: string },
        { rejectWithValue, getState }
    ) => {
        const { auth, albums } = getState() as {
            auth: { session: { user: { id: string } } };
            albums: AlbumsState;
        };
        const user = auth.session.user;

        // 1. Create the outfit
        const { data: outfitData, error: outfitError } = await supabase
            .from('outfits')
            .insert({
                user_id: user.id,
                outfit_name: outfit.outfitName,
                description: outfit.description,
            })
            .select()
            .single();
        if (outfitError) return rejectWithValue(outfitError.message);

        const newOutfitId = outfitData.id;

        // 2. Link items to the outfit
        const outfitItems = outfit.items.map((item) => ({
            outfit_id: newOutfitId,
            item_id: item.id,
        }));
        const { error: itemsError } = await supabase
            .from('outfit_items')
            .insert(outfitItems);
        if (itemsError) return rejectWithValue(itemsError.message);

        // 3. Link outfit to the album
        const { error: albumLinkError } = await supabase
            .from('album_outfits')
            .insert({ album_id: albumId, outfit_id: newOutfitId });
        if (albumLinkError) return rejectWithValue(albumLinkError.message);

        const newOutfit: Outfit = {
            id: newOutfitId,
            ...outfit,
            dateFavorited: Date.now(),
        };

        // Track outfit favoriting
        try {
            const album = albums.albums.find((a) => a.id === albumId);
            const existingCount = album ? album.outfits.length : 0;

            await trackEvent('outfit_saved', {
                albumId,
                isFirstOutfit: existingCount === 0,
            });
        } catch {
            // Non-fatal
        }

        return { albumId, newOutfit };
    }
);


export const removeOutfitFromAlbum = createAsyncThunk('albums/removeOutfit', async ({ outfitId, albumId }: { outfitId: string, albumId: string }, { rejectWithValue }) => {
    // This only removes the link. To delete the outfit permanently, we'd need another step.
    const { error } = await supabase.from('album_outfits').delete().match({ outfit_id: outfitId, album_id: albumId });
    if (error) return rejectWithValue(error.message);
    return { outfitId, albumId };
});

const albumsSlice = createSlice({
  name: 'albums',
  initialState,
  reducers: {},
  extraReducers: builder => {
    builder
      .addCase(fetchAlbums.pending, state => {
        state.loading = 'pending';
      })
      .addCase(fetchAlbums.fulfilled, (state, action) => {
        state.loading = 'succeeded';
        state.albums = action.payload;
      })
      .addCase(fetchAlbums.rejected, (state, action) => {
        state.loading = 'failed';
        state.error = action.payload as string;
      })
      .addCase(createAlbum.fulfilled, (state, action) => {
        state.albums.push(action.payload);
      })
      .addCase(saveOutfitToAlbum.fulfilled, (state, action) => {
        const { albumId, newOutfit } = action.payload;
        const album = state.albums.find(a => a.id === albumId);
        if (album) {
          album.outfits.unshift(newOutfit);
        }
      })
      .addCase(removeOutfitFromAlbum.fulfilled, (state, action) => {
        const { outfitId, albumId } = action.payload;
        const album = state.albums.find(a => a.id === albumId);
        if (album) {
          album.outfits = album.outfits.filter(o => o.id !== outfitId);
        }
      });
  },
});

export default albumsSlice.reducer;

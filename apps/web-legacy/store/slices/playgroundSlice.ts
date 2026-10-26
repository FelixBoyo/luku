import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import {
    generateStylePlaygroundPrompt,
    generateStylePlaygroundImage,
} from '../../services/geminiService';
import {
    StylePlaygroundSession,
    StyleQuery,
    StyleCustomization,
} from '../../types';

interface PlaygroundState {
    sessions: StylePlaygroundSession[];
    activeSessionId: string | null;
    queries: StyleQuery[];
    customizations: StyleCustomization[];
    loading: boolean;
    error: string | null;
}

const initialState: PlaygroundState = {
    sessions: [],
    activeSessionId: null,
    queries: [],
    customizations: [],
    loading: false,
    error: null,
};

// Thunks
export const fetchPlaygroundSessions = createAsyncThunk(
    'playground/fetchSessions',
    async (userId: string) => {
        const { data, error } = await supabase
            .from('style_playground_sessions')
            .select('*')
            .eq('user_id', userId)
            .order('updated_at', { ascending: false });

        if (error) throw error;
        return data as StylePlaygroundSession[];
    }
);

export const createPlaygroundSession = createAsyncThunk(
    'playground/createSession',
    async (params: { userId: string; title: string; description?: string }) => {
        const { data, error } = await supabase
            .from('style_playground_sessions')
            .insert({
                user_id: params.userId,
                title: params.title,
                description: params.description,
            })
            .select()
            .single();

        if (error) throw error;
        return data as StylePlaygroundSession;
    }
);

export const fetchSessionQueries = createAsyncThunk(
    'playground/fetchQueries',
    async (sessionId: string) => {
        const { data, error } = await supabase
            .from('style_queries')
            .select('*')
            .eq('session_id', sessionId)
            .order('created_at', { ascending: false });

        if (error) throw error;
        return data as StyleQuery[];
    }
);

export const generateStyleQuery = createAsyncThunk(
    'playground/generateQuery',
    async (params: {
        sessionId: string;
        userId: string;
        queryText: string;
        customizations?: {
            styleFusion?: string[];
            colorPalette?: string[];
            occasion?: string;
            intensity?: number;
        };
    }) => {
        // Generate AI prompt
        const aiPrompt = await generateStylePlaygroundPrompt(
            params.queryText,
            params.customizations
        );

        // Generate image
        const imageBlob = await generateStylePlaygroundImage(aiPrompt);

        // Upload image to Supabase Storage
        const fileName = `${params.sessionId}/${Date.now()}.png`;
        const { data: uploadData, error: uploadError } = await supabase.storage
            .from('style-playground-images')
            .upload(fileName, imageBlob, {
                contentType: 'image/png',
                cacheControl: '3600',
            });

        if (uploadError) throw uploadError;

        // Get public URL
        const {
            data: { publicUrl },
        } = supabase.storage
            .from('style-playground-images')
            .getPublicUrl(fileName);

        // Save query to database
        const { data: queryData, error: queryError } = await supabase
            .from('style_queries')
            .insert({
                session_id: params.sessionId,
                user_id: params.userId,
                query_text: params.queryText,
                ai_prompt: aiPrompt,
                image_url: publicUrl,
            })
            .select()
            .single();

        if (queryError) throw queryError;

        // Save customizations if provided
        if (params.customizations) {
            const customizationInserts = [];

            if (params.customizations.styleFusion) {
                customizationInserts.push({
                    query_id: queryData.id,
                    user_id: params.userId,
                    customization_type: 'style_fusion',
                    customization_value:
                        params.customizations.styleFusion.join(','),
                });
            }

            if (params.customizations.colorPalette) {
                customizationInserts.push({
                    query_id: queryData.id,
                    user_id: params.userId,
                    customization_type: 'color_palette',
                    customization_value:
                        params.customizations.colorPalette.join(','),
                });
            }

            if (params.customizations.occasion) {
                customizationInserts.push({
                    query_id: queryData.id,
                    user_id: params.userId,
                    customization_type: 'occasion',
                    customization_value: params.customizations.occasion,
                });
            }

            if (params.customizations.intensity !== undefined) {
                customizationInserts.push({
                    query_id: queryData.id,
                    user_id: params.userId,
                    customization_type: 'intensity',
                    customization_value:
                        params.customizations.intensity.toString(),
                });
            }

            if (customizationInserts.length > 0) {
                await supabase
                    .from('style_customizations')
                    .insert(customizationInserts);
            }
        }

        return queryData as StyleQuery;
    }
);

export const deletePlaygroundSession = createAsyncThunk(
    'playground/deleteSession',
    async (sessionId: string) => {
        const { error } = await supabase
            .from('style_playground_sessions')
            .delete()
            .eq('id', sessionId);

        if (error) throw error;
        return sessionId;
    }
);

const playgroundSlice = createSlice({
    name: 'playground',
    initialState,
    reducers: {
        setActiveSession: (state, action: PayloadAction<string | null>) => {
            state.activeSessionId = action.payload;
        },
        clearError: (state) => {
            state.error = null;
        },
    },
    extraReducers: (builder) => {
        // Fetch sessions
        builder.addCase(fetchPlaygroundSessions.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchPlaygroundSessions.fulfilled, (state, action) => {
            state.loading = false;
            state.sessions = action.payload;
        });
        builder.addCase(fetchPlaygroundSessions.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch sessions';
        });

        // Create session
        builder.addCase(createPlaygroundSession.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(createPlaygroundSession.fulfilled, (state, action) => {
            state.loading = false;
            state.sessions.unshift(action.payload);
            state.activeSessionId = action.payload.id;
        });
        builder.addCase(createPlaygroundSession.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to create session';
        });

        // Fetch queries
        builder.addCase(fetchSessionQueries.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(fetchSessionQueries.fulfilled, (state, action) => {
            state.loading = false;
            state.queries = action.payload;
        });
        builder.addCase(fetchSessionQueries.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to fetch queries';
        });

        // Generate query
        builder.addCase(generateStyleQuery.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(generateStyleQuery.fulfilled, (state, action) => {
            state.loading = false;
            state.queries.unshift(action.payload);
        });
        builder.addCase(generateStyleQuery.rejected, (state, action) => {
            state.loading = false;
            state.error =
                action.error.message || 'Failed to generate style query';
        });

        // Delete session
        builder.addCase(deletePlaygroundSession.pending, (state) => {
            state.loading = true;
            state.error = null;
        });
        builder.addCase(deletePlaygroundSession.fulfilled, (state, action) => {
            state.loading = false;
            state.sessions = state.sessions.filter(
                (s) => s.id !== action.payload
            );
            if (state.activeSessionId === action.payload) {
                state.activeSessionId = null;
                state.queries = [];
            }
        });
        builder.addCase(deletePlaygroundSession.rejected, (state, action) => {
            state.loading = false;
            state.error = action.error.message || 'Failed to delete session';
        });
    },
});

export const { setActiveSession, clearError } = playgroundSlice.actions;
export default playgroundSlice.reducer;

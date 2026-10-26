import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import { supabase } from '../../services/supabaseClient';
import type { Session } from '@supabase/supabase-js';
import { trackEvent } from '../../analytics/events';

interface AuthState {
  session: Session | null;
  loading: boolean;
  error: string | null;
}

const initialState: AuthState = {
  session: null,
  loading: false,
  error: null,
};

export const checkUserSession = createAsyncThunk('auth/checkUserSession', async () => {
    const { data: { session } } = await supabase.auth.getSession();
    return session;
});

export const signUpUser = createAsyncThunk(
    'auth/signUp',
    async (
        { email, password }: Record<string, string>,
        { rejectWithValue }
    ) => {
        const { error } = await supabase.auth.signUp({ email, password });
        if (error) return rejectWithValue(error.message);

        // Track successful sign up
        await trackEvent('user_signed_up', {
            channel: 'email_password',
        });
    }
);

export const signInUser = createAsyncThunk(
    'auth/signIn',
    async (
        { email, password }: Record<string, string>,
        { rejectWithValue }
    ) => {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (error) return rejectWithValue(error.message);

        await trackEvent('user_logged_in', {
            method: 'password',
        });

        return data.session;
    }
);

export const signOutUser = createAsyncThunk('auth/signOut', async () => {
    await supabase.auth.signOut();
});

export const requestPasswordReset = createAsyncThunk('auth/requestPasswordReset', async ({ email }: { email: string }, { rejectWithValue }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return rejectWithValue(error.message);
});

export const resetPassword = createAsyncThunk('auth/resetPassword', async ({ newPassword }: { newPassword: string }, { rejectWithValue }) => {
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) return rejectWithValue(error.message);
    return data.session;
});

export const changePasswordByEmail = createAsyncThunk('auth/changePasswordByEmail', async ({ email }: { email: string }, { rejectWithValue }) => {
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
    });
    if (error) return rejectWithValue(error.message);
});

const authSlice = createSlice({
    name: 'auth',
    initialState,
    reducers: {
        setSession(state, action) {
            state.session = action.payload;
        }
    },
    extraReducers: (builder) => {
        builder
            .addCase(checkUserSession.pending, (state) => {
                state.loading = true;
            })
            .addCase(checkUserSession.fulfilled, (state, action) => {
                state.session = action.payload;
                state.loading = false;
            })
            .addCase(signInUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signInUser.fulfilled, (state, action) => {
                state.session = action.payload;
                state.loading = false;
            })
            .addCase(signInUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(signUpUser.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(signUpUser.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(signUpUser.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(signOutUser.fulfilled, (state) => {
                state.session = null;
            })
            .addCase(requestPasswordReset.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(requestPasswordReset.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(requestPasswordReset.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(resetPassword.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(resetPassword.fulfilled, (state, action) => {
                state.session = action.payload;
                state.loading = false;
            })
            .addCase(resetPassword.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            })
            .addCase(changePasswordByEmail.pending, (state) => {
                state.loading = true;
                state.error = null;
            })
            .addCase(changePasswordByEmail.fulfilled, (state) => {
                state.loading = false;
            })
            .addCase(changePasswordByEmail.rejected, (state, action) => {
                state.loading = false;
                state.error = action.payload as string;
            });
    }
});

export const { setSession } = authSlice.actions;
export default authSlice.reducer;

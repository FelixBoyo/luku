// Import the mock first to set up environment
import '@/src/test/mocks/supabaseClient';

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { configureStore } from '@reduxjs/toolkit';
import authReducer, {
    checkUserSession,
    signUpUser,
    signInUser,
    signOutUser,
    setSession,
} from './authSlice';
import type { Session } from '@supabase/supabase-js';

describe('authSlice', () => {
    let store: ReturnType<typeof configureStore>;

    beforeEach(() => {
        store = configureStore({
            reducer: {
                auth: authReducer,
            },
        });
        vi.clearAllMocks();
    });

    describe('initial state', () => {
        it('should have correct initial state', () => {
            const state = store.getState().auth;
            expect(state.session).toBeNull();
            expect(state.loading).toBe(false);
            expect(state.error).toBeNull();
        });
    });

    describe('setSession', () => {
        it('should set session in state', () => {
            const mockSession = {
                access_token: 'token',
                token_type: 'bearer',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                },
            } as Session;

            store.dispatch(setSession(mockSession));
            const state = store.getState().auth;
            expect(state.session).toEqual(mockSession);
        });
    });

    describe('checkUserSession', () => {
        it('should handle checkUserSession.pending', () => {
            store.dispatch({ type: 'auth/checkUserSession/pending' });
            const state = store.getState().auth;
            expect(state.loading).toBe(true);
        });

        it('should handle checkUserSession.fulfilled', () => {
            const mockSession = {
                access_token: 'token',
                token_type: 'bearer',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                },
            } as Session;

            store.dispatch({
                type: 'auth/checkUserSession/fulfilled',
                payload: mockSession,
            });
            const state = store.getState().auth;
            expect(state.loading).toBe(false);
            expect(state.session).toEqual(mockSession);
        });
    });

    describe('signInUser', () => {
        it('should handle signInUser.pending', () => {
            store.dispatch({ type: 'auth/signIn/pending' });
            const state = store.getState().auth;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle signInUser.fulfilled', () => {
            const mockSession = {
                access_token: 'token',
                token_type: 'bearer',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                },
            } as Session;

            store.dispatch({
                type: 'auth/signIn/fulfilled',
                payload: mockSession,
            });
            const state = store.getState().auth;
            expect(state.loading).toBe(false);
            expect(state.session).toEqual(mockSession);
        });

        it('should handle signInUser.rejected', () => {
            const errorMessage = 'Invalid credentials';
            store.dispatch({
                type: 'auth/signIn/rejected',
                payload: errorMessage,
            });
            const state = store.getState().auth;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('signUpUser', () => {
        it('should handle signUpUser.pending', () => {
            store.dispatch({ type: 'auth/signUp/pending' });
            const state = store.getState().auth;
            expect(state.loading).toBe(true);
            expect(state.error).toBeNull();
        });

        it('should handle signUpUser.fulfilled', () => {
            store.dispatch({ type: 'auth/signUp/fulfilled' });
            const state = store.getState().auth;
            expect(state.loading).toBe(false);
        });

        it('should handle signUpUser.rejected', () => {
            const errorMessage = 'Email already exists';
            store.dispatch({
                type: 'auth/signUp/rejected',
                payload: errorMessage,
            });
            const state = store.getState().auth;
            expect(state.loading).toBe(false);
            expect(state.error).toBe(errorMessage);
        });
    });

    describe('signOutUser', () => {
        it('should clear session on signOutUser.fulfilled', () => {
            const mockSession = {
                access_token: 'token',
                token_type: 'bearer',
                user: {
                    id: 'user-1',
                    email: 'test@example.com',
                },
            } as Session;

            store.dispatch(setSession(mockSession));
            store.dispatch({ type: 'auth/signOut/fulfilled' });
            const state = store.getState().auth;
            expect(state.session).toBeNull();
        });
    });
});

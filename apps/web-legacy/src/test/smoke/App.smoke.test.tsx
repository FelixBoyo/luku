import React from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@/src/test/utils';
import App from '@/App';

vi.mock('@/services/supabaseClient', () => ({
    ENABLE_DEV_BYPASS: false,
}));

vi.mock('@/components/Auth', () => ({
    default: () => <div data-testid="auth-screen">Auth Screen</div>,
}));

vi.mock('@/components/BusinessAuth', () => ({
    default: () => <div data-testid="business-auth-screen">Business Auth Screen</div>,
}));

vi.mock('@/components/PasswordReset', () => ({
    default: () => <div data-testid="password-reset-screen">Password Reset Screen</div>,
}));

const dispatchMock = vi.fn();

const baseState = {
    auth: { session: null, loading: false },
    wardrobe: { items: [], loading: 'idle' },
    albums: { albums: [] },
    trips: { trip: null, loading: 'idle' },
    features: { loading: {}, error: null, outfitSuggestions: [] },
    business: { currentBusiness: null },
    uiOnboarding: { hasCompletedHubOnboarding: false },
};

vi.mock('@/store/hooks', () => ({
    useAppDispatch: () => dispatchMock,
    useAppSelector: (selector: (state: typeof baseState) => unknown) => selector(baseState),
}));

describe('App smoke rendering and route branching', () => {
    beforeEach(() => {
        dispatchMock.mockClear();
        vi.stubGlobal('fetch', vi.fn());
        window.history.replaceState({}, '', '/');
        window.location.hash = '';
    });

    it('renders unauthenticated default route without network', () => {
        render(<App />);
        expect(screen.getByTestId('auth-screen')).toBeInTheDocument();
    });

    it('renders business auth route branch', () => {
        window.history.replaceState({}, '', '/business');
        render(<App />);
        expect(screen.getByTestId('business-auth-screen')).toBeInTheDocument();
    });

    it('renders password reset route branch', () => {
        window.history.replaceState({}, '', '/reset-password');
        render(<App />);
        expect(screen.getByTestId('password-reset-screen')).toBeInTheDocument();
    });

    it('renders password reset when redirected from recovery email hash', () => {
        // Mirrors Supabase recovery email landing: hash carries access_token + type=recovery.
        // App.tsx rewrites to /reset-password and renders <PasswordReset />.
        window.history.replaceState(
            {},
            '',
            '/#access_token=fake-token&type=recovery'
        );
        render(<App />);
        expect(screen.getByTestId('password-reset-screen')).toBeInTheDocument();
    });
});

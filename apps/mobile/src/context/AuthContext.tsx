import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import type {
    RegistrationPendingDto,
    SessionDto,
    UserProfileDto,
} from '../../../../packages/contracts/src/auth';
import { apiPost } from '../api/apiClient';
import { tokenStorage } from '../api/tokenStorage';
import {
    signInWithAppleNative,
    signInWithGoogleNative,
} from '../lib/socialAuth';
import {
    clearPendingVerification,
    setPendingVerification,
} from '../lib/pendingVerification';
import { registerPushToken } from '../lib/pushNotifications';

export type AuthUser = {
    id: string;
    email: string;
    displayName?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
};

type AuthContextValue = {
    user: AuthUser | null;
    isLoading: boolean;
    isAuthenticated: boolean;
    login: (email: string, password: string) => Promise<void>;
    register: (
        email: string,
        password: string,
        displayName: string | undefined,
        handle: string,
    ) => Promise<RegistrationPendingDto>;
    verifyOtp: (email: string, code: string) => Promise<void>;
    resendOtp: (email: string) => Promise<void>;
    signInWithGoogle: () => Promise<void>;
    signInWithApple: () => Promise<void>;
    logout: () => Promise<void>;
    refreshSession: () => Promise<void>;
    getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

const toAuthUser = (profile: UserProfileDto): AuthUser => ({
    id: profile.id,
    email: profile.email,
    displayName: profile.displayName ?? null,
    avatarUrl: profile.avatarUrl ?? null,
    bio: profile.bio ?? null,
});

const applySession = async (session: SessionDto) => {
    await tokenStorage.setTokens(session.accessToken, session.refreshToken);
    return toAuthUser(session.user);
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<AuthUser | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    const refreshSession = useCallback(async () => {
        const refreshToken = await tokenStorage.getRefreshToken();
        if (!refreshToken) {
            setUser(null);
            return;
        }

        const response = await apiPost<SessionDto>(
            '/v1/api/auth/refresh',
            { refreshToken },
            false,
        );
        const nextUser = await applySession(response.data);
        setUser(nextUser);
    }, []);

    useEffect(() => {
        let active = true;

        refreshSession()
            .catch(async () => {
                await tokenStorage.clear();
                if (active) setUser(null);
            })
            .finally(() => {
                if (active) setIsLoading(false);
            });

        return () => {
            active = false;
        };
    }, [refreshSession]);

    // C-NOTIF-2: register the device's Expo push token once per signed-in
    // session — covers login, verify-OTP, social sign-in, and a session
    // restored on app launch. Keyed on user id so it does not re-fire on
    // unrelated re-renders, and never blocks or fails the sign-in itself.
    const pushTokenRegisteredForRef = useRef<string | null>(null);
    useEffect(() => {
        if (!user || pushTokenRegisteredForRef.current === user.id) {
            return;
        }
        pushTokenRegisteredForRef.current = user.id;
        void registerPushToken();
    }, [user]);

const login = useCallback(async (email: string, password: string) => {
    const response = await apiPost<SessionDto>(
        '/v1/api/auth/login',
        { email, password },
        false,
    );
    console.warn('[auth] login response keys', Object.keys(response.data ?? {}));
    try {
        const nextUser = await applySession(response.data);
        await clearPendingVerification();
        setUser(nextUser);
        console.warn('[auth] login ok, user set', nextUser.id);
    } catch (err) {
        console.warn('[auth] login failed after 200', err);
        throw err;
    }
}, []);

    const register = useCallback(
        async (email: string, password: string, displayName: string | undefined, handle: string) => {
            const response = await apiPost<RegistrationPendingDto>(
                '/v1/api/auth/register',
                { email, password, displayName, handle },
                false,
            );
            await setPendingVerification(email);
            return response.data;
        },
        [],
    );

    const verifyOtp = useCallback(async (email: string, code: string) => {
        const response = await apiPost<SessionDto>(
            '/v1/api/auth/verify-otp',
            { email, code },
            false,
        );
        const nextUser = await applySession(response.data);
        await clearPendingVerification();
        setUser(nextUser);
    }, []);

    const resendOtp = useCallback(async (email: string) => {
        await apiPost<null>('/v1/api/auth/resend-otp', { email }, false);
    }, []);

    const signInWithProvider = useCallback(
        async (credential: {
            provider: 'google' | 'apple';
            idToken: string;
            nonce?: string;
            displayName?: string;
        }) => {
            const response = await apiPost<SessionDto>(
                '/v1/api/auth/oauth',
                credential,
                false,
            );
            const nextUser = await applySession(response.data);
            await clearPendingVerification();
            setUser(nextUser);
        },
        [],
    );

    const signInWithGoogle = useCallback(async () => {
        const credential = await signInWithGoogleNative();
        await signInWithProvider(credential);
    }, [signInWithProvider]);

    const signInWithApple = useCallback(async () => {
        const credential = await signInWithAppleNative();
        await signInWithProvider(credential);
    }, [signInWithProvider]);

    const logout = useCallback(async () => {
        try {
            await apiPost<null>('/v1/api/auth/logout', {}, true);
        } catch {
            // clear local session even if server call fails
        }
        await tokenStorage.clear();
        setUser(null);
    }, []);

    const getAccessToken = useCallback(() => tokenStorage.getAccessToken(), []);

    const value = useMemo<AuthContextValue>(
        () => ({
            user,
            isLoading,
            isAuthenticated: user != null,
            login,
            register,
            verifyOtp,
            resendOtp,
            signInWithGoogle,
            signInWithApple,
            logout,
            refreshSession,
            getAccessToken,
        }),
        [
            user,
            isLoading,
            login,
            register,
            verifyOtp,
            resendOtp,
            signInWithGoogle,
            signInWithApple,
            logout,
            refreshSession,
            getAccessToken,
        ],
    );

    return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = (): AuthContextValue => {
    const ctx = useContext(AuthContext);
    if (!ctx) {
        throw new Error('useAuth must be used within AuthProvider');
    }
    return ctx;
};

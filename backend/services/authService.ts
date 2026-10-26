import type {
    OAuthProvider,
    PasswordResetResponseDto,
    RegistrationPendingDto,
    SessionDto,
    UserProfileDto,
} from '../../packages/contracts/src/auth';
import { getProfileByUserId, getEmailByHandle } from '../data/profileData';
import { generateUniqueHandleFromEmail, isHandleTaken } from '../data/handleData';
import { isValidHandleFormat, normalizeHandleInput } from '../lib/handleUtils';
import {
    getSupabaseAdmin,
    getSupabaseAnon,
    getUserFromAccessToken,
} from '../data/supabaseAdmin';

/** Raised when a registration target email already has a confirmed account. */
export class EmailAlreadyRegisteredError extends Error {
    constructor() {
        super('An account with this email already exists. Please sign in.');
        this.name = 'EmailAlreadyRegisteredError';
    }
}

type SupabaseSession = {
    access_token: string;
    refresh_token: string;
    expires_in?: number | null;
};

type SupabaseUser = {
    id: string;
    email?: string | null;
    user_metadata?: Record<string, unknown> | null;
};

/** Map a Supabase session+user into the wire SessionDto (merges profile row). */
export const buildSessionDto = async (
    session: SupabaseSession,
    user: SupabaseUser,
    fallbackEmail = '',
): Promise<SessionDto> => ({
    accessToken: session.access_token,
    refreshToken: session.refresh_token,
    expiresIn: session.expires_in ?? 3600,
    user: await buildSessionUser(
        user.id,
        user.email ?? fallbackEmail,
        user.user_metadata ?? undefined,
    ),
});

/** Merge auth user with profiles row; falls back to auth metadata when profile row is missing. */
export const buildSessionUser = async (
    userId: string,
    email: string,
    metadata?: Record<string, unknown>,
): Promise<UserProfileDto> => {
    const profile = await getProfileByUserId(userId);
    if (profile) {
        return profile;
    }

    return {
        id: userId,
        email,
        displayName: (metadata?.display_name as string | undefined) ?? null,
        avatarUrl: (metadata?.avatar_url as string | undefined) ?? null,
        bio: (metadata?.bio as string | undefined) ?? null,
        handle: null,
        location: null,
        website: null,
        stylePreferences: [],
    };
};

/** Map sign-in identifier (email or username) to the auth email Supabase expects. */
export const resolveLoginEmail = async (identifier: string): Promise<string> => {
    const trimmed = identifier.trim();
    if (!trimmed) {
        throw new Error('Email and password are required');
    }
    const looksLikeEmail =
        trimmed.includes('@') &&
        /^[^\s@]+@[^\s@]+\.[^\s@]+/.test(trimmed);
    if (looksLikeEmail) {
        return trimmed;
    }
    const email = await getEmailByHandle(trimmed);
    if (!email) {
        throw new Error('Invalid login credentials');
    }
    return email;
};

const requestPasswordResetEmail = async (email: string): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const redirectTo =
        process.env.PASSWORD_RESET_REDIRECT_URL ?? 'luku://reset-password';

    const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo,
    });

    if (error) {
        throw new Error(error.message);
    }
};

/** Set new password using a recovery access token from the reset email deep link. */
export const confirmPasswordReset = async (
    accessToken: string,
    password: string,
): Promise<void> => {
    const user = await getUserFromAccessToken(accessToken);
    if (!user) {
        throw new Error('Invalid or expired reset token');
    }

    const supabase = getSupabaseAdmin();
    const { error } = await supabase.auth.admin.updateUserById(user.id, { password });
    if (error) {
        throw new Error(error.message);
    }
};

/** Best-effort lookup of an auth user by email (admin API has no direct getByEmail). */
const findAuthUserByEmail = async (
    email: string,
): Promise<{ id: string; confirmed: boolean } | null> => {
    const supabase = getSupabaseAdmin();
    const target = email.trim().toLowerCase();
    const perPage = 200;
    const maxPages = 10;

    for (let page = 1; page <= maxPages; page += 1) {
        const { data, error } = await supabase.auth.admin.listUsers({ page, perPage });
        if (error || !data?.users?.length) {
            return null;
        }
        const match = data.users.find((u) => (u.email ?? '').toLowerCase() === target);
        if (match) {
            return { id: match.id, confirmed: Boolean(match.email_confirmed_at) };
        }
        if (data.users.length < perPage) {
            return null;
        }
    }
    return null;
};

/**
 * Email a 6-digit OTP for an existing (possibly unconfirmed) user.
 * OTP-first: do not pass options.emailRedirectTo — that sends magic-link emails.
 * Supabase template must expose {{ .Token }} (see docs/ops/supabase-email-otp.md).
 */
const sendEmailOtp = async (email: string): Promise<void> => {
    const anon = getSupabaseAnon();
    const { error } = await anon.auth.signInWithOtp({
        email: email.trim(),
        options: { shouldCreateUser: false },
    });
    if (error) {
        throw new Error(error.message);
    }
};

/**
 * Forgot-password orchestration: routes unverified users to OTP, confirmed users
 * to recovery email, unknown emails to a silent no-op (anti-enumeration).
 */
export const requestPasswordRecovery = async (
    email: string,
): Promise<PasswordResetResponseDto> => {
    const trimmed = email.trim();
    const existing = await findAuthUserByEmail(trimmed);

    if (!existing) {
        return { email: trimmed, delivery: 'reset' };
    }

    if (!existing.confirmed) {
        await sendEmailOtp(trimmed);
        return { email: trimmed, delivery: 'otp' };
    }

    await sendEmailOtp(trimmed);
    return { email: trimmed, delivery: 'otp' };
};

/**
 * Create an unconfirmed email+password account and email a verification code.
 * The account stays inactive until the code is confirmed via verifyEmailOtp.
 */
export const registerWithEmailOtp = async (
    email: string,
    password: string,
    displayName?: string,
    handle?: string,
): Promise<RegistrationPendingDto> => {
    const supabase = getSupabaseAdmin();
    const trimmed = email.trim();
    const normalizedHandle = handle ? normalizeHandleInput(handle) : '';

    if (!normalizedHandle || !isValidHandleFormat(normalizedHandle)) {
        throw new Error('Username must be 3–20 characters: lowercase letters, numbers, underscores only');
    }
    if (await isHandleTaken(normalizedHandle)) {
        throw new Error('Username is already taken');
    }

    const profilePatch: { display_name?: string; handle: string } = {
        handle: normalizedHandle,
    };
    if (displayName) {
        profilePatch.display_name = displayName;
    }

    const applyProfilePatch = async (userId: string) => {
        const { error: profileError } = await supabase
            .from('profiles')
            .update(profilePatch)
            .eq('id', userId);
        if (profileError) {
            if (profileError.code === '23505' || /unique|duplicate/i.test(profileError.message ?? '')) {
                throw new Error('Username is already taken');
            }
            throw new Error(profileError.message);
        }
    };

    const { data: created, error: createError } = await supabase.auth.admin.createUser({
        email: trimmed,
        password,
        email_confirm: false,
        user_metadata: displayName ? { display_name: displayName } : undefined,
    });

    if (createError || !created?.user) {
        const message = createError?.message ?? 'Registration failed';
        if (/already|registered|exists|duplicate/i.test(message)) {
            const existing = await findAuthUserByEmail(trimmed);
            if (existing?.confirmed) {
                throw new EmailAlreadyRegisteredError();
            }
            if (!existing) {
                throw new Error(message);
            }
            // Unconfirmed account — update credentials and re-send the code.
            const { error: updateError } = await supabase.auth.admin.updateUserById(
                existing.id,
                {
                    password,
                    user_metadata: displayName ? { display_name: displayName } : undefined,
                },
            );
            if (updateError) {
                throw new Error(updateError.message);
            }
            await applyProfilePatch(existing.id);
            await sendEmailOtp(trimmed);
            return { email: trimmed, requiresVerification: true };
        }
        throw new Error(message);
    }

    await applyProfilePatch(created.user.id);

    await sendEmailOtp(trimmed);
    return { email: trimmed, requiresVerification: true };
};

/** Verify an emailed code: confirms the email and returns an authenticated session. */
export const verifyEmailOtp = async (
    email: string,
    code: string,
): Promise<SessionDto> => {
    const anon = getSupabaseAnon();
    const { data, error } = await anon.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
    });

    if (error || !data.session || !data.user) {
        throw new Error(error?.message ?? 'Invalid or expired code');
    }

    return buildSessionDto(data.session, data.user, email);
};

/** Verify reset code and set a new password without creating an app session. */
export const confirmPasswordResetWithOtp = async (
    email: string,
    code: string,
    password: string,
): Promise<void> => {
    const anon = getSupabaseAnon();
    const { data, error } = await anon.auth.verifyOtp({
        email: email.trim(),
        token: code.trim(),
        type: 'email',
    });

    if (error || !data.user) {
        throw new Error(error?.message ?? 'Invalid or expired code');
    }

    const supabase = getSupabaseAdmin();
    const { error: updateError } = await supabase.auth.admin.updateUserById(data.user.id, {
        password,
    });
    if (updateError) {
        throw new Error(updateError.message);
    }
};

/** Resend a verification code. Never reveals whether the email exists. */
export const resendEmailOtp = async (email: string): Promise<void> => {
    try {
        await sendEmailOtp(email);
    } catch (err) {
        // Swallow client-facing errors — do not leak account existence or rate limits.
        console.warn('[auth] resendEmailOtp failed:', err instanceof Error ? err.message : err);
    }
};

/** Exchange a native provider ID token for a Supabase session. */
export const signInWithProvider = async (
    provider: OAuthProvider,
    idToken: string,
    nonce?: string,
    displayName?: string,
): Promise<SessionDto> => {
    const anon = getSupabaseAnon();
    const { data, error } = await anon.auth.signInWithIdToken({
        provider,
        token: idToken,
        nonce,
    });

    if (error || !data.session || !data.user) {
        throw new Error(error?.message ?? 'Provider sign-in failed');
    }

    if (displayName) {
        const profile = await getProfileByUserId(data.user.id);
        const supabase = getSupabaseAdmin();
        const updates: Record<string, string> = {};
        if (profile && !profile.displayName) {
            updates.display_name = displayName;
        }
        if (profile && !profile.handle) {
            const email = data.user.email ?? '';
            updates.handle = await generateUniqueHandleFromEmail(email, data.user.id);
        }
        if (Object.keys(updates).length > 0) {
            await supabase.from('profiles').update(updates).eq('id', data.user.id);
        }
    } else {
        const profile = await getProfileByUserId(data.user.id);
        if (profile && !profile.handle) {
            const supabase = getSupabaseAdmin();
            const email = data.user.email ?? '';
            const handle = await generateUniqueHandleFromEmail(email, data.user.id);
            await supabase.from('profiles').update({ handle }).eq('id', data.user.id);
        }
    }

    return buildSessionDto(data.session, data.user, data.user.email ?? '');
};

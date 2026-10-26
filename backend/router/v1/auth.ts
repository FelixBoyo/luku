import { Router, type Request, type Response } from 'express';
import type {
    LoginRequest,
    OAuthSignInRequest,
    PasswordResetConfirmRequest,
    PasswordResetOtpConfirmRequest,
    PasswordResetRequest,
    RefreshRequest,
    RegisterRequest,
    ResendOtpRequest,
    SessionDto,
    VerifyOtpRequest,
    HandleAvailabilityResponseDto,
    LoginUnconfirmedDto,
} from '../../../packages/contracts/src/auth';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';
import { createResponse, createErrorResponse, type ErrorCode } from '../../lib/envelope';
import { isValidHandleFormat, normalizeHandleInput } from '../../lib/handleUtils';
import { isHandleAvailable } from '../../data/handleData';
import { verifyToken, type AuthenticatedRequest } from '../../middleware/auth';
import {
    EmailAlreadyRegisteredError,
    buildSessionUser,
    confirmPasswordReset,
    confirmPasswordResetWithOtp,
    registerWithEmailOtp,
    requestPasswordRecovery,
    resendEmailOtp,
    resolveLoginEmail,
    signInWithProvider,
    verifyEmailOtp,
} from '../../services/authService';
import { fetchProfile } from '../../services/profileService';

const router = Router();

const VALID_PROVIDERS = new Set(['google', 'apple']);

const mapSignupError = (message: string): { status: number; errorCode: ErrorCode } => {
    if (/already|exists|registered|duplicate/i.test(message)) {
        return { status: 400, errorCode: 'VALIDATION_FAILED' };
    }
    if (/password|weak|short/i.test(message)) {
        return { status: 400, errorCode: 'VALIDATION_FAILED' };
    }
    return { status: 400, errorCode: 'VALIDATION_FAILED' };
};

const toSessionDto = async (
    accessToken: string,
    refreshToken: string,
    expiresIn: number,
    userId: string,
    email: string,
    metadata?: Record<string, unknown>,
): Promise<SessionDto> => ({
    accessToken,
    refreshToken,
    expiresIn,
    user: await buildSessionUser(userId, email, metadata),
});

/**
 * Email + password registration. Creates an UNCONFIRMED account and emails a
 * verification code; no session is returned until the code is confirmed via
 * /verify-otp. This replaces the previous open self-signup.
 */
router.post('/register', async (req: Request, res: Response) => {
    const { email, password, displayName, handle } = req.body as RegisterRequest;
    if (!email?.trim() || !password) {
        res.status(400).json(
            createErrorResponse('Email and password are required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }
    const normalizedHandle = handle ? normalizeHandleInput(handle) : '';
    if (!normalizedHandle || !isValidHandleFormat(normalizedHandle)) {
        res.status(400).json(
            createErrorResponse(
                'Username must be 3–20 characters: lowercase letters, numbers, underscores only',
                400,
                'VALIDATION_FAILED',
            ),
        );
        return;
    }

    try {
        const pending = await registerWithEmailOtp(email, password, displayName, normalizedHandle);
        res.status(202).json(createResponse(pending, 'Verification code sent'));
    } catch (error) {
        if (error instanceof EmailAlreadyRegisteredError) {
            res.status(400).json(
                createErrorResponse(error.message, 400, 'VALIDATION_FAILED'),
            );
            return;
        }
        const message = error instanceof Error ? error.message : 'Registration failed';
        const mapped = mapSignupError(message);
        res.status(mapped.status).json(
            createErrorResponse(message, mapped.status, mapped.errorCode),
        );
    }
});

router.get('/handle-available', async (req: Request, res: Response) => {
    const raw = typeof req.query.handle === 'string' ? req.query.handle : '';
    const normalized = normalizeHandleInput(raw);
    if (!normalized || !isValidHandleFormat(normalized)) {
        res.json(
            createResponse<HandleAvailabilityResponseDto>({ available: false }, 'Handle checked'),
        );
        return;
    }

    try {
        const available = await isHandleAvailable(normalized);
        res.json(createResponse<HandleAvailabilityResponseDto>({ available }, 'Handle checked'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Handle check failed';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

/** Confirm an emailed verification code and return an authenticated session. */
router.post('/verify-otp', async (req: Request, res: Response) => {
    const { email, code } = req.body as VerifyOtpRequest;
    if (!email?.trim() || !code?.trim()) {
        res.status(400).json(
            createErrorResponse('Email and code are required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        const session = await verifyEmailOtp(email, code);
        res.json(createResponse(session, 'Email verified'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Verification failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

/** Resend a verification code. Always responds success-shaped. */
router.post('/resend-otp', async (req: Request, res: Response) => {
    const { email } = req.body as ResendOtpRequest;
    if (!email?.trim()) {
        res.status(400).json(
            createErrorResponse('Email is required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    await resendEmailOtp(email);
    res.json(createResponse(null, 'Verification code sent'));
});

/** Native provider sign-in: exchange a Google/Apple ID token for a session. */
router.post('/oauth', async (req: Request, res: Response) => {
    const { provider, idToken, nonce, displayName } = req.body as OAuthSignInRequest;
    if (!provider || !VALID_PROVIDERS.has(provider) || !idToken?.trim()) {
        res.status(400).json(
            createErrorResponse('A valid provider and idToken are required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        const session = await signInWithProvider(provider, idToken, nonce, displayName);
        res.json(createResponse(session, 'Signed in'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Provider sign-in failed';
        res.status(401).json(createErrorResponse(message, 401, 'AUTH_UNAUTHORIZED'));
    }
});

/** Open self-signup is disabled — clients must use /register (OTP-gated). */
router.post('/signup', (_req: Request, res: Response) => {
    res.status(403).json(
        createErrorResponse(
            'Direct signup is disabled. Use /register to verify your email.',
            403,
            'AUTH_FORBIDDEN',
        ),
    );
});

router.post('/login', async (req: Request, res: Response) => {
    const { email, password } = req.body as LoginRequest;
    if (!email?.trim() || !password) {
        res.status(400).json(
            createErrorResponse('Email and password are required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        const resolvedEmail = await resolveLoginEmail(email);
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.auth.signInWithPassword({
            email: resolvedEmail,
            password,
        });

        if (error || !data.session || !data.user) {
            const message = error?.message ?? 'Login failed';
            const unconfirmed =
                (error as { code?: string } | null)?.code === 'email_not_confirmed' ||
                /not confirmed|confirm your email/i.test(message);
            if (unconfirmed) {
                res.status(403).json(
                    createResponse<LoginUnconfirmedDto>(
                        { email: resolvedEmail },
                        'Please verify your email to continue.',
                        'error',
                        403,
                        'AUTH_EMAIL_UNCONFIRMED',
                    ),
                );
                return;
            }
            res.status(401).json(
                createErrorResponse(message, 401, 'AUTH_UNAUTHORIZED'),
            );
            return;
        }

        const session = await toSessionDto(
            data.session.access_token,
            data.session.refresh_token,
            data.session.expires_in ?? 3600,
            data.user.id,
            data.user.email ?? resolvedEmail,
            data.user.user_metadata,
        );

        res.json(createResponse(session, 'Login successful'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Login failed';
        if (message === 'Invalid login credentials') {
            res.status(401).json(createErrorResponse(message, 401, 'AUTH_UNAUTHORIZED'));
            return;
        }
        if (/required/i.test(message)) {
            res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
            return;
        }
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.post('/refresh', async (req: Request, res: Response) => {
    const { refreshToken } = req.body as RefreshRequest;
    if (!refreshToken) {
        res.status(400).json(
            createErrorResponse('refreshToken is required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        const supabase = getSupabaseAdmin();
        const { data, error } = await supabase.auth.refreshSession({ refresh_token: refreshToken });

        if (error || !data.session || !data.user) {
            res.status(401).json(
                createErrorResponse('Refresh failed', 401, 'AUTH_TOKEN_EXPIRED'),
            );
            return;
        }

        const session = await toSessionDto(
            data.session.access_token,
            data.session.refresh_token,
            data.session.expires_in ?? 3600,
            data.user.id,
            data.user.email ?? '',
            data.user.user_metadata,
        );

        res.json(createResponse(session, 'Session refreshed'));
    } catch {
        res.status(500).json(createErrorResponse('Refresh failed', 500));
    }
});

router.post('/logout', verifyToken, async (_req: AuthenticatedRequest, res: Response) => {
    res.json(createResponse(null, 'Logged out'));
});

router.post('/password-reset', async (req: Request, res: Response) => {
    const { email } = req.body as PasswordResetRequest;
    if (!email?.trim()) {
        res.status(400).json(
            createErrorResponse('Email is required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        const result = await requestPasswordRecovery(email);
        res.json(createResponse(result, 'Password reset email sent'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Password reset failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

router.post('/password-reset/confirm', async (req: Request, res: Response) => {
    const { accessToken, password } = req.body as PasswordResetConfirmRequest;
    if (!accessToken?.trim() || !password) {
        res.status(400).json(
            createErrorResponse('accessToken and password are required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        await confirmPasswordReset(accessToken.trim(), password);
        res.json(createResponse(null, 'Password updated'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Password reset failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

router.post('/password-reset/confirm-otp', async (req: Request, res: Response) => {
    const { email, code, password } = req.body as PasswordResetOtpConfirmRequest;
    if (!email?.trim() || !code?.trim() || !password) {
        res.status(400).json(
            createErrorResponse('email, code, and password are required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        await confirmPasswordResetWithOtp(email, code, password);
        res.json(createResponse(null, 'Password updated'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Password reset failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

router.get('/me', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const profile = await fetchProfile(req.userId);
        if (!profile) {
            res.status(404).json(createErrorResponse('Profile not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }

        res.json(createResponse(profile, 'Profile retrieved'));
    } catch {
        res.status(500).json(createErrorResponse('Failed to fetch profile', 500));
    }
});

export default router;

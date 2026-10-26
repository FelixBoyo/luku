import { beforeEach, describe, expect, it, vi } from 'vitest';

const adminMock = vi.hoisted(() => ({
    createUser: vi.fn(),
    listUsers: vi.fn(),
    updateUserById: vi.fn(),
}));

const anonMock = vi.hoisted(() => ({
    signInWithOtp: vi.fn(),
    verifyOtp: vi.fn(),
    signInWithIdToken: vi.fn(),
}));

const profileUpdateEq = vi.hoisted(() => vi.fn().mockResolvedValue({ error: null }));

const resetPasswordForEmailMock = vi.hoisted(() => vi.fn());

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: () => ({
        auth: { admin: adminMock, resetPasswordForEmail: resetPasswordForEmailMock },
        from: () => ({ update: () => ({ eq: profileUpdateEq }) }),
    }),
    getSupabaseAnon: () => ({ auth: anonMock }),
    getUserFromAccessToken: vi.fn(),
}));

const getProfileByUserId = vi.hoisted(() => vi.fn());
const getEmailByHandle = vi.hoisted(() => vi.fn());
vi.mock('../data/profileData', () => ({ getProfileByUserId, getEmailByHandle }));

const isHandleTaken = vi.hoisted(() => vi.fn().mockResolvedValue(false));
const generateUniqueHandleFromEmail = vi.hoisted(() => vi.fn().mockResolvedValue('generated_user'));
vi.mock('../data/handleData', () => ({
    isHandleTaken,
    generateUniqueHandleFromEmail,
}));

import {
    EmailAlreadyRegisteredError,
    registerWithEmailOtp,
    requestPasswordRecovery,
    resolveLoginEmail,
    signInWithProvider,
    verifyEmailOtp,
} from './authService';

beforeEach(() => {
    vi.clearAllMocks();
    getProfileByUserId.mockResolvedValue(null);
    getEmailByHandle.mockResolvedValue(null);
});

describe('resolveLoginEmail', () => {
    it('returns email unchanged when identifier contains @', async () => {
        await expect(resolveLoginEmail(' buyer@luku.app ')).resolves.toBe('buyer@luku.app');
        expect(getEmailByHandle).not.toHaveBeenCalled();
    });

    it('resolves username via profile lookup', async () => {
        getEmailByHandle.mockResolvedValue('buyer@luku.app');
        await expect(resolveLoginEmail('@dev_buyer')).resolves.toBe('buyer@luku.app');
        expect(getEmailByHandle).toHaveBeenCalledWith('@dev_buyer');
    });

    it('throws generic error when username is unknown', async () => {
        getEmailByHandle.mockResolvedValue(null);
        await expect(resolveLoginEmail('nobody_here')).rejects.toThrow('Invalid login credentials');
    });
});

describe('registerWithEmailOtp', () => {
    it('creates an unconfirmed user and sends an OTP', async () => {
        adminMock.createUser.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
        anonMock.signInWithOtp.mockResolvedValue({ error: null });

        const result = await registerWithEmailOtp(
            'New@Example.com ',
            'pw123456',
            'New User',
            'new_user',
        );

        expect(result).toEqual({ email: 'New@Example.com', requiresVerification: true });
        expect(adminMock.createUser).toHaveBeenCalledWith(
            expect.objectContaining({ email: 'New@Example.com', email_confirm: false }),
        );
        expect(anonMock.signInWithOtp).toHaveBeenCalledWith(
            expect.objectContaining({
                email: 'New@Example.com',
                options: { shouldCreateUser: false },
            }),
        );
        const otpCall = anonMock.signInWithOtp.mock.calls[0]?.[0] as {
            options?: { emailRedirectTo?: string };
        };
        expect(otpCall.options?.emailRedirectTo).toBeUndefined();
    });

    it('throws when the email already has a confirmed account', async () => {
        adminMock.createUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'User already registered' },
        });
        adminMock.listUsers.mockResolvedValue({
            data: { users: [{ id: 'u1', email: 'dup@example.com', email_confirmed_at: '2020-01-01' }] },
            error: null,
        });

        await expect(
            registerWithEmailOtp('dup@example.com', 'pw123456', undefined, 'dup_user'),
        ).rejects.toBeInstanceOf(
            EmailAlreadyRegisteredError,
        );
        expect(anonMock.signInWithOtp).not.toHaveBeenCalled();
    });

    it('updates credentials and resends when an unconfirmed account already exists', async () => {
        adminMock.createUser.mockResolvedValue({
            data: { user: null },
            error: { message: 'User already registered' },
        });
        adminMock.listUsers.mockResolvedValue({
            data: { users: [{ id: 'u1', email: 'pending@example.com', email_confirmed_at: null }] },
            error: null,
        });
        adminMock.updateUserById.mockResolvedValue({ data: { user: { id: 'u1' } }, error: null });
        anonMock.signInWithOtp.mockResolvedValue({ error: null });

        const result = await registerWithEmailOtp(
            'pending@example.com',
            'newPass123',
            'Updated Name',
            'pending_user',
        );

        expect(result.requiresVerification).toBe(true);
        expect(adminMock.updateUserById).toHaveBeenCalledWith(
            'u1',
            expect.objectContaining({
                password: 'newPass123',
                user_metadata: { display_name: 'Updated Name' },
            }),
        );
        expect(anonMock.signInWithOtp).toHaveBeenCalled();
    });
});

describe('requestPasswordRecovery', () => {
    it('returns reset delivery without sending when email is unknown', async () => {
        adminMock.listUsers.mockResolvedValue({ data: { users: [] }, error: null });

        const result = await requestPasswordRecovery('unknown@example.com');

        expect(result).toEqual({ email: 'unknown@example.com', delivery: 'reset' });
        expect(anonMock.signInWithOtp).not.toHaveBeenCalled();
        expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
    });

    it('sends OTP for an unconfirmed account', async () => {
        adminMock.listUsers.mockResolvedValue({
            data: { users: [{ id: 'u1', email: 'pending@example.com', email_confirmed_at: null }] },
            error: null,
        });
        anonMock.signInWithOtp.mockResolvedValue({ error: null });

        const result = await requestPasswordRecovery('pending@example.com');

        expect(result).toEqual({ email: 'pending@example.com', delivery: 'otp' });
        expect(anonMock.signInWithOtp).toHaveBeenCalled();
        expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
    });

    it('sends recovery email for a confirmed account', async () => {
        adminMock.listUsers.mockResolvedValue({
            data: {
                users: [{ id: 'u1', email: 'buyer@example.com', email_confirmed_at: '2020-01-01' }],
            },
            error: null,
        });
        resetPasswordForEmailMock.mockResolvedValue({ error: null });

        const result = await requestPasswordRecovery('buyer@example.com');

        expect(result).toEqual({ email: 'buyer@example.com', delivery: 'otp' });
        expect(anonMock.signInWithOtp).toHaveBeenCalled();
        expect(resetPasswordForEmailMock).not.toHaveBeenCalled();
    });
});

describe('verifyEmailOtp', () => {
    it('returns a session on a valid code', async () => {
        anonMock.verifyOtp.mockResolvedValue({
            data: {
                session: { access_token: 'a', refresh_token: 'r', expires_in: 3600 },
                user: { id: 'u1', email: 'v@example.com', user_metadata: {} },
            },
            error: null,
        });

        const session = await verifyEmailOtp('v@example.com', '123456');

        expect(session.accessToken).toBe('a');
        expect(session.user.id).toBe('u1');
        expect(anonMock.verifyOtp).toHaveBeenCalledWith(
            expect.objectContaining({ token: '123456', type: 'email' }),
        );
    });

    it('throws on an invalid code', async () => {
        anonMock.verifyOtp.mockResolvedValue({
            data: { session: null, user: null },
            error: { message: 'Token has expired or is invalid' },
        });

        await expect(verifyEmailOtp('v@example.com', '000000')).rejects.toThrow(/expired|invalid/i);
    });
});

describe('signInWithProvider', () => {
    it('exchanges an ID token for a session', async () => {
        anonMock.signInWithIdToken.mockResolvedValue({
            data: {
                session: { access_token: 'a', refresh_token: 'r', expires_in: 3600 },
                user: { id: 'u9', email: 'g@example.com', user_metadata: {} },
            },
            error: null,
        });

        const session = await signInWithProvider('google', 'id-token');

        expect(session.user.id).toBe('u9');
        expect(anonMock.signInWithIdToken).toHaveBeenCalledWith(
            expect.objectContaining({ provider: 'google', token: 'id-token' }),
        );
    });

    it('throws when the provider token is rejected', async () => {
        anonMock.signInWithIdToken.mockResolvedValue({
            data: { session: null, user: null },
            error: { message: 'Invalid token' },
        });

        await expect(signInWithProvider('apple', 'bad')).rejects.toThrow(/invalid token/i);
    });
});

export type UserProfileDto = {
    id: string;
    email: string;
    displayName?: string | null;
    handle?: string | null;
    avatarUrl?: string | null;
    bio?: string | null;
    location?: string | null;
    website?: string | null;
    stylePreferences?: string[];
    followerCount?: number;
    followingCount?: number;
    listingCount?: number;
};

export type ProfilePatchRequest = {
    displayName?: string;
    handle?: string;
    bio?: string;
    avatarUrl?: string;
    location?: string;
    website?: string;
    stylePreferences?: string[];
};

/** Password sign-in: `email` is the registered email or username (handle without @). */
export type LoginRequest = {
    email: string;
    password: string;
};

/** Returned on 403 AUTH_EMAIL_UNCONFIRMED so clients can resend OTP to the real email. */
export type LoginUnconfirmedDto = {
    email: string;
};

export type SignUpRequest = {
    email: string;
    password: string;
    displayName?: string;
};

/** Email + password registration that requires OTP verification before activation. */
export type RegisterRequest = {
    email: string;
    password: string;
    displayName?: string;
    handle: string;
};

export type HandleAvailabilityResponseDto = {
    available: boolean;
};

/** Returned by /register — the account exists but must be verified via emailed code. */
export type RegistrationPendingDto = {
    email: string;
    requiresVerification: true;
};

/** Confirm an emailed 6-digit code to activate + sign in. */
export type VerifyOtpRequest = {
    email: string;
    code: string;
};

/** Resend the email verification code. */
export type ResendOtpRequest = {
    email: string;
};

export type OAuthProvider = 'google' | 'apple';

/** Native provider sign-in: a provider-issued ID token exchanged for a session. */
export type OAuthSignInRequest = {
    provider: OAuthProvider;
    idToken: string;
    nonce?: string;
    displayName?: string;
};

export type RefreshRequest = {
    refreshToken: string;
};

export type SessionDto = {
    accessToken: string;
    refreshToken: string;
    expiresIn: number;
    user: UserProfileDto;
};

export type PasswordResetRequest = {
    email: string;
};

export type PasswordResetDelivery = 'reset' | 'otp';

/** Returned by /password-reset — delivery indicates reset link vs verification OTP. */
export type PasswordResetResponseDto = {
    email: string;
    delivery: PasswordResetDelivery;
};

export type PasswordResetConfirmRequest = {
    accessToken: string;
    password: string;
};

export type PasswordResetOtpConfirmRequest = {
    email: string;
    code: string;
    password: string;
};

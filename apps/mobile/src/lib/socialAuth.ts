import * as AppleAuthentication from 'expo-apple-authentication';
import * as Crypto from 'expo-crypto';
import type { OAuthProvider } from '../../../../packages/contracts/src/auth';
import { GOOGLE_IOS_CLIENT_ID, GOOGLE_WEB_CLIENT_ID } from './config';
import {
    isNativeAppleSignInAvailable,
    isNativeGoogleSignInAvailable,
    NativeSocialAuthUnavailableError,
} from './nativeSocialAuth';

export type SocialCredential = {
    provider: OAuthProvider;
    idToken: string;
    nonce?: string;
    displayName?: string;
};

export { NativeSocialAuthUnavailableError };

/** Thrown when the user dismisses the native provider sheet. */
export class SocialAuthCancelled extends Error {
    constructor() {
        super('Sign-in was cancelled');
        this.name = 'SocialAuthCancelled';
    }
}

let googleConfigured = false;

export const signInWithGoogleNative = async (): Promise<SocialCredential> => {
    if (!isNativeGoogleSignInAvailable()) {
        throw new NativeSocialAuthUnavailableError();
    }

    const { GoogleSignin } = await import('@react-native-google-signin/google-signin');

    if (!googleConfigured) {
        GoogleSignin.configure({
            iosClientId: GOOGLE_IOS_CLIENT_ID || undefined,
            webClientId: GOOGLE_WEB_CLIENT_ID || undefined,
        });
        googleConfigured = true;
    }

    await GoogleSignin.hasPlayServices({ showPlayServicesUpdateDialog: true });

    const response = await GoogleSignin.signIn();
    if (response.type === 'cancelled') {
        throw new SocialAuthCancelled();
    }

    const { idToken, user } = response.data;
    if (!idToken) {
        throw new Error('Google did not return an ID token. Check your client IDs.');
    }

    return {
        provider: 'google',
        idToken,
        displayName: user.name ?? undefined,
    };
};

const generateNonce = (): string =>
    `${Crypto.randomUUID()}${Crypto.randomUUID()}`.replace(/-/g, '');

const isAppleCancellation = (error: unknown): boolean =>
    typeof error === 'object' &&
    error !== null &&
    'code' in error &&
    (error as { code?: string }).code === 'ERR_REQUEST_CANCELED';

export const signInWithAppleNative = async (): Promise<SocialCredential> => {
    if (!isNativeAppleSignInAvailable()) {
        throw new NativeSocialAuthUnavailableError();
    }

    const rawNonce = generateNonce();
    const hashedNonce = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        rawNonce,
    );

    try {
        const credential = await AppleAuthentication.signInAsync({
            requestedScopes: [
                AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
                AppleAuthentication.AppleAuthenticationScope.EMAIL,
            ],
            nonce: hashedNonce,
        });

        if (!credential.identityToken) {
            throw new Error('Apple did not return an identity token.');
        }

        const displayName = [
            credential.fullName?.givenName,
            credential.fullName?.familyName,
        ]
            .filter(Boolean)
            .join(' ');

        return {
            provider: 'apple',
            idToken: credential.identityToken,
            nonce: rawNonce,
            displayName: displayName || undefined,
        };
    } catch (error) {
        if (isAppleCancellation(error)) {
            throw new SocialAuthCancelled();
        }
        throw error;
    }
};

export const isAppleAuthAvailable = (): Promise<boolean> =>
    AppleAuthentication.isAvailableAsync();

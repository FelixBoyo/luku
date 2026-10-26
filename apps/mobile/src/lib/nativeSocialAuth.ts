import Constants from 'expo-constants';
import { Platform } from 'react-native';

/** True when running inside the Expo Go client (no custom native modules). */
export const IS_EXPO_GO = Constants.appOwnership === 'expo';

/** Thrown when Google/Apple native sign-in is invoked in an unsupported runtime. */
export class NativeSocialAuthUnavailableError extends Error {
    constructor() {
        super(
            'Google and Apple sign-in require a development build. Use email sign-in in Expo Go, or run eas build --profile development.',
        );
        this.name = 'NativeSocialAuthUnavailableError';
    }
}

export const isNativeGoogleSignInAvailable = (): boolean => !IS_EXPO_GO;

export const isNativeAppleSignInAvailable = (): boolean =>
    Platform.OS === 'ios' && !IS_EXPO_GO;

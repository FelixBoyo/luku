import Constants from 'expo-constants';

const extra = (Constants.expoConfig?.extra ?? {}) as {
    apiBaseUrl?: string;
    googleIosClientId?: string;
    googleWebClientId?: string;
};

/** When true (default), repositories serve mock data. Set false to use Express BFF. */
export const USE_MOCK_DATA =
    process.env.EXPO_PUBLIC_USE_MOCK_DATA !== 'false';

/** Express BFF base URL — from app.config.ts extra (EXPO_PUBLIC_API_BASE_URL). */
export const API_BASE_URL = extra.apiBaseUrl ?? '';

/** Google OAuth client IDs for native sign-in (from app.config.ts extra). */
export const GOOGLE_IOS_CLIENT_ID = extra.googleIosClientId ?? '';
export const GOOGLE_WEB_CLIENT_ID = extra.googleWebClientId ?? '';

if (!USE_MOCK_DATA && !API_BASE_URL) {
    console.warn(
        '[luku/mobile] EXPO_PUBLIC_API_BASE_URL is not set but USE_MOCK_DATA=false. API calls will fail.',
    );
}

/** Gate optional Home UI; kept false — use RefineYourPicksCard when re-enabling. */
export const SHOW_REFINE_PICKS = false;

import type { ExpoConfig, ConfigContext } from 'expo/config';

/**
 * Dynamic Expo config. The static fields live in app.json; this file layers
 * runtime config (`extra.*`) read from EXPO_PUBLIC_* env vars so that
 * non-secret values can be inlined into the JS bundle and accessed via
 * `expo-constants` at runtime.
 *
 * No secrets here - everything is publicly inspectable in the built bundle.
 */
export default ({ config }: ConfigContext): ExpoConfig => ({
    ...config,
    name: config.name ?? 'LUKU',
    slug: config.slug ?? 'luku-mobile',
    plugins: [
        ...(config.plugins ?? []),
        'expo-font',
        'expo-web-browser',
        'expo-apple-authentication',
        'expo-notifications',
        'expo-image',
        'expo-secure-store',
        'expo-status-bar',
        '@react-native-google-signin/google-signin',
    ],
    extra: {
        ...config.extra,
        apiBaseUrl: process.env.EXPO_PUBLIC_API_BASE_URL ?? '',
        googleIosClientId: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? '',
        googleWebClientId: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID ?? '',
    },
});

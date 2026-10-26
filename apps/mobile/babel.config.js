/**
 * Babel config for the Expo (RN) build.
 *
 * The `@core` alias must stay in lock-step with:
 *   - root vite.config.ts        (web app)
 *   - root vitest.config.ts      (root unit tests)
 *   - apps/mobile/tsconfig.json  (TS path resolution for editor + tsc)
 *   - apps/mobile/metro.config.js (file watching outside the app folder)
 *
 * If you change one, change all five.
 */
module.exports = function (api) {
    api.cache(true);
    return {
        presets: ['babel-preset-expo'],
        plugins: [
            [
                'module-resolver',
                {
                    root: ['..', '../..'],
                    alias: {
                        '@core': '../../core',
                    },
                    extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
                },
            ],
            // Must be listed last — https://docs.swmansion.com/react-native-reanimated/docs/fundamentals/getting-started/
            'react-native-reanimated/plugin',
        ],
    };
};

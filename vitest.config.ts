import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
    plugins: [react()],
    test: {
        globals: true,
        environment: 'jsdom',
        setupFiles: ['./apps/web-legacy/src/test/setup.ts'],
        css: true,
        include: [
            'core/**/*.{test,spec}.{ts,tsx}',
            'backend/handlers/**/*.{test,spec}.{ts,tsx}',
            'backend/**/*.{test,spec}.{ts,tsx}',
            'apps/web-legacy/**/*.{test,spec}.{ts,tsx}',
            'apps/mobile/**/__tests__/**/*.{test,spec}.{ts,tsx}',
        ],
        coverage: {
            provider: 'v8',
            reporter: ['text', 'json', 'html'],
            exclude: [
                'node_modules/',
                'apps/mobile/',
                '**/*.d.ts',
                '**/*.config.*',
            ],
        },
    },
    resolve: {
        alias: {
            '@': path.resolve(__dirname, 'apps/web-legacy'),
            '@core': path.resolve(__dirname, 'core'),
        },
    },
});

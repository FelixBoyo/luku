import { afterEach, describe, expect, it } from 'vitest';
import { generateGeminiContent } from './gemini';

describe('generateGeminiContent', () => {
    const originalApiKey = process.env.GEMINI_API_KEY;

    afterEach(() => {
        process.env.GEMINI_API_KEY = originalApiKey;
    });

    it('rejects unsupported models before calling provider', async () => {
        process.env.GEMINI_API_KEY = 'test-key';
        await expect(
            generateGeminiContent({
                model: 'unknown-model',
                contents: 'hello',
            })
        ).rejects.toThrow('Unsupported Gemini model');
    });

    it('fails when server API key is missing', async () => {
        delete process.env.GEMINI_API_KEY;
        await expect(
            generateGeminiContent({
                model: 'gemini-2.5-flash',
                contents: 'hello',
            })
        ).rejects.toThrow('Gemini API key is not configured on the server');
    });
});

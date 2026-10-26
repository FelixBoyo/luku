import { GeminiProvider } from './providers/geminiProvider';
import { MockProvider } from './providers/mockProvider';
import { OllamaProvider } from './providers/ollamaProvider';
import type { AiProvider } from './providers/types';

export const getAiProvider = (): AiProvider => {
    const provider = process.env.AI_PROVIDER ?? 'gemini';
    switch (provider.toLowerCase()) {
        case 'ollama':
            return new OllamaProvider();
        case 'mock':
        case 'test':
            return new MockProvider();
        case 'gemini':
        default:
            return new GeminiProvider();
    }
};

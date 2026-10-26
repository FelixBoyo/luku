import { GoogleGenAI } from '@google/genai';
import { safeLogger } from '../../http/redact';

export interface GeminiGenerateContentRequest {
    model: string;
    contents: unknown;
    config?: Record<string, unknown>;
}

interface GeminiTextPart {
    text?: string;
    inlineData?: {
        data: string;
        mimeType: string;
    };
}

interface GeminiCandidate {
    content?: {
        parts?: GeminiTextPart[];
    };
}

export interface GeminiGenerateContentResponse {
    text: string;
    candidates: GeminiCandidate[];
}

const MODEL_ALLOWLIST = new Set([
    'gemini-2.5-flash',
    'gemini-2.5-flash-image',
    'gemini-2.0-flash-exp',
]);

const getGeminiClient = (): GoogleGenAI => {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
        throw new Error('Gemini API key is not configured on the server');
    }
    return new GoogleGenAI({ apiKey });
};

const getTextFromCandidates = (candidates: GeminiCandidate[]): string => {
    const parts = candidates?.[0]?.content?.parts || [];
    const textParts = parts
        .map((part) => part.text)
        .filter((part): part is string => typeof part === 'string');
    return textParts.join('\n').trim();
};

export const generateGeminiContent = async (
    payload: GeminiGenerateContentRequest
): Promise<GeminiGenerateContentResponse> => {
    if (!payload || typeof payload !== 'object') {
        throw new Error('Invalid Gemini request payload');
    }

    if (!payload.model || !MODEL_ALLOWLIST.has(payload.model)) {
        throw new Error('Unsupported Gemini model');
    }

    const ai = getGeminiClient();
    try {
        const response = await ai.models.generateContent({
            model: payload.model,
            contents: payload.contents as any,
            config: payload.config as any,
        });

        const candidates = (response.candidates || []) as GeminiCandidate[];
        const text = (response.text || '').trim() || getTextFromCandidates(candidates);

        return { text, candidates };
    } catch (error) {
        safeLogger.error('Gemini generateContent failed', {
            model: payload.model,
            error,
        });
        throw new Error('Gemini request failed');
    }
};

import type {
    AiCompletionInput,
    AiCompletionResult,
    AiProvider,
} from './types';
import { generateGeminiContent } from '../../handlers/ai/gemini';

/** Gemini-backed provider — swap via AI_* env without changing task routes */
export class GeminiProvider implements AiProvider {
    readonly id = 'gemini' as const;

    async complete(input: AiCompletionInput): Promise<AiCompletionResult> {
        const model = process.env.AI_DEFAULT_MODEL ?? 'gemini-2.5-flash';
        const result = await generateGeminiContent({
            model,
            contents: input.messages.map((m) => ({
                role: m.role === 'assistant' ? 'model' : 'user',
                parts: [{ text: m.content }],
            })),
            config: input.responseFormat === 'json' ? { responseMimeType: 'application/json' } : undefined,
        });
        return { text: result.text, provider: this.id, model };
    }
}

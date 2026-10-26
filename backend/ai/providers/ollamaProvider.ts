import type {
    AiCompletionInput,
    AiCompletionResult,
    AiProvider,
} from './types';
import { safeLogger } from '../../http/redact';

/**
 * Ollama-backed provider for local, zero-cost AI execution.
 * Connects to local Ollama daemon (defaults to http://localhost:11434).
 */
export class OllamaProvider implements AiProvider {
    readonly id = 'ollama' as const;

    async complete(input: AiCompletionInput): Promise<AiCompletionResult> {
        const baseUrl = (process.env.OLLAMA_BASE_URL ?? 'http://localhost:11434').replace(/\/+$/, '');
        const model = process.env.AI_DEFAULT_MODEL ?? 'llama3.2';

        const payload: Record<string, unknown> = {
            model,
            messages: input.messages.map((m) => ({
                role: m.role,
                content: m.content,
            })),
            stream: false,
        };

        if (input.responseFormat === 'json') {
            payload.format = 'json';
        }

        const controller = new AbortController();
        const timeoutMs = Number(process.env.OLLAMA_TIMEOUT_MS) || 60000;
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
            const res = await fetch(`${baseUrl}/api/chat`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(payload),
                signal: controller.signal,
            });

            clearTimeout(timeoutId);

            if (!res.ok) {
                const errorText = await res.text().catch(() => '');
                throw new Error(`Ollama chat failed with status ${res.status}: ${errorText}`);
            }

            const data = (await res.json()) as {
                message?: { content?: string };
                model?: string;
            };

            const text = data.message?.content?.trim() || '';
            return {
                text,
                provider: this.id,
                model: data.model || model,
            };
        } catch (error: any) {
            clearTimeout(timeoutId);
            safeLogger.error('[OllamaProvider] Completion failed', {
                model,
                baseUrl,
                error: error?.message || error,
            });
            throw error;
        }
    }
}

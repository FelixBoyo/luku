export type AiMessage = {
    role: 'user' | 'assistant' | 'system';
    content: string;
};

export type AiCompletionInput = {
    messages: AiMessage[];
    responseFormat?: 'text' | 'json';
};

export type AiCompletionResult = {
    text: string;
    provider: string;
    model: string;
};

export interface AiProvider {
    readonly id: 'gemini' | 'ollama' | 'custom';
    complete(input: AiCompletionInput): Promise<AiCompletionResult>;
}

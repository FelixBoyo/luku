import type {
    AiCompletionInput,
    AiCompletionResult,
    AiProvider,
} from './types';

/** Mock provider for testing and offline local development */
export class MockProvider implements AiProvider {
    readonly id = 'custom' as const;

    async complete(input: AiCompletionInput): Promise<AiCompletionResult> {
        const lastUserMessage = input.messages.filter((m) => m.role === 'user').pop()?.content ?? '';
        
        // If JSON output expected, return sample valid fashion combinations
        if (input.responseFormat === 'json') {
            return {
                text: JSON.stringify([
                    {
                        outfitName: 'Urban Chic Ensemble',
                        description: 'A stylish and contemporary combination perfect for your occasion.',
                        itemNames: ['Vintage Leather Jacket', 'Slim Fit Indigo Jeans', 'White Premium Sneakers'],
                    },
                    {
                        outfitName: 'Refined Casual',
                        description: 'Clean minimalist look that transitions effortlessly from day to night.',
                        itemNames: ['Classic White T-Shirt', 'Slim Fit Indigo Jeans'],
                    },
                ]),
                provider: this.id,
                model: 'mock-fashion-v1',
            };
        }

        return {
            text: `Mock recommendation tailored to: ${lastUserMessage.slice(0, 50)}...`,
            provider: this.id,
            model: 'mock-fashion-v1',
        };
    }
}

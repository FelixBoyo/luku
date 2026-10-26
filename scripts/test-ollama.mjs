import { OllamaProvider } from '../backend/ai/providers/ollamaProvider.ts';

async function testOllama() {
    console.log('Testing OllamaProvider with llama3.2:latest...');
    const provider = new OllamaProvider();
    const result = await provider.complete({
        messages: [
            {
                role: 'system',
                content: 'You are a fashion stylist. Return a JSON array with one outfit object: [{"outfitName": "string", "description": "string", "itemNames": ["item1", "item2"]}]',
            },
            {
                role: 'user',
                content: 'Create a casual street style outfit for Nairobi sunny afternoon.',
            },
        ],
        responseFormat: 'json',
    });

    console.log('\n--- Ollama Result ---');
    console.log('Model:', result.model);
    console.log('Provider:', result.provider);
    console.log('Text Output:', result.text);
    console.log('\nParsed JSON:', JSON.parse(result.text));
    console.log('\n✅ Ollama is working successfully with Llama 3.2!');
}

testOllama().catch((err) => {
    console.error('❌ Ollama test failed:', err);
    process.exit(1);
});

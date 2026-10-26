import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getOutfitSuggestions } from './outfitSuggestions';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';
import { getAiProvider } from '../router';

vi.mock('../../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

vi.mock('../router', () => ({
    getAiProvider: vi.fn(),
}));

const createMockBuilder = (result: { data: any; error: any }) => {
    const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        maybeSingle: vi.fn(() => builder),
        then: (onfulfilled: any) => {
            return Promise.resolve(result).then(onfulfilled);
        },
    };
    return builder;
};

describe('outfitSuggestions task', () => {
    let mockSupabase: any;
    let mockAiProvider: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            from: vi.fn(),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);

        mockAiProvider = {
            complete: vi.fn(),
        };
        vi.mocked(getAiProvider).mockReturnValue(mockAiProvider);
    });

    it('queries the AI provider with final wardrobe and returns mapped outfits', async () => {
        const mockWardrobe = [
            {
                id: 'w_1',
                name: 'Silk Shirt',
                category: 'Tops',
                color: 'Cream',
                image_url: 'silk.jpg',
            },
            {
                id: 'w_2',
                name: 'Chino Trousers',
                category: 'Bottoms',
                color: 'Khaki',
                image_url: 'chinos.jpg',
            },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'wardrobe_items') {
                return createMockBuilder({ data: mockWardrobe, error: null });
            }
            if (table === 'profiles') {
                return createMockBuilder({ data: { style_preferences: ['Smart Casual'] }, error: null });
            }
        });

        const aiResponseJson = [
            {
                outfitName: 'Chic Smart Casual',
                description: 'A perfect combination of cream silk and khaki chinos.',
                itemNames: ['Silk Shirt', 'Chino Trousers'],
            },
        ];

        mockAiProvider.complete.mockResolvedValue({
            text: JSON.stringify(aiResponseJson),
            provider: 'mock-gemini',
            model: 'gemini-2.5-flash',
        });

        const result = await getOutfitSuggestions('user_123', { occasion: 'Dinner' });

        expect(mockSupabase.from).toHaveBeenCalledWith('wardrobe_items');
        expect(mockAiProvider.complete).toHaveBeenCalled();
        expect(result.suggestions).toHaveLength(1);
        
        const suggestion = result.suggestions[0];
        expect(suggestion.name).toBe('Chic Smart Casual');
        expect(suggestion.coverImageUrl).toBe('silk.jpg');
        expect(suggestion.pieces).toHaveLength(2);
        expect(suggestion.pieces[0].wardrobeItemId).toBe('w_1');
        expect(suggestion.pieces[1].wardrobeItemId).toBe('w_2');
    });

    it('falls back to DEFAULT_WARDROBE if user wardrobe has less than 2 items', async () => {
        // Less than 2 items
        const mockWardrobe = [
            {
                id: 'w_1',
                name: 'Silk Shirt',
                category: 'Tops',
                color: 'Cream',
                image_url: 'silk.jpg',
            },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'wardrobe_items') {
                return createMockBuilder({ data: mockWardrobe, error: null });
            }
            if (table === 'profiles') {
                return createMockBuilder({ data: { style_preferences: [] }, error: null });
            }
        });

        const aiResponseJson = [
            {
                outfitName: 'Casual Classic',
                description: 'A clean casual outfit.',
                itemNames: ['Classic White T-Shirt', 'Slim Fit Indigo Jeans'], // These are from DEFAULT_WARDROBE
            },
        ];

        mockAiProvider.complete.mockResolvedValue({
            text: JSON.stringify(aiResponseJson),
        });

        const result = await getOutfitSuggestions('user_123', { occasion: 'Weekend' });

        expect(result.suggestions).toHaveLength(1);
        expect(result.suggestions[0].pieces[0].name).toBe('Classic White T-Shirt');
        expect(result.suggestions[0].pieces[1].name).toBe('Slim Fit Indigo Jeans');
    });

    it('returns a safe fallback outfit on AI query or parsing error', async () => {
        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'wardrobe_items') {
                return createMockBuilder({ data: [], error: null }); // Will trigger default wardrobe
            }
            if (table === 'profiles') {
                return createMockBuilder({ data: null, error: null });
            }
        });

        mockAiProvider.complete.mockRejectedValue(new Error('API Timeout'));

        const result = await getOutfitSuggestions('user_123', { occasion: 'Party' });

        expect(result.suggestions).toHaveLength(1);
        expect(result.suggestions[0].name).toBe('Effortless Contemporary');
        expect(result.suggestions[0].confidence).toBe(0.85);
        expect(result.suggestions[0].pieces).toHaveLength(4); // Default wardrobe has 4 items
    });
});

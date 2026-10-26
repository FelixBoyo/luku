import type { StylistOutfit, StyleEnhancer } from '../types/domain/stylist';
import { stylistOutfits as initialOutfits, styleEnhancers as initialEnhancers } from '../data/mock/stylistOutfits';
import { apiPost } from '../api/apiClient';
import type {
    OutfitSuggestionsRequest,
    OutfitSuggestionsResponse,
} from '../../../../packages/contracts/src/ai';

export type StylistRepository = {
    listOutfits: () => Promise<StylistOutfit[]>;
    listEnhancers: () => Promise<StyleEnhancer[]>;
    generateSuggestions: (req: OutfitSuggestionsRequest) => Promise<OutfitSuggestionsResponse>;
};

export const createEmptyStylistRepository = (): StylistRepository => ({
    listOutfits: async () => [],
    listEnhancers: async () => [],
    generateSuggestions: async () => ({ suggestions: [] }),
});

export const createMockStylistRepository = (): StylistRepository => ({
    listOutfits: async () => initialOutfits.map((o) => ({ ...o, items: [...o.items] })),
    listEnhancers: async () => [...initialEnhancers],
    generateSuggestions: async (req) => ({
        suggestions: [
            {
                id: 'mock-sug-1',
                name: 'Tailored Urban Chic',
                description: req.description || 'A sleek combination tailored to your needs.',
                occasion: req.occasion || 'Smart Casual',
                coverImageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600',
                pieces: [
                    { name: 'Vintage Leather Jacket', category: 'Outerwear', imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600', isShopTheLook: false },
                    { name: 'Classic White T-Shirt', category: 'Tops', imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400', isShopTheLook: true, price: 1800, productId: 'prod-shirt-1' },
                ],
                confidence: 0.95,
                matchScore: 94,
                totalShopLookPrice: 1800,
            },
        ],
    }),
});

export const createApiStylistRepository = (): StylistRepository => ({
    listOutfits: async () => initialOutfits.map((o) => ({ ...o, items: [...o.items] })),
    listEnhancers: async () => [...initialEnhancers],
    generateSuggestions: async (req) => {
        try {
            const res = await apiPost<OutfitSuggestionsResponse>('/v1/api/ai/outfit-suggestions', req);
            if (res.data) {
                return res.data;
            }
        } catch {
            // fallback to mock on network fail
        }
        return createMockStylistRepository().generateSuggestions(req);
    },
});

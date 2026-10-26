import type { OutfitOfDay } from '../types/domain/home';
import { outfitsOfDay } from '../data/mock/home';
import { apiGet } from '../api/apiClient';
import type { OotdResponse, RecommendationsResponse } from '../../../../packages/contracts/src/ai';

export type HomeRepository = {
    listOutfitsOfDay: () => Promise<OutfitOfDay[]>;
    getOotd: (refresh?: boolean) => Promise<OotdResponse>;
    getRecommendations: () => Promise<RecommendationsResponse>;
};

export const createEmptyHomeRepository = (): HomeRepository => ({
    listOutfitsOfDay: async () => [],
    getOotd: async () => ({
        ootd: {
            id: 'empty',
            date: '',
            title: '',
            description: '',
            occasion: '',
            coverImageUrl: '',
            pieces: [],
            matchScore: 0,
        },
    }),
    getRecommendations: async () => ({
        trending: [],
        youMightLike: [],
        moreForYou: [],
    }),
});

export const createMockHomeRepository = (): HomeRepository => ({
    listOutfitsOfDay: async () =>
        outfitsOfDay.map((o) => ({ ...o, items: [...o.items] })),
    getOotd: async () => ({
        ootd: {
            id: 'mock-ootd',
            date: new Date().toISOString().split('T')[0],
            title: 'Modern Classic Silhouette',
            description: 'Clean tailoring meets comfortable everyday luxury.',
            occasion: 'Everyday Chic',
            coverImageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
            pieces: [
                { name: 'Oversized Linen Shirt', category: 'Tops', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500' },
                { name: 'Wide-Leg Trousers', category: 'Bottoms', imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500' },
            ],
            weatherNote: 'Mild & pleasant — ideal for breathable layers',
            matchScore: 96,
        },
    }),
    getRecommendations: async () => ({
        pickedForYou: {
            id: 'mock-rec-1',
            productId: 'p1',
            title: 'Textured Knit Cardigan',
            price: 3200,
            imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500',
            category: 'Outerwear',
            brand: 'ZARA',
            matchPercentage: 98,
            reason: '98% match with your preferred silhouette',
            section: 'picked_for_you',
        },
        trending: [],
        youMightLike: [],
        moreForYou: [],
    }),
});

export const createApiHomeRepository = (): HomeRepository => ({
    listOutfitsOfDay: async () =>
        outfitsOfDay.map((o) => ({ ...o, items: [...o.items] })),
    getOotd: async (refresh = false) => {
        try {
            const res = await apiGet<OotdResponse>(`/v1/api/ai/ootd${refresh ? '?refresh=true' : ''}`);
            if (res.data) {
                return res.data;
            }
        } catch {
            // fallback to mock on network fail
        }
        return createMockHomeRepository().getOotd();
    },
    getRecommendations: async () => {
        try {
            const res = await apiGet<RecommendationsResponse>('/v1/api/ai/recommendations');
            if (res.data) {
                return res.data;
            }
        } catch {
            // fallback to mock on network fail
        }
        return createMockHomeRepository().getRecommendations();
    },
});

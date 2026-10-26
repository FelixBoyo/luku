import type { WardrobePairing } from '../types/domain/wardrobePairing';
import { wardrobePairings as initialPairings } from '../data/mock/wardrobePairings';
import { apiGet } from '../api/apiClient';
import type { WardrobePairingsResponse } from '../../../../packages/contracts/src/ai';

export type WardrobePairingsRepository = {
    list: () => Promise<WardrobePairing[]>;
};

export const createEmptyWardrobePairingsRepository = (): WardrobePairingsRepository => ({
    list: async () => [],
});

export const createMockWardrobePairingsRepository = (): WardrobePairingsRepository => ({
    list: async () => [...initialPairings],
});

export const createApiWardrobePairingsRepository = (): WardrobePairingsRepository => ({
    list: async () => {
        try {
            const res = await apiGet<WardrobePairingsResponse>('/v1/api/ai/wardrobe-pairings');
            if (res.data?.pairings) {
                return res.data.pairings.map((p) => ({
                    productId: p.pairedProductId,
                    name: p.pairedProductTitle,
                    pairs: p.wardrobeItemName,
                    match: p.matchPercentage,
                    price: p.pairedProductPrice,
                    image: p.pairedProductImageUrl,
                }));
            }
        } catch {
            // fallback to mock on network fail
        }
        return createMockWardrobePairingsRepository().list();
    },
});

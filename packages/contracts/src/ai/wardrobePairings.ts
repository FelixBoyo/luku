export type WardrobePairingDto = {
    id: string;
    wardrobeItemId: string;
    wardrobeItemName: string;
    wardrobeItemCategory: string;
    wardrobeItemImageUrl: string;
    pairedProductId: string;
    pairedProductTitle: string;
    pairedProductImageUrl: string;
    pairedProductPrice: number;
    matchPercentage: number;
    pairingReason: string;
};

export type WardrobePairingsResponse = {
    pairings: WardrobePairingDto[];
};

export type DiscoverFeedQuery = {
    category?: string;
    condition?: string;
    minPrice?: number;
    maxPrice?: number;
    brand?: string;
    sortBy?: 'match' | 'price_asc' | 'price_desc' | 'newest';
    limit?: number;
    offset?: number;
};

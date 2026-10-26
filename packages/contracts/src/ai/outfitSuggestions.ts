/** Task-based AI contract — provider-agnostic */

export type OutfitSuggestionsRequest = {
    occasion?: string;
    description?: string;
    budgetMax?: number;
    wardrobeItemIds?: string[];
    stylePreferences?: string[];
};

export type OutfitPieceDto = {
    name: string;
    category: string;
    imageUrl?: string;
    wardrobeItemId?: string;
    productId?: string;
    price?: number;
    brand?: string;
    isShopTheLook?: boolean;
};

export type StyleEnhancerDto = {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    price: number;
    matchPercentage: number;
    productId?: string;
};

export type OutfitSuggestionDto = {
    id: string;
    name: string;
    description?: string;
    occasion: string;
    coverImageUrl: string;
    pieces: OutfitPieceDto[];
    confidence?: number;
    matchScore?: number;
    styleEnhancers?: StyleEnhancerDto[];
    totalShopLookPrice?: number;
};

export type OutfitSuggestionsResponse = {
    suggestions: OutfitSuggestionDto[];
};

export type RecommendationDto = {
    id: string;
    productId: string;
    title: string;
    imageUrl: string;
    price: number;
    category: string;
    brand?: string;
    matchPercentage: number;
    reason?: string;
    section?: 'picked_for_you' | 'trending' | 'you_might_like' | 'more_for_you';
};

export type RecommendationsQuery = {
    section?: 'picked_for_you' | 'trending' | 'you_might_like' | 'more_for_you' | 'all';
    limit?: number;
    category?: string;
};

export type RecommendationsResponse = {
    pickedForYou?: RecommendationDto;
    trending: RecommendationDto[];
    youMightLike: RecommendationDto[];
    moreForYou: RecommendationDto[];
};

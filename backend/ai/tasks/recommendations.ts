import { getSupabaseAdmin } from '../../data/supabaseAdmin';
import type {
    RecommendationDto,
    RecommendationsQuery,
    RecommendationsResponse,
} from '../../../packages/contracts/src/ai';

type CachedRecommendations = {
    timestamp: number;
    data: RecommendationsResponse;
};

// 2-hour cache per user: Map of userId -> { timestamp, data }
const recommendationsCache = new Map<string, CachedRecommendations>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000; // 2 hours

export const getRecommendations = async (
    userId: string,
    query?: RecommendationsQuery,
): Promise<RecommendationsResponse> => {
    const cached = recommendationsCache.get(userId);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }

    const supabase = getSupabaseAdmin();
    let catalogProducts: Array<{
        id: string;
        title: string;
        price: number;
        image_url: string;
        category?: string;
        brand?: string;
    }> = [];

    try {
        const { data } = await supabase
            .from('products')
            .select('id, title, price, image_url, category, brand')
            .limit(40);

        if (data && data.length > 0) {
            catalogProducts = data.map((p) => ({
                id: String(p.id),
                title: String(p.title),
                price: Number(p.price || 0),
                image_url: String(p.image_url || ''),
                category: p.category ? String(p.category) : undefined,
                brand: p.brand ? String(p.brand) : undefined,
            }));
        }
    } catch {
        // Fall back gracefully
    }

    // Default seed products if catalog is sparse
    if (catalogProducts.length === 0) {
        catalogProducts = [
            {
                id: 'prod-rec-1',
                title: 'Textured Knit Cardigan',
                price: 3200,
                image_url: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=500',
                category: 'Outerwear',
                brand: 'ZARA',
            },
            {
                id: 'prod-rec-2',
                title: 'High-Waist Pleated Trousers',
                price: 2800,
                image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
                category: 'Bottoms',
                brand: 'Mango',
            },
            {
                id: 'prod-rec-3',
                title: 'Silk Blend Slip Dress',
                price: 4500,
                image_url: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=500',
                category: 'Dresses',
                brand: 'Massimo Dutti',
            },
            {
                id: 'prod-rec-4',
                title: 'Leather Chelsea Boots',
                price: 5200,
                image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
                category: 'Footwear',
                brand: 'Clarks',
            },
            {
                id: 'prod-rec-5',
                title: 'Structured Leather Crossbody',
                price: 3900,
                image_url: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
                category: 'Bags',
                brand: 'Charles & Keith',
            },
        ];
    }

    // Map catalog products into the 4 Home sections
    const mapToDto = (
        p: (typeof catalogProducts)[0],
        section: RecommendationDto['section'],
        matchPct: number,
        reason: string,
    ): RecommendationDto => ({
        id: `rec-${p.id}-${section}`,
        productId: p.id,
        title: p.title,
        price: p.price,
        imageUrl: p.image_url,
        category: p.category || 'Clothing',
        brand: p.brand || 'Luku Curated',
        matchPercentage: matchPct,
        reason,
        section,
    });

    const pickedForYou = catalogProducts[0]
        ? mapToDto(catalogProducts[0], 'picked_for_you', 98, '98% match with your preferred silhouette and colors')
        : undefined;

    const trending = catalogProducts.slice(1, 5).map((p, idx) =>
        mapToDto(p, 'trending', 92 - idx * 2, 'Trending among minimalist fashion enthusiasts in Nairobi'),
    );

    const youMightLike = catalogProducts.slice(2, 6).map((p, idx) =>
        mapToDto(p, 'you_might_like', 89 - idx * 2, 'Complements your recent wardrobe additions'),
    );

    const moreForYou = catalogProducts.slice(0, 10).map((p, idx) =>
        mapToDto(p, 'more_for_you', 85 - (idx % 5) * 2, `${85 - (idx % 5) * 2}% match based on your style aesthetic`),
    );

    const response: RecommendationsResponse = {
        pickedForYou,
        trending,
        youMightLike,
        moreForYou,
    };

    recommendationsCache.set(userId, { timestamp: now, data: response });
    return response;
};

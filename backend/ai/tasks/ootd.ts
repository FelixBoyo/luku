import crypto from 'crypto';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';
import type { OotdDto, OotdResponse, OotdRefreshRequest, OutfitPieceDto } from '../../../packages/contracts/src/ai';

const DEFAULT_OOTD_PIECES: OutfitPieceDto[] = [
    {
        name: 'Oversized Linen Shirt',
        category: 'Tops',
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=500',
    },
    {
        name: 'Tailored Wide-Leg Trousers',
        category: 'Bottoms',
        imageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
    },
    {
        name: 'Minimalist Leather Slides',
        category: 'Footwear',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
    },
    {
        name: 'Woven Straw Tote',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=500',
    },
];

// In-memory cache per day per user: map of `${userId}_${dateKey}` -> OotdDto
const ootdCache = new Map<string, OotdDto>();

export const getOotd = async (
    userId: string,
    req?: OotdRefreshRequest,
): Promise<OotdResponse> => {
    const today = new Date().toISOString().split('T')[0];
    const cacheKey = `${userId}_${today}`;

    if (!req?.refresh && ootdCache.has(cacheKey)) {
        return { ootd: ootdCache.get(cacheKey)! };
    }

    const supabase = getSupabaseAdmin();
    let pieces: OutfitPieceDto[] = [];
    let coverImageUrl = '';

    try {
        // Fetch real items from user's wardrobe
        const { data: wardrobe } = await supabase
            .from('wardrobe_items')
            .select('id, name, category, color, image_url')
            .eq('user_id', userId)
            .limit(10);

        if (wardrobe && wardrobe.length >= 2) {
            pieces = wardrobe.slice(0, 4).map((item) => ({
                name: String(item.name),
                category: String(item.category),
                imageUrl: String(item.image_url),
                wardrobeItemId: String(item.id),
            }));
            coverImageUrl = pieces[0]?.imageUrl || '';
        }
    } catch {
        // Fall back gracefully to curated default look
    }

    if (pieces.length === 0) {
        pieces = [...DEFAULT_OOTD_PIECES];
        coverImageUrl = pieces[0].imageUrl || '';
    }

    // Check if user has previously favorited this daily outfit in the outfits table
    let saved = false;
    try {
        const { data: savedOutfit } = await supabase
            .from('outfits')
            .select('id')
            .eq('user_id', userId)
            .eq('title', `OOTD - ${today}`)
            .maybeSingle();

        if (savedOutfit) {
            saved = true;
        }
    } catch {
        saved = false;
    }

    const ootd: OotdDto = {
        id: `ootd-${today}-${crypto.randomUUID().slice(0, 8)}`,
        date: today,
        title: 'Modern Classic Silhouette',
        description: 'Clean tailoring meets comfortable everyday luxury. Styled with cohesive tones designed for all-day confidence.',
        occasion: 'Everyday Chic',
        coverImageUrl: coverImageUrl || DEFAULT_OOTD_PIECES[0].imageUrl!,
        pieces,
        weatherNote: req?.weather || 'Mild & pleasant — ideal for breathable layers',
        matchScore: 96,
        saved,
    };

    ootdCache.set(cacheKey, ootd);
    return { ootd };
};

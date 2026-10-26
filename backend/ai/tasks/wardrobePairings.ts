import { getSupabaseAdmin } from '../../data/supabaseAdmin';
import type {
    WardrobePairingDto,
    WardrobePairingsResponse,
} from '../../../packages/contracts/src/ai';

type CachedPairings = {
    timestamp: number;
    data: WardrobePairingsResponse;
};

// 2-hour cache per user: Map of userId -> { timestamp, data }
const pairingsCache = new Map<string, CachedPairings>();
const CACHE_TTL_MS = 2 * 60 * 60 * 1000;

const DEFAULT_PAIRINGS: WardrobePairingDto[] = [
    {
        id: 'pairing-default-1',
        wardrobeItemId: 'wardrobe-seed-1',
        wardrobeItemName: 'Classic Denim Jacket',
        wardrobeItemCategory: 'Outerwear',
        wardrobeItemImageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=500',
        pairedProductId: 'prod-pair-1',
        pairedProductTitle: 'High-Rise Relaxed Chinos',
        pairedProductImageUrl: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=500',
        pairedProductPrice: 2600,
        matchPercentage: 95,
        pairingReason: 'Complements the rugged wash of your denim with balanced, structured earthy tones.',
    },
    {
        id: 'pairing-default-2',
        wardrobeItemId: 'wardrobe-seed-2',
        wardrobeItemName: 'Silk Button-Down Shirt',
        wardrobeItemCategory: 'Tops',
        wardrobeItemImageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=500',
        pairedProductId: 'prod-pair-2',
        pairedProductTitle: 'Pleated Midi Skirt',
        pairedProductImageUrl: 'https://images.unsplash.com/photo-1583496661160-fb5886a0aaaa?w=500',
        pairedProductPrice: 3400,
        matchPercentage: 92,
        pairingReason: 'Creates an elegant silhouette that shifts seamlessly from office meetings to evening dinner.',
    },
    {
        id: 'pairing-default-3',
        wardrobeItemId: 'wardrobe-seed-3',
        wardrobeItemName: 'Black Chelsea Boots',
        wardrobeItemCategory: 'Footwear',
        wardrobeItemImageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=500',
        pairedProductId: 'prod-pair-3',
        pairedProductTitle: 'Double-Breasted Wool Coat',
        pairedProductImageUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=500',
        pairedProductPrice: 5800,
        matchPercentage: 97,
        pairingReason: 'Grounds this sharp outerwear piece with clean, timeless monochrome footwear.',
    },
];

export const getWardrobePairings = async (
    userId: string,
): Promise<WardrobePairingsResponse> => {
    const cached = pairingsCache.get(userId);
    const now = Date.now();

    if (cached && now - cached.timestamp < CACHE_TTL_MS) {
        return cached.data;
    }

    const supabase = getSupabaseAdmin();
    let pairings: WardrobePairingDto[] = [];

    try {
        const [wardrobeRes, productsRes] = await Promise.all([
            supabase.from('wardrobe_items').select('id, name, category, image_url').eq('user_id', userId).limit(5),
            supabase.from('products').select('id, title, price, image_url, category').limit(10),
        ]);

        const wardrobe = wardrobeRes.data || [];
        const products = productsRes.data || [];

        if (wardrobe.length > 0 && products.length > 0) {
            pairings = wardrobe.slice(0, 5).map((wItem, index) => {
                const product = products[index % products.length];
                const matchPct = 95 - index * 2;
                return {
                    id: `pairing-${wItem.id}-${product.id}`,
                    wardrobeItemId: String(wItem.id),
                    wardrobeItemName: String(wItem.name),
                    wardrobeItemCategory: String(wItem.category),
                    wardrobeItemImageUrl: String(wItem.image_url),
                    pairedProductId: String(product.id),
                    pairedProductTitle: String(product.title),
                    pairedProductImageUrl: String(product.image_url),
                    pairedProductPrice: Number(product.price || 0),
                    matchPercentage: matchPct,
                    pairingReason: `Pairs perfectly with your ${wItem.name} for balanced proportion and complementary styling.`,
                };
            });
        }
    } catch {
        // Fall back gracefully
    }

    if (pairings.length === 0) {
        pairings = [...DEFAULT_PAIRINGS];
    }

    const response: WardrobePairingsResponse = { pairings };
    pairingsCache.set(userId, { timestamp: now, data: response });
    return response;
};

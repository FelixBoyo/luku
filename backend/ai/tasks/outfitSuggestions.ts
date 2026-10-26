import crypto from 'crypto';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';
import { getAiProvider } from '../router';
import type {
    OutfitSuggestionsRequest,
    OutfitSuggestionsResponse,
    OutfitSuggestionDto,
    OutfitPieceDto,
    StyleEnhancerDto,
} from '../../../packages/contracts/src/ai';

type WardrobeItemSubset = {
    id: string;
    name: string;
    category: string;
    color: string;
    image_url: string;
};

const DEFAULT_WARDROBE: WardrobeItemSubset[] = [
    {
        id: 'default-1',
        name: 'Vintage Leather Jacket',
        category: 'Outerwear',
        color: 'Black',
        image_url: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600',
    },
    {
        id: 'default-2',
        name: 'Classic White T-Shirt',
        category: 'Tops',
        color: 'White',
        image_url: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
    },
    {
        id: 'default-3',
        name: 'Slim Fit Indigo Jeans',
        category: 'Bottoms',
        color: 'Blue',
        image_url: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400',
    },
    {
        id: 'default-4',
        name: 'White Premium Sneakers',
        category: 'Footwear',
        color: 'White',
        image_url: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400',
    },
];

const DEFAULT_STYLE_ENHANCERS: StyleEnhancerDto[] = [
    {
        id: 'enhancer-1',
        name: 'Minimalist Silver Chrono',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=400',
        price: 2400,
        matchPercentage: 96,
        productId: 'prod-enhancer-1',
    },
    {
        id: 'enhancer-2',
        name: 'Italian Leather Belt',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1624222247344-550fb60583dc?w=400',
        price: 1800,
        matchPercentage: 93,
        productId: 'prod-enhancer-2',
    },
    {
        id: 'enhancer-3',
        name: 'Polarized Acetate Shades',
        category: 'Accessories',
        imageUrl: 'https://images.unsplash.com/photo-1511499767150-a48a237f0083?w=400',
        price: 2100,
        matchPercentage: 91,
        productId: 'prod-enhancer-3',
    },
];

export const getOutfitSuggestions = async (
    userId: string,
    req: OutfitSuggestionsRequest,
): Promise<OutfitSuggestionsResponse> => {
    const supabase = getSupabaseAdmin();
    const occasion = req.occasion?.trim() || 'Casual Chic';
    const userPromptDescription = req.description?.trim();

    // 1. Fetch user wardrobe items from database
    let wardrobeItems: WardrobeItemSubset[] = [];
    try {
        const query = supabase
            .from('wardrobe_items')
            .select('id, name, category, color, image_url')
            .eq('user_id', userId);

        if (req.wardrobeItemIds && req.wardrobeItemIds.length > 0) {
            void query.in('id', req.wardrobeItemIds);
        }

        const { data, error } = await query;
        if (!error && data) {
            wardrobeItems = data.map((d) => ({
                id: String(d.id),
                name: String(d.name),
                category: String(d.category),
                color: String(d.color || ''),
                image_url: String(d.image_url),
            }));
        }
    } catch {
        // Fallback to empty wardrobe
    }

    // 2. Fetch user style preferences if not provided
    let stylePreferences = req.stylePreferences || [];
    if (stylePreferences.length === 0) {
        try {
            const { data } = await supabase
                .from('profiles')
                .select('style_preferences')
                .eq('id', userId)
                .maybeSingle();
            if (data?.style_preferences) {
                stylePreferences = data.style_preferences;
            }
        } catch {
            // Keep empty
        }
    }

    const finalWardrobe = wardrobeItems.length >= 2 ? wardrobeItems : DEFAULT_WARDROBE;

    // 3. Query the AI completion provider
    const provider = getAiProvider();
    
    const systemPrompt = `You are a professional fashion stylist. You will generate cohesive outfit combinations.
You must output a JSON array of objects conforming exactly to this structure:
[
  {
    "outfitName": "A creative and appealing name for the outfit",
    "description": "A short, compelling description of the outfit's style and why the items work well together",
    "itemNames": ["Name of Item 1", "Name of Item 2"]
  }
]
Constraints:
1. Prefer using names from the provided wardrobe list. If a necessary complementary item is missing, name a classic clothing piece.
2. Create 3 distinct outfits tailored to the occasion, user description, and style preferences.
3. Output ONLY the JSON array without markdown code blocks.`;

    const userPrompt = `Occasion: "${occasion}"
${userPromptDescription ? `User Style Request: "${userPromptDescription}"` : ''}
Style Preferences: ${stylePreferences.join(', ') || 'Casual'}
${req.budgetMax ? `Max Budget: KES ${req.budgetMax}` : ''}

Available Wardrobe Items:
${JSON.stringify(
    finalWardrobe.map((item) => ({
        name: item.name,
        category: item.category,
        color: item.color,
    })),
    null,
    2,
)}`;

    try {
        const aiResult = await provider.complete({
            messages: [
                { role: 'system', content: systemPrompt },
                { role: 'user', content: userPrompt },
            ],
            responseFormat: 'json',
        });

        let parsed: any;
        try {
            const cleanText = aiResult.text.trim().replace(/^```json/i, '').replace(/```$/i, '').trim();
            const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
            const objectMatch = cleanText.match(/\{[\s\S]*\}/);
            if (arrayMatch) {
                parsed = JSON.parse(arrayMatch[0]);
            } else if (objectMatch) {
                const obj = JSON.parse(objectMatch[0]);
                parsed = Array.isArray(obj) ? obj : obj.outfits || obj.suggestions || [obj];
            } else {
                parsed = JSON.parse(cleanText);
            }
        } catch {
            parsed = [];
        }

        const suggestionsJson = (Array.isArray(parsed) ? parsed : []) as Array<{
            outfitName?: string;
            name?: string;
            description?: string;
            itemNames?: string[];
            items?: string[];
        }>;

        if (suggestionsJson.length === 0) {
            throw new Error('LLM response did not contain a valid outfit suggestions array');
        }

        const suggestions: OutfitSuggestionDto[] = suggestionsJson.map((sug, idx) => {
            const pieces: OutfitPieceDto[] = [];
            let coverImageUrl = '';
            let totalShopLookPrice = 0;
            const items = sug.itemNames || sug.items || [];

            for (const itemName of items) {
                const match = finalWardrobe.find(
                    (item) => item.name.toLowerCase() === itemName.toLowerCase(),
                );
                if (match) {
                    pieces.push({
                        name: match.name,
                        category: match.category,
                        imageUrl: match.image_url,
                        wardrobeItemId: match.id,
                        isShopTheLook: false,
                    });
                    if (!coverImageUrl) {
                        coverImageUrl = match.image_url;
                    }
                } else {
                    const price = 2500 + (idx * 400);
                    totalShopLookPrice += price;
                    pieces.push({
                        name: itemName,
                        category: 'Clothing',
                        imageUrl: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?w=400',
                        productId: `prod-shop-look-${idx}`,
                        price,
                        isShopTheLook: true,
                    });
                }
            }

            return {
                id: `ai-${crypto.randomUUID()}`,
                name: sug.outfitName || sug.name || 'Curated Ensemble',
                description: sug.description || 'A stylish outfit tailored to your preferences.',
                occasion,
                coverImageUrl: coverImageUrl || 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600',
                pieces,
                confidence: 0.95,
                matchScore: 94 - idx * 2,
                styleEnhancers: DEFAULT_STYLE_ENHANCERS,
                totalShopLookPrice: totalShopLookPrice > 0 ? totalShopLookPrice : undefined,
            };
        });

        return { suggestions };
    } catch {
        const fallbackOutfit: OutfitSuggestionDto = {
            id: 'fallback-1',
            name: 'Effortless Contemporary',
            description: 'A balanced outfit that pairs comfortable wardrobe staples with clean lines.',
            occasion,
            coverImageUrl: finalWardrobe[0].image_url,
            pieces: finalWardrobe.map((item, i) => ({
                name: item.name,
                category: item.category,
                imageUrl: item.image_url,
                wardrobeItemId: item.id,
                isShopTheLook: i === 0,
                price: i === 0 ? 3200 : undefined,
                productId: i === 0 ? 'prod-shop-1' : undefined,
            })),
            confidence: 0.85,
            matchScore: 92,
            styleEnhancers: DEFAULT_STYLE_ENHANCERS,
            totalShopLookPrice: 3200,
        };
        return { suggestions: [fallbackOutfit] };
    }
};

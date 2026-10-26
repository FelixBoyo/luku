import {
    ClothingItem,
    Outfit,
    StyleAnalysis,
    BudgetSuggestion,
    ColorAnalysis,
    SustainabilityInsights,
    TripPlan,
    StyleSanctuaryContent,
} from '../types';
import { withServiceWrapper } from './serviceWrapper';
import { withRetry } from './retryHandler';
import { integrationManager } from './integrationManager';
import { errorLogger } from './errorLogger';
import { getIntegrationConfig } from './integrationConfig';

const config = getIntegrationConfig();
const Type = {
    OBJECT: 'OBJECT',
    ARRAY: 'ARRAY',
    STRING: 'STRING',
    NUMBER: 'NUMBER',
    BOOLEAN: 'BOOLEAN',
} as const;

if (!config.gemini.enabled) {
    console.warn('Gemini API is not configured. AI features will be limited.');
}

// Helper function to map item names to full ClothingItem objects
const mapItemNamesToItems = (
    itemNames: string[],
    availableItems: ClothingItem[]
): ClothingItem[] => {
    return itemNames
        .map((name) => availableItems.find((item) => item.name === name))
        .filter((item): item is ClothingItem => item !== undefined);
};

interface GeminiGenerateContentResponse {
    text: string;
    candidates: Array<{
        content?: {
            parts?: Array<{
                text?: string;
                inlineData?: {
                    data: string;
                    mimeType: string;
                };
            }>;
        };
    }>;
}

const generateGeminiContent = async (payload: {
    model: string;
    contents: unknown;
    config?: Record<string, unknown>;
}): Promise<GeminiGenerateContentResponse> => {
    const response = await fetch('/api/ai/gemini/generate-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
    });

    if (!response.ok) {
        throw new Error(`Gemini proxy failed with status ${response.status}`);
    }

    const data = (await response.json()) as GeminiGenerateContentResponse;
    if (!data || typeof data.text !== 'string' || !Array.isArray(data.candidates)) {
        throw new Error('Invalid Gemini proxy response');
    }
    return data;
};

const clothingItemSchema = {
    type: Type.OBJECT,
    properties: {
        name: {
            type: Type.STRING,
            description:
                "A short, descriptive name for the clothing item (e.g., 'White Cotton T-Shirt', 'Blue Skinny Jeans').",
        },
        category: {
            type: Type.STRING,
            description:
                "The general category of clothing (e.g., 'Top', 'Bottoms', 'Outerwear', 'Footwear', 'Accessory').",
        },
        color: {
            type: Type.STRING,
            description: 'The dominant color of the item.',
        },
        style: {
            type: Type.STRING,
            description:
                "The style of the item (e.g., 'Casual', 'Formal', 'Bohemian', 'Sporty', 'Minimalist').",
        },
        season: {
            type: Type.STRING,
            description:
                "The season this item is most suitable for (e.g., 'Summer', 'Winter', 'All Seasons').",
        },
    },
    required: ['name', 'category', 'color', 'style', 'season'],
};

const outfitItemsDetectionSchema = {
    type: Type.OBJECT,
    properties: {
        hasMultipleItems: {
            type: Type.BOOLEAN,
            description:
                'Whether the image contains multiple clearly separate clothing items that can be cropped individually',
        },
        items: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    itemName: {
                        type: Type.STRING,
                        description:
                            'Brief name of the clothing item (e.g., "Blue Top", "Black Skirt")',
                    },
                    category: {
                        type: Type.STRING,
                        description:
                            'Category like "Top", "Bottoms", "Outerwear", etc.',
                    },
                    boundingBox: {
                        type: Type.OBJECT,
                        properties: {
                            x: {
                                type: Type.NUMBER,
                                description:
                                    'Top-left X coordinate normalized 0-1',
                            },
                            y: {
                                type: Type.NUMBER,
                                description:
                                    'Top-left Y coordinate normalized 0-1',
                            },
                            width: {
                                type: Type.NUMBER,
                                description: 'Width normalized 0-1',
                            },
                            height: {
                                type: Type.NUMBER,
                                description: 'Height normalized 0-1',
                            },
                        },
                        required: ['x', 'y', 'width', 'height'],
                    },
                },
                required: ['itemName', 'category', 'boundingBox'],
            },
        },
    },
    required: ['hasMultipleItems', 'items'],
};

const outfitSuggestionsSchema = {
    type: Type.ARRAY,
    items: {
        type: Type.OBJECT,
        properties: {
            outfitName: {
                type: Type.STRING,
                description:
                    "A creative and appealing name for the outfit (e.g., 'Weekend Wanderer', 'City Sleek').",
            },
            description: {
                type: Type.STRING,
                description:
                    "A short, compelling description of the outfit's style and why the items work well together.",
            },
            itemNames: {
                type: Type.ARRAY,
                items: {
                    type: Type.STRING,
                },
                description:
                    "An array of the exact 'name' properties from the provided clothing items that make up this complete outfit.",
            },
        },
        required: ['outfitName', 'description', 'itemNames'],
    },
};

const singleOutfitSchema = {
    type: Type.OBJECT,
    properties: {
        outfitName: {
            type: Type.STRING,
            description:
                "A creative and appealing name for the outfit (e.g., 'Effortless Daily Chic', 'Ready for Anything').",
        },
        description: {
            type: Type.STRING,
            description:
                "A short, compelling description of the outfit's style and suitability for a typical day.",
        },
        itemNames: {
            type: Type.ARRAY,
            items: {
                type: Type.STRING,
            },
            description:
                "An array of the exact 'name' properties from the provided clothing items that make up this complete outfit.",
        },
    },
    required: ['outfitName', 'description', 'itemNames'],
};

const fashionTrendsSchema = {
    type: Type.ARRAY,
    description: 'A list of current fashion trends.',
    items: {
        type: Type.OBJECT,
        properties: {
            trendName: {
                type: Type.STRING,
                description: 'The name of the fashion trend.',
            },
            description: {
                type: Type.STRING,
                description: 'A brief description of the trend.',
            },
            outfits: {
                type: Type.ARRAY,
                description:
                    "A list of outfits that fit this trend, created from the user's wardrobe.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        outfitName: {
                            type: Type.STRING,
                            description: 'A creative name for the outfit.',
                        },
                        description: {
                            type: Type.STRING,
                            description:
                                'A short description of why this outfit fits the trend.',
                        },
                        itemNames: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description:
                                'An array of exact item names from the provided list.',
                        },
                    },
                    required: ['outfitName', 'description', 'itemNames'],
                },
            },
        },
        required: ['trendName', 'description', 'outfits'],
    },
};

const styleEvolutionSchema = {
    type: Type.OBJECT,
    properties: {
        coreStyleProfile: {
            type: Type.OBJECT,
            properties: {
                keywords: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                        "List of 3-5 keywords describing the user's core style.",
                },
                topColors: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                        'List of the 3-4 most frequent colors in their favorited outfits.',
                },
                topCategories: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                        'List of the 3-4 most frequent clothing categories in their favorited outfits.',
                },
            },
            required: ['keywords', 'topColors', 'topCategories'],
        },
        styleEvolutionNarrative: {
            type: Type.STRING,
            description:
                "A narrative paragraph (2-3 sentences) describing the user's style evolution over time based on their favorited outfits and their timestamps.",
        },
        recommendations: {
            type: Type.ARRAY,
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'A catchy title for the recommendation.',
                    },
                    suggestion: {
                        type: Type.STRING,
                        description:
                            'A detailed, actionable suggestion for the user to refine their style.',
                    },
                },
                required: ['title', 'suggestion'],
            },
            description: 'An array of exactly three concrete recommendations.',
        },
    },
    required: [
        'coreStyleProfile',
        'styleEvolutionNarrative',
        'recommendations',
    ],
};

const budgetSuggestionsSchema = {
    type: Type.ARRAY,
    description:
        "A list of budget-friendly item suggestions to enhance the user's wardrobe.",
    items: {
        type: Type.OBJECT,
        properties: {
            itemName: {
                type: Type.STRING,
                description:
                    "A clear and common name for the suggested item (e.g., 'Beige Linen Blazer').",
            },
            itemType: {
                type: Type.STRING,
                description:
                    "The category of the item (e.g., 'Outerwear', 'Accessory').",
            },
            description: {
                type: Type.STRING,
                description:
                    'Why this item is a smart, versatile purchase for their specific wardrobe.',
            },
            estimatedPriceRange: {
                type: Type.STRING,
                description:
                    "A typical, affordable price range (e.g., '$50 - $90').",
            },
            pairingSuggestions: {
                type: Type.ARRAY,
                description:
                    'Exactly two distinct outfit ideas pairing the new item with existing ones.',
                items: {
                    type: Type.OBJECT,
                    properties: {
                        outfitName: {
                            type: Type.STRING,
                            description:
                                'A creative name for the outfit combination.',
                        },
                        existingItemNames: {
                            type: Type.ARRAY,
                            items: { type: Type.STRING },
                            description:
                                "An array of exact item names from the user's provided wardrobe list.",
                        },
                    },
                    required: ['outfitName', 'existingItemNames'],
                },
            },
        },
        required: [
            'itemName',
            'itemType',
            'description',
            'estimatedPriceRange',
            'pairingSuggestions',
        ],
    },
};

const colorAnalysisSchema = {
    type: Type.OBJECT,
    properties: {
        baseItemColor: {
            type: Type.STRING,
            description:
                'The primary color of the base item that was analyzed.',
        },
        colorTheoryExplanation: {
            type: Type.STRING,
            description:
                "A concise explanation (2-3 sentences) of color theory principles relevant to the base item's color, such as complementary, analogous, or triadic color schemes that would work well.",
        },
        suggestedOutfits: {
            type: Type.ARRAY,
            description:
                'An array of 3-4 distinct outfit suggestions based on color coordination.',
            items: {
                type: Type.OBJECT,
                properties: {
                    outfitName: {
                        type: Type.STRING,
                        description:
                            "A creative name for the outfit that hints at its color scheme (e.g., 'Sunset Glow', 'Ocean Breeze').",
                    },
                    colorJustification: {
                        type: Type.STRING,
                        description:
                            'A short sentence explaining why the color combination of this specific outfit is harmonious, referencing a color theory principle if applicable.',
                    },
                    itemNames: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description:
                            "An array of exact item names from the provided wardrobe list, which must include the base item's name.",
                    },
                },
                required: ['outfitName', 'colorJustification', 'itemNames'],
            },
        },
    },
    required: ['baseItemColor', 'colorTheoryExplanation', 'suggestedOutfits'],
};

const sustainabilityInsightsSchema = {
    type: Type.OBJECT,
    properties: {
        sustainabilityScore: {
            type: Type.INTEGER,
            description:
                'An overall sustainability score for the wardrobe, from 0 to 100.',
        },
        scoreJustification: {
            type: Type.STRING,
            description:
                "A brief (2-3 sentences) explanation for the score, considering material types (inferred from names like 'cotton', 'leather'), color palette diversity, and item versatility.",
        },
        suggestedOutfits: {
            type: Type.ARRAY,
            description:
                "An array of 3-4 eco-friendly outfits created from the user's existing items.",
            items: {
                type: Type.OBJECT,
                properties: {
                    outfitName: {
                        type: Type.STRING,
                        description:
                            'A creative name for the sustainable outfit.',
                    },
                    ecoJustification: {
                        type: Type.STRING,
                        description:
                            "A short sentence explaining why this outfit is a sustainable choice (e.g., 'This monochromatic look maximizes versatility...').",
                    },
                    itemNames: {
                        type: Type.ARRAY,
                        items: { type: Type.STRING },
                        description:
                            'An array of exact item names from the provided wardrobe list.',
                    },
                },
                required: ['outfitName', 'ecoJustification', 'itemNames'],
            },
        },
        actionableTips: {
            type: Type.ARRAY,
            description:
                'An array of exactly 3 personalized, actionable tips for improving wardrobe sustainability.',
            items: {
                type: Type.OBJECT,
                properties: {
                    title: {
                        type: Type.STRING,
                        description: 'A catchy title for the tip.',
                    },
                    description: {
                        type: Type.STRING,
                        description:
                            'A concise, helpful description of the sustainability tip.',
                    },
                },
                required: ['title', 'description'],
            },
        },
    },
    required: [
        'sustainabilityScore',
        'scoreJustification',
        'suggestedOutfits',
        'actionableTips',
    ],
};

const tripPlanSchema = {
    type: Type.OBJECT,
    properties: {
        packingList: {
            type: Type.ARRAY,
            description:
                'A comprehensive list of the exact names of all clothing items the user should pack for the trip. Should be a flat array of strings.',
            items: { type: Type.STRING },
        },
        dailyPlans: {
            type: Type.ARRAY,
            description:
                'A day-by-day plan for the trip, with outfit suggestions for each day.',
            items: {
                type: Type.OBJECT,
                properties: {
                    day: {
                        type: Type.INTEGER,
                        description:
                            'The day number of the trip (e.g., 1, 2, 3).',
                    },
                    title: {
                        type: Type.STRING,
                        description:
                            "A catchy title for the day's activities (e.g., 'Arrival & Coastal Walk').",
                    },
                    description: {
                        type: Type.STRING,
                        description:
                            'A brief description of the planned activities or weather consideration for the day.',
                    },
                    outfits: {
                        type: Type.ARRAY,
                        description:
                            'A list of one or more outfits for this day.',
                        items: {
                            type: Type.OBJECT,
                            properties: {
                                outfitName: {
                                    type: Type.STRING,
                                    description:
                                        "A creative name for the outfit (e.g., 'Beachcomber Style', 'Evening Elegance').",
                                },
                                description: {
                                    type: Type.STRING,
                                    description:
                                        'A brief note on why this outfit is suitable.',
                                },
                                itemNames: {
                                    type: Type.ARRAY,
                                    description:
                                        'An array of exact item names from the provided wardrobe list that make up this outfit.',
                                    items: { type: Type.STRING },
                                },
                            },
                            required: [
                                'outfitName',
                                'description',
                                'itemNames',
                            ],
                        },
                    },
                },
                required: ['day', 'title', 'description', 'outfits'],
            },
        },
    },
    required: ['packingList', 'dailyPlans'],
};

const styleSanctuarySchema = {
    type: Type.OBJECT,
    properties: {
        dailyAffirmation: {
            type: Type.STRING,
            description:
                'An uplifting and short affirmation (1-2 sentences) about personal style, confidence, or self-expression.',
        },
        guidedExercise: {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description:
                        "A catchy title for a guided exercise, like 'The Five-Minute Style Meditation' or 'Confidence Closet Challenge'.",
                },
                description: {
                    type: Type.STRING,
                    description:
                        "A brief (2-3 sentences) explanation of the exercise's purpose and benefits.",
                },
                steps: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description:
                        'An array of 3-5 simple, actionable steps for the user to follow.',
                },
            },
            required: ['title', 'description', 'steps'],
        },
        styleArticle: {
            type: Type.OBJECT,
            properties: {
                title: {
                    type: Type.STRING,
                    description:
                        "An engaging title for a short article on style or self-care, like 'Dressing for Your Energy' or 'The Joy of a Signature Scent'.",
                },
                content: {
                    type: Type.STRING,
                    description:
                        'A few paragraphs of helpful, inspiring content (around 150-200 words) on topics like building confidence, positive body image, or creative self-expression through fashion and grooming.',
                },
            },
            required: ['title', 'content'],
        },
    },
    required: ['dailyAffirmation', 'guidedExercise', 'styleArticle'],
};

export const analyzeClothingItem = async (
    base64Image: string,
    mimeType: string
): Promise<
    Omit<ClothingItem, 'id' | 'imageUrl' | 'dateAdded' | 'useCount' | 'status'>
> => {
    return withServiceWrapper(
        async () => {
            return withRetry(
                async () => {
                    const response = await generateGeminiContent({
                        model: config.gemini.defaultModel,
                        contents: {
                            parts: [
                                {
                                    inlineData: {
                                        data: base64Image,
                                        mimeType: mimeType,
                                    },
                                },
                                {
                                    text: 'Analyze this image of a clothing item. Extract its name, category, color, style, and the most suitable season. Ensure the name is specific.',
                                },
                            ],
                        },
                        config: {
                            responseMimeType: 'application/json',
                            responseSchema: clothingItemSchema,
                        },
                    });

                    const jsonString = response.text.trim();
                    return JSON.parse(jsonString);
                },
                {
                    maxRetries: 2,
                    initialDelay: 1000,
                    retryableErrors: ['NetworkError', 'Failed to fetch', 'TIMEOUT'],
                }
            );
        },
        {
            service: 'gemini',
            operation: 'analyzeClothingItem',
            severity: 'high',
            context: { mimeType },
        }
    );
};

export const detectOutfitItems = async (
    base64Image: string,
    mimeType: string
): Promise<{
    hasMultipleItems: boolean;
    items: Array<{
        itemName: string;
        category: string;
        boundingBox: {
            x: number;
            y: number;
            width: number;
            height: number;
        };
    }>;
}> => {
    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.0-flash-exp',
            contents: {
                parts: [
                    {
                        inlineData: {
                            data: base64Image,
                            mimeType: mimeType,
                        },
                    },
                    {
                        text: `Analyze this image and determine if it contains multiple separate, clearly distinguishable clothing items (e.g., a top and a skirt laid out separately, a shirt and pants side by side, etc.).

IMPORTANT:
- Only return hasMultipleItems: true if there are 2 or more items that are clearly separated and can be individually cropped
- Each item should have distinct boundaries and not overlap significantly
- If items are worn together on a person or overlapping, return hasMultipleItems: false
- Provide tight bounding boxes that capture each individual item accurately

For each detected item, provide:
- A brief descriptive name
- The category (Top, Bottoms, Outerwear, Footwear, Accessory)
- Precise bounding box coordinates (normalized 0-1) that tightly frame just that item`,
                    },
                ],
            },
            config: {
                responseMimeType: 'application/json',
                responseSchema: outfitItemsDetectionSchema,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error detecting outfit items:', error);
        // Return safe default on error
        return {
            hasMultipleItems: false,
            items: [],
        };
    }
};

export const generateOutfits = async (
    items: ClothingItem[],
    stylePreference: string,
    customPrompt: string,
    previousSuggestions?: Outfit[]
): Promise<Outfit[]> => {
    if (items.length < 2) {
        throw new Error(
            'Not enough items to generate outfits. Please add at least two items.'
        );
    }

    const availableItems = items.map(
        ({ name, category, color, style, season }) => ({
            name,
            category,
            color,
            style,
            season,
        })
    );

    const userInstructions = customPrompt
        ? `Create 4 stylish and distinct outfit combinations with a '${stylePreference}' aesthetic, keeping in mind the user's special request: "${customPrompt}".`
        : `Create 4 stylish and distinct outfit combinations with a '${stylePreference}' aesthetic.`;

    let feedbackPrompt = '';
    if (previousSuggestions && previousSuggestions.some((s) => s.feedback)) {
        const likedOutfits = previousSuggestions
            .filter((s) => s.feedback === 'liked')
            .map((o) => ({
                outfitName: o.outfitName,
                items: o.items.map((i) => i.name),
            }));

        const dislikedOutfits = previousSuggestions
            .filter((s) => s.feedback === 'disliked')
            .map((o) => ({
                outfitName: o.outfitName,
                items: o.items.map((i) => i.name),
            }));

        let feedbackContext = [];
        if (likedOutfits.length > 0) {
            feedbackContext.push(
                `The user LIKED these outfits, so create similar styles: ${JSON.stringify(
                    likedOutfits
                )}`
            );
        }
        if (dislikedOutfits.length > 0) {
            feedbackContext.push(
                `The user DISLIKED these outfits, so AVOID creating similar combinations: ${JSON.stringify(
                    dislikedOutfits
                )}`
            );
        }

        if (feedbackContext.length > 0) {
            feedbackPrompt = `\nTo improve the results, consider the user's feedback on previous suggestions. ${feedbackContext.join(
                '. '
            )}`;
        }
    }

    const prompt = `
      Based on the following list of available (clean and ready-to-wear) clothing items, ${userInstructions}
      - For each outfit, provide a creative name, a brief description, and a list of the exact item names used.
      - Ensure each outfit is a logical combination (e.g., includes a top and a bottom).
      - Do not use the same item in more than two different outfits.
      - Only use items from the provided list.
      ${feedbackPrompt}

      Available Items:
      ${JSON.stringify(availableItems, null, 2)}
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: outfitSuggestionsSchema,
                temperature: 0.8,
            },
        });

        const jsonString = response.text.trim();
        const rawOutfits = JSON.parse(jsonString);

        // Map itemNames to full ClothingItem objects
        return rawOutfits.map((outfit: any, index: number) => ({
            id: `outfit-${Date.now()}-${index}`,
            outfitName: outfit.outfitName,
            description: outfit.description,
            items: mapItemNamesToItems(outfit.itemNames, items),
        }));
    } catch (error) {
        console.error('Error generating outfits:', error);
        throw new Error('Failed to generate outfits with Gemini API.');
    }
};

export const getFashionTrendsAndOutfits = async (
    items: ClothingItem[]
): Promise<
    Array<{
        trendName: string;
        description: string;
        outfits: Outfit[];
    }>
> => {
    if (items.length < 3) {
        throw new Error(
            'Not enough items to analyze trends. Please add at least three items.'
        );
    }

    const availableItems = items.map(
        ({ name, category, color, style, season }) => ({
            name,
            category,
            color,
            style,
            season,
        })
    );

    const prompt = `
      Act as a fashion expert and trend analyst. Based on the following list of available (clean and ready-to-wear) clothing items, your task is to:
      1. Identify three current, popular fashion trends.
      2. For each trend, provide a concise name and a one or two-sentence description.
      3. For each trend, create one or two distinct outfits using ONLY items from the provided list that exemplify the trend's aesthetic.
      4. For each outfit, provide a creative name, a brief description of how it fits the trend, and the exact names of the items used.
      5. Ensure the outfits are complete and logical combinations.

      Available Items:
      ${JSON.stringify(availableItems, null, 2)}
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: fashionTrendsSchema,
                temperature: 0.7,
            },
        });

        const jsonString = response.text.trim();
        const rawTrends = JSON.parse(jsonString);

        // Map itemNames to full ClothingItem objects for each trend's outfits
        return rawTrends.map((trend: any) => ({
            trendName: trend.trendName,
            description: trend.description,
            outfits: trend.outfits.map((outfit: any, idx: number) => ({
                id: `trend-${trend.trendName}-${idx}-${Date.now()}`,
                outfitName: outfit.outfitName,
                description: outfit.description,
                items: mapItemNamesToItems(outfit.itemNames, items),
            })),
        }));
    } catch (error) {
        console.error('Error fetching fashion trends:', error);
        throw new Error('Failed to fetch fashion trends with Gemini API.');
    }
};

export const analyzeStyleEvolution = async (
    wardrobeItems: ClothingItem[],
    favoriteOutfits: Outfit[]
): Promise<StyleAnalysis> => {
    const wardrobeForAnalysis = wardrobeItems.map(
        ({ name, category, color, style }) => ({ name, category, color, style })
    );
    const favoritesForAnalysis = favoriteOutfits.map((outfit) => ({
        outfitName: outfit.outfitName,
        dateFavorited: outfit.dateFavorited,
        items: outfit.items.map((item) => ({
            name: item.name,
            category: item.category,
            color: item.color,
            style: item.style,
        })),
    }));

    const prompt = `
      You are a highly perceptive AI fashion stylist. Your task is to analyze a user's wardrobe and their favorited outfits to understand their personal style evolution.
      Based on the provided JSON data, generate a comprehensive analysis.

      User's Wardrobe:
      ${JSON.stringify(wardrobeForAnalysis, null, 2)}

      User's Favorited Outfits (with UNIX timestamps for when they were favorited):
      ${JSON.stringify(favoritesForAnalysis, null, 2)}

      Your analysis must strictly follow the provided JSON schema. It should include:
      1.  **coreStyleProfile:** A summary of the user's dominant style. Include an array of 3-5 style keywords, an array of their 3-4 most-used colors, and an array of their 3-4 most-used clothing categories based on their favorited outfits.
      2.  **styleEvolutionNarrative:** A short, insightful paragraph (2-3 sentences) describing how their style has developed over time. Look for shifts in style, color palettes, or item types based on the 'dateFavorited' timestamps. If there's no clear evolution, describe their consistent core style.
      3.  **recommendations:** Provide exactly three concrete recommendations to help them refine their style. Each recommendation should have a 'title' and a 'suggestion' text. These could be about trying new item combinations, suggesting a new type of item to acquire, or a new style to explore.
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: styleEvolutionSchema,
                temperature: 0.6,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error analyzing style evolution:', error);
        throw new Error('Failed to analyze style evolution with Gemini API.');
    }
};

export const getBudgetFriendlySuggestions = async (
    items: ClothingItem[]
): Promise<BudgetSuggestion[]> => {
    if (items.length < 3) {
        throw new Error(
            'Not enough items for budget analysis. Please add at least three items.'
        );
    }

    const wardrobeForAnalysis = items.map(
        ({ name, category, color, style }) => ({ name, category, color, style })
    );

    const prompt = `
        You are a savvy, budget-conscious fashion stylist. Your goal is to help the user expand their wardrobe with high-impact, affordable items.
        Based on the user's current available (clean) wardrobe provided below, identify 4 key, versatile, and budget-friendly items they could purchase to maximize their outfit options.

        For each suggested item, you must provide:
        1.  **itemName**: A clear and common name for the item (e.g., "Beige Linen Blazer", "Classic Leather Belt").
        2.  **itemType**: The category of the item (e.g., "Outerwear", "Accessory").
        3.  **description**: A brief explanation of why this item is a smart, versatile purchase for their specific wardrobe.
        4.  **estimatedPriceRange**: A typical, affordable price range for a good quality version of this item (e.g., "$50 - $90").
        5.  **pairingSuggestions**: Create exactly two distinct outfit ideas. For each outfit idea, provide an 'outfitName' and a list of 'existingItemNames' from the user's wardrobe that would pair perfectly with the new item. Only use item names from the provided wardrobe list.

        User's Available (Clean) Wardrobe:
        ${JSON.stringify(wardrobeForAnalysis, null, 2)}

        Your response must be a JSON array that strictly adheres to the provided schema.
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: budgetSuggestionsSchema,
                temperature: 0.6,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error fetching budget suggestions:', error);
        throw new Error(
            'Failed to fetch budget-friendly suggestions with Gemini API.'
        );
    }
};

export const getColorCoordinatedOutfits = async (
    baseItem: ClothingItem,
    allItems: ClothingItem[]
): Promise<ColorAnalysis> => {
    if (allItems.length < 2) {
        throw new Error(
            'Not enough items for color analysis. Please have at least two items in your wardrobe.'
        );
    }

    const baseItemForAnalysis = {
        name: baseItem.name,
        category: baseItem.category,
        color: baseItem.color,
    };
    const otherItemsForAnalysis = allItems
        .filter((item) => item.id !== baseItem.id)
        .map(({ name, category, color }) => ({ name, category, color }));

    const prompt = `
        You are an expert fashion stylist with a deep understanding of color theory.
        Your task is to analyze a base clothing item and suggest color-coordinated outfits using other available (clean) items from the user's wardrobe.

        Base Item:
        ${JSON.stringify(baseItemForAnalysis, null, 2)}

        Available (Clean) Wardrobe Items (excluding the base item):
        ${JSON.stringify(otherItemsForAnalysis, null, 2)}

        Based on this information, please provide the following in a JSON format that strictly adheres to the schema:
        1.  **baseItemColor**: Identify the primary color of the base item.
        2.  **colorTheoryExplanation**: Write a brief, helpful explanation of color palettes (like complementary, analogous, monochromatic) that would work well with the base item's color.
        3.  **suggestedOutfits**: Create 3-4 distinct outfits. Each outfit must:
            - Include the base item.
            - Use items ONLY from the provided wardrobe list.
            - Have a creative 'outfitName'.
            - Include a 'colorJustification' explaining why the color combination works.
            - List the exact 'itemNames' used.

        Focus on creating visually harmonious and stylish combinations based on sound color principles.
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: colorAnalysisSchema,
                temperature: 0.7,
            },
        });

        const jsonString = response.text.trim();
        const rawAnalysis = JSON.parse(jsonString);

        // Map itemNames to full ClothingItem objects
        return {
            baseItemColor: rawAnalysis.baseItemColor,
            colorTheoryExplanation: rawAnalysis.colorTheoryExplanation,
            suggestedOutfits: rawAnalysis.suggestedOutfits.map(
                (outfit: any, idx: number) => ({
                    id: `color-${baseItem.id}-${idx}-${Date.now()}`,
                    outfitName: outfit.outfitName,
                    description: outfit.colorJustification,
                    items: mapItemNamesToItems(outfit.itemNames, allItems),
                })
            ),
        };
    } catch (error) {
        console.error('Error fetching color coordinated outfits:', error);
        throw new Error(
            'Failed to fetch color coordinated outfits with Gemini API.'
        );
    }
};

export const getSustainabilityInsights = async (
    allItems: ClothingItem[],
    cleanItems: ClothingItem[]
): Promise<SustainabilityInsights> => {
    if (allItems.length < 5) {
        throw new Error(
            'Not enough items for sustainability analysis. Please add at least five items.'
        );
    }

    const fullWardrobeForAnalysis = allItems.map(
        ({ name, category, color, style }) => ({ name, category, color, style })
    );
    const cleanWardrobeForOutfits = cleanItems.map(
        ({ name, category, color, style }) => ({ name, category, color, style })
    );

    const prompt = `
        You are a sustainable fashion expert. Analyze the user's entire wardrobe to provide sustainability insights, but create outfit suggestions only from their clean clothes.
        Your analysis should infer material types from item names (e.g., 'Cotton T-Shirt' implies natural fibers, 'Polyester Jacket' implies synthetics).

        Based on the provided wardrobe, generate a response that strictly follows the JSON schema:
        1.  **sustainabilityScore**: An integer from 0 to 100 based on the *entire* wardrobe. A higher score means more sustainable. Base this on:
            -   **Material Mix**: Higher scores for wardrobes with more inferred natural fibers (cotton, linen, wool, leather). Lower scores for more synthetics (polyester, nylon).
            -   **Color Palette**: Higher scores for more versatile, cohesive color palettes (e.g., mostly neutrals) that allow for more mix-and-match, reducing the need for new items.
            -   **Versatility**: Higher scores for a good mix of basics and statement pieces.
        2.  **scoreJustification**: A brief, 2-3 sentence explanation of the score, referencing the entire wardrobe.
        3.  **suggestedOutfits**: Create 3-4 eco-friendly outfits using ONLY items from the user's *clean* clothes list. For each, provide:
            -   'outfitName': A creative, eco-themed name.
            -   'ecoJustification': A short sentence explaining why it's a sustainable choice (e.g., highlights versatility, uses natural fibers).
            -   'itemNames': An array of exact item names used from the clean list.
        4.  **actionableTips**: Provide exactly 3 personalized, actionable tips to help the user make their wardrobe more sustainable.

        User's Entire Wardrobe (for scoring):
        ${JSON.stringify(fullWardrobeForAnalysis, null, 2)}

        User's Clean & Available Wardrobe (for outfit suggestions):
        ${JSON.stringify(cleanWardrobeForOutfits, null, 2)}
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: sustainabilityInsightsSchema,
                temperature: 0.5,
            },
        });

        const jsonString = response.text.trim();
        const rawInsights = JSON.parse(jsonString);

        // Map itemNames to full ClothingItem objects
        return {
            sustainabilityScore: rawInsights.sustainabilityScore,
            scoreJustification: rawInsights.scoreJustification,
            suggestedOutfits: rawInsights.suggestedOutfits.map(
                (outfit: any, idx: number) => ({
                    id: `sustainability-${idx}-${Date.now()}`,
                    outfitName: outfit.outfitName,
                    description: outfit.ecoJustification,
                    items: mapItemNamesToItems(outfit.itemNames, cleanItems),
                })
            ),
            actionableTips: rawInsights.actionableTips,
        };
    } catch (error) {
        console.error('Error fetching sustainability insights:', error);
        throw new Error(
            'Failed to fetch sustainability insights with Gemini API.'
        );
    }
};

export const generateTripPlan = async (
    items: ClothingItem[],
    tripDetails: {
        destination: string;
        startDate: string;
        endDate: string;
        notes: string;
    }
): Promise<TripPlan> => {
    if (items.length < 5) {
        throw new Error(
            'Not enough items for trip planning. Please add at least five items to your wardrobe.'
        );
    }

    const wardrobeForAnalysis = items.map(
        ({ name, category, color, style }) => ({ name, category, color, style })
    );

    const prompt = `
        You are an expert travel stylist. Your task is to create a detailed and efficient trip plan for a user based on their available (clean) wardrobe and trip details.
        The goal is to help them pack light by reusing items in different outfits.

        Trip Details:
        - Destination: ${tripDetails.destination}
        - Dates: ${tripDetails.startDate} to ${tripDetails.endDate}
        - Notes on Activities/Vibe: ${tripDetails.notes}

        User's Available (Clean) Wardrobe:
        ${JSON.stringify(wardrobeForAnalysis, null, 2)}

        Based on this, generate a response that strictly adheres to the provided JSON schema. Your response must include:
        1.  **packingList**: A comprehensive list of the exact names of ALL clothing items to pack. Every item used in the daily plans must be in this list.
        2.  **dailyPlans**: A day-by-day itinerary. For each day:
            - Provide a 'title' and 'description' based on the trip details. Infer the weather and type of activities from the destination and notes.
            - Create one or two suitable 'outfits' for the day using ONLY items from the user's wardrobe.
            - For each outfit, provide a creative 'outfitName', a 'description' of its suitability, and the exact 'itemNames' used.
            - Maximize versatility. Try to reuse items like pants, jackets, and shoes across multiple days.
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: tripPlanSchema,
                temperature: 0.6,
            },
        });

        const jsonString = response.text.trim();
        const rawPlan = JSON.parse(jsonString);

        // Map itemNames to full ClothingItem objects in dailyPlans
        return {
            packingList: rawPlan.packingList,
            dailyPlans: rawPlan.dailyPlans.map((plan: any) => ({
                day: plan.day,
                title: plan.title,
                description: plan.description,
                outfits: plan.outfits.map((outfit: any, idx: number) => ({
                    id: `trip-day${plan.day}-${idx}-${Date.now()}`,
                    outfitName: outfit.outfitName,
                    description: outfit.description,
                    items: mapItemNamesToItems(outfit.itemNames, items),
                })),
            })),
        };
    } catch (error) {
        console.error('Error generating trip plan:', error);
        throw new Error('Failed to generate trip plan with Gemini API.');
    }
};

const dataUrlToPart = (dataUrl: string) => {
    const [header, data] = dataUrl.split(',');
    const mimeType = header.match(/:(.*?);/)?.[1] || 'image/jpeg';
    return {
        inlineData: {
            data,
            mimeType,
        },
    };
};

export const visualizeOutfit = async (
    userImage: { base64Image: string; mimeType: string },
    outfit: Outfit,
    stylingNotes?: string
): Promise<string> => {
    try {
        const userPhotoPart = {
            inlineData: {
                data: userImage.base64Image,
                mimeType: userImage.mimeType,
            },
        };

        const clothingParts = outfit.items.map((item) =>
            dataUrlToPart(item.imageUrl)
        );

        const basePrompt = `You are a virtual stylist. Your task is to realistically dress the person in the first image with the clothing items provided in the subsequent images. The outfit consists of ${outfit.items
            .map((i) => i.name)
            .join(
                ', '
            )}. Preserve the person's pose, body shape, and the original background as much as possible. The final image should be a photorealistic depiction of the person wearing the new outfit.`;

        const promptText =
            typeof stylingNotes === 'string' && stylingNotes.trim().length > 0
                ? `${basePrompt}

USER STYLING INSTRUCTIONS (you MUST follow these exactly, and if they ever conflict with other guidance you must prioritize these instructions first):
${stylingNotes.trim()}`
                : basePrompt;

        const textPart = { text: promptText };

        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [userPhotoPart, ...clothingParts, textPart],
            },
            config: {
                responseModalities: ['IMAGE', 'TEXT'],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (
                part.inlineData &&
                part.inlineData.mimeType.startsWith('image/')
            ) {
                return part.inlineData.data; // This is the base64 string
            }
        }

        throw new Error('No image was generated in the response.');
    } catch (error) {
        console.error('Error visualizing outfit:', error);
        throw new Error('Failed to visualize outfit with Gemini API.');
    }
};

export const getOutfitOfTheDay = async (
    items: ClothingItem[]
): Promise<Outfit> => {
    if (items.length < 3) {
        throw new Error(
            'Not enough items to generate an outfit. Please add at least three items.'
        );
    }

    const availableItems = items.map(
        ({ name, category, color, style, season }) => ({
            name,
            category,
            color,
            style,
            season,
        })
    );

    const prompt = `
      Based on the following list of available (clean) clothing items, create a single, stylish, and versatile outfit suitable for a typical day.
      - Provide a creative name, a brief description, and a list of the exact item names used.
      - Ensure the outfit is a logical and complete combination.
      - Prioritize items that work well together to create a cohesive look.

      Available Items:
      ${JSON.stringify(availableItems, null, 2)}
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: singleOutfitSchema,
                temperature: 0.8,
            },
        });

        const jsonString = response.text.trim();
        const rawOutfit = JSON.parse(jsonString);

        // Map itemNames to full ClothingItem objects
        return {
            id: `outfit-of-day-${Date.now()}`,
            outfitName: rawOutfit.outfitName,
            description: rawOutfit.description,
            items: mapItemNamesToItems(rawOutfit.itemNames, items),
        };
    } catch (error) {
        console.error('Error generating outfit of the day:', error);
        throw new Error(
            'Failed to generate outfit of the day with Gemini API.'
        );
    }
};

export const getStyleGuidance = async (
    items: ClothingItem[]
): Promise<StyleSanctuaryContent> => {
    const wardrobeForAnalysis = items.map(
        ({ name, category, color, style }) => ({ name, category, color, style })
    );
    const styleProfileSummary =
        items.length > 0
            ? `The user's wardrobe includes styles like ${[
                  ...new Set(items.map((i) => i.style)),
              ].join(', ')} and features colors like ${[
                  ...new Set(items.map((i) => i.color)),
              ].join(', ')}.`
            : 'The user has not added any items to their wardrobe yet.';

    const prompt = `
        You are an empathetic and inspiring AI style and wellness coach. Your goal is to help users build confidence, promote a positive body image, and cultivate individual expression through fashion and grooming.

        Generate a set of personalized guidance for the user. ${styleProfileSummary}

        Your response must be encouraging, inclusive, and focus on self-care and personal growth. Avoid restrictive language or focusing on "fixing" flaws.

        Please provide the following content in a JSON format that strictly adheres to the schema:
        1.  **dailyAffirmation**: A short, powerful affirmation for the user to start their day with.
        2.  **guidedExercise**: A simple, mindful exercise related to style or grooming. It should be easy to do in a few minutes.
        3.  **styleArticle**: A short, insightful article providing tips or reflections on personal style, confidence, or self-care.
    `;

    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: 'application/json',
                responseSchema: styleSanctuarySchema,
                temperature: 0.8,
            },
        });

        const jsonString = response.text.trim();
        return JSON.parse(jsonString);
    } catch (error) {
        console.error('Error generating style guidance:', error);
        throw new Error('Failed to generate style guidance with Gemini API.');
    }
};

/**
 * Generate a style playground prompt based on user query and customizations
 */
export const generateStylePlaygroundPrompt = async (
    queryText: string,
    customizations?: {
        styleFusion?: string[];
        colorPalette?: string[];
        occasion?: string;
        intensity?: number;
    }
): Promise<string> => {
    try {
        let prompt = `Generate a detailed fashion visualization prompt based on this query: "${queryText}"`;

        if (customizations) {
            if (
                customizations.styleFusion &&
                customizations.styleFusion.length > 0
            ) {
                prompt += `\n\nFuse these styles together: ${customizations.styleFusion.join(
                    ', '
                )}`;
            }
            if (
                customizations.colorPalette &&
                customizations.colorPalette.length > 0
            ) {
                prompt += `\n\nUse this color palette: ${customizations.colorPalette.join(
                    ', '
                )}`;
            }
            if (customizations.occasion) {
                prompt += `\n\nOccasion: ${customizations.occasion}`;
            }
            if (customizations.intensity !== undefined) {
                prompt += `\n\nStyle intensity (0-100): ${customizations.intensity}`;
            }
        }

        prompt += `\n\nCreate a detailed prompt for an AI image generator that will visualize this outfit concept. Include:
- Overall aesthetic and vibe
- Specific clothing items and their details
- Color combinations
- Textures and materials
- Styling details (accessories, layering, etc.)
- Model pose and setting

Return ONLY the image generation prompt, nothing else.`;

        const response = await generateGeminiContent({
            model: config.gemini.defaultModel || 'gemini-2.5-flash',
            contents: prompt,
            config: {
                temperature: 0.9,
            },
        });

        return response.text.trim();
    } catch (error) {
        console.error('Error generating style playground prompt:', error);
        throw new Error(
            'Failed to generate style playground prompt with Gemini API.'
        );
    }
};

/**
 * Generate a style playground image using Gemini's image generation
 */
export const generateStylePlaygroundImage = async (
    aiPrompt: string
): Promise<Blob> => {
    try {
        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: aiPrompt }],
            },
            config: {
                responseModalities: ['IMAGE', 'TEXT'],
            },
        });

        // Extract image data from response
        for (const part of response.candidates[0].content.parts) {
            if (
                part.inlineData &&
                part.inlineData.mimeType.startsWith('image/')
            ) {
                // Convert base64 to Blob
                const base64Data = part.inlineData.data;
                const mimeType = part.inlineData.mimeType;
                const byteCharacters = atob(base64Data);
                const byteNumbers = new Array(byteCharacters.length);

                for (let i = 0; i < byteCharacters.length; i++) {
                    byteNumbers[i] = byteCharacters.charCodeAt(i);
                }

                const byteArray = new Uint8Array(byteNumbers);
                return new Blob([byteArray], { type: mimeType });
            }
        }

        throw new Error('No image was generated in the response.');
    } catch (error) {
        console.error('Error generating style playground image:', error);
        throw new Error(
            'Failed to generate style playground image with Gemini API.'
        );
    }
};

/**
 * Generate mannequin visualization with custom body measurements
 */
export const generateMannequinVisualization = async (
    mannequinSettings: {
        body_type: 'slim' | 'average' | 'athletic' | 'plus-size';
        height_cm: number;
        chest_cm?: number;
        waist_cm?: number;
        hips_cm?: number;
        skin_tone: 'fair' | 'light' | 'medium' | 'tan' | 'brown' | 'dark';
    },
    outfit: Outfit,
    stylingNotes?: string
): Promise<string> => {
    try {
        const bodyTypeDescriptions: Record<string, string> = {
            slim: 'slender, lean physique with minimal curves',
            average: 'balanced, proportionate body type',
            athletic: 'toned, muscular build with defined features',
            'plus-size': 'curvy, fuller figure with soft features',
        };

        const skinToneDescriptions: Record<string, string> = {
            fair: 'very light, pale complexion',
            light: 'light skin tone',
            medium: 'medium skin tone with warm undertones',
            tan: 'tan, sun-kissed complexion',
            brown: 'brown skin tone',
            dark: 'deep, rich dark complexion',
        };

        const measurements = [];
        if (mannequinSettings.chest_cm)
            measurements.push(`Chest: ${mannequinSettings.chest_cm}cm`);
        if (mannequinSettings.waist_cm)
            measurements.push(`Waist: ${mannequinSettings.waist_cm}cm`);
        if (mannequinSettings.hips_cm)
            measurements.push(`Hips: ${mannequinSettings.hips_cm}cm`);

        const basePrompt = `Create a photorealistic 3D mannequin wearing the following outfit:

OUTFIT DETAILS:
${outfit.items
    .map(
        (item) =>
            `- ${item.name} (${item.category}, ${item.color}, ${item.style})`
    )
    .join('\n')}

MANNEQUIN SPECIFICATIONS:
- Body Type: ${bodyTypeDescriptions[mannequinSettings.body_type]}
- Height: ${mannequinSettings.height_cm}cm
- Skin Tone: ${skinToneDescriptions[mannequinSettings.skin_tone]}
${measurements.length > 0 ? `- Measurements: ${measurements.join(', ')}` : ''}

REQUIREMENTS:
- Professional fashion photography style
- Clean white or light gray background
- Soft, even studio lighting from front and sides
- Full-body view, natural standing pose
- Clear visibility of all clothing items
- Photorealistic fabric textures, draping, and fit
- Accurate proportions based on the exact body specifications
- Modern, minimalist aesthetic
- Show how clothes realistically fit the body type
- Natural fabric wrinkles and material behavior

The image should look like a professional fashion catalog photo, showing how the outfit would realistically fit and drape on a person with these exact body specifications and measurements.`;

        const prompt =
            typeof stylingNotes === 'string' && stylingNotes.trim().length > 0
                ? `${basePrompt}

USER STYLING INSTRUCTIONS (you MUST follow these exactly, and if they ever conflict with other guidance you must prioritize these instructions first):
${stylingNotes.trim()}`
                : basePrompt;

        const response = await generateGeminiContent({
            model: 'gemini-2.5-flash-image',
            contents: {
                parts: [{ text: prompt }],
            },
            config: {
                responseModalities: ['IMAGE', 'TEXT'],
            },
        });

        for (const part of response.candidates[0].content.parts) {
            if (
                part.inlineData &&
                part.inlineData.mimeType.startsWith('image/')
            ) {
                return part.inlineData.data; // Return base64 string
            }
        }

        throw new Error('No image was generated in the response.');
    } catch (error) {
        console.error('Error generating mannequin visualization:', error);
        throw new Error(
            'Failed to generate mannequin visualization with Gemini API.'
        );
    }
};

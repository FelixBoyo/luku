import { createSlice, createAsyncThunk } from '@reduxjs/toolkit';
import {
    generateOutfits,
    getFashionTrendsAndOutfits,
    analyzeStyleEvolution,
    getBudgetFriendlySuggestions,
    getColorCoordinatedOutfits,
    getSustainabilityInsights,
    visualizeOutfit,
    getOutfitOfTheDay,
    getStyleGuidance,
    generateMannequinVisualization,
} from '../../services/geminiService';
import {
    Outfit,
    FashionTrend,
    StyleAnalysis,
    BudgetSuggestion,
    ColorAnalysis,
    SustainabilityInsights,
    StyleSanctuaryContent,
    ClothingItem,
    MannequinSettings,
    TryOnMode,
} from '../../types';

interface FeaturesState {
    outfitSuggestions: Outfit[];
    fashionTrends: FashionTrend[];
    styleAnalysis: StyleAnalysis | null;
    budgetSuggestions: BudgetSuggestion[];
    colorAnalysis: ColorAnalysis | null;
    sustainabilityInsights: SustainabilityInsights | null;
    outfitOfTheDay: Outfit | null;
    styleSanctuaryContent: StyleSanctuaryContent | null;
    generatedTryOnImage: string | null;
    loading: Record<string, boolean>;
    error: string | null;
}

const initialState: FeaturesState = {
    outfitSuggestions: [],
    fashionTrends: [],
    styleAnalysis: null,
    budgetSuggestions: [],
    colorAnalysis: null,
    sustainabilityInsights: null,
    outfitOfTheDay: null,
    styleSanctuaryContent: null,
    generatedTryOnImage: null,
    loading: {},
    error: null,
};

// Generic async thunk creator for feature generation
const createFeatureThunk = <T, P>(
    type: string,
    apiCall: (params: P) => Promise<T>
) => {
    return createAsyncThunk<T, P>(
        `features/${type}`,
        async (params, { rejectWithValue }) => {
            try {
                return await apiCall(params);
            } catch (error: any) {
                return rejectWithValue(error.message);
            }
        }
    );
};

// FIX: Wrap multi-argument service call in a lambda that accepts a single object argument to match the createFeatureThunk signature.
export const generateOutfitSuggestions = createFeatureThunk(
    'generateOutfits',
    ({
        items,
        stylePreference,
        customPrompt,
        previousSuggestions,
    }: {
        items: ClothingItem[];
        stylePreference: string;
        customPrompt: string;
        previousSuggestions?: Outfit[];
    }) =>
        generateOutfits(
            items,
            stylePreference,
            customPrompt,
            previousSuggestions
        )
);
export const fetchFashionTrends = createFeatureThunk(
    'fetchTrends',
    getFashionTrendsAndOutfits
);
// FIX: Wrap multi-argument service call in a lambda that accepts a single object argument to match the createFeatureThunk signature.
export const analyzeUserStyle = createFeatureThunk(
    'analyzeStyle',
    ({
        wardrobeItems,
        favoriteOutfits,
    }: {
        wardrobeItems: ClothingItem[];
        favoriteOutfits: Outfit[];
    }) => analyzeStyleEvolution(wardrobeItems, favoriteOutfits)
);
export const fetchBudgetSuggestions = createFeatureThunk(
    'fetchBudget',
    getBudgetFriendlySuggestions
);
// FIX: Wrap multi-argument service call in a lambda that accepts a single object argument to match the createFeatureThunk signature.
export const analyzeColorHarmony = createFeatureThunk(
    'analyzeColor',
    ({
        baseItem,
        allItems,
    }: {
        baseItem: ClothingItem;
        allItems: ClothingItem[];
    }) => getColorCoordinatedOutfits(baseItem, allItems)
);
// FIX: Wrap multi-argument service call in a lambda that accepts a single object argument to match the createFeatureThunk signature.
export const analyzeSustainability = createFeatureThunk(
    'analyzeSustainability',
    ({
        allItems,
        cleanItems,
    }: {
        allItems: ClothingItem[];
        cleanItems: ClothingItem[];
    }) => getSustainabilityInsights(allItems, cleanItems)
);
export const generateOutfitOfTheDay = createFeatureThunk(
    'generateOOTD',
    getOutfitOfTheDay
);
export const fetchStyleGuidance = createFeatureThunk(
    'fetchGuidance',
    getStyleGuidance
);
// FIX: Wrap multi-argument service call in a lambda that accepts a single object argument to match the createFeatureThunk signature.
export const generateVisualizedOutfit = createAsyncThunk<
    string,
    {
        mode: TryOnMode;
        outfit: Outfit;
        userImage?: { base64Image: string; mimeType: string };
        mannequinSettings?: MannequinSettings;
        stylingNotes?: string;
    }
>(
    'features/visualizeOutfit',
    async (
        { mode, outfit, userImage, mannequinSettings, stylingNotes },
        { rejectWithValue }
    ) => {
        try {
            // Route to the appropriate visualization method based on mode
            if (mode === TryOnMode.Mannequin && mannequinSettings) {
                return await generateMannequinVisualization(
                    mannequinSettings,
                    outfit,
                    stylingNotes
                );
            } else if (
                (mode === TryOnMode.UserImage ||
                    mode === TryOnMode.NewUpload) &&
                userImage
            ) {
                return await visualizeOutfit(
                    userImage,
                    outfit,
                    stylingNotes
                );
            } else {
                throw new Error(
                    'Invalid visualization mode or missing required data'
                );
            }
        } catch (error: any) {
            return rejectWithValue(error.message);
        }
    }
);

const featuresSlice = createSlice({
    name: 'features',
    initialState,
    reducers: {
        clearColorAnalysis: (state) => {
            state.colorAnalysis = null;
        },
        updateOutfitFeedback: (state, action) => {
            const { outfitId, feedback } = action.payload;
            state.outfitSuggestions = state.outfitSuggestions.map((o) =>
                o.id === outfitId
                    ? {
                          ...o,
                          feedback:
                              o.feedback === feedback ? undefined : feedback,
                      }
                    : o
            );
        },
        updateTrendOutfitFeedback: (state, action) => {
            const { outfitId, feedback } = action.payload;
            state.fashionTrends = state.fashionTrends.map((trend) => ({
                ...trend,
                outfits: trend.outfits.map((outfit) =>
                    outfit.id === outfitId
                        ? {
                              ...outfit,
                              feedback:
                                  outfit.feedback === feedback
                                      ? undefined
                                      : feedback,
                          }
                        : outfit
                ),
            }));
        },
    },
    extraReducers: (builder) => {
        const thunks = [
            {
                thunk: generateOutfitSuggestions,
                stateKey: 'outfitSuggestions',
                loadingKey: 'generating_outfits',
            },
            {
                thunk: fetchFashionTrends,
                stateKey: 'fashionTrends',
                loadingKey: 'fetching_trends',
            },
            {
                thunk: analyzeUserStyle,
                stateKey: 'styleAnalysis',
                loadingKey: 'analyzing_style',
            },
            {
                thunk: fetchBudgetSuggestions,
                stateKey: 'budgetSuggestions',
                loadingKey: 'fetching_budget_suggestions',
            },
            {
                thunk: analyzeColorHarmony,
                stateKey: 'colorAnalysis',
                loadingKey: 'analyzing_colors',
            },
            {
                thunk: analyzeSustainability,
                stateKey: 'sustainabilityInsights',
                loadingKey: 'analyzing_sustainability',
            },
            {
                thunk: generateOutfitOfTheDay,
                stateKey: 'outfitOfTheDay',
                loadingKey: 'fetching_ootd',
            },
            {
                thunk: fetchStyleGuidance,
                stateKey: 'styleSanctuaryContent',
                loadingKey: 'fetching_style_guidance',
            },
            {
                thunk: generateVisualizedOutfit,
                stateKey: 'generatedTryOnImage',
                loadingKey: 'visualizing_fit',
            },
        ];

        thunks.forEach(({ thunk, stateKey, loadingKey }) => {
            builder
                .addCase(thunk.pending, (state) => {
                    state.loading[loadingKey] = true;
                    state.error = null;
                })
                .addCase(thunk.fulfilled, (state, action) => {
                    state.loading[loadingKey] = false;
                    (state as any)[stateKey] = action.payload;
                })
                .addCase(thunk.rejected, (state, action) => {
                    state.loading[loadingKey] = false;
                    state.error = action.payload as string;
                });
        });
    },
});

export const {
    clearColorAnalysis,
    updateOutfitFeedback,
    updateTrendOutfitFeedback,
} = featuresSlice.actions;

export default featuresSlice.reducer;

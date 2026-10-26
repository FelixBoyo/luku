import React, { useState } from 'react';
import { Outfit, FashionTrend, StyleAnalysis, DiscoverSubTab, Product } from '../types';
import OutfitSuggestions from './OutfitSuggestions';
import FashionTrends from './FashionTrends';
import StyleEvolution from './StyleEvolution';
import Button from './common/Button';
import BookmarkSquareIcon from './icons/BookmarkSquareIcon';

interface DiscoverProps {
    // OutfitSuggestions props
    outfits: Outfit[];
    onGenerate: () => void;
    onFavorite: (outfit: Outfit) => void;
    onOutfitFeedback: (outfitId: string, feedback: 'liked' | 'disliked') => void;
    onTryOn: (outfit: Outfit) => void;
    isLoadingOutfits: boolean;
    wardrobeItemCount: number;
    selectedStyle: string;
    onStyleChange: (style: string) => void;
    customPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
    isOutfitFavorited: (outfitId: string) => boolean;
    // FashionTrends props
    trends: FashionTrend[];
    onFetchTrends: () => void;
    onTrendOutfitFeedback: (outfitId: string, feedback: 'liked' | 'disliked') => void;
    isLoadingTrends: boolean;
    // StyleEvolution props
    favorites: Outfit[];
    onAnalyze: () => void;
    analysis: StyleAnalysis | null;
    isLoadingAnalysis: boolean;
    // Product navigation
    onProductClick?: (product: Product) => void;
    // Cross-link to Mood Boards
    onNavigateToMoodBoards?: () => void;
}

const Discover: React.FC<DiscoverProps> = ({
    outfits,
    onGenerate,
    onFavorite,
    onOutfitFeedback,
    onTryOn,
    isLoadingOutfits,
    wardrobeItemCount,
    selectedStyle,
    onStyleChange,
    customPrompt,
    onCustomPromptChange,
    isOutfitFavorited,
    trends,
    onFetchTrends,
    onTrendOutfitFeedback,
    isLoadingTrends,
    favorites,
    onAnalyze,
    analysis,
    isLoadingAnalysis,
    onProductClick,
    onNavigateToMoodBoards,
}) => {
    const [activeSubTab, setActiveSubTab] = useState<DiscoverSubTab>(
        DiscoverSubTab.Suggestions
    );

    const activeClasses = 'border-indigo-500 text-indigo-600';
    const inactiveClasses =
        'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300';

    return (
        <div>
            {/* Intro copy for the Discover surface */}
            <div className="mb-4">
                <p className="text-sm text-gray-600">
                    Explore AI-powered outfit suggestions, current fashion trends, and your
                    evolving style DNA – then favorite looks, save them to mood boards, or
                    jump straight into shopping matching pieces.
                </p>
            </div>

            {/* Sub-tab navigation with mobile responsiveness */}
            <div className="border-b border-gray-200 mb-6 overflow-x-auto">
                <nav className="flex space-x-4 md:space-x-8 min-w-max md:min-w-0">
                    <button
                        onClick={() => setActiveSubTab(DiscoverSubTab.Suggestions)}
                        className={`py-3 md:py-4 px-4 md:px-1 border-b-2 font-medium text-sm whitespace-nowrap min-w-[100px] md:min-w-0 transition-colors ${
                            activeSubTab === DiscoverSubTab.Suggestions
                                ? activeClasses
                                : inactiveClasses
                        }`}
                    >
                        Suggestions
                    </button>
                    <button
                        onClick={() => setActiveSubTab(DiscoverSubTab.Trends)}
                        className={`py-3 md:py-4 px-4 md:px-1 border-b-2 font-medium text-sm whitespace-nowrap min-w-[100px] md:min-w-0 transition-colors ${
                            activeSubTab === DiscoverSubTab.Trends
                                ? activeClasses
                                : inactiveClasses
                        }`}
                    >
                        Trends
                    </button>
                    <button
                        onClick={() => setActiveSubTab(DiscoverSubTab.StyleDNA)}
                        className={`py-3 md:py-4 px-4 md:px-1 border-b-2 font-medium text-sm whitespace-nowrap min-w-[100px] md:min-w-0 transition-colors ${
                            activeSubTab === DiscoverSubTab.StyleDNA
                                ? activeClasses
                                : inactiveClasses
                        }`}
                    >
                        Style DNA
                    </button>
                </nav>
            </div>

            {/* Inspired Mood Boards cross-link */}
            {onNavigateToMoodBoards && (
                <div className="mb-6 p-4 bg-gradient-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-lg flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                    <div className="flex items-start gap-3">
                        <div className="mt-0.5">
                            <BookmarkSquareIcon className="w-6 h-6 text-indigo-600" />
                        </div>
                        <div>
                            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                                Inspired Mood Boards
                            </p>
                            <p className="text-sm text-gray-800">
                                Save your favorite looks into Mood Boards to plan trips,
                                seasons, or specific vibes you want to explore later.
                            </p>
                        </div>
                    </div>
                    <Button
                        size="sm"
                        variant="secondary"
                        className="w-full sm:w-auto"
                        onClick={onNavigateToMoodBoards}
                    >
                        View Mood Boards
                    </Button>
                </div>
            )}

            {/* Render appropriate component based on active sub-tab */}
            {activeSubTab === DiscoverSubTab.Suggestions && (
                <OutfitSuggestions
                    outfits={outfits}
                    onGenerate={onGenerate}
                    onFavorite={onFavorite}
                    onOutfitFeedback={onOutfitFeedback}
                    onTryOn={(outfit) => onTryOn(outfit, 'discover_suggestions')}
                    isLoading={isLoadingOutfits}
                    wardrobeItemCount={wardrobeItemCount}
                    selectedStyle={selectedStyle}
                    onStyleChange={onStyleChange}
                    customPrompt={customPrompt}
                    onCustomPromptChange={onCustomPromptChange}
                    isOutfitFavorited={isOutfitFavorited}
                    onProductClick={onProductClick}
                />
            )}

            {activeSubTab === DiscoverSubTab.Trends && (
                <FashionTrends
                    trends={trends}
                    onFetchTrends={onFetchTrends}
                    onFavorite={onFavorite}
                    onOutfitFeedback={onTrendOutfitFeedback}
                    onTryOn={(outfit) => onTryOn(outfit, 'discover_suggestions')}
                    isLoading={isLoadingTrends}
                    wardrobeItemCount={wardrobeItemCount}
                    isOutfitFavorited={isOutfitFavorited}
                    onProductClick={onProductClick}
                />
            )}

            {activeSubTab === DiscoverSubTab.StyleDNA && (
                <StyleEvolution
                    favorites={favorites}
                    onAnalyze={onAnalyze}
                    analysis={analysis}
                    isLoading={isLoadingAnalysis}
                />
            )}
        </div>
    );
};

export default Discover;


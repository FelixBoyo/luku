import React from 'react';
import { Outfit, Product } from '../types';
import Button from './common/Button';
import OutfitCard from './common/OutfitCard';
import InfoIcon from './icons/InfoIcon';
import SparklesIcon from './icons/SparklesIcon';

interface OutfitSuggestionsProps {
    outfits: Outfit[];
    onGenerate: () => void;
    onFavorite: (outfit: Outfit) => void;
    onOutfitFeedback: (
        outfitId: string,
        feedback: 'liked' | 'disliked'
    ) => void;
    onTryOn: (outfit: Outfit) => void;
    isLoading: boolean;
    wardrobeItemCount: number;
    selectedStyle: string;
    onStyleChange: (style: string) => void;
    customPrompt: string;
    onCustomPromptChange: (prompt: string) => void;
    isOutfitFavorited: (outfitId: string) => boolean;
    onProductClick?: (product: Product) => void;
}

const styles = [
    'Casual',
    'Streetwear',
    'Formal',
    'Avant-Garde',
    'Bohemian',
    'Minimalist',
];

const OutfitSuggestions: React.FC<OutfitSuggestionsProps> = ({
    outfits,
    onGenerate,
    onFavorite,
    onOutfitFeedback,
    onTryOn,
    isLoading,
    wardrobeItemCount,
    selectedStyle,
    onStyleChange,
    customPrompt,
    onCustomPromptChange,
    isOutfitFavorited,
    onProductClick,
}) => {
    const canGenerate = wardrobeItemCount >= 2;

    return (
        <div>
            {/* Enhanced Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-2">
                    <SparklesIcon className="w-8 h-8 text-indigo-600" />
                    <h1 className="text-3xl font-bold text-gray-900">Outfit Suggestions</h1>
                </div>
                <p className="text-gray-600 ml-11">
                    Discover personalized outfit combinations tailored to your style
                </p>
            </div>

            {/* Enhanced Style Selection Card */}
            <div className="mb-8 p-6 bg-gradient-to-br from-white to-indigo-50/30 rounded-xl shadow-sm border border-indigo-100 space-y-8">
                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            1
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            What's the vibe for today?
                        </h2>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {styles.map((style) => (
                            <button
                                key={style}
                                onClick={() => onStyleChange(style)}
                                disabled={isLoading}
                                className={`px-5 py-2.5 rounded-full font-medium text-sm transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed ${
                                    selectedStyle === style
                                        ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg shadow-indigo-200'
                                        : 'bg-white text-gray-700 border-2 border-gray-200 hover:border-indigo-300 hover:bg-indigo-50'
                                }`}
                            >
                                {style}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="border-t border-indigo-200 -mx-6"></div>

                <div>
                    <div className="flex items-center gap-2 mb-4">
                        <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-sm">
                            2
                        </div>
                        <h2 className="text-xl font-semibold text-gray-800">
                            Add your personal touch (optional)
                        </h2>
                    </div>
                    <textarea
                        value={customPrompt}
                        onChange={(e) => onCustomPromptChange(e.target.value)}
                        placeholder="e.g., 'I prefer neutral colors', 'looking for something for a rainy day', 'inspired by 90s fashion'"
                        className="w-full p-4 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all placeholder:text-gray-400 bg-white resize-none"
                        rows={3}
                        disabled={isLoading}
                    />
                </div>
            </div>

            {/* Enhanced Feedback Banner */}
            {outfits.length > 0 && (
                <div
                    className="bg-gradient-to-r from-indigo-50 to-purple-50 border-l-4 border-indigo-500 text-indigo-900 p-4 rounded-lg mb-8 flex items-start space-x-3 shadow-sm"
                    role="alert"
                >
                    <div className="flex-shrink-0 mt-0.5">
                        <InfoIcon className="w-5 h-5 text-indigo-600" />
                    </div>
                    <div className="flex-1">
                        <p className="text-sm font-medium">
                            Help the AI learn your style!
                        </p>
                        <p className="text-sm text-indigo-700 mt-1">
                            Use the thumbs up/down buttons on each outfit. Your feedback
                            will be used to generate better suggestions next time. Tap the
                            heart to save favorite looks into your{' '}
                            <span className="font-semibold">My Favorites</span> mood board
                            under Albums.
                        </p>
                    </div>
                </div>
            )}

            {/* Enhanced Generate Button */}
            <div className="flex justify-center mb-10">
                <Button
                    onClick={onGenerate}
                    isLoading={isLoading}
                    disabled={!canGenerate || isLoading}
                    className="px-10 py-4 text-base font-semibold shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all duration-200 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
                    size="lg"
                >
                    {isLoading ? (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2 animate-pulse" />
                            Creating Magic...
                        </>
                    ) : (
                        <>
                            <SparklesIcon className="w-5 h-5 mr-2" />
                            Generate New Outfits
                        </>
                    )}
                </Button>
            </div>

            {/* Enhanced Empty States */}
            {!canGenerate && (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-100 mb-4">
                        <SparklesIcon className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Add More Clothes!
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                        You need at least two{' '}
                        <span className="font-bold text-indigo-600">clean</span> items in your
                        wardrobe to generate outfits.
                    </p>
                </div>
            )}

            {/* Enhanced Outfits Grid */}
            {outfits.length > 0 && (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            Your Personalized Outfits
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {outfits.length} {outfits.length === 1 ? 'outfit' : 'outfits'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {outfits.map((outfit) => (
                            <OutfitCard
                                key={outfit.id}
                                outfit={outfit}
                                onFavorite={onFavorite}
                                onFeedback={onOutfitFeedback}
                                onTryOn={(outfit) => onTryOn(outfit, 'discover_suggestions')}
                                isFavorited={isOutfitFavorited(outfit.id)}
                                onProductClick={onProductClick}
                            />
                        ))}
                    </div>
                </div>
            )}

            {canGenerate && outfits.length === 0 && !isLoading && (
                <div className="text-center py-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-xl border-2 border-dashed border-indigo-200">
                    <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-4">
                        <SparklesIcon className="w-8 h-8 text-indigo-600" />
                    </div>
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">
                        Ready for a Style Upgrade?
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Select your vibe and click the button above to get
                        personalized outfit suggestions tailored just for you!
                    </p>
                </div>
            )}
        </div>
    );
};

export default OutfitSuggestions;

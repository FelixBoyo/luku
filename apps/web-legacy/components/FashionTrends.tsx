import React from 'react';
import { FashionTrend, Outfit, Product } from '../types';
import Button from './common/Button';
import OutfitCard from './common/OutfitCard';
import FireIcon from './icons/FireIcon';

interface FashionTrendsProps {
    trends: FashionTrend[];
    onFetchTrends: () => void;
    onFavorite: (outfit: Outfit) => void;
    onOutfitFeedback: (
        outfitId: string,
        feedback: 'liked' | 'disliked'
    ) => void;
    onTryOn: (outfit: Outfit) => void;
    isLoading: boolean;
    wardrobeItemCount: number;
    isOutfitFavorited: (outfitId: string) => boolean;
    onProductClick?: (product: Product) => void;
}

const FashionTrends: React.FC<FashionTrendsProps> = ({
    trends,
    onFetchTrends,
    onFavorite,
    onOutfitFeedback,
    onTryOn,
    isLoading,
    wardrobeItemCount,
    isOutfitFavorited,
    onProductClick,
}) => {
    const canAnalyze = wardrobeItemCount >= 3;

    if (!canAnalyze) {
        return (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
                <h3 className="text-lg font-semibold text-gray-700">
                    Unlock Trend Analysis
                </h3>
                <p className="text-gray-500 mt-2">
                    You need at least three{' '}
                    <span className="font-bold">clean</span> items in your
                    wardrobe to discover the latest trends.
                </p>
            </div>
        );
    }

    if (trends.length === 0 && !isLoading) {
        return (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
                <FireIcon className="mx-auto h-12 w-12 text-indigo-500" />
                <h3 className="mt-4 text-xl font-semibold text-gray-800">
                    Discover What's Trending
                </h3>
                <p className="mt-2 text-base text-gray-600">
                    Let AI analyze your wardrobe against current fashion trends
                    and get personalized outfits.
                </p>
                <div className="mt-8">
                    <Button
                        onClick={onFetchTrends}
                        isLoading={isLoading}
                        disabled={!canAnalyze || isLoading}
                        className="px-8 py-3 text-base"
                    >
                        {isLoading ? 'Analyzing...' : 'Discover Trends'}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-12">
            {isLoading && trends.length === 0 && (
                <div className="text-center py-20">
                    <div className="animate-pulse flex flex-col items-center">
                        <FireIcon className="mx-auto h-16 w-16 text-indigo-300" />
                        <p className="mt-4 text-lg font-semibold text-gray-600">
                            Scouting the latest trends for you...
                        </p>
                    </div>
                </div>
            )}
            {trends.map((trend) => (
                <div key={trend.trendName}>
                    <div className="pb-4 border-b border-gray-200 mb-6">
                        <h2 className="text-2xl font-bold text-gray-800">
                            {trend.trendName}
                        </h2>
                        <p className="mt-1 text-md text-gray-600">
                            {trend.description}
                        </p>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {trend.outfits.map((outfit) => (
                            <OutfitCard
                                key={outfit.id}
                                outfit={outfit}
                                onFavorite={onFavorite}
                                onFeedback={onOutfitFeedback}
                                onTryOn={(outfit) => onTryOn(outfit, 'fashion_trends')}
                                isFavorited={isOutfitFavorited(outfit.id)}
                                onProductClick={onProductClick}
                            />
                        ))}
                    </div>
                </div>
            ))}
        </div>
    );
};

export default FashionTrends;

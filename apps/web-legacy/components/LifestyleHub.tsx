import React, { useMemo } from 'react';
import {
    ClothingItem,
    Outfit,
    SustainabilityInsights,
    BudgetSuggestion,
    StyleSanctuaryContent,
} from '../types';
import Button from './common/Button';
import LeafPersonIcon from './icons/LeafPersonIcon';
import HeartIcon from './icons/HeartIcon';
import WashingMachineIcon from './icons/WashingMachineIcon';
import LeafIcon from './icons/LeafIcon';
import SparklePersonIcon from './icons/SparklePersonIcon';
import CurrencyDollarIcon from './icons/CurrencyDollarIcon';
import PlusIcon from './icons/PlusIcon';
import UserIcon from './icons/UserIcon';

interface LifestyleHubProps {
    wardrobeItems: ClothingItem[];
    sustainabilityInsights: SustainabilityInsights | null;
    onAnalyzeSustainability: () => void;
    outfitOfTheDay: Outfit | null;
    onGetOutfitOfTheDay: () => void;
    onFavorite: (outfit: Outfit) => void;
    onTryOn: (outfit: Outfit, source?: string) => void;
    isOutfitFavorited?: (outfitId: string) => boolean;
    laundryStatusCounts: { inWash: number; dirty: number };
    onFinishLaundry: () => void;
    suggestions: BudgetSuggestion[];
    onFetchSuggestions: () => void;
    content: StyleSanctuaryContent | null;
    onFetchGuidance: () => void;
    isLoading: string | null;
    // Navigation helpers to connect the hub to key flows
    onNavigateToDiscover: () => void;
    onNavigateToMoodBoards: () => void;
    onNavigateToWardrobe: () => void;
    onNavigateToOutfitSuggestions: () => void;
    // First-run onboarding banner controls
    showOnboardingBanner: boolean;
    onDismissOnboarding: () => void;
}

const StatCard: React.FC<{ title: string; value: string | number }> = ({
    title,
    value,
}) => (
    <div className="bg-indigo-50 p-3 rounded-lg text-center">
        <p className="text-xs text-indigo-700 font-medium uppercase tracking-wider">
            {title}
        </p>
        <p className="text-xl font-bold text-indigo-900 truncate">{value}</p>
    </div>
);

const ScoreGauge: React.FC<{ score: number }> = ({ score }) => {
    const circumference = 2 * Math.PI * 42;
    const offset = circumference - (score / 100) * circumference;
    const scoreColor =
        score > 75
            ? 'text-green-600'
            : score > 50
            ? 'text-yellow-600'
            : 'text-red-600';
    const strokeColor =
        score > 75
            ? 'stroke-green-500'
            : score > 50
            ? 'stroke-yellow-500'
            : 'stroke-red-500';

    return (
        <div className="relative flex items-center justify-center w-32 h-32">
            <svg className="absolute w-full h-full" viewBox="0 0 100 100">
                <circle
                    className="stroke-current text-gray-200"
                    strokeWidth="8"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                />
                <circle
                    className={`transform -rotate-90 origin-center ${strokeColor}`}
                    strokeWidth="8"
                    strokeDasharray={circumference}
                    strokeDashoffset={offset}
                    strokeLinecap="round"
                    fill="transparent"
                    r="42"
                    cx="50"
                    cy="50"
                    style={{ transition: 'stroke-dashoffset 0.8s ease-out' }}
                />
            </svg>
            <span className={`text-3xl font-bold ${scoreColor}`}>{score}</span>
        </div>
    );
};

const LifestyleHub: React.FC<LifestyleHubProps> = (props) => {
    const {
        wardrobeItems,
        sustainabilityInsights,
        onAnalyzeSustainability,
        outfitOfTheDay,
        onGetOutfitOfTheDay,
        onFavorite,
        onTryOn,
        laundryStatusCounts,
        onFinishLaundry,
        suggestions,
        onFetchSuggestions,
        content,
        onFetchGuidance,
        isLoading,
        onNavigateToDiscover,
        onNavigateToMoodBoards,
        onNavigateToWardrobe,
        onNavigateToOutfitSuggestions,
        showOnboardingBanner,
        onDismissOnboarding,
    isOutfitFavorited,
    } = props;

    const dominantStyle = useMemo(() => {
        if (wardrobeItems.length === 0) return 'N/A';
        const styleCounts = wardrobeItems.reduce((acc, item) => {
            acc[item.style] = (acc[item.style] || 0) + 1;
            return acc;
        }, {} as Record<string, number>);
        return Object.entries(styleCounts).sort(
            (a, b) => Number(b[1]) - Number(a[1])
        )[0][0];
    }, [wardrobeItems]);

    if (wardrobeItems.length === 0) {
        return (
            <div className="space-y-6">
                {showOnboardingBanner && (
                    <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 sm:p-5">
                        <div className="flex items-start justify-between gap-3">
                            <div>
                                <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                                    Welcome to LUKU
                                </p>
                                <h2 className="mt-1 text-lg font-semibold text-gray-900">
                                    Start with outfits, mood boards, or your wardrobe
                                </h2>
                                <p className="mt-1 text-sm text-gray-700">
                                    We recommend beginning with outfit ideas, creating a mood board,
                                    or adding a few key pieces to your wardrobe.
                                </p>
                            </div>
                            <button
                                type="button"
                                onClick={onDismissOnboarding}
                                className="text-gray-400 hover:text-gray-600"
                                aria-label="Dismiss onboarding"
                            >
                                <span className="text-xl" aria-hidden="true">
                                    &times;
                                </span>
                            </button>
                        </div>
                        <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                            <Button
                                size="sm"
                                onClick={onNavigateToDiscover}
                                className="w-full justify-center"
                            >
                                Get outfit ideas
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={onNavigateToMoodBoards}
                                className="w-full justify-center"
                            >
                                Make a mood board
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={onNavigateToWardrobe}
                                className="w-full justify-center"
                            >
                                Add wardrobe items
                            </Button>
                        </div>
                    </div>
                )}

                <div className="text-center py-16 bg-gradient-to-br from-indigo-50 to-purple-50 rounded-lg">
                    <LeafPersonIcon className="mx-auto h-16 w-16 text-indigo-400" />
                    <h3 className="mt-6 text-2xl font-semibold text-gray-800">
                        Build your first wardrobe
                    </h3>
                    <p className="mt-3 text-base text-gray-600 max-w-md mx-auto">
                        Add a few items to unlock personalized outfit suggestions, mood boards,
                        and sustainability insights tailored to your style.
                    </p>
                    <div className="mt-6 flex justify-center">
                        <Button onClick={onNavigateToWardrobe}>Go to Wardrobe</Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {showOnboardingBanner && (
                <div className="bg-indigo-50 border border-indigo-100 rounded-xl p-4 sm:p-5">
                    <div className="flex items-start justify-between gap-3">
                        <div>
                            <p className="text-xs font-semibold text-indigo-700 uppercase tracking-wide">
                                New to LUKU?
                            </p>
                            <h2 className="mt-1 text-lg font-semibold text-gray-900">
                                Three ways to get started
                            </h2>
                            <p className="mt-1 text-sm text-gray-700">
                                Explore outfit ideas, create mood boards, or refine your wardrobe.
                                Choose any path—everything stays in sync.
                            </p>
                        </div>
                        <button
                            type="button"
                            onClick={onDismissOnboarding}
                            className="text-gray-400 hover:text-gray-600"
                            aria-label="Dismiss onboarding"
                        >
                            <span className="text-xl" aria-hidden="true">
                                &times;
                            </span>
                        </button>
                    </div>
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-3">
                        <Button
                            size="sm"
                            onClick={onNavigateToDiscover}
                            className="w-full justify-center"
                        >
                            See outfit ideas
                        </Button>
                        <Button
                            size="sm"
                            variant="secondary"
                            onClick={onNavigateToMoodBoards}
                            className="w-full justify-center"
                        >
                            Make a mood board
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={onNavigateToWardrobe}
                            className="w-full justify-center"
                        >
                            Edit wardrobe
                        </Button>
                    </div>
                </div>
            )}

            <div className="text-center">
                <h1 className="text-3xl font-bold text-gray-800 tracking-tight">
                    Your Lifestyle Hub
                </h1>
                <p className="mt-2 text-lg text-gray-600 max-w-2xl mx-auto">
                    An integrated dashboard for conscious living, personal
                    well-being, and fashion innovation.
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Main Content Column */}
                <div className="lg:col-span-2 space-y-8">
                    {/* Style Sanctuary */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border">
                        <div className="flex items-center mb-4">
                            <SparklePersonIcon className="w-8 h-8 text-purple-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-800">
                                Style Sanctuary
                            </h2>
                        </div>
                        {isLoading === 'fetching_style_guidance' ? (
                            <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                        ) : !content ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-4">
                                    Get AI-powered affirmations, guided
                                    exercises, and articles to build confidence.
                                </p>
                                <Button onClick={onFetchGuidance}>
                                    Get Today's Guidance
                                </Button>
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white p-4 rounded-lg text-center">
                                    <h3 className="text-sm font-semibold uppercase tracking-wider mb-1">
                                        Daily Affirmation
                                    </h3>
                                    <p className="font-light italic">
                                        "{content.dailyAffirmation}"
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">
                                        {content.guidedExercise.title}
                                    </h4>
                                    <p className="text-sm text-gray-600">
                                        {content.guidedExercise.description}
                                    </p>
                                </div>
                                <div>
                                    <h4 className="font-bold text-gray-800">
                                        {content.styleArticle.title}
                                    </h4>
                                    <p className="text-sm text-gray-600 line-clamp-3">
                                        {content.styleArticle.content}
                                    </p>
                                </div>
                                <Button
                                    variant="secondary"
                                    onClick={onFetchGuidance}
                                    className="w-full"
                                >
                                    Get New Guidance
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Smart Style */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border">
                        <div className="flex items-center mb-4">
                            <CurrencyDollarIcon className="w-8 h-8 text-green-600 mr-3" />
                            <h2 className="text-2xl font-bold text-gray-800">
                                Smart Style
                            </h2>
                        </div>
                        {isLoading === 'fetching_budget_suggestions' ? (
                            <div className="h-48 bg-gray-200 rounded-lg animate-pulse"></div>
                        ) : suggestions.length === 0 ? (
                            <div className="text-center py-8">
                                <p className="text-gray-600 mb-4">
                                    Find affordable, high-impact items to
                                    maximize your existing wardrobe.
                                </p>
                                <Button
                                    onClick={onFetchSuggestions}
                                    disabled={wardrobeItems.length < 3}
                                >
                                    Get Suggestions
                                </Button>
                                {wardrobeItems.length < 3 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Requires 3+ items
                                    </p>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                {suggestions
                                    .slice(0, 2)
                                    .map((suggestion, index) => (
                                        <div
                                            key={index}
                                            className="bg-gray-50 p-3 rounded-lg border"
                                        >
                                            <div className="flex justify-between items-start">
                                                <h4 className="font-bold text-gray-800">
                                                    {suggestion.itemName}
                                                </h4>
                                                <span className="text-sm font-semibold text-green-700">
                                                    {
                                                        suggestion.estimatedPriceRange
                                                    }
                                                </span>
                                            </div>
                                            <p className="text-xs text-gray-600">
                                                {suggestion.description}
                                            </p>
                                        </div>
                                    ))}
                                <Button
                                    variant="secondary"
                                    onClick={onFetchSuggestions}
                                    className="w-full"
                                >
                                    Get New Suggestions
                                </Button>
                            </div>
                        )}
                    </div>
                </div>

                {/* Sidebar Column */}
                <div className="lg:col-span-1 space-y-8">
                    {/* Outfit of the Day */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border">
                        <h2 className="text-xl font-bold text-gray-800 mb-3">
                            Outfit of the Day
                        </h2>
                        {isLoading === 'fetching_ootd' ? (
                            <div className="h-32 bg-gray-200 rounded-lg animate-pulse"></div>
                        ) : outfitOfTheDay ? (
                            <div>
                                <h3 className="text-md font-semibold text-gray-700">
                                    {outfitOfTheDay.outfitName}
                                </h3>
                                {isOutfitFavorited &&
                                    isOutfitFavorited(outfitOfTheDay.id) && (
                                        <p className="text-xs text-green-700 mt-1">
                                            Saved to your favorites
                                        </p>
                                    )}
                                <div className="flex items-center space-x-2 my-2">
                                    {outfitOfTheDay.items
                                        .slice(0, 4)
                                        .map((item) => (
                                            <img
                                                key={item.id}
                                                src={item.imageUrl}
                                                alt={item.name}
                                                title={item.name}
                                                className="w-12 h-12 object-cover rounded-md shadow-sm"
                                            />
                                        ))}
                                </div>
                                <div className="grid grid-cols-2 gap-2 mb-2">
                                    <Button
                                        variant="primary"
                                        onClick={() => {
                                            if (
                                                !isOutfitFavorited ||
                                                !isOutfitFavorited(
                                                    outfitOfTheDay.id
                                                )
                                            ) {
                                                onFavorite(outfitOfTheDay);
                                            }
                                        }}
                                        size="sm"
                                        className="w-full focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-60"
                                        aria-label={
                                            isOutfitFavorited &&
                                            isOutfitFavorited(
                                                outfitOfTheDay.id
                                            )
                                                ? 'Outfit already favorited'
                                                : 'Favorite this outfit'
                                        }
                                        disabled={
                                            !!(
                                                isOutfitFavorited &&
                                                isOutfitFavorited(
                                                    outfitOfTheDay.id
                                                )
                                            )
                                        }
                                    >
                                        <HeartIcon className="w-4 h-4 mr-2" />
                                        {isOutfitFavorited &&
                                        isOutfitFavorited(outfitOfTheDay.id)
                                            ? 'Favorited'
                                            : 'Favorite'}
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        onClick={() => onTryOn(outfitOfTheDay)}
                                        size="sm"
                                        className="w-full bg-indigo-600 hover:bg-indigo-700 text-white border-indigo-600 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        aria-label="Try on outfit of the day without favoriting"
                                    >
                                        <UserIcon className="w-4 h-4 mr-2" />
                                        Try On
                                    </Button>
                                </div>
                                <p className="text-xs text-gray-500 text-center mb-2">
                                    Try on any outfit without saving it first
                                </p>
                                <div className="grid grid-cols-1 gap-2 mt-2">
                                    <Button
                                        variant="ghost"
                                        onClick={onGetOutfitOfTheDay}
                                        size="sm"
                                        className="w-full"
                                    >
                                        New suggestion
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        className="w-full"
                                        onClick={onNavigateToOutfitSuggestions}
                                    >
                                        See more outfit ideas
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="text-center py-4">
                                <p className="text-sm text-gray-600 mb-2">
                                    You need 3+ clean items for a suggestion.
                                </p>
                                <Button
                                    onClick={onGetOutfitOfTheDay}
                                    size="sm"
                                    disabled={
                                        wardrobeItems.filter(
                                            (i) => i.status === 'clean'
                                        ).length < 3
                                    }
                                >
                                    Generate Outfit
                                </Button>
                            </div>
                        )}
                    </div>

                    {/* Wellness Stats */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border">
                        <h3 className="text-xl font-bold text-gray-800 mb-3">
                            Wellness Stats
                        </h3>
                        <div className="grid grid-cols-2 gap-3 mb-4">
                            <StatCard
                                title="Total Items"
                                value={wardrobeItems.length}
                            />
                            <StatCard
                                title="Dominant Style"
                                value={dominantStyle}
                            />
                        </div>
                        <div className="bg-blue-50 p-3 rounded-lg">
                            <div className="flex justify-between items-center">
                                <div className="text-center">
                                    <p className="text-xs font-medium text-blue-700">
                                        IN WASH
                                    </p>
                                    <p className="text-xl font-bold text-blue-900">
                                        {laundryStatusCounts.inWash}
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-xs font-medium text-gray-700">
                                        DIRTY
                                    </p>
                                    <p className="text-xl font-bold text-gray-900">
                                        {laundryStatusCounts.dirty}
                                    </p>
                                </div>
                                <Button
                                    onClick={onFinishLaundry}
                                    disabled={laundryStatusCounts.inWash === 0}
                                    size="sm"
                                    className="!px-3"
                                >
                                    <WashingMachineIcon className="w-5 h-5" />
                                </Button>
                            </div>
                        </div>
                    </div>

                    {/* Sustainability */}
                    <div className="bg-white p-6 rounded-xl shadow-lg border text-center">
                        <h3 className="text-xl font-bold text-gray-800 mb-3">
                            Sustainability
                        </h3>
                        {isLoading === 'analyzing_sustainability' ? (
                            <div className="h-32 bg-gray-200 rounded-full animate-pulse w-32 mx-auto"></div>
                        ) : sustainabilityInsights ? (
                            <>
                                <div className="flex justify-center">
                                    <ScoreGauge
                                        score={
                                            sustainabilityInsights.sustainabilityScore
                                        }
                                    />
                                </div>
                                <p className="text-xs text-gray-600 mt-2">
                                    {sustainabilityInsights.scoreJustification}
                                </p>
                            </>
                        ) : (
                            <div className="py-4">
                                <p className="text-sm text-gray-600 mb-3">
                                    Get your wardrobe's eco-impact score.
                                </p>
                                <Button
                                    onClick={onAnalyzeSustainability}
                                    disabled={wardrobeItems.length < 5}
                                >
                                    Analyze
                                </Button>
                                {wardrobeItems.length < 5 && (
                                    <p className="text-xs text-gray-500 mt-2">
                                        Requires 5+ items
                                    </p>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LifestyleHub;

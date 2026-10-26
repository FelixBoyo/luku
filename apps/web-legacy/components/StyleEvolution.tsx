
import React from 'react';
import { Outfit, StyleAnalysis } from '../types';
import Button from './common/Button';
import ChartBarIcon from './icons/ChartBarIcon';
import TagIcon from './icons/TagIcon';
import SwatchIcon from './icons/SwatchIcon';
import RectangleStackIcon from './icons/RectangleStackIcon';
import LightBulbIcon from './icons/LightBulbIcon';

interface StyleEvolutionProps {
    favorites: Outfit[];
    onAnalyze: () => void;
    analysis: StyleAnalysis | null;
    isLoading: boolean;
}

const InfoCard: React.FC<{ icon: React.ReactNode; title: string; items: string[] }> = ({ icon, title, items }) => (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200">
        <div className="flex items-center text-gray-600 mb-3">
            {icon}
            <h4 className="font-semibold ml-2">{title}</h4>
        </div>
        <div className="flex flex-wrap gap-2">
            {items.map((item, index) => (
                <span key={index} className="bg-indigo-100 text-indigo-800 text-xs font-medium px-2.5 py-1 rounded-full">{item}</span>
            ))}
        </div>
    </div>
);

const AnalysisSkeleton: React.FC = () => (
    <div className="animate-pulse">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
            <div className="h-24 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="bg-gray-200 rounded-lg p-6 mb-8">
            <div className="h-4 bg-gray-300 rounded w-1/4 mb-4"></div>
            <div className="h-3 bg-gray-300 rounded mb-2"></div>
            <div className="h-3 bg-gray-300 rounded w-5/6"></div>
        </div>
        <div className="space-y-4">
            <div className="h-28 bg-gray-200 rounded-lg"></div>
            <div className="h-28 bg-gray-200 rounded-lg"></div>
            <div className="h-28 bg-gray-200 rounded-lg"></div>
        </div>
    </div>
);

const StyleEvolution: React.FC<StyleEvolutionProps> = ({ favorites, onAnalyze, analysis, isLoading }) => {
    const canAnalyze = favorites.length >= 3;

    if (!canAnalyze) {
        return (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
                <ChartBarIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-700">Unlock Your Style DNA</h3>
                <p className="text-gray-500 mt-2">
                    Favorite at least {3 - favorites.length} more outfit{favorites.length === 2 ? '' : 's'} to get a personalized analysis of your style evolution.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return <AnalysisSkeleton />;
    }

    if (!analysis) {
        return (
            <div className="text-center py-20 bg-white rounded-lg shadow-sm border">
                <ChartBarIcon className="mx-auto h-12 w-12 text-indigo-500" />
                <h3 className="mt-4 text-xl font-semibold text-gray-800">Ready to Discover Your Style Evolution?</h3>
                <p className="mt-2 text-base text-gray-600">Let AI analyze your favorited outfits to reveal insights and tips to refine your fashion identity.</p>
                <div className="mt-8">
                    <Button 
                        onClick={onAnalyze} 
                        isLoading={isLoading}
                        className="px-8 py-3 text-base"
                    >
                        Analyze My Style
                    </Button>
                </div>
            </div>
        );
    }
    
    return (
        <div className="space-y-10">
            <div>
                <h2 className="text-2xl font-bold text-gray-800 mb-4">Your Core Style Profile</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <InfoCard icon={<TagIcon className="w-5 h-5"/>} title="Style Keywords" items={analysis.coreStyleProfile.keywords} />
                    <InfoCard icon={<SwatchIcon className="w-5 h-5"/>} title="Top Colors" items={analysis.coreStyleProfile.topColors} />
                    <InfoCard icon={<RectangleStackIcon className="w-5 h-5"/>} title="Top Categories" items={analysis.coreStyleProfile.topCategories} />
                </div>
            </div>

            <div className="bg-indigo-50 border-l-4 border-indigo-400 p-6 rounded-r-lg">
                 <h3 className="text-xl font-semibold text-gray-800 mb-2">Evolution Insights</h3>
                <p className="text-gray-700 leading-relaxed">{analysis.styleEvolutionNarrative}</p>
            </div>

            <div>
                <h3 className="text-2xl font-bold text-gray-800 mb-4">Recommendations For You</h3>
                 <div className="space-y-4">
                    {analysis.recommendations.map((rec, index) => (
                        <div key={index} className="bg-white p-5 rounded-lg shadow-sm border flex items-start space-x-4">
                            <div className="flex-shrink-0 bg-green-100 rounded-full p-2">
                                <LightBulbIcon className="w-6 h-6 text-green-600" />
                            </div>
                            <div>
                                <h4 className="text-md font-semibold text-gray-900">{rec.title}</h4>
                                <p className="text-gray-600 mt-1">{rec.suggestion}</p>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
             <div className="text-center mt-12">
                <Button onClick={onAnalyze} variant="secondary" isLoading={isLoading}>
                    Re-Analyze My Style
                </Button>
            </div>
        </div>
    );
};

export default StyleEvolution;

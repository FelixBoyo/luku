import React, { useState } from 'react';
import { ClothingItem, ColorAnalysis, Outfit } from '../types';
import Button from './common/Button';
import ColorSwatchIcon from './icons/ColorSwatchIcon';
import UserIcon from './icons/UserIcon';

interface ColorHarmonyProps {
    wardrobeItems: ClothingItem[];
    onAnalyze: (item: ClothingItem) => void;
    analysis: ColorAnalysis | null;
    isLoading: boolean;
    onClear: () => void;
    onFavorite: (
        outfit: Pick<Outfit, 'outfitName' | 'description' | 'items'>
    ) => void;
    onTryOn: (outfit: Outfit, source?: string) => void;
}

const ItemSelectionGrid: React.FC<{
    items: ClothingItem[];
    onSelectItem: (item: ClothingItem) => void;
}> = ({ items, onSelectItem }) => (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
        {items.map((item) => (
            <button
                key={item.id}
                onClick={() => onSelectItem(item)}
                className="group relative aspect-square block w-full overflow-hidden rounded-lg border-2 border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
                <img
                    src={item.imageUrl}
                    alt={item.name}
                    className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-110"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent"></div>
                <div className="absolute inset-x-0 bottom-0 p-2">
                    <p className="text-xs font-semibold text-white truncate">
                        {item.name}
                    </p>
                </div>
            </button>
        ))}
    </div>
);

const AnalysisResult: React.FC<{
    analysis: ColorAnalysis;
    baseItem: ClothingItem;
    onFavorite: (
        outfit: Pick<Outfit, 'outfitName' | 'description' | 'items'>
    ) => void;
    onTryOn: (outfit: Outfit, source?: string) => void;
    allItems: ClothingItem[];
}> = ({ analysis, baseItem, onFavorite, onTryOn, allItems }) => {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-1 space-y-6">
                <div>
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Base Item
                    </h3>
                    <div className="relative overflow-hidden rounded-lg bg-white shadow-md">
                        <img
                            src={baseItem.imageUrl}
                            alt={baseItem.name}
                            className="w-full object-cover"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent"></div>
                        <div className="absolute bottom-0 left-0 p-4">
                            <h3 className="text-md font-semibold text-white">
                                {baseItem.name}
                            </h3>
                        </div>
                    </div>
                </div>
                <div className="bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded-r-lg">
                    <h3 className="text-lg font-semibold text-gray-800 mb-2">
                        Color Theory 101
                    </h3>
                    <p className="text-sm text-gray-700 leading-relaxed">
                        {analysis.colorTheoryExplanation}
                    </p>
                </div>
            </div>
            <div className="lg:col-span-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Suggested Outfits
                </h3>
                <div className="space-y-6">
                    {analysis.suggestedOutfits.map((outfit, index) => {
                        return (
                            <div
                                key={index}
                                className="bg-white rounded-xl shadow-lg border overflow-hidden"
                            >
                                <div className="p-5">
                                    <div className="flex justify-between items-start">
                                        <div>
                                            <h4 className="text-lg font-bold text-gray-800">
                                                {outfit.outfitName}
                                            </h4>
                                            <p className="text-sm text-gray-600 mt-1 italic">
                                                "{outfit.description}"
                                            </p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                            <Button
                                                variant="secondary"
                                                onClick={() =>
                                                    onFavorite(outfit)
                                                }
                                            >
                                                Favorite
                                            </Button>
                                            <Button
                                                variant="ghost"
                                                onClick={() => onTryOn(outfit, 'color_harmony')}
                                            >
                                                Try On
                                            </Button>
                                        </div>
                                    </div>
                                    <div className="flex items-center space-x-2 mt-4">
                                        {outfit.items.map((item) => (
                                            <img
                                                key={item.id}
                                                src={item.imageUrl}
                                                alt={item.name}
                                                title={item.name}
                                                className="w-16 h-16 object-cover rounded-md shadow-sm"
                                            />
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </div>
        </div>
    );
};

const AnalysisSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        <div className="lg:col-span-1 space-y-6">
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-32 bg-gray-200 rounded-lg"></div>
        </div>
        <div className="lg:col-span-2 space-y-6">
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
            <div className="h-48 bg-gray-200 rounded-lg"></div>
        </div>
    </div>
);

const ColorHarmony: React.FC<ColorHarmonyProps> = ({
    wardrobeItems,
    onAnalyze,
    analysis,
    isLoading,
    onClear,
    onFavorite,
    onTryOn,
}) => {
    const [selectedItem, setSelectedItem] = useState<ClothingItem | null>(null);

    if (wardrobeItems.length < 2) {
        return (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
                <ColorSwatchIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-700">
                    Explore Color Harmony
                </h3>
                <p className="text-gray-500 mt-2">
                    You need at least two{' '}
                    <span className="font-bold">clean</span> items in your
                    wardrobe to get color coordination advice.
                </p>
            </div>
        );
    }

    const handleSelectItem = (item: ClothingItem) => {
        setSelectedItem(item);
        onClear(); // Clear previous analysis when a new item is selected
    };

    const handleAnalyzeClick = () => {
        if (selectedItem) {
            onAnalyze(selectedItem);
        }
    };

    const handleReset = () => {
        setSelectedItem(null);
        onClear();
    };

    return (
        <div className="space-y-8">
            {selectedItem && (
                <div className="p-4 bg-white rounded-lg shadow-sm border flex flex-col md:flex-row items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                        <img
                            src={selectedItem.imageUrl}
                            alt={selectedItem.name}
                            className="w-16 h-16 object-cover rounded-md"
                        />
                        <div>
                            <p className="text-sm text-gray-500">
                                Selected for analysis:
                            </p>
                            <h3 className="font-semibold text-gray-800">
                                {selectedItem.name}
                            </h3>
                        </div>
                    </div>
                    <div className="flex items-center gap-3">
                        <Button variant="secondary" onClick={handleReset}>
                            Change Item
                        </Button>
                        <Button
                            onClick={handleAnalyzeClick}
                            isLoading={isLoading}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Analyzing...' : 'Find Color Combos'}
                        </Button>
                    </div>
                </div>
            )}

            {isLoading && <AnalysisSkeleton />}

            {!isLoading && analysis && selectedItem && (
                <AnalysisResult
                    analysis={analysis}
                    baseItem={selectedItem}
                    onFavorite={onFavorite}
                    onTryOn={(outfit) => onTryOn(outfit, 'color_harmony')}
                    allItems={wardrobeItems}
                />
            )}

            {!selectedItem && !isLoading && (
                <div>
                    <h2 className="text-xl font-semibold text-gray-800 mb-1">
                        Select a Base Item
                    </h2>
                    <p className="text-gray-600 mb-4">
                        Choose a piece from your wardrobe to find its perfect
                        color companions.
                    </p>
                    <ItemSelectionGrid
                        items={wardrobeItems}
                        onSelectItem={handleSelectItem}
                    />
                </div>
            )}
        </div>
    );
};

export default ColorHarmony;

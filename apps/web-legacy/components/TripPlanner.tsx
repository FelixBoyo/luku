import React, { useState } from 'react';
import { Trip, ClothingItem, TripPlan, DailyPlan, Outfit } from '../types';
import Button from './common/Button';
import BriefcaseIcon from './icons/BriefcaseIcon';
import PlusIcon from './icons/PlusIcon';

interface TripPlannerProps {
    onGeneratePlan: (details: {
        name: string;
        destination: string;
        startDate: string;
        endDate: string;
        notes: string;
    }) => void;
    trip: Trip | null;
    isLoading: boolean;
    wardrobeItems: ClothingItem[];
    cleanWardrobeItemCount: number;
    onSaveTripAsAlbum: (trip: Trip) => void;
    onTryOn: (outfit: Outfit, source?: string) => void;
    onClearTrip?: () => void;
}

const TripForm: React.FC<{
    onGenerate: (details: any) => void;
    isLoading: boolean;
}> = ({ onGenerate, isLoading }) => {
    const [name, setName] = useState('');
    const [destination, setDestination] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [notes, setNotes] = useState('');

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        onGenerate({ name, destination, startDate, endDate, notes });
    };

    const today = new Date().toISOString().split('T')[0];

    return (
        <div className="max-w-2xl mx-auto">
            <form
                onSubmit={handleSubmit}
                className="p-8 space-y-6 bg-white rounded-lg shadow-md border"
            >
                <div className="text-center">
                    <h2 className="text-2xl font-bold text-gray-800">
                        Plan Your Next Trip
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Tell us about your trip, and we'll pack your virtual
                        suitcase.
                    </p>
                </div>
                <div className="space-y-4">
                    <div>
                        <label
                            htmlFor="trip-name"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Trip Name
                        </label>
                        <input
                            type="text"
                            id="trip-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="e.g., Summer in Italy"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <div>
                        <label
                            htmlFor="destination"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Destination
                        </label>
                        <input
                            type="text"
                            id="destination"
                            value={destination}
                            onChange={(e) => setDestination(e.target.value)}
                            placeholder="e.g., Rome, Italy"
                            required
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div>
                            <label
                                htmlFor="start-date"
                                className="block text-sm font-medium text-gray-700"
                            >
                                Start Date
                            </label>
                            <input
                                type="date"
                                id="start-date"
                                value={startDate}
                                min={today}
                                onChange={(e) => setStartDate(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                        <div>
                            <label
                                htmlFor="end-date"
                                className="block text-sm font-medium text-gray-700"
                            >
                                End Date
                            </label>
                            <input
                                type="date"
                                id="end-date"
                                value={endDate}
                                min={startDate || today}
                                onChange={(e) => setEndDate(e.target.value)}
                                required
                                className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                            />
                        </div>
                    </div>
                    <div>
                        <label
                            htmlFor="notes"
                            className="block text-sm font-medium text-gray-700"
                        >
                            Activities & Vibe (optional)
                        </label>
                        <textarea
                            id="notes"
                            value={notes}
                            onChange={(e) => setNotes(e.target.value)}
                            rows={3}
                            placeholder="e.g., lots of walking, museum visits, a few fancy dinners, beach time."
                            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
                        ></textarea>
                    </div>
                </div>
                <Button
                    type="submit"
                    isLoading={isLoading}
                    className="w-full justify-center !py-3 !text-base"
                >
                    {isLoading ? 'Planning...' : 'Generate Trip Plan'}
                </Button>
            </form>
        </div>
    );
};

const TripPlanDisplay: React.FC<{
    trip: Trip;
    wardrobeItems: ClothingItem[];
    onSaveTripAsAlbum: (trip: Trip) => void;
    onTryOn: (outfit: Outfit, source?: string) => void;
    onClearTrip?: () => void;
}> = ({ trip, wardrobeItems, onSaveTripAsAlbum, onTryOn, onClearTrip }) => {
    if (!trip.plan) return null;

    const packingListItems = trip.plan.packingList
        .map((itemName) => wardrobeItems.find((item) => item.name === itemName))
        .filter((item): item is ClothingItem => item !== undefined);

    // Create a unique set of items
    const uniquePackingListItems = Array.from(
        new Map(packingListItems.map((item) => [item.id, item])).values()
    );

    // FIX: Explicitly type 'item' as ClothingItem to resolve a TypeScript inference issue.
    const packingListImages = uniquePackingListItems.map(
        (item: ClothingItem) => (
            <img
                key={item.id}
                src={item.imageUrl}
                alt={item.name}
                title={item.name}
                className="aspect-square w-full h-full object-cover rounded-md shadow-sm"
            />
        )
    );

    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <aside className="lg:col-span-1 lg:sticky lg:top-8 self-start">
                <div className="bg-white p-6 rounded-lg shadow-md border">
                    <div className="flex items-center justify-between mb-4">
                        <h2 className="text-xl font-bold text-gray-800 border-b pb-3">
                            Your Packing List ({uniquePackingListItems.length}{' '}
                            items)
                        </h2>
                        {onClearTrip && (
                            <button
                                onClick={onClearTrip}
                                className="text-sm text-gray-500 hover:text-gray-700 underline ml-2"
                                aria-label="Clear trip"
                            >
                                Clear
                            </button>
                        )}
                    </div>
                    <div className="grid grid-cols-4 sm:grid-cols-5 lg:grid-cols-4 gap-3">
                        {packingListImages}
                    </div>
                    <Button
                        onClick={() => onSaveTripAsAlbum(trip)}
                        className="w-full mt-6"
                    >
                        Save Trip to Albums
                    </Button>
                </div>
            </aside>
            <main className="lg:col-span-2 space-y-6">
                <h1 className="text-3xl font-bold text-gray-800">
                    {trip.name}
                </h1>
                {trip.plan.dailyPlans.map((day) => {
                    return (
                        <div
                            key={day.day}
                            className="bg-white p-6 rounded-lg shadow-md border"
                        >
                            <span className="text-sm font-bold uppercase tracking-wider text-indigo-600">
                                Day {day.day}
                            </span>
                            <h3 className="text-2xl font-bold text-gray-800 mt-1">
                                {day.title}
                            </h3>
                            <p className="text-gray-600 mt-1 mb-4">
                                {day.description}
                            </p>

                            <div className="space-y-4 border-t pt-4">
                                {day.outfits.map((outfit, oIndex) => {
                                    return (
                                        <div
                                            key={oIndex}
                                            className="bg-gray-50 p-4 rounded-md"
                                        >
                                            <div className="flex justify-between items-start">
                                                <div>
                                                    <h4 className="font-semibold text-gray-700">
                                                        {outfit.outfitName}
                                                    </h4>
                                                    <p className="text-sm text-gray-500 mb-3 italic">
                                                        "{outfit.description}"
                                                    </p>
                                                </div>
                                                <Button
                                                    variant="secondary"
                                                    size="sm"
                                                    onClick={() =>
                                                        onTryOn(outfit, 'trip_planner')
                                                    }
                                                >
                                                    Try On
                                                </Button>
                                            </div>
                                            <div className="flex items-center space-x-3">
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
                                    );
                                })}
                            </div>
                        </div>
                    );
                })}
            </main>
        </div>
    );
};

const TripPlannerSkeleton: React.FC = () => (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 animate-pulse">
        <aside className="lg:col-span-1">
            <div className="bg-gray-200 p-6 rounded-lg h-96"></div>
        </aside>
        <main className="lg:col-span-2 space-y-6">
            <div className="h-10 bg-gray-200 rounded w-3/4"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
            <div className="h-64 bg-gray-200 rounded-lg"></div>
        </main>
    </div>
);

const TripPlanner: React.FC<TripPlannerProps> = ({
    onGeneratePlan,
    trip,
    isLoading,
    wardrobeItems,
    cleanWardrobeItemCount,
    onSaveTripAsAlbum,
    onTryOn,
    onClearTrip,
}) => {
    const canPlan = cleanWardrobeItemCount >= 5;

    if (!canPlan) {
        return (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
                <BriefcaseIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-700">
                    Ready for an Adventure?
                </h3>
                <p className="text-gray-500 mt-2">
                    You need at least {5 - cleanWardrobeItemCount} more{' '}
                    <span className="font-bold">clean</span> item
                    {cleanWardrobeItemCount === 4 ? '' : 's'} in your wardrobe
                    to use the Trip Planner.
                </p>
            </div>
        );
    }

    if (isLoading) {
        return <TripPlannerSkeleton />;
    }

    if (!trip) {
        return <TripForm onGenerate={onGeneratePlan} isLoading={isLoading} />;
    }

    return (
        <TripPlanDisplay
            trip={trip}
            wardrobeItems={wardrobeItems}
            onSaveTripAsAlbum={onSaveTripAsAlbum}
            onTryOn={(outfit) => onTryOn(outfit, 'trip_planner')}
            onClearTrip={onClearTrip}
        />
    );
};

export default TripPlanner;

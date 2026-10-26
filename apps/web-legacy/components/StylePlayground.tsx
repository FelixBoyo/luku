import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchPlaygroundSessions,
    createPlaygroundSession,
    fetchSessionQueries,
    generateStyleQuery,
    setActiveSession,
    clearError,
    deletePlaygroundSession,
} from '../store/slices/playgroundSlice';
import { StyleQuery } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import PlusIcon from './icons/PlusIcon';
import SparklesIcon from './icons/SparklesIcon';
import RectangleStackIcon from './icons/RectangleStackIcon';

interface StylePlaygroundProps {
    onShopLook?: (styleQuery: StyleQuery) => void;
}

const StylePlayground: React.FC<StylePlaygroundProps> = ({ onShopLook }) => {
    const dispatch = useAppDispatch();
    const { session } = useAppSelector((state) => state.auth);
    const user = session?.user;
    const { sessions, activeSessionId, queries, loading, error } =
        useAppSelector((state) => state.playground);

    const [showNewSession, setShowNewSession] = useState(false);
    const [sessionTitle, setSessionTitle] = useState('');
    const [sessionDescription, setSessionDescription] = useState('');
    const [queryText, setQueryText] = useState('');
    const [selectedStyles, setSelectedStyles] = useState<string[]>([]);
    const [selectedColors, setSelectedColors] = useState<string[]>([]);
    const [occasion, setOccasion] = useState('');
    const [intensity, setIntensity] = useState(50);
    const [enlargedImage, setEnlargedImage] = useState<StyleQuery | null>(null);

    const styleOptions = [
        'Minimalist',
        'Bohemian',
        'Streetwear',
        'Vintage',
        'Formal',
        'Casual',
        'Sporty',
        'Gothic',
        'Preppy',
        'Avant-garde',
        'African',
        'Asian',
        'Western',
    ];

    const colorOptions = [
        'Black',
        'White',
        'Red',
        'Blue',
        'Green',
        'Yellow',
        'Purple',
        'Pink',
        'Orange',
        'Brown',
        'Gray',
        'Beige',
    ];

    const occasionOptions = [
        'Casual',
        'Business',
        'Formal Event',
        'Wedding',
        'Date Night',
        'Weekend',
        'Beach',
        'Party',
        'Festival',
    ];

    useEffect(() => {
        if (user) {
            dispatch(fetchPlaygroundSessions(user.id));
        }
    }, [dispatch, user]);

    useEffect(() => {
        if (activeSessionId) {
            dispatch(fetchSessionQueries(activeSessionId));
        }
    }, [dispatch, activeSessionId]);

    useEffect(() => {
        if (error) {
            const timer = setTimeout(() => {
                dispatch(clearError());
            }, 5000);
            return () => clearTimeout(timer);
        }
    }, [error, dispatch]);

    const handleCreateSession = async () => {
        if (!user || !sessionTitle.trim()) return;

        await dispatch(
            createPlaygroundSession({
                userId: user.id,
                title: sessionTitle,
                description: sessionDescription,
            })
        );

        setSessionTitle('');
        setSessionDescription('');
        setShowNewSession(false);
    };

    const handleGenerateQuery = async () => {
        if (!user || !activeSessionId || !queryText.trim()) return;

        const customizations =
            selectedStyles.length > 0 ||
            selectedColors.length > 0 ||
            occasion ||
            intensity !== 50
                ? {
                      styleFusion:
                          selectedStyles.length > 0
                              ? selectedStyles
                              : undefined,
                      colorPalette:
                          selectedColors.length > 0
                              ? selectedColors
                              : undefined,
                      occasion: occasion || undefined,
                      intensity,
                  }
                : undefined;

        await dispatch(
            generateStyleQuery({
                sessionId: activeSessionId,
                userId: user.id,
                queryText,
                customizations,
            })
        );

        // Reset form
        setQueryText('');
        setSelectedStyles([]);
        setSelectedColors([]);
        setOccasion('');
        setIntensity(50);
    };

    const handleStyleToggle = (style: string) => {
        setSelectedStyles((prev) =>
            prev.includes(style)
                ? prev.filter((s) => s !== style)
                : [...prev, style]
        );
    };

    const handleColorToggle = (color: string) => {
        setSelectedColors((prev) =>
            prev.includes(color)
                ? prev.filter((c) => c !== color)
                : [...prev, color]
        );
    };

    const handleDeleteSession = async (sessionId: string) => {
        if (confirm('Are you sure you want to delete this session?')) {
            await dispatch(deletePlaygroundSession(sessionId));
        }
    };

    const activeSession = sessions.find((s) => s.id === activeSessionId);

    return (
        <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 p-8">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                    <div>
                        <h1 className="text-4xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent mb-2">
                            Style Playground
                        </h1>
                        <p className="text-gray-600">
                            Experiment with AI-powered style fusion and
                            visualizations
                        </p>
                    </div>
                    <Button
                        onClick={() => setShowNewSession(true)}
                        className="flex items-center gap-2"
                    >
                        <PlusIcon className="w-5 h-5" />
                        New Session
                    </Button>
                </div>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg text-red-800">
                        {error}
                    </div>
                )}

                {/* New Session Modal */}
                {showNewSession && (
                    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                        <div className="bg-white rounded-2xl p-8 max-w-md w-full mx-4">
                            <h2 className="text-2xl font-bold mb-4">
                                Create New Session
                            </h2>
                            <input
                                type="text"
                                value={sessionTitle}
                                onChange={(e) =>
                                    setSessionTitle(e.target.value)
                                }
                                placeholder="Session Title"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-4"
                            />
                            <textarea
                                value={sessionDescription}
                                onChange={(e) =>
                                    setSessionDescription(e.target.value)
                                }
                                placeholder="Description (optional)"
                                className="w-full px-4 py-2 border border-gray-300 rounded-lg mb-6 resize-none"
                                rows={3}
                            />
                            <div className="flex gap-3">
                                <Button
                                    onClick={handleCreateSession}
                                    disabled={!sessionTitle.trim()}
                                    className="flex-1"
                                >
                                    Create
                                </Button>
                                <Button
                                    onClick={() => setShowNewSession(false)}
                                    variant="secondary"
                                    className="flex-1"
                                >
                                    Cancel
                                </Button>
                            </div>
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Sessions Sidebar */}
                    <div className="lg:col-span-1">
                        <div className="bg-white rounded-2xl shadow-lg p-6">
                            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
                                <RectangleStackIcon className="w-6 h-6 text-indigo-600" />
                                Sessions
                            </h2>
                            <div className="space-y-2">
                                {sessions.length === 0 ? (
                                    <p className="text-gray-500 text-sm">
                                        No sessions yet
                                    </p>
                                ) : (
                                    sessions.map((session) => (
                                        <div
                                            key={session.id}
                                            className={`p-4 rounded-lg cursor-pointer transition-all ${
                                                activeSessionId === session.id
                                                    ? 'bg-gradient-to-r from-indigo-100 to-purple-100 border-2 border-indigo-300'
                                                    : 'bg-gray-50 hover:bg-gray-100'
                                            }`}
                                        >
                                            <div
                                                onClick={() =>
                                                    dispatch(
                                                        setActiveSession(
                                                            session.id
                                                        )
                                                    )
                                                }
                                                className="flex-1"
                                            >
                                                <h3 className="font-semibold">
                                                    {session.title}
                                                </h3>
                                                {session.description && (
                                                    <p className="text-sm text-gray-600 mt-1">
                                                        {session.description}
                                                    </p>
                                                )}
                                                <p className="text-xs text-gray-500 mt-2">
                                                    {new Date(
                                                        session.updated_at
                                                    ).toLocaleDateString()}
                                                </p>
                                            </div>
                                            <button
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleDeleteSession(
                                                        session.id
                                                    );
                                                }}
                                                className="text-red-500 hover:text-red-700 text-sm mt-2"
                                            >
                                                Delete
                                            </button>
                                        </div>
                                    ))
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Main Content */}
                    <div className="lg:col-span-2">
                        {!activeSession ? (
                            <div className="bg-white rounded-2xl shadow-lg p-12 text-center">
                                <SparklesIcon className="w-16 h-16 text-gray-300 mx-auto mb-4" />
                                <h3 className="text-xl font-semibold text-gray-700 mb-2">
                                    Create or Select a Session
                                </h3>
                                <p className="text-gray-500">
                                    Start a new session to begin experimenting
                                    with style combinations
                                </p>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                {/* Query Input */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h2 className="text-xl font-bold mb-4">
                                        Create Style Query
                                    </h2>
                                    <textarea
                                        value={queryText}
                                        onChange={(e) =>
                                            setQueryText(e.target.value)
                                        }
                                        placeholder="Describe your style vision... (e.g., 'African outfit with goth influences')"
                                        className="w-full px-4 py-3 border border-gray-300 rounded-lg mb-4 resize-none"
                                        rows={3}
                                    />

                                    {/* Style Fusion */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold mb-2">
                                            Style Fusion (optional)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {styleOptions.map((style) => (
                                                <button
                                                    key={style}
                                                    onClick={() =>
                                                        handleStyleToggle(style)
                                                    }
                                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                                        selectedStyles.includes(
                                                            style
                                                        )
                                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {style}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Color Palette */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold mb-2">
                                            Color Palette (optional)
                                        </label>
                                        <div className="flex flex-wrap gap-2">
                                            {colorOptions.map((color) => (
                                                <button
                                                    key={color}
                                                    onClick={() =>
                                                        handleColorToggle(color)
                                                    }
                                                    className={`px-3 py-1.5 rounded-full text-sm transition-all ${
                                                        selectedColors.includes(
                                                            color
                                                        )
                                                            ? 'bg-gradient-to-r from-indigo-600 to-purple-600 text-white'
                                                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                                                    }`}
                                                >
                                                    {color}
                                                </button>
                                            ))}
                                        </div>
                                    </div>

                                    {/* Occasion */}
                                    <div className="mb-4">
                                        <label className="block text-sm font-semibold mb-2">
                                            Occasion (optional)
                                        </label>
                                        <select
                                            value={occasion}
                                            onChange={(e) =>
                                                setOccasion(e.target.value)
                                            }
                                            className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                                        >
                                            <option value="">
                                                Select occasion
                                            </option>
                                            {occasionOptions.map((occ) => (
                                                <option key={occ} value={occ}>
                                                    {occ}
                                                </option>
                                            ))}
                                        </select>
                                    </div>

                                    {/* Intensity Slider */}
                                    <div className="mb-6">
                                        <label className="block text-sm font-semibold mb-2">
                                            Style Intensity: {intensity}%
                                        </label>
                                        <input
                                            type="range"
                                            min="0"
                                            max="100"
                                            value={intensity}
                                            onChange={(e) =>
                                                setIntensity(
                                                    Number(e.target.value)
                                                )
                                            }
                                            className="w-full"
                                        />
                                        <div className="flex justify-between text-xs text-gray-500 mt-1">
                                            <span>Subtle</span>
                                            <span>Bold</span>
                                        </div>
                                    </div>

                                    <Button
                                        onClick={handleGenerateQuery}
                                        disabled={!queryText.trim() || loading}
                                        className="w-full flex items-center justify-center gap-2"
                                    >
                                        {loading ? (
                                            <Spinner />
                                        ) : (
                                            <>
                                                <SparklesIcon className="w-5 h-5" />
                                                Generate Visualization
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Results Gallery */}
                                <div className="bg-white rounded-2xl shadow-lg p-6">
                                    <h2 className="text-xl font-bold mb-4">
                                        Results
                                    </h2>
                                    {loading ? (
                                        <div className="flex flex-col items-center justify-center py-8">
                                            <Spinner />
                                            <p className="text-gray-500 text-sm mt-2">
                                                Generating your visualization...
                                            </p>
                                        </div>
                                    ) : queries.length === 0 ? (
                                        <p className="text-gray-500 text-center py-8">
                                            No visualizations yet. Create your
                                            first query above!
                                        </p>
                                    ) : (
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                            {queries.map((query) => (
                                                <div
                                                    key={query.id}
                                                    className="border border-gray-200 rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                                                    onClick={() =>
                                                        setEnlargedImage(query)
                                                    }
                                                >
                                                    {query.image_url && (
                                                        <img
                                                            src={
                                                                query.image_url
                                                            }
                                                            alt={
                                                                query.query_text
                                                            }
                                                            className="w-full h-64 object-cover hover:opacity-90 transition-opacity"
                                                        />
                                                    )}
                                                    <div className="p-4">
                                                        <p className="font-semibold mb-2">
                                                            {query.query_text}
                                                        </p>
                                                        <p className="text-xs text-gray-500">
                                                            {new Date(
                                                                query.created_at
                                                            ).toLocaleString()}
                                                        </p>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Image Enlargement Modal - Instagram Style */}
            {enlargedImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-95 z-50 flex items-center justify-center p-0 md:p-4"
                    onClick={() => setEnlargedImage(null)}
                >
                    <div
                        className="bg-black w-full h-full md:h-auto md:max-h-[90vh] md:rounded-lg overflow-hidden flex flex-col md:flex-row max-w-7xl shadow-2xl"
                        onClick={(e) => e.stopPropagation()}
                    >
                        {/* Left Side - Image */}
                        <div className="flex-1 bg-black flex items-center justify-center min-h-0">
                            <img
                                src={enlargedImage.image_url!}
                                alt={enlargedImage.query_text}
                                className="w-full h-full object-contain"
                            />
                        </div>

                        {/* Right Side - Details Panel */}
                        <div className="w-full md:w-96 bg-white flex flex-col max-h-[40vh] md:max-h-full">
                            {/* Header */}
                            <div className="p-4 border-b border-gray-200 flex items-start justify-between flex-shrink-0">
                                <div className="flex-1 pr-4">
                                    <h3 className="font-bold text-lg text-gray-900 line-clamp-2">
                                        {enlargedImage.query_text}
                                    </h3>
                                    <p className="text-xs text-gray-500 mt-1">
                                        {new Date(
                                            enlargedImage.created_at
                                        ).toLocaleDateString('en-US', {
                                            month: 'long',
                                            day: 'numeric',
                                            year: 'numeric',
                                            hour: '2-digit',
                                            minute: '2-digit',
                                        })}
                                    </p>
                                </div>
                                <button
                                    onClick={() => setEnlargedImage(null)}
                                    className="text-gray-600 hover:text-red-500 transition-colors flex-shrink-0"
                                    aria-label="Close"
                                >
                                    <svg
                                        className="w-6 h-6"
                                        fill="none"
                                        stroke="currentColor"
                                        viewBox="0 0 24 24"
                                    >
                                        <path
                                            strokeLinecap="round"
                                            strokeLinejoin="round"
                                            strokeWidth={2}
                                            d="M6 18L18 6M6 6l12 12"
                                        />
                                    </svg>
                                </button>
                            </div>

                            {/* Scrollable Content */}
                            <div className="flex-1 overflow-y-auto">
                                {/* AI Prompt Section */}
                                {enlargedImage.ai_prompt && (
                                    <div className="p-4 border-b border-gray-100">
                                        <h4 className="font-semibold text-sm text-gray-700 mb-2 flex items-center gap-2">
                                            <SparklesIcon className="w-4 h-4 text-purple-600" />
                                            AI Generation Prompt
                                        </h4>
                                        <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                                            {enlargedImage.ai_prompt}
                                        </p>
                                    </div>
                                )}

                                {/* Query Details Section */}
                                <div className="p-4">
                                    <h4 className="font-semibold text-sm text-gray-700 mb-3">
                                        Style Details
                                    </h4>
                                    <div className="space-y-3">
                                        <div>
                                            <p className="text-xs font-medium text-gray-500 mb-1">
                                                Original Query
                                            </p>
                                            <p className="text-sm text-gray-800">
                                                {enlargedImage.query_text}
                                            </p>
                                        </div>
                                    </div>
                                </div>

                                {/* Footer Info */}
                                <div className="p-4 bg-gray-50 flex flex-col gap-2">
                                    <p className="text-xs text-gray-500 text-center">
                                        Generated by LUKU Style Playground
                                    </p>
                                    {onShopLook && (
                                        <Button
                                            size="sm"
                                            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white"
                                            onClick={() => onShopLook(enlargedImage)}
                                        >
                                            Shop this look
                                        </Button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StylePlayground;

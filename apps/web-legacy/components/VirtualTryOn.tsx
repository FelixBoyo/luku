import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { Outfit, TryOnMode } from '../types';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchProfileImages,
    fetchMannequinSettings,
    uploadProfileImage,
    setTryOnMode,
    setSelectedImageId,
    deleteProfileImage,
    clearQueuedOutfit,
    setAutoVisualize,
    addToTryOnHistory,
} from '../store/slices/tryOnSlice';
import { generateVisualizedOutfit } from '../store/slices/featuresSlice';
import { showToast } from '../store/slices/toastSlice';
import Button from './common/Button';
import UserIcon from './icons/UserIcon';
import HeartIcon from './icons/HeartIcon';
import MannequinSettingsModal from './MannequinSettingsModal';

interface VirtualTryOnProps {
    favorites: Outfit[];
    initialOutfit: Outfit | null;
    onClearInitialOutfit: () => void;
}

const readFileAsBase64 = (
    file: File
): Promise<{ base64Image: string; mimeType: string }> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => {
            const result = reader.result as string;
            const base64Image = result.split(',')[1];
            resolve({ base64Image, mimeType: file.type });
        };
        reader.onerror = (error) => reject(error);
        reader.readAsDataURL(file);
    });
};

const VirtualTryOn: React.FC<VirtualTryOnProps> = ({
    favorites,
    initialOutfit,
    onClearInitialOutfit,
}) => {
    const dispatch = useAppDispatch();
    const { session } = useAppSelector((state) => state.auth);
    const user = session?.user;
    const { mode, profileImages, mannequinSettings, selectedImageId, queuedOutfit, autoVisualize, tryOnHistory } =
        useAppSelector((state) => state.tryOn);
    const { loading: featuresLoading, generatedTryOnImage } = useAppSelector(
        (state) => state.features
    );
    const isLoading = featuresLoading['visualizing_fit'] || false;

    const [sessionImage, setSessionImage] = useState<{
        url: string;
        file: File;
    } | null>(null);
    const [selectedOutfit, setSelectedOutfit] = useState<Outfit | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [showMannequinSettings, setShowMannequinSettings] = useState(false);
    const [hasAutoVisualized, setHasAutoVisualized] = useState(false);
    const [stylingNotes, setStylingNotes] = useState<Record<string, string>>({});

    useEffect(() => {
        if (user) {
            dispatch(fetchProfileImages(user.id));
            dispatch(fetchMannequinSettings(user.id));
        }
    }, [dispatch, user]);

    // Auto-mode selection when outfit is queued
    useEffect(() => {
        if (queuedOutfit && !hasAutoVisualized) {
            const availableModes: TryOnMode[] = [];
            
            if (mannequinSettings) {
                availableModes.push(TryOnMode.Mannequin);
            }
            if (profileImages.length > 0) {
                availableModes.push(TryOnMode.UserImage);
            }
            // NewUpload is always available
            
            // If only one mode is available, auto-select it
            if (availableModes.length === 1) {
                dispatch(setTryOnMode(availableModes[0]));
            } else if (availableModes.length === 0) {
                // No modes ready, suggest NewUpload
                dispatch(setTryOnMode(TryOnMode.NewUpload));
            }
            // If multiple modes available, keep current mode or show suggestion
        }
    }, [queuedOutfit, mannequinSettings, profileImages, hasAutoVisualized, dispatch]);

    useEffect(() => {
        if (initialOutfit) {
            setSelectedOutfit(initialOutfit);
            onClearInitialOutfit();
        }
    }, [initialOutfit, onClearInitialOutfit]);

    // Handle queued outfit from try-on buffer
    useEffect(() => {
        if (queuedOutfit) {
            // Reset auto-visualized flag when a new outfit is queued
            if (selectedOutfit?.id !== queuedOutfit.outfit.id) {
                setHasAutoVisualized(false);
            }
            setSelectedOutfit(queuedOutfit.outfit);
        }
    }, [queuedOutfit]);

    // Auto-visualize when outfit is queued and conditions are met
    useEffect(() => {
        if (!autoVisualize || !queuedOutfit || !selectedOutfit || isLoading || hasAutoVisualized) {
            return;
        }

        // Check if we have the necessary data for the current mode
        const canVisualize = 
            (mode === TryOnMode.Mannequin && mannequinSettings) ||
            (mode === TryOnMode.UserImage && selectedImageId && profileImages.length > 0) ||
            (mode === TryOnMode.NewUpload && sessionImage);

        if (canVisualize && selectedOutfit.id === queuedOutfit.outfit.id) {
            // Small delay to ensure UI is ready
            const timer = setTimeout(() => {
                // Store queuedOutfit reference before clearing for history tracking
                const queuedOutfitRef = queuedOutfit;
                handleVisualizeClick(selectedOutfit, queuedOutfitRef);
                // Clear queue after visualization starts (history is tracked in handleVisualizeClick)
                dispatch(clearQueuedOutfit());
                setHasAutoVisualized(true);
                dispatch(showToast({ 
                    type: 'success', 
                    message: 'Outfit visualization started!' 
                }));
            }, 500);

            return () => clearTimeout(timer);
        } else if (!canVisualize && selectedOutfit.id === queuedOutfit.outfit.id) {
            // Show helpful message if mode isn't ready
            let message = '';
            if (mode === TryOnMode.Mannequin) {
                message = 'Please configure mannequin settings first.';
            } else if (mode === TryOnMode.UserImage) {
                message = 'Please select a profile image first.';
            } else {
                message = 'Please upload a photo first.';
            }
            setError(message);
            dispatch(showToast({ 
                type: 'warning', 
                message 
            }));
        }
    }, [autoVisualize, queuedOutfit, selectedOutfit, mode, mannequinSettings, selectedImageId, profileImages, sessionImage, isLoading, hasAutoVisualized, dispatch]);

    // Reset auto-visualize flag when mode changes
    useEffect(() => {
        if (queuedOutfit && hasAutoVisualized) {
            dispatch(setAutoVisualize(false));
        }
    }, [mode, queuedOutfit, hasAutoVisualized, dispatch]);

    const handleImageUpload = useCallback(
        async (event: React.ChangeEvent<HTMLInputElement>) => {
            const file = event.target.files?.[0];
            if (file) {
                setSessionImage({
                    url: URL.createObjectURL(file),
                    file,
                });
                setError(null);
            }
        },
        []
    );

    const handleSaveProfileImage = useCallback(async () => {
        if (!sessionImage || !user) return;

        try {
            await dispatch(
                uploadProfileImage({
                    userId: user.id,
                    imageBlob: sessionImage.file,
                    setAsDefault: profileImages.length === 0,
                })
            ).unwrap();
            setSessionImage(null);
            dispatch(setTryOnMode(TryOnMode.UserImage));
        } catch (err) {
            setError('Failed to save profile image.');
        }
    }, [dispatch, sessionImage, profileImages.length, user]);

    const handleDeleteProfileImage = useCallback(
        async (imageId: string, imageUrl: string) => {
            if (window.confirm('Delete this profile image?')) {
                try {
                    await dispatch(
                        deleteProfileImage({ imageId, imageUrl })
                    ).unwrap();
                } catch (err) {
                    setError('Failed to delete profile image.');
                }
            }
        },
        [dispatch]
    );

    const handleVisualizeClick = async (outfit: Outfit, queuedOutfitForHistory?: typeof queuedOutfit) => {
        if (!user) return;

        setSelectedOutfit(outfit);
        setError(null);

        // Store queued outfit reference for history tracking (before async operations)
        const outfitToTrack = queuedOutfitForHistory || queuedOutfit;

        try {
            let userImage:
                | { base64Image: string; mimeType: string }
                | undefined;

            // For UserImage mode, get the selected profile image
            if (mode === TryOnMode.UserImage && selectedImageId) {
                const selectedImage = profileImages.find(
                    (img) => img.id === selectedImageId
                );
                if (!selectedImage) {
                    setError('Please select a profile image first.');
                    return;
                }
                // Fetch the image and convert to base64
                const response = await fetch(selectedImage.image_url);
                const blob = await response.blob();
                const base64Data = await readFileAsBase64(
                    new File([blob], 'profile.jpg', { type: blob.type })
                );
                userImage = base64Data;
            }

            // For NewUpload mode, use the session image
            if (mode === TryOnMode.NewUpload && sessionImage) {
                userImage = await readFileAsBase64(sessionImage.file);
            }

            // For Mannequin mode, check if settings exist
            if (mode === TryOnMode.Mannequin && !mannequinSettings) {
                setError(
                    'Please configure mannequin settings before trying on.'
                );
                return;
            }

            // Dispatch the visualization
            const result = await dispatch(
                generateVisualizedOutfit({
                    mode,
                    outfit,
                    userImage,
                    mannequinSettings: mannequinSettings || undefined,
                    stylingNotes: stylingNotes[outfit.id]?.trim() || undefined,
                })
            ).unwrap();

            // Add to history if this was a queued outfit
            if (outfitToTrack && outfitToTrack.outfit.id === outfit.id) {
                dispatch(addToTryOnHistory(outfitToTrack));
            }

            // Result is already a base64 string from the thunk
            // No need to set generatedImage as it's now in Redux state
        } catch (e: any) {
            setError(
                e.message ||
                    'Failed to generate visualization. Please try again.'
            );
        }
    };

    // Combine favorites with queued outfit if not already in favorites
    const uniqueOutfits = React.useMemo(() => {
        const outfitSet = new Map<string, Outfit>();
        favorites.forEach(outfit => outfitSet.set(outfit.id, outfit));
        if (initialOutfit) outfitSet.set(initialOutfit.id, initialOutfit);
        if (queuedOutfit) outfitSet.set(queuedOutfit.outfit.id, queuedOutfit.outfit);
        return Array.from(outfitSet.values());
    }, [favorites, initialOutfit, queuedOutfit]);

    if (uniqueOutfits.length === 0) {
        return (
            <div className="text-center py-12 bg-gray-100 rounded-lg">
                <HeartIcon className="mx-auto h-12 w-12 text-gray-400" />
                <h3 className="mt-4 text-lg font-semibold text-gray-700">
                    Favorite an Outfit to Get Started
                </h3>
                <p className="text-gray-500 mt-2">
                    Use LUKU's outfit suggestions to find looks you love, then
                    favorite them to try them on virtually.
                </p>
            </div>
        );
    }

    return (
        <div className="space-y-8">
            {/* Mode Selector */}
            <div className="bg-white p-6 rounded-xl shadow-sm border">
                <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xl font-bold text-gray-800">
                        Choose Visualization Mode
                    </h2>
                    {queuedOutfit && !hasAutoVisualized && (
                        <div className="bg-green-50 border border-green-200 rounded-lg px-3 py-2 text-sm text-green-800">
                            <span className="font-medium">Outfit queued:</span> {queuedOutfit.outfit.outfitName}
                        </div>
                    )}
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <button
                        onClick={() =>
                            dispatch(setTryOnMode(TryOnMode.UserImage))
                        }
                        className={`p-6 rounded-lg border-2 transition-all ${
                            mode === TryOnMode.UserImage
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <UserIcon
                            className={`w-12 h-12 mx-auto mb-3 ${
                                mode === TryOnMode.UserImage
                                    ? 'text-indigo-600'
                                    : 'text-gray-400'
                            }`}
                        />
                        <h3 className="font-semibold text-gray-800 mb-2">
                            My Profile Image
                        </h3>
                        <p className="text-sm text-gray-600">
                            Use your saved profile photo
                            {profileImages.length > 0
                                ? ` (${profileImages.length} available)`
                                : ''}
                        </p>
                    </button>

                    <button
                        onClick={() =>
                            dispatch(setTryOnMode(TryOnMode.NewUpload))
                        }
                        className={`p-6 rounded-lg border-2 transition-all ${
                            mode === TryOnMode.NewUpload
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <svg
                            className={`w-12 h-12 mx-auto mb-3 ${
                                mode === TryOnMode.NewUpload
                                    ? 'text-indigo-600'
                                    : 'text-gray-400'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                        </svg>
                        <h3 className="font-semibold text-gray-800 mb-2">
                            Upload New Photo
                        </h3>
                        <p className="text-sm text-gray-600">
                            Try on with a new image
                        </p>
                    </button>

                    <button
                        onClick={() =>
                            dispatch(setTryOnMode(TryOnMode.Mannequin))
                        }
                        className={`p-6 rounded-lg border-2 transition-all ${
                            mode === TryOnMode.Mannequin
                                ? 'border-indigo-600 bg-indigo-50'
                                : 'border-gray-200 hover:border-gray-300'
                        }`}
                    >
                        <svg
                            className={`w-12 h-12 mx-auto mb-3 ${
                                mode === TryOnMode.Mannequin
                                    ? 'text-indigo-600'
                                    : 'text-gray-400'
                            }`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                            />
                        </svg>
                        <h3 className="font-semibold text-gray-800 mb-2">
                            Custom Mannequin
                        </h3>
                        <p className="text-sm text-gray-600">
                            AI model with your measurements
                        </p>
                    </button>
                </div>
            </div>

            {/* Mode-Specific Controls */}
            {mode === TryOnMode.UserImage && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Select Profile Image
                    </h3>
                    {profileImages.length === 0 ? (
                        <p className="text-gray-600 text-center py-4">
                            No profile images saved. Switch to "Upload New
                            Photo" to add one.
                        </p>
                    ) : (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                            {profileImages.map((img) => (
                                <div key={img.id} className="relative">
                                    <button
                                        onClick={() =>
                                            dispatch(setSelectedImageId(img.id))
                                        }
                                        className={`relative aspect-[3/4] rounded-lg overflow-hidden border-2 transition-all w-full ${
                                            selectedImageId === img.id
                                                ? 'border-indigo-600 ring-2 ring-indigo-600'
                                                : 'border-gray-200 hover:border-gray-300'
                                        }`}
                                    >
                                        <img
                                            src={img.image_url}
                                            alt="Profile"
                                            className="w-full h-full object-cover"
                                        />
                                        {img.is_default && (
                                            <span className="absolute top-2 right-2 bg-indigo-600 text-white text-xs px-2 py-1 rounded-full">
                                                Default
                                            </span>
                                        )}
                                    </button>
                                    <button
                                        onClick={() =>
                                            handleDeleteProfileImage(
                                                img.id,
                                                img.image_url
                                            )
                                        }
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 transition-colors"
                                        title="Delete image"
                                    >
                                        <svg
                                            className="w-4 h-4"
                                            fill="none"
                                            viewBox="0 0 24 24"
                                            stroke="currentColor"
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
                            ))}
                        </div>
                    )}
                </div>
            )}

            {mode === TryOnMode.NewUpload && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Upload Your Photo
                    </h3>
                    {!sessionImage ? (
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                            <input
                                type="file"
                                id="new-photo-upload"
                                className="hidden"
                                accept="image/png, image/jpeg"
                                onChange={handleImageUpload}
                            />
                            <Button
                                onClick={() =>
                                    document
                                        .getElementById('new-photo-upload')
                                        ?.click()
                                }
                            >
                                Choose Photo
                            </Button>
                            <p className="text-sm text-gray-500 mt-4">
                                For best results: full-body photo, good
                                lighting, simple background
                            </p>
                        </div>
                    ) : (
                        <div className="space-y-4">
                            <img
                                src={sessionImage.url}
                                alt="Uploaded"
                                className="max-h-96 mx-auto rounded-lg"
                            />
                            <div className="flex gap-4 justify-center">
                                <Button
                                    variant="secondary"
                                    onClick={() => setSessionImage(null)}
                                >
                                    Use Different Photo
                                </Button>
                                <Button onClick={handleSaveProfileImage}>
                                    Save to Profile
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            )}

            {mode === TryOnMode.Mannequin && (
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Mannequin Settings
                        </h3>
                        <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => setShowMannequinSettings(true)}
                        >
                            Customize
                        </Button>
                    </div>
                    {mannequinSettings ? (
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-600">Body Type</p>
                                <p className="font-semibold capitalize">
                                    {mannequinSettings.body_type}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-600">Height</p>
                                <p className="font-semibold">
                                    {mannequinSettings.height_cm}cm
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-600">Skin Tone</p>
                                <p className="font-semibold capitalize">
                                    {mannequinSettings.skin_tone}
                                </p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                                <p className="text-gray-600">Measurements</p>
                                <p className="font-semibold">
                                    {mannequinSettings.chest_cm || '-'}/
                                    {mannequinSettings.waist_cm || '-'}/
                                    {mannequinSettings.hips_cm || '-'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        <p className="text-gray-600 text-center py-4">
                            No mannequin settings configured.{' '}
                            <button
                                onClick={() => setShowMannequinSettings(true)}
                                className="text-indigo-600 hover:underline"
                            >
                                Set up now
                            </button>
                        </p>
                    )}
                </div>
            )}

            {/* Visualization Area */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Left: Generated Image */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Your Virtual Try-On
                    </h3>
                    {isLoading ? (
                        <div className="aspect-[3/4] bg-gray-200 rounded-lg animate-pulse flex items-center justify-center">
                            <p className="text-gray-500 font-semibold">
                                Generating visualization...
                            </p>
                        </div>
                    ) : generatedTryOnImage ? (
                        <>
                            <img
                                src={`data:image/jpeg;base64,${generatedTryOnImage}`}
                                alt="Virtual try-on result"
                                className="w-full rounded-lg"
                            />
                            {selectedOutfit &&
                                stylingNotes[selectedOutfit.id] &&
                                stylingNotes[selectedOutfit.id].trim().length >
                                    0 && (
                                    <p className="mt-2 text-xs text-gray-500">
                                        Styling instructions used:{' '}
                                        <span className="italic">
                                            "
                                            {stylingNotes[
                                                selectedOutfit.id
                                            ].trim()}
                                            "
                                        </span>
                                    </p>
                                )}
                        </>
                    ) : (
                        <div className="aspect-[3/4] bg-gray-100 border-2 border-dashed rounded-lg flex items-center justify-center">
                            <p className="text-gray-500">
                                Select an outfit to visualize
                            </p>
                        </div>
                    )}
                </div>

                {/* Right: Outfit Selection */}
                <div className="bg-white p-6 rounded-xl shadow-sm border">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Select Outfit
                    </h3>
                    <div className="space-y-4 max-h-[600px] overflow-y-auto">
                        {uniqueOutfits.map((outfit) => (
                            <div
                                key={outfit.id}
                                className={`p-4 rounded-lg border-2 transition-all ${
                                    selectedOutfit?.id === outfit.id
                                        ? 'border-indigo-600 bg-indigo-50'
                                        : 'border-gray-200 hover:border-gray-300'
                                }`}
                            >
                                <div className="flex justify-between items-start mb-3">
                                    <div>
                                        <h4 className="font-semibold text-gray-800">
                                            {outfit.outfitName}
                                        </h4>
                                        <p className="text-sm text-gray-600">
                                            {outfit.description}
                                        </p>
                                    </div>
                                    <Button
                                        size="sm"
                                        onClick={() =>
                                            handleVisualizeClick(outfit)
                                        }
                                        isLoading={
                                            isLoading &&
                                            selectedOutfit?.id === outfit.id
                                        }
                                        disabled={isLoading}
                                    >
                                        Try On
                                    </Button>
                                </div>
                                <div className="flex gap-2">
                                    {outfit.items.slice(0, 5).map((item) => (
                                        <img
                                            key={item.id}
                                            src={item.imageUrl}
                                            alt={item.name}
                                            className="w-12 h-12 object-cover rounded-md"
                                        />
                                    ))}
                                </div>
                                    <div className="mt-3">
                                        <label className="block text-xs font-semibold text-gray-700 mb-1">
                                            How would you like to style this outfit?
                                        </label>
                                        <textarea
                                            value={stylingNotes[outfit.id] || ''}
                                            onChange={(e) =>
                                                setStylingNotes((prev) => ({
                                                    ...prev,
                                                    [outfit.id]: e.target.value,
                                                }))
                                            }
                                            rows={2}
                                            placeholder="e.g., shirt half-tucked, sleeves rolled, jacket open..."
                                            className="w-full text-xs border border-gray-300 rounded-md px-2 py-1 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 resize-none"
                                        />
                                    </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 text-red-800 p-4 rounded-lg">
                    {error}
                </div>
            )}

            {/* Mannequin Settings Modal */}
            {showMannequinSettings && user && (
                <MannequinSettingsModal
                    onClose={() => setShowMannequinSettings(false)}
                    currentSettings={mannequinSettings}
                    userId={user.id}
                />
            )}
        </div>
    );
};

export default VirtualTryOn;

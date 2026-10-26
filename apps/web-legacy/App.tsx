import React, { useCallback, useMemo, useEffect, useState } from 'react';
import type { Session } from '@supabase/supabase-js';
import { ENABLE_DEV_BYPASS } from './services/supabaseClient';
import { useAppDispatch, useAppSelector } from './store/hooks';
import {
    checkUserSession,
    signOutUser,
    setSession,
} from './store/slices/authSlice';
import { fetchBusinessAccount } from './store/slices/businessSlice';
import {
    fetchWardrobeItems,
    addClothingItem,
    updateItemStatus,
    deleteClothingItem,
    finishLaundry,
} from './store/slices/wardrobeSlice';
import {
    fetchAlbums,
    createAlbum,
    saveOutfitToAlbum,
    removeOutfitFromAlbum,
} from './store/slices/albumsSlice';
import {
    fetchLatestTrip,
    generateAndSaveTripPlan,
    clearTrip,
} from './store/slices/tripsSlice';
import {
    generateOutfitSuggestions,
    fetchFashionTrends,
    analyzeUserStyle,
    fetchBudgetSuggestions,
    analyzeColorHarmony,
    analyzeSustainability,
    generateOutfitOfTheDay,
    fetchStyleGuidance,
    generateVisualizedOutfit,
    clearColorAnalysis,
    updateOutfitFeedback,
    updateTrendOutfitFeedback,
} from './store/slices/featuresSlice';

import { ClothingItem, Outfit, Tab, Trip, Album, Product, StyleQuery } from './types';

import Header from './components/Header';
import WardrobeGrid from './components/WardrobeGrid';
import OutfitSuggestions from './components/OutfitSuggestions';
import Albums from './components/Albums';
import FashionTrends from './components/FashionTrends';
import StyleEvolution from './components/StyleEvolution';
import ColorHarmony from './components/ColorHarmony';
import TripPlanner from './components/TripPlanner';
import VirtualTryOn from './components/VirtualTryOn';
import LifestyleHub from './components/LifestyleHub';
import StylePlayground from './components/StylePlayground';
import Auth from './components/Auth';
import BusinessAuth from './components/BusinessAuth';
import PasswordReset from './components/PasswordReset';
import Spinner from './components/common/Spinner';
import DevBypassBanner from './components/DevBypassBanner';
import Marketplace from './components/Marketplace';
import SellerDashboard from './components/SellerDashboard';
import Discover from './components/Discover';
import MobileBottomNav from './components/MobileBottomNav';
import CartSidebar from './components/CartSidebar';
import UserEngagementAnalytics from './components/UserEngagementAnalytics';
import WishlistPage from './components/WishlistPage';
import MyOrders from './components/MyOrders';
import ReturnManagement from './components/ReturnManagement';
import ToastContainer from './components/common/Toast';
import { layout, colors } from '@core/theme/tokens';
import { queueOutfitForTryOn } from './store/slices/tryOnSlice';
import { showToast } from './store/slices/toastSlice';
import { completeHubOnboarding } from './store/slices/uiOnboardingSlice';
import { logEvent } from './store/slices/userEngagementSlice';
import { trackEvent } from './analytics/events';
import SaveOutfitModal from './components/SaveOutfitModal';

const App: React.FC = () => {
    const dispatch = useAppDispatch();
    const isBusinessPortal = window.location.pathname.startsWith('/business');
    const { session, loading: authLoading } = useAppSelector(
        (state) => state.auth
    );
    const { items: wardrobeItems, loading: wardrobeLoadingStatus } =
        useAppSelector((state) => state.wardrobe);
    const { albums } = useAppSelector((state) => state.albums);
    const { trip, loading: tripsLoading } = useAppSelector(
        (state) => state.trips
    );
    const {
        loading: featuresLoading,
        error: featuresError,
        ...featuresState
    } = useAppSelector((state) => state.features);
    const { currentBusiness } = useAppSelector((state) => state.business);
    const { hasCompletedHubOnboarding } = useAppSelector(
        (state) => state.uiOnboarding
    );

    const [activeTab, setActiveTab] = useState<Tab>(Tab.LifestyleHub);
    const [selectedStyle, setSelectedStyle] = useState<string>('Casual');
    const [customPrompt, setCustomPrompt] = useState<string>('');
    const [outfitForTryOn, setOutfitForTryOn] = useState<Outfit | null>(null);
    const [globalError, setGlobalError] = useState<string | null>(null);
    const [isCartOpen, setIsCartOpen] = useState(false);
    const [productToView, setProductToView] = useState<Product | null>(null);
    const [albumGeneration, setAlbumGeneration] = useState<{
        albumId: string;
        outfits: Outfit[];
    } | null>(null);
    const [outfitToSave, setOutfitToSave] = useState<Outfit | null>(null);
    const [marketplaceSearchSeed, setMarketplaceSearchSeed] = useState<string | null>(null);

    useEffect(() => {
        setGlobalError(featuresError);
    }, [featuresError]);

    useEffect(() => {
        if (ENABLE_DEV_BYPASS) return;
        dispatch(checkUserSession());
        
        // Check for password reset token in URL hash
        const hashParams = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = hashParams.get('access_token');
        const type = hashParams.get('type');
        
        if (type === 'recovery' && accessToken) {
            // User is coming from password reset email
            // Update URL to /reset-password for cleaner routing
            window.history.replaceState({}, '', '/reset-password');
        }
    }, [dispatch]);

    // Fetch initial data once the user is logged in
    useEffect(() => {
        if (session) {
            dispatch(fetchWardrobeItems());
            dispatch(fetchAlbums());
            dispatch(fetchLatestTrip());
            dispatch(fetchBusinessAccount());
        }
    }, [session, dispatch]);

    const handleSignOut = async () => {
        if (ENABLE_DEV_BYPASS) {
            window.location.reload();
            return;
        }
        dispatch(signOutUser());
    };

    const handleTryOnOutfit = useCallback((outfit: Outfit, source: string = 'unknown') => {
        dispatch(queueOutfitForTryOn({ outfit, source }));
        setOutfitForTryOn(outfit); // Keep for backward compatibility
        setActiveTab(Tab.VirtualTryOn);
        dispatch(showToast({ 
            type: 'success', 
            message: 'Outfit queued for try-on!' 
        }));
    }, [dispatch]);

    const handleImagesUpload = useCallback(
        (images: { base64Image: string; mimeType: string }[]) => {
            dispatch(addClothingItem(images));
        },
        [dispatch]
    );

    // FIX: Inferred type was `unknown[]` causing a type error. Explicitly setting the return type to `Outfit[]` resolves this.
    const allSavedOutfits = useMemo((): Outfit[] => {
        const allOutfits = albums.flatMap((album) => album.outfits);
        // FIX: Explicitly type the Map constructor to fix a TypeScript type inference issue.
        return Array.from(
            new Map<string, Outfit>(allOutfits.map((o) => [o.id, o])).values()
        );
    }, [albums]);

    const wardrobeItemsWithUseCount = useMemo(() => {
        const usageMap = new Map<string, number>();
        allSavedOutfits.forEach((outfit) => {
            outfit.items.forEach((item) => {
                usageMap.set(item.id, (usageMap.get(item.id) || 0) + 1);
            });
        });
        return wardrobeItems.map((item) => ({
            ...item,
            useCount: usageMap.get(item.id) || 0,
        }));
    }, [wardrobeItems, allSavedOutfits]);

    const cleanWardrobeItems = useMemo(
        () => wardrobeItems.filter((item) => item.status === 'clean'),
        [wardrobeItems]
    );

    const laundryStatusCounts = useMemo(() => {
        return wardrobeItems.reduce(
            (acc, item) => {
                if (item.status === 'in wash') acc.inWash++;
                else if (item.status === 'dirty') acc.dirty++;
                return acc;
            },
            { inWash: 0, dirty: 0 }
        );
    }, [wardrobeItems]);

    const handleUpdateItemStatus = useCallback(
        (itemId: string, status: ClothingItem['status']) => {
            dispatch(updateItemStatus({ itemId, status }));
        },
        [dispatch]
    );

    const handleFinishLaundry = useCallback(() => {
        dispatch(finishLaundry());
        // Here you might want to dispatch a thunk to batch update statuses in Supabase
    }, [dispatch]);

    const handleDeleteItem = useCallback(
        (itemId: string) => {
            const affectedOutfits = allSavedOutfits.filter((outfit) =>
                outfit.items.some((item) => item.id === itemId)
            );

            if (affectedOutfits.length > 0) {
                const outfitNames = affectedOutfits
                    .map((o) => o.outfitName)
                    .slice(0, 3)
                    .join(', ');
                const moreText =
                    affectedOutfits.length > 3
                        ? ` and ${affectedOutfits.length - 3} more`
                        : '';

                const confirmed = window.confirm(
                    `This item is used in ${affectedOutfits.length} outfit(s): ${outfitNames}${moreText}\n\n` +
                        `Deleting it will remove it from these outfits, but the outfits will remain. ` +
                        `Continue?`
                );

                if (!confirmed) return;
            }

            dispatch(deleteClothingItem(itemId));

            // Refresh albums to reflect changes in outfits
            dispatch(fetchAlbums());
        },
        [dispatch, allSavedOutfits]
    );

    const handleGenerateOutfits = useCallback(() => {
        dispatch(
            logEvent({
                type: 'outfit_generated',
                payload: {
                    source: 'wardrobe',
                    style: selectedStyle,
                    hasCustomPrompt: !!customPrompt.trim(),
                },
            })
        );
        dispatch(
            generateOutfitSuggestions({
                items: cleanWardrobeItems,
                stylePreference: selectedStyle,
                customPrompt,
                previousSuggestions: featuresState.outfitSuggestions,
            })
        );
        setActiveTab(Tab.Suggestions);
    }, [
        dispatch,
        cleanWardrobeItems,
        selectedStyle,
        customPrompt,
        featuresState.outfitSuggestions,
    ]);

    const handleFetchTrends = useCallback(() => {
        dispatch(
            logEvent({
                type: 'trends_requested',
                payload: { cleanWardrobeItemCount: cleanWardrobeItems.length },
            })
        );
        dispatch(fetchFashionTrends(cleanWardrobeItems));
    }, [dispatch, cleanWardrobeItems]);

    const handleAnalyzeStyle = useCallback(() => {
        if (allSavedOutfits.length < 3) {
            setGlobalError(
                'You need to save at least 3 outfits for a style analysis.'
            );
            return;
        }
        dispatch(
            logEvent({
                type: 'style_analysis_requested',
                payload: { favoriteOutfitCount: allSavedOutfits.length },
            })
        );
        dispatch(
            analyzeUserStyle({
                wardrobeItems,
                favoriteOutfits: allSavedOutfits,
            })
        );
    }, [dispatch, wardrobeItems, allSavedOutfits]);

    const handleFetchBudgetSuggestions = useCallback(() => {
        dispatch(
            logEvent({
                type: 'budget_suggestions_requested',
                payload: { cleanWardrobeItemCount: cleanWardrobeItems.length },
            })
        );
        dispatch(fetchBudgetSuggestions(cleanWardrobeItems));
    }, [dispatch, cleanWardrobeItems]);

    const handleGetColorAnalysis = useCallback(
        (baseItem: ClothingItem) => {
            dispatch(
                logEvent({
                    type: 'color_analysis_requested',
                    payload: { baseItemId: baseItem.id },
                })
            );
            dispatch(
                analyzeColorHarmony({ baseItem, allItems: cleanWardrobeItems })
            );
        },
        [dispatch, cleanWardrobeItems]
    );

    const handleGetSustainabilityInsights = useCallback(() => {
        dispatch(
            logEvent({
                type: 'sustainability_insights_requested',
                payload: { wardrobeItemCount: wardrobeItems.length },
            })
        );
        dispatch(
            analyzeSustainability({
                allItems: wardrobeItems,
                cleanItems: cleanWardrobeItems,
            })
        );
    }, [dispatch, wardrobeItems, cleanWardrobeItems]);

    const handleGenerateTripPlan = useCallback(
        (details: any) => {
            dispatch(
                logEvent({
                    type: 'trip_plan_generated',
                    payload: { hasDetails: !!details },
                })
            );
            dispatch(generateAndSaveTripPlan({ details, cleanWardrobeItems }));
        },
        [dispatch, cleanWardrobeItems]
    );

    const handleGetOutfitOfTheDay = useCallback(() => {
        dispatch(
            logEvent({
                type: 'outfit_of_the_day_requested',
                payload: { cleanWardrobeItemCount: cleanWardrobeItems.length },
            })
        );
        dispatch(generateOutfitOfTheDay(cleanWardrobeItems));
    }, [dispatch, cleanWardrobeItems]);

    const handleFetchStyleGuidance = useCallback(() => {
        dispatch(fetchStyleGuidance(wardrobeItems));
    }, [dispatch, wardrobeItems]);

    const handleFavorite = useCallback((outfit: Outfit) => {
        setOutfitToSave(outfit);
    }, []);

    const handleSaveOutfitToAlbum = useCallback(
        async (albumId: string) => {
            if (!outfitToSave) return;

            dispatch(
                logEvent({
                    type: 'outfit_favorited',
                    payload: { outfitId: outfitToSave.id, albumId },
                })
            );
            dispatch(saveOutfitToAlbum({ outfit: outfitToSave, albumId }));
            setOutfitToSave(null);
        },
        [dispatch, outfitToSave]
    );

    const handleCreateAlbumAndSave = useCallback(
        async (name: string) => {
            if (!outfitToSave) return;

            // Reuse existing album if name already exists (case-insensitive)
            let targetAlbum = albums.find(
                (album) => album.name.toLowerCase() === name.toLowerCase()
            );

            if (!targetAlbum) {
                const resultAction = await dispatch(createAlbum(name));
                if (createAlbum.fulfilled.match(resultAction)) {
                    targetAlbum = resultAction.payload as Album;
                } else {
                    setGlobalError('Failed to create mood board.');
                    return;
                }
            }

            dispatch(
                logEvent({
                    type: 'outfit_favorited',
                    payload: {
                        outfitId: outfitToSave.id,
                        albumId: targetAlbum.id,
                    },
                })
            );
            dispatch(
                saveOutfitToAlbum({
                    outfit: outfitToSave,
                    albumId: targetAlbum.id,
                })
            );
            setOutfitToSave(null);
        },
        [dispatch, albums, outfitToSave]
    );

    const handleRemoveFromAlbum = useCallback(
        (outfitId: string, albumId: string) => {
            dispatch(removeOutfitFromAlbum({ outfitId, albumId }));
        },
        [dispatch]
    );

    const handleCreateAlbum = useCallback(
        (name: string) => {
            if (
                albums.some(
                    (album) => album.name.toLowerCase() === name.toLowerCase()
                )
            ) {
                setGlobalError('An album with this name already exists.');
                return;
            }
            dispatch(
                logEvent({
                    type: 'album_created',
                    payload: { name },
                })
            );
            dispatch(createAlbum(name));
        },
        [dispatch, albums]
    );

    const handleClearTrip = useCallback(() => {
        dispatch(clearTrip());
    }, [dispatch]);

    const handleSaveTripAsAlbum = useCallback(
        async (trip: Trip) => {
            if (!trip.plan) return;
            const albumName = trip.name || `Trip to ${trip.destination}`;
            const createAlbumAction = await dispatch(createAlbum(albumName));
            if (!createAlbum.fulfilled.match(createAlbumAction)) {
                setGlobalError('Failed to create album. Please try again.');
                return;
            }
            const newAlbum = createAlbumAction.payload as Album;
            const allOutfits: Outfit[] = [];
            trip.plan.dailyPlans.forEach((dayPlan) => {
                dayPlan.outfits.forEach((outfit) => {
                    allOutfits.push(outfit);
                });
            });
            for (const outfit of allOutfits) {
                try {
                    await dispatch(saveOutfitToAlbum({ outfit, albumId: newAlbum.id })).unwrap();
                } catch (error) {
                    console.error('Failed to save outfit:', error);
                }
            }
            dispatch(
                logEvent({
                    type: 'trip_saved_as_album',
                    payload: { tripId: trip.id, albumId: newAlbum.id, outfitCount: allOutfits.length },
                })
            );
            setActiveTab(Tab.Albums);
            dispatch(clearTrip());
        },
        [dispatch]
    );

    const handleGenerateFromAlbum = useCallback(
        async (album: Album) => {
            const itemsMap = new Map<string, ClothingItem>();
            album.outfits.forEach((outfit) => {
                outfit.items.forEach((item) => {
                    itemsMap.set(item.id, item);
                });
            });

            const items = Array.from(itemsMap.values());
            if (items.length < 2) {
                setGlobalError(
                    'Need at least 2 items in this mood board to generate new outfits.'
                );
                return;
            }

            try {
                const action = await dispatch(
                    generateOutfitSuggestions({
                        items,
                        stylePreference: selectedStyle,
                        customPrompt,
                        previousSuggestions: [],
                    })
                );

                if (generateOutfitSuggestions.fulfilled.match(action)) {
                    setAlbumGeneration({
                        albumId: album.id,
                        outfits: action.payload as Outfit[],
                    });
                } else {
                    setGlobalError(
                        'Failed to generate outfits from this mood board.'
                    );
                }
            } catch (e: any) {
                setGlobalError(
                    e?.message ||
                        'Failed to generate outfits from this mood board.'
                );
            }
        },
        [dispatch, selectedStyle, customPrompt]
    );

    const handleOutfitFeedback = (
        outfitId: string,
        feedback: 'liked' | 'disliked'
    ) => dispatch(updateOutfitFeedback({ outfitId, feedback }));
    const handleTrendOutfitFeedback = (
        outfitId: string,
        feedback: 'liked' | 'disliked'
    ) => dispatch(updateTrendOutfitFeedback({ outfitId, feedback }));
    
    const handleProductClick = useCallback((product: Product) => {
        setProductToView(product);
        setActiveTab(Tab.Marketplace);
    }, []);

    const handleShopStyleLook = useCallback(
        (styleQuery: StyleQuery) => {
            const seed =
                styleQuery.query_text?.trim() ||
                styleQuery.ai_prompt?.slice(0, 140) ||
                '';
            setMarketplaceSearchSeed(seed);
            setActiveTab(Tab.Marketplace);
        },
        []
    );

    // Track Discover tab opens as engagement events
    useEffect(() => {
        if (activeTab === Tab.Discover && session) {
            trackEvent('discover_tab_opened', {
                entryPoint: 'navigation_tab',
                userTenureDays: null,
            });
        }
    }, [activeTab, session]);

    // Helper to check if an outfit is favorited
    const isOutfitFavorited = useCallback(
        (outfitId: string) => {
            return allSavedOutfits.some(
                (savedOutfit) => savedOutfit.id === outfitId
            );
        },
        [allSavedOutfits]
    );

    const renderContent = () => {
        switch (activeTab) {
            case Tab.LifestyleHub:
                return (
                    <LifestyleHub
                        wardrobeItems={wardrobeItemsWithUseCount}
                        sustainabilityInsights={
                            featuresState.sustainabilityInsights
                        }
                        onAnalyzeSustainability={
                            handleGetSustainabilityInsights
                        }
                        outfitOfTheDay={featuresState.outfitOfTheDay}
                        onGetOutfitOfTheDay={handleGetOutfitOfTheDay}
                        onFavorite={handleFavorite}
                        laundryStatusCounts={laundryStatusCounts}
                        onFinishLaundry={handleFinishLaundry}
                        suggestions={featuresState.budgetSuggestions}
                        onFetchSuggestions={handleFetchBudgetSuggestions}
                        content={featuresState.styleSanctuaryContent}
                        onFetchGuidance={handleFetchStyleGuidance}
                        isLoading={
                            Object.keys(featuresLoading).find(
                                (k) => featuresLoading[k]
                            ) || null
                        }
                        onTryOn={handleTryOnOutfit}
                        onNavigateToDiscover={() => setActiveTab(Tab.Discover)}
                        onNavigateToMoodBoards={() => setActiveTab(Tab.Albums)}
                        onNavigateToWardrobe={() => setActiveTab(Tab.Wardrobe)}
                        onNavigateToOutfitSuggestions={() =>
                            setActiveTab(Tab.Suggestions)
                        }
                        showOnboardingBanner={!hasCompletedHubOnboarding}
                        onDismissOnboarding={() =>
                            dispatch(completeHubOnboarding())
                        }
                        isOutfitFavorited={isOutfitFavorited}
                    />
                );
            case Tab.Wardrobe:
                return (
                    <WardrobeGrid
                        items={wardrobeItemsWithUseCount}
                        onImagesUpload={handleImagesUpload}
                        isLoading={wardrobeLoadingStatus === 'pending'}
                        onUpdateItemStatus={handleUpdateItemStatus}
                        onDeleteItem={handleDeleteItem}
                        onNavigateToMoodBoards={() => setActiveTab(Tab.Albums)}
                    />
                );
            case Tab.Suggestions:
                return (
                    <OutfitSuggestions
                        outfits={featuresState.outfitSuggestions}
                        onGenerate={handleGenerateOutfits}
                        onFavorite={handleFavorite}
                        onOutfitFeedback={handleOutfitFeedback}
                        isLoading={featuresLoading['generating_outfits']}
                        wardrobeItemCount={cleanWardrobeItems.length}
                        selectedStyle={selectedStyle}
                        onStyleChange={setSelectedStyle}
                        customPrompt={customPrompt}
                        onCustomPromptChange={setCustomPrompt}
                        onTryOn={handleTryOnOutfit}
                        isOutfitFavorited={isOutfitFavorited}
                        onProductClick={handleProductClick}
                    />
                );
            case Tab.Trends:
                return (
                    <FashionTrends
                        trends={featuresState.fashionTrends}
                        onFetchTrends={handleFetchTrends}
                        onFavorite={handleFavorite}
                        onOutfitFeedback={handleTrendOutfitFeedback}
                        isLoading={featuresLoading['fetching_trends']}
                        wardrobeItemCount={cleanWardrobeItems.length}
                        onTryOn={handleTryOnOutfit}
                        isOutfitFavorited={isOutfitFavorited}
                        onProductClick={handleProductClick}
                    />
                );
            case Tab.Evolution:
                return (
                    <StyleEvolution
                        favorites={allSavedOutfits}
                        onAnalyze={handleAnalyzeStyle}
                        analysis={featuresState.styleAnalysis}
                        isLoading={featuresLoading['analyzing_style']}
                    />
                );
            case Tab.ColorHarmony:
                return (
                    <ColorHarmony
                        wardrobeItems={cleanWardrobeItems}
                        onAnalyze={handleGetColorAnalysis}
                        analysis={featuresState.colorAnalysis}
                        isLoading={featuresLoading['analyzing_colors']}
                        onClear={() => dispatch(clearColorAnalysis())}
                        onFavorite={handleFavorite}
                        onTryOn={handleTryOnOutfit}
                    />
                );
            case Tab.TripPlanner:
                return (
                    <TripPlanner
                        onGeneratePlan={handleGenerateTripPlan}
                        trip={trip}
                        isLoading={tripsLoading === 'pending'}
                        wardrobeItems={wardrobeItems}
                        cleanWardrobeItemCount={cleanWardrobeItems.length}
                        onSaveTripAsAlbum={handleSaveTripAsAlbum}
                        onTryOn={handleTryOnOutfit}
                        onClearTrip={handleClearTrip}
                    />
                );
            case Tab.VirtualTryOn:
                return (
                    <VirtualTryOn
                        favorites={allSavedOutfits}
                        initialOutfit={outfitForTryOn}
                        onClearInitialOutfit={() => setOutfitForTryOn(null)}
                    />
                );
            case Tab.StylePlayground:
                return <StylePlayground onShopLook={handleShopStyleLook} />;
            case Tab.Albums:
                return (
                    <Albums
                        albums={albums}
                        onCreateAlbum={handleCreateAlbum}
                        onRemoveOutfit={handleRemoveFromAlbum}
                        onTryOn={handleTryOnOutfit}
                        onNavigateToOutfitSuggestions={() =>
                            setActiveTab(Tab.Suggestions)
                        }
                        onProductClick={handleProductClick}
                        onGenerateFromAlbum={handleGenerateFromAlbum}
                        generatedAlbumOutfits={albumGeneration}
                    />
                );
            case Tab.Marketplace:
                return (
                    <Marketplace 
                        initialProduct={productToView}
                        onProductView={() => {
                            setProductToView(null);
                        }}
                        onTabChange={setActiveTab}
                        initialSearch={marketplaceSearchSeed || undefined}
                    />
                );
            case Tab.Discover:
                return (
                    <Discover
                        outfits={featuresState.outfitSuggestions}
                        onGenerate={handleGenerateOutfits}
                        onFavorite={handleFavorite}
                        onOutfitFeedback={handleOutfitFeedback}
                        onTryOn={handleTryOnOutfit}
                        isLoadingOutfits={featuresLoading['generating_outfits']}
                        wardrobeItemCount={cleanWardrobeItems.length}
                        selectedStyle={selectedStyle}
                        onStyleChange={setSelectedStyle}
                        customPrompt={customPrompt}
                        onCustomPromptChange={setCustomPrompt}
                        isOutfitFavorited={isOutfitFavorited}
                        trends={featuresState.fashionTrends}
                        onFetchTrends={handleFetchTrends}
                        onTrendOutfitFeedback={handleTrendOutfitFeedback}
                        isLoadingTrends={featuresLoading['fetching_trends']}
                        favorites={allSavedOutfits}
                        onAnalyze={handleAnalyzeStyle}
                        analysis={featuresState.styleAnalysis}
                        isLoadingAnalysis={featuresLoading['analyzing_style']}
                        onProductClick={handleProductClick}
                        onNavigateToMoodBoards={() => setActiveTab(Tab.Albums)}
                    />
                );
            case Tab.SellerDashboard:
                return <SellerDashboard onTabChange={setActiveTab} />;
            case Tab.UserAnalytics:
                return <UserEngagementAnalytics />;
            case Tab.Wishlist:
                return <WishlistPage onNavigateToMarketplace={() => setActiveTab(Tab.Marketplace)} />;
            case Tab.MyOrders:
                return <MyOrders onNavigateToMarketplace={() => setActiveTab(Tab.Marketplace)} />;
            case Tab.Returns:
                return <ReturnManagement />;
            default:
                return null;
        }
    };

    const renderAppBody = (currentSession: Session) => (
        <div className={`min-h-screen ${colors.background.app} font-sans`}>
            {ENABLE_DEV_BYPASS && <DevBypassBanner />}
            <Header 
                session={currentSession} 
                onSignOut={handleSignOut}
                onCartClick={() => setIsCartOpen(true)}
                onWishlistClick={() => setActiveTab(Tab.Wishlist)}
                activeTab={activeTab}
                onTabChange={setActiveTab}
            />
            <CartSidebar
                isOpen={isCartOpen}
                onClose={() => setIsCartOpen(false)}
                onCheckout={(product, quantity) => {
                    setIsCartOpen(false);
                    // Navigate to checkout or show checkout modal
                    console.log('Checkout:', product, quantity);
                }}
            />
            <main className={`${layout.container} ${layout.pagePaddingY} pb-24`}>
                {globalError && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6"
                        role="alert"
                    >
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{globalError}</span>
                        <button
                            onClick={() => setGlobalError(null)}
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        >
                            <span className="text-2xl" aria-hidden="true">
                                &times;
                            </span>
                        </button>
                    </div>
                )}

                {renderContent()}

                {outfitToSave && (
                    <SaveOutfitModal
                        outfit={outfitToSave}
                        albums={albums}
                        onSaveToAlbum={handleSaveOutfitToAlbum}
                        onCreateAndSaveAlbum={handleCreateAlbumAndSave}
                        onClose={() => setOutfitToSave(null)}
                    />
                )}
            </main>
            <MobileBottomNav
                activeTab={activeTab}
                onTabChange={setActiveTab}
                wardrobeItemCount={wardrobeItems.length}
                albumsCount={allSavedOutfits.length}
                hasBusinessAccount={!!currentBusiness}
            />
        </div>
    );

    const renderBusinessAppBody = (currentSession: Session) => (
        <div className={`min-h-screen ${colors.background.app} font-sans`}>
            {ENABLE_DEV_BYPASS && <DevBypassBanner />}
            <Header
                session={currentSession}
                onSignOut={handleSignOut}
                onCartClick={() => {}}
                showCart={false}
                showWishlist={false}
            />
            <main className={`${layout.container} ${layout.pagePaddingY}`}>
                {globalError && (
                    <div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-md relative mb-6"
                        role="alert"
                    >
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{globalError}</span>
                        <button
                            onClick={() => setGlobalError(null)}
                            className="absolute top-0 bottom-0 right-0 px-4 py-3"
                        >
                            <span className="text-2xl" aria-hidden="true">
                                &times;
                            </span>
                        </button>
                    </div>
                )}

                <SellerDashboard onTabChange={setActiveTab} />
            </main>
        </div>
    );

    if (ENABLE_DEV_BYPASS) {
        const mockSession: Session = {
            access_token: 'mock-token',
            token_type: 'bearer',
            user: {
                id: 'mock-user-id',
                app_metadata: {},
                user_metadata: {},
                aud: 'authenticated',
                created_at: new Date().toISOString(),
                email: 'dev.user@example.com',
            },
            refresh_token: 'mock-refresh-token',
            expires_in: 3600,
            expires_at: Math.floor(Date.now() / 1000) + 3600,
        };
        // Set the session in Redux store for bypass mode
        useEffect(() => {
            dispatch(setSession(mockSession));
        }, [dispatch]);

        return isBusinessPortal
            ? renderBusinessAppBody(mockSession)
            : renderAppBody(mockSession);
    }

    if (authLoading) {
        return (
            <div className="min-h-screen bg-gray-50 flex items-center justify-center">
                <Spinner />
            </div>
        );
    }

    // Check if we're on the reset-password route
    if (window.location.pathname === '/reset-password' || window.location.hash.includes('type=recovery')) {
        return <PasswordReset />;
    }

    if (!session) {
        return isBusinessPortal ? <BusinessAuth /> : <Auth />;
    }

    if (isBusinessPortal) {
        return renderBusinessAppBody(session);
    }

    return renderAppBody(session);
};

export default App;

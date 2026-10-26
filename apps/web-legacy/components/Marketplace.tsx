import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchAllProducts,
    fetchFeaturedProducts,
} from '../store/slices/productsSlice';
import { addToWishlist } from '../store/slices/wishlistSlice';
import ProductCard from './ProductCard';
import FeaturedProducts from './FeaturedProducts';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { Product, Tab, ClothingItem } from '../types';
import ProductDetail from './ProductDetail';
import ShopIcon from './icons/ShopIcon';
import RecentlyViewed from './RecentlyViewed';
import ProductQuickView from './ProductQuickView';
import PriceRangeSlider from './PriceRangeSlider';
import SearchAutocomplete from './SearchAutocomplete';
import { getWardrobeBasedRecommendations, WardrobeRecommendation } from '../services/marketplaceService';
import HeartIcon from './icons/HeartIcon';
import SparklesIcon from './icons/SparklesIcon';
import { showToast } from '../store/slices/toastSlice';
import Card from './common/Card';
import { typography } from '@core/theme/tokens';
import { trackEvent } from '../analytics/events';

interface MarketplaceProps {
    initialProduct?: Product | null;
    onProductView?: () => void;
    onTabChange?: (tab: Tab) => void;
    initialSearch?: string;
}

const colors = [
    'Black', 'White', 'Gray', 'Navy', 'Brown', 'Beige',
    'Red', 'Pink', 'Orange', 'Yellow', 'Green', 'Blue',
    'Purple', 'Teal', 'Coral', 'Lavender'
];

const Marketplace: React.FC<MarketplaceProps> = ({ 
    initialProduct = null, 
    onProductView,
    onTabChange,
    initialSearch,
}) => {
    const dispatch = useAppDispatch();
    const { products, featuredProducts, loading, error } = useAppSelector(
        (state) => state.products
    );
    const { currentBusiness } = useAppSelector((state) => state.business);
    const { items: wardrobeItems } = useAppSelector((state) => state.wardrobe);

    const [filters, setFilters] = useState({
        category: '',
        color: '',
        style: '',
        minPrice: '',
        maxPrice: '',
        search: initialSearch || '',
        minRating: '',
    });
    const [selectedProduct, setSelectedProduct] = useState<Product | null>(
        initialProduct || null
    );
    const [quickViewProduct, setQuickViewProduct] = useState<Product | null>(null);
    const [priceRange, setPriceRange] = useState({ min: 0, max: 1000 });
    const [showColorPicker, setShowColorPicker] = useState(false);
    const [showAdvancedFilters, setShowAdvancedFilters] = useState(false);
    
    // Wardrobe recommendations state
    const [wardrobeRecommendations, setWardrobeRecommendations] = useState<WardrobeRecommendation[]>([]);
    const [loadingWardrobeRecs, setLoadingWardrobeRecs] = useState(false);
    const [wardrobeRecsError, setWardrobeRecsError] = useState<string | null>(null);
    const [dismissedRecommendations, setDismissedRecommendations] = useState<Set<string>>(new Set());
    const debounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    // Update selectedProduct when initialProduct changes
    React.useEffect(() => {
        if (initialProduct) {
            setSelectedProduct(initialProduct);
        }
    }, [initialProduct]);

    useEffect(() => {
        dispatch(fetchAllProducts({}));
        dispatch(fetchFeaturedProducts());
    }, [dispatch]);

    const handleFilterChange = (
        e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
    ) => {
        const { name, value } = e.target;
        setFilters((prev) => ({ ...prev, [name]: value }));
    };

    // Debounced search handler to prevent excessive API calls
    const [debouncedSearch, setDebouncedSearch] = useState(filters.search);
    const searchDebounceTimerRef = useRef<NodeJS.Timeout | null>(null);

    useEffect(() => {
        if (searchDebounceTimerRef.current) {
            clearTimeout(searchDebounceTimerRef.current);
        }

        searchDebounceTimerRef.current = setTimeout(() => {
            setDebouncedSearch(filters.search);
        }, 500);

        return () => {
            if (searchDebounceTimerRef.current) {
                clearTimeout(searchDebounceTimerRef.current);
            }
        };
    }, [filters.search]);

    // React to initialSearch changes (e.g., "Shop this look" from Style Playground)
    useEffect(() => {
        if (!initialSearch) return;
        setFilters((prev) => ({
            ...prev,
            search: initialSearch,
        }));
        setDebouncedSearch(initialSearch);
        dispatch(
            fetchAllProducts({
                filters: {
                    search: initialSearch,
                },
            })
        );
    }, [initialSearch, dispatch]);

    const handleApplyFilters = () => {
        // Validate price range
        const minPrice = priceRange.min > 0 ? priceRange.min : (filters.minPrice ? Number(filters.minPrice) : undefined);
        const maxPrice = priceRange.max < 1000 ? priceRange.max : (filters.maxPrice ? Number(filters.maxPrice) : undefined);
        
        if (minPrice !== undefined && maxPrice !== undefined && minPrice > maxPrice) {
            dispatch(showToast({
                type: 'error',
                message: 'Minimum price cannot be greater than maximum price. Please adjust your filters.'
            }));
            return;
        }

        dispatch(
            fetchAllProducts({
                filters: {
                    category: filters.category || undefined,
                    color: filters.color || undefined,
                    style: filters.style || undefined,
                    minPrice,
                    maxPrice,
                    search: debouncedSearch || undefined,
                }
            })
        );

        // Event-level tracking for search and filters
        if (debouncedSearch.trim()) {
            trackEvent('search_performed', {
                query: debouncedSearch.trim(),
                filtersApplied: [
                    filters.category && `category:${filters.category}`,
                    filters.color && `color:${filters.color}`,
                    filters.style && `style:${filters.style}`,
                ].filter(Boolean) as string[],
                resultsCount: undefined,
            });
        }

        const appliedFilters: Array<{ type: string; value: string }> = [];
        if (filters.category) appliedFilters.push({ type: 'category', value: filters.category });
        if (filters.color) appliedFilters.push({ type: 'color', value: filters.color });
        if (filters.style) appliedFilters.push({ type: 'style', value: filters.style });
        if (minPrice !== undefined) appliedFilters.push({ type: 'minPrice', value: String(minPrice) });
        if (maxPrice !== undefined) appliedFilters.push({ type: 'maxPrice', value: String(maxPrice) });

        appliedFilters.forEach((f) =>
            trackEvent('filter_applied', {
                filterType: f.type,
                filterValue: f.value,
            })
        );
    };

    // Memoize clean wardrobe items for performance
    const cleanWardrobeItems = useMemo(
        () => wardrobeItems.filter((item) => item.status === 'clean'),
        [wardrobeItems]
    );

    // Memoize wardrobe items signature for deep comparison
    const wardrobeItemsSignature = useMemo(
        () => JSON.stringify(cleanWardrobeItems.map(item => ({ id: item.id, category: item.category, color: item.color, style: item.style })).sort((a, b) => a.id.localeCompare(b.id))),
        [cleanWardrobeItems]
    );

    // Fetch wardrobe recommendations with debouncing
    const fetchWardrobeRecommendations = useCallback(async () => {
        if (cleanWardrobeItems.length === 0) {
            setWardrobeRecommendations([]);
            return;
        }

        setLoadingWardrobeRecs(true);
        setWardrobeRecsError(null);
        
        try {
            const recommendations = await getWardrobeBasedRecommendations(cleanWardrobeItems, 12);
            setWardrobeRecommendations(recommendations);
        } catch (error: any) {
            console.error('Error fetching wardrobe recommendations:', error);
            setWardrobeRecsError(error.message || 'Failed to load recommendations');
        } finally {
            setLoadingWardrobeRecs(false);
        }
    }, [cleanWardrobeItems]);

    // Debounced effect for fetching recommendations
    useEffect(() => {
        // Clear existing timer
        if (debounceTimerRef.current) {
            clearTimeout(debounceTimerRef.current);
        }

        // Set new timer
        debounceTimerRef.current = setTimeout(() => {
            fetchWardrobeRecommendations();
        }, 500); // 500ms debounce

        return () => {
            if (debounceTimerRef.current) {
                clearTimeout(debounceTimerRef.current);
            }
        };
    }, [wardrobeItemsSignature, fetchWardrobeRecommendations]);

    // Update price range when products load
    useEffect(() => {
        if (products.length > 0) {
            const prices = products.map(p => p.price);
            const min = Math.min(...prices);
            const max = Math.max(...prices);
            setPriceRange({ min: Math.floor(min), max: Math.ceil(max) });
            if (!filters.minPrice) setFilters(prev => ({ ...prev, minPrice: Math.floor(min).toString() }));
            if (!filters.maxPrice) setFilters(prev => ({ ...prev, maxPrice: Math.ceil(max).toString() }));
        }
    }, [products]);

    const handleClearFilters = () => {
        setFilters({
            category: '',
            color: '',
            style: '',
            minPrice: '',
            maxPrice: '',
            search: '',
            minRating: '',
        });
        dispatch(fetchAllProducts({}));
    };

    // Handle dismissing a recommendation
    const handleDismissRecommendation = useCallback((productId: string) => {
        setDismissedRecommendations(prev => new Set([...prev, productId]));
    }, []);

    // Handle adding to wishlist
    const handleAddToWishlist = useCallback((productId: string) => {
        dispatch(addToWishlist(productId));
    }, [dispatch]);

    // Handle view similar (filter by category and style)
    const handleViewSimilar = useCallback((product: Product) => {
        setFilters(prev => ({
            ...prev,
            category: product.category,
            style: product.style,
        }));
        dispatch(fetchAllProducts({
            filters: {
                category: product.category,
                style: product.style,
            }
        }));

        trackEvent('filter_applied', {
            filterType: 'view_similar',
            filterValue: `${product.category}/${product.style}`,
        });
    }, [dispatch]);

    // Filter out dismissed recommendations
    const visibleRecommendations = useMemo(
        () => wardrobeRecommendations.filter(rec => !dismissedRecommendations.has(rec.id)),
        [wardrobeRecommendations, dismissedRecommendations]
    );

    const categories = [
        'Top',
        'Bottom',
        'Dress',
        'Outerwear',
        'Shoes',
        'Accessories',
        'Bag',
        'Jewelry',
    ];
    const styles = [
        'Casual',
        'Formal',
        'Sporty',
        'Vintage',
        'Bohemian',
        'Minimalist',
        'Streetwear',
        'Classic',
    ];

    // Close color picker when clicking outside
    React.useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            const target = event.target as HTMLElement;
            if (!target.closest('.relative')) {
                setShowColorPicker(false);
            }
        };
        if (showColorPicker) {
            document.addEventListener('mousedown', handleClickOutside);
            return () => document.removeEventListener('mousedown', handleClickOutside);
        }
    }, [showColorPicker]);

    if (selectedProduct) {
        return (
            <ProductDetail
                product={selectedProduct}
                onBack={() => {
                    setSelectedProduct(null);
                    onProductView?.();
                }}
                onCheckout={(product, quantity) => {
                    // After a direct buy from product detail, take the user
                    // to their orders for a consistent post-purchase experience.
                    setSelectedProduct(null);
                    onProductView?.();
                    onTabChange?.(Tab.MyOrders);
                }}
            />
        );
    }

    return (
        <div>
            {/* Enhanced Header */}
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <ShopIcon className="w-8 h-8 text-indigo-600" />
                    <h1 className={`${typography.pageTitle} text-gray-900`}>
                        Marketplace
                    </h1>
                </div>
                <div className="flex items-center justify-between mb-6">
                    <p className="text-gray-600 ml-11">
                        Discover sustainable fashion from our curated collection
                    </p>
                    {!currentBusiness && onTabChange && (
                        <Button
                            onClick={() => onTabChange(Tab.SellerDashboard)}
                            className="ml-auto px-6 py-2.5 rounded-lg font-semibold shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all flex items-center gap-2"
                        >
                            <svg
                                className="w-5 h-5"
                                fill="none"
                                stroke="currentColor"
                                viewBox="0 0 24 24"
                            >
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 6v6m0 0v6m0-6h6m-6 0H6"
                                />
                            </svg>
                            Start Selling
                        </Button>
                    )}
                </div>
                <FeaturedProducts
                    products={featuredProducts}
                    onProductClick={setSelectedProduct}
                />
                <RecentlyViewed
                    onProductClick={setSelectedProduct}
                    limit={8}
                />
                
                {/* Wardrobe-Based Recommendations Section */}
                {cleanWardrobeItems.length > 0 && (
                    <div className="mb-8" role="region" aria-label="Recommended for your wardrobe">
                        <div className="flex items-center justify-between mb-4">
                            <div>
                                <h2 className="text-2xl font-bold text-gray-900">
                                    Recommended for Your Wardrobe
                                </h2>
                                <p className="text-sm text-gray-600 mt-1">
                                    Products that match your style and wardrobe items
                                </p>
                            </div>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={fetchWardrobeRecommendations}
                                disabled={loadingWardrobeRecs}
                                className="text-indigo-600 hover:text-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                aria-label="Refresh recommendations"
                            >
                                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                                </svg>
                                Refresh
                            </Button>
                        </div>
                        
                        {loadingWardrobeRecs ? (
                            <div className="flex flex-col items-center justify-center py-12 bg-gray-50 rounded-xl" role="status" aria-live="polite">
                                <Spinner />
                                <p className="text-gray-600 mt-4 text-sm">Finding perfect matches for your wardrobe...</p>
                            </div>
                        ) : wardrobeRecsError ? (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-6 text-center">
                                <div className="flex items-center justify-center mb-2">
                                    <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                                    </svg>
                                    <p className="text-red-800 font-medium">Error loading recommendations</p>
                                </div>
                                <p className="text-sm text-red-700 mb-4">{wardrobeRecsError}</p>
                                <Button
                                    variant="secondary"
                                    size="sm"
                                    onClick={fetchWardrobeRecommendations}
                                    className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                    aria-label="Retry loading recommendations"
                                >
                                    Try Again
                                </Button>
                            </div>
                        ) : visibleRecommendations.length === 0 ? (
                            <div className="text-center py-12 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
                                <ShopIcon className="w-12 h-12 text-gray-400 mx-auto mb-3" />
                                <h3 className="text-lg font-semibold text-gray-800 mb-2">
                                    {dismissedRecommendations.size > 0 
                                        ? 'All recommendations dismissed' 
                                        : 'No matching products found'}
                                </h3>
                                <p className="text-sm text-gray-600 max-w-md mx-auto mb-4">
                                    {dismissedRecommendations.size > 0
                                        ? 'Refresh to see new recommendations'
                                        : 'We couldn\'t find products matching your current wardrobe. Try adding more items!'}
                                </p>
                                {dismissedRecommendations.size > 0 && (
                                    <Button
                                        variant="secondary"
                                        size="sm"
                                        onClick={() => setDismissedRecommendations(new Set())}
                                        className="focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                        aria-label="Show dismissed recommendations"
                                    >
                                        Show Dismissed Items
                                    </Button>
                                )}
                            </div>
                        ) : (
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-6 gap-4">
                                    {visibleRecommendations.map((product) => (
                                        <div key={product.id} className="relative group">
                                            <div className="absolute top-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleDismissRecommendation(product.id);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleDismissRecommendation(product.id);
                                                        }
                                                    }}
                                                    className="p-1.5 bg-white/90 hover:bg-white rounded-full shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                                                    aria-label={`Dismiss ${product.name} recommendation`}
                                                    title="Not interested"
                                                >
                                                    <svg className="w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                                    </svg>
                                                </button>
                                            </div>
                                            <div className="relative">
                                                <ProductCard
                                                    product={product}
                                                    onClick={setSelectedProduct}
                                                    onQuickView={setQuickViewProduct}
                                                />
                                                {/* Match Reasons Badge */}
                                                {product.matchReasons && product.matchReasons.length > 0 && (
                                                    <div className="absolute bottom-2 left-2 right-2 z-10">
                                                        <div className="bg-white/95 backdrop-blur-sm rounded-lg p-2 shadow-lg">
                                                            <div className="flex items-center gap-1 mb-1">
                                                                <SparklesIcon className="w-3 h-3 text-indigo-600" />
                                                                <span className="text-xs font-semibold text-gray-700">Why recommended:</span>
                                                            </div>
                                                            <div className="flex flex-wrap gap-1">
                                                                {product.matchReasons.slice(0, 2).map((reason, idx) => (
                                                                    <span
                                                                        key={idx}
                                                                        className="text-xs px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full"
                                                                    >
                                                                        {reason}
                                                                    </span>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                            {/* Action Buttons Overlay */}
                                            <div className="absolute bottom-2 right-2 z-20 opacity-0 group-hover:opacity-100 transition-opacity flex gap-2">
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleAddToWishlist(product.id);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleAddToWishlist(product.id);
                                                        }
                                                    }}
                                                    className="p-2 bg-white/90 hover:bg-white rounded-full shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                    aria-label={`Add ${product.name} to wishlist`}
                                                    title="Add to wishlist"
                                                >
                                                    <HeartIcon isFilled={false} className="w-4 h-4 text-indigo-600" />
                                                </button>
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        handleViewSimilar(product);
                                                    }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter' || e.key === ' ') {
                                                            e.preventDefault();
                                                            e.stopPropagation();
                                                            handleViewSimilar(product);
                                                        }
                                                    }}
                                                    className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-medium rounded-full shadow-md transition-all focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                                                    aria-label={`View similar products to ${product.name}`}
                                                >
                                                    Similar
                                                </button>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        )}
                    </div>
                )}
            </div>

            {/* Error Display */}
            {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
                    <div className="flex items-center">
                        <svg className="w-5 h-5 text-red-600 mr-2" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <p className="text-red-800 font-medium">Error loading products: {error}</p>
                    </div>
                </div>
            )}

            {/* Enhanced Filters Card */}
            <Card className="bg-gradient-to-br from-white to-indigo-50/30 mb-6">
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-2">
                        <div className="w-1 h-6 bg-gradient-to-b from-indigo-600 to-purple-600 rounded-full"></div>
                        <h2 className="text-xl font-semibold text-gray-900">Filter Products</h2>
                    </div>
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                    </button>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
                    <div className="xl:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Search
                        </label>
                        <SearchAutocomplete
                            value={filters.search}
                            onChange={(value) => setFilters({ ...filters, search: value })}
                            onSelect={(product) => setSelectedProduct(product)}
                            placeholder="Search products..."
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Category
                        </label>
                        <select
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                        >
                            <option value="">All Categories</option>
                            {categories.map((cat) => (
                                <option key={cat} value={cat}>
                                    {cat}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Style
                        </label>
                        <select
                            name="style"
                            value={filters.style}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                        >
                            <option value="">All Styles</option>
                            {styles.map((style) => (
                                <option key={style} value={style}>
                                    {style}
                                </option>
                            ))}
                        </select>
                    </div>
                    <div className="xl:col-span-2">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Price Range
                        </label>
                        <PriceRangeSlider
                            min={0}
                            max={1000}
                            value={priceRange}
                            onChange={setPriceRange}
                        />
                    </div>
                    <div>
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Min Rating
                        </label>
                        <select
                            name="minRating"
                            value={filters.minRating}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                        >
                            <option value="">Any Rating</option>
                            <option value="4">4+ Stars</option>
                            <option value="3">3+ Stars</option>
                            <option value="2">2+ Stars</option>
                            <option value="1">1+ Stars</option>
                        </select>
                    </div>
                </div>
                <div className="mt-4">
                    <button
                        onClick={() => setShowAdvancedFilters(!showAdvancedFilters)}
                        className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                    >
                        {showAdvancedFilters ? 'Hide' : 'Show'} Advanced Filters
                    </button>
                </div>

                {/* Price Range Slider */}
                {showAdvancedFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-4">
                            Price Range: ${filters.minPrice || priceRange.min} - ${filters.maxPrice || priceRange.max}
                        </label>
                        <div className="grid grid-cols-2 gap-4 mb-4">
                            <div>
                                <input
                                    type="range"
                                    min={priceRange.min}
                                    max={priceRange.max}
                                    value={filters.minPrice || priceRange.min}
                                    onChange={(e) => setFilters(prev => ({ ...prev, minPrice: e.target.value }))}
                                    className="w-full"
                                />
                                <div className="flex justify-between text-xs text-gray-500 mt-1">
                                    <span>${priceRange.min}</span>
                                    <span>${priceRange.max}</span>
                                </div>
                            </div>
                            <div>
                                <input
                                    type="range"
                                    min={priceRange.min}
                                    max={priceRange.max}
                                    value={filters.maxPrice || priceRange.max}
                                    onChange={(e) => setFilters(prev => ({ ...prev, maxPrice: e.target.value }))}
                                    className="w-full"
                                />
                            </div>
                        </div>
                    </div>
                )}

                {/* Rating Filter */}
                {showAdvancedFilters && (
                    <div className="mt-6 pt-6 border-t border-gray-200">
                        <label className="block text-sm font-semibold text-gray-700 mb-2">
                            Minimum Rating
                        </label>
                        <select
                            name="minRating"
                            value={filters.minRating}
                            onChange={handleFilterChange}
                            className="w-full px-4 py-2.5 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all bg-white"
                        >
                            <option value="">Any Rating</option>
                            <option value="4">4+ Stars</option>
                            <option value="3">3+ Stars</option>
                            <option value="2">2+ Stars</option>
                            <option value="1">1+ Stars</option>
                        </select>
                    </div>
                )}
                <div className="flex items-center justify-end gap-3 mt-6 pt-6 border-t border-gray-200">
                    <Button 
                        onClick={handleClearFilters} 
                        variant="secondary" 
                        size="md"
                        className="px-6"
                    >
                        Clear All
                    </Button>
                    <Button 
                        onClick={handleApplyFilters} 
                        size="md"
                        className="px-8 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 transition-all"
                    >
                        Apply Filters
                    </Button>
                </div>
            </Card>

            {error && (
                <div className="bg-red-50 border-l-4 border-red-400 text-red-700 px-4 py-3 rounded mb-6 flex items-start justify-between">
                    <div className="flex items-start">
                        <svg className="w-5 h-5 mr-2 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                        </svg>
                        <div>
                            <p className="font-semibold">Error loading products</p>
                            <p className="text-sm mt-1">{error}</p>
                        </div>
                    </div>
                    <button
                        onClick={() => {
                            dispatch(fetchAllProducts({}));
                            dispatch(fetchFeaturedProducts());
                        }}
                        className="ml-4 text-red-700 hover:text-red-900 font-medium text-sm underline"
                    >
                        Retry
                    </button>
                </div>
            )}

            {loading ? (
                <div className="flex flex-col items-center justify-center py-16">
                    <Spinner />
                    <p className="text-gray-600 mt-4">Loading products...</p>
                </div>
            ) : products.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
                    <ShopIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No products found</h3>
                    <p className="text-gray-600 max-w-md mx-auto">
                        Try adjusting your filters or search terms to find what you're looking for.
                    </p>
                </div>
            ) : (
                <div>
                    <div className="flex items-center justify-between mb-6">
                        <h2 className="text-2xl font-bold text-gray-900">
                            All Products
                        </h2>
                        <span className="text-sm text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                            {products.length} {products.length === 1 ? 'product' : 'products'}
                        </span>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                        {products.map((product) => (
                            <ProductCard
                                key={product.id}
                                product={product}
                                onClick={setSelectedProduct}
                                onQuickView={setQuickViewProduct}
                            />
                        ))}
                    </div>
                </div>
            )}
            {quickViewProduct && (
                <ProductQuickView
                    product={quickViewProduct}
                    onClose={() => setQuickViewProduct(null)}
                    onViewFullDetails={() => {
                        setQuickViewProduct(null);
                        setSelectedProduct(quickViewProduct);
                    }}
                />
            )}
        </div>
    );
};

export default Marketplace;


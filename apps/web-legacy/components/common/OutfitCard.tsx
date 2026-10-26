import React, { useState, useEffect } from 'react';
import { Outfit, Product } from '../../types';
import HeartIcon from '../icons/HeartIcon';
import ThumbUpIcon from '../icons/ThumbUpIcon';
import ThumbDownIcon from '../icons/ThumbDownIcon';
import UserIcon from '../icons/UserIcon';
import ShopIcon from '../icons/ShopIcon';
import { getRecommendedProducts } from '../../services/marketplaceService';
import { useAppDispatch } from '../../store/hooks';
import { addToCart } from '../../store/slices/cartSlice';
import Button from './Button';
import { trackEvent } from '../../analytics/events';

interface OutfitCardProps {
    outfit: Outfit;
    onFavorite: (outfit: Outfit) => void;
    onFeedback: (outfitId: string, feedback: 'liked' | 'disliked') => void;
    onTryOn: (outfit: Outfit) => void;
    isFavorited?: boolean;
    onProductClick?: (product: Product) => void;
}

const OutfitCard: React.FC<OutfitCardProps> = ({
    outfit,
    onFavorite,
    onFeedback,
    onTryOn,
    isFavorited = false,
    onProductClick,
}) => {
    const dispatch = useAppDispatch();
    const [showShopTheLook, setShowShopTheLook] = useState(false);
    const [recommendedProducts, setRecommendedProducts] = useState<Product[]>([]);
    const [loadingProducts, setLoadingProducts] = useState(false);

    useEffect(() => {
        if (showShopTheLook && recommendedProducts.length === 0) {
            setLoadingProducts(true);
            getRecommendedProducts(outfit, 3)
                .then((products) => {
                    setRecommendedProducts(products);
                    setLoadingProducts(false);
                })
                .catch(() => {
                    setLoadingProducts(false);
                });
        }
    }, [showShopTheLook, outfit, recommendedProducts.length]);

    const handleAddToCart = (product: Product) => {
        dispatch(addToCart({ product, quantity: 1 }));

        trackEvent('product_added_to_cart', {
            productId: product.id,
            quantity: 1,
            price: product.price,
            sourceScreen: 'outfit_card',
        });
    };

    return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl flex flex-col group border border-gray-100">
        {/* Header Section with Gradient */}
        <div className="p-5 bg-gradient-to-br from-white to-gray-50">
            <h3 className="text-lg font-bold text-gray-800 group-hover:text-indigo-600 transition-colors">
                {outfit.outfitName}
            </h3>
            <p className="text-sm text-gray-600 mt-1 line-clamp-2">{outfit.description}</p>
        </div>
        
        {/* Enhanced Image Grid */}
        <div className="grid grid-cols-3 gap-2 px-4 py-4 flex-grow bg-white">
            {outfit.items.slice(0, 3).map((item, index) => (
                <div 
                    key={item.id} 
                    className="relative aspect-square overflow-hidden rounded-lg group/item"
                >
                    <img
                        src={item.imageUrl}
                        alt={item.name}
                        className="w-full h-full object-cover transition-transform duration-300 group-hover/item:scale-110"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover/item:opacity-100 transition-opacity"></div>
                </div>
            ))}
        </div>
        
        {/* Enhanced Action Buttons */}
        <div className="p-4 flex flex-col space-y-3 bg-gradient-to-r from-gray-50 to-indigo-50/30 border-t border-gray-100">
            <div className="flex justify-between items-center">
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => onFeedback(outfit.id, 'liked')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onFeedback(outfit.id, 'liked');
                            }
                        }}
                        className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            outfit.feedback === 'liked'
                                ? 'bg-green-100 text-green-600 shadow-md'
                                : 'text-gray-400 hover:bg-green-100 hover:text-green-500'
                        }`}
                        aria-label="Like this outfit"
                        aria-pressed={outfit.feedback === 'liked'}
                    >
                        <ThumbUpIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onFeedback(outfit.id, 'disliked')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onFeedback(outfit.id, 'disliked');
                            }
                        }}
                        className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            outfit.feedback === 'disliked'
                                ? 'bg-red-100 text-red-600 shadow-md'
                                : 'text-gray-400 hover:bg-red-100 hover:text-red-500'
                        }`}
                        aria-label="Dislike this outfit"
                        aria-pressed={outfit.feedback === 'disliked'}
                    >
                        <ThumbDownIcon className="w-5 h-5" />
                    </button>
                </div>
                <div className="flex items-center space-x-2">
                    <button
                        onClick={() => setShowShopTheLook(!showShopTheLook)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                setShowShopTheLook(!showShopTheLook);
                            }
                        }}
                        className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            showShopTheLook
                                ? 'bg-indigo-100 text-indigo-600 shadow-md'
                                : 'text-gray-400 hover:bg-indigo-100 hover:text-indigo-500'
                        }`}
                        aria-label="Shop the look"
                        aria-expanded={showShopTheLook}
                        title="Shop the Look"
                    >
                        <ShopIcon className="w-5 h-5" />
                    </button>
                    <button
                        onClick={() => onTryOn(outfit, 'outfit_card')}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onTryOn(outfit, 'outfit_card');
                            }
                        }}
                        className="p-2.5 rounded-full text-indigo-500 hover:bg-indigo-100 hover:text-indigo-600 transition-all duration-200 transform hover:scale-110 relative focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2"
                        aria-label="Try this outfit on without favoriting"
                        title="Try on without favoriting - Virtual Try-On"
                    >
                        <UserIcon className="w-5 h-5" />
                        <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-white" aria-hidden="true"></span>
                    </button>
                    <button
                        onClick={() => onFavorite(outfit)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault();
                                onFavorite(outfit);
                            }
                        }}
                        className={`p-2.5 rounded-full transition-all duration-200 transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 ${
                            isFavorited
                                ? 'text-red-500 bg-red-50 shadow-md'
                                : 'text-gray-400 hover:bg-red-100 hover:text-red-500'
                        }`}
                        aria-label={isFavorited ? "Unfavorite this outfit" : "Favorite this outfit"}
                        aria-pressed={isFavorited}
                    >
                        <HeartIcon isFilled={isFavorited} className={`w-6 h-6 transition-transform ${isFavorited ? 'animate-pulse' : ''}`} />
                    </button>
                </div>
            </div>

            {/* Enhanced Shop the Look Section */}
            {showShopTheLook && (
                <div className="pt-3 border-t border-gray-200 animate-in slide-in-from-top-2 duration-300">
                    <h4 className="text-sm font-semibold text-gray-700 mb-3 flex items-center gap-2">
                        <ShopIcon className="w-4 h-4 text-indigo-600" />
                        Shop Similar Items
                    </h4>
                    {loadingProducts ? (
                        <div className="text-center py-6">
                            <div className="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-600"></div>
                            <p className="text-sm text-gray-500 mt-2">Loading products...</p>
                        </div>
                    ) : recommendedProducts.length > 0 ? (
                        <div className="space-y-2">
                            {recommendedProducts.map((product) => (
                                <div
                                    key={product.id}
                                    className="flex items-center space-x-3 p-3 bg-white rounded-lg hover:bg-indigo-50 transition-all duration-200 border border-gray-100 hover:border-indigo-200 hover:shadow-sm"
                                >
                                    {product.image_urls.length > 0 && (
                                        <img
                                            src={product.image_urls[0]}
                                            alt={product.name}
                                            className="w-14 h-14 object-cover rounded-lg cursor-pointer hover:ring-2 hover:ring-indigo-300 transition-all"
                                            onClick={() => onProductClick?.(product)}
                                        />
                                    )}
                                    <div className="flex-1 min-w-0">
                                        <p
                                            className="text-sm font-medium text-gray-900 truncate cursor-pointer hover:text-indigo-600 transition-colors"
                                            onClick={() => onProductClick?.(product)}
                                        >
                                            {product.name}
                                        </p>
                                        <p className="text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                                            ${product.price.toFixed(2)}
                                        </p>
                                    </div>
                                    <button
                                        onClick={() => handleAddToCart(product)}
                                        className="px-3 py-1.5 text-xs font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg hover:from-indigo-700 hover:to-purple-700 transition-all transform hover:scale-105 shadow-sm"
                                    >
                                        Add
                                    </button>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <div className="text-center py-6 bg-gray-50 rounded-lg">
                            <p className="text-sm text-gray-500">No similar products found</p>
                        </div>
                    )}
                </div>
            )}
        </div>
    </div>
    );
};

export default OutfitCard;

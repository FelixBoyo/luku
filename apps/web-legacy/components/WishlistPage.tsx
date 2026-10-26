import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchWishlist, removeFromWishlist } from '../store/slices/wishlistSlice';
import { addToCart } from '../store/slices/cartSlice';
import { showToast } from '../store/slices/toastSlice';
import { logEvent } from '../store/slices/userEngagementSlice';
import { trackEvent } from '../analytics/events';
import ProductCard from './ProductCard';
import Button from './common/Button';
import Spinner from './common/Spinner';
import HeartIcon from './icons/HeartIcon';
import { WishlistItemSkeleton } from './common/Skeleton';

interface WishlistPageProps {
    onNavigateToMarketplace?: () => void;
}

const WishlistPage: React.FC<WishlistPageProps> = ({ onNavigateToMarketplace }) => {
    const dispatch = useAppDispatch();
    const { items, loading } = useAppSelector((state) => state.wishlist);

    useEffect(() => {
        dispatch(fetchWishlist());
    }, [dispatch]);

    const handleRemove = async (productId: string) => {
        try {
            await dispatch(removeFromWishlist(productId)).unwrap();
            dispatch(showToast({
                type: 'success',
                message: 'Item removed from wishlist'
            }));
        } catch (error: any) {
            dispatch(showToast({
                type: 'error',
                message: error.message || 'Failed to remove from wishlist. Please try again.'
            }));
        }
    };

    const handleAddToCart = (product: any) => {
        dispatch(addToCart({ product, quantity: 1 }));
        dispatch(
            logEvent({
                type: 'add_to_cart',
                payload: { source: 'wishlist', productId: product.id },
            })
        );
        trackEvent('product_added_to_cart', {
            productId: product.id,
            quantity: 1,
            price: product.price,
            sourceScreen: 'wishlist',
        });
        dispatch(
            showToast({
                type: 'success',
                message: 'Added to cart from your wishlist',
            })
        );
    };

    if (loading) {
        return (
            <div>
                <div className="mb-8">
                    <div className="flex items-center gap-3 mb-4">
                        <HeartIcon className="w-8 h-8 text-red-500" />
                        <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                    </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {[1, 2, 3, 4].map((i) => (
                        <WishlistItemSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <HeartIcon className="w-8 h-8 text-red-500" />
                    <h1 className="text-3xl font-bold text-gray-900">My Wishlist</h1>
                </div>
                <p className="text-gray-600 ml-11">
                    {items.length === 0 
                        ? 'Your wishlist is empty. Start adding products you love!'
                        : `${items.length} ${items.length === 1 ? 'item' : 'items'} saved`
                    }
                </p>
            </div>

            {items.length === 0 ? (
                <div className="text-center py-16 bg-gradient-to-br from-gray-50 to-indigo-50 rounded-xl border-2 border-dashed border-gray-300">
                    <HeartIcon className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-xl font-semibold text-gray-800 mb-2">No items in your wishlist</h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-6">
                        Browse the marketplace and click the heart icon on products you like to save them here.
                    </p>
                    <Button onClick={onNavigateToMarketplace || (() => {})}>
                        Browse Marketplace
                    </Button>
                </div>
            ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                    {items.map((item) => {
                        const product = item.product;
                        if (!product) return null;

                        return (
                            <div key={item.id} className="relative group">
                                <ProductCard product={product} />
                                <div className="absolute top-3 right-3 z-10">
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleRemove(product.id)}
                                        className="bg-white/90 hover:bg-white shadow-md"
                                        aria-label="Remove from wishlist"
                                    >
                                        <svg
                                            className="w-5 h-5 text-red-500"
                                            fill="currentColor"
                                            viewBox="0 0 24 24"
                                        >
                                            <path
                                                strokeLinecap="round"
                                                strokeLinejoin="round"
                                                strokeWidth={2}
                                                d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                                            />
                                        </svg>
                                    </Button>
                                </div>
                                <div className="mt-2">
                                    <Button
                                        onClick={() => handleAddToCart(product)}
                                        className="w-full"
                                        size="sm"
                                    >
                                        Add to Cart
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default WishlistPage;

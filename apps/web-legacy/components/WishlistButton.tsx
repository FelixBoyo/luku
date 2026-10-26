import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { addToWishlist, removeFromWishlist, checkWishlistStatus } from '../store/slices/wishlistSlice';

interface WishlistButtonProps {
    productId: string;
    className?: string;
    size?: 'sm' | 'md' | 'lg';
}

const WishlistButton: React.FC<WishlistButtonProps> = ({ 
    productId, 
    className = '',
    size = 'md'
}) => {
    const dispatch = useAppDispatch();
    const { productIds } = useAppSelector((state) => state.wishlist);
    const { session } = useAppSelector((state) => state.auth);

    const isInWishlist = productIds.includes(productId);

    useEffect(() => {
        if (session && productId) {
            dispatch(checkWishlistStatus([productId]));
        }
    }, [dispatch, session, productId]);

    const handleToggle = async (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent triggering parent onClick
        
        if (!session) {
            alert('Please sign in to add items to your wishlist');
            return;
        }

        try {
            if (isInWishlist) {
                await dispatch(removeFromWishlist(productId)).unwrap();
            } else {
                await dispatch(addToWishlist(productId)).unwrap();
            }
        } catch (error: any) {
            alert(error.message || 'Failed to update wishlist');
        }
    };

    const sizeClasses = {
        sm: 'w-6 h-6',
        md: 'w-7 h-7',
        lg: 'w-8 h-8',
    };

    return (
        <button
            onClick={handleToggle}
            className={`${sizeClasses[size]} ${className} transition-all duration-200 hover:scale-110 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 rounded-full`}
            aria-label={isInWishlist ? 'Remove from wishlist' : 'Add to wishlist'}
        >
            <svg
                className={`w-full h-full ${isInWishlist ? 'text-red-500 fill-current' : 'text-gray-400 hover:text-red-500'}`}
                fill={isInWishlist ? 'currentColor' : 'none'}
                stroke="currentColor"
                viewBox="0 0 24 24"
            >
                <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                />
            </svg>
        </button>
    );
};

export default WishlistButton;

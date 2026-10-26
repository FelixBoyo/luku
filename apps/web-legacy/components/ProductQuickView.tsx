import React, { useState, useEffect } from 'react';
import { Product } from '../types';
import { addToCart } from '../store/slices/cartSlice';
import { useAppDispatch } from '../store/hooks';
import Button from './common/Button';
import { trackEvent } from '../analytics/events';
import WishlistButton from './WishlistButton';
import ProductShare from './ProductShare';
import SocialProof from './SocialProof';
import ProductSellerInfo from './ProductSellerInfo';

interface ProductQuickViewProps {
    product: Product;
    onClose: () => void;
    onViewFullDetails?: () => void;
}

const ProductQuickView: React.FC<ProductQuickViewProps> = ({
    product,
    onClose,
    onViewFullDetails,
}) => {
    const dispatch = useAppDispatch();
    const [quantity, setQuantity] = useState(1);

    const handleAddToCart = () => {
        dispatch(addToCart({ product, quantity }));
        trackEvent('product_added_to_cart', {
            productId: product.id,
            quantity,
            price: product.price,
            sourceScreen: 'product_quick_view',
        });
        onClose();
    };

    useEffect(() => {
        // Prevent body scroll when modal is open
        document.body.style.overflow = 'hidden';
        return () => {
            document.body.style.overflow = 'unset';
        };
    }, []);

    useEffect(() => {
        const handleEscape = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onClose();
            }
        };
        document.addEventListener('keydown', handleEscape);
        return () => document.removeEventListener('keydown', handleEscape);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 overflow-y-auto"
            onClick={onClose}
        >
            <div className="flex min-h-screen items-center justify-center p-4">
                <div
                    className="relative bg-white rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] flex flex-col"
                    onClick={(e) => e.stopPropagation()}
                >
                    {/* Header */}
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between z-10 flex-shrink-0">
                        <h2 className="text-xl font-bold text-gray-900">Quick View</h2>
                        <div className="flex items-center gap-2">
                            <WishlistButton productId={product.id} size="sm" />
                            <ProductShare product={product} />
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-gray-600 transition-colors"
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
                    </div>

                    {/* Content - Scrollable */}
                    <div className="p-6 overflow-y-auto flex-1">
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            {/* Image */}
                            <div>
                                {product.image_urls.length > 0 && (
                                    <img
                                        src={product.image_urls[0]}
                                        alt={product.name}
                                        className="w-full h-96 object-cover rounded-lg"
                                    />
                                )}
                            </div>

                            {/* Product Info */}
                            <div>
                                <h3 className="text-2xl font-bold text-gray-900 mb-2">
                                    {product.name}
                                </h3>

                                <div className="mb-4">
                                    <ProductSellerInfo product={product} />
                                </div>

                                {product.average_rating && product.average_rating > 0 && (
                                    <div className="flex items-center mb-4">
                                        {[...Array(5)].map((_, i) => (
                                            <svg
                                                key={i}
                                                className={`w-5 h-5 ${
                                                    i < Math.floor(product.average_rating || 0)
                                                        ? 'text-yellow-400'
                                                        : 'text-gray-300'
                                                }`}
                                                fill="currentColor"
                                                viewBox="0 0 20 20"
                                            >
                                                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                            </svg>
                                        ))}
                                        <span className="ml-2 text-sm text-gray-600">
                                            {product.average_rating.toFixed(1)}
                                            {product.review_count && ` (${product.review_count} reviews)`}
                                        </span>
                                    </div>
                                )}

                                <div className="mb-4">
                                    <span className="text-3xl font-bold text-indigo-600">
                                        ${product.price.toFixed(2)}
                                    </span>
                                </div>

                                <div className="mb-4 space-y-2 text-sm text-gray-600">
                                    <p><strong>Category:</strong> {product.category}</p>
                                    <p><strong>Color:</strong> {product.color}</p>
                                    <p><strong>Style:</strong> {product.style}</p>
                                    <p><strong>Size:</strong> {product.size}</p>
                                    <p><strong>Stock:</strong> {product.stock_quantity} available</p>
                                </div>

                                {product.description && (
                                    <p className="text-gray-700 mb-4 line-clamp-3">
                                        {product.description}
                                    </p>
                                )}

                                <div className="mb-4">
                                    <SocialProof product={product} />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Footer - Sticky with buttons */}
                    <div className="sticky bottom-0 bg-white border-t border-gray-200 px-6 py-4 flex-shrink-0 shadow-lg">
                        {product.stock_quantity > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <label className="text-sm font-medium text-gray-700">
                                        Quantity:
                                    </label>
                                    <input
                                        type="number"
                                        min="1"
                                        max={product.stock_quantity}
                                        value={quantity}
                                        onChange={(e) =>
                                            setQuantity(Math.max(1, Math.min(product.stock_quantity, Number(e.target.value))))
                                        }
                                        className="w-20 px-3 py-2 border border-gray-300 rounded-md"
                                    />
                                </div>
                                <div className="flex space-x-4">
                                    <Button
                                        onClick={handleAddToCart}
                                        variant="secondary"
                                        className="flex-1"
                                    >
                                        Add to Cart
                                    </Button>
                                    {onViewFullDetails && (
                                        <Button
                                            onClick={() => {
                                                onClose();
                                                onViewFullDetails();
                                            }}
                                            className="flex-1"
                                        >
                                            View Full Details
                                        </Button>
                                    )}
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                Out of Stock
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductQuickView;

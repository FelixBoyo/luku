import React, { useState } from 'react';
import { Product } from '../types';
import WishlistButton from './WishlistButton';
import ProductShare from './ProductShare';
import SocialProof from './SocialProof';
import ProductSellerInfo from './ProductSellerInfo';

interface ProductCardProps {
    product: Product;
    onClick?: (product: Product) => void;
    onQuickView?: (product: Product) => void;
}

const ProductCard: React.FC<ProductCardProps> = ({ product, onClick, onQuickView }) => {
    const [imageError, setImageError] = useState(false);
    const displayPrice = product.price.toFixed(2);

    return (
        <div
            onClick={() => onClick && onClick(product)}
            className={`block ${onClick ? 'cursor-pointer' : ''}`}
        >
            <div className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100 group">
                {product.image_urls.length > 0 && (
                    <div className="relative overflow-hidden">
                        {!imageError ? (
                            <img
                                src={product.image_urls[0]}
                                alt={product.name}
                                className="w-full h-64 object-cover transition-transform duration-300 group-hover:scale-110"
                                onError={() => setImageError(true)}
                            />
                        ) : (
                            <div className="w-full h-64 bg-gray-200 flex items-center justify-center">
                                <span className="text-gray-500 text-sm">Image not available</span>
                            </div>
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity"></div>
                        <div className="absolute top-3 left-3 z-10 flex gap-2">
                            <WishlistButton productId={product.id} size="md" className="bg-white/90 hover:bg-white shadow-md" />
                            <ProductShare product={product} className="bg-white/90 hover:bg-white shadow-md rounded-full" />
                        </div>
                        {product.is_featured && (
                            <span className="absolute top-3 right-3 bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-3 py-1 rounded-full text-xs font-semibold shadow-lg">
                                Featured
                            </span>
                        )}
                        {onQuickView && (
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onQuickView(product);
                                }}
                                className="absolute bottom-3 left-1/2 transform -translate-x-1/2 bg-white/90 hover:bg-white text-gray-700 px-4 py-2 rounded-full text-sm font-medium shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                Quick View
                            </button>
                        )}
                        {product.stock_quantity === 0 && (
                            <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm">
                                <span className="text-white font-bold text-lg bg-red-600 px-4 py-2 rounded-lg">Out of Stock</span>
                            </div>
                        )}
                    </div>
                )}
                <div className="p-5">
                    <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 group-hover:text-indigo-600 transition-colors">
                        {product.name}
                    </h3>
                    <p className="text-sm text-gray-600 mb-3">{product.category}</p>
                    <div className="flex items-center justify-between mb-3">
                        <span className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                            ${displayPrice}
                        </span>
                        {product.average_rating && product.average_rating > 0 && (
                            <div className="flex items-center bg-yellow-50 px-2 py-1 rounded-full">
                                <svg
                                    className="w-4 h-4 text-yellow-400"
                                    fill="currentColor"
                                    viewBox="0 0 20 20"
                                >
                                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                </svg>
                                <span className="ml-1 text-sm font-medium text-gray-700">
                                    {product.average_rating.toFixed(1)}
                                    {product.review_count && ` (${product.review_count})`}
                                </span>
                            </div>
                        )}
                    </div>
                    <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-gray-100">
                        <span className="px-2 py-1 bg-gray-100 rounded-full">{product.color}</span>
                        <span className="px-2 py-1 bg-gray-100 rounded-full">{product.size}</span>
                    </div>
                    <div className="mt-3 space-y-2">
                        <ProductSellerInfo product={product} showBadgeOnly={true} />
                        <SocialProof product={product} />
                    </div>
                </div>
            </div>
        </div>
    );
};

export default ProductCard;


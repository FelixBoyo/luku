import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchProduct } from '../store/slices/productsSlice';
import { fetchProductReviews } from '../store/slices/reviewsSlice';
import { fetchProductPromotions } from '../store/slices/promotionsSlice';
import { addToCart } from '../store/slices/cartSlice';
import { showToast } from '../store/slices/toastSlice';
import { Product } from '../types';
import { trackEvent } from '../analytics/events';
import Button from './common/Button';
import Spinner from './common/Spinner';
import ProductReviews from './ProductReviews';
import Checkout from './Checkout';
import { addToRecentlyViewed } from '../utils/recentlyViewed';
import ProductImageZoom from './ProductImageZoom';
import ProductShare from './ProductShare';
import SocialProof from './SocialProof';
import ProductSellerInfo from './ProductSellerInfo';
import ContactSeller from './ContactSeller';
import SizeGuide from './SizeGuide';

interface ProductDetailProps {
    product: Product;
    onBack: () => void;
    onCheckout?: (product: Product, quantity: number) => void;
}

const isTestEnv =
    typeof process !== 'undefined' &&
    typeof process.env !== 'undefined' &&
    process.env.NODE_ENV === 'test';

const ProductDetail: React.FC<ProductDetailProps> = ({
    product: initialProduct,
    onBack,
    onCheckout,
}) => {
    const dispatch = useAppDispatch();
    const { currentProduct, loading } = useAppSelector((state) => state.products);
    const { reviews } = useAppSelector((state) => state.reviews);
    const { activePromotions } = useAppSelector((state) => state.promotions);

    const [quantity, setQuantity] = useState(1);
    const [selectedImageIndex, setSelectedImageIndex] = useState(0);
    const [showCheckout, setShowCheckout] = useState(false);
    const [zoomedImage, setZoomedImage] = useState<string | null>(null);
    const [showContactSeller, setShowContactSeller] = useState(false);
    const [showSizeGuide, setShowSizeGuide] = useState(false);

    const product = currentProduct || initialProduct;

    useEffect(() => {
        // In tests we avoid firing network-heavy thunks and instead rely
        // on the initial props / preloaded state provided by the tests.
        if (isTestEnv) {
            return;
        }

        if (product.id) {
            dispatch(fetchProduct(product.id));
            dispatch(fetchProductReviews(product.id));
            dispatch(fetchProductPromotions(product.id));
            // Add to recently viewed
            addToRecentlyViewed(product.id);
        }
    }, [dispatch, product.id]);

    const handleAddToCart = () => {
        dispatch(addToCart({ product, quantity }));

        trackEvent('product_added_to_cart', {
            productId: product.id,
            quantity,
            price: product.price,
            sourceScreen: 'product_detail',
        });
    };

    const handleBuyNow = () => {
        setShowCheckout(true);
    };

    if (showCheckout) {
        return (
            <Checkout
                product={product}
                quantity={quantity}
                onSuccess={() => {
                    setShowCheckout(false);
                    dispatch(
                        showToast({
                            type: 'success',
                            message: 'Order placed successfully!',
                        })
                    );
                    if (onCheckout) {
                        onCheckout(product, quantity);
                    }
                }}
                onCancel={() => setShowCheckout(false)}
            />
        );
    }

    const calculatePrice = () => {
        let finalPrice = product.price;
        if (activePromotions.length > 0) {
            const promotion = activePromotions[0];
            if (promotion.discount_percentage) {
                finalPrice = product.price * (1 - promotion.discount_percentage / 100);
            } else if (promotion.discount_amount) {
                finalPrice = Math.max(0, product.price - Number(promotion.discount_amount));
            }
        }
        return finalPrice;
    };

    const finalPrice = calculatePrice();
    const hasDiscount = finalPrice < product.price;

    if (loading && !currentProduct) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    return (
        <div>
            <Button onClick={onBack} variant="secondary" className="mb-4">
                ← Back to Marketplace
            </Button>

            <div className="bg-white rounded-lg shadow-lg overflow-hidden">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8 p-8">
                    {/* Image Gallery */}
                    <div>
                        <div className="mb-4 cursor-zoom-in" onClick={() => setZoomedImage(product.image_urls[selectedImageIndex] || product.image_urls[0])}>
                            <img
                                src={product.image_urls[selectedImageIndex] || product.image_urls[0]}
                                alt={product.name}
                                className="w-full h-96 object-cover rounded-lg transition-transform hover:scale-105"
                            />
                        </div>
                        {product.image_urls.length > 1 && (
                            <div className="grid grid-cols-4 gap-2">
                                {product.image_urls.map((url, index) => (
                                    <button
                                        key={index}
                                        onClick={() => setSelectedImageIndex(index)}
                                        className={`border-2 rounded-lg overflow-hidden ${
                                            selectedImageIndex === index
                                                ? 'border-indigo-600'
                                                : 'border-gray-300'
                                        }`}
                                    >
                                        <img
                                            src={url}
                                            alt={`${product.name} ${index + 1}`}
                                            className="w-full h-20 object-cover"
                                        />
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Info */}
                    <div>
                        <div className="flex items-start justify-between mb-2">
                            <h1 className="text-3xl font-bold text-gray-900">
                                {product.name}
                            </h1>
                            <ProductShare product={product} />
                        </div>
                        <div className="flex items-center mb-4">
                            {product.average_rating && product.average_rating > 0 && (
                                <div className="flex items-center mr-4">
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
                        </div>

                        <div className="mb-4">
                            {hasDiscount ? (
                                <div>
                                    <span className="text-3xl font-bold text-indigo-600">
                                        ${finalPrice.toFixed(2)}
                                    </span>
                                    <span className="ml-2 text-xl text-gray-500 line-through">
                                        ${product.price.toFixed(2)}
                                    </span>
                                    {activePromotions[0]?.discount_percentage && (
                                        <span className="ml-2 bg-red-100 text-red-800 px-2 py-1 rounded text-sm font-semibold">
                                            {activePromotions[0].discount_percentage}% OFF
                                        </span>
                                    )}
                                </div>
                            ) : (
                                <span className="text-3xl font-bold text-indigo-600">
                                    ${product.price.toFixed(2)}
                                </span>
                            )}
                        </div>

                        <div className="mb-6 space-y-2 text-sm text-gray-600">
                            <p><strong>Category:</strong> {product.category}</p>
                            <p><strong>Color:</strong> {product.color}</p>
                            <p><strong>Style:</strong> {product.style}</p>
                            <p><strong>Season:</strong> {product.season}</p>
                            <div className="flex items-center gap-2">
                                <p><strong>Size:</strong> {product.size}</p>
                                <button
                                    onClick={() => setShowSizeGuide(true)}
                                    className="text-indigo-600 hover:text-indigo-700 text-sm underline"
                                >
                                    Size Guide
                                </button>
                            </div>
                            <p><strong>Stock:</strong> {product.stock_quantity} available</p>
                        </div>

                        <div className="mb-6 space-y-3">
                            <ProductSellerInfo product={product} />
                            <SocialProof product={product} />
                        </div>

                        {product.description && (
                            <div className="mb-6">
                                <h3 className="font-semibold text-gray-900 mb-2">Description</h3>
                                <p className="text-gray-600">{product.description}</p>
                            </div>
                        )}

                        {product.stock_quantity > 0 ? (
                            <div className="space-y-4">
                                <div className="flex items-center space-x-4">
                                    <label
                                        htmlFor="product-quantity"
                                        className="text-sm font-medium text-gray-700"
                                    >
                                        Quantity:
                                    </label>
                                    <input
                                        id="product-quantity"
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
                                    <Button onClick={handleAddToCart} variant="secondary">
                                        Add to Cart
                                    </Button>
                                    <Button onClick={handleBuyNow}>
                                        Buy Now
                                    </Button>
                                </div>
                            </div>
                        ) : (
                            <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
                                Out of Stock
                            </div>
                        )}
                    </div>
                </div>

                {/* Reviews Section */}
                <div className="border-t border-gray-200 p-8">
                    <ProductReviews productId={product.id} reviews={reviews} />
                </div>
            </div>
            {zoomedImage && (
                <ProductImageZoom
                    imageUrl={zoomedImage}
                    alt={product.name}
                    onClose={() => setZoomedImage(null)}
                />
            )}
            {showContactSeller && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <ContactSeller
                        product={product}
                        onClose={() => setShowContactSeller(false)}
                    />
                </div>
            )}
            {showSizeGuide && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <SizeGuide
                        category={product.category}
                        onClose={() => setShowSizeGuide(false)}
                    />
                </div>
            )}
        </div>
    );
};

export default ProductDetail;


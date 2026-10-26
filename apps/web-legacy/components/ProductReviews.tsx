import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { createReview } from '../store/slices/reviewsSlice';
import { fetchBuyerOrders } from '../store/slices/ordersSlice';
import Button from './common/Button';
import { ProductReview } from '../types';
import { trackEvent } from '../analytics/events';

interface ProductReviewsProps {
    productId: string;
    reviews: ProductReview[];
}

const ProductReviews: React.FC<ProductReviewsProps> = ({ productId, reviews }) => {
    const dispatch = useAppDispatch();
    const { orders } = useAppSelector((state) => state.orders);
    const { session } = useAppSelector((state) => state.auth);

    const [showReviewForm, setShowReviewForm] = useState(false);
    const [rating, setRating] = useState(5);
    const [reviewText, setReviewText] = useState('');

    // Check if user has purchased this product
    const hasPurchased = orders.some(
        (order) => order.product_id === productId && order.status === 'delivered'
    );

    // Check if user has already reviewed
    const hasReviewed = reviews.some(
        (review) => review.user_id === session?.user?.id
    );

    const handleSubmitReview = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!hasPurchased) {
            alert('You must purchase this product before reviewing.');
            return;
        }

        const order = orders.find(
            (o) => o.product_id === productId && o.status === 'delivered'
        );

        if (!order) return;

        try {
            await dispatch(
                createReview({
                    product_id: productId,
                    order_id: order.id,
                    rating,
                    review_text: reviewText || undefined,
                })
            ).unwrap();

            trackEvent('review_submitted', {
                productId,
                rating,
                hasText: !!reviewText.trim(),
            });

            setShowReviewForm(false);
            setRating(5);
            setReviewText('');
        } catch (error: any) {
            alert(error.message || 'Failed to submit review');
        }
    };

    useEffect(() => {
        if (session) {
            dispatch(fetchBuyerOrders());
        }
    }, [dispatch, session]);

    return (
        <div>
            <h3 className="text-xl font-bold text-gray-900 mb-4">
                Reviews ({reviews.length})
            </h3>

            {session && hasPurchased && !hasReviewed && !showReviewForm && (
                <Button onClick={() => setShowReviewForm(true)} className="mb-4">
                    Write a Review
                </Button>
            )}

            {showReviewForm && (
                <form onSubmit={handleSubmitReview} className="mb-6 p-4 bg-gray-50 rounded-lg">
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Rating
                        </label>
                        <div className="flex space-x-1">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <button
                                    key={star}
                                    type="button"
                                    onClick={() => setRating(star)}
                                    className="focus:outline-none"
                                >
                                    <svg
                                        className={`w-8 h-8 ${
                                            star <= rating
                                                ? 'text-yellow-400'
                                                : 'text-gray-300'
                                        }`}
                                        fill="currentColor"
                                        viewBox="0 0 20 20"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="mb-4">
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                            Review (optional)
                        </label>
                        <textarea
                            value={reviewText}
                            onChange={(e) => setReviewText(e.target.value)}
                            rows={4}
                            className="w-full px-4 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                            placeholder="Share your thoughts about this product..."
                        />
                    </div>
                    <div className="flex space-x-2">
                        <Button type="submit">Submit Review</Button>
                        <Button
                            type="button"
                            variant="secondary"
                            onClick={() => {
                                setShowReviewForm(false);
                                setRating(5);
                                setReviewText('');
                            }}
                        >
                            Cancel
                        </Button>
                    </div>
                </form>
            )}

            {reviews.length === 0 ? (
                <p className="text-gray-600">No reviews yet. Be the first to review!</p>
            ) : (
                <div className="space-y-4">
                    {reviews.map((review) => (
                        <div key={review.id} className="border-b border-gray-200 pb-4">
                            <div className="flex items-center mb-2">
                                <div className="flex items-center">
                                    {[...Array(5)].map((_, i) => (
                                        <svg
                                            key={i}
                                            className={`w-4 h-4 ${
                                                i < review.rating
                                                    ? 'text-yellow-400'
                                                    : 'text-gray-300'
                                            }`}
                                            fill="currentColor"
                                            viewBox="0 0 20 20"
                                        >
                                            <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                        </svg>
                                    ))}
                                </div>
                                <span className="ml-2 text-sm text-gray-600">
                                    {new Date(review.created_at).toLocaleDateString()}
                                </span>
                            </div>
                            {review.review_text && (
                                <p className="text-gray-700">{review.review_text}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default ProductReviews;


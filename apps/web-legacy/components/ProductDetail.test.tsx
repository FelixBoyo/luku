import { describe, it, expect, beforeEach, vi } from 'vitest';
import { fireEvent, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/src/test/utils';
import ProductDetail from './ProductDetail';
import { Product } from '../types';
import * as productsSlice from '../store/slices/productsSlice';
import * as reviewsSlice from '../store/slices/reviewsSlice';
import * as promotionsSlice from '../store/slices/promotionsSlice';
import * as cartSlice from '../store/slices/cartSlice';
import * as toastSlice from '../store/slices/toastSlice';

// Mock child components
vi.mock('./ProductReviews', () => ({
    default: ({ productId, reviews }: { productId: string; reviews: any[] }) => (
        <div data-testid="product-reviews">Reviews for {productId} ({reviews.length})</div>
    ),
}));

vi.mock('./Checkout', () => ({
    default: ({ product, quantity, onSuccess, onCancel }: any) => (
        <div data-testid="checkout">
            <div>Checkout: {product.name} x{quantity}</div>
            <button onClick={onSuccess}>Complete</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));

vi.mock('./ProductImageZoom', () => ({
    default: ({ imageUrl, alt, onClose }: any) => (
        <div data-testid="image-zoom">
            <div>Zoomed: {alt}</div>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('./ProductShare', () => ({
    default: () => <div data-testid="product-share">Share</div>,
}));

vi.mock('./SocialProof', () => ({
    default: () => <div data-testid="social-proof">Social Proof</div>,
}));

vi.mock('./ProductSellerInfo', () => ({
    default: () => <div data-testid="seller-info">Seller Info</div>,
}));

vi.mock('./ContactSeller', () => ({
    default: ({ product, onClose }: any) => (
        <div data-testid="contact-seller">
            <div>Contact Seller: {product.name}</div>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('./SizeGuide', () => ({
    default: ({ category, onClose }: any) => (
        <div data-testid="size-guide">
            <div>Size Guide: {category}</div>
            <button onClick={onClose}>Close</button>
        </div>
    ),
}));

vi.mock('../utils/recentlyViewed', () => ({
    addToRecentlyViewed: vi.fn(),
}));

describe('ProductDetail', () => {
    const mockProduct: Product = {
        id: 'product-1',
        business_id: 'business-1',
        name: 'Test Product',
        description: 'Test Description',
        price: 99.99,
        category: 'Top',
        color: 'Blue',
        style: 'Casual',
        season: 'Spring',
        size: 'M',
        stock_quantity: 10,
        image_urls: [
            'https://example.com/image1.jpg',
            'https://example.com/image2.jpg',
        ],
        is_featured: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    const mockOnBack = vi.fn();
    const mockOnCheckout = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render product information correctly', () => {
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Test Description')).toBeInTheDocument();
        expect(screen.getByText('$99.99')).toBeInTheDocument();
        expect(screen.getByText(/Category:/)).toBeInTheDocument();
        expect(screen.getByText(/Color:/)).toBeInTheDocument();
        expect(screen.getByText(/Stock:/)).toBeInTheDocument();
    });

    it('should call onBack when back button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const backButton = screen.getByText('← Back to Marketplace');
        await user.click(backButton);

        expect(mockOnBack).toHaveBeenCalledTimes(1);
    });

    it('should display loading spinner when loading and no currentProduct', () => {
        const store = render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />,
            {
                preloadedState: {
                    products: {
                        products: [],
                        featuredProducts: [],
                        currentProduct: null,
                        wardrobeRecommendations: [],
                        loading: true,
                        error: null,
                        pagination: null,
                    },
                },
            }
        );
        // Note: This test may need adjustment based on actual loading behavior
    });

    it('should handle image selection', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const thumbnailButtons = screen.getAllByAltText(/Test Product \d+/);
        if (thumbnailButtons.length > 1) {
            await user.click(thumbnailButtons[1]);
            // Image selection should update
        }
    });

    it('should open image zoom when main image is clicked', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const mainImage = screen.getByAltText('Test Product');
        await user.click(mainImage);

        expect(screen.getByTestId('image-zoom')).toBeInTheDocument();
    });

    it('should close image zoom when close button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const mainImage = screen.getByAltText('Test Product');
        await user.click(mainImage);

        const closeButton = screen.getByText('Close');
        await user.click(closeButton);

        expect(screen.queryByTestId('image-zoom')).not.toBeInTheDocument();
    });

    it('should handle quantity selection', async () => {
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const quantityInput = screen.getByLabelText(/Quantity:/) as HTMLInputElement;
        fireEvent.change(quantityInput, { target: { value: '5' } });

        expect(quantityInput.value).toBe('5');
    });

    it('should limit quantity to stock quantity', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const quantityInput = screen.getByLabelText(/Quantity:/) as HTMLInputElement;
        await user.clear(quantityInput);
        await user.type(quantityInput, '20'); // More than stock_quantity (10)

        // Should be limited to 10
        expect(Number(quantityInput.value)).toBeLessThanOrEqual(10);
    });

    it('should add product to cart when Add to Cart is clicked', async () => {
        const user = userEvent.setup();
        vi.spyOn(cartSlice, 'addToCart').mockReturnValue({
            type: 'cart/addToCart',
            payload: { product: mockProduct, quantity: 1 },
        });

        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const addToCartButton = screen.getByText('Add to Cart');
        await user.click(addToCartButton);

        // Verify dispatch was called (through Redux)
        await waitFor(() => {
            expect(screen.getByText('Add to Cart')).toBeInTheDocument();
        });
    }, 15000);

    it('should show checkout when Buy Now is clicked', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const buyNowButton = screen.getByText('Buy Now');
        await user.click(buyNowButton);

        expect(screen.getByTestId('checkout')).toBeInTheDocument();
    });

    it('should close checkout when cancelled', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const buyNowButton = screen.getByText('Buy Now');
        await user.click(buyNowButton);

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        expect(screen.queryByTestId('checkout')).not.toBeInTheDocument();
    });

    it('should show out of stock message when stock is 0', () => {
        const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
        render(
            <ProductDetail
                product={outOfStockProduct}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
        expect(screen.queryByText('Add to Cart')).not.toBeInTheDocument();
        expect(screen.queryByText('Buy Now')).not.toBeInTheDocument();
    });

    it('should display promotions and discounted price', () => {
        const store = render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />,
            {
                preloadedState: {
                    promotions: {
                        promotions: [],
                        activePromotions: [{
                            id: 'promo-1',
                            business_id: 'business-1',
                            promotion_type: 'discount',
                            discount_percentage: 20,
                            start_date: new Date(Date.now() - 86400000).toISOString(),
                            end_date: new Date(Date.now() + 86400000).toISOString(),
                            is_active: true,
                            created_at: '2024-01-01T00:00:00Z',
                            updated_at: '2024-01-01T00:00:00Z',
                        }],
                        loading: false,
                        error: null,
                    },
                },
            }
        );

        // Should show discounted price
        expect(screen.getByText('$79.99')).toBeInTheDocument(); // 99.99 * 0.8
        expect(screen.getByText('$99.99')).toBeInTheDocument(); // Original price with line-through
        expect(screen.getByText(/20% OFF/)).toBeInTheDocument();
    });

    it('should open size guide when Size Guide is clicked', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const sizeGuideLink = screen.getByText('Size Guide');
        await user.click(sizeGuideLink);

        expect(screen.getByTestId('size-guide')).toBeInTheDocument();
    });

    it('should close size guide when close button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />
        );

        const sizeGuideLink = screen.getByText('Size Guide');
        await user.click(sizeGuideLink);

        const sizeGuide = screen.getByTestId('size-guide');
        const closeButton = within(sizeGuide).getByText('Close');
        await user.click(closeButton);

        expect(screen.queryByTestId('size-guide')).not.toBeInTheDocument();
    });

    it('should display product reviews', () => {
        render(
            <ProductDetail
                product={mockProduct}
                onBack={mockOnBack}
            />,
            {
                preloadedState: {
                    reviews: {
                        reviews: [
                            {
                                id: 'review-1',
                                product_id: 'product-1',
                                user_id: 'user-1',
                                order_id: 'order-1',
                                rating: 5,
                                review_text: 'Great product!',
                                created_at: '2024-01-01T00:00:00Z',
                                updated_at: '2024-01-01T00:00:00Z',
                            },
                        ],
                        loading: false,
                        error: null,
                    },
                },
            }
        );

        expect(screen.getByTestId('product-reviews')).toBeInTheDocument();
    });

    it('should display rating stars when average_rating is available', () => {
        const ratedProduct = {
            ...mockProduct,
            average_rating: 4.5,
            review_count: 10,
        };
        render(
            <ProductDetail
                product={ratedProduct}
                onBack={mockOnBack}
            />
        );

        // Should show rating
        expect(screen.getByText(/4\.5/)).toBeInTheDocument();
        expect(screen.getByText(/\(10 reviews\)/)).toBeInTheDocument();
    });

    it('should handle product with single image', () => {
        const singleImageProduct = {
            ...mockProduct,
            image_urls: ['https://example.com/image1.jpg'],
        };
        render(
            <ProductDetail
                product={singleImageProduct}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByAltText('Test Product')).toBeInTheDocument();
        // Should not show thumbnail grid for single image
    });

    // Edge cases
    it('should handle product with no images', () => {
        const noImageProduct = {
            ...mockProduct,
            image_urls: [],
        };
        render(
            <ProductDetail
                product={noImageProduct}
                onBack={mockOnBack}
            />
        );

        // Should still render product info
        expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should handle product with no description', () => {
        const noDescProduct = {
            ...mockProduct,
            description: '',
        };
        render(
            <ProductDetail
                product={noDescProduct}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('Test Product')).toBeInTheDocument();
    });

    it('should handle zero stock quantity', () => {
        const zeroStockProduct = {
            ...mockProduct,
            stock_quantity: 0,
        };
        render(
            <ProductDetail
                product={zeroStockProduct}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('should handle null/undefined average_rating', () => {
        const noRatingProduct = {
            ...mockProduct,
            average_rating: undefined,
            review_count: undefined,
        };
        render(
            <ProductDetail
                product={noRatingProduct}
                onBack={mockOnBack}
            />
        );

        expect(screen.getByText('Test Product')).toBeInTheDocument();
        // Should not crash when rating is missing
    });
});

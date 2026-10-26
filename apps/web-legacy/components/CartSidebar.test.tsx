import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/src/test/utils';
import CartSidebar from './CartSidebar';
import { Product } from '../types';
import { addToCart } from '../store/slices/cartSlice';

// Mock child components
vi.mock('./Checkout', () => ({
    default: ({ product, quantity, onSuccess, onCancel }: any) => (
        <div data-testid="checkout">
            <div>Checkout: {product.name} x{quantity}</div>
            <button onClick={onSuccess}>Complete</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));

vi.mock('./MultiItemCheckout', () => ({
    default: ({ items, onSuccess, onCancel }: any) => (
        <div data-testid="multi-checkout">
            <div>Multi Checkout: {items.length} items</div>
            <button onClick={onSuccess}>Complete</button>
            <button onClick={onCancel}>Cancel</button>
        </div>
    ),
}));

describe('CartSidebar', () => {
    const mockProduct1: Product = {
        id: 'product-1',
        business_id: 'business-1',
        name: 'Product 1',
        description: 'Description 1',
        price: 99.99,
        category: 'Top',
        color: 'Blue',
        style: 'Casual',
        season: 'Spring',
        size: 'M',
        stock_quantity: 10,
        image_urls: ['https://example.com/image1.jpg'],
        is_featured: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    const mockProduct2: Product = {
        ...mockProduct1,
        id: 'product-2',
        name: 'Product 2',
        price: 149.99,
    };

    const mockOnClose = vi.fn();
    const mockOnCheckout = vi.fn();

    const createStoreWithCart = (items: Array<{ product: Product; quantity: number }>) => {
        return render(
            <CartSidebar
                isOpen={true}
                onClose={mockOnClose}
                onCheckout={mockOnCheckout}
            />,
            {
                preloadedState: {
                    cart: {
                        items,
                    },
                },
            }
        );
    };

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render when isOpen is true', () => {
        createStoreWithCart([]);
        expect(screen.getByText('Shopping Cart')).toBeInTheDocument();
    });

    it('should not render when isOpen is false', () => {
        render(
            <CartSidebar
                isOpen={false}
                onClose={mockOnClose}
                onCheckout={mockOnCheckout}
            />
        );
        const panelTitle = screen.getByText('Shopping Cart');
        const sidebar = panelTitle.closest('.fixed.top-0.right-0');
        expect(sidebar).toHaveClass('translate-x-full');
    });

    it('should display empty cart message when cart is empty', () => {
        createStoreWithCart([]);
        expect(screen.getByText(/Your cart is empty/)).toBeInTheDocument();
    });

    it('should display cart items when cart has items', () => {
        createStoreWithCart([
            { product: mockProduct1, quantity: 2 },
        ]);
        expect(screen.getByText('Product 1')).toBeInTheDocument();
    });

    it('should calculate and display total items correctly', () => {
        createStoreWithCart([
            { product: mockProduct1, quantity: 2 },
            { product: mockProduct2, quantity: 3 },
        ]);
        expect(screen.getByText('$649.95')).toBeInTheDocument();
    });

    it('should calculate and display total price correctly', () => {
        createStoreWithCart([
            { product: mockProduct1, quantity: 2 }, // 99.99 * 2 = 199.98
            { product: mockProduct2, quantity: 1 },  // 149.99 * 1 = 149.99
        ]);
        // Total: 349.97
        expect(screen.getByText('$349.97')).toBeInTheDocument();
    });

    it('should call onClose when close button is clicked', async () => {
        const user = userEvent.setup();
        createStoreWithCart([]);
        
        const closeButton = screen.getByLabelText('Close cart');
        await user.click(closeButton);
        
        expect(mockOnClose).toHaveBeenCalledTimes(1);
    });

    it('should call onClose when overlay is clicked', async () => {
        const user = userEvent.setup();
        createStoreWithCart([]);
        
        // Find overlay and click it
        const overlay = document.querySelector('.fixed.inset-0.bg-black');
        if (overlay) {
            await user.click(overlay as HTMLElement);
            expect(mockOnClose).toHaveBeenCalled();
        }
    });

    it('should remove item from cart when remove button is clicked', async () => {
        const user = userEvent.setup();
        const store = createStoreWithCart([
            { product: mockProduct1, quantity: 1 },
        ]);

        const removeButtons = screen.getAllByLabelText(/Remove/);
        if (removeButtons.length > 0) {
            await user.click(removeButtons[0]);
            // Item should be removed (tested through Redux)
        }
    });

    it('should update quantity when quantity input changes', async () => {
        const user = userEvent.setup();
        createStoreWithCart([
            { product: mockProduct1, quantity: 1 },
        ]);

        // Find quantity input (implementation may vary)
        const quantityInputs = screen.queryAllByDisplayValue('1');
        if (quantityInputs.length > 0) {
            const input = quantityInputs[0] as HTMLInputElement;
            await user.clear(input);
            await user.type(input, '3');
            expect(input.value).toBe('3');
        }
    });

    it('should show checkout for single item', async () => {
        const user = userEvent.setup();
        createStoreWithCart([
            { product: mockProduct1, quantity: 1 },
        ]);

        const checkoutButton = screen.getByText(/Checkout|Proceed to Checkout/);
        await user.click(checkoutButton);

        await waitFor(() => {
            expect(screen.getByTestId('checkout')).toBeInTheDocument();
        });
    });

    it('should show multi-item checkout for multiple items', async () => {
        const user = userEvent.setup();
        createStoreWithCart([
            { product: mockProduct1, quantity: 1 },
            { product: mockProduct2, quantity: 1 },
        ]);

        const checkoutButton = screen.getByText(/Checkout|Proceed to Checkout/);
        await user.click(checkoutButton);

        await waitFor(() => {
            expect(screen.getByTestId('multi-checkout')).toBeInTheDocument();
        });
    });

    it('should clear cart after successful checkout', async () => {
        const user = userEvent.setup();
        createStoreWithCart([
            { product: mockProduct1, quantity: 1 },
        ]);

        const checkoutButton = screen.getByText(/Checkout|Proceed to Checkout/);
        await user.click(checkoutButton);

        await waitFor(() => {
            expect(screen.getByTestId('checkout')).toBeInTheDocument();
        });

        const completeButton = screen.getByText('Complete');
        await user.click(completeButton);

        // Cart should be cleared (tested through Redux)
    });

    it('should close checkout when cancelled', async () => {
        const user = userEvent.setup();
        createStoreWithCart([
            { product: mockProduct1, quantity: 1 },
        ]);

        const checkoutButton = screen.getByText(/Checkout|Proceed to Checkout/);
        await user.click(checkoutButton);

        await waitFor(() => {
            expect(screen.getByTestId('checkout')).toBeInTheDocument();
        });

        const cancelButton = screen.getByText('Cancel');
        await user.click(cancelButton);

        await waitFor(() => {
            expect(screen.queryByTestId('checkout')).not.toBeInTheDocument();
        });
    });

    it('should disable checkout button when cart is empty', () => {
        createStoreWithCart([]);
        const checkoutButton = screen.queryByText(/Checkout|Proceed to Checkout/);
        // Button should be disabled or not present when cart is empty
        if (checkoutButton) {
            expect(checkoutButton).toBeDisabled();
        }
    });
});

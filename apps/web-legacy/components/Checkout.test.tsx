import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/src/test/utils';
import Checkout from './Checkout';
import { Product } from '../types';
import * as stripeService from '../services/stripeService';
import * as ordersSlice from '../store/slices/ordersSlice';
import * as paymentsConfigService from '../services/paymentsConfigService';

// Mock Stripe
vi.mock('@stripe/react-stripe-js', () => ({
    Elements: ({ children }: { children: React.ReactNode }) => <div data-testid="stripe-elements">{children}</div>,
    PaymentElement: () => <div data-testid="payment-element">Payment Element</div>,
    useStripe: () => ({
        confirmPayment: vi.fn(),
    }),
    useElements: () => ({
        getElement: vi.fn(),
    }),
}));

vi.mock('../services/stripeService', () => ({
    isStripeAvailable: vi.fn(() => true),
    initializeStripe: vi.fn(),
    createPaymentIntent: vi.fn(),
    confirmPayment: vi.fn(),
    getStripe: vi.fn(),
}));

vi.mock('../services/paymentsConfigService', () => ({
    fetchPaymentsConfig: vi.fn(),
}));

describe('Checkout', () => {
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
        image_urls: ['https://example.com/image.jpg'],
        is_featured: false,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    };

    const mockOnSuccess = vi.fn();
    const mockOnCancel = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(paymentsConfigService.fetchPaymentsConfig).mockResolvedValue({
            stripe: { cards: true },
        });
        vi.mocked(stripeService.isStripeAvailable).mockReturnValue(true);
        vi.mocked(stripeService.initializeStripe).mockResolvedValue({
            elements: vi.fn(),
        } as any);
        vi.mocked(stripeService.createPaymentIntent).mockResolvedValue('client_secret_123');
    });

    it('should render checkout form', async () => {
        render(
            <Checkout
                product={mockProduct}
                quantity={1}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        // Use findBy* to flush the fetchPaymentsConfig / initializeStripe effects
        // that fire on mount; otherwise their resolution lands outside act().
        expect(await screen.findByText('Checkout')).toBeInTheDocument();
        expect(screen.getByText('Order Summary')).toBeInTheDocument();
        expect(screen.getByText('Test Product x 1')).toBeInTheDocument();
        expect(screen.getAllByText('$99.99').length).toBeGreaterThan(0);
    });

    it('should display order summary with correct quantity', async () => {
        render(
            <Checkout
                product={mockProduct}
                quantity={3}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        expect(await screen.findByText('Test Product x 3')).toBeInTheDocument();
        expect(screen.getAllByText('$299.97').length).toBeGreaterThan(0); // 99.99 * 3
    });

    it('should render shipping address form fields', async () => {
        render(
            <Checkout
                product={mockProduct}
                quantity={1}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        await waitFor(() => {
            const textboxes = screen.getAllByRole('textbox');
            expect(textboxes.length).toBeGreaterThanOrEqual(6);
        });
    });

    it('should handle shipping address input changes', async () => {
        const user = userEvent.setup();
        render(
            <Checkout
                product={mockProduct}
                quantity={1}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        await waitFor(() =>
            expect(screen.getAllByRole('textbox').length).toBeGreaterThan(0)
        );
        const nameInput = screen.getAllByRole('textbox')[0] as HTMLInputElement;
        await user.type(nameInput, 'John Doe');

        expect(nameInput.value).toBe('John Doe');
    });

    it('should call onCancel when cancel button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <Checkout
                product={mockProduct}
                quantity={1}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        const cancelButton = await screen.findByText('Cancel');
        await user.click(cancelButton);

        expect(mockOnCancel).toHaveBeenCalledTimes(1);
    });

    it('should display error message when Stripe is not available', async () => {
        vi.mocked(stripeService.isStripeAvailable).mockReturnValue(false);
        
        render(
            <Checkout
                product={mockProduct}
                quantity={1}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/Payment processing is not available/)).toBeInTheDocument();
        });
    });

    it('should display fallback message while Stripe is not ready', async () => {
        vi.mocked(stripeService.initializeStripe).mockImplementation(
            () => new Promise(() => {})
        );

        render(
            <Checkout
                product={mockProduct}
                quantity={1}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        // Await findBy* so the fetchPaymentsConfig promise (resolved in beforeEach)
        // flushes inside act() before the test exits.
        expect(
            await screen.findByText(/Development Mode/)
        ).toBeInTheDocument();
    });

    it('should display error when Stripe initialization fails', async () => {
        vi.mocked(stripeService.initializeStripe).mockRejectedValue(
            new Error('Failed to initialize')
        );

        render(
            <Checkout
                product={mockProduct}
                quantity={1}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        await waitFor(() => {
            expect(screen.getByText(/Failed to initialize/)).toBeInTheDocument();
        });
    });

    it('should calculate total price correctly', async () => {
        render(
            <Checkout
                product={mockProduct}
                quantity={2}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        await waitFor(() => {
            const totalElements = screen.getAllByText('$199.98');
            expect(totalElements.length).toBeGreaterThan(0);
        });
    });

    it('should have required fields marked with asterisk', async () => {
        render(
            <Checkout
                product={mockProduct}
                quantity={1}
                onSuccess={mockOnSuccess}
                onCancel={mockOnCancel}
            />
        );

        await waitFor(() => {
            const requiredFields = screen.getAllByText('*');
            expect(requiredFields.length).toBeGreaterThan(0);
        });
    });
});

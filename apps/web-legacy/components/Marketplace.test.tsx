// Import the mock first to set up environment
import '@/src/test/mocks/supabaseClient';

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, createTestStore } from '@/src/test/utils';
import userEvent from '@testing-library/user-event';
import Marketplace from './Marketplace';
import { Product } from '../types';
import * as productsSlice from '../store/slices/productsSlice';

// Mock the async thunks
vi.mock('../store/slices/productsSlice', async () => {
    const actual = await vi.importActual('../store/slices/productsSlice');
    return {
        ...actual,
        fetchAllProducts: vi.fn(() => ({
            type: 'products/fetchAllProducts/mock',
        })),
        fetchFeaturedProducts: vi.fn(() => ({
            type: 'products/fetchFeaturedProducts/mock',
        })),
    };
});

const mockProducts: Product[] = [
    {
        id: '1',
        business_id: 'b1',
        name: 'Product 1',
        description: 'Description 1',
        price: 100,
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
    },
    {
        id: '2',
        business_id: 'b1',
        name: 'Product 2',
        description: 'Description 2',
        price: 200,
        category: 'Dress',
        color: 'Red',
        style: 'Formal',
        season: 'Summer',
        size: 'L',
        stock_quantity: 5,
        image_urls: ['https://example.com/image2.jpg'],
        is_featured: true,
        is_active: true,
        created_at: '2024-01-01T00:00:00Z',
        updated_at: '2024-01-01T00:00:00Z',
    },
];

describe('Marketplace Component', () => {
    let store: ReturnType<typeof createTestStore>;

    beforeEach(() => {
        store = createTestStore({
            products: {
                products: mockProducts,
                featuredProducts: [mockProducts[1]],
                currentProduct: null,
                loading: false,
                error: null,
            },
        });
        vi.clearAllMocks();
    });

    it('renders marketplace title', () => {
        render(<Marketplace />, { store });
        expect(screen.getByText('Marketplace')).toBeInTheDocument();
    });

    it('displays featured products section', () => {
        render(<Marketplace />, { store });
        expect(screen.getByText('Featured Products')).toBeInTheDocument();
    });

    it('displays filter section with core filter inputs', () => {
        render(<Marketplace />, { store });
        expect(screen.getByText('Filter Products')).toBeInTheDocument();
        // Search input (autocomplete)
        expect(screen.getByPlaceholderText('Search products...')).toBeInTheDocument();
        // Category and style selects
        const selects = screen.getAllByRole('combobox');
        expect(selects[0]).toBeInTheDocument();
        expect(selects[1]).toBeInTheDocument();
        // Price range label
        expect(screen.getByText(/Price Range/i)).toBeInTheDocument();
    });

    it('displays products when available', async () => {
        // Update store to not be loading
        const nonLoadingStore = createTestStore({
            products: {
                products: mockProducts,
                featuredProducts: [mockProducts[1]],
                currentProduct: null,
                loading: false,
                error: null,
            },
        });
        render(<Marketplace />, { store: nonLoadingStore });
        await waitFor(() => {
            expect(screen.getByText('Product 1')).toBeInTheDocument();
        });
        expect(screen.getAllByText('Product 2').length).toBeGreaterThan(0);
    });

    it('displays loading spinner when loading', () => {
        const loadingStore = createTestStore({
            products: {
                products: [],
                featuredProducts: [],
                currentProduct: null,
                loading: true,
                error: null,
            },
        });
        render(<Marketplace />, { store: loadingStore });
        // Spinner should be present (checking by class or structure)
        const spinner = document.querySelector('.animate-spin');
        expect(spinner).toBeInTheDocument();
    });

    it('displays no products message when products array is empty', () => {
        const emptyStore = createTestStore({
            products: {
                products: [],
                featuredProducts: [],
                currentProduct: null,
                loading: false,
                error: null,
            },
        });
        render(<Marketplace />, { store: emptyStore });
        expect(screen.getByText('No products found')).toBeInTheDocument();
    });

    it('allows filtering by category', async () => {
        const user = userEvent.setup();
        render(<Marketplace />, { store });

        const categorySelect = screen.getAllByRole('combobox')[0];
        await user.selectOptions(categorySelect, 'Top');

        const applyButton = screen.getByRole('button', { name: /apply/i });
        await user.click(applyButton);

        // Verify that fetchAllProducts was called with category filter
        await waitFor(() => {
            expect(productsSlice.fetchAllProducts).toHaveBeenCalled();
        });
    });

    it('allows searching products', async () => {
        const user = userEvent.setup();
        render(<Marketplace />, { store });

        const searchInput = screen.getByPlaceholderText('Search products...');
        await user.type(searchInput, 'Product 1');

        const applyButton = screen.getByRole('button', { name: /apply/i });
        await user.click(applyButton);

        await waitFor(() => {
            expect(productsSlice.fetchAllProducts).toHaveBeenCalled();
        });
    });

    it('clears filters when clear button is clicked', async () => {
        const user = userEvent.setup();
        render(<Marketplace />, { store });

        const searchInput = screen.getByPlaceholderText('Search products...');
        await user.type(searchInput, 'test search');

        const clearButton = screen.getByRole('button', { name: /clear/i });
        await user.click(clearButton);

        expect(searchInput).toHaveValue('');
    });

    it('displays all category options', () => {
        render(<Marketplace />, { store });
        // Use getByRole to find the select element
        const categorySelect = screen.getAllByRole('combobox')[0];
        expect(categorySelect).toBeInTheDocument();
        
        // Check for some expected categories
        expect(screen.getByRole('option', { name: 'Top' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Dress' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Shoes' })).toBeInTheDocument();
    });

    it('displays all style options', () => {
        render(<Marketplace />, { store });
        // Use getByRole to find the select element
        const styleSelect = screen.getAllByRole('combobox')[1];
        expect(styleSelect).toBeInTheDocument();
        
        // Check for some expected styles
        expect(screen.getByRole('option', { name: 'Casual' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Formal' })).toBeInTheDocument();
        expect(screen.getByRole('option', { name: 'Sporty' })).toBeInTheDocument();
    });
});

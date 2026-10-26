// Import the mock first to set up environment
import '@/src/test/mocks/supabaseClient';

import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@/src/test/utils';
import userEvent from '@testing-library/user-event';
import ProductCard from './ProductCard';
import { Product } from '../types';

const mockProduct: Product = {
    id: '1',
    business_id: 'business-1',
    name: 'Test Product',
    description: 'A test product',
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

describe('ProductCard Component', () => {
    it('renders product information correctly', () => {
        render(<ProductCard product={mockProduct} />);
        
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.getByText('Top')).toBeInTheDocument();
        expect(screen.getByText('$99.99')).toBeInTheDocument();
        expect(screen.getByText('Blue')).toBeInTheDocument();
        expect(screen.getByText('M')).toBeInTheDocument();
    });

    it('displays product image when image_urls is provided', () => {
        render(<ProductCard product={mockProduct} />);
        const image = screen.getByAltText('Test Product');
        expect(image).toBeInTheDocument();
        expect(image).toHaveAttribute('src', 'https://example.com/image.jpg');
    });

    it('shows featured badge when product is featured', () => {
        const featuredProduct = { ...mockProduct, is_featured: true };
        render(<ProductCard product={featuredProduct} />);
        expect(screen.getByText('Featured')).toBeInTheDocument();
    });

    it('does not show featured badge when product is not featured', () => {
        render(<ProductCard product={mockProduct} />);
        expect(screen.queryByText('Featured')).not.toBeInTheDocument();
    });

    it('shows out of stock overlay when stock_quantity is 0', () => {
        const outOfStockProduct = { ...mockProduct, stock_quantity: 0 };
        render(<ProductCard product={outOfStockProduct} />);
        expect(screen.getByText('Out of Stock')).toBeInTheDocument();
    });

    it('displays rating when average_rating is provided', () => {
        const ratedProduct = {
            ...mockProduct,
            average_rating: 4.5,
            review_count: 10,
        };
        render(<ProductCard product={ratedProduct} />);
        expect(screen.getByText('4.5 (10)')).toBeInTheDocument();
    });

    it('displays rating without review count when review_count is not provided', () => {
        const ratedProduct = {
            ...mockProduct,
            average_rating: 4.5,
        };
        render(<ProductCard product={ratedProduct} />);
        expect(screen.getByText('4.5')).toBeInTheDocument();
    });

    it('calls onClick handler when card is clicked', async () => {
        const handleClick = vi.fn();
        const user = userEvent.setup();
        render(<ProductCard product={mockProduct} onClick={handleClick} />);
        
        await user.click(screen.getByText('Test Product').closest('div')!);
        expect(handleClick).toHaveBeenCalledWith(mockProduct);
    });

    it('applies cursor-pointer class when onClick is provided', () => {
        const handleClick = vi.fn();
        render(<ProductCard product={mockProduct} onClick={handleClick} />);
        // Find the clickable div (the outermost div with onClick)
        const card = screen.getByText('Test Product').closest('div.block') || 
                     screen.getByText('Test Product').closest('div');
        expect(card).toBeTruthy();
        // Check if the card or its parent has cursor-pointer
        const clickableElement = card?.closest('div[class*="cursor"]') || card;
        expect(clickableElement?.className || '').toMatch(/cursor-pointer/);
    });

    it('handles product with no images gracefully', () => {
        const productWithoutImages = { ...mockProduct, image_urls: [] };
        render(<ProductCard product={productWithoutImages} />);
        expect(screen.getByText('Test Product')).toBeInTheDocument();
        expect(screen.queryByAltText('Test Product')).not.toBeInTheDocument();
    });

    it('formats price correctly with two decimal places', () => {
        const productWithDecimalPrice = { ...mockProduct, price: 123.456 };
        render(<ProductCard product={productWithDecimalPrice} />);
        expect(screen.getByText('$123.46')).toBeInTheDocument();
    });
});

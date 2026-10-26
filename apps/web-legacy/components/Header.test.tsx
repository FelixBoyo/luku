import { describe, it, expect, beforeEach, vi } from 'vitest';
import { screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { render } from '@/src/test/utils';
import Header from './Header';
import type { Session } from '@supabase/supabase-js';

describe('Header', () => {
    const mockSession: Session = {
        access_token: 'token',
        token_type: 'bearer',
        expires_in: 3600,
        expires_at: Date.now() / 1000 + 3600,
        refresh_token: 'refresh',
        user: {
            id: 'user-1',
            email: 'test@example.com',
            app_metadata: {},
            user_metadata: {},
            aud: 'authenticated',
            created_at: '2024-01-01T00:00:00Z',
        },
    };

    const mockOnSignOut = vi.fn();
    const mockOnCartClick = vi.fn();
    const mockOnWishlistClick = vi.fn();

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('should render header with logo and title', () => {
        render(
            <Header
                session={mockSession}
                onSignOut={mockOnSignOut}
                onCartClick={mockOnCartClick}
            />
        );
        
        expect(screen.getByText('LUKU')).toBeInTheDocument();
    });

    it('should display user email', () => {
        render(
            <Header
                session={mockSession}
                onSignOut={mockOnSignOut}
                onCartClick={mockOnCartClick}
            />
        );
        
        expect(screen.getByText(/test@example.com/)).toBeInTheDocument();
    });

    it('should call onSignOut when sign out button is clicked', async () => {
        const user = userEvent.setup();
        render(
            <Header
                session={mockSession}
                onSignOut={mockOnSignOut}
                onCartClick={mockOnCartClick}
            />
        );
        
        const signOutButton = screen.getByText('Sign Out');
        await user.click(signOutButton);
        
        expect(mockOnSignOut).toHaveBeenCalledTimes(1);
    });

    it('should call onCartClick when cart icon is clicked', async () => {
        const user = userEvent.setup();
        render(
            <Header
                session={mockSession}
                onSignOut={mockOnSignOut}
                onCartClick={mockOnCartClick}
            />
        );
        
        const cartButton = screen.getByLabelText('Shopping cart');
        await user.click(cartButton);
        
        expect(mockOnCartClick).toHaveBeenCalledTimes(1);
    });

    it('should display cart item count badge', () => {
        render(
            <Header
                session={mockSession}
                onSignOut={mockOnSignOut}
                onCartClick={mockOnCartClick}
            />,
            {
                preloadedState: {
                    cart: {
                        items: [
                            {
                                product: {
                                    id: '1',
                                    business_id: 'b1',
                                    name: 'Product',
                                    price: 99.99,
                                    category: 'Top',
                                    color: 'Blue',
                                    style: 'Casual',
                                    season: 'Spring',
                                    size: 'M',
                                    stock_quantity: 10,
                                    image_urls: [],
                                    is_featured: false,
                                    is_active: true,
                                    created_at: '2024-01-01T00:00:00Z',
                                    updated_at: '2024-01-01T00:00:00Z',
                                },
                                quantity: 2,
                            },
                        ],
                    },
                },
            }
        );
        
        expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should display wishlist count badge when onWishlistClick is provided', () => {
        render(
            <Header
                session={mockSession}
                onSignOut={mockOnSignOut}
                onCartClick={mockOnCartClick}
                onWishlistClick={mockOnWishlistClick}
            />,
            {
                preloadedState: {
                    wishlist: {
                        items: [
                            {
                                id: '1',
                                product_id: 'product-1',
                                user_id: 'user-1',
                                created_at: '2024-01-01T00:00:00Z',
                            },
                        ],
                    },
                },
            }
        );
        
        expect(screen.getByLabelText('Wishlist')).toBeInTheDocument();
    });

    it('should call onWishlistClick when wishlist icon is clicked', async () => {
        const user = userEvent.setup();
        render(
            <Header
                session={mockSession}
                onSignOut={mockOnSignOut}
                onCartClick={mockOnCartClick}
                onWishlistClick={mockOnWishlistClick}
            />
        );
        
        const wishlistButton = screen.getByLabelText('Wishlist');
        await user.click(wishlistButton);
        
        expect(mockOnWishlistClick).toHaveBeenCalledTimes(1);
    });

    it('should display 99+ when cart count exceeds 99', () => {
        const manyItems = Array.from({ length: 100 }, (_, i) => ({
            product: {
                id: `product-${i}`,
                business_id: 'b1',
                name: `Product ${i}`,
                price: 99.99,
                category: 'Top',
                color: 'Blue',
                style: 'Casual',
                season: 'Spring',
                size: 'M',
                stock_quantity: 10,
                image_urls: [],
                is_featured: false,
                is_active: true,
                created_at: '2024-01-01T00:00:00Z',
                updated_at: '2024-01-01T00:00:00Z',
            },
            quantity: 1,
        }));

        render(
            <Header
                session={mockSession}
                onSignOut={mockOnSignOut}
                onCartClick={mockOnCartClick}
            />,
            {
                preloadedState: {
                    cart: {
                        items: manyItems,
                    },
                },
            }
        );
        
        expect(screen.getByText('99+')).toBeInTheDocument();
    });
});

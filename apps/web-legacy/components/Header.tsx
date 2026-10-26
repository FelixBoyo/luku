import React from 'react';
import LukuLogo from './icons/LukuLogo';
// FIX: Use `import type` for Session as it might not be exported as a value in the installed Supabase version.
import type { Session } from '@supabase/supabase-js';
import Button from './common/Button';
import InstallButton from './InstallButton';
import ShopIcon from './icons/ShopIcon';
import HeartIcon from './icons/HeartIcon';
import { useAppSelector } from '../store/hooks';
import { Tab } from '../types';
import { layout, colors } from '@core/theme/tokens';

interface HeaderProps {
    session: Session;
    onSignOut: () => void;
    onCartClick: () => void;
    onWishlistClick?: () => void;
    showCart?: boolean;
    showWishlist?: boolean;
    /**
     * Optional navigation state for the main consumer app.
     * When provided, a desktop nav is rendered to mirror the mobile bottom nav.
     */
    activeTab?: Tab;
    onTabChange?: (tab: Tab) => void;
}

const Header: React.FC<HeaderProps> = ({
    session,
    onSignOut,
    onCartClick,
    onWishlistClick,
    showCart = true,
    showWishlist = true,
    activeTab,
    onTabChange,
}) => {
    const { items } = useAppSelector((state) => state.cart);
    const { items: wishlistItems } = useAppSelector((state) => state.wishlist);
    const cartItemCount = items.reduce((sum, item) => sum + item.quantity, 0);
    const wishlistCount = wishlistItems.length;

    const navItems =
        onTabChange && activeTab !== undefined
            ? [
                  { tab: Tab.LifestyleHub, label: 'Hub' },
                  { tab: Tab.Discover, label: 'Discover' },
                  { tab: Tab.Wardrobe, label: 'Wardrobe' },
                  { tab: Tab.Albums, label: 'Mood Boards' },
                  { tab: Tab.Marketplace, label: 'Marketplace' },
              ]
            : [];

    return (
        <header className={`${colors.background.surface} shadow-sm border-b ${colors.border.subtle}`}>
            <div className={`${layout.container} py-4`}>
                <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                        <LukuLogo className="h-8 w-8" />
                        <div className="flex flex-col">
                            <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent tracking-tight">
                                LUKU
                            </h1>
                            <span className="hidden sm:block text-xs text-gray-500 font-light -mt-1">
                                Your Personal Style Companion
                            </span>
                        </div>
                    </div>
                    {/* Desktop primary navigation - Hidden on larger screens (lg and above) */}
                    {navItems.length > 0 && (
                        <nav className="hidden md:flex lg:hidden items-center space-x-4 lg:space-x-6 mx-6 flex-1">
                            {navItems.map((item) => {
                                const isActive = activeTab === item.tab;
                                return (
                                    <button
                                        key={item.tab}
                                        type="button"
                                        onClick={() => onTabChange?.(item.tab)}
                                        className={`text-sm font-medium border-b-2 pb-1 transition-colors ${
                                            isActive
                                                ? 'text-indigo-600 border-indigo-500'
                                                : 'text-gray-500 border-transparent hover:text-gray-800 hover:border-gray-300'
                                        }`}
                                    >
                                        {item.label}
                                    </button>
                                );
                            })}
                        </nav>
                    )}
                    <div className="flex items-center space-x-4">
                        {/* <InstallButton /> */}
                        {showWishlist && onWishlistClick && (
                            <button
                                onClick={onWishlistClick}
                                className="relative p-2 text-gray-600 hover:text-red-500 transition-colors"
                                aria-label="Wishlist"
                            >
                                <HeartIcon className="w-6 h-6" isFilled={wishlistCount > 0} />
                                {wishlistCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {wishlistCount > 99 ? '99+' : wishlistCount}
                                    </span>
                                )}
                            </button>
                        )}
                        {showCart && (
                            <button
                                onClick={onCartClick}
                                className="relative p-2 text-gray-600 hover:text-indigo-600 transition-colors"
                                aria-label="Shopping cart"
                            >
                                <ShopIcon className="w-6 h-6" />
                                {cartItemCount > 0 && (
                                    <span className="absolute -top-1 -right-1 bg-indigo-600 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                                        {cartItemCount > 99 ? '99+' : cartItemCount}
                                    </span>
                                )}
                            </button>
                        )}
                        <span className="text-sm text-gray-600 hidden sm:block">
                            Signed in as{' '}
                            <span className="font-semibold">
                                {session.user.email}
                            </span>
                        </span>
                        <Button variant="secondary" onClick={onSignOut}>
                            Sign Out
                        </Button>
                    </div>
                </div>
            </div>
        </header>
    );
};

export default Header;

import React, { useState } from 'react';
import { Tab } from '../types';
import LeafPersonIcon from './icons/LeafPersonIcon';
import WardrobeIcon from './icons/WardrobeIcon';
import ShopIcon from './icons/ShopIcon';
import SparklesIcon from './icons/SparklesIcon';
import BookmarkSquareIcon from './icons/BookmarkSquareIcon';
import UserIcon from './icons/UserIcon';
import ColorSwatchIcon from './icons/ColorSwatchIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import SwatchIcon from './icons/SwatchIcon';
import StoreIcon from './icons/StoreIcon';

interface MobileBottomNavProps {
    activeTab: Tab;
    onTabChange: (tab: Tab) => void;
    wardrobeItemCount: number;
    albumsCount: number;
    hasBusinessAccount: boolean;
}

interface MobileTabButtonProps {
    tab: Tab;
    label: string;
    icon: React.ReactElement<{ className?: string }>;
    isActive: boolean;
    onClick: () => void;
    count?: number;
}

const MobileTabButton: React.FC<MobileTabButtonProps> = ({
    label,
    icon,
    isActive,
    onClick,
    count,
}) => {
    return (
        <button
            onClick={onClick}
            className={`flex flex-col items-center justify-center flex-1 h-16 min-w-[44px] transition-colors ${
                isActive ? 'text-indigo-600' : 'text-gray-500'
            }`}
            aria-label={label}
        >
            <div className="relative">
                {React.cloneElement(icon, { className: 'w-6 h-6' })}
                {count !== undefined && count > 0 && (
                    <span
                        className={`absolute -top-2 -right-2 min-w-[18px] h-4 px-1 rounded-full text-[10px] font-semibold flex items-center justify-center ${
                            isActive
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-400 text-white'
                        }`}
                    >
                        {count > 99 ? '99+' : count}
                    </span>
                )}
            </div>
            <span
                className={`text-[10px] mt-1 font-medium ${
                    isActive ? 'text-indigo-600' : 'text-gray-500'
                }`}
            >
                {label}
            </span>
        </button>
    );
};

const MobileBottomNav: React.FC<MobileBottomNavProps> = ({
    activeTab,
    onTabChange,
    wardrobeItemCount,
    albumsCount,
    hasBusinessAccount,
}) => {
    const [showMoreMenu, setShowMoreMenu] = useState(false);

    // Tier 1 navigation: primary surfaces for the consumer experience
    const primaryTabs = [
        {
            tab: Tab.LifestyleHub,
            label: 'Hub',
            icon: <LeafPersonIcon />,
            count: undefined,
        },
        {
            tab: Tab.Discover,
            label: 'Discover',
            icon: <SparklesIcon />,
            count: undefined,
        },
        {
            tab: Tab.Wardrobe,
            label: 'Wardrobe',
            icon: <WardrobeIcon />,
            count: wardrobeItemCount,
        },
        {
            tab: Tab.Albums,
            label: 'Mood Boards',
            icon: <BookmarkSquareIcon />,
            count: albumsCount,
        },
        {
            tab: Tab.Marketplace,
            label: 'Shop',
            icon: <ShopIcon />,
            count: undefined,
        },
    ];

    // Tier 3 utilities and secondary tools live in the More menu
    const moreMenuItems = [
        {
            tab: Tab.VirtualTryOn,
            label: 'Virtual Try-On',
            icon: <UserIcon className="w-5 h-5" />,
        },
        {
            tab: Tab.ColorHarmony,
            label: 'Color Harmony',
            icon: <ColorSwatchIcon className="w-5 h-5" />,
        },
        {
            tab: Tab.TripPlanner,
            label: 'Trip Planner',
            icon: <BriefcaseIcon className="w-5 h-5" />,
        },
        {
            tab: Tab.StylePlayground,
            label: 'Style Playground',
            icon: <SwatchIcon className="w-5 h-5" />,
        },
        // Only surface the seller dashboard if the user has a business account
        ...(hasBusinessAccount
            ? [
                  {
                      tab: Tab.SellerDashboard as Tab,
                      label: 'Seller Dashboard',
                      icon: <StoreIcon className="w-5 h-5" />,
                  },
              ]
            : []),
    ];

    return (
        <>
            <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-50 safe-area-inset-bottom shadow-lg">
                <div className="flex justify-around items-center h-16">
                    {primaryTabs.map((tab) => (
                        <MobileTabButton
                            key={tab.tab}
                            tab={tab.tab}
                            label={tab.label}
                            icon={tab.icon}
                            isActive={activeTab === tab.tab}
                            onClick={() => onTabChange(tab.tab)}
                            count={tab.count}
                        />
                    ))}
                    <button
                        onClick={() => setShowMoreMenu(true)}
                        className={`flex flex-col items-center justify-center flex-1 h-16 min-w-[44px] transition-colors ${
                            showMoreMenu ? 'text-indigo-600' : 'text-gray-500'
                        }`}
                        aria-label="More"
                    >
                        <svg
                            className="w-6 h-6"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M12 5v.01M12 12v.01M12 19v.01M12 6a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2zm0 7a1 1 0 110-2 1 1 0 010 2z"
                            />
                        </svg>
                        <span
                            className={`text-[10px] mt-1 font-medium ${
                                showMoreMenu ? 'text-indigo-600' : 'text-gray-500'
                            }`}
                        >
                            More
                        </span>
                    </button>
                </div>
            </nav>

            {/* More Menu Bottom Sheet */}
            {showMoreMenu && (
                <>
                    <div
                        className="fixed inset-0 bg-black bg-opacity-50 z-40"
                        onClick={() => setShowMoreMenu(false)}
                    />
                    <div className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto">
                        <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                            <h3 className="text-lg font-semibold text-gray-900">More</h3>
                            <button
                                onClick={() => setShowMoreMenu(false)}
                                className="text-gray-400 hover:text-gray-600"
                            >
                                <svg
                                    className="w-6 h-6"
                                    fill="none"
                                    stroke="currentColor"
                                    viewBox="0 0 24 24"
                                >
                                    <path
                                        strokeLinecap="round"
                                        strokeLinejoin="round"
                                        strokeWidth={2}
                                        d="M6 18L18 6M6 6l12 12"
                                    />
                                </svg>
                            </button>
                        </div>
                        <div className="py-2">
                            {moreMenuItems.map((item) => (
                                <button
                                    key={item.tab}
                                    onClick={() => {
                                        onTabChange(item.tab);
                                        setShowMoreMenu(false);
                                    }}
                                    className="flex items-center w-full px-4 py-4 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[48px]"
                                >
                                    <div className="flex-shrink-0">{item.icon}</div>
                                    <span className="ml-3 font-medium">{item.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                </>
            )}
        </>
    );
};

export default MobileBottomNav;


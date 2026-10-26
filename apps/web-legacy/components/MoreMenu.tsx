import React, { useState, useRef, useEffect } from 'react';
import { Tab } from '../types';
import UserIcon from './icons/UserIcon';
import ColorSwatchIcon from './icons/ColorSwatchIcon';
import BriefcaseIcon from './icons/BriefcaseIcon';
import SwatchIcon from './icons/SwatchIcon';
import StoreIcon from './icons/StoreIcon';
import ChartBarIcon from './icons/ChartBarIcon';
import HeartIcon from './icons/HeartIcon';

interface MoreMenuProps {
    onTabChange: (tab: Tab) => void;
    hasBusinessAccount: boolean;
}

const MoreMenu: React.FC<MoreMenuProps> = ({
    onTabChange,
    hasBusinessAccount,
}) => {
    const [isOpen, setIsOpen] = useState(false);
    const [isMobile, setIsMobile] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768);
        };
        checkMobile();
        window.addEventListener('resize', checkMobile);
        return () => window.removeEventListener('resize', checkMobile);
    }, []);

    useEffect(() => {
        const handleClickOutside = (event: MouseEvent) => {
            if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        };
        if (isOpen) {
            document.addEventListener('mousedown', handleClickOutside);
        }
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, [isOpen]);

    const menuItems = [
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
        {
            tab: Tab.UserAnalytics,
            label: 'User Analytics',
            icon: <ChartBarIcon className="w-5 h-5" />,
        },
        {
            tab: Tab.Wishlist,
            label: 'Wishlist',
            icon: <HeartIcon className="w-5 h-5" />,
        },
        {
            tab: Tab.MyOrders,
            label: 'My Orders',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                </svg>
            ),
        },
        {
            tab: Tab.Returns,
            label: 'Returns',
            icon: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
            ),
        },
        {
            tab: Tab.SellerDashboard,
            label: 'Seller Dashboard',
            icon: <StoreIcon className="w-5 h-5" />,
        },
    ];

    const handleItemClick = (tab: Tab) => {
        onTabChange(tab);
        setIsOpen(false);
    };

    // Mobile: Bottom sheet
    if (isMobile && isOpen) {
        return (
            <>
                {/* Backdrop */}
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40"
                    onClick={() => setIsOpen(false)}
                />
                {/* Bottom Sheet */}
                <div
                    ref={menuRef}
                    className="fixed bottom-0 left-0 right-0 bg-white rounded-t-lg shadow-lg z-50 max-h-[80vh] overflow-y-auto"
                >
                    <div className="sticky top-0 bg-white border-b border-gray-200 px-4 py-3 flex justify-between items-center">
                        <h3 className="text-lg font-semibold text-gray-900">More</h3>
                        <button
                            onClick={() => setIsOpen(false)}
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
                        {menuItems.map((item) => (
                            <button
                                key={item.tab}
                                onClick={() => handleItemClick(item.tab)}
                                className="flex items-center w-full px-4 py-4 text-left text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors min-h-[48px]"
                            >
                                <div className="flex-shrink-0">{item.icon}</div>
                                <span className="ml-3 font-medium">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            </>
        );
    }

    // Desktop: Dropdown menu
    return (
        <div className="relative" ref={menuRef}>
            <button
                onClick={() => setIsOpen(!isOpen)}
                className={`flex items-center whitespace-nowrap py-3 md:py-4 px-2 md:px-1 border-b-2 border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 font-medium text-xs md:text-sm transition-colors min-w-[44px] md:min-w-0`}
            >
                More
                <svg
                    className={`ml-2 w-4 h-4 transition-transform ${
                        isOpen ? 'rotate-180' : ''
                    }`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                >
                    <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M19 9l-7 7-7-7"
                    />
                </svg>
            </button>

            {isOpen && !isMobile && (
                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg z-50 border border-gray-200">
                    <div className="py-1">
                        {menuItems.map((item) => (
                            <button
                                key={item.tab}
                                onClick={() => handleItemClick(item.tab)}
                                className="flex items-center w-full px-4 py-2 text-sm text-gray-700 hover:bg-indigo-50 hover:text-indigo-600 transition-colors"
                            >
                                {item.icon}
                                <span className="ml-3">{item.label}</span>
                            </button>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default MoreMenu;


import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { Tab } from '../types';
import { fetchSellerKyc } from '../store/slices/sellerKycSlice';
import { fetchBusinessKyc } from '../store/slices/businessKycSlice';
import ProductManagement from './ProductManagement';
import OrderDashboard from './OrderDashboard';
import AnalyticsDashboard from './AnalyticsDashboard';
import PromotionManager from './PromotionManager';
import BusinessAccountRegistration from './BusinessAccountRegistration';
import SellerKycForm from './SellerKycForm';
import SalesWidgets from './SalesWidgets';
import InventoryAlerts from './InventoryAlerts';
import Card from './common/Card';

interface SellerDashboardProps {
    onTabChange: (tab: Tab) => void;
}

const SellerDashboard: React.FC<SellerDashboardProps> = ({ onTabChange }) => {
    const dispatch = useAppDispatch();
    const { currentBusiness } = useAppSelector((state) => state.business);
    const { data: sellerKyc, loading: sellerKycLoading } = useAppSelector((state) => state.sellerKyc);
    const [activeSection, setActiveSection] = useState<
        'products' | 'orders' | 'analytics' | 'promotions' | 'settings'
    >('products');

    const { data: businessKyc, loading: businessKycLoading } = useAppSelector((state) => state.businessKyc);

    useEffect(() => {
        if (!currentBusiness) {
            dispatch(fetchSellerKyc());
        }
    }, [currentBusiness, dispatch]);

    useEffect(() => {
        if (currentBusiness?.id) {
            dispatch(fetchBusinessKyc(currentBusiness.id));
        }
    }, [currentBusiness?.id, dispatch]);

    if (!currentBusiness) {
        if (sellerKycLoading && !sellerKyc) {
            return (
                <div className="max-w-4xl mx-auto flex justify-center py-12">
                    <div className="animate-pulse text-gray-500">Loading...</div>
                </div>
            );
        }
        if (!sellerKyc) {
            return (
                <div className="max-w-4xl mx-auto">
                    <SellerKycForm
                        onComplete={() => {
                            dispatch(fetchSellerKyc());
                        }}
                    />
                </div>
            );
        }
        return (
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Create Business Account
                </h2>
                <BusinessAccountRegistration
                    onComplete={() => {
                        window.location.reload();
                    }}
                />
            </div>
        );
    }

    const needsBusinessKyc = currentBusiness && !businessKycLoading && !businessKyc;

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-2xl font-bold text-gray-900">
                        Seller dashboard
                    </h1>
                    <p className="text-sm text-gray-600">
                        Manage products, orders, analytics, and promotions for your
                        LUKU shop in one place.
                    </p>
                </div>
            </div>
            {needsBusinessKyc && (
                <div className="mb-6 bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg">
                    <p className="font-medium">Complete your business verification</p>
                    <p className="text-sm mt-1">To keep selling secure, add your business details in Settings.</p>
                    <button
                        type="button"
                        onClick={() => setActiveSection('settings')}
                        className="mt-2 text-sm font-semibold text-amber-700 hover:text-amber-900 underline"
                    >
                        Go to Settings
                    </button>
                </div>
            )}
            {/* Sales Widgets */}
            <SalesWidgets businessId={currentBusiness.id} />
            
            {/* Inventory Alerts */}
            <div>
                <InventoryAlerts threshold={10} />
            </div>

            <Card>
                <div className="mb-4 border-b border-gray-200">
                    <nav 
                        className="flex space-x-8 overflow-x-auto -mx-4 px-4 md:mx-0 md:px-0 scroll-smooth"
                        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
                    >
                        <style>{`
                            nav::-webkit-scrollbar {
                                display: none;
                            }
                        `}</style>
                        {[
                            { id: 'products', label: 'Products' },
                            { id: 'orders', label: 'Orders' },
                            { id: 'analytics', label: 'Analytics' },
                            { id: 'promotions', label: 'Promotions' },
                            { id: 'settings', label: 'Settings' },
                        ].map((section) => (
                            <button
                                key={section.id}
                                onClick={() =>
                                    setActiveSection(
                                        section.id as
                                            | 'products'
                                            | 'orders'
                                            | 'analytics'
                                            | 'promotions'
                                            | 'settings'
                                    )
                                }
                                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap flex-shrink-0 transition-colors ${
                                    activeSection === section.id
                                        ? 'border-indigo-500 text-indigo-600'
                                        : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                                }`}
                            >
                                {section.label}
                            </button>
                        ))}
                    </nav>
                </div>

                {activeSection === 'products' && <ProductManagement />}
                {activeSection === 'orders' && <OrderDashboard />}
                {activeSection === 'analytics' && <AnalyticsDashboard />}
                {activeSection === 'promotions' && <PromotionManager />}
                {activeSection === 'settings' && (
                    <div className="max-w-4xl mx-auto">
                        <h2 className="text-2xl font-bold text-gray-900 mb-6">
                            Business Settings
                        </h2>
                        <BusinessAccountRegistration />
                    </div>
                )}
            </Card>
        </div>
    );
};

export default SellerDashboard;


import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBuyerOrders } from '../store/slices/ordersSlice';
import { fetchBuyerReturns } from '../store/slices/returnsSlice';
import { fetchProduct } from '../store/slices/productsSlice';
import { Order, Product } from '../types';
import Button from './common/Button';
import Spinner from './common/Spinner';
import ProductCard from './ProductCard';
import ReturnRequest from './ReturnRequest';
import { Tab } from '../types';
import { typography } from '@core/theme/tokens';

interface MyOrdersProps {
    onNavigateToMarketplace?: () => void;
}

const MyOrders: React.FC<MyOrdersProps> = ({ onNavigateToMarketplace }) => {
    const dispatch = useAppDispatch();
    const { orders, loading } = useAppSelector((state) => state.orders);
    const { products } = useAppSelector((state) => state.products);
    const { returns } = useAppSelector((state) => state.returns);
    const [statusFilter, setStatusFilter] = useState<string>('');
    const [searchQuery, setSearchQuery] = useState<string>('');
    const [selectedOrderForReturn, setSelectedOrderForReturn] = useState<Order | null>(null);

    useEffect(() => {
        dispatch(fetchBuyerOrders());
        dispatch(fetchBuyerReturns());
    }, [dispatch]);

    const canReturnOrder = (order: Order) => {
        return order.status === 'delivered' && 
               !returns.some(r => r.order_id === order.id);
    };

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    const statusLabels = {
        pending: 'Pending',
        confirmed: 'Confirmed',
        shipped: 'Shipped',
        delivered: 'Delivered',
        cancelled: 'Cancelled',
    };

    const getStatusIcon = (status: Order['status']) => {
        switch (status) {
            case 'pending':
                return '⏳';
            case 'confirmed':
                return '✓';
            case 'shipped':
                return '📦';
            case 'delivered':
                return '✅';
            case 'cancelled':
                return '❌';
            default:
                return '';
        }
    };

    const filteredOrders = statusFilter
        ? orders.filter(order => order.status === statusFilter)
        : orders;

    // Fetch product details for orders
    useEffect(() => {
        const productIds = new Set(orders.map(order => order.product_id));
        productIds.forEach(productId => {
            const product = products.find(p => p.id === productId);
            if (!product) {
                dispatch(fetchProduct(productId));
            }
        });
    }, [dispatch, orders, products]);

    if (loading && orders.length === 0) {
        return (
            <div>
                <div className="mb-8">
                    <h1 className="text-3xl font-bold text-gray-900 mb-4">My Orders</h1>
                    <p className="text-gray-600">Track your orders and view order history</p>
                </div>
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <OrderCardSkeleton key={i} />
                    ))}
                </div>
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <div className="flex items-center gap-3 mb-4">
                    <svg
                        className="w-8 h-8 text-indigo-600"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path
                            strokeLinecap="round"
                            strokeLinejoin="round"
                            strokeWidth={2}
                            d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                        />
                    </svg>
                    <h1 className={`${typography.pageTitle} text-gray-900`}>
                        My Orders
                    </h1>
                </div>
                <p className="text-gray-600 ml-11">
                    Track your orders and view order history
                </p>
            </div>

            {/* Search and Filters */}
            <div className="mb-6 space-y-4">
                <div className="relative">
                    <input
                        type="text"
                        placeholder="Search by order ID or tracking number..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full px-4 py-2.5 pl-10 border-2 border-gray-200 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 bg-white"
                    />
                    <svg
                        className="absolute left-3 top-3.5 w-5 h-5 text-gray-400"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                    >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                    {searchQuery && (
                        <button
                            onClick={() => setSearchQuery('')}
                            className="absolute right-3 top-3.5 text-gray-400 hover:text-gray-600"
                            aria-label="Clear search"
                        >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    )}
                </div>
                <div className="flex flex-wrap gap-2">
                <button
                    onClick={() => setStatusFilter('')}
                    className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                        statusFilter === ''
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All Orders
                </button>
                {(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const).map((status) => (
                    <button
                        key={status}
                        onClick={() => setStatusFilter(status)}
                        className={`px-4 py-2 rounded-md text-sm font-medium transition-colors capitalize ${
                            statusFilter === status
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                        }`}
                    >
                        {statusLabels[status]}
                    </button>
                ))}
                </div>
            </div>

            {filteredOrders.length === 0 ? (
                <div className="text-center py-20 bg-gradient-to-br from-gray-50 via-indigo-50 to-purple-50 rounded-xl border-2 border-dashed border-indigo-200">
                    <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 mb-6">
                        <svg
                            className="w-12 h-12 text-indigo-600"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        {statusFilter ? `No ${statusLabels[statusFilter as keyof typeof statusLabels]} Orders` : 'No Orders Yet'}
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto mb-8 text-lg">
                        {statusFilter 
                            ? `You don't have any orders with the "${statusLabels[statusFilter as keyof typeof statusLabels]}" status. Try selecting a different filter.`
                            : 'Your order history will appear here once you make a purchase. Start shopping to discover amazing fashion!'
                        }
                    </p>
                    {!statusFilter && (
                        <Button 
                            onClick={onNavigateToMarketplace || (() => {})}
                            className="px-8 py-3 text-base font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transform hover:-translate-y-0.5 transition-all"
                        >
                            Browse Marketplace
                        </Button>
                    )}
                </div>
            ) : (
                <div className="space-y-6">
                    {filteredOrders.map((order) => {
                        const product = products.find(p => p.id === order.product_id);
                        
                        return (
                            <div
                                key={order.id}
                                className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200"
                            >
                                <div className="p-6">
                                    {/* Order Header */}
                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Order #{order.id.slice(0, 8).toUpperCase()}
                                            </h3>
                                            <p className="text-sm text-gray-600 mt-1">
                                                Placed on {new Date(order.created_at).toLocaleDateString('en-US', {
                                                    year: 'numeric',
                                                    month: 'long',
                                                    day: 'numeric',
                                                })}
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-2">
                                            <span className="text-2xl">{getStatusIcon(order.status)}</span>
                                            <span
                                                className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}
                                            >
                                                {statusLabels[order.status]}
                                            </span>
                                        </div>
                                    </div>

                                    {/* Product Info */}
                                    {product ? (
                                        <div className="mb-4">
                                            <ProductCard product={product} />
                                        </div>
                                    ) : (
                                        <div className="mb-4 p-4 bg-gray-50 rounded-lg">
                                            <p className="text-sm text-gray-600">Loading product details...</p>
                                        </div>
                                    )}

                                    {/* Order Details */}
                                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4 pt-4 border-t border-gray-200 text-sm sm:text-base">
                                        <div>
                                            <p className="text-sm text-gray-600">Quantity</p>
                                            <p className="font-semibold text-gray-900">{order.quantity}</p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Price per Unit</p>
                                            <p className="font-semibold text-gray-900">
                                                ${order.price_per_unit.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Total</p>
                                            <p className="font-semibold text-indigo-600 text-lg">
                                                ${order.total_price.toFixed(2)}
                                            </p>
                                        </div>
                                        <div>
                                            <p className="text-sm text-gray-600">Updated</p>
                                            <p className="font-semibold text-gray-900">
                                                {new Date(order.updated_at).toLocaleDateString()}
                                            </p>
                                        </div>
                                    </div>

                                    {/* Tracking Info */}
                                    {order.tracking_number && (
                                        <div className="mt-4 p-4 bg-indigo-50 rounded-lg border border-indigo-200">
                                            <div className="flex items-center justify-between">
                                                <div>
                                                    <p className="text-sm font-medium text-indigo-900">
                                                        Tracking Number
                                                    </p>
                                                    <p className="text-lg font-bold text-indigo-600 mt-1">
                                                        {order.tracking_number}
                                                    </p>
                                                </div>
                                                {order.status === 'shipped' && (
                                                    <a
                                                        href={`https://tools.usps.com/go/TrackConfirmAction?tLabels=${order.tracking_number}`}
                                                        target="_blank"
                                                        rel="noopener noreferrer"
                                                        className="text-indigo-600 hover:text-indigo-800 font-medium text-sm"
                                                    >
                                                        Track Package →
                                                    </a>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    {/* Status Timeline */}
                                    <div className="mt-6 pt-4 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-3">Order Status Timeline</p>
                                        <div className="space-y-3">
                                            {['pending', 'confirmed', 'shipped', 'delivered'].map((status, index) => {
                                                const orderStatusIndex = ['pending', 'confirmed', 'shipped', 'delivered'].indexOf(order.status);
                                                const isCompleted = index <= orderStatusIndex;
                                                const isCurrent = index === orderStatusIndex && order.status !== 'cancelled';
                                                
                                                return (
                                                    <div key={status} className="flex items-start gap-3">
                                                        <div className="flex flex-col items-center">
                                                            <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
                                                                isCompleted 
                                                                    ? 'bg-indigo-600 text-white' 
                                                                    : 'bg-gray-200 text-gray-400'
                                                            }`}>
                                                                {isCompleted ? '✓' : index + 1}
                                                            </div>
                                                            {index < 3 && (
                                                                <div className={`w-0.5 h-6 mt-1 ${
                                                                    isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                                                                }`} />
                                                            )}
                                                        </div>
                                                        <div className="flex-1 pb-4">
                                                            <p className={`text-sm font-medium ${
                                                                isCurrent ? 'text-indigo-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                                                            }`}>
                                                                {statusLabels[status as keyof typeof statusLabels]}
                                                            </p>
                                                            {isCurrent && order.status === 'shipped' && order.tracking_number && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    Shipped with tracking: {order.tracking_number}
                                                                </p>
                                                            )}
                                                            {isCompleted && index === orderStatusIndex && (
                                                                <p className="text-xs text-gray-500 mt-1">
                                                                    {new Date(order.updated_at).toLocaleDateString()}
                                                                </p>
                                                            )}
                                                        </div>
                                                    </div>
                                                );
                                            })}
                                        </div>
                                    </div>

                                    {/* Return Button */}
                                    {canReturnOrder(order) && (
                                        <div className="mt-4 pt-4 border-t border-gray-200">
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                onClick={() => setSelectedOrderForReturn(order)}
                                            >
                                                Request Return
                                            </Button>
                                        </div>
                                    )}
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}

            {selectedOrderForReturn && (
                <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full p-6">
                        <ReturnRequest
                            order={selectedOrderForReturn}
                            onSuccess={() => {
                                setSelectedOrderForReturn(null);
                                dispatch(fetchBuyerOrders());
                            }}
                            onCancel={() => setSelectedOrderForReturn(null)}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default MyOrders;

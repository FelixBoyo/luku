import React, { useEffect, useState } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBuyerReturns } from '../store/slices/returnsSlice';
import { fetchBuyerOrders } from '../store/slices/ordersSlice';
import { Order } from '../types';
import type { Return } from '../store/slices/returnsSlice';
import Button from './common/Button';
import Spinner from './common/Spinner';
import ReturnRequest from './ReturnRequest';
import Skeleton from './common/Skeleton';
import { showToast } from '../store/slices/toastSlice';

const ReturnManagement: React.FC = () => {
    const dispatch = useAppDispatch();
    const { returns, loading } = useAppSelector((state) => state.returns);
    const { orders } = useAppSelector((state) => state.orders);
    const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
    const [showReturnForm, setShowReturnForm] = useState(false);

    useEffect(() => {
        dispatch(fetchBuyerReturns());
        dispatch(fetchBuyerOrders());
    }, [dispatch]);

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        approved: 'bg-blue-100 text-blue-800',
        rejected: 'bg-red-100 text-red-800',
        refunded: 'bg-green-100 text-green-800',
        completed: 'bg-gray-100 text-gray-800',
    };

    const statusLabels = {
        pending: 'Pending Review',
        approved: 'Approved',
        rejected: 'Rejected',
        refunded: 'Refunded',
        completed: 'Completed',
    };

    const getStatusIcon = (status: Return['status']) => {
        switch (status) {
            case 'pending':
                return '⏳';
            case 'approved':
                return '✓';
            case 'rejected':
                return '❌';
            case 'refunded':
                return '💰';
            case 'completed':
                return '✅';
            default:
                return '';
        }
    };

    const ordersEligibleForReturn = orders.filter(
        (order) => order.status === 'delivered' && 
        !returns.some(r => r.order_id === order.id)
    );

    if (showReturnForm && selectedOrder) {
        return (
            <div className="max-w-2xl mx-auto">
                <ReturnRequest
                    order={selectedOrder}
                    onSuccess={() => {
                        setShowReturnForm(false);
                        setSelectedOrder(null);
                        dispatch(fetchBuyerReturns());
                    }}
                    onCancel={() => {
                        setShowReturnForm(false);
                        setSelectedOrder(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="mb-8">
                <h1 className="text-3xl font-bold text-gray-900 mb-4">Returns & Refunds</h1>
                <p className="text-gray-600">
                    Manage your return requests and track refund status
                </p>
            </div>

            {ordersEligibleForReturn.length > 0 && (
                <div className="mb-6 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <h2 className="text-lg font-semibold text-indigo-900 mb-3">
                        Eligible for Return
                    </h2>
                    <div className="space-y-2">
                        {ordersEligibleForReturn.map((order) => (
                            <div
                                key={order.id}
                                className="flex items-center justify-between p-3 bg-white rounded border border-indigo-100"
                            >
                                <div>
                                    <p className="font-medium text-gray-900">
                                        Order #{order.id.slice(0, 8).toUpperCase()}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <Button
                                    size="sm"
                                    onClick={() => {
                                        setSelectedOrder(order);
                                        setShowReturnForm(true);
                                    }}
                                >
                                    Request Return
                                </Button>
                            </div>
                        ))}
                    </div>
                </div>
            )}

            {loading && returns.length === 0 ? (
                <div className="space-y-6">
                    {[1, 2, 3].map((i) => (
                        <div key={i} className="bg-white rounded-lg shadow-md p-6 border border-gray-200">
                            <div className="flex justify-between items-start mb-4">
                                <div className="space-y-2 flex-1">
                                    <Skeleton variant="text" width="40%" height={24} />
                                    <Skeleton variant="text" width="60%" height={16} />
                                </div>
                                <Skeleton variant="rectangular" width={100} height={32} className="rounded-full" />
                            </div>
                            <Skeleton variant="rectangular" height={100} className="w-full" />
                        </div>
                    ))}
                </div>
            ) : returns.length === 0 ? (
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
                                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                            />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-gray-900 mb-3">
                        No Return Requests
                    </h3>
                    <p className="text-gray-600 max-w-md mx-auto text-lg mb-2">
                        You haven't submitted any return requests yet.
                    </p>
                    <p className="text-gray-500 text-sm">
                        When you need to return an item, you can request a return from your order details.
                    </p>
                </div>
            ) : (
                <div className="space-y-6">
                    {returns.map((returnItem) => {
                        const order = orders.find(o => o.id === returnItem.order_id);
                        const statusSteps = ['pending', 'approved', 'refunded', 'completed'] as const;
                        const currentStatusIndex = statusSteps.indexOf(returnItem.status as any);
                        
                        return (
                            <div
                                key={returnItem.id}
                                className="bg-white rounded-lg shadow-md p-6 border border-gray-200 hover:shadow-lg transition-shadow"
                            >
                                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
                                    <div className="flex-1">
                                        <div className="flex items-center gap-3 mb-2">
                                            <span className="text-2xl">{getStatusIcon(returnItem.status)}</span>
                                            <h3 className="text-lg font-semibold text-gray-900">
                                                Return #{returnItem.id.slice(0, 8).toUpperCase()}
                                            </h3>
                                        </div>
                                        <p className="text-sm text-gray-600">
                                            Order #{returnItem.order_id.slice(0, 8).toUpperCase()} • 
                                            Submitted {new Date(returnItem.created_at).toLocaleDateString('en-US', {
                                                year: 'numeric',
                                                month: 'long',
                                                day: 'numeric'
                                            })}
                                        </p>
                                    </div>
                                    <span
                                        className={`px-4 py-2 rounded-full text-sm font-semibold ${statusColors[returnItem.status]} whitespace-nowrap`}
                                    >
                                        {statusLabels[returnItem.status]}
                                    </span>
                                </div>

                                {/* Return Status Timeline */}
                                <div className="mb-6 pt-4 border-t border-gray-200">
                                    <p className="text-sm font-medium text-gray-700 mb-4">Return Status Timeline</p>
                                    <div className="space-y-3">
                                        {statusSteps.map((status, index) => {
                                            if (status === 'pending' && returnItem.status === 'rejected') return null;
                                            if (status === 'refunded' && returnItem.status === 'rejected') return null;
                                            if (status === 'completed' && returnItem.status === 'rejected') return null;
                                            
                                            const isCompleted = index <= currentStatusIndex;
                                            const isCurrent = index === currentStatusIndex;
                                            
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
                                                        {index < statusSteps.length - 1 && (
                                                            <div className={`w-0.5 h-6 mt-1 ${
                                                                isCompleted ? 'bg-indigo-600' : 'bg-gray-200'
                                                            }`} />
                                                        )}
                                                    </div>
                                                    <div className="flex-1 pb-4">
                                                        <p className={`text-sm font-medium ${
                                                            isCurrent ? 'text-indigo-600' : isCompleted ? 'text-gray-700' : 'text-gray-400'
                                                        }`}>
                                                            {statusLabels[status]}
                                                        </p>
                                                        {isCurrent && returnItem.status === 'approved' && (
                                                            <p className="text-xs text-gray-500 mt-1">
                                                                Return approved. Processing refund...
                                                            </p>
                                                        )}
                                                        {isCurrent && returnItem.status === 'refunded' && returnItem.refund_amount && (
                                                            <p className="text-xs text-indigo-600 mt-1 font-medium">
                                                                Refund of ${returnItem.refund_amount.toFixed(2)} processed
                                                            </p>
                                                        )}
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {returnItem.status === 'rejected' && (
                                            <div className="flex items-start gap-3 mt-2">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center bg-red-100 text-red-600">
                                                    ❌
                                                </div>
                                                <div className="flex-1">
                                                    <p className="text-sm font-medium text-red-600">
                                                        Return Rejected
                                                    </p>
                                                    <p className="text-xs text-gray-500 mt-1">
                                                        This return request was not approved.
                                                    </p>
                                                </div>
                                            </div>
                                        )}
                                    </div>
                                </div>

                                <div className="space-y-3 mb-4 pt-4 border-t border-gray-200">
                                    <div className="bg-gray-50 p-3 rounded-lg">
                                        <p className="text-sm font-medium text-gray-700 mb-1">Return Reason</p>
                                        <p className="text-sm text-gray-900">{returnItem.reason}</p>
                                    </div>
                                    {returnItem.notes && (
                                        <div className="bg-indigo-50 p-3 rounded-lg">
                                            <p className="text-sm font-medium text-indigo-700 mb-1">Additional Notes</p>
                                            <p className="text-sm text-indigo-900">{returnItem.notes}</p>
                                        </div>
                                    )}
                                    {returnItem.refund_amount && (
                                        <div className="bg-green-50 p-3 rounded-lg">
                                            <p className="text-sm font-medium text-green-700 mb-1">Refund Amount</p>
                                            <p className="text-lg font-bold text-green-900">${returnItem.refund_amount.toFixed(2)}</p>
                                        </div>
                                    )}
                                </div>

                                {returnItem.return_photos && returnItem.return_photos.length > 0 && (
                                    <div className="mb-4 pt-4 border-t border-gray-200">
                                        <p className="text-sm font-medium text-gray-700 mb-3">Return Photos</p>
                                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                                            {returnItem.return_photos.map((photo, index) => (
                                                <div key={index} className="relative group">
                                                    <img
                                                        src={photo}
                                                        alt={`Return photo ${index + 1}`}
                                                        className="w-full h-24 object-cover rounded-lg border border-gray-200 cursor-pointer hover:border-indigo-400 transition-colors"
                                                        onClick={() => window.open(photo, '_blank')}
                                                    />
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}

                                {returnItem.status === 'approved' && (
                                    <div className="mt-4 pt-4 border-t border-gray-200">
                                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                                            <p className="text-sm font-medium text-blue-900 mb-2">
                                                Return Approved - Next Steps
                                            </p>
                                            <p className="text-sm text-blue-800">
                                                Please ship the item back using the return label. Once received, your refund will be processed.
                                            </p>
                                            <Button
                                                size="sm"
                                                variant="secondary"
                                                className="mt-3"
                                                onClick={() => {
                                                    // In a real app, this would download the return label
                                                    dispatch(showToast({
                                                        type: 'info',
                                                        message: 'Return label download will be available soon.'
                                                    }));
                                                }}
                                            >
                                                Download Return Label
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default ReturnManagement;

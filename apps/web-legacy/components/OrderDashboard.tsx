import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchSellerOrders, updateOrderStatus } from '../store/slices/ordersSlice';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { Order } from '../types';

const OrderDashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const { orders, loading } = useAppSelector((state) => state.orders);

    const [statusFilter, setStatusFilter] = useState<string>('');
    const [editingOrder, setEditingOrder] = useState<Order | null>(null);
    const [trackingNumber, setTrackingNumber] = useState('');

    useEffect(() => {
        dispatch(fetchSellerOrders({ status: statusFilter || undefined }));
    }, [dispatch, statusFilter]);

    const handleUpdateStatus = async (orderId: string, status: Order['status']) => {
        try {
            await dispatch(
                updateOrderStatus({
                    orderId,
                    status,
                    trackingNumber: status === 'shipped' ? trackingNumber : undefined,
                })
            ).unwrap();
            setEditingOrder(null);
            setTrackingNumber('');
        } catch (error: any) {
            alert(error.message || 'Failed to update order');
        }
    };

    const statusColors = {
        pending: 'bg-yellow-100 text-yellow-800',
        confirmed: 'bg-blue-100 text-blue-800',
        shipped: 'bg-purple-100 text-purple-800',
        delivered: 'bg-green-100 text-green-800',
        cancelled: 'bg-red-100 text-red-800',
    };

    if (loading && orders.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Order Management</h2>
                <div className="flex space-x-2">
                    <button
                        onClick={() => setStatusFilter('')}
                        className={`px-4 py-2 rounded-md ${
                            statusFilter === ''
                                ? 'bg-indigo-600 text-white'
                                : 'bg-gray-100 text-gray-700'
                        }`}
                    >
                        All
                    </button>
                    {(['pending', 'confirmed', 'shipped', 'delivered'] as const).map((status) => (
                        <button
                            key={status}
                            onClick={() => setStatusFilter(status)}
                            className={`px-4 py-2 rounded-md capitalize ${
                                statusFilter === status
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>

            {orders.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-600">No orders found.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {orders.map((order) => (
                        <div
                            key={order.id}
                            className="bg-white rounded-lg shadow-md p-6"
                        >
                            <div className="flex justify-between items-start mb-4">
                                <div>
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        Order #{order.id.slice(0, 8)}
                                    </h3>
                                    <p className="text-sm text-gray-600">
                                        {new Date(order.created_at).toLocaleDateString()}
                                    </p>
                                </div>
                                <span
                                    className={`px-3 py-1 rounded-full text-sm font-semibold ${statusColors[order.status]}`}
                                >
                                    {order.status}
                                </span>
                            </div>

                            <div className="grid grid-cols-2 gap-4 mb-4">
                                <div>
                                    <p className="text-sm text-gray-600">Quantity</p>
                                    <p className="font-semibold">{order.quantity}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-gray-600">Total Price</p>
                                    <p className="font-semibold">${order.total_price.toFixed(2)}</p>
                                </div>
                                {order.tracking_number && (
                                    <div className="col-span-2">
                                        <p className="text-sm text-gray-600">Tracking Number</p>
                                        <p className="font-semibold">{order.tracking_number}</p>
                                    </div>
                                )}
                            </div>

                            {editingOrder?.id === order.id ? (
                                <div className="space-y-2">
                                    {order.status === 'confirmed' && (
                                        <div className="mb-2">
                                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                                Tracking Number
                                            </label>
                                            <input
                                                type="text"
                                                value={trackingNumber}
                                                onChange={(e) => setTrackingNumber(e.target.value)}
                                                className="w-full px-3 py-2 border border-gray-300 rounded-md"
                                                placeholder="Enter tracking number"
                                            />
                                        </div>
                                    )}
                                    <div className="flex space-x-2">
                                        {order.status === 'pending' && (
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleUpdateStatus(order.id, 'confirmed')
                                                }
                                            >
                                                Confirm Order
                                            </Button>
                                        )}
                                        {order.status === 'confirmed' && (
                                            <Button
                                                size="sm"
                                                onClick={() =>
                                                    handleUpdateStatus(order.id, 'shipped')
                                                }
                                                disabled={!trackingNumber}
                                            >
                                                Mark as Shipped
                                            </Button>
                                        )}
                                        <Button
                                            size="sm"
                                            variant="secondary"
                                            onClick={() => {
                                                setEditingOrder(null);
                                                setTrackingNumber('');
                                            }}
                                        >
                                            Cancel
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex space-x-2">
                                    {order.status === 'pending' && (
                                        <Button
                                            size="sm"
                                            onClick={() => setEditingOrder(order)}
                                        >
                                            Update Status
                                        </Button>
                                    )}
                                    {order.status === 'confirmed' && (
                                        <Button
                                            size="sm"
                                            onClick={() => setEditingOrder(order)}
                                        >
                                            Add Tracking
                                        </Button>
                                    )}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderDashboard;


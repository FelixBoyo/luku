import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import { fetchBusinessAnalytics, setPeriod } from '../store/slices/analyticsSlice';
import Spinner from './common/Spinner';

const AnalyticsDashboard: React.FC = () => {
    const dispatch = useAppDispatch();
    const { data, loading, period } = useAppSelector((state) => state.analytics);

    useEffect(() => {
        dispatch(fetchBusinessAnalytics(period));
    }, [dispatch, period]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (!data) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600">No analytics data available.</p>
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Analytics Dashboard</h2>
                <div className="flex space-x-2">
                    {(['daily', 'weekly', 'monthly'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => {
                                dispatch(setPeriod(p));
                                dispatch(fetchBusinessAnalytics(p));
                            }}
                            className={`px-4 py-2 rounded-md capitalize ${
                                period === p
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-sm text-gray-600 mb-2">Total Revenue</p>
                    <p className="text-3xl font-bold text-indigo-600">
                        ${data.totalRevenue.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-sm text-gray-600 mb-2">Total Orders</p>
                    <p className="text-3xl font-bold text-indigo-600">{data.totalOrders}</p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-sm text-gray-600 mb-2">Average Order Value</p>
                    <p className="text-3xl font-bold text-indigo-600">
                        ${data.averageOrderValue.toFixed(2)}
                    </p>
                </div>
                <div className="bg-white rounded-lg shadow-md p-6">
                    <p className="text-sm text-gray-600 mb-2">Active Listings</p>
                    <p className="text-3xl font-bold text-indigo-600">{data.activeListings}</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Top Selling Products
                    </h3>
                    {data.topSellingProducts.length === 0 ? (
                        <p className="text-gray-600">No sales data yet.</p>
                    ) : (
                        <div className="space-y-3">
                            {data.topSellingProducts.map((product, index) => (
                                <div
                                    key={product.product_id}
                                    className="flex justify-between items-center"
                                >
                                    <div>
                                        <p className="font-medium text-gray-900">
                                            {index + 1}. {product.product_name}
                                        </p>
                                        <p className="text-sm text-gray-600">
                                            {product.total_sold} sold
                                        </p>
                                    </div>
                                    <p className="font-semibold text-indigo-600">
                                        ${product.revenue.toFixed(2)}
                                    </p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Inventory Stats</h3>
                    <div className="space-y-3">
                        <div className="flex justify-between">
                            <span className="text-gray-600">Total Products</span>
                            <span className="font-semibold">{data.totalProducts}</span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Active Listings</span>
                            <span className="font-semibold text-green-600">
                                {data.activeListings}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-gray-600">Low Stock Items</span>
                            <span className="font-semibold text-red-600">
                                {data.lowStockProducts}
                            </span>
                        </div>
                    </div>
                </div>
            </div>

            {data.salesByPeriod.length > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Over Time</h3>
                    <div className="space-y-2">
                        {data.salesByPeriod.map((period) => (
                            <div key={period.period} className="flex justify-between items-center">
                                <span className="text-gray-600">{period.period}</span>
                                <div className="flex items-center space-x-4">
                                    <span className="text-sm text-gray-600">
                                        {period.orders} orders
                                    </span>
                                    <span className="font-semibold text-indigo-600">
                                        ${period.revenue.toFixed(2)}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default AnalyticsDashboard;


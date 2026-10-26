import React, { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchUserEngagementAnalytics,
    setPeriod,
} from '../store/slices/userEngagementSlice';
import Spinner from './common/Spinner';
import ChartBarIcon from './icons/ChartBarIcon';
import UserIcon from './icons/UserIcon';
import FireIcon from './icons/FireIcon';
import LightBulbIcon from './icons/LightBulbIcon';
import ThumbUpIcon from './icons/ThumbUpIcon';
import ThumbDownIcon from './icons/ThumbDownIcon';

const UserEngagementAnalytics: React.FC = () => {
    const dispatch = useAppDispatch();
    const { data, loading, period, error } = useAppSelector(
        (state) => state.userEngagement
    );

    useEffect(() => {
        dispatch(fetchUserEngagementAnalytics(period));
    }, [dispatch, period]);

    if (loading) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (error) {
        return (
            <div className="text-center py-12">
                <p className="text-red-600">Error loading analytics: {error}</p>
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

    const getEngagementColor = (score: number) => {
        if (score >= 70) return 'text-green-600';
        if (score >= 40) return 'text-yellow-600';
        return 'text-red-600';
    };

    const getPriorityColor = (priority: string) => {
        switch (priority) {
            case 'high':
                return 'bg-red-100 text-red-800 border-red-300';
            case 'medium':
                return 'bg-yellow-100 text-yellow-800 border-yellow-300';
            case 'low':
                return 'bg-blue-100 text-blue-800 border-blue-300';
            default:
                return 'bg-gray-100 text-gray-800 border-gray-300';
        }
    };

    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex justify-between items-center mb-6">
                <div>
                    <h2 className="text-3xl font-bold text-gray-900">
                        User Engagement Analytics
                    </h2>
                    <p className="text-gray-600 mt-1">
                        Comprehensive insights into user behavior and feature adoption
                    </p>
                </div>
                <div className="flex space-x-2">
                    {(['daily', 'weekly', 'monthly', 'all'] as const).map((p) => (
                        <button
                            key={p}
                            onClick={() => {
                                dispatch(setPeriod(p));
                                dispatch(fetchUserEngagementAnalytics(p));
                            }}
                            className={`px-4 py-2 rounded-md capitalize ${
                                period === p
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* Engagement Score */}
            <div className="bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg shadow-lg p-6 text-white">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-indigo-100 text-sm mb-2">
                            Overall Engagement Score
                        </p>
                        <p className={`text-5xl font-bold ${getEngagementColor(data.engagementScore)}`}>
                            {data.engagementScore}
                            <span className="text-2xl text-indigo-100">/100</span>
                        </p>
                        <p className="text-indigo-100 text-sm mt-2">
                            {data.engagementScore >= 70
                                ? 'Excellent engagement! Users are highly active.'
                                : data.engagementScore >= 40
                                ? 'Moderate engagement. Room for improvement.'
                                : 'Low engagement. Focus on user activation.'}
                        </p>
                    </div>
                    <ChartBarIcon className="w-24 h-24 text-indigo-200 opacity-50" />
                </div>
            </div>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Total Users</p>
                        <UserIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-indigo-600">
                        {data.totalUsers}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {data.activeUsers} active (last 30 days)
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">New Users</p>
                        <FireIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-green-600">
                        {data.newUsers}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        In selected period
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Wardrobe Items</p>
                        <ChartBarIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-purple-600">
                        {data.wardrobeStats.totalItems}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {data.wardrobeStats.averageItemsPerUser.toFixed(1)} avg per user
                    </p>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <div className="flex items-center justify-between mb-2">
                        <p className="text-sm text-gray-600">Saved Outfits</p>
                        <ThumbUpIcon className="w-5 h-5 text-gray-400" />
                    </div>
                    <p className="text-3xl font-bold text-pink-600">
                        {data.outfitStats.totalOutfits}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                        {data.outfitStats.favoriteRate.toFixed(1)}% favorite rate
                    </p>
                </div>
            </div>

            {/* Feature Usage */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Feature Usage Analysis
                </h3>
                <div className="space-y-4">
                    {data.featureUsage.map((feature, index) => (
                        <div key={feature.featureName} className="border-b border-gray-200 pb-4 last:border-0">
                            <div className="flex justify-between items-start mb-2">
                                <div>
                                    <p className="font-medium text-gray-900">
                                        {feature.featureName}
                                    </p>
                                    <p className="text-sm text-gray-600">
                                        {feature.uniqueUsers} unique users
                                    </p>
                                </div>
                                <div className="text-right">
                                    <p className="text-lg font-semibold text-indigo-600">
                                        {feature.usageCount}
                                    </p>
                                    <p className="text-xs text-gray-500">total uses</p>
                                </div>
                            </div>
                            <div className="w-full bg-gray-200 rounded-full h-2 mt-2">
                                <div
                                    className="bg-indigo-600 h-2 rounded-full"
                                    style={{
                                        width: `${Math.min(100, (feature.usageCount / Math.max(...data.featureUsage.map(f => f.usageCount))) * 100)}%`,
                                    }}
                                />
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Top Features & Underutilized */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ThumbUpIcon className="w-5 h-5 text-green-500 mr-2" />
                        Top Performing Features
                    </h3>
                    <div className="space-y-2">
                        {data.topFeatures.map((feature, index) => (
                            <div
                                key={feature}
                                className="flex items-center justify-between p-3 bg-green-50 rounded-md"
                            >
                                <span className="font-medium text-gray-900">
                                    {index + 1}. {feature}
                                </span>
                                <span className="text-sm text-green-600 font-semibold">
                                    High Usage
                                </span>
                            </div>
                        ))}
                    </div>
                </div>

                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                        <ThumbDownIcon className="w-5 h-5 text-orange-500 mr-2" />
                        Underutilized Features
                    </h3>
                    <div className="space-y-2">
                        {data.underutilizedFeatures.length > 0 ? (
                            data.underutilizedFeatures.map((feature, index) => (
                                <div
                                    key={feature}
                                    className="flex items-center justify-between p-3 bg-orange-50 rounded-md"
                                >
                                    <span className="font-medium text-gray-900">
                                        {feature}
                                    </span>
                                    <span className="text-sm text-orange-600 font-semibold">
                                        Needs Promotion
                                    </span>
                                </div>
                            ))
                        ) : (
                            <p className="text-gray-600 text-sm">
                                All features are well-utilized! 🎉
                            </p>
                        )}
                    </div>
                </div>
            </div>

            {/* Wardrobe Insights */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">
                    Wardrobe Insights
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Most Popular Categories
                        </h4>
                        <div className="space-y-2">
                            {data.wardrobeStats.mostPopularCategories.map((cat) => (
                                <div key={cat.category} className="flex items-center justify-between">
                                    <span className="text-gray-700">{cat.category}</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(cat.count / data.wardrobeStats.mostPopularCategories[0].count) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                                            {cat.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                    <div>
                        <h4 className="text-sm font-medium text-gray-700 mb-3">
                            Most Popular Colors
                        </h4>
                        <div className="space-y-2">
                            {data.wardrobeStats.mostPopularColors.map((color) => (
                                <div key={color.color} className="flex items-center justify-between">
                                    <span className="text-gray-700">{color.color}</span>
                                    <div className="flex items-center space-x-2">
                                        <div className="w-24 bg-gray-200 rounded-full h-2">
                                            <div
                                                className="bg-indigo-600 h-2 rounded-full"
                                                style={{
                                                    width: `${(color.count / data.wardrobeStats.mostPopularColors[0].count) * 100}%`,
                                                }}
                                            />
                                        </div>
                                        <span className="text-sm font-semibold text-gray-900 w-8 text-right">
                                            {color.count}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>

            {/* Marketplace Stats */}
            {data.marketplaceStats.totalProducts > 0 && (
                <div className="bg-white rounded-lg shadow-md p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">
                        Marketplace Performance
                    </h3>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div>
                            <p className="text-sm text-gray-600">Total Products</p>
                            <p className="text-2xl font-bold text-indigo-600">
                                {data.marketplaceStats.totalProducts}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Orders</p>
                            <p className="text-2xl font-bold text-green-600">
                                {data.marketplaceStats.totalOrders}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Total Revenue</p>
                            <p className="text-2xl font-bold text-purple-600">
                                ${data.marketplaceStats.totalRevenue.toFixed(2)}
                            </p>
                        </div>
                        <div>
                            <p className="text-sm text-gray-600">Avg Order Value</p>
                            <p className="text-2xl font-bold text-blue-600">
                                ${data.marketplaceStats.averageOrderValue.toFixed(2)}
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {/* Recommendations */}
            <div className="bg-white rounded-lg shadow-md p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
                    <LightBulbIcon className="w-5 h-5 text-yellow-500 mr-2" />
                    Actionable Recommendations
                </h3>
                <div className="space-y-4">
                    {data.recommendations.map((rec, index) => (
                        <div
                            key={index}
                            className={`border-l-4 rounded p-4 ${getPriorityColor(rec.priority)}`}
                        >
                            <div className="flex items-start justify-between mb-2">
                                <div>
                                    <div className="flex items-center space-x-2 mb-1">
                                        <span className="font-semibold text-lg">
                                            {rec.title}
                                        </span>
                                        <span className={`px-2 py-1 text-xs font-semibold rounded ${getPriorityColor(rec.priority)}`}>
                                            {rec.priority.toUpperCase()}
                                        </span>
                                        <span className="px-2 py-1 text-xs font-semibold bg-gray-200 text-gray-700 rounded">
                                            {rec.type.toUpperCase()}
                                        </span>
                                    </div>
                                    <p className="text-sm text-gray-700 mb-2">
                                        {rec.description}
                                    </p>
                                    <p className="text-xs font-medium text-gray-600">
                                        💡 Impact: {rec.impact}
                                    </p>
                                </div>
                            </div>
                        </div>
                    ))}
                    {data.recommendations.length === 0 && (
                        <p className="text-gray-600 text-center py-4">
                            No specific recommendations at this time. Keep monitoring!
                        </p>
                    )}
                </div>
            </div>
        </div>
    );
};

export default UserEngagementAnalytics;

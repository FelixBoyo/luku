import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchBusinessPromotions,
    createPromotion,
    updatePromotion,
    deletePromotion,
} from '../store/slices/promotionsSlice';
import { fetchBusinessProducts } from '../store/slices/productsSlice';
import { fetchBusinessAccount } from '../store/slices/businessSlice';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { Promotion } from '../types';

const PromotionManager: React.FC = () => {
    const dispatch = useAppDispatch();
    const { promotions, loading } = useAppSelector((state) => state.promotions);
    const { products } = useAppSelector((state) => state.products);
    const { currentBusiness } = useAppSelector((state) => state.business);

    const [showForm, setShowForm] = useState(false);
    const [formData, setFormData] = useState({
        product_id: '',
        promotion_type: 'discount' as 'discount' | 'bundle' | 'flash_sale',
        discount_percentage: '',
        discount_amount: '',
        start_date: '',
        end_date: '',
    });

    useEffect(() => {
        if (currentBusiness) {
            dispatch(fetchBusinessPromotions(currentBusiness.id));
            dispatch(fetchBusinessProducts(currentBusiness.id));
        } else {
            dispatch(fetchBusinessAccount());
        }
    }, [dispatch, currentBusiness]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!currentBusiness) return;

        try {
            await dispatch(
                createPromotion({
                    business_id: currentBusiness.id,
                    product_id: formData.product_id || undefined,
                    promotion_type: formData.promotion_type,
                    discount_percentage: formData.discount_percentage
                        ? Number(formData.discount_percentage)
                        : undefined,
                    discount_amount: formData.discount_amount
                        ? Number(formData.discount_amount)
                        : undefined,
                    start_date: new Date(formData.start_date).toISOString(),
                    end_date: new Date(formData.end_date).toISOString(),
                })
            ).unwrap();
            setShowForm(false);
            setFormData({
                product_id: '',
                promotion_type: 'discount',
                discount_percentage: '',
                discount_amount: '',
                start_date: '',
                end_date: '',
            });
        } catch (error: any) {
            alert(error.message || 'Failed to create promotion');
        }
    };

    const handleDelete = async (promotionId: string) => {
        if (window.confirm('Are you sure you want to delete this promotion?')) {
            await dispatch(deletePromotion(promotionId)).unwrap();
        }
    };

    if (loading && promotions.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Promotions</h2>
                <Button onClick={() => setShowForm(!showForm)}>
                    {showForm ? 'Cancel' : 'Create Promotion'}
                </Button>
            </div>

            {showForm && (
                <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow-md p-6 mb-6">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Product (leave empty for store-wide)
                            </label>
                            <select
                                value={formData.product_id}
                                onChange={(e) =>
                                    setFormData({ ...formData, product_id: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="">All Products</option>
                                {products.map((product) => (
                                    <option key={product.id} value={product.id}>
                                        {product.name}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Promotion Type
                            </label>
                            <select
                                value={formData.promotion_type}
                                onChange={(e) =>
                                    setFormData({
                                        ...formData,
                                        promotion_type: e.target.value as any,
                                    })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            >
                                <option value="discount">Discount</option>
                                <option value="bundle">Bundle</option>
                                <option value="flash_sale">Flash Sale</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Percentage
                            </label>
                            <input
                                type="number"
                                min="0"
                                max="100"
                                value={formData.discount_percentage}
                                onChange={(e) =>
                                    setFormData({ ...formData, discount_percentage: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                placeholder="e.g., 20"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Discount Amount ($)
                            </label>
                            <input
                                type="number"
                                min="0"
                                value={formData.discount_amount}
                                onChange={(e) =>
                                    setFormData({ ...formData, discount_amount: e.target.value })
                                }
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                                placeholder="e.g., 10"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                Start Date
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.start_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, start_date: e.target.value })
                                }
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">
                                End Date
                            </label>
                            <input
                                type="datetime-local"
                                value={formData.end_date}
                                onChange={(e) =>
                                    setFormData({ ...formData, end_date: e.target.value })
                                }
                                required
                                className="w-full px-4 py-2 border border-gray-300 rounded-md"
                            />
                        </div>
                    </div>
                    <div className="mt-4">
                        <Button type="submit">Create Promotion</Button>
                    </div>
                </form>
            )}

            {promotions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-600">No promotions yet.</p>
                </div>
            ) : (
                <div className="space-y-4">
                    {promotions.map((promotion) => {
                        const product = products.find((p) => p.id === promotion.product_id);
                        const isActive =
                            promotion.is_active &&
                            new Date(promotion.start_date) <= new Date() &&
                            new Date(promotion.end_date) >= new Date();

                        return (
                            <div
                                key={promotion.id}
                                className="bg-white rounded-lg shadow-md p-6"
                            >
                                <div className="flex justify-between items-start">
                                    <div>
                                        <h3 className="text-lg font-semibold text-gray-900">
                                            {promotion.promotion_type.replace('_', ' ').toUpperCase()}
                                        </h3>
                                        <p className="text-sm text-gray-600">
                                            {product ? product.name : 'Store-wide'}
                                        </p>
                                        <div className="mt-2">
                                            {promotion.discount_percentage && (
                                                <span className="text-lg font-bold text-indigo-600">
                                                    {promotion.discount_percentage}% OFF
                                                </span>
                                            )}
                                            {promotion.discount_amount && (
                                                <span className="text-lg font-bold text-indigo-600">
                                                    ${promotion.discount_amount} OFF
                                                </span>
                                            )}
                                        </div>
                                        <p className="text-sm text-gray-600 mt-2">
                                            {new Date(promotion.start_date).toLocaleDateString()} -{' '}
                                            {new Date(promotion.end_date).toLocaleDateString()}
                                        </p>
                                        <span
                                            className={`inline-block mt-2 px-2 py-1 rounded text-xs font-semibold ${
                                                isActive
                                                    ? 'bg-green-100 text-green-800'
                                                    : 'bg-gray-100 text-gray-800'
                                            }`}
                                        >
                                            {isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </div>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDelete(promotion.id)}
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default PromotionManager;


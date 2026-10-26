import React, { useState, useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../store/hooks';
import {
    fetchBusinessProducts,
    createProduct,
    updateProduct,
    deleteProduct,
} from '../store/slices/productsSlice';
import { fetchBusinessAccount } from '../store/slices/businessSlice';
import ProductForm from './ProductForm';
import Button from './common/Button';
import Spinner from './common/Spinner';
import { Product } from '../types';
import { saveProductTags } from '../utils/productTags';

const ProductManagement: React.FC = () => {
    const dispatch = useAppDispatch();
    const { products, loading } = useAppSelector((state) => state.products);
    const { currentBusiness } = useAppSelector((state) => state.business);

    const [showForm, setShowForm] = useState(false);
    const [editingProduct, setEditingProduct] = useState<Product | null>(null);
    const [filter, setFilter] = useState<'all' | 'active' | 'inactive'>('all');
    const [selectedProducts, setSelectedProducts] = useState<Set<string>>(new Set());
    const [showBulkActions, setShowBulkActions] = useState(false);

    useEffect(() => {
        dispatch(fetchBusinessAccount());
    }, [dispatch]);

    useEffect(() => {
        if (currentBusiness) {
            dispatch(fetchBusinessProducts(currentBusiness.id));
        }
    }, [dispatch, currentBusiness]);

    const handleCreateProduct = async (productData: any) => {
        if (!currentBusiness) return;
        const { tags, ...productInfo } = productData;
        const result = await dispatch(
            createProduct({
                ...productInfo,
                business_id: currentBusiness.id,
            })
        ).unwrap();
        
        // Save tags if provided
        if (tags && tags.length > 0 && result?.id) {
            await saveProductTags(result.id, tags);
        }
        
        setShowForm(false);
    };

    const handleUpdateProduct = async (productData: any) => {
        if (!editingProduct) return;
        const { tags, ...productInfo } = productData;
        await dispatch(
            updateProduct({
                id: editingProduct.id,
                updates: productInfo,
            })
        ).unwrap();
        
        // Update tags
        if (tags !== undefined) {
            await saveProductTags(editingProduct.id, tags);
        }
        
        setEditingProduct(null);
    };

    const handleDeleteProduct = async (productId: string) => {
        if (window.confirm('Are you sure you want to delete this product?')) {
            await dispatch(deleteProduct(productId)).unwrap();
        }
    };

    const handleDuplicateProduct = async (product: Product) => {
        if (!currentBusiness) return;
        
        try {
            await dispatch(
                createProduct({
                    business_id: currentBusiness.id,
                    name: `${product.name} (Copy)`,
                    description: product.description || '',
                    price: product.price,
                    category: product.category,
                    color: product.color,
                    style: product.style,
                    season: product.season,
                    size: product.size,
                    stock_quantity: product.stock_quantity,
                    image_urls: product.image_urls, // Copy images
                })
            ).unwrap();
        } catch (error: any) {
            alert(error.message || 'Failed to duplicate product');
        }
    };

    const handleToggleSelect = (productId: string) => {
        setSelectedProducts((prev) => {
            const newSet = new Set(prev);
            if (newSet.has(productId)) {
                newSet.delete(productId);
            } else {
                newSet.add(productId);
            }
            return newSet;
        });
    };

    const handleSelectAll = () => {
        if (selectedProducts.size === filteredProducts.length) {
            setSelectedProducts(new Set());
        } else {
            setSelectedProducts(new Set(filteredProducts.map(p => p.id)));
        }
    };

    const handleBulkAction = async (action: 'activate' | 'deactivate' | 'delete') => {
        if (selectedProducts.size === 0) return;

        const confirmMessage = {
            activate: `Activate ${selectedProducts.size} product(s)?`,
            deactivate: `Deactivate ${selectedProducts.size} product(s)?`,
            delete: `Delete ${selectedProducts.size} product(s)? This cannot be undone.`,
        };

        if (!window.confirm(confirmMessage[action])) return;

        try {
            const promises = Array.from(selectedProducts).map((productId) => {
                if (action === 'delete') {
                    return dispatch(deleteProduct(productId)).unwrap();
                } else {
                    return dispatch(
                        updateProduct({
                            id: productId,
                            updates: { is_active: action === 'activate' },
                        })
                    ).unwrap();
                }
            });

            await Promise.all(promises);
            setSelectedProducts(new Set());
            setShowBulkActions(false);
        } catch (error: any) {
            alert(error.message || `Failed to ${action} products`);
        }
    };

    const filteredProducts = products.filter((product) => {
        if (filter === 'active') return product.is_active;
        if (filter === 'inactive') return !product.is_active;
        return true;
    });

    if (!currentBusiness) {
        return (
            <div className="text-center py-12">
                <p className="text-gray-600 mb-4">Please create a business account first.</p>
            </div>
        );
    }

    if (loading && products.length === 0) {
        return (
            <div className="flex justify-center py-12">
                <Spinner />
            </div>
        );
    }

    if (showForm || editingProduct) {
        return (
            <div className="max-w-4xl mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    {editingProduct ? 'Edit Product' : 'Create New Product'}
                </h2>
                <ProductForm
                    product={editingProduct || undefined}
                    businessId={currentBusiness.id}
                    onSubmit={editingProduct ? handleUpdateProduct : handleCreateProduct}
                    onCancel={() => {
                        setShowForm(false);
                        setEditingProduct(null);
                    }}
                />
            </div>
        );
    }

    return (
        <div>
            <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Product Management</h2>
                <div className="flex gap-2">
                    {selectedProducts.size > 0 && (
                        <div className="flex items-center gap-2 mr-4">
                            <span className="text-sm text-gray-600">
                                {selectedProducts.size} selected
                            </span>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                    setShowBulkActions(!showBulkActions);
                                }}
                            >
                                Bulk Actions
                            </Button>
                        </div>
                    )}
                    <Button onClick={() => setShowForm(true)}>Add New Product</Button>
                </div>
            </div>

            {showBulkActions && selectedProducts.size > 0 && (
                <div className="mb-4 p-4 bg-indigo-50 border border-indigo-200 rounded-lg">
                    <div className="flex items-center justify-between">
                        <span className="text-sm font-medium text-indigo-900">
                            {selectedProducts.size} product(s) selected
                        </span>
                        <div className="flex gap-2">
                            <Button
                                size="sm"
                                onClick={() => handleBulkAction('activate')}
                            >
                                Activate
                            </Button>
                            <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => handleBulkAction('deactivate')}
                            >
                                Deactivate
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleBulkAction('delete')}
                                className="text-red-600 hover:text-red-700"
                            >
                                Delete
                            </Button>
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => {
                                    setSelectedProducts(new Set());
                                    setShowBulkActions(false);
                                }}
                            >
                                Cancel
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            <div className="mb-4 flex space-x-4">
                <button
                    onClick={() => setFilter('all')}
                    className={`px-4 py-2 rounded-md ${
                        filter === 'all'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    All ({products.length})
                </button>
                <button
                    onClick={() => setFilter('active')}
                    className={`px-4 py-2 rounded-md ${
                        filter === 'active'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Active ({products.filter(p => p.is_active).length})
                </button>
                <button
                    onClick={() => setFilter('inactive')}
                    className={`px-4 py-2 rounded-md ${
                        filter === 'inactive'
                            ? 'bg-indigo-600 text-white'
                            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                >
                    Inactive ({products.filter(p => !p.is_active).length})
                </button>
            </div>

            {filteredProducts.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-lg shadow">
                    <p className="text-gray-600 mb-4">No products found.</p>
                    <Button onClick={() => setShowForm(true)}>Create Your First Product</Button>
                </div>
            ) : (
                <div>
                    <div className="mb-4 flex items-center justify-between">
                        <button
                            onClick={handleSelectAll}
                            className="text-sm text-indigo-600 hover:text-indigo-700 font-medium"
                        >
                            {selectedProducts.size === filteredProducts.length
                                ? 'Deselect All'
                                : 'Select All'}
                        </button>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {filteredProducts.map((product) => (
                            <div
                                key={product.id}
                                className={`bg-white rounded-lg shadow-md overflow-hidden border-2 ${
                                    selectedProducts.has(product.id)
                                        ? 'border-indigo-500'
                                        : 'border-transparent'
                                }`}
                            >
                            <div className="relative">
                                {product.image_urls.length > 0 && (
                                    <img
                                        src={product.image_urls[0]}
                                        alt={product.name}
                                        className="w-full h-48 object-cover"
                                    />
                                )}
                                <div className="absolute top-2 left-2">
                                    <input
                                        type="checkbox"
                                        checked={selectedProducts.has(product.id)}
                                        onChange={() => handleToggleSelect(product.id)}
                                        className="w-5 h-5 text-indigo-600 rounded focus:ring-indigo-500"
                                    />
                                </div>
                            </div>
                            <div className="p-4">
                                <div className="flex justify-between items-start mb-2">
                                    <h3 className="text-lg font-semibold text-gray-900">
                                        {product.name}
                                    </h3>
                                    <span className="text-lg font-bold text-indigo-600">
                                        ${product.price.toFixed(2)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-600 mb-2">{product.category}</p>
                                <div className="flex items-center justify-between mb-4">
                                    <span
                                        className={`px-2 py-1 text-xs rounded ${
                                            product.is_active
                                                ? 'bg-green-100 text-green-800'
                                                : 'bg-gray-100 text-gray-800'
                                        }`}
                                    >
                                        {product.is_active ? 'Active' : 'Inactive'}
                                    </span>
                                    <span className="text-sm text-gray-600">
                                        Stock: {product.stock_quantity}
                                    </span>
                                </div>
                                <div className="flex space-x-2">
                                    <Button
                                        size="sm"
                                        variant="secondary"
                                        onClick={() => setEditingProduct(product)}
                                    >
                                        Edit
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDuplicateProduct(product)}
                                    >
                                        Duplicate
                                    </Button>
                                    <Button
                                        size="sm"
                                        variant="ghost"
                                        onClick={() => handleDeleteProduct(product.id)}
                                        className="text-red-600 hover:text-red-700"
                                    >
                                        Delete
                                    </Button>
                                </div>
                            </div>
                        </div>
                    ))}
                    </div>
                </div>
            )}
        </div>
    );
};

export default ProductManagement;


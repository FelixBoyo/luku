import React, { useState, useEffect } from 'react';
import { useAppDispatch } from '../store/hooks';
import { fetchProduct } from '../store/slices/productsSlice';
import { getRecentlyViewed, RecentlyViewedItem } from '../utils/recentlyViewed';
import ProductCard from './ProductCard';
import { Product } from '../types';
import Spinner from './common/Spinner';

interface RecentlyViewedProps {
    onProductClick?: (product: Product) => void;
    limit?: number;
}

const RecentlyViewed: React.FC<RecentlyViewedProps> = ({ 
    onProductClick,
    limit = 10 
}) => {
    const dispatch = useAppDispatch();
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const loadProducts = async () => {
            setLoading(true);
            const viewedItems = getRecentlyViewed().slice(0, limit);
            
            if (viewedItems.length === 0) {
                setLoading(false);
                return;
            }

            try {
                const productPromises = viewedItems.map(item => 
                    dispatch(fetchProduct(item.productId)).unwrap()
                );
                
                const fetchedProducts = await Promise.all(productPromises);
                // Filter out any null/undefined products and only show active ones
                const validProducts = fetchedProducts
                    .filter((p): p is Product => p !== null && p !== undefined && p.is_active)
                    .slice(0, limit);
                
                setProducts(validProducts);
            } catch (error) {
                console.error('Failed to load recently viewed products:', error);
            } finally {
                setLoading(false);
            }
        };

        loadProducts();
    }, [dispatch, limit]);

    if (loading) {
        return (
            <div className="flex justify-center py-8">
                <Spinner />
            </div>
        );
    }

    if (products.length === 0) {
        return null;
    }

    return (
        <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
                <h2 className="text-2xl font-bold text-gray-900">Recently Viewed</h2>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                {products.map((product) => (
                    <ProductCard
                        key={product.id}
                        product={product}
                        onClick={onProductClick}
                    />
                ))}
            </div>
        </div>
    );
};

export default RecentlyViewed;

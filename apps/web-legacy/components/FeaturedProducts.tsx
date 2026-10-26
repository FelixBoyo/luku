import React from 'react';
import { Product } from '../types';
import ProductCard from './ProductCard';

interface FeaturedProductsProps {
    products: Product[];
    onProductClick?: (product: Product) => void;
}

const FeaturedProducts: React.FC<FeaturedProductsProps> = ({
    products,
    onProductClick,
}) => {
    if (products.length === 0) return null;

    return (
        <div className="mb-8">
            <h2 className="text-2xl font-bold text-gray-900 mb-4">Featured Products</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {products.slice(0, 4).map((product) => (
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

export default FeaturedProducts;


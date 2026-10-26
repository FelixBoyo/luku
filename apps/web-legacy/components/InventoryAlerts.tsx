import React, { useEffect, useState } from 'react';
import { useAppSelector } from '../store/hooks';
import { Product } from '../types';
import Button from './common/Button';

interface InventoryAlertsProps {
    threshold?: number;
}

const InventoryAlerts: React.FC<InventoryAlertsProps> = ({ threshold = 10 }) => {
    const { products } = useAppSelector((state) => state.products);
    const [lowStockProducts, setLowStockProducts] = useState<Product[]>([]);
    const [outOfStockProducts, setOutOfStockProducts] = useState<Product[]>([]);

    useEffect(() => {
        const lowStock = products.filter(
            (p) => p.stock_quantity > 0 && p.stock_quantity <= threshold
        );
        const outOfStock = products.filter((p) => p.stock_quantity === 0);

        setLowStockProducts(lowStock);
        setOutOfStockProducts(outOfStock);
    }, [products, threshold]);

    if (lowStockProducts.length === 0 && outOfStockProducts.length === 0) {
        return null;
    }

    return (
        <div className="space-y-4">
            {outOfStockProducts.length > 0 && (
                <div className="bg-red-50 border-l-4 border-red-400 p-4 rounded">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-red-800 mb-1">
                                Out of Stock ({outOfStockProducts.length})
                            </h3>
                            <p className="text-sm text-red-700">
                                {outOfStockProducts.length === 1
                                    ? '1 product is out of stock'
                                    : `${outOfStockProducts.length} products are out of stock`}
                            </p>
                            <ul className="mt-2 space-y-1">
                                {outOfStockProducts.slice(0, 5).map((product) => (
                                    <li key={product.id} className="text-sm text-red-700">
                                        • {product.name}
                                    </li>
                                ))}
                                {outOfStockProducts.length > 5 && (
                                    <li className="text-sm text-red-600 font-medium">
                                        +{outOfStockProducts.length - 5} more
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}

            {lowStockProducts.length > 0 && (
                <div className="bg-yellow-50 border-l-4 border-yellow-400 p-4 rounded">
                    <div className="flex items-center justify-between">
                        <div>
                            <h3 className="text-lg font-semibold text-yellow-800 mb-1">
                                Low Stock ({lowStockProducts.length})
                            </h3>
                            <p className="text-sm text-yellow-700">
                                {lowStockProducts.length === 1
                                    ? '1 product is running low on stock'
                                    : `${lowStockProducts.length} products are running low on stock`}
                            </p>
                            <ul className="mt-2 space-y-1">
                                {lowStockProducts.slice(0, 5).map((product) => (
                                    <li key={product.id} className="text-sm text-yellow-700">
                                        • {product.name} ({product.stock_quantity} left)
                                    </li>
                                ))}
                                {lowStockProducts.length > 5 && (
                                    <li className="text-sm text-yellow-600 font-medium">
                                        +{lowStockProducts.length - 5} more
                                    </li>
                                )}
                            </ul>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default InventoryAlerts;

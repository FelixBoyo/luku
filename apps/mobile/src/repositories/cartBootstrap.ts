import { USE_MOCK_DATA } from '../lib/config';
import { mockCartItems } from '../data/mock/wishlist';

export type CartBootstrapLine = {
    productId: string;
    name: string;
    brand: string;
    price: number;
    imageUrl: string;
    quantity: number;
    color?: string;
    businessId: string;
    sellerName?: string;
};

export const getInitialCartLines = (): CartBootstrapLine[] => {
    if (!USE_MOCK_DATA) return [];
    return mockCartItems.map((i) => ({
        productId: i.id,
        name: i.name,
        brand: i.brand,
        price: i.price,
        imageUrl: i.imageUrl,
        quantity: 1,
        // Mock rows carry no seller ids; brand stands in so grouping still works.
        businessId: `mock:${i.brand}`,
        sellerName: i.brand,
    }));
};

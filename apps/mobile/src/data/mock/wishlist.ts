import type { Product } from '../../types/domain/product';

export type WishlistItem = {
    id: string;
    name: string;
    brand: string;
    price: number;
    imageUrl: string;
    addedDate: string;
};

export const mockWishlist: WishlistItem[] = [
    {
        id: '1',
        name: 'Vintage Leather Jacket',
        brand: 'Heritage Finds',
        price: 12500,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        addedDate: '1 day ago',
    },
    {
        id: '12',
        name: 'Silk Blouse',
        brand: 'Elegant Wear',
        price: 6200,
        imageUrl: 'https://images.unsplash.com/photo-1624206112431-23cbb5116b02?w=400',
        addedDate: '3 days ago',
    },
    {
        id: '14',
        name: 'Structured Handbag',
        brand: 'Essential Leather Co.',
        price: 14500,
        imageUrl: 'https://images.unsplash.com/photo-1584917865442-de89df76afd3?w=400',
        addedDate: '1 week ago',
    },
    {
        id: '5',
        name: 'Ankle Boots',
        brand: 'Modern Staples',
        price: 8900,
        imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
        addedDate: '2 weeks ago',
    },
    {
        id: '9',
        name: 'Wool Blazer',
        brand: 'Timeless Essentials',
        price: 15400,
        imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
        addedDate: '2 weeks ago',
    },
];

export const mockCartItems: Pick<
    Product,
    'id' | 'name' | 'brand' | 'price' | 'imageUrl'
>[] = [
    {
        id: '1',
        name: 'Vintage Leather Jacket',
        brand: 'Heritage Finds',
        price: 12500,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    },
    {
        id: '3',
        name: 'Minimalist Handbag',
        brand: 'Essential Leather Co.',
        price: 9800,
        imageUrl: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=400',
    },
];

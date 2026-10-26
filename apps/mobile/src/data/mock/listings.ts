export type ListingStatus = 'Active' | 'Draft' | 'Sold';

export type Listing = {
    id: string;
    name: string;
    price: number;
    imageUrl: string;
    views: number;
    status: ListingStatus;
    wardrobeItemId?: string;
    category?: string;
    size?: string;
    condition?: string;
    createdAt?: string;
};

export const mockListings: Listing[] = [
    {
        id: 'l1',
        name: 'Vintage Denim Jacket',
        price: 8900,
        imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
        views: 142,
        status: 'Active',
        category: 'Outerwear',
        size: 'M',
        condition: 'Gently Used',
        createdAt: '2025-11-01T10:00:00.000Z',
    },
    {
        id: 'l2',
        name: 'Silk Scarf',
        price: 1200,
        imageUrl: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400',
        views: 56,
        status: 'Active',
    },
    {
        id: 'l3',
        name: 'Leather Ankle Boots',
        price: 6500,
        imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
        views: 89,
        status: 'Draft',
    },
    {
        id: 'l4',
        name: 'Cashmere Sweater',
        price: 4200,
        imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
        views: 31,
        status: 'Active',
    },
    {
        id: 'l5',
        name: 'Structured Tote Bag',
        price: 7800,
        imageUrl: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=400',
        views: 0,
        status: 'Sold',
    },
    {
        id: 'l6',
        name: 'Linen Summer Dress',
        price: 3400,
        imageUrl: 'https://images.unsplash.com/photo-1515372039744-b8f02a3ae446?w=400',
        views: 12,
        status: 'Draft',
    },
];

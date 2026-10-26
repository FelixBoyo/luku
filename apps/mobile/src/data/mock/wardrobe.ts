export type WearHistoryEntry = {
    date: string;
    occasion: string;
};

export type WardrobeOutfitRef = {
    id: string;
    name: string;
    imageUrl: string;
};

export type WardrobeItem = {
    id: string;
    name: string;
    category: string;
    imageUrl: string;
    images: string[];
    wearCount: number;
    brand: string;
    color: string;
    size: string;
    condition: string;
    purchasePrice: number;
    dateAdded: string;
    description?: string;
    source?: 'manual' | 'purchase';
    wearHistory?: WearHistoryEntry[];
    outfits?: WardrobeOutfitRef[];
};

export const mockWardrobeItems: WardrobeItem[] = [
    {
        id: '1',
        name: 'Wool Coat',
        category: 'Outerwear',
        brand: 'Massimo Dutti',
        color: 'Camel',
        size: 'M',
        condition: 'Gently Used',
        purchasePrice: 18500,
        dateAdded: 'Jan 15, 2024',
        imageUrl: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=800',
        images: [
            'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=800',
            'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=800',
        ],
        wearCount: 12,
        wearHistory: [
            { date: 'May 15, 2026', occasion: 'Dinner with friends' },
            { date: 'May 10, 2026', occasion: 'Coffee meeting' },
            { date: 'May 5, 2026', occasion: 'Weekend brunch' },
        ],
        outfits: [
            { id: 'o1', name: 'Casual Weekend', imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=300' },
            { id: 'o2', name: 'Night Out', imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=300' },
        ],
    },
    {
        id: '2',
        name: 'Cashmere Sweater',
        category: 'Tops',
        brand: 'COS',
        color: 'Cream',
        size: 'S',
        condition: 'Gently Used',
        purchasePrice: 9800,
        dateAdded: 'Mar 3, 2024',
        imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
        images: [
            'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=800',
        ],
        wearCount: 24,
        wearHistory: [
            { date: 'May 12, 2026', occasion: 'Office day' },
            { date: 'May 3, 2026', occasion: 'Casual Friday' },
        ],
        outfits: [
            { id: 'o1', name: 'Casual Weekend', imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=300' },
        ],
    },
    {
        id: '3',
        name: 'Cotton T-Shirt',
        category: 'Tops',
        brand: 'Uniqlo',
        color: 'White',
        size: 'M',
        condition: 'Used',
        purchasePrice: 1500,
        dateAdded: 'Apr 10, 2024',
        imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800',
        images: ['https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800'],
        wearCount: 36,
        wearHistory: [{ date: 'May 14, 2026', occasion: 'Errands' }],
        outfits: [],
    },
    {
        id: '4',
        name: 'Linen Shirt',
        category: 'Tops',
        brand: 'Zara',
        color: 'Light Blue',
        size: 'L',
        condition: 'New / Never Worn',
        purchasePrice: 3200,
        dateAdded: 'May 1, 2024',
        imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
        images: [
            'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=800',
            'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=800',
        ],
        wearCount: 18,
        wearHistory: [{ date: 'May 8, 2026', occasion: 'Brunch' }],
        outfits: [{ id: 'o3', name: 'Date Night', imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300' }],
    },
    {
        id: '5',
        name: 'Tailored Trousers',
        category: 'Bottoms',
        brand: 'H&M',
        color: 'Black',
        size: 'M',
        condition: 'Gently Used',
        purchasePrice: 4500,
        dateAdded: 'Feb 20, 2024',
        imageUrl: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=800',
        images: ['https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=800'],
        wearCount: 15,
        wearHistory: [{ date: 'May 11, 2026', occasion: 'Client meeting' }],
        outfits: [{ id: 'o2', name: 'Office Professional', imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=300' }],
    },
    {
        id: '6',
        name: 'Leather Shoes',
        category: 'Shoes',
        brand: 'Clarks',
        color: 'Dark Brown',
        size: '42',
        condition: 'Used',
        purchasePrice: 8900,
        dateAdded: 'Dec 5, 2023',
        imageUrl: 'https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?w=800',
        images: [
            'https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?w=800',
            'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=800',
        ],
        wearCount: 20,
        wearHistory: [{ date: 'May 9, 2026', occasion: 'Work event' }],
        outfits: [],
    },
    {
        id: '7',
        name: 'Sneakers',
        category: 'Shoes',
        brand: 'Clean Kicks',
        color: 'White',
        size: '9',
        condition: 'Gently Used',
        purchasePrice: 4200,
        dateAdded: 'Jun 12, 2024',
        imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800',
        images: ['https://images.unsplash.com/photo-1549298916-b41d501d3772?w=800'],
        wearCount: 32,
        wearHistory: [{ date: 'May 16, 2026', occasion: 'Weekend walk' }],
        outfits: [{ id: 'o1', name: 'Casual Weekend', imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=300' }],
    },
];

export const getWardrobeItemById = (id: string): WardrobeItem =>
    mockWardrobeItems.find((w) => w.id === id) ?? mockWardrobeItems[0];

export const getWardrobeItemIndex = (id: string): number => {
    const idx = mockWardrobeItems.findIndex((w) => w.id === id);
    return idx >= 0 ? idx : 0;
};

export type OOTDItem = {
    name: string;
    wardrobeItemId: string;
    imageUrl: string;
};

export type OutfitOfDay = {
    id: string;
    name: string;
    items: OOTDItem[];
    imageUrl: string;
    occasion: string;
    temperature: string;
};

export const outfitsOfDay: OutfitOfDay[] = [
    {
        id: 'ootd-1',
        name: 'Casual Chic Weekend',
        items: [
            { name: 'Linen Blazer', wardrobeItemId: '4', imageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400' },
            { name: 'White Tee', wardrobeItemId: '3', imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400' },
            { name: 'Tailored Trousers', wardrobeItemId: '5', imageUrl: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=400' },
            { name: 'Sneakers', wardrobeItemId: '7', imageUrl: 'https://images.unsplash.com/photo-1549298916-b41d501d3772?w=400' },
        ],
        imageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800',
        occasion: 'Weekend Brunch',
        temperature: '22°C',
    },
    {
        id: 'ootd-2',
        name: 'Smart Professional',
        items: [
            { name: 'Wool Coat', wardrobeItemId: '1', imageUrl: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=400' },
            { name: 'Cashmere Sweater', wardrobeItemId: '2', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400' },
            { name: 'Tailored Trousers', wardrobeItemId: '5', imageUrl: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=400' },
            { name: 'Leather Shoes', wardrobeItemId: '6', imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400' },
        ],
        imageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
        occasion: 'Office Meeting',
        temperature: '19°C',
    },
    {
        id: 'ootd-3',
        name: 'Evening Elegance',
        items: [
            { name: 'Linen Shirt', wardrobeItemId: '4', imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400' },
            { name: 'Wool Coat', wardrobeItemId: '1', imageUrl: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=400' },
            { name: 'Leather Shoes', wardrobeItemId: '6', imageUrl: 'https://images.unsplash.com/photo-1657034321685-1fba1b2751f3?w=400' },
            { name: 'Cashmere Sweater', wardrobeItemId: '2', imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400' },
        ],
        imageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        occasion: 'Dinner Date',
        temperature: '20°C',
    },
];

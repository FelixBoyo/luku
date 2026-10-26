export type OutfitPiece = {
    type: 'wardrobe' | 'product';
    id: string;
};

export type OutfitSource = 'manual' | 'ai' | 'inspiration';

export type Outfit = {
    id: string;
    name: string;
    occasion: string;
    coverImageUrl: string;
    pieces: OutfitPiece[];
    source: OutfitSource;
    createdAt: string;
};

/** @deprecated Use Outfit */
export type SavedOutfit = {
    id: string;
    name: string;
    items: number;
    imageUrl: string;
    occasion: string;
    savedDate: string;
};

export const userOutfits: Outfit[] = [
    {
        id: 'out-1',
        name: 'Earth Tone Layers',
        occasion: 'Weekend',
        coverImageUrl: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=800',
        pieces: [
            { type: 'wardrobe', id: '1' },
            { type: 'wardrobe', id: '2' },
            { type: 'wardrobe', id: '5' },
        ],
        source: 'manual',
        createdAt: 'May 1, 2026',
    },
    {
        id: 'out-2',
        name: 'Office Minimal',
        occasion: 'Work',
        coverImageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=800',
        pieces: [
            { type: 'wardrobe', id: '2' },
            { type: 'wardrobe', id: '5' },
            { type: 'product', id: '3' },
        ],
        source: 'manual',
        createdAt: 'Apr 28, 2026',
    },
    {
        id: 'out-3',
        name: 'Coffee Run',
        occasion: 'Casual',
        coverImageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=800',
        pieces: [
            { type: 'wardrobe', id: '3' },
            { type: 'wardrobe', id: '4' },
            { type: 'product', id: '7' },
        ],
        source: 'manual',
        createdAt: 'Apr 22, 2026',
    },
    {
        id: 'out-4',
        name: 'Rainy Day Layers',
        occasion: 'Errands',
        coverImageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=800',
        pieces: [
            { type: 'wardrobe', id: '1' },
            { type: 'wardrobe', id: '6' },
            { type: 'product', id: '2' },
        ],
        source: 'manual',
        createdAt: 'Apr 15, 2026',
    },
    {
        id: 'out-5',
        name: 'Gallery Opening',
        occasion: 'Evening',
        coverImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=800',
        pieces: [
            { type: 'wardrobe', id: '6' },
            { type: 'product', id: '12' },
            { type: 'product', id: '14' },
        ],
        source: 'manual',
        createdAt: 'Apr 8, 2026',
    },
    {
        id: 'out-6',
        name: 'Travel Capsule',
        occasion: 'Travel',
        coverImageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=800',
        pieces: [
            { type: 'wardrobe', id: '4' },
            { type: 'wardrobe', id: '7' },
            { type: 'product', id: '1' },
            { type: 'product', id: '8' },
        ],
        source: 'manual',
        createdAt: 'Mar 30, 2026',
    },
];

export const savedInspirations: Outfit[] = [
    {
        id: 'fav-1',
        name: 'Casual Weekend',
        occasion: 'Brunch',
        coverImageUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=600',
        pieces: [
            { type: 'wardrobe', id: '3' },
            { type: 'wardrobe', id: '4' },
            { type: 'product', id: '6' },
            { type: 'product', id: '8' },
        ],
        source: 'inspiration',
        createdAt: '2 days ago',
    },
    {
        id: 'fav-2',
        name: 'Office Chic',
        occasion: 'Work',
        coverImageUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600',
        pieces: [
            { type: 'wardrobe', id: '1' },
            { type: 'wardrobe', id: '2' },
            { type: 'product', id: '3' },
            { type: 'product', id: '5' },
            { type: 'product', id: '12' },
        ],
        source: 'inspiration',
        createdAt: '1 week ago',
    },
    {
        id: 'fav-3',
        name: 'Evening Elegance',
        occasion: 'Dinner',
        coverImageUrl: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?w=600',
        pieces: [
            { type: 'product', id: '12' },
            { type: 'product', id: '14' },
            { type: 'wardrobe', id: '6' },
        ],
        source: 'inspiration',
        createdAt: '2 weeks ago',
    },
    {
        id: 'fav-4',
        name: 'Street Style',
        occasion: 'Casual',
        coverImageUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=600',
        pieces: [
            { type: 'wardrobe', id: '4' },
            { type: 'product', id: '1' },
            { type: 'product', id: '7' },
        ],
        source: 'inspiration',
        createdAt: '3 weeks ago',
    },
    {
        id: 'fav-5',
        name: 'Monochrome Minimal',
        occasion: 'Work',
        coverImageUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=600',
        pieces: [
            { type: 'wardrobe', id: '2' },
            { type: 'product', id: '4' },
            { type: 'product', id: '9' },
        ],
        source: 'inspiration',
        createdAt: '1 month ago',
    },
    {
        id: 'fav-6',
        name: 'Summer Linen',
        occasion: 'Vacation',
        coverImageUrl: 'https://images.unsplash.com/photo-1595777457583-95e059d581b8?w=600',
        pieces: [
            { type: 'product', id: '6' },
            { type: 'product', id: '10' },
            { type: 'wardrobe', id: '3' },
        ],
        source: 'inspiration',
        createdAt: '1 month ago',
    },
];

/** Legacy export for any remaining imports */
export const savedOutfits: SavedOutfit[] = savedInspirations.map((o) => ({
    id: o.id,
    name: o.name,
    items: o.pieces.length,
    imageUrl: o.coverImageUrl,
    occasion: o.occasion,
    savedDate: o.createdAt,
}));

export type TryOnOutfit = {
    id: string;
    name: string;
    occasion: string;
    items: { name: string; image: string }[];
};

export const tryOnOutfits: TryOnOutfit[] = [
    {
        id: 'to-1',
        name: 'Casual Weekend',
        occasion: 'Brunch',
        items: [
            { name: 'Linen Blazer', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=200' },
            { name: 'White Tee', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=200' },
            { name: 'High-Waist Jeans', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=200' },
            { name: 'Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=200' },
        ],
    },
    {
        id: 'to-2',
        name: 'Office Professional',
        occasion: 'Meeting',
        items: [
            { name: 'Wool Trench', image: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=200' },
            { name: 'Tailored Trousers', image: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=200' },
            { name: 'Ankle Boots', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200' },
        ],
    },
    {
        id: 'to-3',
        name: 'Date Night',
        occasion: 'Evening',
        items: [
            { name: 'Silk Blouse', image: 'https://images.unsplash.com/photo-1624206112431-23cbb5116b02?w=200' },
            { name: 'Leather Jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=200' },
            { name: 'Heels', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=200' },
        ],
    },
];

export const getOutfitById = (id: string): Outfit | undefined =>
    [...userOutfits, ...savedInspirations].find((o) => o.id === id);

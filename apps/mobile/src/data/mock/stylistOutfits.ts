export type StylistOutfitItem = {
    productId: string;
    name: string;
    image: string;
    owned: boolean;
    price?: number;
};

export type StylistOutfit = {
    id: string;
    name: string;
    occasion: string;
    fromWardrobe?: boolean;
    items: StylistOutfitItem[];
};

export const stylistOutfits: StylistOutfit[] = [
    {
        id: 'so-1',
        name: 'Casual Weekend Vibes',
        occasion: 'Weekend Brunch',
        items: [
            { productId: '9', name: 'Linen Blazer', image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400', owned: true },
            { productId: '6', name: 'Cashmere Sweater', image: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400', owned: true },
            { productId: '11', name: 'High-Waist Jeans', image: 'https://images.unsplash.com/photo-1542272604-787c3835535d?w=400', owned: false, price: 8500 },
            { productId: '8', name: 'White Sneakers', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', owned: true },
        ],
    },
    {
        id: 'so-2',
        name: 'Already In Your Closet',
        occasion: 'Weekend Errands',
        fromWardrobe: true,
        items: [
            { productId: '7', name: 'Denim Jacket', image: 'https://images.unsplash.com/photo-1523205771623-e0faa4d2813d?w=400', owned: true },
            { productId: '4', name: 'Striped Shirt', image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400', owned: true },
            { productId: '13', name: 'Chino Trousers', image: 'https://images.unsplash.com/photo-1473966968600-fa801b869a1a?w=400', owned: true },
            { productId: '8', name: 'White Sneakers', image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=400', owned: true },
        ],
    },
    {
        id: 'so-3',
        name: 'Office Professional',
        occasion: 'Business Meeting',
        items: [
            { productId: '2', name: 'Wool Trench', image: 'https://images.unsplash.com/photo-1637102146291-c408b298e22b?w=400', owned: true },
            { productId: '12', name: 'Silk Blouse', image: 'https://images.unsplash.com/photo-1624206112431-23cbb5116b02?w=400', owned: false, price: 6200 },
            { productId: '13', name: 'Tailored Trousers', image: 'https://images.unsplash.com/photo-1619470148547-0adbfc64b595?w=400', owned: true },
            { productId: '5', name: 'Ankle Boots', image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400', owned: true },
        ],
    },
];

export type StyleEnhancer = {
    productId: string;
    name: string;
    image: string;
    price: number;
    match: number;
};

export const styleEnhancers: StyleEnhancer[] = [
    { productId: '1', name: 'Leather Jacket', image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400', price: 12500, match: 94 },
    { productId: '16', name: 'Silk Scarf', image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400', price: 2800, match: 91 },
];

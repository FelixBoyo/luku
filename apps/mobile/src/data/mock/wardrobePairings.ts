export type WardrobePairing = {
    productId: string;
    name: string;
    pairs: string;
    match: number;
    price: number;
    image: string;
};

export const wardrobePairings: WardrobePairing[] = [
    {
        productId: '1',
        name: 'Leather Jacket',
        pairs: 'White Tee',
        match: 95,
        price: 12500,
        image: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
    },
    {
        productId: '5',
        name: 'Ankle Boots',
        pairs: 'Blazer',
        match: 92,
        price: 8900,
        image: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
    },
    {
        productId: '3',
        name: 'Minimalist Handbag',
        pairs: 'Coat',
        match: 90,
        price: 9800,
        image: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=400',
    },
    {
        productId: '6',
        name: 'Cashmere Sweater',
        pairs: 'Jeans',
        match: 88,
        price: 7200,
        image: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
    },
    {
        productId: '2',
        name: 'Wool Trench Coat',
        pairs: 'Trousers',
        match: 87,
        price: 18900,
        image: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
    },
    {
        productId: '7',
        name: 'Linen Shirt',
        pairs: 'Chinos',
        match: 86,
        price: 5400,
        image: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
    },
    {
        productId: '8',
        name: 'Silk Scarf',
        pairs: 'Wool Coat',
        match: 85,
        price: 3200,
        image: 'https://images.unsplash.com/photo-1520903920243-00d872a2d1c9?w=400',
    },
    {
        productId: '9',
        name: 'Structured Blazer',
        pairs: 'Sneakers',
        match: 84,
        price: 11200,
        image: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=400',
    },
    {
        productId: '10',
        name: 'Midi Skirt',
        pairs: 'Cashmere Sweater',
        match: 83,
        price: 6800,
        image: 'https://images.unsplash.com/photo-1583496668950-6277a439cc66?w=400',
    },
    {
        productId: '11',
        name: 'Crossbody Bag',
        pairs: 'Linen Shirt',
        match: 82,
        price: 7600,
        image: 'https://images.unsplash.com/photo-1548036328-c9fa89d128fa?w=400',
    },
];

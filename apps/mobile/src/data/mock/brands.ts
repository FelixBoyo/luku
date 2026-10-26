import type { Brand } from '../../types/domain/discover';

export type { Brand } from '../../types/domain/discover';
/** @deprecated Use Brand */
export type MockBrand = Brand;

export const mockBrands: Brand[] = [
    {
        id: 'heritage-finds',
        name: 'Heritage Finds',
        tagline: 'Timeless vintage, curated',
        logoText: 'HF',
        coverUrl: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1080',
        followers: '12.4k',
        productCount: 86,
        rating: 4.9,
        verified: true,
        description:
            'Hand-picked vintage and pre-loved pieces with a story. Sustainable fashion for the modern wardrobe.',
    },
    {
        id: 'modern-staples',
        name: 'Modern Staples',
        tagline: 'Everyday essentials, elevated',
        logoText: 'MS',
        coverUrl: 'https://images.unsplash.com/photo-1483985988355-763728e1935b?w=1080',
        followers: '8.1k',
        productCount: 124,
        rating: 4.7,
        verified: true,
        description:
            'Clean, contemporary basics designed to last. Minimalist staples for a considered closet.',
    },
    {
        id: 'timeless-essentials',
        name: 'Timeless Essentials',
        tagline: 'Investment pieces, forever worn',
        logoText: 'TE',
        coverUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080',
        followers: '6.4k',
        productCount: 72,
        rating: 4.8,
        verified: true,
        description:
            'Considered tailoring and coats built to last decades. Quality over trends, always.',
    },
    {
        id: 'urban-style',
        name: 'UrbanStyle',
        tagline: 'Street-ready modern essentials',
        logoText: 'US',
        coverUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1080',
        followers: '15.2k',
        productCount: 158,
        rating: 4.8,
        verified: false,
        description:
            'Everyday streetwear and modern staples with an effortless edge. DM for bundle offers.',
    },
];

export const getBrandById = (id: string): Brand | undefined =>
    mockBrands.find((b) => b.id === id);

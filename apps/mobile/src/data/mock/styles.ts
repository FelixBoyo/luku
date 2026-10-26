import type { Style } from '../../types/domain/discover';

export type { Style } from '../../types/domain/discover';
/** @deprecated Use Style */
export type MockStyle = Style;

export const mockStyles: Style[] = [
    {
        id: 'minimalist',
        name: 'Minimalist',
        tagline: 'Less, but better',
        coverUrl: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=1080',
        followers: '24.8k',
        description:
            'Clean lines, neutral palettes, and intentional pieces. A wardrobe built on quality over quantity.',
        keywords: ['Neutral', 'Tailored', 'Monochrome', 'Essential'],
    },
    {
        id: 'vintage',
        name: 'Vintage',
        tagline: 'Old soul, timeless style',
        coverUrl: 'https://images.unsplash.com/photo-1525507119028-ed4c629a60a3?w=1080',
        followers: '31.2k',
        description:
            'Retro silhouettes and pre-loved treasures. Fashion with history and character.',
        keywords: ['Retro', 'Pre-loved', 'Denim', 'Leather'],
    },
    {
        id: 'streetwear',
        name: 'Streetwear',
        tagline: 'Comfort meets statement',
        coverUrl: 'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=1080',
        followers: '28.6k',
        description:
            'Relaxed silhouettes, bold layering, and sneaker-first styling for the everyday.',
        keywords: ['Oversized', 'Sneakers', 'Layered', 'Bold'],
    },
    {
        id: 'business',
        name: 'Business Casual',
        tagline: 'Polished, not stuffy',
        coverUrl: 'https://images.unsplash.com/photo-1591047139829-d91aecb6caea?w=1080',
        followers: '19.4k',
        description:
            'Sharp tailoring softened for the modern workday. Blazers, trousers, and refined knits.',
        keywords: ['Tailored', 'Blazer', 'Refined', 'Neutral'],
    },
];

export const getStyleById = (id: string): Style | undefined =>
    mockStyles.find((s) => s.id === id);

import { beforeEach, describe, expect, it, vi } from 'vitest';
import type { Product } from '@/types';
const { fromMock } = vi.hoisted(() => ({
    fromMock: vi.fn(),
}));

vi.mock('@/services/supabaseClient', () => ({
    supabase: {
        from: fromMock,
    },
}));

import {
    getRecommendedProducts,
    getRecommendedProductsForOutfits,
    getWardrobeBasedRecommendations,
    type WardrobeRecommendation,
} from '@/services/marketplaceService';

const mockProduct: Product = {
    id: 'prod_1',
    business_id: 'biz_1',
    name: 'Blue Jacket',
    description: 'Slim blue jacket',
    price: 129.99,
    category: 'jackets',
    color: 'blue',
    style: 'casual',
    season: 'all',
    size: 'M',
    stock_quantity: 5,
    image_urls: ['https://example.com/jacket.jpg'],
    is_featured: true,
    is_active: true,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
};

const createOutfit = (id: string) =>
    ({
        id,
        items: [{ category: 'jackets', color: 'blue', style: 'casual' }],
    } as any);

const setupSupabaseProductsResult = (products: Product[]) => {
    fromMock.mockReturnValue({
        select: vi.fn().mockReturnThis(),
        eq: vi.fn().mockReturnThis(),
        or: vi.fn().mockReturnThis(),
        limit: vi.fn().mockResolvedValue({ data: products, error: null }),
    });
};

const assertProductContract = (product: Product) => {
    const keys = Object.keys(product).sort();
    expect(keys).toEqual(
        [
            'business_id',
            'category',
            'color',
            'created_at',
            'description',
            'id',
            'image_urls',
            'is_active',
            'is_featured',
            'name',
            'price',
            'season',
            'size',
            'stock_quantity',
            'style',
            'updated_at',
        ].sort()
    );
    expect(Array.isArray(product.image_urls)).toBe(true);
    expect(typeof product.price).toBe('number');
};

const assertWardrobeRecommendationContract = (rec: WardrobeRecommendation) => {
    const { matchReasons, ...productShape } = rec;
    assertProductContract(productShape as Product);
    expect(Array.isArray(rec.matchReasons)).toBe(true);
};

describe('marketplaceService response contracts', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        fromMock.mockReset();
    });

    it('returns stable Product[] shape for single outfit recommendations', async () => {
        setupSupabaseProductsResult([mockProduct]);
        const result = await getRecommendedProducts(createOutfit('outfit_1'), 1);

        expect(result).toHaveLength(1);
        assertProductContract(result[0]);
        expect(result[0]).toEqual(mockProduct);
    });

    it('returns stable Map<string, Product[]> shape for multiple outfits', async () => {
        setupSupabaseProductsResult([mockProduct]);
        const result = await getRecommendedProductsForOutfits(
            [createOutfit('outfit_1'), createOutfit('outfit_2')],
            1
        );

        expect(result).toBeInstanceOf(Map);
        expect(Array.from(result.keys()).sort()).toEqual(['outfit_1', 'outfit_2']);
        for (const products of result.values()) {
            expect(Array.isArray(products)).toBe(true);
            expect(products[0]).toBeDefined();
            assertProductContract(products[0]);
        }
    });

    it('returns stable WardrobeRecommendation[] shape', async () => {
        setupSupabaseProductsResult([mockProduct]);
        const result = await getWardrobeBasedRecommendations(
            [{ category: 'jackets', color: 'blue', style: 'casual' }],
            1
        );

        expect(result).toHaveLength(1);
        assertWardrobeRecommendationContract(result[0]);
    });

    it('fails contract when Product shape drifts', async () => {
        setupSupabaseProductsResult([
            {
                ...mockProduct,
                price: undefined as unknown as number,
            },
        ]);

        const result = await getRecommendedProducts(createOutfit('outfit_bad'), 1);
        expect(() => assertProductContract(result[0] as Product)).toThrow();
    });
});

import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getOotd } from './ootd';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';

vi.mock('../../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

const createMockBuilder = (result: { data: any; error: any }) => {
    const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        maybeSingle: vi.fn(() => builder),
        then: (onfulfilled: any) => Promise.resolve(result).then(onfulfilled),
    };
    return builder;
};

describe('ootd task', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            from: vi.fn(),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    it('returns an Outfit of the Day composed of user wardrobe items', async () => {
        const mockWardrobe = [
            { id: 'item_1', name: 'Linen Shirt', category: 'Tops', image_url: 'shirt.jpg' },
            { id: 'item_2', name: 'Wide Pants', category: 'Bottoms', image_url: 'pants.jpg' },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'wardrobe_items') {
                return createMockBuilder({ data: mockWardrobe, error: null });
            }
            if (table === 'outfits') {
                return createMockBuilder({ data: null, error: null });
            }
            return createMockBuilder({ data: [], error: null });
        });

        const res = await getOotd('user_test_ootd', { refresh: true });

        expect(res.ootd).toBeDefined();
        expect(res.ootd.title).toBe('Modern Classic Silhouette');
        expect(res.ootd.pieces.length).toBeGreaterThanOrEqual(2);
        expect(res.ootd.matchScore).toBe(96);
    });

    it('falls back to default stylish pieces if user wardrobe is empty', async () => {
        mockSupabase.from.mockImplementation(() =>
            createMockBuilder({ data: [], error: null })
        );

        const res = await getOotd('user_empty_wardrobe', { refresh: true });

        expect(res.ootd).toBeDefined();
        expect(res.ootd.pieces.length).toBe(4);
        expect(res.ootd.coverImageUrl).toContain('unsplash');
    });
});

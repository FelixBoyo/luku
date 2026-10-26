import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getWardrobePairings } from './wardrobePairings';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';

vi.mock('../../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

const createMockBuilder = (result: { data: any; error: any }) => {
    const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        then: (onfulfilled: any) => Promise.resolve(result).then(onfulfilled),
    };
    return builder;
};

describe('wardrobePairings task', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            from: vi.fn(),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    it('cross-matches user wardrobe items with catalog items for pairing rail', async () => {
        const mockWardrobe = [
            { id: 'w1', name: 'Denim Jacket', category: 'Outerwear', image_url: 'jacket.jpg' },
        ];
        const mockProducts = [
            { id: 'p1', title: 'Relaxed Chinos', price: 2800, image_url: 'chinos.jpg', category: 'Bottoms' },
        ];

        mockSupabase.from.mockImplementation((table: string) => {
            if (table === 'wardrobe_items') {
                return createMockBuilder({ data: mockWardrobe, error: null });
            }
            if (table === 'products') {
                return createMockBuilder({ data: mockProducts, error: null });
            }
            return createMockBuilder({ data: [], error: null });
        });

        const res = await getWardrobePairings('user_pair_1');

        expect(res.pairings).toHaveLength(1);
        expect(res.pairings[0].wardrobeItemName).toBe('Denim Jacket');
        expect(res.pairings[0].pairedProductTitle).toBe('Relaxed Chinos');
        expect(res.pairings[0].matchPercentage).toBe(95);
    });

    it('falls back to default pairings when wardrobe is empty', async () => {
        mockSupabase.from.mockImplementation(() =>
            createMockBuilder({ data: [], error: null })
        );

        const res = await getWardrobePairings('user_pair_empty');

        expect(res.pairings.length).toBeGreaterThan(0);
        expect(res.pairings[0].pairedProductTitle).toBeDefined();
    });
});

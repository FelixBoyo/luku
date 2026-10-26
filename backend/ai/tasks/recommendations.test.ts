import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getRecommendations } from './recommendations';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';

vi.mock('../../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

const createMockBuilder = (result: { data: any; error: any }) => {
    const builder: any = {
        select: vi.fn(() => builder),
        limit: vi.fn(() => builder),
        then: (onfulfilled: any) => Promise.resolve(result).then(onfulfilled),
    };
    return builder;
};

describe('recommendations task', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = {
            from: vi.fn(),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    it('returns structured recommendations split across Home sections', async () => {
        const mockProducts = [
            { id: 'p1', title: 'Wool Blazer', price: 6500, image_url: 'blazer.jpg', category: 'Outerwear', brand: 'Zara' },
            { id: 'p2', title: 'Tailored Trousers', price: 3200, image_url: 'trousers.jpg', category: 'Bottoms', brand: 'Mango' },
            { id: 'p3', title: 'Leather Loafers', price: 4800, image_url: 'loafers.jpg', category: 'Footwear', brand: 'Clarks' },
        ];

        mockSupabase.from.mockReturnValue(createMockBuilder({ data: mockProducts, error: null }));

        const res = await getRecommendations('user_recs_1');

        expect(res.pickedForYou).toBeDefined();
        expect(res.pickedForYou?.title).toBe('Wool Blazer');
        expect(res.pickedForYou?.matchPercentage).toBe(98);
        expect(res.trending).toBeDefined();
        expect(res.youMightLike).toBeDefined();
        expect(res.moreForYou).toBeDefined();
    });

    it('falls back to curated items if database product table is empty', async () => {
        mockSupabase.from.mockReturnValue(createMockBuilder({ data: [], error: null }));

        const res = await getRecommendations('user_recs_empty');

        expect(res.pickedForYou).toBeDefined();
        expect(res.pickedForYou?.matchPercentage).toBe(98);
        expect(res.trending.length).toBeGreaterThan(0);
        expect(res.moreForYou.length).toBeGreaterThan(0);
    });
});

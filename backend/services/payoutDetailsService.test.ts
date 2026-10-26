import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getPayoutDetails, PayoutDetailsRequiredError } from './payoutDetailsService';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

const createMockBuilder = (result: { data: any; error: any }) => {
    const builder: any = {
        select: vi.fn(() => builder),
        eq: vi.fn(() => builder),
        maybeSingle: vi.fn(() => builder),
        then: (onfulfilled: any) => Promise.resolve(result).then(onfulfilled),
    };
    return builder;
};

describe('payoutDetailsService', () => {
    let mockSupabase: any;

    beforeEach(() => {
        vi.clearAllMocks();
        mockSupabase = { from: vi.fn() };
        vi.mocked(getSupabaseAdmin).mockReturnValue(mockSupabase);
    });

    it('returns null when the seller has no payout recipient', async () => {
        mockSupabase.from.mockReturnValue(createMockBuilder({ data: null, error: null }));

        await expect(getPayoutDetails('seller_1')).resolves.toBeNull();
    });

    it('PayoutDetailsRequiredError carries PAYOUT_DETAILS_REQUIRED', () => {
        const err = new PayoutDetailsRequiredError();
        expect(err.code).toBe('PAYOUT_DETAILS_REQUIRED');
        expect(err.message).toMatch(/payout details/i);
    });
});

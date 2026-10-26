import { describe, expect, it, vi, beforeEach } from 'vitest';
import { resolveSellerUserId, SellerIdentityNotFoundError } from './sellerIdentity';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

const mockBusinessLookup = (result: { data: any; error: any }) => {
    const builder: any = {};
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.maybeSingle = vi.fn(() => Promise.resolve(result));
    const from = vi.fn(() => builder);
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from } as any);
    return { builder, from };
};

describe('resolveSellerUserId', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('returns the peer seller id directly without touching the database', async () => {
        const { from } = mockBusinessLookup({ data: null, error: null });

        const userId = await resolveSellerUserId({ seller_user_id: 'user_peer' });

        expect(userId).toBe('user_peer');
        expect(from).not.toHaveBeenCalled();
    });

    it('resolves a catalog order through business_accounts.user_id', async () => {
        const { builder, from } = mockBusinessLookup({
            data: { user_id: 'user_owner' },
            error: null,
        });

        const userId = await resolveSellerUserId({ seller_id: 'biz_1' });

        expect(userId).toBe('user_owner');
        expect(from).toHaveBeenCalledWith('business_accounts');
        expect(builder.eq).toHaveBeenCalledWith('id', 'biz_1');
    });

    it('prefers the peer seller when both columns are somehow set', async () => {
        const { from } = mockBusinessLookup({ data: { user_id: 'user_owner' }, error: null });

        const userId = await resolveSellerUserId({
            seller_id: 'biz_1',
            seller_user_id: 'user_peer',
        });

        // 012 constrains these to be mutually exclusive, but a payout must never
        // silently pay the wrong party if that constraint is ever relaxed.
        expect(userId).toBe('user_peer');
        expect(from).not.toHaveBeenCalled();
    });

    it('throws when the order has no seller at all', async () => {
        mockBusinessLookup({ data: null, error: null });

        await expect(resolveSellerUserId({})).rejects.toBeInstanceOf(
            SellerIdentityNotFoundError
        );
    });

    it('throws when the business account has no owning user', async () => {
        mockBusinessLookup({ data: null, error: null });

        await expect(resolveSellerUserId({ seller_id: 'biz_missing' })).rejects.toThrow(
            'has no owning user'
        );
    });

    it('surfaces a database error rather than reporting a missing seller', async () => {
        mockBusinessLookup({ data: null, error: { message: 'connection reset' } });

        await expect(resolveSellerUserId({ seller_id: 'biz_1' })).rejects.toThrow(
            'connection reset'
        );
    });
});

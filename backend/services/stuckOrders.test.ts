import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getStuckOrders } from './ordersService';
import { getSupabaseAdmin } from '../data/supabaseAdmin';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

describe('getStuckOrders', () => {
    let builder: any;

    beforeEach(() => {
        builder = {
            select: vi.fn(() => builder),
            or: vi.fn(() => builder),
            order: vi.fn(() => Promise.resolve({ data: [], error: null })),
        };
        vi.mocked(getSupabaseAdmin).mockReturnValue({ from: vi.fn(() => builder) } as any);
    });

    it('includes disputed rows and SLA breaches, not a generic all-orders scan', async () => {
        await getStuckOrders();

        expect(builder.or).toHaveBeenCalledWith(expect.stringContaining('status.eq.disputed'));
        expect(builder.or).toHaveBeenCalledWith(expect.stringContaining('status.eq.cancelled'));
        expect(builder.or).toHaveBeenCalledWith(expect.stringContaining('status.eq.in_escrow'));
        expect(builder.or).toHaveBeenCalledWith(expect.stringContaining('status.eq.shipped'));
    });
});

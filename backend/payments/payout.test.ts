import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import { payoutOnRelease } from './payout';
import { getPayoutDetails } from '../services/payoutDetailsService';
import { resolveSellerUserId } from '../services/sellerIdentity';

vi.mock('../services/payoutDetailsService', () => ({
    getPayoutDetails: vi.fn(),
}));

vi.mock('../services/sellerIdentity', () => ({
    resolveSellerUserId: vi.fn(),
}));

vi.mock('../http/redact', () => ({
    safeLogger: { info: vi.fn(), warn: vi.fn(), error: vi.fn() },
}));

describe('payoutOnRelease', () => {
    const originalTransfers = process.env.PAYSTACK_TRANSFERS_ENABLED;
    const originalSecret = process.env.PAYSTACK_SECRET_KEY;

    beforeEach(() => {
        vi.clearAllMocks();
        vi.mocked(resolveSellerUserId).mockResolvedValue('seller_user_1');
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_unit';
    });

    afterEach(() => {
        process.env.PAYSTACK_TRANSFERS_ENABLED = originalTransfers;
        process.env.PAYSTACK_SECRET_KEY = originalSecret;
        vi.unstubAllGlobals();
    });

    it('does not call /transfer when PAYSTACK_TRANSFERS_ENABLED is unset', async () => {
        delete process.env.PAYSTACK_TRANSFERS_ENABLED;
        const fetchImpl = vi.fn();
        vi.stubGlobal('fetch', fetchImpl);

        const result = await payoutOnRelease({
            orderId: 'pi_test',
            seller_id: 'biz_1',
            seller_user_id: null,
            itemPriceMinor: 1000,
        });

        expect(fetchImpl).not.toHaveBeenCalled();
        expect(getPayoutDetails).not.toHaveBeenCalled();
        expect(result).toMatchObject({
            status: 'pending',
            transferCode: '',
            payoutMinor: 900,
            commissionMinor: 100,
        });
    });

    it('does not call /transfer when PAYSTACK_TRANSFERS_ENABLED is not true', async () => {
        process.env.PAYSTACK_TRANSFERS_ENABLED = 'false';
        const fetchImpl = vi.fn();
        vi.stubGlobal('fetch', fetchImpl);

        await payoutOnRelease({
            orderId: 'pi_test',
            seller_id: 'biz_1',
            itemPriceMinor: 1000,
        });

        expect(fetchImpl).not.toHaveBeenCalled();
    });

    it('posts /transfer with an abort timeout when transfers are enabled', async () => {
        process.env.PAYSTACK_TRANSFERS_ENABLED = 'true';
        vi.mocked(getPayoutDetails).mockResolvedValue({
            id: 'rcp_row',
            sellerId: 'seller_user_1',
            type: 'mobile_money',
            label: 'M-Pesa •••• 1234',
            accountName: 'Chic Boutique',
            recipientCode: 'RCP_1',
            createdAt: '2026-09-04T00:00:00.000Z',
        });

        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            json: async () => ({
                status: true,
                data: { status: 'success', transfer_code: 'TRF_1' },
            }),
        });
        vi.stubGlobal('fetch', fetchImpl);

        const result = await payoutOnRelease({
            orderId: 'pi_test',
            seller_user_id: 'seller_user_1',
            itemPriceMinor: 1000,
        });

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://api.paystack.co/transfer',
            expect.objectContaining({
                method: 'POST',
                signal: expect.any(AbortSignal),
            })
        );
        expect(result.transferCode).toBe('TRF_1');
        expect(result.payoutMinor).toBe(900);
    });
});

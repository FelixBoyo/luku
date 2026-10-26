import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import {
    verifyPaystackTransaction,
    fetchPaystackCharge,
    resolvePaystackPayment,
} from './paystackVerify';

describe('paystackVerify', () => {
    const originalSecret = process.env.PAYSTACK_SECRET_KEY;

    beforeEach(() => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_unit';
    });

    afterEach(() => {
        process.env.PAYSTACK_SECRET_KEY = originalSecret;
        vi.unstubAllGlobals();
    });

    it('maps a successful transaction verify response', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: true,
                message: 'Verification successful',
                data: {
                    status: 'success',
                    reference: 'ref_1',
                    amount: 150000,
                    currency: 'KES',
                    channel: 'mobile_money',
                    paid_at: '2026-07-29T10:00:00.000Z',
                },
            }),
        });

        const result = await verifyPaystackTransaction('ref_1', fetchImpl as any);

        expect(fetchImpl).toHaveBeenCalledWith(
            'https://api.paystack.co/transaction/verify/ref_1',
            expect.objectContaining({ method: 'GET' })
        );
        expect(result).toMatchObject({
            reference: 'ref_1',
            status: 'success',
            amountMinor: 150000,
            currency: 'KES',
            channel: 'mobile_money',
            paidAt: '2026-07-29T10:00:00.000Z',
        });
    });

    it('normalizes charge interim statuses to pending', async () => {
        const fetchImpl = vi.fn().mockResolvedValue({
            ok: true,
            status: 200,
            json: async () => ({
                status: true,
                data: {
                    status: 'send_otp',
                    reference: 'ref_otp',
                    amount: 5000,
                    currency: 'KES',
                },
            }),
        });

        const result = await fetchPaystackCharge('ref_otp', fetchImpl as any);
        expect(result.status).toBe('pending');
    });

    it('falls back to charge GET when verify fails', async () => {
        const fetchImpl = vi
            .fn()
            .mockResolvedValueOnce({
                ok: false,
                status: 404,
                json: async () => ({ message: 'Transaction not found' }),
            })
            .mockResolvedValueOnce({
                ok: true,
                status: 200,
                json: async () => ({
                    status: true,
                    data: {
                        status: 'success',
                        reference: 'stk_ref',
                        amount: 2500,
                        currency: 'KES',
                    },
                }),
            });

        const result = await resolvePaystackPayment('stk_ref', fetchImpl as any);
        expect(result.status).toBe('success');
        expect(result.amountMinor).toBe(2500);
        expect(fetchImpl).toHaveBeenCalledTimes(2);
    });

    it('throws when PAYSTACK_SECRET_KEY is missing', async () => {
        delete process.env.PAYSTACK_SECRET_KEY;
        await expect(verifyPaystackTransaction('ref_1', vi.fn() as any)).rejects.toThrow(
            /PAYSTACK_SECRET_KEY/
        );
    });
});

import { describe, expect, it, vi } from 'vitest';
import { handleOrderWebhook } from './orders';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';
import { Request, Response } from 'express';

vi.mock('../../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

describe('orders webhook', () => {
    it('ignores invalid secrets', async () => {
        const req = {
            headers: { 'x-webhook-secret': 'wrong' },
            body: {},
            ip: '127.0.0.1'
        } as unknown as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        } as unknown as Response;
        
        process.env.WEBHOOK_SECRET = 'correct';
        await handleOrderWebhook(req, res);
        
        expect(res.status).toHaveBeenCalledWith(401);
    });

    it('inserts a notification on paid status', async () => {
        const insertMock = vi.fn().mockResolvedValue({ error: null });
        const fromMock = vi.fn().mockReturnValue({ insert: insertMock });
        vi.mocked(getSupabaseAdmin).mockReturnValue({ from: fromMock } as any);

        const req = {
            headers: { 'x-webhook-secret': 'test_secret' },
            body: {
                type: 'UPDATE',
                table: 'orders',
                record: {
                    id: '12345678-abcd',
                    buyer_id: 'buyer-uuid',
                    status: 'paid',
                },
                old_record: {
                    status: 'pending_payment'
                }
            }
        } as unknown as Request;
        const res = {
            status: vi.fn().mockReturnThis(),
            send: vi.fn(),
        } as unknown as Response;
        
        process.env.WEBHOOK_SECRET = 'test_secret';
        await handleOrderWebhook(req, res);
        
        expect(fromMock).toHaveBeenCalledWith('notifications');
        expect(insertMock).toHaveBeenCalledWith(expect.objectContaining({
            user_id: 'buyer-uuid',
            category: 'orders',
            title: 'Payment Confirmed',
            unread: true,
        }));
        expect(res.status).toHaveBeenCalledWith(200);
    });
});

import { describe, expect, it, vi } from 'vitest';
import { sendOrderTransitionError } from './orderTransitionError';
import { IllegalOrderTransitionError } from '../services/orderStateMachine';
import { PayoutDetailsRequiredError } from '../services/payoutDetailsService';
import { SupabaseFetchTimeoutError } from '../data/supabaseAdmin';

const mockRes = () => {
    const res: any = {};
    res.status = vi.fn(() => res);
    res.json = vi.fn(() => res);
    return res;
};

describe('sendOrderTransitionError', () => {
    it('maps IllegalOrderTransitionError to 409 CONFLICT', () => {
        const res = mockRes();
        sendOrderTransitionError(
            res,
            new IllegalOrderTransitionError('in_escrow', 'shipped')
        );

        expect(res.status).toHaveBeenCalledWith(409);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errorCode: 'CONFLICT',
                code: 409,
            })
        );
    });

    it('maps a wedged Supabase socket to 503 ESCROW_BACKEND_TIMEOUT', () => {
        const res = mockRes();
        sendOrderTransitionError(res, new SupabaseFetchTimeoutError());

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errorCode: 'ESCROW_BACKEND_TIMEOUT',
                code: 503,
            })
        );
    });

    it('maps a re-wrapped Supabase timeout message to 503', () => {
        const res = mockRes();
        sendOrderTransitionError(
            res,
            new Error('SupabaseFetchTimeoutError: Supabase request exceeded 10000ms')
        );

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ errorCode: 'ESCROW_BACKEND_TIMEOUT' })
        );
    });

    it('maps PayoutDetailsRequiredError to 400 PAYOUT_DETAILS_REQUIRED', () => {
        const res = mockRes();
        sendOrderTransitionError(res, new PayoutDetailsRequiredError());

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errorCode: 'PAYOUT_DETAILS_REQUIRED',
                code: 400,
            })
        );
    });
});

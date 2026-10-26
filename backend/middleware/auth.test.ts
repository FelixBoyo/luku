import { describe, expect, it, vi, beforeEach } from 'vitest';
import { AuthServiceUnavailableError } from '../data/supabaseAdmin';
import { verifyToken } from './auth';

vi.mock('../data/supabaseAdmin', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../data/supabaseAdmin')>();
    return {
        ...actual,
        getUserFromAccessToken: vi.fn(),
    };
});

import { getUserFromAccessToken } from '../data/supabaseAdmin';

const mockRes = () => {
    const res: any = {
        status: vi.fn(),
        json: vi.fn(),
        locals: {},
    };
    res.status.mockReturnValue(res);
    return res;
};

describe('verifyToken', () => {
    beforeEach(() => {
        vi.mocked(getUserFromAccessToken).mockReset();
    });

    it('returns 401 AUTH_UNAUTHORIZED when no bearer token is sent', async () => {
        const req: any = { headers: {} };
        const res = mockRes();
        const next = vi.fn();

        await verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ errorCode: 'AUTH_UNAUTHORIZED' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 401 AUTH_TOKEN_EXPIRED when GoTrue rejects the token', async () => {
        vi.mocked(getUserFromAccessToken).mockResolvedValue(null);
        const req: any = { headers: { authorization: 'Bearer stale' } };
        const res = mockRes();
        const next = vi.fn();

        await verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({ errorCode: 'AUTH_TOKEN_EXPIRED' })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('returns 503 AUTH_UNAVAILABLE when Supabase itself cannot be reached', async () => {
        vi.mocked(getUserFromAccessToken).mockRejectedValue(
            new AuthServiceUnavailableError('fetch failed')
        );
        const req: any = { headers: { authorization: 'Bearer ok' } };
        const res = mockRes();
        const next = vi.fn();

        await verifyToken(req, res, next);

        expect(res.status).toHaveBeenCalledWith(503);
        expect(res.json).toHaveBeenCalledWith(
            expect.objectContaining({
                errorCode: 'AUTH_UNAVAILABLE',
                message: "Can't reach the server, try again",
            })
        );
        expect(next).not.toHaveBeenCalled();
    });

    it('attaches the user and continues when the token is valid', async () => {
        vi.mocked(getUserFromAccessToken).mockResolvedValue({ id: 'user_1' } as any);
        const req: any = { headers: { authorization: 'Bearer good' } };
        const res = mockRes();
        const next = vi.fn();

        await verifyToken(req, res, next);

        expect(req.userId).toBe('user_1');
        expect(next).toHaveBeenCalledOnce();
    });
});

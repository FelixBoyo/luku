import { describe, expect, it, vi } from 'vitest';
import {
    getRequestId,
    REQUEST_ID_HEADER,
    requestIdMiddleware,
} from './request-id';

describe('request-id middleware', () => {
    it('returns provided x-request-id when present', () => {
        const req = {
            header: vi.fn().mockReturnValue('req_existing_123'),
        } as any;

        expect(getRequestId(req)).toBe('req_existing_123');
    });

    it('generates a request id when header is missing', () => {
        const req = {
            header: vi.fn().mockReturnValue(undefined),
        } as any;

        const requestId = getRequestId(req);
        expect(typeof requestId).toBe('string');
        expect(requestId.length).toBeGreaterThan(0);
    });

    it('sets request id on response locals and header', () => {
        const req = {
            header: vi.fn().mockReturnValue('req_passthrough_789'),
        } as any;
        const res = {
            locals: {},
            setHeader: vi.fn(),
        } as any;
        const next = vi.fn();

        requestIdMiddleware(req, res, next);

        expect(res.locals.requestId).toBe('req_passthrough_789');
        expect(res.setHeader).toHaveBeenCalledWith(
            REQUEST_ID_HEADER,
            'req_passthrough_789'
        );
        expect(next).toHaveBeenCalledTimes(1);
    });
});

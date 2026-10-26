import { describe, expect, it, vi } from 'vitest';
import { sendApiError } from './error';

interface MockResponse {
    status: ReturnType<typeof vi.fn>;
    json: ReturnType<typeof vi.fn>;
    locals: Record<string, unknown>;
}

const createMockResponse = (): MockResponse => {
    const response = {
        status: vi.fn(),
        json: vi.fn(),
        locals: {},
    } as MockResponse;

    response.status.mockReturnValue(response);
    return response;
};

describe('sendApiError', () => {
    it('returns code and message without details when absent', () => {
        const res = createMockResponse();

        sendApiError(res as any, 400, {
            code: 'VALIDATION_ERROR',
            message: 'Invalid request.',
        });

        expect(res.status).toHaveBeenCalledWith(400);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'VALIDATION_ERROR',
                message: 'Invalid request.',
            },
        });
    });

    it('returns details when provided', () => {
        const res = createMockResponse();

        sendApiError(res as any, 429, {
            code: 'RATE_LIMITED',
            message: 'Too many requests.',
            details: { windowMs: 60_000 },
        });

        expect(res.status).toHaveBeenCalledWith(429);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'RATE_LIMITED',
                message: 'Too many requests.',
                details: { windowMs: 60_000 },
            },
        });
    });

    it('propagates requestId from response locals when present', () => {
        const res = createMockResponse();
        res.locals.requestId = 'req_12345';

        sendApiError(res as any, 500, {
            code: 'INTERNAL_ERROR',
            message: 'Something went wrong.',
        });

        expect(res.status).toHaveBeenCalledWith(500);
        expect(res.json).toHaveBeenCalledWith({
            error: {
                code: 'INTERNAL_ERROR',
                message: 'Something went wrong.',
                requestId: 'req_12345',
            },
        });
    });
});

import { describe, expect, it } from 'vitest';
import { extractApiErrorFromBody, shouldClearSession } from '../src/api/extractApiError';

describe('extractApiErrorFromBody', () => {
    it('reads message from nested sendApiError shape', () => {
        const parsed = extractApiErrorFromBody(
            {
                error: {
                    code: 'MPESA_UNPROCESSED',
                    message:
                        "Payment couldn't be processed. In test mode use Paystack's test number (0710000000); real M-Pesa charges need live keys.",
                    requestId: 'req-abc-123',
                },
            },
            400,
        );

        expect(parsed.message).toContain('test mode');
        expect(parsed.message).not.toBe('[object Object]');
        expect(parsed.code).toBe('MPESA_UNPROCESSED');
        expect(parsed.requestId).toBe('req-abc-123');
    });

    it('reads message from flat ApiResponse error shape', () => {
        const parsed = extractApiErrorFromBody(
            {
                success: false,
                message: 'Validation failed',
                error: 'Validation failed',
                errorCode: 'VALIDATION_FAILED',
            },
            400,
        );

        expect(parsed.message).toBe('Validation failed');
        expect(parsed.code).toBe('VALIDATION_FAILED');
    });

    it('falls back when body has no message', () => {
        const parsed = extractApiErrorFromBody({}, 503);
        expect(parsed.message).toBe('Request failed: 503');
    });
});

describe('shouldClearSession', () => {
    it('clears only a genuine expired token', () => {
        expect(shouldClearSession(401, 'AUTH_TOKEN_EXPIRED')).toBe(true);
    });

    it('keeps the session through an outage or a missing-token 401', () => {
        expect(shouldClearSession(503, 'AUTH_UNAVAILABLE')).toBe(false);
        expect(shouldClearSession(401, 'AUTH_UNAUTHORIZED')).toBe(false);
        expect(shouldClearSession(401, null)).toBe(false);
        expect(shouldClearSession(200, 'AUTH_TOKEN_EXPIRED')).toBe(false);
    });
});

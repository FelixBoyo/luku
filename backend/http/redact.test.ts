import { describe, expect, it, vi, afterEach } from 'vitest';
import { safeLogger, sanitizeForLogs } from './redact';

describe('sanitizeForLogs', () => {
    it('redacts sensitive keys and masks phone/card-like strings', () => {
        const sanitized = sanitizeForLogs({
            authorization: 'Bearer abc',
            token: 'secret-token',
            phone: '+254712345678',
            card: '4242 4242 4242 4242',
            nested: {
                xPaystackSignature: 'abc123',
                body: '{"event":"charge.success"}',
            },
        }) as Record<string, unknown>;

        expect(sanitized.authorization).toBe('[REDACTED]');
        expect(sanitized.token).toBe('[REDACTED]');
        expect(sanitized.phone).toBe('[REDACTED_PHONE]');
        expect(sanitized.card).toBe('[REDACTED_CARD]');
        expect((sanitized.nested as Record<string, unknown>).body).toBe('[REDACTED_BODY]');
    });

    it('sanitizes error messages and preserves stack in non-production', () => {
        const err = new Error('Failed for +254700000000 with 4111111111111111');
        const sanitized = sanitizeForLogs(err) as Record<string, unknown>;

        expect(sanitized.name).toBe('Error');
        expect(sanitized.message).toContain('[REDACTED_PHONE]');
        expect(sanitized.message).toContain('[REDACTED_CARD]');
        if (process.env.NODE_ENV === 'production') {
            expect(sanitized).not.toHaveProperty('stack');
        } else {
            expect(sanitized).toHaveProperty('stack');
        }
    });

    it('preserves custom enumerable properties on Error instances', () => {
        class CustomErr extends Error {
            httpStatus = 400;
            paystackCode = 'invalid_phone';
        }
        const err = new CustomErr('bad request');
        const sanitized = sanitizeForLogs(err) as Record<string, unknown>;
        expect(sanitized.httpStatus).toBe(400);
        expect(sanitized.paystackCode).toBe('invalid_phone');
    });
});

describe('safeLogger', () => {
    afterEach(() => {
        vi.restoreAllMocks();
    });

    it('writes redacted payloads to console', () => {
        const spy = vi.spyOn(console, 'error').mockImplementation(() => {});

        safeLogger.error('payment failed', {
            apiKey: 'sk_live_123',
            body: '{"card":"4242 4242 4242 4242"}',
        });

        expect(spy).toHaveBeenCalledTimes(1);
        expect(spy).toHaveBeenCalledWith('payment failed', {
            apiKey: '[REDACTED]',
            body: '[REDACTED_BODY]',
        });
    });
});

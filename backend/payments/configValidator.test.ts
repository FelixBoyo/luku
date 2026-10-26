import { describe, expect, it } from 'vitest';
import { validatePaymentsEnvironment } from './configValidator';

describe('validatePaymentsEnvironment', () => {
    it('accepts consistent test mode keys', () => {
        const result = validatePaymentsEnvironment({
            PAYMENTS_ENV_MODE: 'test',
            PAYSTACK_SECRET_KEY: 'sk_test_123',
            STRIPE_SECRET_KEY: 'sk_test_456',
        });

        expect(result.mode).toBe('test');
    });

    it('rejects mixed test/live key modes', () => {
        expect(() =>
            validatePaymentsEnvironment({
                PAYSTACK_SECRET_KEY: 'sk_test_123',
                STRIPE_SECRET_KEY: 'sk_live_456',
            })
        ).toThrow('Mixed test/live provider keys detected');
    });

    it('rejects env mode mismatch with configured keys', () => {
        expect(() =>
            validatePaymentsEnvironment({
                PAYMENTS_ENV_MODE: 'live',
                PAYSTACK_SECRET_KEY: 'sk_test_123',
            })
        ).toThrow('does not match configured provider keys');
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';
import {
    createPaystackCharge,
    getPaystackCurrency,
    type PaystackChargeResponse,
} from '@/services/paystackService';

const fetchMock = vi.fn();

const makeJsonResponse = (body: unknown, ok = true, status = 200): Response =>
    ({
        ok,
        status,
        json: vi.fn().mockResolvedValue(body),
    } as unknown as Response);

const assertPaystackChargeShape = (value: PaystackChargeResponse) => {
    const keys = Object.keys(value).sort();
    expect(keys).toEqual(['authorizationUrl', 'message', 'reference', 'status'].sort());
    expect(['success', 'requires_action', 'failed']).toContain(value.status);
    expect(typeof value.reference).toBe('string');
    if (value.authorizationUrl !== undefined) {
        expect(typeof value.authorizationUrl).toBe('string');
    }
    if (value.message !== undefined) {
        expect(typeof value.message).toBe('string');
    }
};

describe('paystackService response contracts', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('returns stable charge response shape for successful charge', async () => {
        const payload = {
            status: 'success',
            reference: 'PS_REF_123',
            authorizationUrl: 'https://checkout.paystack.example/authorize',
            message: 'Charge initialized',
        };
        fetchMock.mockResolvedValueOnce(makeJsonResponse(payload));

        const result = await createPaystackCharge({
            amount: 1200,
            currency: 'KES',
            method: 'card',
            metadata: { orderId: 'order-1' },
        });

        assertPaystackChargeShape(result);
        expect(result).toEqual(payload);
    });

    it('fails contract when required response keys are missing', async () => {
        fetchMock.mockResolvedValueOnce(
            makeJsonResponse({
                status: 'success',
                authorizationUrl: 'https://checkout.paystack.example/authorize',
            })
        );

        const result = await createPaystackCharge({
            amount: 1200,
            currency: 'KES',
            method: 'card',
        });

        expect(() => assertPaystackChargeShape(result as PaystackChargeResponse)).toThrow();
    });

    it('returns configured default currency fallback', () => {
        expect(getPaystackCurrency()).toBeTypeOf('string');
    });
});

import { beforeEach, describe, expect, it, vi } from 'vitest';

vi.mock('@/services/integrationConfig', () => ({
    getIntegrationConfig: () => ({
        mpesa: { enabled: true },
    }),
}));

vi.mock('@/services/integrationManager', () => ({
    integrationManager: {
        recordRequest: vi.fn(),
    },
}));

vi.mock('@/services/errorLogger', () => ({
    errorLogger: {
        log: vi.fn(),
    },
}));

vi.mock('@/services/retryHandler', () => ({
    withRetry: async <T>(fn: () => Promise<T>) => fn(),
}));

import {
    getMpesaPaymentStatus,
    isMpesaAvailable,
    startMpesaCheckout,
    type MpesaCheckoutResponse,
    type MpesaStatusResponse,
} from '@/services/mpesaService';

const fetchMock = vi.fn();

const makeJsonResponse = (body: unknown, ok = true, status = 200): Response =>
    ({
        ok,
        status,
        json: vi.fn().mockResolvedValue(body),
    } as unknown as Response);

const assertMpesaCheckoutShape = (value: MpesaCheckoutResponse) => {
    const keys = Object.keys(value).sort();
    expect(keys).toEqual(['customerMessage', 'mpesaReference', 'paymentRequestId', 'status'].sort());
    expect(typeof value.paymentRequestId).toBe('string');
    expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).toContain(value.status);
};

const assertMpesaStatusShape = (value: MpesaStatusResponse) => {
    const keys = Object.keys(value).sort();
    expect(keys).toEqual(['customerMessage', 'mpesaReference', 'paymentRequestId', 'status'].sort());
    expect(typeof value.paymentRequestId).toBe('string');
    expect(['PENDING', 'PROCESSING', 'COMPLETED', 'FAILED', 'CANCELLED']).toContain(value.status);
};

describe('mpesaService response contracts', () => {
    beforeEach(() => {
        fetchMock.mockReset();
        vi.stubGlobal('fetch', fetchMock);
    });

    it('returns stable checkout response shape', async () => {
        const payload = {
            paymentRequestId: 'req_123',
            mpesaReference: 'MPESA_123',
            status: 'PENDING',
            customerMessage: 'STK sent',
        };

        fetchMock.mockResolvedValueOnce(makeJsonResponse(payload));

        const result = await startMpesaCheckout({
            amount: 2500,
            phoneNumber: '254712345678',
            accountReference: 'ORD-001',
        });

        assertMpesaCheckoutShape(result);
        expect(result).toEqual(payload);
    });

    it('returns stable status response shape', async () => {
        const payload = {
            paymentRequestId: 'req_123',
            mpesaReference: 'MPESA_123',
            status: 'COMPLETED',
            customerMessage: 'Payment confirmed',
        };

        fetchMock.mockResolvedValueOnce(makeJsonResponse(payload));

        const result = await getMpesaPaymentStatus('req_123');

        assertMpesaStatusShape(result);
        expect(result).toEqual(payload);
    });

    it('fails contract when mpesa checkout shape drifts', async () => {
        fetchMock.mockResolvedValueOnce(
            makeJsonResponse({
                status: 'PENDING',
                customerMessage: 'STK sent',
            })
        );

        const result = await startMpesaCheckout({
            amount: 2500,
            phoneNumber: '254712345678',
        });

        expect(() => assertMpesaCheckoutShape(result as MpesaCheckoutResponse)).toThrow();
    });

    it('reports mpesa availability as boolean', () => {
        expect(typeof isMpesaAvailable()).toBe('boolean');
    });
});

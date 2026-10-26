import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getPaystackMpesaStatus } from './status';

const ORIGINAL_SECRET = process.env.PAYSTACK_SECRET_KEY;

const makeFetchResponse = (
    body: unknown,
    ok = true,
    status = 200,
): Response =>
    ({
        ok,
        status,
        json: vi.fn().mockResolvedValue(body),
        headers: { get: vi.fn().mockReturnValue(null) },
    }) as unknown as Response;

describe('getPaystackMpesaStatus', () => {
    beforeEach(() => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_for_unit_tests';
    });

    afterEach(() => {
        process.env.PAYSTACK_SECRET_KEY = ORIGINAL_SECRET;
        vi.restoreAllMocks();
    });

    it('throws when secret key is missing', async () => {
        delete process.env.PAYSTACK_SECRET_KEY;
        await expect(getPaystackMpesaStatus('req_1')).rejects.toThrow(
            /secret key is not configured/i,
        );
    });

    it('throws when payment request id is empty', async () => {
        await expect(getPaystackMpesaStatus('')).rejects.toThrow(
            /payment request id is required/i,
        );
    });

    it.each([
        ['success', 'COMPLETED'],
        ['pending', 'PENDING'],
        ['failed', 'FAILED'],
        ['pay_offline', 'PROCESSING'],
        ['send_otp', 'PROCESSING'],
        ['unknown', 'PROCESSING'],
    ])(
        'maps Paystack charge status "%s" to "%s" and returns the documented shape',
        async (paystackStatus, mappedStatus) => {
            vi.stubGlobal(
                'fetch',
                vi.fn().mockResolvedValueOnce(
                    makeFetchResponse({
                        status: true,
                        data: {
                            status: paystackStatus,
                            reference: 'ps_ref_42',
                            gateway_response: 'Approved',
                        },
                    }),
                ),
            );

            const result = await getPaystackMpesaStatus('ps_ref_42');

            expect(Object.keys(result).sort()).toEqual(
                [
                    'paymentRequestId',
                    'status',
                    'mpesaReference',
                    'customerMessage',
                ].sort(),
            );
            expect(result.paymentRequestId).toBe('ps_ref_42');
            expect(result.status).toBe(mappedStatus);
            expect(result.mpesaReference).toBe('ps_ref_42');
            expect(typeof result.customerMessage).toBe('string');
        },
    );

    it('surfaces upstream Paystack error message on non-2xx', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce(
                makeFetchResponse(
                    { message: 'Charge not found', code: 'not_found' },
                    false,
                    404,
                ),
            ),
        );

        await expect(getPaystackMpesaStatus('missing_ref')).rejects.toThrow(
            /charge not found/i,
        );
    });

    it('logs paystack_rejected with httpStatus on non-2xx', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce(
                makeFetchResponse(
                    { message: 'Charge not found', code: 'not_found' },
                    false,
                    404,
                ),
            ),
        );

        const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(getPaystackMpesaStatus('missing_ref')).rejects.toThrow(/charge not found/i);

        const rejectedCall = logSpy.mock.calls.find(
            (call) => call[0] === 'Get Paystack M-Pesa status rejected',
        );
        expect(rejectedCall).toBeDefined();
        const context = rejectedCall?.[1] as Record<string, unknown>;
        expect(context?.errorCategory).toBe('paystack_rejected');
        expect(context?.httpStatus).toBe(404);

        logSpy.mockRestore();
    });

    it('throws on malformed Paystack body', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce(
                makeFetchResponse({ status: false, data: null }),
            ),
        );

        await expect(getPaystackMpesaStatus('ps_ref_42')).rejects.toThrow(
            /invalid response from paystack/i,
        );
    });

    it('uses the charge endpoint with bearer auth', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(
            makeFetchResponse({
                status: true,
                data: {
                    status: 'success',
                    reference: 'ps_ref_42',
                    gateway_response: 'OK',
                },
            }),
        );
        vi.stubGlobal('fetch', fetchMock);

        await getPaystackMpesaStatus('ps_ref_42');

        const [url, init] = fetchMock.mock.calls[0];
        expect(url).toMatch(
            /^https:\/\/api\.paystack\.co\/charge\/ps_ref_42$/,
        );
        expect(init.headers.Authorization).toMatch(/^Bearer /);
    });
});

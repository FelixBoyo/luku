import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { PaystackChargeError } from './errors';
import { startPaystackMpesaCheckout } from './stk-push';

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

describe('startPaystackMpesaCheckout', () => {
    beforeEach(() => {
        process.env.PAYSTACK_SECRET_KEY = 'sk_test_for_unit_tests';
    });

    afterEach(() => {
        process.env.PAYSTACK_SECRET_KEY = ORIGINAL_SECRET;
        vi.restoreAllMocks();
    });

    it('throws when secret key is missing', async () => {
        delete process.env.PAYSTACK_SECRET_KEY;

        await expect(
            startPaystackMpesaCheckout({
                amount: 1000,
                phoneNumber: '254712345678',
                metadata: { email: 'buyer@example.com' },
            })
        ).rejects.toThrow(/secret key is not configured/i);
    });

    it('rejects non-positive amount', async () => {
        await expect(
            startPaystackMpesaCheckout({
                amount: 0,
                phoneNumber: '254712345678',
                metadata: { email: 'buyer@example.com' },
            })
        ).rejects.toThrow(/positive number/i);
    });

    it('rejects malformed phone number', async () => {
        await expect(
            startPaystackMpesaCheckout({
                amount: 1000,
                phoneNumber: '12',
                metadata: { email: 'buyer@example.com' },
            })
        ).rejects.toThrow(/Kenyan M-Pesa number/i);
    });

    it('rejects when email metadata is missing', async () => {
        await expect(
            startPaystackMpesaCheckout({
                amount: 1000,
                phoneNumber: '254712345678',
            })
        ).rejects.toThrow(/email address/i);
    });

    it('returns the documented MpesaStkPushResponse shape on success', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(
            makeFetchResponse({
                status: true,
                data: {
                    reference: 'ps_ref_123',
                    status: 'pay_offline',
                },
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        const result = await startPaystackMpesaCheckout({
            amount: 1000,
            phoneNumber: '0712345678',
            accountReference: 'ORD-1',
            metadata: { email: 'buyer@example.com' },
        });

        expect(Object.keys(result).sort()).toEqual(
            [
                'paymentRequestId',
                'mpesaReference',
                'status',
                'customerMessage',
            ].sort()
        );
        expect(result.paymentRequestId).toBe('ps_ref_123');
        expect(result.mpesaReference).toBe('ps_ref_123');
        expect(result.status).toBe('PENDING');
        expect(typeof result.customerMessage).toBe('string');
        expect(fetchMock).toHaveBeenCalledTimes(1);
        const [url] = fetchMock.mock.calls[0];
        expect(url).toBe('https://api.paystack.co/charge');
    });

    it('formats Kenyan numbers without country code into 2547XXXXXXXX', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(
            makeFetchResponse({
                status: true,
                data: { reference: 'ps_ref', status: 'pay_offline' },
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        await startPaystackMpesaCheckout({
            amount: 100,
            phoneNumber: '0712345678',
            metadata: { email: 'buyer@example.com' },
        });

        const [, init] = fetchMock.mock.calls[0];
        const sentBody = JSON.parse(init.body);
        expect(sentBody.mobile_money.phone).toBe('+254712345678');
    });

    it('sends E.164 plus prefix to Paystack mobile_money.phone', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(
            makeFetchResponse({
                status: true,
                data: { reference: 'ps_ref', status: 'pay_offline' },
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        await startPaystackMpesaCheckout({
            amount: 100,
            phoneNumber: '254712345678',
            metadata: { email: 'buyer@example.com' },
        });

        const [, init] = fetchMock.mock.calls[0];
        const sentBody = JSON.parse(init.body);
        expect(sentBody.mobile_money.phone).toMatch(/^\+254[17]\d{8}$/);
    });

    it('normalizes 2540XXXXXXXX duplicate country prefix before Paystack', async () => {
        const fetchMock = vi.fn().mockResolvedValueOnce(
            makeFetchResponse({
                status: true,
                data: { reference: 'ps_ref', status: 'pay_offline' },
            })
        );
        vi.stubGlobal('fetch', fetchMock);

        await startPaystackMpesaCheckout({
            amount: 100,
            phoneNumber: '2540712345678',
            metadata: { email: 'buyer@example.com' },
        });

        const [, init] = fetchMock.mock.calls[0];
        const sentBody = JSON.parse(init.body);
        expect(sentBody.mobile_money.phone).toBe('+254712345678');
    });

    it('does not call Paystack when phone fails local validation', async () => {
        const fetchMock = vi.fn();
        vi.stubGlobal('fetch', fetchMock);

        await expect(
            startPaystackMpesaCheckout({
                amount: 1000,
                phoneNumber: '254212345678',
                metadata: { email: 'buyer@example.com' },
            })
        ).rejects.toThrow(/Kenyan M-Pesa number/i);

        expect(fetchMock).not.toHaveBeenCalled();
    });

    it('surfaces upstream Paystack error message on non-2xx', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce(
                makeFetchResponse(
                    { message: 'Invalid phone number', code: 'invalid_phone' },
                    false,
                    400,
                ),
            ),
        );

        await expect(
            startPaystackMpesaCheckout({
                amount: 1000,
                phoneNumber: '254712345678',
                metadata: { email: 'buyer@example.com' },
            }),
        ).rejects.toThrow(/invalid phone number/i);
    });

    it('logs paystack_rejected with httpStatus on non-2xx', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce(
                makeFetchResponse(
                    { message: 'Invalid phone number', code: 'invalid_phone' },
                    false,
                    400,
                ),
            ),
        );

        const logSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

        await expect(
            startPaystackMpesaCheckout({
                amount: 1000,
                phoneNumber: '254712345678',
                metadata: { email: 'buyer@example.com' },
            }),
        ).rejects.toThrow(/invalid phone number/i);

        const rejectedCall = logSpy.mock.calls.find(
            (call) => call[0] === 'Paystack M-Pesa STK push rejected',
        );
        expect(rejectedCall).toBeDefined();
        const context = rejectedCall?.[1] as Record<string, unknown>;
        expect(context?.errorCategory).toBe('paystack_rejected');
        expect(context?.httpStatus).toBe(400);
        const loggedError = context?.error as PaystackChargeError;
        expect(loggedError?.paystackCode).toBe('invalid_phone');

        logSpy.mockRestore();
    });

    it('throws on malformed Paystack body', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn().mockResolvedValueOnce(
                makeFetchResponse({ status: false, data: null })
            )
        );

        await expect(
            startPaystackMpesaCheckout({
                amount: 1000,
                phoneNumber: '254712345678',
                metadata: { email: 'buyer@example.com' },
            })
        ).rejects.toThrow(/invalid response from paystack/i);
    });
});

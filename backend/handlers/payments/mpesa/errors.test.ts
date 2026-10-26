import { describe, expect, it } from 'vitest';
import { PaystackChargeError, mapPaystackMpesaStkPushError } from './errors';

describe('mapPaystackMpesaStkPushError', () => {
    it('maps unprocessed_transaction to MPESA_UNPROCESSED, not invalid phone', () => {
        const error = new PaystackChargeError(
            'Charge attempted',
            400,
            'unprocessed_transaction',
            'api_error',
        );

        const mapped = mapPaystackMpesaStkPushError(error);

        expect(mapped.code).toBe('MPESA_UNPROCESSED');
        expect(mapped.code).not.toBe('MPESA_INVALID_PHONE');
        expect(mapped.httpStatus).toBe(400);
        expect(mapped.message).toMatch(/test mode/i);
    });

    it('maps invalid phone Paystack codes to MPESA_INVALID_PHONE', () => {
        const error = new PaystackChargeError(
            'Invalid phone number format',
            400,
            'invalid_params',
            'validation_error',
        );

        const mapped = mapPaystackMpesaStkPushError(error);

        expect(mapped.code).toBe('MPESA_INVALID_PHONE');
    });
});

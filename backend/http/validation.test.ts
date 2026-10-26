import { describe, expect, it } from 'vitest';
import {
    RequestValidationError,
    validateCreateOrderBody,
    validateMpesaStatusParams,
    validateMpesaStkPushBody,
    validatePaystackChargeBody,
} from './validation';

describe('payment request validation', () => {
    it('accepts a valid paystack charge body', () => {
        const result = validatePaystackChargeBody({
            amount: 25,
            currency: 'USD',
            method: 'card',
            metadata: {
                email: 'buyer@example.com',
            },
        });

        expect(result.method).toBe('card');
    });

    it('rejects paystack charge body with invalid fields', () => {
        expect(() =>
            validatePaystackChargeBody({
                amount: 0,
                method: 'cash',
                metadata: { email: 'bad-email' },
            })
        ).toThrow(RequestValidationError);
    });

    it('accepts a valid mpesa stk push body', () => {
        const result = validateMpesaStkPushBody({
            amount: 1200,
            phoneNumber: '0712345678',
            metadata: {
                email: 'buyer@example.com',
            },
        });

        expect(result.phoneNumber).toBe('0712345678');
    });

    it('rejects mpesa stk push body when phone or metadata email is invalid', () => {
        expect(() =>
            validateMpesaStkPushBody({
                amount: 500,
                phoneNumber: '123',
                metadata: {
                    email: 'invalid',
                },
            })
        ).toThrow(RequestValidationError);

        expect(() =>
            validateMpesaStkPushBody({
                amount: 500,
                phoneNumber: '254212345678',
                metadata: {
                    email: 'buyer@example.com',
                },
            })
        ).toThrow(RequestValidationError);
    });

    it('accepts mpesa phone with 2540 prefix after normalization', () => {
        const result = validateMpesaStkPushBody({
            amount: 500,
            phoneNumber: '2540712345678',
            metadata: { email: 'buyer@example.com' },
        });
        expect(result.phoneNumber).toBe('2540712345678');
    });

    it('accepts valid mpesa status params', () => {
        expect(validateMpesaStatusParams({ id: 'abc123' })).toEqual({ id: 'abc123' });
    });

    it('rejects empty mpesa status params id', () => {
        expect(() => validateMpesaStatusParams({ id: '' })).toThrow(RequestValidationError);
    });
});

describe('validateCreateOrderBody', () => {
    const shippingAddress = {
        name: 'Jane Doe',
        street: '123 Main St',
        city: 'Nairobi',
        postal: '00100',
        phone: '+254700000000',
    };

    const detailsOf = (body: unknown): string[] => {
        try {
            validateCreateOrderBody(body);
            return [];
        } catch (error) {
            return (error as RequestValidationError).details.map((d) => d.field);
        }
    };

    it('accepts a catalog order', () => {
        const result = validateCreateOrderBody({
            paymentReference: 'ref_123',
            shippingAddress,
            items: [{ productId: 'prod_1', quantity: 2 }],
        });

        expect(result.paymentReference).toBe('ref_123');
        expect(result.items).toHaveLength(1);
    });

    it('accepts a peer listing order', () => {
        const result = validateCreateOrderBody({
            paymentReference: 'ref_123',
            shippingAddress,
            items: [{ listingId: 'listing_1', quantity: 1 }],
        });

        expect(result.items[0].listingId).toBe('listing_1');
    });

    it('normalizes the deprecated stripePaymentIntentId into paymentReference', () => {
        const result = validateCreateOrderBody({
            stripePaymentIntentId: '  ref_old  ',
            shippingAddress,
            items: [{ productId: 'prod_1', quantity: 1 }],
        });

        expect(result.paymentReference).toBe('ref_old');
    });

    it('rejects a missing payment reference', () => {
        expect(
            detailsOf({
                shippingAddress,
                items: [{ productId: 'prod_1', quantity: 1 }],
            })
        ).toContain('paymentReference');
    });

    it('rejects an item with both productId and listingId', () => {
        expect(
            detailsOf({
                paymentReference: 'ref_123',
                shippingAddress,
                items: [{ productId: 'prod_1', listingId: 'listing_1', quantity: 1 }],
            })
        ).toContain('items[0]');
    });

    it('rejects an item with neither productId nor listingId', () => {
        expect(
            detailsOf({
                paymentReference: 'ref_123',
                shippingAddress,
                items: [{ quantity: 1 }],
            })
        ).toContain('items[0]');
    });

    it('rejects a non-positive or fractional quantity', () => {
        expect(
            detailsOf({
                paymentReference: 'ref_123',
                shippingAddress,
                items: [{ productId: 'prod_1', quantity: 0 }],
            })
        ).toContain('items[0].quantity');

        expect(
            detailsOf({
                paymentReference: 'ref_123',
                shippingAddress,
                items: [{ productId: 'prod_1', quantity: 1.5 }],
            })
        ).toContain('items[0].quantity');
    });

    it('rejects a missing shipping address and empty item list', () => {
        const fields = detailsOf({ paymentReference: 'ref_123', items: [] });

        expect(fields).toContain('shippingAddress');
        expect(fields).toContain('items');
    });

    it('reports the offending index for the second item', () => {
        expect(
            detailsOf({
                paymentReference: 'ref_123',
                shippingAddress,
                items: [
                    { productId: 'prod_1', quantity: 1 },
                    { productId: 'prod_2', listingId: 'listing_2', quantity: 1 },
                ],
            })
        ).toContain('items[1]');
    });

    it('rejects a non-object body', () => {
        expect(() => validateCreateOrderBody('nope')).toThrow(RequestValidationError);
    });
});

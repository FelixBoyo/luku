import { describe, it, expect } from 'vitest';
import {
    isValidUUID,
    isValidEmail,
    validateProductData,
    validateOrderData,
    getValidationErrorMessage,
    isValidOrderStatus,
    formatKenyaMpesaPhoneForPaystack,
    isValidKenyaMpesaPhoneForPaystack,
    parseKenyaMpesaPhoneForPaystack,
    toPaystackKenyaMpesaChargePhone,
} from './validation';

describe('@core/validation', () => {
    it('isValidUUID accepts canonical lowercase UUID', () => {
        expect(isValidUUID('550e8400-e29b-41d4-a716-446655440000')).toBe(true);
    });

    it('isValidUUID rejects non-UUID strings', () => {
        expect(isValidUUID('not-a-uuid')).toBe(false);
    });

    it('isValidEmail performs basic shape check', () => {
        expect(isValidEmail('a@b.co')).toBe(true);
        expect(isValidEmail('bad')).toBe(false);
    });

    it('isValidOrderStatus narrows escrow statuses', () => {
        expect(isValidOrderStatus('shipped')).toBe(true);
        expect(isValidOrderStatus('pending_payment')).toBe(true);
        expect(isValidOrderStatus('in_escrow')).toBe(true);
        expect(isValidOrderStatus('released')).toBe(true);
        expect(isValidOrderStatus('disputed')).toBe(true);
        expect(isValidOrderStatus('unknown')).toBe(false);
    });

    it('isValidOrderStatus rejects the pre-escrow statuses', () => {
        expect(isValidOrderStatus('pending')).toBe(false);
        expect(isValidOrderStatus('confirmed')).toBe(false);
    });

    it('validateProductData returns errors for empty payload', () => {
        const { isValid, errors } = validateProductData({});
        expect(isValid).toBe(false);
        expect(errors.name).toBeDefined();
        expect(errors.price).toBeDefined();
    });

    const validShippingAddress = {
        street: '1 Main',
        city: 'Nairobi',
        zipCode: '00100',
        country: 'KE',
    };

    it('validateOrderData requires UUID product_id', () => {
        const { isValid, errors } = validateOrderData({
            product_id: 'x',
            quantity: 1,
            shipping_address: validShippingAddress,
            payment_reference: 'ref_123',
        });
        expect(isValid).toBe(false);
        expect(errors.product_id).toBeDefined();
    });

    it('validateOrderData requires a payment reference', () => {
        const { isValid, errors } = validateOrderData({
            product_id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
            quantity: 1,
            shipping_address: validShippingAddress,
        });
        expect(isValid).toBe(false);
        expect(errors.payment_reference).toBeDefined();
    });

    it('validateOrderData accepts the deprecated stripe_payment_intent_id alias', () => {
        const { isValid } = validateOrderData({
            product_id: '3f2504e0-4f89-11d3-9a0c-0305e82c3301',
            quantity: 1,
            shipping_address: validShippingAddress,
            stripe_payment_intent_id: 'pi_123',
        });
        expect(isValid).toBe(true);
    });

    it('getValidationErrorMessage aggregates messages', () => {
        expect(getValidationErrorMessage({ a: 'one', b: 'two' })).toContain('one');
        expect(getValidationErrorMessage({})).toBe('Validation failed');
    });

    describe('Kenya M-Pesa phone for Paystack', () => {
        it('formats local 07XXXXXXXX to 2547XXXXXXXX', () => {
            expect(formatKenyaMpesaPhoneForPaystack('0712345678')).toBe('254712345678');
            expect(isValidKenyaMpesaPhoneForPaystack('254712345678')).toBe(true);
        });

        it('keeps valid 2547XXXXXXXX', () => {
            expect(formatKenyaMpesaPhoneForPaystack('254712345678')).toBe('254712345678');
        });

        it('fixes 2540XXXXXXXX duplicate prefix', () => {
            expect(formatKenyaMpesaPhoneForPaystack('2540712345678')).toBe('254712345678');
        });

        it('rejects invalid prefix after 254', () => {
            expect(isValidKenyaMpesaPhoneForPaystack('254212345678')).toBe(false);
            expect(parseKenyaMpesaPhoneForPaystack('254212345678')).toBeNull();
        });

        it('rejects too-short numbers', () => {
            expect(parseKenyaMpesaPhoneForPaystack('0712345')).toBeNull();
        });

        it('formats Paystack Charge API phone as E.164 with plus', () => {
            expect(toPaystackKenyaMpesaChargePhone('254712345678')).toBe('+254712345678');
        });
    });
});

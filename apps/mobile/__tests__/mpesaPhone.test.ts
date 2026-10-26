import { describe, expect, it } from 'vitest';
import {
    getMpesaPhoneValidationError,
    isMpesaPhoneValidForCheckout,
} from '../src/lib/mpesaPhone';

describe('mpesaPhone checkout validation', () => {
    it('accepts local Safaricom format', () => {
        expect(isMpesaPhoneValidForCheckout('0712345678')).toBe(true);
        expect(getMpesaPhoneValidationError('0712345678')).toBeNull();
    });

    it('accepts 2547 format', () => {
        expect(isMpesaPhoneValidForCheckout('254712345678')).toBe(true);
    });

    it('accepts 2540 duplicate prefix after normalization', () => {
        expect(isMpesaPhoneValidForCheckout('2540712345678')).toBe(true);
    });

    it('rejects invalid prefix', () => {
        expect(isMpesaPhoneValidForCheckout('254212345678')).toBe(false);
        expect(getMpesaPhoneValidationError('254212345678')).toMatch(/Kenyan M-Pesa/i);
    });

    it('requires non-empty input', () => {
        expect(getMpesaPhoneValidationError('')).toMatch(/Enter your M-Pesa/i);
    });
});

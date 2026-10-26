import {
    KENYA_MPESA_PHONE_VALIDATION_MESSAGE,
    parseKenyaMpesaPhoneForPaystack,
} from '@core/validation';

/** Returns a user-facing error, or null when the number is valid for Paystack M-Pesa. */
export const getMpesaPhoneValidationError = (raw: string): string | null => {
    const trimmed = raw.trim();
    if (trimmed.length === 0) {
        return 'Enter your M-Pesa phone number.';
    }
    if (parseKenyaMpesaPhoneForPaystack(trimmed)) {
        return null;
    }
    return KENYA_MPESA_PHONE_VALIDATION_MESSAGE;
};

export const isMpesaPhoneValidForCheckout = (raw: string): boolean =>
    getMpesaPhoneValidationError(raw) === null;

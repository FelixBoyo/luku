const EXPIRY_REGEX = /^(0[1-9]|1[0-2])\/\d{2}$/;

export const isCardNumberValidForCheckout = (raw: string): boolean =>
    raw.replace(/\D/g, '').length >= 15;

export const isCardExpiryValidForCheckout = (raw: string): boolean => EXPIRY_REGEX.test(raw.trim());

export const isCardCvvValidForCheckout = (raw: string): boolean => /^\d{3,4}$/.test(raw.trim());

export const isCardCheckoutReady = (
    cardNumber: string,
    expiry: string,
    cvv: string,
    hasCheckoutEmail: boolean,
): boolean =>
    hasCheckoutEmail &&
    isCardNumberValidForCheckout(cardNumber) &&
    isCardExpiryValidForCheckout(expiry) &&
    isCardCvvValidForCheckout(cvv);

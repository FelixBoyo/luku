/**
 * ADR D9 — single-seller checkout. Catalog and peer sellers use different ID
 * spaces, so keys are namespaced before comparison.
 */

export const MULTI_SELLER_ERROR_CODE = 'MULTI_SELLER_NOT_ALLOWED' as const;

export const MULTI_SELLER_ERROR_MESSAGE =
    'Checkout is limited to one seller. Remove items from other sellers to continue.';

export class SingleSellerViolationError extends Error {
    readonly code = MULTI_SELLER_ERROR_CODE;

    constructor(message = MULTI_SELLER_ERROR_MESSAGE) {
        super(message);
        this.name = 'SingleSellerViolationError';
    }
}

export const sellerKeyFromProduct = (businessId: string): string =>
    `business:${businessId}`;

export const sellerKeyFromListing = (sellerUserId: string): string =>
    `peer:${sellerUserId}`;

/**
 * Requires every line to resolve to the same seller key.
 * Empty input is a no-op (callers validate "at least one item" separately).
 */
export const assertSingleSeller = (keys: string[]): void => {
    if (keys.length === 0) {
        return;
    }

    const unique = new Set(keys);
    if (unique.size > 1) {
        throw new SingleSellerViolationError();
    }
};

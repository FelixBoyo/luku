/**
 * Catalog self-purchase is not rejected by `create_escrow_order` (that RPC
 * only blocks peer listings). App-layer checks in cart + createOrder own this.
 */

export const CANNOT_BUY_OWN_ITEM_CODE = 'CANNOT_BUY_OWN_ITEM' as const;

export const CANNOT_BUY_OWN_ITEM_MESSAGE = 'You cannot buy your own item.';

export class CannotBuyOwnItemError extends Error {
    readonly code = CANNOT_BUY_OWN_ITEM_CODE;

    constructor(message = CANNOT_BUY_OWN_ITEM_MESSAGE) {
        super(message);
        this.name = 'CannotBuyOwnItemError';
    }
}

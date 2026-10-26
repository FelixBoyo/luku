/**
 * Pricing constants shared by the BFF and the mobile app.
 *
 * The rate lives here rather than in `escrowPolicy` alone because the cart
 * needs it to show the buyer a total before any server call. The server may
 * override it via `ESCROW_VAT_RATE`; if it ever does, the client figure
 * becomes an estimate and Paystack Verify remains the authority on what was
 * actually captured.
 */

/** Kenyan VAT, applied to the line-item subtotal at checkout. */
export const VAT_RATE = 0.16;

/** Subtotal in the same units in, VAT in the same units out, rounded to a whole unit. */
export const calculateVat = (subtotal: number, rate: number = VAT_RATE): number =>
    Math.round(subtotal * rate);

/**
 * Paystack wraps every response in `{ status, message, data }`. `Response.json()`
 * resolves to `unknown`, so call sites declare the `data` shape they rely on.
 */
export type PaystackEnvelope<T> = {
    status?: boolean;
    message?: string;
    data?: T;
};

/**
 * Reads a Paystack response body. A body that is missing or not JSON yields an
 * empty envelope rather than throwing, so callers can fall back to the HTTP status.
 */
export const readPaystackJson = async <T>(
    response: Response
): Promise<PaystackEnvelope<T>> =>
    (await response.json().catch(() => ({}))) as PaystackEnvelope<T>;

export type PaystackChargeMethod = 'card' | 'apple_pay';

export interface PaystackChargeRequest {
    amount: number;
    currency: string;
    method: PaystackChargeMethod;
    metadata?: Record<string, string>;
}

export interface PaystackChargeResponse {
    status: 'success' | 'requires_action' | 'failed';
    reference: string;
    authorizationUrl?: string;
    message?: string;
}

/**
 * Get the default currency for Paystack payments from environment variables.
 * Supports: USD, NGN, KES, ZAR, GHS
 */
export const getPaystackCurrency = (): string => {
    const env = (import.meta as any).env;
    return env?.VITE_PAYSTACK_DEFAULT_CURRENCY || 'USD';
};

/**
 * Create a Paystack charge by calling backend proxy endpoint.
 *
 * The backend proxy securely handles Paystack API calls using secret key.
 * Reference: https://paystack.com/docs/api/transaction#initialize
 */
export const createPaystackCharge = async (
    payload: PaystackChargeRequest
): Promise<PaystackChargeResponse> => {
    const { amount, currency, method, metadata = {} } = payload;

    // Validate amount
    if (!amount || amount <= 0) {
        throw new Error('Amount must be a positive number.');
    }

    // Get API base URL from environment (for production) or use relative URL (for dev with proxy)
    const env = (import.meta as any).env;
    const apiBaseUrl = env?.VITE_API_BASE_URL || '';

    try {
        // Call backend proxy endpoint
        const response = await fetch(`${apiBaseUrl}/api/payments/paystack/charges`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount,
                currency,
                method,
                metadata,
            }),
        });

        if (!response.ok) {
            let message = `Failed to start Paystack payment (status ${response.status})`;
            try {
                const errorBody = await response.json();
                if (errorBody?.error?.message) {
                    message = errorBody.error.message;
                } else if (errorBody?.message) {
                    message = errorBody.message;
                }
            } catch {
                // ignore JSON parse errors, keep default message
            }

            throw new Error(message);
        }

        const result = await response.json();

        // Backend returns PaystackChargeResponse format
        return result;
    } catch (error: any) {
        let errorMessage = 'There was a problem processing your Paystack payment.';
        if (error.message?.includes('insufficient')) {
            errorMessage =
                'Insufficient funds. Please check your account balance.';
        } else if (error.message?.includes('card')) {
            errorMessage =
                'Card payment failed. Please try a different card or payment method.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};


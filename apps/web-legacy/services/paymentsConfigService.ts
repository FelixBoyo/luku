export interface PaymentsConfig {
    stripe?: {
        cards?: boolean;
    };
    paystack?: {
        cards?: boolean;
        applePay?: boolean;
        mpesa?: boolean;
    };
}

/**
 * Fetch available payment methods configuration.
 *
 * Primary method: Reads from environment variables (frontend-only approach).
 * Optional: Can also fetch from backend endpoint if available.
 *
 * Backend endpoint contract (optional):
 *   GET /api/payments/config
 *
 * Example response:
 * {
 *   "stripe": { "cards": true },
 *   "paystack": { "cards": true, "applePay": true, "mpesa": true }
 * }
 */
export const fetchPaymentsConfig = async (): Promise<PaymentsConfig> => {
    const env = (import.meta as any).env;

    // Primary method: Use environment variables (works without backend)
    const configFromEnv: PaymentsConfig = {
        stripe: {
            cards: !!(env?.VITE_STRIPE_PUBLISHABLE_KEY),
        },
        paystack: {
            cards: env?.VITE_PAYSTACK_ENABLE_CARDS === 'true',
            applePay: env?.VITE_PAYSTACK_ENABLE_APPLE_PAY === 'true',
            mpesa: env?.VITE_PAYSTACK_ENABLE_MPESA === 'true',
        },
    };

    // Only return paystack config if at least one method is enabled
    if (
        !configFromEnv.paystack?.cards &&
        !configFromEnv.paystack?.applePay &&
        !configFromEnv.paystack?.mpesa
    ) {
        delete configFromEnv.paystack;
    }

    // Optional: Try to fetch from backend if available (for dynamic configuration)
    // If backend is not available, we'll use env vars (already configured above)
    try {
        const response = await fetch('/api/payments/config', {
            method: 'GET',
            headers: {
                'Content-Type': 'application/json',
            },
        });

        if (response.ok) {
            const backendConfig = (await response.json()) as PaymentsConfig;
            // Merge backend config with env vars (backend takes precedence if available)
            return {
                stripe: backendConfig.stripe || configFromEnv.stripe,
                paystack: backendConfig.paystack || configFromEnv.paystack,
            };
        }
    } catch {
        // Backend unavailable, use env vars (already configured)
        if ((import.meta as any).env?.DEV) {
            console.log(
                '[PaymentsConfig] Using environment variables for payment configuration'
            );
        }
    }

    return configFromEnv;
};


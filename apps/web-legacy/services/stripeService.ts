/**
 * Stripe Payment Service
 * Complete integration with Stripe for payment processing
 */

import { loadStripe, Stripe, StripeElements } from '@stripe/stripe-js';
import { getIntegrationConfig } from './integrationConfig';
import { integrationManager } from './integrationManager';
import { errorLogger } from './errorLogger';
import { withRetry } from './retryHandler';

const config = getIntegrationConfig();

// Optional flag: allow mock mode for local development when backend is not available
const useMockStripeBackend =
    (import.meta as any).env?.VITE_STRIPE_USE_MOCK_BACKEND === 'true';

let stripePromise: Promise<Stripe | null> | null = null;
let stripeInstance: Stripe | null = null;

/**
 * Initialize Stripe with publishable key
 */
export const initializeStripe = async (): Promise<Stripe | null> => {
    if (!config.stripe.enabled) {
        console.warn('Stripe is not configured. Payment features will be limited.');
        return null;
    }

    if (stripePromise) {
        return stripePromise;
    }

    const startTime = Date.now();
    stripePromise = (async () => {
        try {
            const stripe = await loadStripe(config.stripe.publishableKey, {
                apiVersion: config.stripe.apiVersion as any,
            });

            if (!stripe) {
                throw new Error('Failed to initialize Stripe');
            }

            stripeInstance = stripe;
            integrationManager.recordRequest('stripe', true, Date.now() - startTime);
            return stripe;
        } catch (error: any) {
            const responseTime = Date.now() - startTime;
            integrationManager.recordRequest('stripe', false, responseTime, error.message);
            errorLogger.log('stripe', error, { action: 'initialize' }, 'high');
            throw error;
        }
    })();

    return stripePromise;
};

/**
 * Get Stripe instance (initializes if needed)
 */
export const getStripe = async (): Promise<Stripe | null> => {
    if (stripeInstance) {
        return stripeInstance;
    }
    return initializeStripe();
};

/**
 * Create a payment intent via backend API
 * Note: This should call your backend, which then calls Stripe's API
 * For security, never call Stripe's server API directly from the frontend
 */
export const createPaymentIntent = async (
    amount: number,
    currency: string = 'usd',
    metadata?: Record<string, string>
): Promise<string> => {
    if (!config.stripe.enabled) {
        throw new Error('Stripe is not configured');
    }

    const startTime = Date.now();

    // In local development, allow an explicit mock mode flag
    if (useMockStripeBackend) {
        const mockId = `pi_mock_${Date.now()}_${Math.random()
            .toString(36)
            .substr(2, 9)}`;
        const mockSecret = Math.random().toString(36).substr(2, 24);
        const mockClientSecret = `${mockId}_secret_${mockSecret}`;

        integrationManager.recordRequest('stripe', true, Date.now() - startTime);
        return mockClientSecret;
    }

    try {
        const response = await withRetry(
            async () => {
                return fetch('/api/payments/stripe/intents', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({ amount, currency, metadata }),
                });
            },
            {
                maxRetries: 3,
                initialDelay: 500,
                retryableErrors: ['NetworkError', 'Failed to fetch', 'TIMEOUT'],
            }
        );

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            let errorMessage = `Failed to create payment intent (status ${response.status})`;
            try {
                const errorBody = await response.json();
                if (errorBody?.error?.message) {
                    errorMessage = errorBody.error.message;
                }
            } catch {
                // Ignore JSON parsing errors, keep generic message
            }

            integrationManager.recordRequest('stripe', false, responseTime, errorMessage);
            const error = new Error(errorMessage);
            errorLogger.log(
                'stripe',
                error,
                { action: 'createPaymentIntent', amount, currency },
                'high'
            );
            throw error;
        }

        const data = await response.json();

        if (!data?.clientSecret) {
            const errorMessage =
                'Payment service did not return a clientSecret. Please try again.';
            integrationManager.recordRequest('stripe', false, responseTime, errorMessage);
            const error = new Error(errorMessage);
            errorLogger.log(
                'stripe',
                error,
                { action: 'createPaymentIntent', amount, currency },
                'high'
            );
            throw error;
        }

        integrationManager.recordRequest('stripe', true, responseTime);
        return data.clientSecret as string;
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        integrationManager.recordRequest('stripe', false, responseTime, error.message);
        errorLogger.log(
            'stripe',
            error,
            { action: 'createPaymentIntent', amount, currency },
            'high'
        );
        throw error;
    }
};

/**
 * Confirm payment with Stripe Elements
 */
export const confirmPayment = async (
    elements: StripeElements,
    clientSecret: string,
    paymentMethodData?: {
        billing_details?: {
            name?: string;
            email?: string;
            address?: any;
        };
    }
): Promise<{ paymentIntent?: any; error?: any }> => {
    if (!config.stripe.enabled) {
        throw new Error('Stripe is not configured');
    }

    const startTime = Date.now();

    try {
        const stripe = await getStripe();
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }

        const result = await withRetry(
            async () => {
                return await stripe.confirmPayment({
                    elements,
                    clientSecret,
                    confirmParams: {
                        payment_method_data: paymentMethodData,
                        return_url: `${window.location.origin}/payment-success`,
                    },
                    redirect: 'if_required',
                });
            },
            {
                maxRetries: 2,
                initialDelay: 1000,
                retryableErrors: ['NetworkError', 'Failed to fetch'],
            }
        );

        if (result.error) {
            integrationManager.recordRequest(
                'stripe',
                false,
                Date.now() - startTime,
                result.error.message
            );
            errorLogger.log(
                'stripe',
                new Error(result.error.message),
                { action: 'confirmPayment', clientSecret: clientSecret.substring(0, 20) + '...' },
                'high'
            );
        } else {
            integrationManager.recordRequest('stripe', true, Date.now() - startTime);
        }

        return result;
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        integrationManager.recordRequest('stripe', false, responseTime, error.message);
        errorLogger.log(
            'stripe',
            error,
            { action: 'confirmPayment' },
            'critical'
        );
        throw error;
    }
};

/**
 * Confirm card payment (alternative method)
 */
export const confirmCardPayment = async (
    clientSecret: string,
    paymentMethod: {
        card: any;
        billing_details?: {
            name?: string;
            email?: string;
            address?: any;
        };
    }
): Promise<{ paymentIntent?: any; error?: any }> => {
    if (!config.stripe.enabled) {
        throw new Error('Stripe is not configured');
    }

    const startTime = Date.now();

    try {
        const stripe = await getStripe();
        if (!stripe) {
            throw new Error('Stripe not initialized');
        }

        const result = await withRetry(
            async () => {
                return await stripe.confirmCardPayment(clientSecret, {
                    payment_method: paymentMethod,
                });
            },
            {
                maxRetries: 2,
                initialDelay: 1000,
            }
        );

        if (result.error) {
            integrationManager.recordRequest(
                'stripe',
                false,
                Date.now() - startTime,
                result.error.message
            );
            errorLogger.log(
                'stripe',
                new Error(result.error.message),
                { action: 'confirmCardPayment' },
                'high'
            );
        } else {
            integrationManager.recordRequest('stripe', true, Date.now() - startTime);
        }

        return result;
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        integrationManager.recordRequest('stripe', false, responseTime, error.message);
        errorLogger.log(
            'stripe',
            error,
            { action: 'confirmCardPayment' },
            'critical'
        );
        throw error;
    }
};

/**
 * Retrieve payment intent status
 */
export const retrievePaymentIntent = async (
    paymentIntentId: string
): Promise<any> => {
    if (!config.stripe.enabled) {
        throw new Error('Stripe is not configured');
    }

    const startTime = Date.now();

    // When using a mock backend, just return a synthetic succeeded intent
    if (useMockStripeBackend) {
        const mockPaymentIntent = {
            id: paymentIntentId,
            status: 'succeeded',
            amount: 0,
            currency: 'usd',
        };

        integrationManager.recordRequest('stripe', true, Date.now() - startTime);
        return mockPaymentIntent;
    }

    try {
        const response = await withRetry(
            async () => {
                return fetch(`/api/payments/stripe/intents/${paymentIntentId}`, {
                    method: 'GET',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                });
            },
            {
                maxRetries: 3,
                initialDelay: 500,
                retryableErrors: ['NetworkError', 'Failed to fetch', 'TIMEOUT'],
            }
        );

        const responseTime = Date.now() - startTime;

        if (!response.ok) {
            let errorMessage = `Failed to retrieve payment intent (status ${response.status})`;
            try {
                const errorBody = await response.json();
                if (errorBody?.error?.message) {
                    errorMessage = errorBody.error.message;
                }
            } catch {
                // ignore
            }

            integrationManager.recordRequest('stripe', false, responseTime, errorMessage);
            const error = new Error(errorMessage);
            errorLogger.log(
                'stripe',
                error,
                { action: 'retrievePaymentIntent', paymentIntentId },
                'medium'
            );
            throw error;
        }

        const data = await response.json();
        integrationManager.recordRequest('stripe', true, responseTime);
        return data;
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        integrationManager.recordRequest('stripe', false, responseTime, error.message);
        errorLogger.log(
            'stripe',
            error,
            { action: 'retrievePaymentIntent', paymentIntentId },
            'medium'
        );
        throw error;
    }
};

/**
 * Check if Stripe is available
 */
export const isStripeAvailable = (): boolean => {
    return config.stripe.enabled && !!config.stripe.publishableKey;
};

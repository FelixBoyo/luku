/**
 * M-Pesa Payment Service
 * Handles initiation and status checks for M-Pesa STK push payments
 */

import { getIntegrationConfig } from './integrationConfig';
import { integrationManager } from './integrationManager';
import { errorLogger } from './errorLogger';
import { withRetry } from './retryHandler';

const config = getIntegrationConfig();

export type MpesaPaymentStatus =
    | 'PENDING'
    | 'PROCESSING'
    | 'COMPLETED'
    | 'FAILED'
    | 'CANCELLED';

export interface MpesaCheckoutRequest {
    amount: number;
    phoneNumber: string;
    accountReference?: string;
    metadata?: Record<string, string>;
}

export interface MpesaCheckoutResponse {
    paymentRequestId: string;
    mpesaReference?: string;
    status: MpesaPaymentStatus;
    customerMessage?: string;
}

export interface MpesaStatusResponse {
    paymentRequestId: string;
    status: MpesaPaymentStatus;
    mpesaReference?: string;
    customerMessage?: string;
}

const maskPhoneNumber = (phoneNumber: string) => {
    if (!phoneNumber) return '';
    const trimmed = phoneNumber.replace(/\D/g, '');
    if (trimmed.length <= 4) return trimmed;
    const visible = trimmed.slice(-4);
    return `****${visible}`;
};

/**
 * Check if M-Pesa payments are available
 */
export const isMpesaAvailable = (): boolean => {
    return config.mpesa.enabled;
};

/**
 * Start an M-Pesa STK push checkout via backend proxy.
 *
 * The backend proxy securely handles Paystack API calls using secret key.
 * Reference: https://paystack.com/docs/api/transaction#initialize
 */
export const startMpesaCheckout = async (
    payload: MpesaCheckoutRequest
): Promise<MpesaCheckoutResponse> => {
    const { amount, phoneNumber, accountReference, metadata = {} } = payload;

    // Validate amount
    if (!amount || amount <= 0) {
        throw new Error('Amount must be a positive number.');
    }

    // Validate and format phone number
    const phoneDigits = phoneNumber.replace(/\D/g, '');
    if (phoneDigits.length < 9) {
        throw new Error('Please enter a valid M-Pesa phone number.');
    }

    // Get API base URL from environment (for production) or use relative URL (for dev with proxy)
    const env = (import.meta as any).env;
    const apiBaseUrl = env?.VITE_API_BASE_URL || '';

    const startTime = Date.now();

    try {
        const response = await withRetry(
            async () => {
                return fetch(`${apiBaseUrl}/api/payments/mpesa/stk-push`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                    },
                    body: JSON.stringify({
                        amount,
                        phoneNumber,
                        accountReference,
                        metadata,
                    }),
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
            let errorMessage = `Failed to start M-Pesa payment (status ${response.status})`;
            try {
                const errorBody = await response.json();
                if (errorBody?.error?.message) {
                    errorMessage = errorBody.error.message;
                } else if (errorBody?.message) {
                    errorMessage = errorBody.message;
                }
            } catch {
                // ignore JSON-parsing errors
            }

            integrationManager.recordRequest('mpesa', false, responseTime, errorMessage);
            const error = new Error(errorMessage);
            errorLogger.log(
                'mpesa',
                error,
                {
                    action: 'startMpesaCheckout',
                    amount: payload.amount,
                    accountReference: payload.accountReference,
                    phoneNumber: maskPhoneNumber(payload.phoneNumber),
                },
                'high'
            );
            throw error;
        }

        const result = await response.json();

        // Backend returns MpesaCheckoutResponse format
        const data: MpesaCheckoutResponse = {
            paymentRequestId: result.paymentRequestId,
            mpesaReference: result.mpesaReference,
            status: result.status,
            customerMessage: result.customerMessage,
        };

        integrationManager.recordRequest('mpesa', true, responseTime);
        return data;
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        integrationManager.recordRequest('mpesa', false, responseTime, error.message);
        errorLogger.log(
            'mpesa',
            error,
            {
                action: 'startMpesaCheckout',
                amount: payload.amount,
                accountReference: payload.accountReference,
                phoneNumber: maskPhoneNumber(payload.phoneNumber),
            },
            'critical'
        );
        throw error;
    }
};

/**
 * Map Paystack transaction status to our MpesaPaymentStatus enum
 */
const mapPaystackStatus = (
    paystackStatus: string
): 'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED' | 'CANCELLED' => {
    switch (paystackStatus?.toLowerCase()) {
        case 'success':
            return 'COMPLETED';
        case 'pending':
            return 'PENDING';
        case 'failed':
            return 'FAILED';
        case 'abandoned':
            return 'CANCELLED';
        default:
            return 'PROCESSING';
    }
};

/**
 * Retrieve current status for an M-Pesa payment request via backend proxy.
 *
 * The backend proxy securely handles Paystack API calls using secret key.
 * Reference: https://paystack.com/docs/api/transaction#verify
 */
export const getMpesaPaymentStatus = async (
    paymentRequestId: string
): Promise<MpesaStatusResponse> => {
    if (!paymentRequestId) {
        throw new Error('Payment request ID is required');
    }

    // Get API base URL from environment (for production) or use relative URL (for dev with proxy)
    const env = (import.meta as any).env;
    const apiBaseUrl = env?.VITE_API_BASE_URL || '';

    const startTime = Date.now();

    try {
        const response = await withRetry(
            async () => {
                return fetch(`${apiBaseUrl}/api/payments/mpesa/requests/${paymentRequestId}`, {
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
            let errorMessage = `Failed to retrieve M-Pesa payment status (status ${response.status})`;
            try {
                const errorBody = await response.json();
                if (errorBody?.error?.message) {
                    errorMessage = errorBody.error.message;
                } else if (errorBody?.message) {
                    errorMessage = errorBody.message;
                }
            } catch {
                // ignore
            }

            integrationManager.recordRequest('mpesa', false, responseTime, errorMessage);
            const error = new Error(errorMessage);
            errorLogger.log(
                'mpesa',
                error,
                { action: 'getMpesaPaymentStatus', paymentRequestId },
                'medium'
            );
            throw error;
        }

        const result = await response.json();

        // Backend returns MpesaStatusResponse format
        const data: MpesaStatusResponse = {
            paymentRequestId: result.paymentRequestId,
            status: result.status,
            mpesaReference: result.mpesaReference,
            customerMessage: result.customerMessage,
        };

        integrationManager.recordRequest('mpesa', true, responseTime);
        return data;
    } catch (error: any) {
        const responseTime = Date.now() - startTime;
        integrationManager.recordRequest('mpesa', false, responseTime, error.message);
        errorLogger.log(
            'mpesa',
            error,
            { action: 'getMpesaPaymentStatus', paymentRequestId },
            'medium'
        );
        throw error;
    }
};


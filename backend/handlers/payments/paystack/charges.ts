/**
 * POST /api/payments/paystack/charges
 * 
 * Handle Paystack card and Apple Pay payment charges.
 * Uses Paystack's transaction/initialize API endpoint.
 * 
 * Reference: https://paystack.com/docs/api/transaction#initialize
 */

import { safeLogger } from '../../../http/redact';
import { readPaystackJson } from '../../../payments/paystackResponse';

export interface PaystackChargeRequest {
    amount: number;
    currency: string;
    method: 'card' | 'apple_pay';
    metadata?: Record<string, string>;
}

export interface PaystackChargeResponse {
    status: 'success' | 'requires_action' | 'failed';
    reference: string;
    authorizationUrl?: string;
    message?: string;
}

const PAYSTACK_BASE_URL = 'https://api.paystack.co';

/**
 * Handler for POST /api/payments/paystack/charges
 * 
 * For Supabase Edge Functions, use:
 *   Deno.serve(async (req) => {
 *     if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
 *     const body = await req.json() as PaystackChargeRequest;
 *     const result = await createPaystackCharge(body);
 *     return new Response(JSON.stringify(result), { headers: { 'Content-Type': 'application/json' } });
 *   });
 * 
 * For Express/Node.js, use:
 *   app.post('/api/payments/paystack/charges', async (req, res) => {
 *     try {
 *       const result = await createPaystackCharge(req.body);
 *       res.json(result);
 *     } catch (error: any) {
 *       res.status(500).json({ error: { code: 'PAYSTACK_CHARGE_FAILED', message: error.message } });
 *     }
 *   });
 */
export const createPaystackCharge = async (
    payload: PaystackChargeRequest
): Promise<PaystackChargeResponse> => {
    const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
    const APP_URL = process.env.APP_URL || process.env.VITE_APP_URL || 'http://localhost:5173';

    if (!PAYSTACK_SECRET_KEY) {
        throw new Error('Paystack secret key is not configured');
    }

    const { amount, currency = 'USD', method, metadata = {} } = payload;

    // Validate amount
    if (!amount || amount <= 0) {
        throw new Error('Amount must be a positive integer in the smallest currency unit.');
    }

    // Determine channels based on method
    const channels = method === 'apple_pay' ? ['apple_pay'] : ['card'];

    if (!metadata.email) {
        throw new Error('A valid email address is required to process this payment.');
    }
    const email = metadata.email;

    try {
        // Initialize Paystack transaction
        const initResponse = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
            method: 'POST',
            headers: {
                Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                amount: amount * 100, // Convert to smallest currency unit (cents/kobo)
                currency: currency.toLowerCase(),
                email,
                channels,
                metadata: JSON.stringify(metadata),
                callback_url: `${APP_URL}/payments/paystack/callback`,
            }),
        });

        if (!initResponse.ok) {
            const errorData = await readPaystackJson<unknown>(initResponse);
            const errorMessage = errorData.message || `Paystack API returned ${initResponse.status}`;
            throw new Error(errorMessage);
        }

        const initData = await readPaystackJson<{
            authorization_url?: string;
            reference?: string;
            access_code?: string;
        }>(initResponse);

        if (!initData.status || !initData.data) {
            throw new Error('Invalid response from Paystack API');
        }

        const { authorization_url, reference, access_code } = initData.data;

        // Everything downstream is keyed by this reference, so a response without
        // one is unusable rather than a partial success.
        const chargeReference = reference || access_code;
        if (!chargeReference) {
            throw new Error('Paystack response did not include a transaction reference');
        }

        // If authorization URL is present, payment requires user action (3DS, etc.)
        if (authorization_url) {
            return {
                status: 'requires_action',
                authorizationUrl: authorization_url,
                reference: chargeReference,
                message: 'Please complete authentication',
            };
        }

        // If no authorization URL, verify the transaction immediately
        // This handles cases where payment is instant
        if (reference) {
            // Verify transaction status
            const verifyResponse = await fetch(
                `${PAYSTACK_BASE_URL}/transaction/verify/${reference}`,
                {
                    headers: {
                        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
                    },
                }
            );

            if (verifyResponse.ok) {
                const verifyData = await readPaystackJson<{ status?: string }>(verifyResponse);
                if (verifyData.status && verifyData.data?.status === 'success') {
                    return {
                        status: 'success',
                        reference,
                        message: 'Payment successful',
                    };
                }
            }
        }

        // Default: return requires_action if we have authorization URL, otherwise success
        return {
            status: authorization_url ? 'requires_action' : 'success',
            reference: chargeReference,
            authorizationUrl: authorization_url,
            message: authorization_url ? 'Please complete authentication' : 'Payment successful',
        };
    } catch (error: any) {
        safeLogger.error('Paystack charge error', { error });

        let errorMessage = 'There was a problem processing your Paystack payment.';
        if (error.message?.includes('insufficient')) {
            errorMessage = 'Insufficient funds. Please check your account balance.';
        } else if (error.message?.includes('card')) {
            errorMessage = 'Card payment failed. Please try a different card or payment method.';
        } else if (error.message) {
            errorMessage = error.message;
        }

        throw new Error(errorMessage);
    }
};

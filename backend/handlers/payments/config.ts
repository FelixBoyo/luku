/**
 * GET /api/payments/config
 * 
 * Returns available payment methods configuration.
 * This endpoint allows the backend to dynamically control which payment methods
 * are available to the frontend.
 */

import { validatePaymentsEnvironment } from '../../payments/configValidator';
import { safeLogger } from '../../http/redact';

export interface PaymentsConfigResponse {
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
 * Handler for GET /api/payments/config
 * 
 * For Supabase Edge Functions, use:
 *   Deno.serve(async (req) => {
 *     if (req.method !== 'GET') return new Response('Method not allowed', { status: 405 });
 *     const config = getPaymentsConfig();
 *     return new Response(JSON.stringify(config), { headers: { 'Content-Type': 'application/json' } });
 *   });
 * 
 * For Express/Node.js, use:
 *   app.get('/api/payments/config', async (req, res) => {
 *     try {
 *       const config = getPaymentsConfig();
 *       res.json(config);
 *     } catch (error) {
 *       res.status(500).json({ error: { code: 'CONFIG_FETCH_FAILED', message: 'Unable to fetch payment configuration.' } });
 *     }
 *   });
 */
export const getPaymentsConfig = (): PaymentsConfigResponse => {
    try {
        validatePaymentsEnvironment(process.env);

        const config: PaymentsConfigResponse = {
            stripe: {
                cards: !!process.env.STRIPE_SECRET_KEY,
            },
            paystack: {
                cards: !!process.env.PAYSTACK_SECRET_KEY,
                applePay: !!process.env.PAYSTACK_SECRET_KEY, // Apple Pay requires Paystack setup
                mpesa: !!process.env.PAYSTACK_SECRET_KEY, // M-Pesa via Paystack
            },
        };

        // Only return paystack config if at least one method is enabled
        if (
            !config.paystack?.cards &&
            !config.paystack?.applePay &&
            !config.paystack?.mpesa
        ) {
            delete config.paystack;
        }

        return config;
    } catch (error: any) {
        safeLogger.error('Get payments config error', { error });
        throw new Error('Unable to fetch payment configuration.');
    }
};

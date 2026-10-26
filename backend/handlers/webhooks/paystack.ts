import { createHmac, timingSafeEqual } from 'node:crypto';
import type { Request, Response } from 'express';
import {
    buildWebhookIdempotencyKey,
    type IdempotencyStore,
    webhookIdempotencyStore,
} from '../../payments/idempotencyStore';
import { safeLogger } from '../../http/redact';

export interface PaystackWebhookEvent {
    event: string;
    data: {
        reference: string;
        status: string;
        amount: number;
        currency: string;
        /** Paystack's charge channel, e.g. `mobile_money` (M-Pesa) or `card`. */
        channel?: string;
        gateway_response?: string;
        metadata?: string | Record<string, any>;
        [key: string]: any;
    };
}

export class WebhookAuthError extends Error {}

/**
 * Paystack signs `x-paystack-signature` with HMAC SHA512 of the raw body using
 * the secret key. `PAYSTACK_WEBHOOK_SECRET` is an optional override.
 */
export const resolvePaystackWebhookSecret = (): string | undefined =>
    process.env.PAYSTACK_WEBHOOK_SECRET || process.env.PAYSTACK_SECRET_KEY;

/**
 * Verify Paystack webhook signature.
 *
 * Paystack signs webhooks using HMAC SHA512 with the secret key
 * (`PAYSTACK_WEBHOOK_SECRET` if set, otherwise `PAYSTACK_SECRET_KEY`).
 */
export const verifyPaystackSignature = (
    signature: string,
    body: string,
    secret = resolvePaystackWebhookSecret()
): boolean => {
    if (!secret || !signature) {
        return false;
    }

    const expectedHash = createHmac('sha512', secret).update(body).digest('hex');
    const expectedBuffer = Buffer.from(expectedHash, 'utf8');
    const receivedBuffer = Buffer.from(signature.trim(), 'utf8');

    if (expectedBuffer.length !== receivedBuffer.length) {
        return false;
    }

    return timingSafeEqual(expectedBuffer, receivedBuffer);
};

const firstNonEmptyString = (...candidates: unknown[]): string | null => {
    for (const candidate of candidates) {
        if (typeof candidate === 'string' && candidate.trim().length > 0) {
            return candidate.trim();
        }
    }
    return null;
};

export const resolveWebhookReference = (event: PaystackWebhookEvent): string | null =>
    firstNonEmptyString(
        event.data?.reference,
        event.data?.transaction_reference,
        event.data?.transaction?.reference
    );

/**
 * Handler for POST /webhooks/paystack
 * 
 * For Supabase Edge Functions, use:
 *   Deno.serve(async (req) => {
 *     if (req.method !== 'POST') return new Response('Method not allowed', { status: 405 });
 *     const signature = req.headers.get('x-paystack-signature');
 *     const body = await req.text();
 *     const event = await handlePaystackWebhook(signature, body);
 *     return new Response('OK', { status: 200 });
 *   });
 * 
 * For Express/Node.js, use:
 *   app.post('/webhooks/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
 *     try {
 *       const signature = req.headers['x-paystack-signature'] as string;
 *       await handlePaystackWebhook(signature, req.body.toString());
 *       res.status(200).send('OK');
 *     } catch (error: any) {
 *       console.error('Webhook error', error);
 *       res.status(400).send('Webhook Error');
 *     }
 *   });
 */
export const handlePaystackWebhook = async (
    signature: string | null | undefined,
    body: string,
    options?: {
        idempotencyStore?: IdempotencyStore;
        processEvent?: (event: PaystackWebhookEvent) => Promise<void>;
    }
): Promise<void> => {
    if (!signature) {
        throw new WebhookAuthError('Missing Paystack signature');
    }

    const webhookSecret = resolvePaystackWebhookSecret();
    if (!webhookSecret) {
        throw new WebhookAuthError('Paystack webhook secret is not configured');
    }

    if (!verifyPaystackSignature(signature, body, webhookSecret)) {
        throw new WebhookAuthError('Invalid Paystack webhook signature');
    }

    let event: PaystackWebhookEvent;
    try {
        event = JSON.parse(body);
    } catch (error) {
        throw new Error('Invalid JSON in webhook body');
    }

    const reference = resolveWebhookReference(event);
    if (!reference) {
        throw new Error('Missing Paystack reference in webhook event');
    }

    const idempotencyStore = options?.idempotencyStore || webhookIdempotencyStore;
    const idempotencyKey = buildWebhookIdempotencyKey('paystack', reference, event.event);
    const alreadyProcessed = await idempotencyStore.hasProcessed(idempotencyKey);

    if (alreadyProcessed) {
        safeLogger.info('[Webhook] Duplicate Paystack event ignored', {
            provider: 'paystack',
            reference,
            event: event.event,
        });
        return;
    }

    try {
        if (options?.processEvent) {
            await options.processEvent(event);
        } else {
            safeLogger.info('[Webhook] Paystack event received', {
                provider: 'paystack',
                reference,
                event: event.event,
                status: event.data?.status,
            });
        }

        await idempotencyStore.markProcessed(idempotencyKey, {
            provider: 'paystack',
            reference,
            eventType: event.event,
            processedAt: new Date().toISOString(),
        });
    } catch (error: any) {
        safeLogger.error('[Webhook] Paystack event processing failed', {
            provider: 'paystack',
            reference,
            event: event.event,
            reason: error?.message || 'unknown_error',
        });
        throw error;
    }
};

const rawBodyToString = (body: unknown): string => {
    if (Buffer.isBuffer(body)) {
        return body.toString('utf8');
    }
    if (typeof body === 'string') {
        return body;
    }
    return JSON.stringify(body ?? '');
};

const headerValue = (value: string | string[] | undefined): string | undefined =>
    Array.isArray(value) ? value[0] : value;

/**
 * Express mapping for POST /webhooks/paystack: 200 OK, 401 on bad HMAC,
 * 400 on a malformed or unprocessable payload.
 */
export const handlePaystackWebhookRequest = async (
    req: Request,
    res: Response,
    options?: {
        processEvent?: (event: PaystackWebhookEvent) => Promise<void>;
        idempotencyStore?: IdempotencyStore;
    }
): Promise<void> => {
    try {
        const signature = headerValue(req.headers['x-paystack-signature']);
        await handlePaystackWebhook(signature, rawBodyToString(req.body), options);
        res.status(200).send('OK');
    } catch (error: any) {
        if (error instanceof WebhookAuthError) {
            safeLogger.warn('[Webhook] Rejected unverified Paystack webhook', {
                provider: 'paystack',
                reason: error.message,
            });
            res.status(401).send('Unauthorized');
            return;
        }

        safeLogger.error('[Webhook] Paystack handler error', {
            provider: 'paystack',
            reason: error?.message || 'unknown_error',
        });
        res.status(400).send('Webhook Error');
    }
};

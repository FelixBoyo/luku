/**
 * Express.js Backend Server for Paystack Payment Integration
 * 
 * This is an alternative to Supabase Edge Functions.
 * Run this server alongside your Vite dev server for local development.
 * 
 * Usage:
 *   npm install express cors dotenv
 *   npm install -D @types/express @types/cors typescript ts-node
 *   npx ts-node backend/server.ts
 */

// Must stay first: this import loads .env / .env.local, and every module body
// below is evaluated before any statement in this file runs.
import { loadServerEnv } from './config/loadEnv';

import express from 'express';
import cors from 'cors';

// Import API handlers
import { getPaymentsConfig } from './handlers/payments/config';
import { createPaystackCharge } from './handlers/payments/paystack/charges';
import { startPaystackMpesaCheckout } from './handlers/payments/mpesa/stk-push';
import { mapMpesaStkPushError } from './handlers/payments/mpesa/errors';
import { getPaystackMpesaStatus } from './handlers/payments/mpesa/status';
import { generateGeminiContent } from './handlers/ai/gemini';
import { handlePaystackWebhookRequest } from './handlers/webhooks/paystack';
import { processPaystackEvent } from './services/transferWebhookService';
import { handleOrderWebhook } from './handlers/webhooks/orders';
import { sendApiError } from './http/error';
import { createResponse } from './lib/envelope';
import { createInMemoryRateLimit } from './http/rate-limit';
import { safeLogger } from './http/redact';
import { requestIdMiddleware } from './http/request-id';
import { createRequestTimingMiddleware } from './http/request-timing';
import { validatePaymentsEnvironment } from './payments/configValidator';
import { assertServiceRoleKey, describeServiceRoleKey } from './config/supabaseEnv';
import { getSupabaseAdmin } from './data/supabaseAdmin';
import {
    RequestValidationError,
    validateMpesaStatusParams,
    validateMpesaStkPushBody,
    validatePaystackChargeBody,
} from './http/validation';
import v1Router from './router/v1/index.js';
import {
    createTransferRecipient,
    getMyTransferRecipient,
    deleteTransferRecipient,
} from './handlers/payments/paystack/recipients';
import { verifyToken, type AuthenticatedRequest } from './middleware/auth';
import { startTimers } from './services/timersService';

const app = express();
const PORT = process.env.PORT || 3001;
const LEGACY_SUNSET_DATE = 'Wed, 31 Dec 2026 23:59:59 GMT';
const PAYMENTS_BASE_PATH = '/api/payments';
const PAYMENTS_V1_BASE_PATH = '/v1/api/payments';
const paymentsEnv = validatePaymentsEnvironment(process.env);
const envLoad = loadServerEnv();
// A non-service-role key only fails once RLS rejects a write mid-checkout, by
// which point the buyer has already been charged. Refuse to boot instead.
const supabaseKeyWarnings = assertServiceRoleKey(process.env);
const supabaseKey = describeServiceRoleKey(process.env);
const isProduction = process.env.NODE_ENV === 'production';
const configuredOrigin = process.env.VITE_APP_URL;
const extraOrigins = (process.env.ALLOWED_ORIGINS ?? '')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);
const allowedOrigins = new Set(
    [
        configuredOrigin,
        ...extraOrigins,
        !isProduction ? 'http://localhost:5173' : undefined,
        !isProduction ? 'http://localhost:3000' : undefined,
        !isProduction ? 'http://localhost:8081' : undefined,
    ].filter((origin): origin is string => typeof origin === 'string' && origin.length > 0)
);

// Middleware
app.use(cors({
    origin: (origin, callback) => {
        if (!origin || allowedOrigins.has(origin)) {
            callback(null, true);
            return;
        }
        callback(new Error('CORS origin not allowed'));
    },
    credentials: true,
}));
app.use(requestIdMiddleware);
app.use(createRequestTimingMiddleware());

// Paystack webhook needs raw body — register before global JSON parser
app.post('/webhooks/paystack', express.raw({ type: 'application/json' }), (req, res) =>
    handlePaystackWebhookRequest(req, res, { processEvent: processPaystackEvent })
);

// Supabase webhook for order events
app.post('/webhooks/orders', express.json(), handleOrderWebhook);

// Larger payload limit for legacy AI route
app.use('/api/ai', express.json({ limit: '12mb' }));

app.use('/v1/api/ai/try-on', express.json({ limit: '12mb' }));
// JSON body parser for BFF + payment routes (must run before /v1/api router)
app.use(express.json());

// Versioned BFF API (mobile + future web)
app.use('/v1/api', v1Router);

app.use('/api/ai', createInMemoryRateLimit({ windowMs: 60_000, maxRequests: 20 }));
app.post('/api/ai/gemini/generate-content', async (req, res) => {
    try {
        const result = await generateGeminiContent(req.body);
        res.json(result);
    } catch (error: any) {
        safeLogger.error('Gemini API endpoint error', { error });
        sendApiError(res, 500, {
            code: 'GEMINI_REQUEST_FAILED',
            message: 'Failed to process AI request.',
        });
    }
});

app.use(
    [PAYMENTS_BASE_PATH, PAYMENTS_V1_BASE_PATH],
    createInMemoryRateLimit({ windowMs: 60_000, maxRequests: 30 })
);

// Health check
app.get('/health', (_req, res) => {
    res.json({ status: 'ok', requestId: res.locals.requestId });
});

/**
 * Answers "can this process write payments?" without charging anyone. The key
 * on disk being correct proves nothing: the client is built once per process,
 * so an edited file only takes effect after a restart. Reports the fingerprint
 * of the key actually in use so that can be checked against the file.
 *
 * `visibleRows` matters more than the absence of an error. `payments` has a
 * SELECT policy of `auth.uid() = buyer_id`, which is false for a service key,
 * so a constrained role reads zero rows and reports no error at all. A count of
 * zero against a non-empty table means RLS is being applied. `?write=1` settles
 * it outright by round-tripping the insert checkout performs.
 */
app.get('/health/supabase', async (req, res) => {
    const supabase = getSupabaseAdmin();
    const { count, error } = await supabase
        .from('payments')
        .select('id', { count: 'exact', head: true });

    const body: Record<string, unknown> = {
        status: error ? 'error' : 'ok',
        key: {
            kind: supabaseKey.kind,
            role: supabaseKey.role,
            projectRef: supabaseKey.projectRef ?? supabaseKey.expectedProjectRef,
            fingerprint: supabaseKey.fingerprint,
        },
        envFiles: envLoad.files.filter((f) => f.found).map((f) => f.file),
        visibleRows: error ? null : (count ?? 0),
        error: error?.message ?? null,
        requestId: res.locals.requestId,
    };

    if (req.query.write === '1' && !isProduction) {
        body.write = await probePaymentsWrite();
    }

    res.json(body);
});

/**
 * Inserts (and tries to delete) one sentinel `payments` row via the same
 * SECURITY DEFINER RPC checkout uses. A table insert here would 42501 for
 * the same reason checkout did, and would look like a key problem. Cleanup
 * delete can still fail RLS; insert succeeding is the checkout question.
 */
const probePaymentsWrite = async (): Promise<Record<string, unknown>> => {
    const supabase = getSupabaseAdmin();

    const { data: users, error: usersError } = await supabase.auth.admin.listUsers({
        perPage: 1,
    });
    const buyerId = users?.users?.[0]?.id;
    if (usersError || !buyerId) {
        return { ok: false, stage: 'listUsers', error: usersError?.message ?? 'no user found' };
    }

    const { data, error } = await supabase.rpc('ensure_payment_record', {
        p_buyer_id: buyerId,
        p_reference: `healthcheck_${Date.now()}`,
        p_provider: 'paystack',
        p_amount_minor: 0,
        p_currency: 'KES',
        p_status: 'failed',
    });

    if (error) {
        return { ok: false, stage: 'insert', code: error.code, error: error.message };
    }

    const { error: deleteError } = await supabase.from('payments').delete().eq('id', data);
    if (deleteError) {
        return { ok: true, stage: 'insert', cleanup: deleteError.message };
    }
    return { ok: true, stage: 'insert+delete' };
};

const withLegacyDeprecationHeaders = (successorPath: string): express.RequestHandler => {
    return (_req, res, next) => {
        res.setHeader('Deprecation', 'true');
        res.setHeader('Sunset', LEGACY_SUNSET_DATE);
        res.setHeader('Link', `<${successorPath}>; rel="successor-version"`);
        next();
    };
};

const configHandler: express.RequestHandler = async (_req, res) => {
    try {
        const config = getPaymentsConfig();
        res.json(createResponse(config, 'Payment configuration retrieved'));
    } catch (error: any) {
        safeLogger.error('Get payments config error', { error });
        sendApiError(res, 500, {
            code: 'PAYMENTS_CONFIG_ERROR',
            message: 'Unable to fetch payment configuration.',
        });
    }
};

const paystackChargeHandler: express.RequestHandler = async (req, res) => {
    try {
        const validatedBody = validatePaystackChargeBody(req.body);
        const result = await createPaystackCharge(validatedBody);
        res.json(createResponse(result, 'Charge initiated'));
    } catch (error: any) {
        if (error instanceof RequestValidationError) {
            sendApiError(res, 400, {
                code: error.code,
                message: error.message,
                details: error.details,
            });
            return;
        }

        safeLogger.error('Paystack charge error', { error });
        sendApiError(res, 500, {
            code: 'PAYSTACK_CHARGE_FAILED',
            message: 'There was a problem processing your Paystack payment.',
        });
    }
};
const createRecipientHandler: express.RequestHandler = async (req, res) => {
    const sellerId = (req as AuthenticatedRequest).userId;
    if (!sellerId) {
        sendApiError(res, 401, { code: 'UNAUTHORIZED', message: 'Sign in required.' });
        return;
    }
    try {
        const recipient = await createTransferRecipient(sellerId, req.body);
        res.json(createResponse({ recipient }, 'Payout details saved'));
    } catch (error: any) {
        safeLogger.error('Create transfer recipient error', { error, sellerId });
        sendApiError(res, 400, {
            code: 'RECIPIENT_CREATE_FAILED',
            message: error?.message || 'Could not save payout details.',
        });
    }
};

const getMyRecipientHandler: express.RequestHandler = async (req, res) => {
    const sellerId = (req as AuthenticatedRequest).userId;
    if (!sellerId) {
        sendApiError(res, 401, { code: 'UNAUTHORIZED', message: 'Sign in required.' });
        return;
    }
    try {
        const recipient = await getMyTransferRecipient(sellerId);
        res.json(createResponse({ recipient }, 'Recipient retrieved'));
    } catch (error: any) {
        safeLogger.error('Get transfer recipient error', { error, sellerId });
        sendApiError(res, 500, {
            code: 'RECIPIENT_FETCH_FAILED',
            message: 'Could not load payout details.',
        });
    }
};

const deleteRecipientHandler: express.RequestHandler = async (req, res) => {
    const sellerId = (req as AuthenticatedRequest).userId;
    if (!sellerId) {
        sendApiError(res, 401, { code: 'UNAUTHORIZED', message: 'Sign in required.' });
        return;
    }
    try {
        await deleteTransferRecipient(sellerId, req.params.id);
        res.json(createResponse({ deleted: true }, 'Payout details removed'));
    } catch (error: any) {
        safeLogger.error('Delete transfer recipient error', { error, sellerId });
        sendApiError(res, 500, {
            code: 'RECIPIENT_DELETE_FAILED',
            message: 'Could not remove payout details.',
        });
    }
};

const mpesaStkPushHandler: express.RequestHandler = async (req, res) => {
    const requestId = res.locals.requestId as string | undefined;
    try {
        const validatedBody = validateMpesaStkPushBody(req.body);
        const result = await startPaystackMpesaCheckout(validatedBody, requestId);
        res.status(201).json(createResponse(result, 'STK push initiated', 'success', 201));
    } catch (error: any) {
        if (error instanceof RequestValidationError) {
            sendApiError(res, 400, {
                code: error.code,
                message: error.message,
                details: error.details,
            });
            return;
        }

        const mapped = mapMpesaStkPushError(error);
        if (mapped) {
            safeLogger.error('M-Pesa STK push failed', {
                requestId,
                clientCode: mapped.code,
                error,
            });
            sendApiError(res, mapped.httpStatus, {
                code: mapped.code,
                message: mapped.message,
            });
            return;
        }

        safeLogger.error('M-Pesa STK push error', { requestId, error });
        sendApiError(res, 500, {
            code: 'MPESA_STK_PUSH_FAILED',
            message: 'Unable to start M-Pesa payment.',
        });
    }
};

const mpesaStatusHandler: express.RequestHandler = async (req, res) => {
    const requestId = res.locals.requestId as string | undefined;
    try {
        const { id } = validateMpesaStatusParams(req.params);
        const result = await getPaystackMpesaStatus(id, requestId);
        res.json(createResponse(result, 'Status retrieved'));
    } catch (error: any) {
        if (error instanceof RequestValidationError) {
            sendApiError(res, 400, {
                code: error.code,
                message: error.message,
                details: error.details,
            });
            return;
        }

        safeLogger.error('M-Pesa status error', { requestId, error });
        sendApiError(res, 500, {
            code: 'MPESA_STATUS_FETCH_FAILED',
            message: 'Unable to fetch payment status.',
        });
    }
};

// Versioned payment routes.
//
// The three routes that move or read money are authenticated. They take a
// client-supplied amount, so anonymous access let anyone initiate a charge.
// Pricing the cart server-side and ignoring the client figure is the real fix
// and is tracked separately; this closes the open door in the meantime.
// `config` stays public — it returns publishable keys only.
app.get(`${PAYMENTS_V1_BASE_PATH}/config`, configHandler);
app.post(`${PAYMENTS_V1_BASE_PATH}/paystack/charges`, verifyToken, paystackChargeHandler);
app.post(`${PAYMENTS_V1_BASE_PATH}/mpesa/stk-push`, verifyToken, mpesaStkPushHandler);
app.get(`${PAYMENTS_V1_BASE_PATH}/mpesa/requests/:id`, verifyToken, mpesaStatusHandler);

app.post(`${PAYMENTS_V1_BASE_PATH}/paystack/recipients`, verifyToken, createRecipientHandler);
app.get(`${PAYMENTS_V1_BASE_PATH}/paystack/recipients/me`, verifyToken, getMyRecipientHandler);
app.delete(`${PAYMENTS_V1_BASE_PATH}/paystack/recipients/:id`, verifyToken, deleteRecipientHandler);
// Legacy payment routes (deprecated)
app.get(
    `${PAYMENTS_BASE_PATH}/config`,
    withLegacyDeprecationHeaders(`${PAYMENTS_V1_BASE_PATH}/config`),
    configHandler
);
// Authenticated for the same reason as their v1 twins. Leaving these open
// would have left the unauthenticated path fully usable. The archived
// web-legacy client calls them without a token and will now get 401; it has no
// run script and is reference material, so that is the intended outcome.
app.post(
    `${PAYMENTS_BASE_PATH}/paystack/charges`,
    withLegacyDeprecationHeaders(`${PAYMENTS_V1_BASE_PATH}/paystack/charges`),
    verifyToken,
    paystackChargeHandler
);
app.post(
    `${PAYMENTS_BASE_PATH}/mpesa/stk-push`,
    withLegacyDeprecationHeaders(`${PAYMENTS_V1_BASE_PATH}/mpesa/stk-push`),
    verifyToken,
    mpesaStkPushHandler
);
app.get(
    `${PAYMENTS_BASE_PATH}/mpesa/requests/:id`,
    withLegacyDeprecationHeaders(`${PAYMENTS_V1_BASE_PATH}/mpesa/requests/:id`),
    verifyToken,
    mpesaStatusHandler
);

// Start background timers
startTimers();

// Start server
app.listen(PORT, () => {
    console.log(`Backend API server running on http://localhost:${PORT}`);
    console.log(`Payments mode: ${paymentsEnv.mode}`);

    const envFiles = envLoad.files
        .map((f) => `${f.file} ${f.found ? 'loaded' : 'not found'}`)
        .join(', ');
    console.log(`Env files: ${envFiles}`);
    console.log(
        `Supabase key: ${supabaseKey.kind}` +
            `${supabaseKey.role ? ` role=${supabaseKey.role}` : ''}` +
            ` project=${supabaseKey.projectRef ?? supabaseKey.expectedProjectRef ?? 'unknown'}` +
            ` fingerprint=${supabaseKey.fingerprint ?? 'none'}`
    );
    if (envLoad.shadowed.length > 0) {
        console.warn(
            `WARNING: shell values overridden by env file: ${envLoad.shadowed.join(', ')}`
        );
    }
    for (const warning of supabaseKeyWarnings) {
        console.warn(`WARNING: ${warning}`);
    }
    console.log(`\nEndpoints:`);
    console.log(`  GET  http://localhost:${PORT}/health/supabase`);
    console.log(`  GET  http://localhost:${PORT}/v1/api/payments/config`);
    console.log(`  POST http://localhost:${PORT}/v1/api/payments/paystack/charges`);
    console.log(`  POST http://localhost:${PORT}/v1/api/payments/mpesa/stk-push`);
    console.log(`  GET  http://localhost:${PORT}/v1/api/payments/mpesa/requests/:id`);
    console.log(`  LEGACY (deprecated): /api/payments/*`);
    console.log(`  POST http://localhost:${PORT}/webhooks/paystack`);
    console.log(`\nMake sure your frontend is configured to use these endpoints.`);
});

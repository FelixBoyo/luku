import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { Agent, fetch as undiciFetch } from 'undici';

let adminClient: SupabaseClient | null = null;
let anonClient: SupabaseClient | null = null;
let supabaseDispatcher: Agent | null = null;

/**
 * Ceiling for a single PostgREST / GoTrue round trip. Supabase normally
 * answers in well under a second; anything past this is a wedged socket, not
 * a slow query. Kept under the mobile client's 20s mutation timeout so a
 * two-hop transition (confirm-receipt does `delivered` then `released`) still
 * has room for a retry before the app gives up.
 */
export const SUPABASE_FETCH_TIMEOUT_MS = 10_000;

/**
 * A PostgREST / GoTrue call that connected and then went silent — the
 * Windows-after-sleep failure mode where the socket is half-open and no
 * response ever arrives. Distinct from a plain `fetch failed` (DNS, refused):
 * a timeout is retryable on a fresh connection pool, and routes map it to a
 * 503 "try again" rather than a 500.
 */
export class SupabaseFetchTimeoutError extends Error {
    constructor(message = 'Supabase request timed out') {
        super(message);
        this.name = 'SupabaseFetchTimeoutError';
    }
}

/** True for a wedged-socket timeout, however it was re-wrapped on the way up. */
export const isSupabaseTimeoutError = (error: unknown): boolean => {
    if (error instanceof SupabaseFetchTimeoutError) {
        return true;
    }
    const message = error instanceof Error ? error.message : String(error ?? '');
    return /SupabaseFetchTimeoutError|Supabase request exceeded/i.test(message);
};

/**
 * Supabase gets its own undici connection pool instead of sharing Node's
 * process-wide one. After a Windows network change or laptop sleep the global
 * pool keeps half-open keep-alive sockets; a later request is dispatched onto
 * a dead socket and never receives response headers (undici's own ceiling is
 * 300s). Owning the pool lets `resetSupabaseAdmin()` destroy every poisoned
 * socket so the next call dials fresh, and the timeouts here give undici a
 * ceiling of its own well under that default.
 */
const getSupabaseDispatcher = (): Agent => {
    if (supabaseDispatcher) {
        return supabaseDispatcher;
    }
    supabaseDispatcher = new Agent({
        connect: { timeout: 8_000 },
        headersTimeout: SUPABASE_FETCH_TIMEOUT_MS,
        bodyTimeout: SUPABASE_FETCH_TIMEOUT_MS,
        // Retire idle sockets quickly so one left dead by a sleep is unlikely
        // to be handed back out; sequential calls in a request still reuse.
        keepAliveTimeout: 5_000,
        keepAliveMaxTimeout: 5_000,
    });
    return supabaseDispatcher;
};

/**
 * Swap the pool out so the next getter dials fresh, then drain the old one.
 * `close()` lets in-flight requests finish; a delayed `destroy()` is the
 * fallback if a socket is still wedged after the fetch ceiling.
 */
export const POOL_DESTROY_FALLBACK_MS = SUPABASE_FETCH_TIMEOUT_MS + 5_000;

const retireSupabaseDispatcher = (): void => {
    const current = supabaseDispatcher;
    supabaseDispatcher = null;
    if (!current) {
        return;
    }
    void current.close().catch(() => {});
    const fallback = setTimeout(() => {
        void current.destroy().catch(() => {});
    }, POOL_DESTROY_FALLBACK_MS);
    fallback.unref?.();
};

const combineAbortSignals = (
    caller: AbortSignal | null | undefined,
    internal: AbortSignal,
): AbortSignal => {
    if (caller && typeof AbortSignal.any === 'function') {
        return AbortSignal.any([caller, internal]);
    }
    return internal;
};

const isIdempotentRequest = (init?: RequestInit): boolean => {
    const method = (init?.method ?? 'GET').toUpperCase();
    return method === 'GET' || method === 'HEAD';
};

/**
 * Wrap `fetch` so a hung PostgREST / GoTrue socket fails fast: a wall-clock
 * deadline (a plain timer, immune to a starved libuv thread pool) races the
 * request, the cached clients and the connection pool are dropped, and an
 * idempotent read is retried once on the fresh pool. That retry is what lets
 * a wedged Confirm receipt / Report a problem go through on the next tap
 * instead of needing a `dev:api` restart.
 */
export const withSupabaseFetchTimeout = (
    baseFetch: typeof fetch,
    reset: () => void,
    timeoutMs = SUPABASE_FETCH_TIMEOUT_MS,
): typeof fetch => {
    const runOnce = async (
        input: Parameters<typeof fetch>[0],
        init: RequestInit | undefined,
    ): Promise<Response> => {
        const controller = new AbortController();
        let timer: ReturnType<typeof setTimeout> | undefined;
        const deadline = new Promise<never>((_, rejectDeadline) => {
            timer = setTimeout(() => {
                const error = new SupabaseFetchTimeoutError(
                    `Supabase request exceeded ${timeoutMs}ms`,
                );
                // Best-effort: also tell undici to drop the socket.
                controller.abort(error);
                rejectDeadline(error);
            }, timeoutMs);
            timer.unref?.();
        });

        const request = baseFetch(input, {
            ...init,
            dispatcher: getSupabaseDispatcher(),
            signal: combineAbortSignals(init?.signal, controller.signal),
        });
        // If the deadline wins the race the request rejects later on abort;
        // mark it handled so it does not surface as an unhandledRejection.
        void request.catch(() => {});

        try {
            return await Promise.race([request, deadline]);
        } finally {
            if (timer) {
                clearTimeout(timer);
            }
        }
    };

    return async (input, init) => {
        try {
            return await runOnce(input, init);
        } catch (error) {
            // DNS / refused / HTTP errors must not kill in-flight work on the
            // shared pool. Only a hang (wedged socket) is worth a fresh dial.
            if (!(error instanceof SupabaseFetchTimeoutError)) {
                throw error;
            }

            reset();
            retireSupabaseDispatcher();

            if (isIdempotentRequest(init)) {
                try {
                    return await runOnce(input, init);
                } catch (retryError) {
                    reset();
                    retireSupabaseDispatcher();
                    throw retryError;
                }
            }
            throw error;
        }
    };
};

/** Resolve Supabase project URL from env (server + legacy Vite names). */
const resolveSupabaseUrl = (): string | undefined => {
    const projectId = process.env.SUPABASE_PROJECT_ID;
    return (
        process.env.SUPABASE_URL ??
        process.env.VITE_SUPABASE_URL ??
        (projectId ? `https://${projectId}.supabase.co` : undefined)
    );
};

/** Resolve Supabase anon key from env (server + legacy Vite names). */
const resolveSupabaseAnonKey = (): string | undefined =>
    process.env.SUPABASE_ANON_KEY ?? process.env.VITE_SUPABASE_ANON_KEY;

/**
 * Drop cached admin and anon clients and the shared connection pool so the
 * next getter builds a fresh fetch session. Timer `TypeError: fetch failed`
 * can otherwise leave later confirm/GET hung until process restart.
 */
export const resetSupabaseAdmin = (): void => {
    adminClient = null;
    anonClient = null;
    retireSupabaseDispatcher();
};

/** Service-role Supabase client — server only, never expose to mobile */
export const getSupabaseAdmin = (): SupabaseClient => {
    if (adminClient) return adminClient;

    const url = resolveSupabaseUrl();
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
        throw new Error('SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY are required on the server');
    }

    adminClient = createClient(url, serviceKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
            fetch: withSupabaseFetchTimeout(undiciFetch as unknown as typeof fetch, resetSupabaseAdmin),
        },
    });
    return adminClient;
};

/** Supabase PostgREST errors surface undici failures as this message. */
export const isSupabaseFetchFailed = (error: unknown): boolean => {
    if (error == null) {
        return false;
    }
    if (typeof error === 'string') {
        return /fetch failed/i.test(error);
    }
    const record = error as { message?: unknown; details?: unknown };
    return (
        /fetch failed/i.test(String(record.message ?? '')) ||
        /fetch failed/i.test(String(record.details ?? ''))
    );
};

/**
 * Anon Supabase client — server only. Used for GoTrue flows that are not admin
 * methods: signInWithOtp, verifyOtp, signInWithIdToken. Never expose to mobile.
 */
export const getSupabaseAnon = (): SupabaseClient => {
    if (anonClient) return anonClient;

    const url = resolveSupabaseUrl();
    const anonKey = resolveSupabaseAnonKey();

    if (!url || !anonKey) {
        throw new Error('SUPABASE_URL and SUPABASE_ANON_KEY are required on the server');
    }

    anonClient = createClient(url, anonKey, {
        auth: { persistSession: false, autoRefreshToken: false },
        global: {
            fetch: withSupabaseFetchTimeout(undiciFetch as unknown as typeof fetch, resetSupabaseAdmin),
        },
    });
    return anonClient;
};

/**
 * GoTrue / PostgREST could not be reached. Distinct from an invalid token:
 * the session is still good, the laptop just lost the database.
 */
export class AuthServiceUnavailableError extends Error {
    constructor(message = 'Auth service unavailable') {
        super(message);
        this.name = 'AuthServiceUnavailableError';
    }
}

type GoTrueErrorLike = {
    name?: string;
    status?: number;
    code?: string;
    message?: string;
};

/** Network / hang / 5xx from GoTrue — not a rejected token. */
export const isGoTrueUnavailable = (error: unknown): boolean => {
    if (error == null) {
        return false;
    }
    if (error instanceof AuthServiceUnavailableError) {
        return true;
    }
    if (isSupabaseTimeoutError(error) || isSupabaseFetchFailed(error)) {
        return true;
    }
    const record = error as GoTrueErrorLike;
    if (record.name === 'AuthRetryableFetchError') {
        return true;
    }
    if (record.code === 'UND_ERR_DESTROYED') {
        return true;
    }
    const status = typeof record.status === 'number' ? record.status : undefined;
    if (status === 0 || (status !== undefined && status >= 500)) {
        return true;
    }
    const message = String(record.message ?? error);
    return /fetch failed|ENOTFOUND|ECONNREFUSED|ETIMEDOUT|UND_ERR_DESTROYED|ClientDestroyedError/i.test(
        message
    );
};

type GoTrueUser = { id: string };

/**
 * Maps a GoTrue `getUser` result: 4xx / missing user → `null` (invalid token);
 * an unreachable service throws so the middleware can answer 503.
 */
export const userFromGoTrueResult = (
    data: { user: GoTrueUser | null } | null,
    error: GoTrueErrorLike | null
): GoTrueUser | null => {
    if (error && isGoTrueUnavailable(error)) {
        throw new AuthServiceUnavailableError(error.message ?? 'Auth service unavailable');
    }
    if (error || !data?.user) {
        return null;
    }
    return data.user;
};

/** Verify Bearer token and return Supabase user */
export const getUserFromAccessToken = async (accessToken: string) => {
    try {
        const client = getSupabaseAnon();
        const { data, error } = await client.auth.getUser(accessToken);
        return userFromGoTrueResult(data, error);
    } catch (error) {
        if (error instanceof AuthServiceUnavailableError) {
            throw error;
        }
        if (isGoTrueUnavailable(error)) {
            throw new AuthServiceUnavailableError(
                error instanceof Error ? error.message : 'Auth service unavailable'
            );
        }
        throw error;
    }
};

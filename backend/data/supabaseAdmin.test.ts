import { describe, expect, it, vi } from 'vitest';
import {
    withSupabaseFetchTimeout,
    resetSupabaseAdmin,
    isSupabaseTimeoutError,
    isGoTrueUnavailable,
    userFromGoTrueResult,
    AuthServiceUnavailableError,
    SupabaseFetchTimeoutError,
    SUPABASE_FETCH_TIMEOUT_MS,
    POOL_DESTROY_FALLBACK_MS,
} from './supabaseAdmin';
import { Agent } from 'undici';

const never = () => new Promise<Response>(() => {});

describe('withSupabaseFetchTimeout', () => {
    it('passes a timeout signal without dropping a caller AbortSignal', async () => {
        const reset = vi.fn();
        const caller = new AbortController();
        const baseFetch = vi.fn(async (_input: string | URL, init?: RequestInit) => {
            expect(init?.signal).toBeDefined();
            expect(init?.signal?.aborted).toBe(false);
            return new Response('ok');
        }) as unknown as typeof fetch;

        const timed = withSupabaseFetchTimeout(baseFetch, reset, 5_000);
        await timed('https://example.test', { signal: caller.signal });

        expect(baseFetch).toHaveBeenCalled();
        expect(reset).not.toHaveBeenCalled();
    });

    it('does not reset the pool on a DNS / fetch failure', async () => {
        const reset = vi.fn();
        const timed = withSupabaseFetchTimeout(
            async () => {
                throw new TypeError('fetch failed');
            },
            reset,
            50,
        );

        await expect(timed('https://example.test')).rejects.toThrow(/fetch failed/);
        expect(reset).not.toHaveBeenCalled();
    });

    it('does not reset the pool on an undici TimeoutError that is not our hang', async () => {
        const reset = vi.fn();
        const timed = withSupabaseFetchTimeout(
            async () => {
                throw Object.assign(new Error('The operation was aborted'), {
                    name: 'TimeoutError',
                });
            },
            reset,
        );

        await expect(timed('https://example.test')).rejects.toThrow(/aborted/);
        expect(reset).not.toHaveBeenCalled();
    });

    it('resetSupabaseAdmin is the callback admin and anon clients wire into fetch', () => {
        expect(typeof resetSupabaseAdmin).toBe('function');
        resetSupabaseAdmin();
    });

    it('rejects with a typed timeout error when the socket never answers', async () => {
        const reset = vi.fn();
        const baseFetch = vi.fn(never) as unknown as typeof fetch;
        const timed = withSupabaseFetchTimeout(baseFetch, reset, 20);

        await expect(timed('https://example.test', { method: 'POST' })).rejects.toBeInstanceOf(
            SupabaseFetchTimeoutError,
        );
        // POST is not idempotent — one attempt, no retry.
        expect(baseFetch).toHaveBeenCalledTimes(1);
        expect(reset).toHaveBeenCalledTimes(1);
    });

    it('retries an idempotent read once on a fresh pool after a timeout', async () => {
        const reset = vi.fn();
        const baseFetch = vi
            .fn()
            .mockImplementationOnce(never)
            .mockImplementationOnce(async () => new Response('ok'));
        const timed = withSupabaseFetchTimeout(baseFetch as unknown as typeof fetch, reset, 20);

        const res = await timed('https://example.test');

        expect(await res.text()).toBe('ok');
        expect(baseFetch).toHaveBeenCalledTimes(2);
        expect(reset).toHaveBeenCalledTimes(1);
    });

    it('gives up after one retry when the read keeps timing out', async () => {
        const reset = vi.fn();
        const baseFetch = vi.fn(never) as unknown as typeof fetch;
        const timed = withSupabaseFetchTimeout(baseFetch, reset, 20);

        await expect(timed('https://example.test')).rejects.toBeInstanceOf(
            SupabaseFetchTimeoutError,
        );
        expect(baseFetch).toHaveBeenCalledTimes(2);
        expect(reset).toHaveBeenCalledTimes(2);
    });

    it('retires the old pool with close so a concurrent request can still resolve', async () => {
        const close = vi.spyOn(Agent.prototype, 'close').mockResolvedValue(undefined);
        const destroy = vi.spyOn(Agent.prototype, 'destroy').mockResolvedValue(undefined);

        try {
            let resolveFirst!: (value: Response) => void;
            const firstResponse = new Promise<Response>((resolve) => {
                resolveFirst = resolve;
            });
            const baseFetch = vi.fn((input: string | URL) => {
                if (String(input).includes('hanging')) {
                    return firstResponse;
                }
                return never();
            }) as unknown as typeof fetch;

            const timed = withSupabaseFetchTimeout(baseFetch, vi.fn(), 20);
            const hanging = timed('https://example.test/hanging');
            const hung = timed('https://example.test/timeout', { method: 'POST' });

            await expect(hung).rejects.toBeInstanceOf(SupabaseFetchTimeoutError);
            expect(close).toHaveBeenCalled();
            expect(destroy).not.toHaveBeenCalled();

            resolveFirst(new Response('ok'));
            const res = await hanging;
            expect(await res.text()).toBe('ok');
        } finally {
            close.mockRestore();
            destroy.mockRestore();
        }
    });
});

describe('isSupabaseTimeoutError', () => {
    it('matches the typed error and its re-wrapped message', () => {
        expect(isSupabaseTimeoutError(new SupabaseFetchTimeoutError())).toBe(true);
        expect(
            isSupabaseTimeoutError(
                new Error('SupabaseFetchTimeoutError: Supabase request exceeded 10000ms'),
            ),
        ).toBe(true);
        expect(isSupabaseTimeoutError(new Error('Supabase request exceeded 10000ms'))).toBe(true);
    });

    it('does not match unrelated errors', () => {
        expect(isSupabaseTimeoutError(new Error('duplicate key value'))).toBe(false);
        expect(isSupabaseTimeoutError(null)).toBe(false);
        expect(isSupabaseTimeoutError('fetch failed')).toBe(false);
    });
});

describe('userFromGoTrueResult', () => {
    it('returns the user when GoTrue accepts the token', () => {
        expect(
            userFromGoTrueResult({ user: { id: 'user_1' } }, null)
        ).toEqual({ id: 'user_1' });
    });

    it('returns null for a 4xx rejected token', () => {
        expect(
            userFromGoTrueResult(
                { user: null },
                { name: 'AuthApiError', status: 401, message: 'invalid JWT' }
            )
        ).toBeNull();
    });

    it('throws AuthServiceUnavailableError on a network / retryable failure', () => {
        expect(() =>
            userFromGoTrueResult(
                { user: null },
                { name: 'AuthRetryableFetchError', status: 0, message: 'fetch failed' }
            )
        ).toThrow(AuthServiceUnavailableError);
    });
});

describe('isGoTrueUnavailable', () => {
    it('matches hangs, DNS failures and destroyed clients', () => {
        expect(isGoTrueUnavailable(new SupabaseFetchTimeoutError())).toBe(true);
        expect(isGoTrueUnavailable(new TypeError('fetch failed'))).toBe(true);
        expect(isGoTrueUnavailable({ code: 'UND_ERR_DESTROYED', message: 'destroyed' })).toBe(
            true
        );
        expect(isGoTrueUnavailable({ status: 503, message: 'upstream' })).toBe(true);
    });

    it('does not match a genuine invalid-token 401', () => {
        expect(
            isGoTrueUnavailable({ name: 'AuthApiError', status: 401, message: 'invalid JWT' })
        ).toBe(false);
        expect(POOL_DESTROY_FALLBACK_MS).toBeGreaterThan(SUPABASE_FETCH_TIMEOUT_MS);
    });
});

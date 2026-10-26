import type { ApiResponse } from '../../../../packages/contracts/src/envelope';
import { API_BASE_URL } from '../lib/config';
import { extractApiErrorFromBody, shouldClearSession } from './extractApiError';
import { tokenStorage } from './tokenStorage';

export class ApiError extends Error {
    constructor(
        message: string,
        readonly status: number,
        readonly errorCode?: string | null,
        readonly data?: unknown,
        readonly requestId?: string | null,
    ) {
        super(message);
        this.name = 'ApiError';
    }
}

type RequestOptions = {
    method?: string;
    body?: unknown;
    auth?: boolean;
    /** Fail the request if the server never answers (order mutations). */
    timeoutMs?: number;
};

const buildUrl = (path: string): string => {
    const base = API_BASE_URL.replace(/\/$/, '');
    const normalized = path.startsWith('/') ? path : `/${path}`;
    return base ? `${base}${normalized}` : normalized;
};

const abortAfter = (timeoutMs: number): AbortSignal => {
    const timeout = (AbortSignal as { timeout?: (ms: number) => AbortSignal }).timeout;
    if (typeof timeout === 'function') {
        return timeout(timeoutMs);
    }
    const controller = new AbortController();
    setTimeout(() => controller.abort(), timeoutMs);
    return controller.signal;
};

export const apiRequest = async <T>(
    path: string,
    options: RequestOptions = {},
): Promise<ApiResponse<T>> => {
    const { method = 'GET', body, auth = true, timeoutMs } = options;
    const headers: Record<string, string> = {
        Accept: 'application/json',
        'Content-Type': 'application/json',
    };

    if (auth) {
        const token = await tokenStorage.getAccessToken();
        if (token) headers.Authorization = `Bearer ${token}`;
    }

    let response: Response;
    try {
        response = await fetch(buildUrl(path), {
            method,
            headers,
            body: body !== undefined ? JSON.stringify(body) : undefined,
            signal: timeoutMs ? abortAfter(timeoutMs) : undefined,
        });
    } catch (err) {
        const name = err instanceof Error ? err.name : '';
        if (typeof __DEV__ !== 'undefined' && __DEV__) {
            // A stale LAN IP / ngrok URL looks exactly like a hung API from the phone.
            console.warn(
                `[apiClient] ${method} ${path} failed (${name || 'network error'}) against base URL "${API_BASE_URL || '(unset)'}"`,
            );
        }
        if (name === 'AbortError' || name === 'TimeoutError') {
            throw new ApiError('That took too long — try again', 0, 'TIMEOUT');
        }
        throw new ApiError('Network request failed — check API URL and server', 0, 'NETWORK_ERROR');
    }

    let json: ApiResponse<T>;
    try {
        json = (await response.json()) as ApiResponse<T>;
    } catch {
        throw new ApiError(
            `Invalid server response (${response.status})`,
            response.status,
            'PARSE_ERROR',
        );
    }

    const failed = !response.ok || json.success === false;
    if (failed) {
        const parsed = extractApiErrorFromBody(json, response.status);
        if (auth && shouldClearSession(response.status, parsed.code)) {
            await tokenStorage.clear();
        }
        throw new ApiError(
            parsed.message,
            response.status,
            parsed.code,
            parsed.data,
            parsed.requestId,
        );
    }

    return json;
};

export const apiGet = <T>(path: string, auth = true) =>
    apiRequest<T>(path, { method: 'GET', auth });

export const apiPost = <T>(path: string, body: unknown, auth = true, timeoutMs?: number) =>
    apiRequest<T>(path, { method: 'POST', body, auth, timeoutMs });

export const apiPatch = <T>(path: string, body: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PATCH', body, auth });

export const apiPut = <T>(path: string, body: unknown, auth = true) =>
    apiRequest<T>(path, { method: 'PUT', body, auth });

export const apiDelete = <T>(path: string, auth = true) =>
    apiRequest<T>(path, { method: 'DELETE', auth });

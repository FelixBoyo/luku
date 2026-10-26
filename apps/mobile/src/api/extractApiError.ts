const isRecord = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

/** Parses BFF flat envelope and nested `{ error: { code, message } }` shapes. */
export const extractApiErrorFromBody = (
    json: unknown,
    status: number,
): { message: string; code: string | null; requestId: string | null; data?: unknown } => {
    const body = isRecord(json) ? json : {};
    const nested = isRecord(body.error) ? body.error : null;

    let message: string | undefined;
    if (nested && typeof nested.message === 'string' && nested.message.trim().length > 0) {
        message = nested.message;
    } else if (typeof body.message === 'string' && body.message.trim().length > 0) {
        message = body.message;
    } else if (typeof body.error === 'string' && body.error.trim().length > 0) {
        message = body.error;
    }

    const code =
        (nested && typeof nested.code === 'string' ? nested.code : null) ||
        (typeof body.errorCode === 'string' ? body.errorCode : null);

    const requestId =
        (nested && typeof nested.requestId === 'string' ? nested.requestId : null) ||
        (typeof body.requestId === 'string' ? body.requestId : null);

    const data = body.data ?? (nested ? nested.details : undefined);

    return {
        message: message ?? `Request failed: ${status}`,
        code,
        requestId,
        data,
    };
};

/** Only a genuine expired/invalid session should log the user out. */
export const shouldClearSession = (status: number, errorCode?: string | null): boolean =>
    status === 401 && errorCode === 'AUTH_TOKEN_EXPIRED';

type LogLevel = 'info' | 'warn' | 'error';

const SECRET_KEY_PATTERN = /(authorization|api[-_]?key|secret|token|password|cookie|set-cookie|x-paystack-signature)/i;
const PHONE_PATTERN = /(?:\+?\d[\d\s\-()]{7,}\d)/g;
const CARD_PATTERN = /\b(?:\d[ -]*?){13,19}\b/g;

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
    typeof value === 'object' && value !== null && !Array.isArray(value);

const sanitizeString = (value: string): string => {
    return value
        .replace(CARD_PATTERN, '[REDACTED_CARD]')
        .replace(PHONE_PATTERN, '[REDACTED_PHONE]');
};

const sanitizeValue = (value: unknown): unknown => {
    if (value === null || value === undefined) {
        return value;
    }

    if (typeof value === 'string') {
        return sanitizeString(value);
    }

    if (value instanceof Error) {
        const extra: Record<string, unknown> = {};
        for (const key of Object.getOwnPropertyNames(value)) {
            if (key === 'name' || key === 'message' || key === 'stack') {
                continue;
            }
            extra[key] = sanitizeValue((value as unknown as Record<string, unknown>)[key]);
        }
        return {
            name: value.name,
            message: sanitizeString(value.message || 'Unknown error'),
            ...(process.env.NODE_ENV === 'production' ? {} : { stack: value.stack }),
            ...extra,
        };
    }

    if (Array.isArray(value)) {
        return value.map((item) => sanitizeValue(item));
    }

    if (isPlainObject(value)) {
        const out: Record<string, unknown> = {};
        for (const [key, val] of Object.entries(value)) {
            if (SECRET_KEY_PATTERN.test(key)) {
                out[key] = '[REDACTED]';
            } else if (typeof val === 'string' && key.toLowerCase() === 'body') {
                out[key] = '[REDACTED_BODY]';
            } else {
                out[key] = sanitizeValue(val);
            }
        }
        return out;
    }

    return value;
};

const write = (level: LogLevel, message: string, context?: Record<string, unknown>): void => {
    const payload = context ? sanitizeValue(context) : undefined;

    if (level === 'error') {
        console.error(message, payload);
        return;
    }

    if (level === 'warn') {
        console.warn(message, payload);
        return;
    }

    console.info(message, payload);
};

export const safeLogger = {
    info: (message: string, context?: Record<string, unknown>): void => {
        write('info', message, context);
    },
    warn: (message: string, context?: Record<string, unknown>): void => {
        write('warn', message, context);
    },
    error: (message: string, context?: Record<string, unknown>): void => {
        write('error', message, context);
    },
};

export const sanitizeForLogs = (value: unknown): unknown => sanitizeValue(value);

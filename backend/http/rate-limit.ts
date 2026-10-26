import type { NextFunction, Request, Response } from 'express';
import { sendApiError } from './error';

export interface InMemoryRateLimitOptions {
    windowMs: number;
    maxRequests: number;
}

interface Entry {
    count: number;
    resetAt: number;
}

const getRequestKey = (req: Request): string => {
    const forwardedFor = req.headers['x-forwarded-for'];
    if (typeof forwardedFor === 'string' && forwardedFor.length > 0) {
        return forwardedFor.split(',')[0].trim();
    }
    return req.ip || 'unknown';
};

export const createInMemoryRateLimit = ({
    windowMs,
    maxRequests,
}: InMemoryRateLimitOptions) => {
    const entries = new Map<string, Entry>();

    return (req: Request, res: Response, next: NextFunction): void => {
        const now = Date.now();
        const key = getRequestKey(req);
        const existing = entries.get(key);

        if (!existing || existing.resetAt <= now) {
            entries.set(key, { count: 1, resetAt: now + windowMs });
            next();
            return;
        }

        existing.count += 1;
        if (existing.count > maxRequests) {
            sendApiError(res, 429, {
                code: 'RATE_LIMITED',
                message: 'Too many requests. Please try again later.',
                details: {
                    windowMs,
                    maxRequests,
                },
            });
            return;
        }

        next();
    };
};

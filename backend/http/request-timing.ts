import type { NextFunction, Request, Response } from 'express';

export const SLOW_REQUEST_MS = 5_000;

type TimingLogger = {
    info: (message: string) => void;
    warn: (message: string) => void;
};

/**
 * One line per request so a phone that "hangs" can be matched against what the
 * API actually did: finished slowly, finished normally, or never answered.
 * The query string is dropped because it can carry references and tokens.
 */
export const createRequestTimingMiddleware =
    (logger: TimingLogger = console, now: () => number = Date.now) =>
    (req: Request, res: Response, next: NextFunction): void => {
        const startedAt = now();
        const path = (req.originalUrl || req.url).split('?')[0];
        let finished = false;

        const describe = () => {
            const requestId = res.locals?.requestId;
            const suffix = requestId ? ` rid=${requestId}` : '';
            return `[HTTP] ${req.method} ${path} ${res.statusCode} ${now() - startedAt}ms${suffix}`;
        };

        res.on('finish', () => {
            finished = true;
            const line = describe();
            if (now() - startedAt > SLOW_REQUEST_MS) {
                logger.warn(`${line} (slow)`);
            } else {
                logger.info(line);
            }
        });

        res.on('close', () => {
            if (!finished) {
                logger.warn(`${describe()} (closed before a response was sent)`);
            }
        });

        next();
    };

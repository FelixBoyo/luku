import { randomUUID } from 'crypto';
import type { NextFunction, Request, Response } from 'express';

export const REQUEST_ID_HEADER = 'x-request-id';

const normalizeRequestId = (value: string | undefined): string | null => {
    if (!value) {
        return null;
    }

    const trimmed = value.trim();
    return trimmed.length > 0 ? trimmed : null;
};

export const getRequestId = (req: Request): string => {
    const existingRequestId = normalizeRequestId(req.header(REQUEST_ID_HEADER));
    if (existingRequestId) {
        return existingRequestId;
    }

    return randomUUID();
};

export const requestIdMiddleware = (
    req: Request,
    res: Response,
    next: NextFunction
): void => {
    const requestId = getRequestId(req);
    res.locals.requestId = requestId;
    res.setHeader(REQUEST_ID_HEADER, requestId);
    next();
};

import type { Response } from 'express';

export interface ApiErrorShape {
    code: string;
    message: string;
    details?: unknown;
}

export const sendApiError = (
    res: Response,
    status: number,
    error: ApiErrorShape
): Response => {
    const requestId =
        typeof res.locals?.requestId === 'string' ? res.locals.requestId : undefined;

    if (error.details === undefined) {
        return res.status(status).json({
            error: {
                code: error.code,
                message: error.message,
                ...(requestId ? { requestId } : {}),
            },
        });
    }

    return res.status(status).json({
        error: {
            ...error,
            ...(requestId ? { requestId } : {}),
        },
    });
};

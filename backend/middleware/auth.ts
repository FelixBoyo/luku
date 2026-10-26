import type { Request, Response, NextFunction } from 'express';
import { getUserFromAccessToken } from '../data/supabaseAdmin';
import { createErrorResponse } from '../lib/envelope';

export type AuthenticatedRequest = Request & {
    userId?: string;
    accessToken?: string;
};

export const verifyToken = async (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction,
): Promise<void> => {
    const header = req.headers.authorization;
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined;

    if (!token) {
        res.status(401).json(
            createErrorResponse('No token provided', 401, 'AUTH_UNAUTHORIZED'),
        );
        return;
    }

    try {
        const user = await getUserFromAccessToken(token);
        if (!user) {
            res.status(401).json(
                createErrorResponse('Invalid or expired token', 401, 'AUTH_TOKEN_EXPIRED'),
            );
            return;
        }
        req.userId = user.id;
        req.accessToken = token;
        next();
    } catch {
        res.status(503).json(
            createErrorResponse("Can't reach the server, try again", 503, 'AUTH_UNAVAILABLE'),
        );
    }
};

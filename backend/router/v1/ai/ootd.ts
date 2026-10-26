import { Router, type Response } from 'express';
import { createResponse, createErrorResponse } from '../../../lib/envelope';
import { verifyToken, type AuthenticatedRequest } from '../../../middleware/auth';
import { getOotd } from '../../../ai/tasks/ootd';
import type { OotdRefreshRequest } from '../../../../packages/contracts/src/ai';

const router = Router();

router.get(
    '/ootd',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.userId) {
            res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
            return;
        }

        try {
            const refreshParam = req.query.refresh === 'true' || req.query.refresh === '1';
            const weather = typeof req.query.weather === 'string' ? req.query.weather : undefined;
            const refreshReq: OotdRefreshRequest = { refresh: refreshParam, weather };

            const response = await getOotd(req.userId, refreshReq);
            res.json(createResponse(response, 'Outfit of the day retrieved'));
        } catch (error: any) {
            res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve outfit of the day'));
        }
    },
);

export default router;

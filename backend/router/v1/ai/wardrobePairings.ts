import { Router, type Response } from 'express';
import { createResponse, createErrorResponse } from '../../../lib/envelope';
import { verifyToken, type AuthenticatedRequest } from '../../../middleware/auth';
import { getWardrobePairings } from '../../../ai/tasks/wardrobePairings';

const router = Router();

router.get(
    '/wardrobe-pairings',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.userId) {
            res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
            return;
        }

        try {
            const response = await getWardrobePairings(req.userId);
            res.json(createResponse(response, 'Wardrobe pairings retrieved'));
        } catch (error: any) {
            res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve wardrobe pairings'));
        }
    },
);

export default router;

import { Router, type Response } from 'express';
import { createResponse, createErrorResponse } from '../../../lib/envelope';
import { verifyToken, type AuthenticatedRequest } from '../../../middleware/auth';
import { getRecommendations } from '../../../ai/tasks/recommendations';
import type { RecommendationsQuery } from '../../../../packages/contracts/src/ai';

const router = Router();

router.get(
    '/recommendations',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.userId) {
            res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
            return;
        }

        try {
            const query: RecommendationsQuery = {
                section: typeof req.query.section === 'string' ? (req.query.section as any) : undefined,
                category: typeof req.query.category === 'string' ? req.query.category : undefined,
                limit: req.query.limit ? Number(req.query.limit) : undefined,
            };

            const response = await getRecommendations(req.userId, query);
            res.json(createResponse(response, 'Recommendations retrieved'));
        } catch (error: any) {
            res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve recommendations'));
        }
    },
);

export default router;

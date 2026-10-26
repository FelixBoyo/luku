import { Router, type Response } from 'express';
import type { OutfitSuggestionsRequest } from '../../../../packages/contracts/src/ai/outfitSuggestions';
import { createResponse, createErrorResponse } from '../../../lib/envelope';
import { verifyToken, type AuthenticatedRequest } from '../../../middleware/auth';
import { getOutfitSuggestions } from '../../../ai/tasks/outfitSuggestions';

const router = Router();

router.post(
    '/outfit-suggestions',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.userId) {
            res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
            return;
        }

        try {
            const body = req.body as OutfitSuggestionsRequest;
            const response = await getOutfitSuggestions(req.userId, body);
            res.json(createResponse(response, 'Outfit suggestions retrieved'));
        } catch (error: any) {
            res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve outfit suggestions'));
        }
    },
);


export default router;

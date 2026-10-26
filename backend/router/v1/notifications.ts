import { Router, type Response } from 'express';
import { verifyToken, type AuthenticatedRequest } from '../../middleware/auth';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { getNotifications } from '../../services/notificationsService';
import { registerPushToken } from '../../services/pushService';

const router = Router();

router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const list = await getNotifications(req.userId);
        res.json(createResponse(list, 'Notifications retrieved'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve notifications'));
    }
});

router.post('/tokens', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const { token } = req.body;
        if (!token || typeof token !== 'string') {
            res.status(400).json(createErrorResponse('Token is required and must be a string', 400, 'VALIDATION_FAILED'));
            return;
        }

        await registerPushToken(req.userId, token);
        res.json(createResponse({ success: true }, 'Push token registered successfully'));
    } catch (error: any) {
        res.status(400).json(createErrorResponse(error.message || 'Failed to register push token'));
    }
});

export default router;

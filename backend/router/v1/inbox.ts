import { Router, type Response } from 'express';
import { verifyToken, type AuthenticatedRequest } from '../../middleware/auth';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import {
    listThreads,
    getMessages,
    sendMessage,
    markAsRead,
    getUnreadCount,
    getOrCreateThreadWithUser,
} from '../../services/inboxService';
import type { SendMessageRequest } from '../../../packages/contracts/src/inbox';

const router = Router();

router.get('/threads', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const threads = await listThreads(req.userId);
        res.json(createResponse(threads, 'Threads retrieved'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve threads'));
    }
});

router.get('/unread-count', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const count = await getUnreadCount(req.userId);
        res.json(createResponse(count, 'Unread count retrieved'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve unread count'));
    }
});

router.post('/threads/with/:userId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const { userId: otherUserId } = req.params;
        const thread = await getOrCreateThreadWithUser(req.userId, otherUserId);
        res.json(createResponse(thread, 'Thread ready'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to start conversation'));
    }
});

router.get('/threads/:threadId/messages', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const { threadId } = req.params;
        const messages = await getMessages(req.userId, threadId);
        res.json(createResponse(messages, 'Messages retrieved'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve messages'));
    }
});

router.post('/threads/:threadId/messages', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const { threadId } = req.params;
        const body = req.body as SendMessageRequest;

        if (!body.text || !body.text.trim()) {
            res.status(400).json(createErrorResponse('Message text is required', 400, 'VALIDATION_FAILED'));
            return;
        }

        const message = await sendMessage(req.userId, threadId, body.text);
        res.status(201).json(createResponse(message, 'Message sent successfully'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to send message'));
    }
});

router.post('/threads/:threadId/read', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const { threadId } = req.params;
        await markAsRead(req.userId, threadId);
        res.json(createResponse(null, 'Thread marked as read'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to mark thread as read'));
    }
});

export default router;

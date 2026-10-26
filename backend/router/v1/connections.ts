import { Router, type Response } from 'express';
import type { BlockRequest, FollowRequest } from '../../../packages/contracts/src/connections';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { verifyToken, type AuthenticatedRequest } from '../../middleware/auth';
import {
    block,
    follow,
    getBlocked,
    getFollowers,
    getFollowing,
    unfollow,
    unblock,
} from '../../services/connectionsService';

const router = Router();

router.get('/followers', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const followers = await getFollowers(req.userId);
        res.json(createResponse(followers, 'Followers retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list followers';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.get('/following', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const following = await getFollowing(req.userId);
        res.json(createResponse(following, 'Following retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list following';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.get('/blocked', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const blocked = await getBlocked(req.userId);
        res.json(createResponse(blocked, 'Blocked users retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to list blocked users';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.post('/follow', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    const { userId } = req.body as FollowRequest;
    if (!userId) {
        res.status(400).json(
            createErrorResponse('userId is required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        await follow(req.userId, userId);
        res.status(201).json(createResponse(null, 'Followed'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Follow failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

router.delete('/follow/:userId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        await unfollow(req.userId, req.params.userId);
        res.json(createResponse(null, 'Unfollowed'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unfollow failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

router.post('/block', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    const { userId } = req.body as BlockRequest;
    if (!userId) {
        res.status(400).json(
            createErrorResponse('userId is required', 400, 'VALIDATION_FAILED'),
        );
        return;
    }

    try {
        await block(req.userId, userId);
        res.status(201).json(createResponse(null, 'Blocked'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Block failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

router.delete('/block/:userId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        await unblock(req.userId, req.params.userId);
        res.json(createResponse(null, 'Unblocked'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Unblock failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

export default router;

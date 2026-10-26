import { Router, type Response } from 'express';
import type { ProfilePatchRequest, UserProfileDto } from '../../../packages/contracts/src/auth';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { verifyToken, type AuthenticatedRequest } from '../../middleware/auth';
import { fetchProfile, fetchProfileById, patchProfile, searchProfiles } from '../../services/profileService';

const router = Router();

router.patch('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const body = req.body as ProfilePatchRequest;
        const updated = await patchProfile(req.userId, body);
        res.json(createResponse<UserProfileDto>(updated, 'Profile updated'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Profile update failed';
        res.status(400).json(createErrorResponse(message, 400, 'VALIDATION_FAILED'));
    }
});

router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const profile = await fetchProfile(req.userId);
        if (!profile) {
            res.status(404).json(createErrorResponse('Profile not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(profile, 'Profile retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch profile';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.get('/search', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const q = typeof req.query.q === 'string' ? req.query.q : '';
        const profiles = await searchProfiles(q, req.userId);
        res.json(createResponse(profiles, 'Profiles retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Profile search failed';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.get('/:userId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const profile = await fetchProfileById(req.params.userId);
        if (!profile) {
            res.status(404).json(createErrorResponse('Profile not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(profile, 'Profile retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch profile';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

export default router;

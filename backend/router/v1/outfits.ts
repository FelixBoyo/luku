import { Router, type Response } from 'express';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { type AuthenticatedRequest, verifyToken } from '../../middleware/auth';
import {
    getOutfits,
    getOutfitById,
    createOutfit,
    updateOutfit,
    deleteOutfit,
} from '../../services/outfitsService';

const router = Router();

router.use(verifyToken);

// GET /v1/api/outfits?kind=created|inspiration
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const kind = typeof req.query.kind === 'string' ? req.query.kind : undefined;
        const outfits = await getOutfits(userId, kind);
        res.json(createResponse(outfits, 'Outfits retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch outfits';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// GET /v1/api/outfits/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const outfit = await getOutfitById(req.params.id, req.userId!);
        if (!outfit) {
            res.status(404).json(createErrorResponse('Outfit not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(outfit, 'Outfit retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch outfit';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// POST /v1/api/outfits
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const outfit = await createOutfit(req.userId!, req.body);
        res.status(201).json(createResponse(outfit, 'Outfit created'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create outfit';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// PUT /v1/api/outfits/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const outfit = await updateOutfit(req.params.id, req.userId!, req.body);
        if (!outfit) {
            res.status(404).json(createErrorResponse('Outfit not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(outfit, 'Outfit updated'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update outfit';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// DELETE /v1/api/outfits/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        await deleteOutfit(req.params.id, req.userId!);
        res.json(createResponse(null, 'Outfit deleted'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete outfit';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

export default router;
import { Router, type Request, type Response } from 'express';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { type AuthenticatedRequest, verifyToken } from '../../middleware/auth';
import {
    getWardrobeItems,
    getWardrobeItemById,
    createWardrobeItem,
    updateWardrobeItem,
    deleteWardrobeItem,
    logWear,
} from '../../services/wardrobeService';

const router = Router();

// apply auth to all wardrobe routes
router.use(verifyToken);

// GET /v1/wardrobe
router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const items = await getWardrobeItems(userId);
        res.json(createResponse(items, 'Wardrobe retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch wardrobe';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// GET /v1/wardrobe/:id
router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const item = await getWardrobeItemById(req.params.id, req.userId!);
        if (!item) {
            res.status(404).json(createErrorResponse('Item not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(item, 'Item retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to fetch item';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// POST /v1/wardrobe
router.post('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const item = await createWardrobeItem(req.userId!, req.body);
        res.status(201).json(createResponse(item, 'Item created'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to create item';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// PUT /v1/wardrobe/:id
router.put('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const item = await updateWardrobeItem(req.params.id, req.userId!, req.body);
        if (!item) {
            res.status(404).json(createErrorResponse('Item not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(item, 'Item updated'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to update item';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// DELETE /v1/wardrobe/:id
router.delete('/:id', async (req: AuthenticatedRequest, res: Response) => {
    try {
        await deleteWardrobeItem(req.params.id, req.userId!);
        res.json(createResponse(null, 'Item deleted'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to delete item';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

// POST /v1/wardrobe/:id/wear
router.post('/:id/wear', async (req: AuthenticatedRequest, res: Response) => {
    try {
        await logWear(req.params.id, req.userId!, req.body.occasion);
        res.json(createResponse(null, 'Wear logged'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to log wear';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

export default router;
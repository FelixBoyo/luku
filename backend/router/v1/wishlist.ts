import { Router, type Response } from 'express';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { getWishlist, addWishlistItem, removeWishlistItem } from '../../services/wishlistService';
import { verifyToken, type AuthenticatedRequest } from '../../middleware/auth';

const router = Router();

router.use(verifyToken);

router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const result = await getWishlist(userId);
        res.json(createResponse(result, 'Wishlist retrieved'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to retrieve wishlist';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.post('/:productId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const productId = req.params.productId;
        await addWishlistItem(userId, productId);
        res.json(createResponse(null, 'Added to wishlist'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to add to wishlist';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

router.delete('/:productId', async (req: AuthenticatedRequest, res: Response) => {
    try {
        const userId = req.userId!;
        const productId = req.params.productId;
        await removeWishlistItem(userId, productId);
        res.json(createResponse(null, 'Removed from wishlist'));
    } catch (error) {
        const message = error instanceof Error ? error.message : 'Failed to remove from wishlist';
        res.status(500).json(createErrorResponse(message, 500));
    }
});

export default router;

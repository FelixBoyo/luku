import { Router, type Response } from 'express';
import { verifyToken, type AuthenticatedRequest } from '../../middleware/auth';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import {
    getCart,
    addToCart,
    updateCartQty,
    deleteCartItem,
    clearCart,
    CannotBuyOwnItemError,
} from '../../services/cartService';
import type { AddToCartRequest, UpdateCartQtyRequest } from '../../../packages/contracts/src/cart';

const router = Router();

router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const items = await getCart(req.userId);
        res.json(createResponse(items, 'Cart retrieved'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve cart'));
    }
});

router.post('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const body = req.body as AddToCartRequest;
        if (!body.productId) {
            res.status(400).json(createErrorResponse('Product ID is required', 400, 'VALIDATION_FAILED'));
            return;
        }

        const item = await addToCart(req.userId, body.productId, body.quantity ?? 1);
        res.json(createResponse(item, 'Item added to cart'));
    } catch (error: any) {
        if (error instanceof CannotBuyOwnItemError) {
            res.status(400).json(createErrorResponse(error.message, 400, 'CANNOT_BUY_OWN_ITEM'));
            return;
        }
        res.status(500).json(createErrorResponse(error.message || 'Failed to add item to cart'));
    }
});

router.put('/:productId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const { productId } = req.params;
        const body = req.body as UpdateCartQtyRequest;

        if (body.quantity === undefined) {
            res.status(400).json(createErrorResponse('Quantity is required', 400, 'VALIDATION_FAILED'));
            return;
        }

        const item = await updateCartQty(req.userId, productId, body.quantity);
        res.json(createResponse(item, 'Cart item quantity updated'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to update quantity'));
    }
});

router.delete('/:productId', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const { productId } = req.params;
        await deleteCartItem(req.userId, productId);
        res.json(createResponse(null, 'Cart item deleted'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to delete cart item'));
    }
});

router.delete('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        await clearCart(req.userId);
        res.json(createResponse(null, 'Cart cleared'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to clear cart'));
    }
});

export default router;

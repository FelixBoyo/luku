import { Router, type Response } from 'express';
import { verifyToken, type AuthenticatedRequest } from '../../middleware/auth';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import {
    getOrders,
    getOrderById,
    createOrder,
    resolvePaymentReference,
    ServiceRoleWriteError,
} from '../../services/ordersService';
import { RequestValidationError, validateCreateOrderBody } from '../../http/validation';
import { SingleSellerViolationError } from '../../services/sellerKey';
import { CannotBuyOwnItemError } from '../../services/cannotBuyOwnItem';
import {
    getPayoutDetails,
    PayoutDetailsRequiredError,
} from '../../services/payoutDetailsService';
import { safeLogger } from '../../http/redact';
import { confirmOrderDelivery, reportOrderProblem, markOrderShipped } from '../../services/orderStateMachine';
import { sendOrderTransitionError } from '../../http/orderTransitionError';

const router = Router();

router.get('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const list = await getOrders(req.userId);
        res.json(createResponse(list, 'Orders retrieved'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve orders'));
    }
});

router.get('/:id', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const { id } = req.params;
        const order = await getOrderById(req.userId, id);
        if (!order) {
            res.status(404).json(createErrorResponse('Order not found', 404, 'ROUTE_NOT_FOUND'));
            return;
        }
        res.json(createResponse(order, 'Order retrieved'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to retrieve order'));
    }
});

router.post('/', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const body = validateCreateOrderBody(req.body);
        const order = await createOrder(req.userId, body);
        res.status(201).json(createResponse(order, 'Order created successfully'));
    } catch (error: any) {
        if (error instanceof RequestValidationError) {
            res.status(400).json(
                createErrorResponse(error.message, 400, 'VALIDATION_FAILED', error.details)
            );
            return;
        }

        if (error instanceof SingleSellerViolationError) {
            res.status(400).json(
                createErrorResponse(error.message, 400, 'MULTI_SELLER_NOT_ALLOWED')
            );
            return;
        }

        if (error instanceof CannotBuyOwnItemError) {
            res.status(400).json(
                createErrorResponse(error.message, 400, 'CANNOT_BUY_OWN_ITEM')
            );
            return;
        }

        // The buyer has already been charged at this point, so the log has to
        // carry the reference that reconciliation will need, plus the Postgres
        // code — the message alone sent one investigation down the wrong path.
        if (error instanceof ServiceRoleWriteError) {
            safeLogger.error('[Orders] Service-role write rejected after charge', {
                reference: resolvePaymentReference(req.body ?? {}),
                pgCode: error.pgCode,
                reason: error.message,
            });
            res.status(503).json(createErrorResponse(error.message, 503, 'SERVER_MISCONFIGURED'));
            return;
        }

        res.status(500).json(createErrorResponse(error.message || 'Failed to create order'));
    }   
});

router.post('/:id/ship', verifyToken, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.userId) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    try {
        const payout = await getPayoutDetails(req.userId);
        if (!payout) {
            throw new PayoutDetailsRequiredError();
        }
        await markOrderShipped(req.params.id, req.userId);
        res.json(createResponse(null, 'Order marked as shipped'));
    } catch (error) {
        sendOrderTransitionError(res, error);
    }
});

/**
 * Buyer confirms they received the item: `shipped -> delivered`, which lets
 * release / payout proceed. `:id` is the payment reference (the app's order
 * id). Ownership and legality are enforced by the state machine, not here.
 */
router.post(
    '/:id/confirm-receipt',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.userId) {
            res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
            return;
        }

        try {
            await confirmOrderDelivery(req.params.id, req.userId);
            res.json(createResponse({ ok: true }, 'Receipt confirmed'));
        } catch (error) {
            sendOrderTransitionError(res, error);
        }
    }
);

/**
 * Buyer reports a problem: `shipped | in_escrow -> disputed`, which pauses the
 * auto timers and hands the order to ops / refund. Same contract as above.
 */
router.post(
    '/:id/dispute',
    verifyToken,
    async (req: AuthenticatedRequest, res: Response) => {
        if (!req.userId) {
            res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
            return;
        }

        try {
            await reportOrderProblem(req.params.id, req.userId);
            res.json(createResponse({ ok: true }, 'Dispute opened'));
        } catch (error) {
            sendOrderTransitionError(res, error);
        }
    }
);

export default router;

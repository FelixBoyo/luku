import { Router, type Request, type Response, type NextFunction } from 'express';
import { createResponse, createErrorResponse } from '../../lib/envelope';
import { runReconciliation } from '../../payments/reconciliationService';
import { getStuckOrders } from '../../services/ordersService';
import { processEscrowTimers } from '../../services/timersService';
import { statusRepairPort } from '../../services/statusRepair';

const router = Router();

const requireInternalSecret = (req: Request, res: Response, next: NextFunction): void => {
    const expected = process.env.RECONCILE_SECRET;
    if (!expected) {
        res.status(503).json(
            createErrorResponse('RECONCILE_SECRET is not configured', 503, 'PAYMENTS_CONFIG_ERROR')
        );
        return;
    }

    const headerSecret =
        (req.headers['x-reconcile-secret'] as string | undefined) ||
        (typeof req.headers.authorization === 'string' &&
        req.headers.authorization.startsWith('Bearer ')
            ? req.headers.authorization.slice('Bearer '.length)
            : undefined);

    if (!headerSecret || headerSecret !== expected) {
        res.status(401).json(createErrorResponse('Unauthorized', 401, 'AUTH_UNAUTHORIZED'));
        return;
    }

    next();
};

/**
 * POST /v1/api/internal/reconcile
 * Protected by RECONCILE_SECRET (header x-reconcile-secret or Authorization: Bearer …).
 * Cron-ready. C-CORE-6b injects `statusRepairPort` so Verify-success can
 * promote a stuck order `paid → in_escrow`. Orphan captures with no order
 * stay flag-only.
 */
router.post('/reconcile', requireInternalSecret, async (req: Request, res: Response) => {
    try {
        const stalePendingMinutes =
            typeof req.body?.stalePendingMinutes === 'number'
                ? req.body.stalePendingMinutes
                : undefined;
        const limit = typeof req.body?.limit === 'number' ? req.body.limit : undefined;

        const summary = await runReconciliation({
            stalePendingMinutes,
            limit,
            statusRepair: statusRepairPort,
        });

        res.json(createResponse(summary, 'Reconciliation complete'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Reconciliation failed'));
    }
});

/**
 * GET /v1/api/internal/stuck-orders
 * Returns orders that are disputed, or past their SLAs (ship_by_at, auto_release_at).
 */
router.get('/stuck-orders', requireInternalSecret, async (req: Request, res: Response) => {
    try {
        const orders = await getStuckOrders();
        res.json(createResponse(orders, 'Stuck orders retrieved'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to fetch stuck orders'));
    }
});

/**
 * POST /v1/api/internal/timers/process
 * Cron-ready endpoint to process escrow reminders and auto-transitions.
 */
router.post('/timers/process', requireInternalSecret, async (req: Request, res: Response) => {
    try {
        await processEscrowTimers();
        res.json(createResponse({ success: true }, 'Timers processed successfully'));
    } catch (error: any) {
        res.status(500).json(createErrorResponse(error.message || 'Failed to process timers'));
    }
});

export default router;

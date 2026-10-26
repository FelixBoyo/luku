import { describe, expect, it, vi, beforeEach, afterEach } from 'vitest';
import type { Request, Response, NextFunction } from 'express';
import internalRouter from './internal';
import { getStuckOrders } from '../../services/ordersService';

vi.mock('../../payments/reconciliationService', () => ({
    runReconciliation: vi.fn().mockResolvedValue({ scanned: 0 }),
}));

vi.mock('../../services/statusRepair', () => ({
    statusRepairPort: {},
}));

vi.mock('../../services/ordersService', () => ({
    getStuckOrders: vi.fn().mockResolvedValue([
        { id: 'pi_disputed', escrowStatus: 'disputed' },
        { id: 'pi_late', escrowStatus: 'in_escrow' },
    ]),
}));

vi.mock('../../services/timersService', () => ({
    processEscrowTimers: vi.fn().mockResolvedValue(undefined),
}));

const mockRes = () => {
    const res: Partial<Response> & { statusCode?: number; body?: unknown } = {};
    res.status = vi.fn((code: number) => {
        res.statusCode = code;
        return res as Response;
    });
    res.json = vi.fn((body: unknown) => {
        res.body = body;
        return res as Response;
    });
    return res as Response & { statusCode?: number; body?: any };
};

const invoke = (
    method: 'get' | 'post',
    path: string,
    req: Partial<Request>
): Promise<Response & { statusCode?: number; body?: any }> => {
    const layer = internalRouter.stack.find(
        (entry: any) => entry.route?.path === path && entry.route?.methods?.[method]
    );
    if (!layer?.route) {
        throw new Error(`No ${method.toUpperCase()} ${path} on internal router`);
    }
    const route = layer.route;
    const res = mockRes();
    return new Promise((resolve, reject) => {
        const finish = () => resolve(res);
        res.json = vi.fn((body: unknown) => {
            res.body = body;
            finish();
            return res;
        });
        const maybeNext = (error?: unknown) => {
            if (error) {
                reject(error);
                return;
            }
            const handlers = route.stack.map((s: any) => s.handle);
            const run = (index: number) => {
                const handler = handlers[index];
                if (!handler) {
                    finish();
                    return;
                }
                const next: NextFunction = (err?: unknown) => {
                    if (err) {
                        reject(err);
                        return;
                    }
                    run(index + 1);
                };
                try {
                    const result = handler(req as Request, res, next);
                    if (result && typeof result.then === 'function') {
                        result.then(() => undefined).catch(reject);
                    }
                } catch (err) {
                    reject(err);
                }
            };
            run(0);
        };
        maybeNext();
    });
};

describe('internal routes', () => {
    beforeEach(() => {
        vi.stubEnv('RECONCILE_SECRET', 'test-reconcile-secret');
        vi.clearAllMocks();
    });

    afterEach(() => {
        vi.unstubAllEnvs();
    });

    it('rejects stuck-orders without the reconcile secret', async () => {
        const res = await invoke('get', '/stuck-orders', { headers: {}, method: 'GET' });
        expect(res.status).toHaveBeenCalledWith(401);
        expect(res.body.errorCode).toBe('AUTH_UNAUTHORIZED');
        expect(getStuckOrders).not.toHaveBeenCalled();
    });

    it('returns disputed and SLA-breached orders when authorized', async () => {
        const res = await invoke('get', '/stuck-orders', {
            headers: { 'x-reconcile-secret': 'test-reconcile-secret' },
            method: 'GET',
        });
        expect(res.status).not.toHaveBeenCalledWith(401);
        expect(getStuckOrders).toHaveBeenCalled();
        expect(res.body.data.map((row: { id: string }) => row.id)).toEqual([
            'pi_disputed',
            'pi_late',
        ]);
    });
});

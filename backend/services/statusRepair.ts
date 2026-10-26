import {
    transitionOrder,
    OrderNotFoundError,
    IllegalOrderTransitionError,
} from './orderStateMachine';
import type { StatusRepairPort } from '../payments/reconciliationService';

/**
 * C-CORE-6b — the port John's reconciler injects when Paystack Verify says a
 * payment succeeded but the order never advanced (a `charge.success` webhook
 * that never arrived). It drives the same `pending_payment -> paid ->
 * in_escrow` chain the webhook runs and nothing else: it never creates an
 * order, so orphan success payments with no order stay flag-only (6a).
 *
 * Idempotency is the contract. The reconciler re-runs over the same rows, so
 * an order already past `paid` must be reported as repaired (`ok: true`), not
 * as a failure. Each step is attempted independently — an order already at
 * `paid` (created by the app's M-Pesa poll) is still promoted into escrow, and
 * a genuinely absent order is the one case that returns `ok: false`.
 */
export const statusRepairPort: StatusRepairPort = {
    async markPaidFromProvider({ reference }) {
        const paid = await advance(reference, 'paid', 'webhook');
        if (paid === 'missing') {
            return { ok: false, reason: 'order_not_found' };
        }

        await advance(reference, 'in_escrow', 'system');
        return { ok: true };
    },
};

type AdvanceOutcome = 'moved' | 'already' | 'missing';

/**
 * One best-effort transition. `OrderNotFoundError` -> `missing`,
 * `IllegalOrderTransitionError` (already at or past `toStatus`) -> `already`.
 * Any other error propagates so the reconciler records a real failure.
 */
const advance = async (
    reference: string,
    toStatus: 'paid' | 'in_escrow',
    actor: 'webhook' | 'system'
): Promise<AdvanceOutcome> => {
    try {
        await transitionOrder({ orderId: reference, toStatus, actor });
        return 'moved';
    } catch (err) {
        if (err instanceof OrderNotFoundError) return 'missing';
        if (err instanceof IllegalOrderTransitionError) return 'already';
        throw err;
    }
};

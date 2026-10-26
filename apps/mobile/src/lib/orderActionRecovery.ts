import type { OrderStatus } from '../../../../packages/contracts/src/orders';

/**
 * When an order mutation times out or reports a conflict, the server may have
 * applied it anyway (the phone gave up first, or a double-tap won). Refetching
 * and checking the status tells the buyer the truth instead of asking them to
 * restart the API and retry.
 *
 * Kept free of react-native imports so unit tests can import it under Vitest.
 */
export type OrderAction = 'confirm-receipt' | 'dispute' | 'ship';

const ACTION_TARGET_STATUSES: Record<OrderAction, OrderStatus[]> = {
    'confirm-receipt': ['delivered', 'released', 'completed'],
    dispute: ['disputed'],
    ship: ['shipped', 'delivered', 'released', 'completed'],
};

type ErrorLike = { status: number; errorCode?: string | null };

/** Errors after which the mutation may still have landed server-side. */
export const shouldRecheckOrderAfterError = (err: ErrorLike): boolean =>
    err.errorCode === 'TIMEOUT' ||
    err.errorCode === 'ESCROW_BACKEND_TIMEOUT' ||
    err.errorCode === 'AUTH_UNAVAILABLE' ||
    err.status === 409;

export const orderReachedActionTarget = (
    action: OrderAction,
    escrowStatus: OrderStatus | undefined
): boolean => (escrowStatus ? ACTION_TARGET_STATUSES[action].includes(escrowStatus) : false);

import type { Response } from 'express';
import { createErrorResponse } from '../lib/envelope';
import {
    OrderNotFoundError,
    IllegalOrderTransitionError,
    UnauthorizedOrderTransitionError,
} from '../services/orderStateMachine';
import { PayoutDetailsRequiredError } from '../services/payoutDetailsService';
import { isSupabaseTimeoutError } from '../data/supabaseAdmin';

/**
 * Shared error mapping for the buyer/seller order-transition routes
 * (`/:id/ship`, `/:id/confirm-receipt`, `/:id/dispute`). The state machine
 * owns legality and authorization, so each route is the same four lines and
 * defers to this translator for its typed errors.
 *
 * - `OrderNotFoundError`               -> 404
 * - `IllegalOrderTransitionError`      -> 409, with the attempted `from`/`to`
 *   in `errors`. A double-tap on an action whose state already moved is a
 *   legal client action against a stale state ("already done"), not a
 *   validation failure — the app treats 409 here as success.
 * - `UnauthorizedOrderTransitionError` -> 403
 * - `PayoutDetailsRequiredError`       -> 400 (ship is blocked before CAS)
 * - wedged Supabase socket            -> 503 (the app retries the tap)
 * - anything else                      -> 500
 */
export const sendOrderTransitionError = (res: Response, err: unknown): Response => {
    if (err instanceof OrderNotFoundError) {
        return res.status(404).json(createErrorResponse(err.message, 404, 'ROUTE_NOT_FOUND'));
    }

    if (isSupabaseTimeoutError(err)) {
        return res.status(503).json(
            createErrorResponse(
                'The order service is taking too long to respond. Please try again.',
                503,
                'ESCROW_BACKEND_TIMEOUT',
            ),
        );
    }

    if (err instanceof IllegalOrderTransitionError) {
        return res.status(409).json(
            createErrorResponse(err.message, 409, 'CONFLICT', [{ from: err.from, to: err.to }])
        );
    }

    if (err instanceof UnauthorizedOrderTransitionError) {
        return res.status(403).json(createErrorResponse(err.message, 403, 'AUTH_FORBIDDEN'));
    }

    if (err instanceof PayoutDetailsRequiredError) {
        return res.status(400).json(
            createErrorResponse(err.message, 400, 'PAYOUT_DETAILS_REQUIRED')
        );
    }

    return res
        .status(500)
        .json(
            createErrorResponse(
                err instanceof Error ? err.message : 'Failed to update order',
                500,
                'UNKNOWN_ERROR'
            )
        );
};

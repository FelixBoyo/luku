import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { getEscrowPolicy } from '../payments/escrowPolicy';
import type { OrderStatus } from '../../packages/contracts/src/orders';

/**
 * Single writer for every escrow order transition (C-CORE-2, ADR-11).
 *
 * `webhook`/`system` are trusted backend callers (webhook handler, timer jobs,
 * payout/refund flows) invoked directly, never through buyer/seller HTTP auth.
 * `buyer`/`seller` transitions are authorized against order ownership below.
 */
export type OrderActor = 'buyer' | 'seller' | 'webhook' | 'system';

export class OrderNotFoundError extends Error {}

export class IllegalOrderTransitionError extends Error {
    constructor(
        public readonly from: OrderStatus,
        public readonly to: OrderStatus
    ) {
        super(`Cannot transition order from "${from}" to "${to}".`);
        this.name = 'IllegalOrderTransitionError';
    }
}

export class UnauthorizedOrderTransitionError extends Error {
    constructor(message = 'You are not authorized to make this change to the order.') {
        super(message);
        this.name = 'UnauthorizedOrderTransitionError';
    }
}

type OrderRow = {
    id: string;
    status: OrderStatus;
    buyer_id: string;
    seller_id: string | null;
    seller_user_id: string | null;
};

type TransitionEdge = {
    from: OrderStatus;
    to: OrderStatus;
    actor: OrderActor;
    /** Column stamped with `now()` on a successful transition, if any. */
    timestampColumn?: string;
};

/**
 * The full graph from the state diagram in ESCROW_POLICY.md. Every consumer —
 * webhook (C-CORE-3), seller ship action (Felix), payout/refund (Felix,
 * C-CORE-4/5), timers (Brian, C-CORE-7) — transitions orders only through
 * `transitionOrder` below, never with a direct `.update()`.
 *
 * `paid -> shipped` is a fallback if an order is still at `paid` when the
 * seller marks shipped (poll path missed `in_escrow`). The poll path and
 * webhook both promote to `in_escrow` first.
 */
const TRANSITIONS: TransitionEdge[] = [
    { from: 'pending_payment', to: 'paid', actor: 'webhook', timestampColumn: 'paid_at' },
    { from: 'paid', to: 'in_escrow', actor: 'system' },
    { from: 'paid', to: 'shipped', actor: 'seller', timestampColumn: 'shipped_at' },
    { from: 'in_escrow', to: 'shipped', actor: 'seller', timestampColumn: 'shipped_at' },
    { from: 'in_escrow', to: 'cancelled', actor: 'system', timestampColumn: 'cancelled_at' },
    { from: 'in_escrow', to: 'disputed', actor: 'buyer', timestampColumn: 'disputed_at' },
    { from: 'shipped', to: 'delivered', actor: 'buyer', timestampColumn: 'delivered_at' },
    { from: 'shipped', to: 'disputed', actor: 'buyer', timestampColumn: 'disputed_at' },
    { from: 'shipped', to: 'released', actor: 'system', timestampColumn: 'released_at' },
    { from: 'delivered', to: 'released', actor: 'system', timestampColumn: 'released_at' },
    { from: 'disputed', to: 'released', actor: 'system', timestampColumn: 'released_at' },
    { from: 'disputed', to: 'refunded', actor: 'system', timestampColumn: 'refunded_at' },
    { from: 'cancelled', to: 'refunded', actor: 'system', timestampColumn: 'refunded_at' },
];

const findEdge = (from: OrderStatus, to: OrderStatus): TransitionEdge | undefined =>
    TRANSITIONS.find((edge) => edge.from === from && edge.to === to);

/**
 * A business seller's identity lives on `business_accounts.user_id`, one hop
 * away from `orders.seller_id`. A peer seller is `orders.seller_user_id`
 * directly. Single-seller checkout (D9) means every row sharing an order id
 * has the same seller, but every row is still checked, not just the first.
 */
const assertSellerOwnsOrder = async (rows: OrderRow[], userId: string): Promise<void> => {
    const peerSellerIds = new Set(rows.map((row) => row.seller_user_id).filter(Boolean));

    if (peerSellerIds.size > 0) {
        if (peerSellerIds.size > 1 || !peerSellerIds.has(userId)) {
            throw new UnauthorizedOrderTransitionError('You are not the seller for this order.');
        }
        return;
    }

    const businessSellerIds = new Set(rows.map((row) => row.seller_id).filter(Boolean));
    if (businessSellerIds.size !== 1) {
        throw new UnauthorizedOrderTransitionError('You are not the seller for this order.');
    }

    const supabase = getSupabaseAdmin();
    const { data: business, error } = await supabase
        .from('business_accounts')
        .select('user_id')
        .eq('id', [...businessSellerIds][0])
        .maybeSingle();

    if (error) {
        throw new Error(error.message);
    }

    if (!business || business.user_id !== userId) {
        throw new UnauthorizedOrderTransitionError('You are not the seller for this order.');
    }
};

const assertBuyerOwnsOrder = (rows: OrderRow[], userId: string): void => {
    if (rows.some((row) => row.buyer_id !== userId)) {
        throw new UnauthorizedOrderTransitionError('You are not the buyer for this order.');
    }
};

export const SLOW_TRANSITION_STEP_MS = 2_000;

/** Warns (never throws) when one step of a transition runs long. */
export const timeTransitionStep = async <T>(
    label: string,
    orderId: string,
    step: () => PromiseLike<T>,
    now: () => number = Date.now
): Promise<T> => {
    const startedAt = now();
    try {
        return await step();
    } finally {
        const elapsed = now() - startedAt;
        if (elapsed > SLOW_TRANSITION_STEP_MS) {
            console.warn(`[transitionOrder] slow step "${label}" for ${orderId}: ${elapsed}ms`);
        }
    }
};

export type TransitionOrderParams = {
    /** The buyer-facing order id — `stripe_payment_intent_id` (the payment reference), not the row `id`. */
    orderId: string;
    toStatus: OrderStatus;
    actor: OrderActor;
    /** Required for `buyer` and `seller` actors; ignored for `webhook`/`system`. */
    userId?: string;
};

/**
 * Applies one escrow transition to every order row sharing `orderId`
 * (single-seller v1 means that's always one seller). Illegal transitions,
 * wrong-actor attempts, and non-owners are all rejected. The final update is
 * a compare-and-swap on the current status, so a losing race is reported the
 * same way as any other illegal transition rather than silently double-applying.
 */
export const transitionOrder = async ({
    orderId,
    toStatus,
    actor,
    userId,
}: TransitionOrderParams): Promise<void> => {
    if ((actor === 'buyer' || actor === 'seller') && !userId) {
        throw new UnauthorizedOrderTransitionError(`${actor} transitions require a userId.`);
    }

    const supabase = getSupabaseAdmin();
    const { data: rows, error } = await timeTransitionStep('read order', orderId, () =>
        supabase
            .from('orders')
            .select('id, status, buyer_id, seller_id, seller_user_id')
            .eq('stripe_payment_intent_id', orderId)
    );

    if (error) {
        throw new Error(error.message);
    }

    if (!rows || rows.length === 0) {
        throw new OrderNotFoundError(`Order "${orderId}" not found.`);
    }

    const orderRows = rows as OrderRow[];
    const fromStatus = orderRows[0].status;
    const edge = findEdge(fromStatus, toStatus);

    if (!edge || edge.actor !== actor) {
        throw new IllegalOrderTransitionError(fromStatus, toStatus);
    }

    if (actor === 'buyer') {
        assertBuyerOwnsOrder(orderRows, userId!);
    } else if (actor === 'seller') {
        await timeTransitionStep('seller ownership', orderId, () =>
            assertSellerOwnsOrder(orderRows, userId!)
        );
    }

    const now = new Date();
    const updatePayload: Record<string, unknown> = { status: toStatus };
    if (edge.timestampColumn) {
        updatePayload[edge.timestampColumn] = now.toISOString();
    }
    if (toStatus === 'shipped') {
        const releaseAt = new Date(now);
        releaseAt.setUTCDate(releaseAt.getUTCDate() + getEscrowPolicy().autoReleaseDays);
        updatePayload.auto_release_at = releaseAt.toISOString();
    }

    const { data: updated, error: updateError } = await timeTransitionStep(
        'update status',
        orderId,
        () =>
            supabase
                .from('orders')
                .update(updatePayload)
                .eq('stripe_payment_intent_id', orderId)
                .eq('status', fromStatus)
                .select('id')
    );

    if (updateError) {
        throw new Error(updateError.message);
    }

    if (!updated || updated.length === 0) {
        // Someone else moved the order between our read and our write.
        throw new IllegalOrderTransitionError(fromStatus, toStatus);
    }

    await timeTransitionStep(`effects → ${toStatus}`, orderId, async () => {
        const { runTransitionEffects } = await import('./orderTransitionEffects');
        await runTransitionEffects(orderId, toStatus);
    });
};

/** Seller-authorized `shipped` transition. Called by Felix's "mark as shipped" action. */
export const markOrderShipped = (orderId: string, sellerId: string): Promise<void> =>
    transitionOrder({ orderId, toStatus: 'shipped', actor: 'seller', userId: sellerId });

/** Buyer-authorized `delivered` transition (Confirm receipt, C5). */
export const confirmOrderDelivery = (orderId: string, buyerId: string): Promise<void> =>
    transitionOrder({ orderId, toStatus: 'delivered', actor: 'buyer', userId: buyerId });

/** Buyer-authorized `disputed` transition (report a problem, C-CORE-5 buyer half). */
export const reportOrderProblem = (orderId: string, buyerId: string): Promise<void> =>
    transitionOrder({ orderId, toStatus: 'disputed', actor: 'buyer', userId: buyerId });

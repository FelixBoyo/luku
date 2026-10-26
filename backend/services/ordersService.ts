import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { removeCartProducts } from './cartService';
import { getEscrowPolicy } from '../payments/escrowPolicy';
import { calculateVat } from '../../packages/contracts/src/pricing';
import { safeLogger } from '../http/redact';
import {
    assertSingleSeller,
    sellerKeyFromListing,
    sellerKeyFromProduct,
} from './sellerKey';
import { CannotBuyOwnItemError } from './cannotBuyOwnItem';
import {
    transitionOrder,
    OrderNotFoundError,
    IllegalOrderTransitionError,
} from './orderStateMachine';
import type {
    OrderDto,
    OrderItemDto,
    OrderStatus,
    OrderTimelineStepDto,
    PaymentDto,
    ShippingAddressDto,
    CreateOrderRequest,
    SellerType,
} from '../../packages/contracts/src/orders';

const PAYMENT_PROVIDER = 'paystack';
const DEFAULT_CURRENCY = 'KES';

type PostgrestErrorLike = {
    message: string;
    code?: string | null;
    details?: string | null;
    hint?: string | null;
};

/**
 * Raised when Postgres refuses a write that only the service role may perform.
 * It surfaces after the buyer has been charged, so the operator needs the real
 * cause: an earlier version of this error asserted the key was wrong and sent
 * a debugging session chasing a key that was correct the whole time. Carry the
 * Postgres text verbatim — a trigger can report a table the insert never named.
 */
export class ServiceRoleWriteError extends Error {
    readonly pgCode?: string;

    constructor(attemptedTable: string, error: PostgrestErrorLike) {
        super(
            `Postgres refused a service-role write while inserting into "${attemptedTable}". ` +
                `Postgres said: ${error.message}` +
                `${error.code ? ` (code ${error.code})` : ''}` +
                `${error.details ? ` — ${error.details}` : ''}. ` +
                'Run `npm run diagnose:rls` to see whether this is credentials or schema.'
        );
        this.name = 'ServiceRoleWriteError';
        this.pgCode = error.code ?? undefined;
    }
}

/** Postgres reports RLS denials as 42501; match the text too for older builds. */
const isRlsViolation = (error: PostgrestErrorLike): boolean =>
    error.code === '42501' || /row-level security/i.test(error.message);

const ORDER_SELECT =
    '*, product:products(*), seller:business_accounts(*), listing:listings(*), payment:payments(*)';

/** Accepts the current `paymentReference` and the deprecated Stripe-era alias. */
export const resolvePaymentReference = (body: CreateOrderRequest): string =>
    (body.paymentReference ?? body.stripePaymentIntentId ?? '').trim();

const CONFIRMED_STATUSES: OrderStatus[] = [
    'paid',
    'in_escrow',
    'shipped',
    'delivered',
    'released',
    'completed',
];
const SHIPPED_STATUSES: OrderStatus[] = [
    'shipped',
    'delivered',
    'released',
    'completed',
];
const DELIVERED_STATUSES: OrderStatus[] = ['delivered', 'released', 'completed'];

const haltedTimelineStep = (row: any, status: OrderStatus): OrderTimelineStepDto[] | null => {
    if (status === 'disputed') {
        return [
            {
                label: 'On hold',
                date: toLocaleDate(row.disputed_at || row.updated_at),
                completed: true,
            },
        ];
    }
    if (status === 'cancelled') {
        return [
            {
                label: 'Cancelled',
                date: toLocaleDate(row.cancelled_at || row.updated_at),
                completed: true,
            },
        ];
    }
    if (status === 'refunded') {
        const steps: OrderTimelineStepDto[] = [];
        if (row.cancelled_at) {
            steps.push({ label: 'Cancelled', date: toLocaleDate(row.cancelled_at), completed: true });
        }
        steps.push({
            label: 'Refunded',
            date: toLocaleDate(row.refunded_at || row.updated_at),
            completed: true,
        });
        return steps;
    }
    return null;
};

const toIso = (value: any): string | undefined =>
    value ? new Date(value).toISOString() : undefined;

const toLocaleDate = (value: any): string =>
    value ? new Date(value).toLocaleDateString() : '';

const mapPayment = (row: any): PaymentDto | undefined => {
    if (!row) {
        return undefined;
    }

    return {
        id: String(row.id),
        provider: String(row.provider || PAYMENT_PROVIDER),
        reference: String(row.reference),
        amount: Number(row.amount_minor ?? 0),
        currency: String(row.currency || DEFAULT_CURRENCY),
        status: row.status,
        channel: row.channel || undefined,
        paidAt: toIso(row.paid_at),
    };
};

const mapItem = (row: any, peerSellerNames: Map<string, string>): OrderItemDto => {
    const isPeer = Boolean(row.listing_id);

    if (isPeer) {
        const listing = row.listing || {};
        const sellerName =
            (row.seller_user_id && peerSellerNames.get(String(row.seller_user_id))) ||
            'LUKU Seller';

        return {
            listingId: String(row.listing_id),
            name: String(listing.title || 'Unknown Listing'),
            price: Number(row.price_per_unit),
            quantity: Number(row.quantity),
            imageUrl: String(listing.image_url || ''),
            sellerName,
            sellerType: 'peer',
        };
    }

    const product = row.product || {};
    const seller = row.seller || {};

    return {
        productId: String(row.product_id),
        name: String(product.name || 'Unknown Product'),
        price: Number(row.price_per_unit),
        quantity: Number(row.quantity),
        imageUrl:
            Array.isArray(product.image_urls) && product.image_urls.length > 0
                ? product.image_urls[0]
                : '',
        sellerName: String(seller.business_name || 'LUKU Seller'),
        sellerType: 'business',
    };
};

/**
 * Steps are completed from their transition timestamps first, so a `disputed`
 * / `cancelled` / `refunded` order keeps the progress it made instead of
 * falling back to "Placed". Those terminal-ish states replace "Delivered"
 * with their own final step.
 */
const buildTimeline = (row: any, status: OrderStatus): OrderTimelineStepDto[] => {
    const confirmed = Boolean(row.paid_at) || CONFIRMED_STATUSES.includes(status);
    const shipped = Boolean(row.shipped_at) || SHIPPED_STATUSES.includes(status);
    const delivered = Boolean(row.delivered_at) || DELIVERED_STATUSES.includes(status);

    const timeline: OrderTimelineStepDto[] = [
        { label: 'Placed', date: toLocaleDate(row.created_at), completed: true },
        {
            label: 'Confirmed',
            date: confirmed ? toLocaleDate(row.paid_at || row.created_at) : '',
            completed: confirmed,
        },
    ];

    const haltedStep = haltedTimelineStep(row, status);
    if (haltedStep) {
        if (shipped) {
            timeline.push({
                label: 'Shipped',
                date: toLocaleDate(row.shipped_at || row.updated_at),
                completed: true,
            });
        }
        timeline.push(...haltedStep);
    } else {
        timeline.push(
            {
                label: 'Shipped',
                date: shipped ? toLocaleDate(row.shipped_at || row.updated_at) : '',
                completed: shipped,
            },
            {
                label: 'Delivered',
                date: delivered ? toLocaleDate(row.delivered_at || row.updated_at) : '',
                completed: delivered,
            }
        );
    }

    for (let i = timeline.length - 1; i >= 0; i--) {
        if (timeline[i].completed) {
            timeline[i].current = true;
            break;
        }
    }

    return timeline;
};

const resolveSeller = (row: any): { sellerId?: string; sellerType?: SellerType } => {
    if (row.seller_user_id) {
        return { sellerId: String(row.seller_user_id), sellerType: 'peer' };
    }

    if (row.seller_id) {
        return { sellerId: String(row.seller_id), sellerType: 'business' };
    }

    return {};
};

/**
 * Peer sellers live in auth.users, so they cannot be joined from orders the way
 * business_accounts can. Names are fetched in one extra query and mapped in.
 */
const fetchPeerSellerNames = async (rows: any[]): Promise<Map<string, string>> => {
    const names = new Map<string, string>();
    const sellerIds = Array.from(
        new Set(
            rows
                .filter((row) => row.seller_user_id)
                .map((row) => String(row.seller_user_id))
        )
    );

    if (sellerIds.length === 0) {
        return names;
    }

    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('profiles')
        .select('id, display_name, handle')
        .in('id', sellerIds);

    if (error) {
        return names;
    }

    for (const profile of data ?? []) {
        const name = profile.display_name || profile.handle;
        if (name) {
            names.set(String(profile.id), String(name));
        }
    }

    return names;
};

const groupOrders = (
    rows: any[],
    peerSellerNames: Map<string, string>,
    viewerId?: string
): OrderDto[] => {
    const groups: Record<string, any[]> = {};

    for (const row of rows) {
        // Legacy rows predate payment_id, so fall back to the provider reference.
        const key = String(row.payment_id || row.stripe_payment_intent_id);
        if (!groups[key]) {
            groups[key] = [];
        }
        groups[key].push(row);
    }

    return Object.values(groups).map((orderRows) => {
        const first = orderRows[0];
        const subtotal = orderRows.reduce((sum, r) => sum + Number(r.total_price), 0);

        // Mirrors checkout: subtotal + VAT. Delivery is arranged by the buyer,
        // so no shipping fee is ever charged.
        const tax = calculateVat(subtotal, getEscrowPolicy().vatRate);
        const total = subtotal + tax;

        const status = first.status as OrderStatus;
        const items = orderRows.map((row) => mapItem(row, peerSellerNames));

        const shippingAddr: ShippingAddressDto = {
            name: String(first.shipping_address?.name || ''),
            street: String(first.shipping_address?.street || ''),
            city: String(first.shipping_address?.city || ''),
            postal: String(first.shipping_address?.postal || ''),
            phone: String(first.shipping_address?.phone || ''),
        };

        return {
            id: String(first.stripe_payment_intent_id),
            placedDate: toLocaleDate(first.created_at),
            status,
            total,
            items,
            trackingNumber: first.tracking_number || undefined,
            estimatedDelivery: new Date(
                new Date(first.created_at).getTime() + 5 * 24 * 60 * 60 * 1000
            ).toLocaleDateString(),
            shippingAddress: shippingAddr,
            timeline: buildTimeline(first, status),
            ...resolveSeller(first),
            viewerRole: viewerId
                ? first.buyer_id === viewerId
                    ? 'buyer'
                    : 'seller'
                : undefined,
            paymentReference: first.stripe_payment_intent_id || undefined,
            payment: mapPayment(first.payment),
            paidAt: toIso(first.paid_at),
            shippedAt: toIso(first.shipped_at),
            deliveredAt: toIso(first.delivered_at),
            releasedAt: toIso(first.released_at),
            cancelledAt: toIso(first.cancelled_at),
            refundedAt: toIso(first.refunded_at),
            disputedAt: toIso(first.disputed_at),
            autoReleaseAt: toIso(first.auto_release_at),
            shipByAt: toIso(first.ship_by_at),
        };
    });
};

const mapRowsToOrders = async (rows: any[], viewerId?: string): Promise<OrderDto[]> => {
    const peerSellerNames = await fetchPeerSellerNames(rows);
    return groupOrders(rows, peerSellerNames, viewerId);
};

const uniqueRowsById = (rows: any[]): any[] => {
    const byId = new Map<string, any>();
    for (const row of rows) {
        byId.set(String(row.id), row);
    }
    return [...byId.values()];
};

const businessIdsOwnedBy = async (userId: string): Promise<string[]> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('business_accounts')
        .select('id')
        .eq('user_id', userId);

    if (error) {
        throw new Error(error.message);
    }

    return (data ?? []).map((row) => String(row.id));
};

const viewerCanAccessRows = async (userId: string, rows: any[]): Promise<boolean> => {
    if (rows.some((row) => row.buyer_id === userId || row.seller_user_id === userId)) {
        return true;
    }

    const sellerIds = rows.map((row) => row.seller_id).filter(Boolean);
    if (sellerIds.length === 0) {
        return false;
    }

    const owned = await businessIdsOwnedBy(userId);
    return sellerIds.some((id) => owned.includes(String(id)));
};

export const getOrders = async (userId: string): Promise<OrderDto[]> => {
    const supabase = getSupabaseAdmin();
    const businessIds = await businessIdsOwnedBy(userId);

    const { data: asBuyer, error: buyerError } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('buyer_id', userId)
        .order('created_at', { ascending: false });
    if (buyerError) throw new Error(buyerError.message);

    const { data: asPeerSeller, error: peerError } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('seller_user_id', userId)
        .order('created_at', { ascending: false });
    if (peerError) throw new Error(peerError.message);

    let asBusiness: any[] = [];
    if (businessIds.length > 0) {
        const { data, error } = await supabase
            .from('orders')
            .select(ORDER_SELECT)
            .in('seller_id', businessIds)
            .order('created_at', { ascending: false });
        if (error) throw new Error(error.message);
        asBusiness = data ?? [];
    }

    return mapRowsToOrders(
        uniqueRowsById([...(asBuyer ?? []), ...(asPeerSeller ?? []), ...asBusiness]),
        userId
    );
};

export const getOrderById = async (
    userId: string,
    orderId: string
): Promise<OrderDto | null> => {
    const supabase = getSupabaseAdmin();
    const { data, error } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .eq('stripe_payment_intent_id', orderId);

    if (error) throw new Error(error.message);
    if (!data || data.length === 0) return null;
    if (!(await viewerCanAccessRows(userId, data))) return null;
    const grouped = await mapRowsToOrders(data, userId);
    return grouped[0] || null;
};

/**
 * ADR D9: resolve each line to a namespaced seller key and require one seller.
 * Must run before payment/RPC so a mixed cart never creates escrow rows.
 */
const assertOrderItemsSingleSeller = async (
    buyerId: string,
    items: CreateOrderRequest['items']
): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const productIds = [
        ...new Set(
            items
                .map((item) => item.productId)
                .filter((id): id is string => Boolean(id))
        ),
    ];
    const listingIds = [
        ...new Set(
            items
                .map((item) => item.listingId)
                .filter((id): id is string => Boolean(id))
        ),
    ];

    const productBusinessById = new Map<string, string>();
    if (productIds.length > 0) {
        const { data, error } = await supabase
            .from('products')
            .select('id, business_id')
            .in('id', productIds);
        if (error) throw new Error(error.message);
        for (const row of data ?? []) {
            productBusinessById.set(String(row.id), String(row.business_id));
        }
    }

    const listingSellerById = new Map<string, string>();
    if (listingIds.length > 0) {
        const { data, error } = await supabase
            .from('listings')
            .select('id, seller_id')
            .in('id', listingIds);
        if (error) throw new Error(error.message);
        for (const row of data ?? []) {
            listingSellerById.set(String(row.id), String(row.seller_id));
        }
    }

    const catalogBusinessIds = [...new Set(productBusinessById.values())];
    if (catalogBusinessIds.length > 0) {
        const { data, error } = await supabase
            .from('business_accounts')
            .select('id, user_id')
            .in('id', catalogBusinessIds);
        if (error) throw new Error(error.message);
        for (const row of data ?? []) {
            if (String(row.user_id) === buyerId) {
                throw new CannotBuyOwnItemError();
            }
        }
    }

    for (const sellerUserId of listingSellerById.values()) {
        if (sellerUserId === buyerId) {
            throw new CannotBuyOwnItemError();
        }
    }

    const keys: string[] = [];
    for (const item of items) {
        if (item.productId) {
            const businessId = productBusinessById.get(item.productId);
            if (!businessId) {
                throw new Error(`Product not found: ${item.productId}`);
            }
            keys.push(sellerKeyFromProduct(businessId));
            continue;
        }
        if (item.listingId) {
            const sellerUserId = listingSellerById.get(item.listingId);
            if (!sellerUserId) {
                throw new Error(`Listing not found: ${item.listingId}`);
            }
            keys.push(sellerKeyFromListing(sellerUserId));
        }
    }

    assertSingleSeller(keys);
};

/**
 * Payment truth is keyed by provider reference. The row is created here because
 * checkout confirms success by polling; once the webhook is the single writer of
 * `paid` (C-CORE-3) it will own this transition instead.
 *
 * Writes go through `ensure_payment_record` (SECURITY DEFINER, owned by
 * postgres) rather than a table insert. `payments` has RLS on and no INSERT
 * policy, so a PostgREST client that is not bypassing RLS is refused after
 * the charge has already been taken. Conflict handling lives in SQL: a second
 * call with a positive `amountMinor` updates the existing row.
 */
const ensurePaymentRecord = async (
    userId: string,
    reference: string,
    amountMinor = 0
): Promise<string> => {
    const supabase = getSupabaseAdmin();

    const { data, error } = await supabase.rpc('ensure_payment_record', {
        p_buyer_id: userId,
        p_reference: reference,
        p_provider: PAYMENT_PROVIDER,
        p_amount_minor: amountMinor,
        p_currency: DEFAULT_CURRENCY,
        p_status: 'success',
    });

    if (error) {
        if (isRlsViolation(error)) {
            throw new ServiceRoleWriteError('payments', error);
        }
        throw new Error(error.message);
    }

    if (!data) {
        throw new Error('ensure_payment_record returned no payment id');
    }

    return String(data);
};

export const createOrder = async (
    userId: string,
    body: CreateOrderRequest
): Promise<OrderDto> => {
    const supabase = getSupabaseAdmin();

    if (!body.items || body.items.length === 0) {
        throw new Error('No items specified for the order');
    }

    const paymentReference = resolvePaymentReference(body);
    if (!paymentReference) {
        throw new Error('Payment transaction reference is required');
    }

    // Idempotent per reference. A charge that succeeded but whose order creation
    // failed can be retried with the same reference instead of billing again, and
    // a double-submit cannot duplicate orders or decrement stock twice.
    const existingOrder = await getOrderById(userId, paymentReference);
    if (existingOrder) {
        return existingOrder;
    }

    await assertOrderItemsSingleSeller(userId, body.items);

    const paymentId = await ensurePaymentRecord(userId, paymentReference);
    const { shipByDays, vatRate } = getEscrowPolicy();
    let subtotalMinor = 0;

    for (const item of body.items) {
        const { data, error } = await supabase.rpc('create_escrow_order', {
            p_buyer_id: userId,
            p_payment_id: paymentId,
            p_payment_reference: paymentReference,
            p_product_id: item.productId ?? null,
            p_listing_id: item.listingId ?? null,
            p_quantity: item.quantity,
            p_shipping_address: body.shippingAddress,
            p_ship_by_days: shipByDays,
        });

        if (error) {
            throw new Error(error.message);
        }

        const result = data as {
            success: boolean;
            error?: string;
            order_id?: string;
            total_price?: number;
        };

        if (!result.success) {
            throw new Error(result.error || 'Failed to create order due to stock check');
        }

        subtotalMinor += Math.round(Number(result.total_price ?? 0) * 100);
    }

    // D12 — amount_minor is what the provider captured, which is subtotal + VAT,
    // not the payout base. Recording the subtotal alone made every order look
    // like a reconciliation mismatch and would refund the buyer short of the VAT
    // they actually paid (D11). Verify still overwrites this if the two differ.
    // Same DEFINER RPC as the insert: a table UPDATE would 42501 the moment
    // the insert started succeeding.
    if (subtotalMinor > 0) {
        const chargedMinor = subtotalMinor + calculateVat(subtotalMinor, vatRate);
        await ensurePaymentRecord(userId, paymentReference, chargedMinor);
    }

    // Only the purchased lines leave the cart; other sellers stay for a later checkout.
    try {
        await removeCartProducts(
            userId,
            body.items
                .map((item) => item.productId)
                .filter((id): id is string => Boolean(id))
        );
    } catch {
        // Suppress cart clearing errors to avoid failing the order response
    }

    // Poll-path checkout inserts at `paid`. Promote into escrow so ship-by
    // timers and seller ship work even when the Paystack webhook has not
    // arrived (or never will). A webhook that already ran is a no-op.
    try {
        await transitionOrder({
            orderId: paymentReference,
            toStatus: 'in_escrow',
            actor: 'system',
        });
    } catch (error) {
        if (
            !(error instanceof OrderNotFoundError) &&
            !(error instanceof IllegalOrderTransitionError)
        ) {
            safeLogger.error('[Orders] paid → in_escrow after createOrder failed', {
                reference: paymentReference,
                error,
            });
        }
    }

    // Retrieve the mapped OrderDto object
    const order = await getOrderById(userId, paymentReference);
    if (!order) {
        throw new Error('Order was created but could not be retrieved');
    }

    return order;
};

export const getStuckOrders = async (): Promise<OrderDto[]> => {
    const supabase = getSupabaseAdmin();
    const now = new Date().toISOString();

    // Disputed, past-SLA, and `cancelled` rows. `cancelled` only persists when
    // the Paystack refund failed, so the buyer is still owed their money.
    const { data, error } = await supabase
        .from('orders')
        .select(ORDER_SELECT)
        .or(`status.eq.disputed,status.eq.cancelled,and(status.eq.in_escrow,ship_by_at.lt.${now}),and(status.eq.shipped,auto_release_at.lt.${now})`)
        .order('created_at', { ascending: false });

    if (error) {
        throw new Error(`Failed to fetch stuck orders: ${error.message}`);
    }

    return mapRowsToOrders(data ?? []);
};

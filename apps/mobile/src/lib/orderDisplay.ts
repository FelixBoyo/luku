import type { OrderStatus } from '../../../../packages/contracts/src/orders';
import type { Order } from '../types/domain/order';
import { colors } from '../theme/tokens';

/**
 * Presentation of order identity and state, shared by every list that shows an
 * order so Me, Purchases and Orders cannot drift apart.
 *
 * Kept free of react-native imports so unit tests can import it under Vitest.
 */

/**
 * Orders are keyed by the provider reference (`mpesa_<uuid>`), which is far too
 * long to read as a title. The tail is the most entropic part, so it stays
 * distinguishable at a glance while the full `id` remains the navigation key.
 */
export const formatOrderId = (id: string): string => {
    const compact = id.replace(/[^a-zA-Z0-9]/g, '');
    if (compact.length === 0) {
        return id;
    }
    return `#${compact.slice(-8).toUpperCase()}`;
};

/**
 * Escrow states collapse onto four mobile statuses, which made a paid order
 * held in escrow read as `PROCESSING` — indistinguishable from one still
 * awaiting payment. Label from the escrow status when the API supplied it.
 */
const ESCROW_LABELS: Record<OrderStatus, string> = {
    pending_payment: 'PROCESSING',
    paid: 'PAID',
    in_escrow: 'IN ESCROW',
    shipped: 'SHIPPED',
    delivered: 'DELIVERED',
    released: 'COMPLETE',
    completed: 'COMPLETE',
    cancelled: 'CANCELLED',
    refunded: 'REFUNDED',
    disputed: 'ON HOLD',
};

const DOMAIN_LABELS: Record<Order['status'], string> = {
    processing: 'PROCESSING',
    shipped: 'SHIPPED',
    in_transit: 'IN TRANSIT',
    delivered: 'DELIVERED',
    cancelled: 'CANCELLED',
};

export const orderStatusLabel = (order: Pick<Order, 'status' | 'escrowStatus'>): string =>
    (order.escrowStatus ? ESCROW_LABELS[order.escrowStatus] : undefined) ??
    DOMAIN_LABELS[order.status] ??
    'PROCESSING';

export type OrderStatusTone = 'positive' | 'warning' | 'danger' | 'neutral';

const ESCROW_TONES: Record<OrderStatus, OrderStatusTone> = {
    pending_payment: 'neutral',
    paid: 'positive',
    in_escrow: 'positive',
    shipped: 'positive',
    delivered: 'positive',
    released: 'positive',
    completed: 'positive',
    cancelled: 'danger',
    refunded: 'neutral',
    disputed: 'warning',
};

const DOMAIN_TONES: Record<Order['status'], OrderStatusTone> = {
    processing: 'neutral',
    shipped: 'positive',
    in_transit: 'positive',
    delivered: 'positive',
    cancelled: 'danger',
};

export const orderStatusTone = (
    order: Pick<Order, 'status' | 'escrowStatus'>
): OrderStatusTone =>
    (order.escrowStatus ? ESCROW_TONES[order.escrowStatus] : undefined) ??
    DOMAIN_TONES[order.status] ??
    'neutral';

/** Pill colours for the dark order cards. */
export const ORDER_TONE_COLORS: Record<OrderStatusTone, { background: string; text: string }> = {
    positive: { background: colors.status.positiveBgDark, text: colors.status.positiveOnDark },
    warning: { background: colors.status.warningBgDark, text: colors.status.warningOnDark },
    danger: { background: colors.status.dangerBgDark, text: colors.status.dangerOnDark },
    neutral: { background: colors.status.neutralBgDark, text: colors.status.neutralOnDark },
};

export const orderStatusColors = (order: Pick<Order, 'status' | 'escrowStatus'>) =>
    ORDER_TONE_COLORS[orderStatusTone(order)];

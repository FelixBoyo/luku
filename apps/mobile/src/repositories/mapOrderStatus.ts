import type { OrderStatus } from '../../../../packages/contracts/src/orders';
import type { Order } from '../types/domain/order';

/**
 * Interim bridge from escrow `OrderStatus` onto the mobile domain status.
 * Terminal escrow states leave the active list; in-flight ones stay as
 * `processing` until Shannon's C-CORE-2 stepper lands richer labels.
 *
 * Kept free of react-native imports so unit tests can import it under Vitest.
 */
export const mapOrderStatus = (status: OrderStatus): Order['status'] => {
    switch (status) {
        case 'shipped':
            return 'shipped';
        case 'delivered':
        case 'released':
        case 'completed':
            return 'delivered';
        case 'cancelled':
        case 'refunded':
            return 'cancelled';
        default:
            return 'processing';
    }
};

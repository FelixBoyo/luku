import {
    activeOrders,
    deliveredOrders,
    getOrderById,
    mockOrders,
    mockReturns,
} from '../data/mock/orders';
import type { Order, Return } from '../types/domain/order';
import { apiGet, apiPost } from '../api/apiClient';
import type { OrderDto, CreateOrderRequest } from '../../../../packages/contracts/src/orders';
import { mapOrderStatus } from './mapOrderStatus';

export type OrdersRepository = {
    list: () => Promise<Order[]>;
    listActive: () => Promise<Order[]>;
    listDelivered: () => Promise<Order[]>;
    /** Orders where the signed-in user is the seller. */
    listSales: () => Promise<Order[]>;
    getById: (id: string) => Promise<Order | null>;
    listReturns: () => Promise<Return[]>;
    create: (request: CreateOrderRequest) => Promise<Order>;
    /** Buyer confirms receipt: `shipped -> delivered` (then system release). */
    confirmReceipt: (id: string) => Promise<void>;
    /** Buyer reports a problem: `shipped | in_escrow -> disputed`. */
    dispute: (id: string) => Promise<void>;
    /** Seller marks shipped: `in_escrow | paid -> shipped`. */
    markShipped: (id: string) => Promise<void>;
};

const mapDtoToDomain = (dto: OrderDto): Order => {
    return {
        id: dto.id,
        placedDate: dto.placedDate,
        status: mapOrderStatus(dto.status),
        escrowStatus: dto.status,
        viewerRole: dto.viewerRole,
        total: dto.total,
        items: dto.items.map((i) => ({
            name: i.name,
            price: i.price,
            quantity: i.quantity,
            imageUrl: i.imageUrl,
            seller: i.sellerName,
        })),
        trackingNumber: dto.trackingNumber,
        estimatedDelivery: dto.estimatedDelivery,
        shippingAddress: {
            name: dto.shippingAddress.name,
            street: dto.shippingAddress.street,
            city: dto.shippingAddress.city,
            postal: dto.shippingAddress.postal,
            phone: dto.shippingAddress.phone,
        },
        timeline: dto.timeline.map((t) => ({
            label: t.label,
            date: t.date,
            completed: t.completed,
            current: t.current,
        })),
    };
};

export const isBuyerOrder = (order: Pick<Order, 'viewerRole'>): boolean =>
    order.viewerRole !== 'seller';

export const isSellerOrder = (order: Pick<Order, 'viewerRole'>): boolean =>
    order.viewerRole === 'seller';

export type SaleBucket = 'to_ship' | 'shipped' | 'completed' | 'issues';

export const saleBucket = (order: Pick<Order, 'escrowStatus'>): SaleBucket | null => {
    switch (order.escrowStatus) {
        case 'paid':
        case 'in_escrow':
            return 'to_ship';
        case 'shipped':
            return 'shipped';
        case 'delivered':
        case 'released':
        case 'completed':
            return 'completed';
        case 'disputed':
        case 'cancelled':
        case 'refunded':
            return 'issues';
        default:
            return null;
    }
};

export const isToShipSale = (order: Pick<Order, 'escrowStatus'>): boolean =>
    saleBucket(order) === 'to_ship';

export const createMockOrdersRepository = (): OrdersRepository => ({
    list: async () => mockOrders.filter(isBuyerOrder),
    listActive: async () => activeOrders.filter(isBuyerOrder),
    listDelivered: async () => deliveredOrders.filter(isBuyerOrder),
    listSales: async () => mockOrders.filter(isSellerOrder),
    getById: async (id) => getOrderById(id) ?? null,
    listReturns: async () => [...mockReturns],
    create: async () => mockOrders[0],
    confirmReceipt: async () => {},
    dispute: async () => {},
    markShipped: async () => {},
});

export const createEmptyOrdersRepository = (): OrdersRepository => ({
    list: async () => [],
    listActive: async () => [],
    listDelivered: async () => [],
    listSales: async () => [],
    getById: async () => null,
    listReturns: async () => [],
    create: async () => {
        throw new Error('Not implemented');
    },
    confirmReceipt: async () => {},
    dispute: async () => {},
    markShipped: async () => {},
});

/** Confirm / dispute / ship must not spin forever if the API hang is still wedged. */
const ORDER_MUTATION_TIMEOUT_MS = 20_000;

export const createApiOrdersRepository = (): OrdersRepository => ({
    list: async () => {
        const response = await apiGet<OrderDto[]>('/v1/api/orders');
        return (response.data ?? []).map(mapDtoToDomain).filter(isBuyerOrder);
    },
    listActive: async () => {
        const response = await apiGet<OrderDto[]>('/v1/api/orders');
        return (response.data ?? [])
            .map(mapDtoToDomain)
            .filter(
                (o) =>
                    isBuyerOrder(o) && o.status !== 'delivered' && o.status !== 'cancelled',
            );
    },
    listDelivered: async () => {
        const response = await apiGet<OrderDto[]>('/v1/api/orders');
        return (response.data ?? [])
            .map(mapDtoToDomain)
            .filter((o) => isBuyerOrder(o) && o.status === 'delivered');
    },
    listSales: async () => {
        const response = await apiGet<OrderDto[]>('/v1/api/orders');
        return (response.data ?? []).map(mapDtoToDomain).filter(isSellerOrder);
    },
    getById: async (id) => {
        const response = await apiGet<OrderDto>(`/v1/api/orders/${id}`);
        return response.data ? mapDtoToDomain(response.data) : null;
    },
    listReturns: async () => [],
    create: async (request) => {
        const response = await apiPost<OrderDto>('/v1/api/orders', request);
        if (!response.data) {
            throw new Error('Failed to create order via API');
        }
        return mapDtoToDomain(response.data);
    },
    confirmReceipt: async (id) => {
        await apiPost(`/v1/api/orders/${id}/confirm-receipt`, {}, true, ORDER_MUTATION_TIMEOUT_MS);
    },
    dispute: async (id) => {
        await apiPost(`/v1/api/orders/${id}/dispute`, {}, true, ORDER_MUTATION_TIMEOUT_MS);
    },
    markShipped: async (id) => {
        await apiPost(`/v1/api/orders/${id}/ship`, {}, true, ORDER_MUTATION_TIMEOUT_MS);
    },
});

import type { OrderStatus } from '../../../../../packages/contracts/src/orders';

export type OrderItem = {
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    seller: string;
};

export type OrderTimelineStep = {
    label: string;
    date: string;
    completed: boolean;
    current?: boolean;
};

export type ShippingAddress = {
    name: string;
    street: string;
    city: string;
    postal: string;
    phone: string;
};

export type Order = {
    id: string;
    placedDate: string;
    status: 'processing' | 'shipped' | 'in_transit' | 'delivered' | 'cancelled';
    /**
     * Raw escrow status when the order came from the API. Carried alongside the
     * collapsed `status` purely so lists can label `paid` and `in_escrow`
     * distinctly; filtering and branching still use `status`.
     */
    escrowStatus?: OrderStatus;
    /** Present on API orders: the signed-in user is the buyer or the seller. */
    viewerRole?: 'buyer' | 'seller';
    total: number;
    items: OrderItem[];
    trackingNumber?: string;
    estimatedDelivery?: string;
    shippingAddress: ShippingAddress;
    timeline: OrderTimelineStep[];
};

export type Return = {
    id: string;
    orderId: string;
    date: string;
    status: 'requested' | 'approved' | 'received' | 'refunded' | 'rejected';
    reason: string;
    refundAmount: number;
    items: { name: string; quantity: number; imageUrl: string }[];
};

/** @deprecated Use Order */
export type MockOrder = Order;
/** @deprecated Use Return */
export type MockReturn = Return;

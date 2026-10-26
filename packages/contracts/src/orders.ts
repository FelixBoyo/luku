export type ShippingAddressDto = {
    name: string;
    street: string;
    city: string;
    postal: string;
    phone: string;
};

/**
 * Escrow order lifecycle (ADR-11 / ESCROW_POLICY.md).
 *
 * `paid` is written only by the payment webhook (single writer). `shipped` is
 * seller-driven; `delivered` and `disputed` are buyer-driven. `released` means
 * funds have left escrow toward the seller.
 */
export type OrderStatus =
    | 'pending_payment'
    | 'paid'
    | 'in_escrow'
    | 'shipped'
    | 'delivered'
    | 'released'
    | 'completed'
    | 'cancelled'
    | 'refunded'
    | 'disputed';

/** `business` sells from the catalog (`products`); `peer` sells a `listings` row. */
export type SellerType = 'business' | 'peer';

export type OrderItemDto = {
    /** Set for catalog items; mutually exclusive with `listingId`. */
    productId?: string;
    /** Set for peer-listing items; mutually exclusive with `productId`. */
    listingId?: string;
    name: string;
    price: number;
    quantity: number;
    imageUrl: string;
    sellerName: string;
    sellerType?: SellerType;
};

export type OrderTimelineStepDto = {
    label: string;
    date: string;
    completed: boolean;
    current?: boolean;
};

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'abandoned' | 'reversed';

export type PaymentChannel = 'mpesa' | 'card';

export type PaymentDto = {
    id: string;
    provider: string;
    /** Provider reference (Paystack). Unique — the idempotency anchor. */
    reference: string;
    /** Minor units (KES cents), matching what the provider charged. */
    amount: number;
    currency: string;
    status: PaymentStatus;
    channel?: PaymentChannel;
    paidAt?: string;
};

export type OrderDto = {
    id: string;
    placedDate: string;
    status: OrderStatus;
    total: number;
    items: OrderItemDto[];
    trackingNumber?: string;
    estimatedDelivery?: string;
    shippingAddress: ShippingAddressDto;
    timeline: OrderTimelineStepDto[];
    /** Business account id for `business` sellers, user id for `peer` sellers. */
    sellerId?: string;
    sellerType?: SellerType;
    /** Who the authenticated viewer is on this order. */
    viewerRole?: 'buyer' | 'seller';
    paymentReference?: string;
    payment?: PaymentDto;
    paidAt?: string;
    shippedAt?: string;
    deliveredAt?: string;
    releasedAt?: string;
    cancelledAt?: string;
    refundedAt?: string;
    disputedAt?: string;
    /** Escrow auto-releases at this time unless the buyer acts first (D2). */
    autoReleaseAt?: string;
    /** Seller must mark shipped before this time or the order auto-cancels (D3). */
    shipByAt?: string;
};

export type CreateOrderItemRequest = {
    productId?: string;
    listingId?: string;
    quantity: number;
};

export type CreateOrderRequest = {
    paymentReference?: string;
    /** @deprecated Use `paymentReference`. Retained so older clients keep working. */
    stripePaymentIntentId?: string;
    shippingAddress: ShippingAddressDto;
    items: CreateOrderItemRequest[];
};

export type OrderProblemReason =
    | 'not_received'
    | 'not_as_described'
    | 'damaged'
    | 'wrong_item'
    | 'other';

export type MarkOrderShippedRequest = {
    trackingNumber?: string;
    carrier?: string;
    note?: string;
};

export type ConfirmOrderReceiptRequest = {
    note?: string;
};

export type ReportOrderProblemRequest = {
    reason: OrderProblemReason;
    description: string;
};

export type OrderTransitionResponse = {
    order: OrderDto;
};

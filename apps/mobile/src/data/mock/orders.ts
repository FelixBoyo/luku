import type { Order, Return } from '../../types/domain/order';

export type {
    Order,
    OrderItem,
    OrderTimelineStep,
    Return,
    ShippingAddress,
} from '../../types/domain/order';
/** @deprecated Use Order */
export type MockOrder = Order;
/** @deprecated Use Return */
export type MockReturn = Return;

export const mockOrders: Order[] = [
    {
        id: 'ORD-2848',
        placedDate: 'May 19, 2026',
        status: 'in_transit',
        total: 22300,
        trackingNumber: 'TRK-8492-3756',
        estimatedDelivery: 'May 24-26, 2026',
        shippingAddress: {
            name: 'Shannon Martinez',
            street: '123 Kimathi Street',
            city: 'Nairobi',
            postal: '00100',
            phone: '+254 712 345 678',
        },
        items: [
            {
                name: 'Vintage Leather Jacket',
                price: 12500,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
                seller: 'VintageVibes',
            },
            {
                name: 'Minimalist Handbag',
                price: 9800,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1665832102613-5b94286ec041?w=400',
                seller: 'UrbanStyle',
            },
        ],
        timeline: [
            { label: 'Order Confirmed', date: 'May 19, 10:30 AM', completed: true },
            { label: 'Processing', date: 'May 19, 2:45 PM', completed: true },
            { label: 'Shipped', date: 'May 20, 9:00 AM', completed: true },
            { label: 'In Transit', date: 'May 21, 11:20 AM', completed: true, current: true },
            { label: 'Delivered', date: 'Expected May 24-26', completed: false },
        ],
    },
    {
        id: 'ORD-2048',
        placedDate: 'May 17, 2026',
        status: 'shipped',
        total: 12500,
        trackingNumber: 'TRK-9405-5036',
        estimatedDelivery: 'May 22, 2026',
        shippingAddress: {
            name: 'Shannon Martinez',
            street: '123 Kimathi Street',
            city: 'Nairobi',
            postal: '00100',
            phone: '+254 712 345 678',
        },
        items: [
            {
                name: 'Vintage Leather Jacket',
                price: 12500,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400',
                seller: 'VintageVibes',
            },
        ],
        timeline: [
            { label: 'Order Confirmed', date: 'May 17, 9:00 AM', completed: true },
            { label: 'Processing', date: 'May 17, 1:00 PM', completed: true },
            { label: 'Shipped', date: 'May 18, 8:00 AM', completed: true, current: true },
            { label: 'In Transit', date: 'Pending', completed: false },
            { label: 'Delivered', date: 'Expected May 22', completed: false },
        ],
    },
    {
        id: 'ORD-2041',
        placedDate: 'May 10, 2026',
        status: 'delivered',
        total: 8900,
        shippingAddress: {
            name: 'Shannon Martinez',
            street: '123 Kimathi Street',
            city: 'Nairobi',
            postal: '00100',
            phone: '+254 712 345 678',
        },
        items: [
            {
                name: 'Cashmere Sweater',
                price: 8900,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1434389677669-e08b4cac3105?w=400',
                seller: 'UrbanStyle',
            },
        ],
        timeline: [
            { label: 'Order Confirmed', date: 'May 10, 10:00 AM', completed: true },
            { label: 'Processing', date: 'May 10, 2:00 PM', completed: true },
            { label: 'Shipped', date: 'May 11, 9:00 AM', completed: true },
            { label: 'In Transit', date: 'May 12, 11:00 AM', completed: true },
            { label: 'Delivered', date: 'May 14, 3:30 PM', completed: true, current: true },
        ],
    },
    {
        id: 'ORD-2035',
        placedDate: 'May 3, 2026',
        status: 'delivered',
        total: 16700,
        shippingAddress: {
            name: 'Shannon Martinez',
            street: '123 Kimathi Street',
            city: 'Nairobi',
            postal: '00100',
            phone: '+254 712 345 678',
        },
        items: [
            {
                name: 'Wool Trench Coat',
                price: 18900,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1539533113208-f6df8cc8b543?w=400',
                seller: 'ChicBoutique',
            },
        ],
        timeline: [
            { label: 'Order Confirmed', date: 'May 3, 11:00 AM', completed: true },
            { label: 'Processing', date: 'May 3, 3:00 PM', completed: true },
            { label: 'Shipped', date: 'May 4, 10:00 AM', completed: true },
            { label: 'In Transit', date: 'May 5, 2:00 PM', completed: true },
            { label: 'Delivered', date: 'May 7, 1:00 PM', completed: true },
        ],
    },
    {
        id: 'SALE-1102',
        placedDate: 'May 20, 2026',
        status: 'processing',
        escrowStatus: 'in_escrow',
        viewerRole: 'seller',
        total: 4500,
        shippingAddress: {
            name: 'Alex Buyer',
            street: '45 Ngong Road',
            city: 'Nairobi',
            postal: '00100',
            phone: '+254 700 111 222',
        },
        items: [
            {
                name: 'Denim Shirt',
                price: 4500,
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400',
                seller: 'You',
            },
        ],
        timeline: [
            { label: 'Placed', date: 'May 20, 9:00 AM', completed: true },
            { label: 'Confirmed', date: 'May 20, 9:05 AM', completed: true, current: true },
            { label: 'Shipped', date: '', completed: false },
            { label: 'Delivered', date: '', completed: false },
        ],
    },
];

export const mockReturns: Return[] = [
    {
        id: 'RET-1024',
        orderId: 'ORD-2030',
        date: 'May 15, 2026',
        status: 'approved',
        reason: 'Size too large',
        refundAmount: 6200,
        items: [
            {
                name: 'Cotton T-Shirt',
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400',
            },
        ],
    },
    {
        id: 'RET-1023',
        orderId: 'ORD-2025',
        date: 'May 8, 2026',
        status: 'refunded',
        reason: 'Wrong color received',
        refundAmount: 11200,
        items: [
            {
                name: 'Leather Ankle Boots',
                quantity: 1,
                imageUrl: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=400',
            },
        ],
    },
];

export const getOrderById = (id: string): Order =>
    mockOrders.find((o) => o.id === id) ?? mockOrders[0];

export const getReturnById = (id: string): Return =>
    mockReturns.find((r) => r.id === id) ?? mockReturns[0];

export const activeOrders = mockOrders.filter(
    (o) => o.viewerRole !== 'seller' && o.status !== 'delivered' && o.status !== 'cancelled',
);

export const deliveredOrders = mockOrders.filter(
    (o) => o.viewerRole !== 'seller' && o.status === 'delivered',
);

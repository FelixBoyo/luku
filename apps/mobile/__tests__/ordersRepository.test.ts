import { describe, expect, it, vi, beforeEach } from 'vitest';
import { mapOrderStatus } from '../src/repositories/mapOrderStatus';
import type { OrderStatus } from '../../../packages/contracts/src/orders';

const apiGet = vi.fn();
const apiPost = vi.fn();

vi.mock('../src/api/apiClient', () => ({
    ApiError: class ApiError extends Error {
        constructor(
            message: string,
            public status: number,
        ) {
            super(message);
        }
    },
    apiGet: (...args: unknown[]) => apiGet(...args),
    apiPost: (...args: unknown[]) => apiPost(...args),
}));

describe('mapOrderStatus', () => {
    const cases: Array<[OrderStatus, string]> = [
        ['pending_payment', 'processing'],
        ['paid', 'processing'],
        ['in_escrow', 'processing'],
        ['disputed', 'processing'],
        ['shipped', 'shipped'],
        ['delivered', 'delivered'],
        ['released', 'delivered'],
        ['completed', 'delivered'],
        ['cancelled', 'cancelled'],
        ['refunded', 'cancelled'],
    ];

    it.each(cases)('maps %s → %s', (escrowStatus, domainStatus) => {
        expect(mapOrderStatus(escrowStatus)).toBe(domainStatus);
    });
});

describe('createApiOrdersRepository — buyer transitions', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('markShipped POSTs to the ship route', async () => {
        apiPost.mockResolvedValue({ data: null });
        const { createApiOrdersRepository } = await import('../src/repositories/ordersRepository');

        await createApiOrdersRepository().markShipped('pi_test_1');

        expect(apiPost).toHaveBeenCalledWith('/v1/api/orders/pi_test_1/ship', {}, true, 20_000);
    });

    it('confirmReceipt POSTs to the confirm-receipt route', async () => {
        apiPost.mockResolvedValue({ data: { ok: true } });
        const { createApiOrdersRepository } = await import('../src/repositories/ordersRepository');

        await createApiOrdersRepository().confirmReceipt('pi_test_1');

        expect(apiPost).toHaveBeenCalledWith(
            '/v1/api/orders/pi_test_1/confirm-receipt',
            {},
            true,
            20_000,
        );
    });

    it('dispute POSTs to the dispute route', async () => {
        apiPost.mockResolvedValue({ data: { ok: true } });
        const { createApiOrdersRepository } = await import('../src/repositories/ordersRepository');

        await createApiOrdersRepository().dispute('pi_test_1');

        expect(apiPost).toHaveBeenCalledWith('/v1/api/orders/pi_test_1/dispute', {}, true, 20_000);
    });

    it('propagates the ApiError (status) from a rejected transition', async () => {
        const { ApiError } = await import('../src/api/apiClient');
        apiPost.mockRejectedValue(new ApiError('conflict', 409));
        const { createApiOrdersRepository } = await import('../src/repositories/ordersRepository');

        await expect(createApiOrdersRepository().confirmReceipt('x')).rejects.toMatchObject({
            status: 409,
        });
    });
});

const sampleDto = (overrides: Record<string, unknown> = {}) => ({
    id: 'ord_buyer',
    placedDate: 'May 19, 2026',
    status: 'in_escrow',
    total: 1000,
    items: [
        {
            name: 'Jacket',
            price: 1000,
            quantity: 1,
            imageUrl: 'https://example.test/j.jpg',
            sellerName: 'Store',
        },
    ],
    shippingAddress: {
        name: 'Jane',
        street: '1 St',
        city: 'Nairobi',
        postal: '00100',
        phone: '+254700000000',
    },
    timeline: [{ label: 'Placed', date: 'May 19', completed: true }],
    viewerRole: 'buyer',
    ...overrides,
});

describe('createApiOrdersRepository — buyer vs seller lists', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        apiGet.mockResolvedValue({
            data: [
                sampleDto({ id: 'ord_buy', viewerRole: 'buyer', status: 'in_escrow' }),
                sampleDto({
                    id: 'ord_sale',
                    viewerRole: 'seller',
                    status: 'paid',
                }),
                sampleDto({
                    id: 'ord_done',
                    viewerRole: 'buyer',
                    status: 'delivered',
                }),
            ],
        });
    });

    it('list and listActive keep only buyer orders', async () => {
        const { createApiOrdersRepository } = await import('../src/repositories/ordersRepository');
        const repo = createApiOrdersRepository();

        const all = await repo.list();
        const active = await repo.listActive();
        const delivered = await repo.listDelivered();

        expect(all.map((o) => o.id)).toEqual(['ord_buy', 'ord_done']);
        expect(active.map((o) => o.id)).toEqual(['ord_buy']);
        expect(delivered.map((o) => o.id)).toEqual(['ord_done']);
    });

    it('listSales returns only seller orders', async () => {
        const { createApiOrdersRepository } = await import('../src/repositories/ordersRepository');
        const sales = await createApiOrdersRepository().listSales();
        expect(sales.map((o) => o.id)).toEqual(['ord_sale']);
    });
});

describe('saleBucket', () => {
    it('groups escrow states into sales tabs', async () => {
        const { saleBucket, isToShipSale } = await import('../src/repositories/ordersRepository');
        expect(saleBucket({ escrowStatus: 'in_escrow' })).toBe('to_ship');
        expect(saleBucket({ escrowStatus: 'paid' })).toBe('to_ship');
        expect(isToShipSale({ escrowStatus: 'paid' })).toBe(true);
        expect(saleBucket({ escrowStatus: 'shipped' })).toBe('shipped');
        expect(saleBucket({ escrowStatus: 'released' })).toBe('completed');
        expect(saleBucket({ escrowStatus: 'disputed' })).toBe('issues');
        expect(saleBucket({})).toBeNull();
    });
});

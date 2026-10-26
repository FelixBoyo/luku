import { describe, expect, it, vi, beforeEach } from 'vitest';
import { getNotifications } from './notificationsService';
import { getSupabaseAdmin } from '../data/supabaseAdmin';
import { listFollowers } from '../data/connectionsData';

vi.mock('../data/supabaseAdmin', () => ({
    getSupabaseAdmin: vi.fn(),
}));

vi.mock('../data/connectionsData', () => ({
    listFollowers: vi.fn(),
}));

type NotificationRow = {
    id: string;
    category: string;
    title: string;
    body: string;
    created_at: string;
    unread: boolean;
};

/**
 * `notifications` rows are written by the order-status trigger (C-NOTIF-1), so
 * the service reads them rather than deriving copy from order status at read
 * time. Anything asserting derived order notifications belongs in a test of
 * the trigger, not here.
 */
const mockNotificationRows = (rows: NotificationRow[], error: unknown = null) => {
    const builder: any = {};
    builder.select = vi.fn(() => builder);
    builder.eq = vi.fn(() => builder);
    builder.order = vi.fn(() => Promise.resolve({ data: rows, error }));
    vi.mocked(getSupabaseAdmin).mockReturnValue({ from: vi.fn(() => builder) } as any);
    return builder;
};

const orderRow = (overrides: Partial<NotificationRow> = {}): NotificationRow => ({
    id: 'notif_1',
    category: 'orders',
    title: 'Payment Confirmed',
    body: 'Your order pi_order_1234567890 is paid.',
    created_at: '2026-08-01T10:00:00.000Z',
    unread: true,
    ...overrides,
});

describe('notificationsService', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        mockNotificationRows([]);
        vi.mocked(listFollowers).mockResolvedValue([]);
    });

    it('returns persisted notification rows for the user', async () => {
        const builder = mockNotificationRows([orderRow()]);

        const notifications = await getNotifications('user_123');

        const orderNotif = notifications.find((n) => n.id === 'notif_1');
        expect(orderNotif).toBeDefined();
        expect(orderNotif!.title).toBe('Payment Confirmed');
        expect(orderNotif!.body).toContain('pi_order_1234567890');
        expect(orderNotif!.unread).toBe(true);
        expect(builder.eq).toHaveBeenCalledWith('user_id', 'user_123');
    });

    it('preserves the unread flag and category the trigger wrote', async () => {
        mockNotificationRows([
            orderRow({ id: 'notif_read', title: 'Payment Released', unread: false }),
        ]);

        const notifications = await getNotifications('user_123');
        const orderNotif = notifications.find((n) => n.id === 'notif_read');

        expect(orderNotif!.title).toBe('Payment Released');
        expect(orderNotif!.unread).toBe(false);
        expect(orderNotif!.category).toBe('orders');
    });

    it('still returns the generated notifications when the table read fails', async () => {
        mockNotificationRows([], { message: 'relation does not exist' });

        const notifications = await getNotifications('user_123');

        // A missing or failing notifications table must not blank the screen.
        expect(notifications.find((n) => n.id === 'style-recs')).toBeDefined();
    });

    it('compiles follower notifications for each follower connection', async () => {
        vi.mocked(listFollowers).mockResolvedValue([
            {
                id: 'follower_abc',
                displayName: 'Jane Follower',
                handle: 'janefollow',
            },
        ] as any);

        const notifications = await getNotifications('user_123');

        const followNotif = notifications.find((n) => n.id === 'follow-follower_abc');
        expect(followNotif).toBeDefined();
        expect(followNotif!.title).toBe('New Follower');
        expect(followNotif!.body).toBe('@janefollow started following you.');
    });

    it('always appends stylist AI notifications', async () => {
        const notifications = await getNotifications('user_123');

        const styleRecs = notifications.find((n) => n.id === 'style-recs');
        expect(styleRecs).toBeDefined();
        expect(styleRecs!.title).toBe('New Outfit Suggestions');
    });

    it('appends fallback seed notifications if active notifications are sparse (< 5)', async () => {
        const notifications = await getNotifications('user_123');

        // Total notifications should include fallback seeds to reach the minimum design density
        expect(notifications.length).toBeGreaterThanOrEqual(4); // 2 style recs + 2 seeds
        expect(notifications.find((n) => n.id === 'n-seed-1')).toBeDefined();
        expect(notifications.find((n) => n.id === 'n-seed-2')).toBeDefined();
    });
});

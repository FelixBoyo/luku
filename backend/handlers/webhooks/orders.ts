import { Request, Response } from 'express';
import { getSupabaseAdmin } from '../../data/supabaseAdmin';
import { safeLogger } from '../../http/redact';
import { sendPushNotification } from '../../services/pushService';

export interface OrderWebhookPayload {
    type: 'INSERT' | 'UPDATE' | 'DELETE';
    table: string;
    schema: string;
    record: any;
    old_record: any;
}

/**
 * We map the status transitions to the copy we want to notify the buyer with.
 * This replaces the in-memory synthesis from notificationsService.
 */
const ORDER_NOTIFICATIONS_MAP: Record<string, { title: string; body: (ref: string) => string; unread: boolean }> = {
    paid: {
        title: 'Payment Confirmed',
        body: (ref) => `We are holding your payment for order #${ref} until you confirm delivery.`,
        unread: true,
    },
    shipped: {
        title: 'Order Shipped',
        body: (ref) => `Order #${ref} has been shipped.`,
        unread: true,
    },
    delivered: {
        title: 'Order Delivered',
        body: (ref) => `Order #${ref} has been delivered.`,
        unread: true,
    },
};

export const handleOrderWebhook = async (req: Request, res: Response) => {
    try {
        const expectedSecret = process.env.WEBHOOK_SECRET || 'dev_webhook_secret';
        const providedSecret = req.headers['x-webhook-secret'];

        if (providedSecret !== expectedSecret) {
            safeLogger.warn('[OrderWebhook] Rejected unverified webhook signature', {
                ip: req.ip,
            });
            return res.status(401).send('Unauthorized');
        }

        const payload = req.body as OrderWebhookPayload;

        if (payload.table !== 'orders' || payload.type !== 'UPDATE') {
            return res.status(200).send('Ignored');
        }

        const newRecord = payload.record;
        const oldRecord = payload.old_record;

        const newStatus = newRecord.status;
        const oldStatus = oldRecord?.status;

        // Only process when status actually changes to one of our target statuses
        if (newStatus !== oldStatus && ORDER_NOTIFICATIONS_MAP[newStatus]) {
            const template = ORDER_NOTIFICATIONS_MAP[newStatus];
            
            // Generate short reference for the body (e.g. first 8 chars of intent id or payment id)
            // Legacy uses stripe_payment_intent_id or payment_id if available.
            const rawRef = newRecord.stripe_payment_intent_id || newRecord.id;
            const reference = String(rawRef).slice(0, 8);

            const supabase = getSupabaseAdmin();
            const { error } = await supabase.from('notifications').insert({
                user_id: newRecord.buyer_id,
                category: 'orders',
                title: template.title,
                body: template.body(reference),
                unread: template.unread,
            });

            if (error) {
                safeLogger.error('[OrderWebhook] Failed to insert notification', {
                    error,
                    orderId: newRecord.id,
                });
                return res.status(500).send('Internal Error');
            }

            safeLogger.info('[OrderWebhook] Processed status change notification', {
                orderId: newRecord.id,
                status: newStatus,
            });

            // Send push notification asynchronously
            sendPushNotification(newRecord.buyer_id, template.title, template.body(reference)).catch((err) => {
                safeLogger.error('[OrderWebhook] Failed to send push notification', { error: err });
            });
        }

        res.status(200).send('OK');
    } catch (error) {
        safeLogger.error('[OrderWebhook] Unexpected error processing webhook', { error });
        res.status(500).send('Internal Error');
    }
};

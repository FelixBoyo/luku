import { getSupabaseAdmin, resetSupabaseAdmin, isSupabaseFetchFailed } from '../data/supabaseAdmin';
import { getEscrowPolicy } from '../payments/escrowPolicy';
import { sendPushNotification } from './pushService';
import { transitionOrder } from './orderStateMachine';
import { safeLogger } from '../http/redact';

const noteTimerFetchFailure = (label: string, error: unknown): void => {
    safeLogger.error(label, { error });
    if (isSupabaseFetchFailed(error)) {
        resetSupabaseAdmin();
    }
};

/**
 * Sends a reminder notification (push + in-app) and records it to avoid spamming.
 * `body` must be fixed per order + reminder day (never the live day count) so
 * the exact-match dedupe lets day-3 and day-6 buyer nudges each fire once.
 */
const sendReminder = async (
    orderId: string,
    userId: string,
    category: string,
    title: string,
    body: string
): Promise<void> => {
    const supabase = getSupabaseAdmin();

    const { data: existing, error: checkError } = await supabase
        .from('notifications')
        .select('id')
        .eq('user_id', userId)
        .eq('category', category)
        .eq('title', title)
        .eq('body', body)
        .limit(1);

    if (checkError) {
        safeLogger.error('[TimersService] Error checking existing notifications', {
            error: checkError,
            orderId,
        });
        return;
    }

    if (existing && existing.length > 0) {
        return;
    }

    const { error: insertError } = await supabase.from('notifications').insert({
        user_id: userId,
        category,
        title,
        body,
        unread: true,
    });

    if (insertError) {
        safeLogger.error('[TimersService] Failed to insert notification', {
            error: insertError,
            orderId,
        });
        return;
    }

    await sendPushNotification(userId, title, body, { orderId });
};

const daysBetween = (fromIso: string, now: Date): number =>
    Math.floor((now.getTime() - new Date(fromIso).getTime()) / (1000 * 60 * 60 * 24));

/**
 * Periodically processes background timer deadlines and D10 reminders.
 * Never selects `disputed` rows — pause-on-dispute is the product rule.
 */
export const processEscrowTimers = async (): Promise<void> => {
    const supabase = getSupabaseAdmin();
    const policy = getEscrowPolicy();
    const now = new Date();

    const { data: inEscrowOrders, error: inEscrowError } = await supabase
        .from('orders')
        .select('stripe_payment_intent_id, buyer_id, seller_user_id, paid_at, ship_by_at')
        .eq('status', 'in_escrow');

    if (inEscrowError) {
        noteTimerFetchFailure('Failed to fetch orders for auto-cancel', inEscrowError);
    } else if (inEscrowOrders && inEscrowOrders.length > 0) {
        const seenCancel = new Set<string>();

        for (const order of inEscrowOrders) {
            const orderId = String(order.stripe_payment_intent_id);
            try {
                if (order.ship_by_at && new Date(order.ship_by_at) < now) {
                    if (seenCancel.has(orderId)) {
                        continue;
                    }
                    seenCancel.add(orderId);
                    await transitionOrder({
                        orderId,
                        toStatus: 'cancelled',
                        actor: 'system',
                    });
                    safeLogger.info(`Auto-cancelled order ${orderId} due to missed ship-by deadline`);
                    continue;
                }

                if (order.paid_at && order.seller_user_id) {
                    const daysInEscrow = daysBetween(order.paid_at, now);
                    for (const reminderDay of policy.sellerReminderDays) {
                        if (daysInEscrow >= reminderDay) {
                            await sendReminder(
                                orderId,
                                order.seller_user_id,
                                'orders',
                                'Shipping Reminder',
                                `Don't forget to ship order ${orderId}! It has been ${reminderDay} days since payment.`
                            );
                        }
                    }
                }
            } catch (error) {
                safeLogger.error('[TimersService] Error processing in_escrow order', {
                    error,
                    orderId,
                });
            }
        }
    }

    const releaseClient = getSupabaseAdmin();
    const { data: shippedOrders, error: shippedError } = await releaseClient
        .from('orders')
        .select('stripe_payment_intent_id, buyer_id, shipped_at, auto_release_at')
        .eq('status', 'shipped');

    if (shippedError) {
        noteTimerFetchFailure('Failed to fetch orders for auto-release', shippedError);
    } else if (shippedOrders && shippedOrders.length > 0) {
        const seenRelease = new Set<string>();

        for (const order of shippedOrders) {
            const orderId = String(order.stripe_payment_intent_id);
            try {
                if (order.auto_release_at && new Date(order.auto_release_at) < now) {
                    if (seenRelease.has(orderId)) {
                        continue;
                    }
                    seenRelease.add(orderId);
                    await transitionOrder({
                        orderId,
                        toStatus: 'released',
                        actor: 'system',
                    });
                    safeLogger.info(`Auto-released order ${orderId} due to auto-release deadline`);
                    continue;
                }

                if (order.shipped_at && order.buyer_id) {
                    const daysShipped = daysBetween(order.shipped_at, now);
                    for (const reminderDay of policy.buyerReminderDays) {
                        if (daysShipped >= reminderDay) {
                            await sendReminder(
                                orderId,
                                order.buyer_id,
                                'orders',
                                'Confirm Receipt Reminder',
                                `Your order ${orderId} has been marked shipped for ${reminderDay} days. Please confirm receipt if it has arrived.`
                            );
                        }
                    }
                }
            } catch (error) {
                safeLogger.error('[TimersService] Error processing shipped order', {
                    error,
                    orderId,
                });
            }
        }
    }
};

let timerInterval: NodeJS.Timeout | null = null;

export const startTimers = (intervalMs = 5 * 60 * 1000): void => {
    if (timerInterval) {
        clearInterval(timerInterval);
    }

    processEscrowTimers().catch((err) => {
        safeLogger.error('Error in initial processEscrowTimers run', { error: err });
    });

    timerInterval = setInterval(() => {
        processEscrowTimers().catch((err) => {
            safeLogger.error('Error in processEscrowTimers interval', { error: err });
        });
    }, intervalMs);
};

export const stopTimers = (): void => {
    if (timerInterval) {
        clearInterval(timerInterval);
        timerInterval = null;
    }
};

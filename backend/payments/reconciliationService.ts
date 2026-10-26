/**
 * C-CORE-6a — reconciliation detect / fix / flag.
 *
 * Safe actions only: amount_minor + raw_payload + paid_at from Verify;
 * pending → failed/abandoned when Verify says so; orphan success → flag only.
 * Order status writes go through StatusRepairPort (C-CORE-6b) — not implemented here.
 */

import { getSupabaseAdmin } from '../data/supabaseAdmin';
import {
    resolvePaystackPayment,
    type PaystackVerifyResult,
} from './paystackVerify';
import { safeLogger } from '../http/redact';

/** Shannon exports this; John wires it in C-CORE-6b. Do not implement markPaid here. */
export type StatusRepairPort = {
    markPaidFromProvider(input: {
        reference: string;
        amountMinor: number;
        currency: string;
        paidAt: string;
        raw?: unknown;
    }): Promise<{ ok: true } | { ok: false; reason: string }>;
};

export type ReconcileAction =
    | 'amount_fixed'
    | 'marked_success'
    | 'marked_failed'
    | 'marked_abandoned'
    | 'orphan_flagged'
    | 'status_repair_deferred'
    | 'noop';

export type ReconcileItemResult = {
    paymentId: string;
    reference: string;
    actions: ReconcileAction[];
    error?: string;
};

export type ReconcileSummary = {
    scanned: number;
    amountFixed: number;
    markedSuccess: number;
    markedFailed: number;
    markedAbandoned: number;
    orphansFlagged: number;
    statusRepairDeferred: number;
    errors: number;
    items: ReconcileItemResult[];
};

export type ReconcileOptions = {
    /** Minutes a pending payment must age before Verify is consulted. */
    stalePendingMinutes?: number;
    /** Max payments to process in one run. */
    limit?: number;
    statusRepair?: StatusRepairPort | null;
    resolvePayment?: (reference: string) => Promise<PaystackVerifyResult>;
    now?: Date;
};

type PaymentRow = {
    id: string;
    reference: string;
    status: string;
    amount_minor: number;
    currency: string;
    raw_payload: Record<string, unknown> | null;
    paid_at: string | null;
    created_at: string;
};

const DEFAULT_STALE_MINUTES = 15;
const DEFAULT_LIMIT = 50;

const mergeRawPayload = (
    existing: Record<string, unknown> | null,
    patch: Record<string, unknown>
): Record<string, unknown> => ({
    ...(existing && typeof existing === 'object' ? existing : {}),
    ...patch,
});

const decideTerminalPaymentStatus = (
    verifyStatus: string
): 'failed' | 'abandoned' | null => {
    if (verifyStatus === 'failed') return 'failed';
    if (verifyStatus === 'abandoned') return 'abandoned';
    return null;
};

/**
 * Pure decision helper — exported for unit tests.
 */
export const decideReconcileActions = (input: {
    payment: Pick<PaymentRow, 'status' | 'amount_minor' | 'raw_payload'>;
    verify: Pick<PaystackVerifyResult, 'status' | 'amountMinor'>;
    hasLinkedOrder: boolean;
    hasStatusRepair: boolean;
}): ReconcileAction[] => {
    const actions: ReconcileAction[] = [];
    const { payment, verify, hasLinkedOrder, hasStatusRepair: _hasStatusRepair } = input;

    if (
        verify.status === 'success' &&
        Number(payment.amount_minor) !== Number(verify.amountMinor)
    ) {
        actions.push('amount_fixed');
    }

    if (payment.status === 'pending') {
        if (verify.status === 'success') {
            actions.push('marked_success');
        }
        const terminal = decideTerminalPaymentStatus(verify.status);
        if (terminal === 'failed') actions.push('marked_failed');
        if (terminal === 'abandoned') actions.push('marked_abandoned');
    }

    if (verify.status === 'success' && !hasLinkedOrder) {
        const alreadyFlagged = Boolean(
            (payment.raw_payload as any)?.reconciliation?.orphanSuccess
        );
        if (!alreadyFlagged) {
            actions.push('orphan_flagged');
        }
    }

    // Order status repair is Shannon's port (C-CORE-6b). We never write orders.status here.
    if (verify.status === 'success' && hasLinkedOrder && payment.status === 'pending') {
        actions.push('status_repair_deferred');
    }

    if (actions.length === 0) {
        actions.push('noop');
    }

    return actions;
};

export const runReconciliation = async (
    options: ReconcileOptions = {}
): Promise<ReconcileSummary> => {
    const supabase = getSupabaseAdmin();
    const staleMinutes = options.stalePendingMinutes ?? DEFAULT_STALE_MINUTES;
    const limit = options.limit ?? DEFAULT_LIMIT;
    const resolvePayment = options.resolvePayment ?? resolvePaystackPayment;
    const statusRepair = options.statusRepair ?? null;
    const now = options.now ?? new Date();
    const staleBefore = new Date(now.getTime() - staleMinutes * 60_000).toISOString();

    const summary: ReconcileSummary = {
        scanned: 0,
        amountFixed: 0,
        markedSuccess: 0,
        markedFailed: 0,
        markedAbandoned: 0,
        orphansFlagged: 0,
        statusRepairDeferred: 0,
        errors: 0,
        items: [],
    };

    const { data: pendingRows, error: pendingError } = await supabase
        .from('payments')
        .select('id, reference, status, amount_minor, currency, raw_payload, paid_at, created_at')
        .eq('status', 'pending')
        .lt('created_at', staleBefore)
        .order('created_at', { ascending: true })
        .limit(limit);

    if (pendingError) {
        throw new Error(pendingError.message);
    }

    const remaining = Math.max(0, limit - (pendingRows?.length ?? 0));

    let successRows: PaymentRow[] = [];
    if (remaining > 0) {
        const { data, error: successError } = await supabase
            .from('payments')
            .select('id, reference, status, amount_minor, currency, raw_payload, paid_at, created_at')
            .eq('status', 'success')
            .order('created_at', { ascending: true })
            .limit(remaining);

        if (successError) {
            throw new Error(successError.message);
        }
        successRows = (data ?? []) as PaymentRow[];
    }

    // Prefer pending candidates; then success rows (amount drift + orphans).
    const candidates: PaymentRow[] = [
        ...((pendingRows ?? []) as PaymentRow[]),
        ...successRows,
    ].slice(0, limit);

    for (const payment of candidates) {
        summary.scanned += 1;
        const item: ReconcileItemResult = {
            paymentId: payment.id,
            reference: payment.reference,
            actions: [],
        };

        try {
            const { data: orderRows, error: orderError } = await supabase
                .from('orders')
                .select('id')
                .eq('payment_id', payment.id)
                .limit(1);

            if (orderError) {
                throw new Error(orderError.message);
            }

            const hasLinkedOrder = (orderRows?.length ?? 0) > 0;
            const verify = await resolvePayment(payment.reference);
            const actions = decideReconcileActions({
                payment,
                verify,
                hasLinkedOrder,
                hasStatusRepair: Boolean(statusRepair),
            });

            const update: Record<string, unknown> = {};
            let rawPayload = payment.raw_payload;

            if (actions.includes('amount_fixed')) {
                update.amount_minor = verify.amountMinor;
                update.currency = verify.currency;
                if (verify.paidAt) {
                    update.paid_at = verify.paidAt;
                }
                if (verify.channel) {
                    const channel =
                        verify.channel === 'mobile_money' || verify.channel === 'mpesa'
                            ? 'mpesa'
                            : verify.channel === 'card'
                              ? 'card'
                              : undefined;
                    if (channel) {
                        update.channel = channel;
                    }
                }
                rawPayload = mergeRawPayload(rawPayload, {
                    reconciliation_verify: verify.raw,
                });
                summary.amountFixed += 1;
            }

            if (actions.includes('marked_success')) {
                update.status = 'success';
                if (verify.paidAt) {
                    update.paid_at = verify.paidAt;
                } else if (!payment.paid_at) {
                    update.paid_at = now.toISOString();
                }
                if (verify.amountMinor > 0 && update.amount_minor == null) {
                    update.amount_minor = verify.amountMinor;
                }
                rawPayload = mergeRawPayload(rawPayload, {
                    reconciliation_verify: verify.raw,
                });
                summary.markedSuccess += 1;
            }

            if (actions.includes('marked_failed')) {
                update.status = 'failed';
                rawPayload = mergeRawPayload(rawPayload, {
                    reconciliation_verify: verify.raw,
                });
                summary.markedFailed += 1;
            }

            if (actions.includes('marked_abandoned')) {
                update.status = 'abandoned';
                rawPayload = mergeRawPayload(rawPayload, {
                    reconciliation_verify: verify.raw,
                });
                summary.markedAbandoned += 1;
            }

            if (actions.includes('orphan_flagged')) {
                rawPayload = mergeRawPayload(rawPayload, {
                    reconciliation: {
                        orphanSuccess: true,
                        flaggedAt: now.toISOString(),
                        note: 'Paystack success with no linked order — flag only (do not invent orders)',
                    },
                    reconciliation_verify: verify.raw,
                });
                summary.orphansFlagged += 1;
                safeLogger.warn('reconcile.orphan_success', {
                    paymentId: payment.id,
                    reference: payment.reference,
                });
            }

            if (actions.includes('status_repair_deferred')) {
                summary.statusRepairDeferred += 1;
                // C-CORE-6b: call statusRepair.markPaidFromProvider when Shannon ships it.
                if (statusRepair && verify.status === 'success') {
                    const repair = await statusRepair.markPaidFromProvider({
                        reference: payment.reference,
                        amountMinor: verify.amountMinor,
                        currency: verify.currency,
                        paidAt: verify.paidAt ?? now.toISOString(),
                        raw: verify.raw,
                    });
                    if (!repair.ok) {
                        safeLogger.warn('reconcile.status_repair_failed', {
                            reference: payment.reference,
                            reason: repair.reason,
                        });
                    }
                }
            }

            if (Object.keys(update).length > 0 || actions.includes('orphan_flagged')) {
                update.raw_payload = rawPayload;
                const { error: updateError } = await supabase
                    .from('payments')
                    .update(update)
                    .eq('id', payment.id);

                if (updateError) {
                    throw new Error(updateError.message);
                }
            }

            item.actions = actions;
        } catch (error: any) {
            summary.errors += 1;
            item.error = error?.message || 'Unknown reconciliation error';
            item.actions = ['noop'];
            safeLogger.error('reconcile.item_failed', {
                paymentId: payment.id,
                reference: payment.reference,
                message: item.error,
            });
        }

        summary.items.push(item);
    }

    return summary;
};

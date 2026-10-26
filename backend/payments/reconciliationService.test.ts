import { describe, expect, it } from 'vitest';
import { decideReconcileActions } from './reconciliationService';

describe('decideReconcileActions', () => {
    const basePayment = {
        status: 'pending' as string,
        amount_minor: 1000,
        raw_payload: null as Record<string, unknown> | null,
    };

    it('fixes amount when Verify amount differs', () => {
        const actions = decideReconcileActions({
            payment: { ...basePayment, status: 'success', amount_minor: 1000 },
            verify: { status: 'success', amountMinor: 1500 },
            hasLinkedOrder: true,
            hasStatusRepair: false,
        });
        expect(actions).toContain('amount_fixed');
    });

    it('marks pending → failed when Verify failed', () => {
        const actions = decideReconcileActions({
            payment: basePayment,
            verify: { status: 'failed', amountMinor: 0 },
            hasLinkedOrder: false,
            hasStatusRepair: false,
        });
        expect(actions).toContain('marked_failed');
        expect(actions).not.toContain('orphan_flagged');
    });

    it('marks pending → abandoned when Verify abandoned', () => {
        const actions = decideReconcileActions({
            payment: basePayment,
            verify: { status: 'abandoned', amountMinor: 0 },
            hasLinkedOrder: false,
            hasStatusRepair: false,
        });
        expect(actions).toContain('marked_abandoned');
    });

    it('flags orphan success without inventing an order', () => {
        const actions = decideReconcileActions({
            payment: { ...basePayment, status: 'success' },
            verify: { status: 'success', amountMinor: 1000 },
            hasLinkedOrder: false,
            hasStatusRepair: false,
        });
        expect(actions).toContain('orphan_flagged');
    });

    it('does not re-flag an already flagged orphan', () => {
        const actions = decideReconcileActions({
            payment: {
                status: 'success',
                amount_minor: 1000,
                raw_payload: {
                    reconciliation: { orphanSuccess: true },
                },
            },
            verify: { status: 'success', amountMinor: 1000 },
            hasLinkedOrder: false,
            hasStatusRepair: false,
        });
        expect(actions).toEqual(['noop']);
    });

    it('defers order status repair when Verify success + linked order + pending payment', () => {
        const actions = decideReconcileActions({
            payment: basePayment,
            verify: { status: 'success', amountMinor: 1000 },
            hasLinkedOrder: true,
            hasStatusRepair: true,
        });
        expect(actions).toContain('status_repair_deferred');
        expect(actions).toContain('marked_success');
    });
});

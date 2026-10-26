import { describe, expect, it } from 'vitest';
import { ESCROW_POLICY_DEFAULTS, resolveEscrowPolicy } from './escrowPolicy';

describe('resolveEscrowPolicy', () => {
    it('falls back to the ADR-11 defaults when no env is set', () => {
        const policy = resolveEscrowPolicy({});

        expect(policy).toEqual(ESCROW_POLICY_DEFAULTS);
    });

    it('reads tunable values from the environment', () => {
        const policy = resolveEscrowPolicy({
            ESCROW_SHIP_BY_DAYS: '2',
            ESCROW_AUTO_RELEASE_DAYS: '10',
            ESCROW_COMMISSION_RATE: '0.15',
            ESCROW_VAT_RATE: '0.2',
            ESCROW_BUYER_REMINDER_DAYS: '4,8',
            ESCROW_SELLER_REMINDER_DAYS: '1',
        });

        expect(policy.shipByDays).toBe(2);
        expect(policy.autoReleaseDays).toBe(10);
        expect(policy.commissionRate).toBe(0.15);
        expect(policy.vatRate).toBe(0.2);
        expect(policy.buyerReminderDays).toEqual([4, 8]);
        expect(policy.sellerReminderDays).toEqual([1]);
    });

    it('rejects a non-integer ship-by window', () => {
        expect(() => resolveEscrowPolicy({ ESCROW_SHIP_BY_DAYS: '2.5' })).toThrow(
            'ESCROW_SHIP_BY_DAYS must be an integer'
        );
    });

    it('rejects a non-positive ship-by window', () => {
        expect(() => resolveEscrowPolicy({ ESCROW_SHIP_BY_DAYS: '0' })).toThrow(
            'ESCROW_SHIP_BY_DAYS must be greater than 0'
        );
    });

    it('rejects an auto-release window that is not after the ship-by deadline', () => {
        expect(() =>
            resolveEscrowPolicy({
                ESCROW_SHIP_BY_DAYS: '5',
                ESCROW_AUTO_RELEASE_DAYS: '5',
            })
        ).toThrow('must be greater than ESCROW_SHIP_BY_DAYS');
    });

    it('rejects a commission rate outside 0 <= x < 1', () => {
        expect(() => resolveEscrowPolicy({ ESCROW_COMMISSION_RATE: '1' })).toThrow(
            'ESCROW_COMMISSION_RATE must be between 0 (inclusive) and 1 (exclusive)'
        );
        expect(() => resolveEscrowPolicy({ ESCROW_COMMISSION_RATE: '-0.1' })).toThrow(
            'ESCROW_COMMISSION_RATE must be between 0 (inclusive) and 1 (exclusive)'
        );
    });

    it('rejects a non-numeric commission rate', () => {
        expect(() => resolveEscrowPolicy({ ESCROW_COMMISSION_RATE: 'ten percent' })).toThrow(
            'ESCROW_COMMISSION_RATE must be a number'
        );
    });

    it('rejects a VAT rate outside 0 <= x < 1', () => {
        expect(() => resolveEscrowPolicy({ ESCROW_VAT_RATE: '16' })).toThrow(
            'ESCROW_VAT_RATE must be between 0 (inclusive) and 1 (exclusive)'
        );
        expect(() => resolveEscrowPolicy({ ESCROW_VAT_RATE: 'sixteen' })).toThrow(
            'ESCROW_VAT_RATE must be a number'
        );
    });

    it('rejects reminders that fire after the window they belong to', () => {
        expect(() =>
            resolveEscrowPolicy({
                ESCROW_AUTO_RELEASE_DAYS: '7',
                ESCROW_BUYER_REMINDER_DAYS: '3,9',
            })
        ).toThrow('ESCROW_BUYER_REMINDER_DAYS contains 9');

        expect(() =>
            resolveEscrowPolicy({
                ESCROW_SHIP_BY_DAYS: '3',
                ESCROW_SELLER_REMINDER_DAYS: '3',
            })
        ).toThrow('ESCROW_SELLER_REMINDER_DAYS contains 3');
    });

    it('deduplicates and sorts reminder days', () => {
        const policy = resolveEscrowPolicy({ ESCROW_BUYER_REMINDER_DAYS: '6,3,3' });

        expect(policy.buyerReminderDays).toEqual([3, 6]);
    });
});

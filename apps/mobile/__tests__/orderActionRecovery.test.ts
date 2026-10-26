import { describe, expect, it } from 'vitest';
import {
    orderReachedActionTarget,
    shouldRecheckOrderAfterError,
} from '../src/lib/orderActionRecovery';

describe('shouldRecheckOrderAfterError', () => {
    it('rechecks after a client timeout, a backend timeout or a conflict', () => {
        expect(shouldRecheckOrderAfterError({ status: 0, errorCode: 'TIMEOUT' })).toBe(true);
        expect(
            shouldRecheckOrderAfterError({ status: 503, errorCode: 'ESCROW_BACKEND_TIMEOUT' })
        ).toBe(true);
        expect(shouldRecheckOrderAfterError({ status: 409, errorCode: 'ILLEGAL_TRANSITION' })).toBe(
            true
        );
        expect(shouldRecheckOrderAfterError({ status: 503, errorCode: 'AUTH_UNAVAILABLE' })).toBe(
            true
        );
    });

    it('does not recheck after errors that mean the action was refused', () => {
        expect(shouldRecheckOrderAfterError({ status: 403, errorCode: 'FORBIDDEN' })).toBe(false);
        expect(
            shouldRecheckOrderAfterError({ status: 400, errorCode: 'PAYOUT_DETAILS_REQUIRED' })
        ).toBe(false);
        expect(shouldRecheckOrderAfterError({ status: 0, errorCode: 'NETWORK_ERROR' })).toBe(false);
    });
});

describe('orderReachedActionTarget', () => {
    it('treats delivered or released as a landed confirm', () => {
        expect(orderReachedActionTarget('confirm-receipt', 'delivered')).toBe(true);
        expect(orderReachedActionTarget('confirm-receipt', 'released')).toBe(true);
        expect(orderReachedActionTarget('confirm-receipt', 'shipped')).toBe(false);
    });

    it('treats disputed as a landed dispute only', () => {
        expect(orderReachedActionTarget('dispute', 'disputed')).toBe(true);
        expect(orderReachedActionTarget('dispute', 'shipped')).toBe(false);
        expect(orderReachedActionTarget('confirm-receipt', 'disputed')).toBe(false);
    });

    it('treats shipped and later as a landed ship', () => {
        expect(orderReachedActionTarget('ship', 'shipped')).toBe(true);
        expect(orderReachedActionTarget('ship', 'in_escrow')).toBe(false);
    });

    it('is false when the order status is unknown', () => {
        expect(orderReachedActionTarget('dispute', undefined)).toBe(false);
    });
});

import { describe, expect, it } from 'vitest';
import {
    ORDER_TONE_COLORS,
    formatOrderId,
    orderStatusColors,
    orderStatusLabel,
    orderStatusTone,
} from '../src/lib/orderDisplay';

describe('formatOrderId', () => {
    it('shortens a provider reference to a readable tail', () => {
        expect(formatOrderId('mpesa_4af74be0-3ff6-4fd7-a520-59cd5c42059e')).toBe('#5C42059E');
    });

    it('keeps ids distinct when they share a prefix', () => {
        const a = formatOrderId('mpesa_4af74be0-3ff6-4fd7-a520-59cd5c42059e');
        const b = formatOrderId('mpesa_4af74be0-3ff6-4fd7-a520-59cd5c42059f');
        expect(a).not.toBe(b);
    });

    it('returns the input when there is nothing alphanumeric to shorten', () => {
        expect(formatOrderId('---')).toBe('---');
    });
});

describe('orderStatusLabel', () => {
    it('distinguishes escrow states that collapse onto processing', () => {
        expect(orderStatusLabel({ status: 'processing', escrowStatus: 'pending_payment' })).toBe(
            'PROCESSING'
        );
        expect(orderStatusLabel({ status: 'processing', escrowStatus: 'paid' })).toBe('PAID');
        expect(orderStatusLabel({ status: 'processing', escrowStatus: 'in_escrow' })).toBe(
            'IN ESCROW'
        );
    });

    it('labels a disputed order as on hold', () => {
        expect(orderStatusLabel({ status: 'processing', escrowStatus: 'disputed' })).toBe(
            'ON HOLD'
        );
    });

    it('falls back to the domain status when the API supplied no escrow status', () => {
        expect(orderStatusLabel({ status: 'shipped' })).toBe('SHIPPED');
        expect(orderStatusLabel({ status: 'cancelled' })).toBe('CANCELLED');
    });
});

describe('orderStatusTone', () => {
    it('warns on disputed and flags cancelled as danger', () => {
        expect(orderStatusTone({ status: 'processing', escrowStatus: 'disputed' })).toBe('warning');
        expect(orderStatusTone({ status: 'cancelled', escrowStatus: 'cancelled' })).toBe('danger');
    });

    it('keeps the happy path positive and unpaid orders neutral', () => {
        expect(orderStatusTone({ status: 'processing', escrowStatus: 'in_escrow' })).toBe('positive');
        expect(orderStatusTone({ status: 'delivered', escrowStatus: 'released' })).toBe('positive');
        expect(orderStatusTone({ status: 'processing', escrowStatus: 'pending_payment' })).toBe(
            'neutral'
        );
        expect(orderStatusTone({ status: 'cancelled', escrowStatus: 'refunded' })).toBe('neutral');
    });

    it('falls back to the domain status', () => {
        expect(orderStatusTone({ status: 'cancelled' })).toBe('danger');
        expect(orderStatusTone({ status: 'shipped' })).toBe('positive');
    });

    it('gives a disputed order a pill that is not the green success colour', () => {
        const colors = orderStatusColors({ status: 'processing', escrowStatus: 'disputed' });
        expect(colors).toEqual(ORDER_TONE_COLORS.warning);
        expect(colors.text).not.toBe(ORDER_TONE_COLORS.positive.text);
    });
});

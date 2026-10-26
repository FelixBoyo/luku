import { describe, expect, it } from 'vitest';
import {
    assertSingleSeller,
    sellerKeyFromListing,
    sellerKeyFromProduct,
    SingleSellerViolationError,
} from './sellerKey';

describe('sellerKey', () => {
    it('namespaces catalog and peer sellers', () => {
        expect(sellerKeyFromProduct('biz_1')).toBe('business:biz_1');
        expect(sellerKeyFromListing('user_1')).toBe('peer:user_1');
    });

    it('allows a single key or empty list', () => {
        expect(() => assertSingleSeller([])).not.toThrow();
        expect(() => assertSingleSeller(['business:biz_1'])).not.toThrow();
        expect(() =>
            assertSingleSeller(['business:biz_1', 'business:biz_1'])
        ).not.toThrow();
    });

    it('rejects mixed businesses', () => {
        expect(() =>
            assertSingleSeller(['business:biz_1', 'business:biz_2'])
        ).toThrow(SingleSellerViolationError);
    });

    it('rejects catalog mixed with peer', () => {
        expect(() =>
            assertSingleSeller(['business:biz_1', 'peer:user_1'])
        ).toThrow(SingleSellerViolationError);
    });

    it('rejects two different peer sellers', () => {
        expect(() => assertSingleSeller(['peer:a', 'peer:b'])).toThrow(
            SingleSellerViolationError
        );
    });
});

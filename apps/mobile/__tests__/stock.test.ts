import { describe, expect, it } from 'vitest';
import { isSoldOut, maxSelectableQty, firstInStock } from '../src/lib/stock';

describe('isSoldOut', () => {
    it('is true only for tracked stock of exactly 0', () => {
        expect(isSoldOut({ stockQuantity: 0 })).toBe(true);
    });

    it('is false when stock remains', () => {
        expect(isSoldOut({ stockQuantity: 3 })).toBe(false);
    });

    it('is false when stock is untracked (undefined is not "none left")', () => {
        expect(isSoldOut({ stockQuantity: undefined })).toBe(false);
    });
});

describe('maxSelectableQty', () => {
    it('caps at the tracked quantity', () => {
        expect(maxSelectableQty({ stockQuantity: 4 })).toBe(4);
    });

    it('returns 0 for a sold-out item so callers cannot add it', () => {
        expect(maxSelectableQty({ stockQuantity: 0 })).toBe(0);
    });

    it('is unbounded when stock is untracked', () => {
        expect(maxSelectableQty({ stockQuantity: undefined })).toBe(Number.MAX_SAFE_INTEGER);
    });
});

describe('firstInStock', () => {
    it('prefers the first item still in stock for the billboard', () => {
        const picked = firstInStock([
            { stockQuantity: 0 },
            { stockQuantity: 2 },
            { stockQuantity: 5 },
        ]);
        expect(picked).toEqual({ stockQuantity: 2 });
    });

    it('falls back to the first item when the whole catalogue is sold out', () => {
        const picked = firstInStock([{ stockQuantity: 0 }, { stockQuantity: 0 }]);
        expect(picked).toEqual({ stockQuantity: 0 });
    });

    it('is undefined for an empty list', () => {
        expect(firstInStock([])).toBeUndefined();
    });
});

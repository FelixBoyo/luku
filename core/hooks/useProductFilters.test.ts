import { renderHook } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { useProductFilters, type ProductLike } from './useProductFilters';

const product = (overrides: Partial<ProductLike> & { id: string }): ProductLike => ({
    name: 'Generic Item',
    description: '',
    price: 50,
    category: 'tops',
    color: 'blue',
    style: 'casual',
    is_active: true,
    ...overrides,
});

const fixtures: ProductLike[] = [
    product({
        id: 'p1',
        name: 'Linen Shirt',
        description: 'Light blue linen shirt',
        price: 45,
        category: 'tops',
        color: 'blue',
        style: 'casual',
    }),
    product({
        id: 'p2',
        name: 'Wool Coat',
        description: 'Heavy wool overcoat',
        price: 220,
        category: 'outerwear',
        color: 'black',
        style: 'formal',
    }),
    product({
        id: 'p3',
        name: 'Denim Jeans',
        description: 'Classic blue denim',
        price: 80,
        category: 'bottoms',
        color: 'blue',
        style: 'casual',
    }),
    product({
        id: 'p4',
        name: 'Discontinued Tee',
        description: 'Old plain tee',
        price: 15,
        category: 'tops',
        color: 'white',
        style: 'casual',
        is_active: false,
    }),
];

describe('useProductFilters', () => {
    it('returns the full active set when no filters are provided', () => {
        const { result } = renderHook(() => useProductFilters(fixtures));
        expect(result.current.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    });

    it('includes inactive products when onlyActive is false', () => {
        const { result } = renderHook(() =>
            useProductFilters(fixtures, { onlyActive: false })
        );
        expect(result.current.map((p) => p.id)).toEqual([
            'p1',
            'p2',
            'p3',
            'p4',
        ]);
    });

    it('filters by category case-insensitively', () => {
        const { result } = renderHook(() =>
            useProductFilters(fixtures, { category: 'TOPS' })
        );
        expect(result.current.map((p) => p.id)).toEqual(['p1']);
    });

    it('filters by color and style together', () => {
        const { result } = renderHook(() =>
            useProductFilters(fixtures, { color: 'blue', style: 'casual' })
        );
        expect(result.current.map((p) => p.id)).toEqual(['p1', 'p3']);
    });

    it('respects minPrice and maxPrice bounds', () => {
        const { result } = renderHook(() =>
            useProductFilters(fixtures, { minPrice: 50, maxPrice: 100 })
        );
        expect(result.current.map((p) => p.id)).toEqual(['p3']);
    });

    it('matches free-text query against name and description', () => {
        const { result } = renderHook(() =>
            useProductFilters(fixtures, { query: 'wool' })
        );
        expect(result.current.map((p) => p.id)).toEqual(['p2']);
    });

    it('treats empty / whitespace query as no filter', () => {
        const { result } = renderHook(() =>
            useProductFilters(fixtures, { query: '   ' })
        );
        expect(result.current.map((p) => p.id)).toEqual(['p1', 'p2', 'p3']);
    });

    it('returns an empty list when filters match nothing', () => {
        const { result } = renderHook(() =>
            useProductFilters(fixtures, { category: 'shoes' })
        );
        expect(result.current).toEqual([]);
    });

    it('memoizes the result against stable inputs', () => {
        const filters = { category: 'tops' };
        const { result, rerender } = renderHook(
            ({ list, f }: { list: ProductLike[]; f: typeof filters }) =>
                useProductFilters(list, f),
            { initialProps: { list: fixtures, f: filters } }
        );
        const first = result.current;
        rerender({ list: fixtures, f: filters });
        expect(result.current).toBe(first);
    });

    it('produces a new reference when the products array changes', () => {
        const { result, rerender } = renderHook(
            ({ list }: { list: ProductLike[] }) => useProductFilters(list),
            { initialProps: { list: fixtures } }
        );
        const first = result.current;
        rerender({ list: [...fixtures] });
        expect(result.current).not.toBe(first);
        expect(result.current.map((p) => p.id)).toEqual(first.map((p) => p.id));
    });
});

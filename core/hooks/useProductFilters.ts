import { useMemo } from 'react';

/**
 * Minimal structural shape this hook needs from a "product".
 * The web app's `Product` type and the mobile app's product fixture both
 * satisfy this contract structurally; we deliberately do not import from
 * the root `types.ts` so that `core/` stays portable across web and RN.
 */
export interface ProductLike {
    id: string;
    name: string;
    description?: string;
    price: number;
    category: string;
    color: string;
    style: string;
    is_active?: boolean;
}

export interface ProductFilters {
    /** Free-text query matched against name + description (case-insensitive). */
    query?: string;
    category?: string;
    color?: string;
    style?: string;
    minPrice?: number;
    maxPrice?: number;
    /**
     * If true (default), excludes items where `is_active === false`.
     * Pass `false` to include all items regardless of active state.
     */
    onlyActive?: boolean;
}

const matchesQuery = (product: ProductLike, query: string): boolean => {
    if (!query) return true;
    const haystack = `${product.name} ${product.description ?? ''}`.toLowerCase();
    return haystack.includes(query.toLowerCase());
};

const matchesEnum = (
    productValue: string,
    filterValue: string | undefined
): boolean => {
    if (!filterValue) return true;
    return productValue.toLowerCase() === filterValue.toLowerCase();
};

const matchesPrice = (
    price: number,
    minPrice: number | undefined,
    maxPrice: number | undefined
): boolean => {
    if (minPrice !== undefined && price < minPrice) return false;
    if (maxPrice !== undefined && price > maxPrice) return false;
    return true;
};

/**
 * Pure, portable product filter hook.
 *
 * No DOM, no RN, no `import.meta`, no I/O - safe for both web (Vite) and
 * React Native (Metro) bundlers. Memoizes the filtered list against the
 * input array reference and the filter values so consumers can pass the
 * raw store slice without worrying about per-render churn.
 */
export function useProductFilters<T extends ProductLike>(
    products: readonly T[],
    filters: ProductFilters = {}
): T[] {
    const {
        query,
        category,
        color,
        style,
        minPrice,
        maxPrice,
        onlyActive = true,
    } = filters;

    return useMemo(() => {
        const trimmedQuery = query?.trim() ?? '';

        return products.filter((product) => {
            if (onlyActive && product.is_active === false) return false;
            if (!matchesEnum(product.category, category)) return false;
            if (!matchesEnum(product.color, color)) return false;
            if (!matchesEnum(product.style, style)) return false;
            if (!matchesPrice(product.price, minPrice, maxPrice)) return false;
            if (!matchesQuery(product, trimmedQuery)) return false;
            return true;
        });
    }, [
        products,
        query,
        category,
        color,
        style,
        minPrice,
        maxPrice,
        onlyActive,
    ]);
}

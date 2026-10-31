import { useCallback, useEffect, useState } from 'react';
import type { Product } from '../types/domain/product';
import { repositories } from '../repositories';
import type { ProductListQuery } from '../../../../packages/contracts/src/products';

export const useProduct = (id: string) => {
    const [product, setProduct] = useState<Product | null>(null);
    const [loading, setLoading] = useState(true);
    const [notFound, setNotFound] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const load = useCallback(async () => {
        setLoading(true);
        setError(null);
        setNotFound(false);
        try {
            const p = await repositories.products.getById(id);
            if (!p) {
                setProduct(null);
                setNotFound(true);
            } else {
                setProduct(p);
            }
        } catch (e) {
            setError(e instanceof Error ? e.message : 'Failed to load product');
            setProduct(null);
        } finally {
            setLoading(false);
        }
    }, [id]);

    useEffect(() => {
        load();
    }, [load]);

    return { product, loading, notFound, error, retry: load };
};


export const useActiveProducts = (query?: ProductListQuery) => {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [page, setPage] = useState(query?.page ?? 1);
    const [hasMore, setHasMore] = useState(false);

    const serializedQuery = JSON.stringify(query);

    const load = useCallback(async (reset = false) => {
        const targetPage = reset ? 1 : page + 1;
        if (reset) {
            setLoading(true);
        } else {
            setLoadingMore(true);
        }
        setError(null);
        
        try {
            const parsedQuery = serializedQuery ? JSON.parse(serializedQuery) : {};
            const result = await repositories.products.listActive({
                ...parsedQuery,
                page: targetPage,
                limit: parsedQuery.limit ?? 50,
            });
            console.log('[products] listActive returned', result.items.length, 'items; first:', JSON.stringify(result.items[0], null, 2));
            
            setProducts(prev => reset ? result.items : [...prev, ...result.items]);
            setPage(targetPage);
            setHasMore(targetPage < result.pagination.pages);
        } catch (e) {
                console.log('[products] listActive FAILED', e);
            setError(e instanceof Error ? e.message : 'Failed to load products');
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [serializedQuery, page]);

    useEffect(() => {
        load(true);
    }, [serializedQuery]);

    const loadMore = useCallback(() => {
        if (!loading && !loadingMore && hasMore) {
            load(false);
        }
    }, [loading, loadingMore, hasMore, load]);

    // Memoised so callers can put it in a dependency array; pull-to-refresh
    // rebuilt its handler on every render while this was an inline arrow.
    const retry = useCallback(() => load(true), [load]);

    return { products, loading, loadingMore, hasMore, error, retry, loadMore };
};

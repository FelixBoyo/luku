import { fetchBffProductById, fetchBffProducts } from '../api/bffProducts';
import { getProductById, mockProducts } from '../data/mock/products';
import type { Product } from '../types/domain/product';
import { dtoToDisplayProduct, toDisplayProduct } from '../lib/productAdapter';
import type { ProductListQuery } from '../../../../packages/contracts/src/products';
import type { PaginatedItems } from '../../../../packages/contracts/src/envelope';

export type ProductsRepository = {
    listActive: (query?: ProductListQuery) => Promise<PaginatedItems<Product>>;
    getById: (id: string) => Promise<Product | null>;
};

export const createMockProductsRepository = (): ProductsRepository => ({
    listActive: async (query) => {
        const limit = query?.limit ?? 50;
        const page = query?.page ?? 1;
        const start = (page - 1) * limit;
        const items = mockProducts.slice(start, start + limit).map(toDisplayProduct);
        return {
            items,
            pagination: {
                page,
                limit,
                total: mockProducts.length,
                pages: Math.ceil(mockProducts.length / limit) || 1,
            }
        };
    },
    getById: async (id) => toDisplayProduct(getProductById(id)),
});

/** Express BFF-backed catalog (platform gate spike — M2 extends) */
export const createApiProductsRepository = (): ProductsRepository => ({
    listActive: async (query) => {
        const rows = await fetchBffProducts(query);
        return {
            ...rows,
            items: rows.items.map(dtoToDisplayProduct),
        };
    },
    getById: async (id) => {
        const row = await fetchBffProductById(id);
        if (!row) return null;
        return dtoToDisplayProduct(row);
    },
});

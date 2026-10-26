import type { ProductDto, ProductListQuery } from '../../../../packages/contracts/src/products';
import type { PaginatedItems } from '../../../../packages/contracts/src/envelope';
import { apiGet, ApiError } from './apiClient';

export const fetchBffProducts = async (query?: ProductListQuery): Promise<PaginatedItems<ProductDto>> => {
    const params = new URLSearchParams();
    if (query?.limit) params.append('limit', String(query.limit));
    if (query?.page) params.append('page', String(query.page));
    if (query?.search) params.append('search', query.search);
    if (query?.category) params.append('category', query.category);
    if (query?.color) params.append('color', query.color);
    if (query?.style) params.append('style', query.style);
    if (query?.minPrice) params.append('minPrice', String(query.minPrice));
    if (query?.maxPrice) params.append('maxPrice', String(query.maxPrice));
    
    const qs = params.toString();
    const url = qs ? `/v1/api/products?${qs}` : '/v1/api/products';
    
    const response = await apiGet<PaginatedItems<ProductDto>>(url, false);
    return response.data;
};

export const fetchBffProductById = async (id: string): Promise<ProductDto | null> => {
    try {
        const response = await apiGet<ProductDto>(`/v1/api/products/${id}`, false);
        return response.data;
    } catch (err) {
        if (err instanceof ApiError && err.status === 404) {
            return null;
        }
        throw err;
    }
};

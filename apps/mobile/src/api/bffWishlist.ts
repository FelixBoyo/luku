import type { WishlistItemDto } from '../../../../packages/contracts/src/products';
import { apiGet, apiPost, apiDelete } from './apiClient';

export const fetchBffWishlist = async (): Promise<WishlistItemDto[]> => {
    try {
        const response = await apiGet<WishlistItemDto[]>('/v1/api/wishlist');
        return response.data;
    } catch {
        return [];
    }
};

export const addToBffWishlist = async (productId: string): Promise<boolean> => {
    try {
        await apiPost(`/v1/api/wishlist/${productId}`, {});
        return true;
    } catch {
        return false;
    }
};

export const removeFromBffWishlist = async (productId: string): Promise<boolean> => {
    try {
        await apiDelete(`/v1/api/wishlist/${productId}`);
        return true;
    } catch {
        return false;
    }
};

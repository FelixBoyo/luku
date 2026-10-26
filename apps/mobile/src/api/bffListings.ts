import { apiGet, apiPost, apiDelete, apiRequest } from './apiClient';

export type ListingDto = {
    id: string;
    sellerId: string;
    wardrobeItemId: string | null;
    productId: string | null;
    title: string;
    description: string | null;
    price: number;
    currency: string;
    category: string | null;
    size: string | null;
    condition: string | null;
    imageUrl: string;
    status: 'Active' | 'Draft' | 'Sold';
    viewCount: number;
    createdAt: string;
    updatedAt: string;
};

export type ListingWritePayload = {
    title: string;
    description?: string;
    price: number;
    category?: string;
    size?: string;
    condition?: string;
    imageUrl: string;
    wardrobeItemId?: string;
    status?: 'Active' | 'Draft' | 'Sold';
};

export const fetchBffListings = async (): Promise<ListingDto[]> => {
    const response = await apiGet<ListingDto[]>('/v1/api/listings');
    return response.data ?? [];
};

export const fetchBffListingById = async (id: string): Promise<ListingDto | null> => {
    try {
        const response = await apiGet<ListingDto>(`/v1/api/listings/${id}`);
        return response.data;
    } catch {
        return null;
    }
};

export const createBffListing = async (
    payload: ListingWritePayload,
): Promise<ListingDto> => {
    const response = await apiPost<ListingDto>('/v1/api/listings', payload);
    return response.data;
};

export const updateBffListing = async (
    id: string,
    payload: Partial<ListingWritePayload>,
): Promise<ListingDto> => {
    const response = await apiRequest<ListingDto>(`/v1/api/listings/${id}`, {
        method: 'PUT',
        body: payload,
    });
    return response.data;
};

export const deleteBffListing = async (id: string): Promise<void> => {
    await apiDelete<null>(`/v1/api/listings/${id}`);
};
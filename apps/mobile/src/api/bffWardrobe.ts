import { apiGet, apiPost, apiDelete, apiRequest } from './apiClient';

/** Matches the row shape returned by backend/services/wardrobeService.ts */
export type WardrobeItemDto = {
    id: string;
    userId: string;
    name: string;
    category: string;
    brand: string | null;
    color: string | null;
    size: string | null;
    condition: string | null;
    description: string | null;
    imageUrl: string;
    imageUrls: string[];
    purchasePrice: number;
    wearCount: number;
    source: 'manual' | 'purchase' | null;
    createdAt: string;
    updatedAt: string;
    wearHistory?: { date: string; occasion: string | null }[]; 
};

export type WardrobeWritePayload = {
    name: string;
    category: string;
    brand?: string;
    color?: string;
    size?: string;
    condition?: string;
    description?: string;
    imageUrl: string;
    imageUrls: string[];
    purchasePrice: number;
    source?: 'manual' | 'purchase';
};

/** Wardrobe via Express BFF */
export const fetchBffWardrobeItems = async (): Promise<WardrobeItemDto[]> => {
    const response = await apiGet<WardrobeItemDto[]>('/v1/api/wardrobe');
    return response.data ?? [];
};
export const fetchBffWardrobeItemById = async (
    id: string,
): Promise<WardrobeItemDto | null> => {
    try {
        const response = await apiGet<WardrobeItemDto>(`/v1/api/wardrobe/${id}`);
        return response.data;
    } catch {
        return null;
    }
};

export const createBffWardrobeItem = async (
    payload: WardrobeWritePayload,
): Promise<WardrobeItemDto> => {
    const response = await apiPost<WardrobeItemDto>('/v1/api/wardrobe', payload);
    return response.data;
};

// Route uses PUT, not PATCH — apiClient doesn't expose apiPut, so call apiRequest directly.
export const updateBffWardrobeItem = async (
    id: string,
    payload: Partial<WardrobeWritePayload>,
): Promise<WardrobeItemDto> => {
    const response = await apiRequest<WardrobeItemDto>(`/v1/api/wardrobe/${id}`, {
        method: 'PUT',
        body: payload,
    });
    return response.data;
};

export const deleteBffWardrobeItem = async (id: string): Promise<void> => {
    await apiDelete<null>(`/v1/api/wardrobe/${id}`);
};

export const logBffWear = async (id: string, occasion?: string): Promise<void> => {
    await apiPost<null>(`/v1/api/wardrobe/${id}/wear`, { occasion });
};
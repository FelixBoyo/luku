import { apiGet, apiPost, apiDelete, apiRequest } from './apiClient';
import type { Outfit, OutfitPiece, OutfitSource } from '../types/domain/outfit';

export type OutfitDto = Outfit;

export type OutfitWritePayload = {
    name: string;
    occasion?: string;
    coverImageUrl?: string;
    pieces: OutfitPiece[];
    source?: OutfitSource;
};

export const fetchBffOutfits = async (
    kind?: 'created' | 'inspiration',
): Promise<OutfitDto[]> => {
    const query = kind ? `?kind=${kind}` : '';
    const response = await apiGet<OutfitDto[]>(`/v1/api/outfits${query}`);
    return response.data ?? [];
};

export const fetchBffOutfitById = async (id: string): Promise<OutfitDto | null> => {
    try {
        const response = await apiGet<OutfitDto>(`/v1/api/outfits/${id}`);
        return response.data;
    } catch {
        return null;
    }
};

export const createBffOutfit = async (payload: OutfitWritePayload): Promise<OutfitDto> => {
    const response = await apiPost<OutfitDto>('/v1/api/outfits', payload);
    return response.data;
};

export const updateBffOutfit = async (
    id: string,
    payload: Partial<OutfitWritePayload>,
): Promise<OutfitDto> => {
    const response = await apiRequest<OutfitDto>(`/v1/api/outfits/${id}`, {
        method: 'PUT',
        body: payload,
    });
    return response.data;
};

export const deleteBffOutfit = async (id: string): Promise<void> => {
    await apiDelete<null>(`/v1/api/outfits/${id}`);
};
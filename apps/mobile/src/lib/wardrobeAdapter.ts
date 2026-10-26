import type { WardrobeItemDto, WardrobeWritePayload } from '../api/bffWardrobe';
import type { WardrobeItem } from '../types/domain/wardrobe';
import type { WardrobeCreateInput } from '../repositories/wardrobeRepository';

const formatDate = (iso: string): string =>
    new Date(iso).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
    });

/** DTO from backend -> domain shape screens already expect */
export const dtoToWardrobeItem = (dto: WardrobeItemDto): WardrobeItem => ({
    id: dto.id,
    name: dto.name,
    category: dto.category,
    imageUrl: dto.imageUrl,
    images: dto.imageUrls?.length ? dto.imageUrls : [dto.imageUrl],
    wearCount: dto.wearCount,
    brand: dto.brand ?? '',
    color: dto.color ?? '',
    size: dto.size ?? '',
    condition: dto.condition ?? '',
    purchasePrice: dto.purchasePrice,
    dateAdded: formatDate(dto.createdAt),
    description: dto.description ?? undefined,
    source: dto.source ?? undefined,
    wearHistory: dto.wearHistory?.map((entry) => ({
        date: new Date(entry.date).toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        }),
        occasion: entry.occasion ?? 'Logged wear',
    })) ?? [],
    outfits: undefined,
});

/** Domain create input -> backend write payload */
export const toWardrobeWritePayload = (
    input: WardrobeCreateInput | Partial<WardrobeItem>,
): WardrobeWritePayload => ({
    name: input.name!,
    category: input.category!,
    brand: input.brand,
    color: input.color,
    size: input.size,
    condition: input.condition,
    description: input.description,
    imageUrl: input.imageUrl!,
    imageUrls: input.images?.length ? input.images : input.imageUrl ? [input.imageUrl] : [],
    purchasePrice: input.purchasePrice ?? 0,
    source: input.source,
});
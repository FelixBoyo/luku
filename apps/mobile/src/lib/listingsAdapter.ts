import type { ListingDto, ListingWritePayload } from '../api/bffListings';
import type { Listing } from '../types/domain/listing';

export const dtoToListing = (dto: ListingDto): Listing => ({
    id: dto.id,
    name: dto.title,
    price: dto.price,
    imageUrl: dto.imageUrl,
    views: dto.viewCount,
    status: dto.status,
    wardrobeItemId: dto.wardrobeItemId ?? undefined,
    category: dto.category ?? undefined,
    size: dto.size ?? undefined,
    condition: dto.condition ?? undefined,
    createdAt: dto.createdAt,
});

export const toListingWritePayload = (
    input: Partial<Listing>,
): ListingWritePayload => ({
    title: input.name!,
    price: input.price ?? 0,
    imageUrl: input.imageUrl!,
    category: input.category,
    size: input.size,
    condition: input.condition,
    wardrobeItemId: input.wardrobeItemId,
    status: input.status,
});

export const toListingUpdatePayload = (
    input: Partial<Listing>,
): Partial<ListingWritePayload> => {
    const payload: Partial<ListingWritePayload> = {};
    if (input.name !== undefined) payload.title = input.name;
    if (input.price !== undefined) payload.price = input.price;
    if (input.imageUrl !== undefined) payload.imageUrl = input.imageUrl;
    if (input.category !== undefined) payload.category = input.category;
    if (input.size !== undefined) payload.size = input.size;
    if (input.condition !== undefined) payload.condition = input.condition;
    if (input.wardrobeItemId !== undefined) payload.wardrobeItemId = input.wardrobeItemId;
    if (input.status !== undefined) payload.status = input.status;
    return payload;
};
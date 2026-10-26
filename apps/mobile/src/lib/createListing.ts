import type { Listing, ListingStatus } from '../types/domain/listing';
import type { SellFormValues } from '../components/sell/SellForm';
import { repositories } from '../repositories';

const PLACEHOLDER_IMAGE =
    'https://images.unsplash.com/photo-1551028719-00167b16eac5?w=400';

export type CreateListingInput = {
    name: string;
    price: number;
    imageUrl: string;
    status?: ListingStatus;
    wardrobeItemId?: string;
    category?: string;
    size?: string;
    condition?: string;
};

export const createListingFromInput = async (
    input: CreateListingInput,
): Promise<Listing> =>
    repositories.listings.create({
        name: input.name,
        price: input.price,
        imageUrl: input.imageUrl,
        status: input.status ?? 'Active',
        wardrobeItemId: input.wardrobeItemId,
        category: input.category,
        size: input.size,
        condition: input.condition,
        createdAt: new Date().toISOString(),
    });

export const createListingFromSellForm = async (
    values: SellFormValues,
    wardrobeItemId?: string,
): Promise<Listing> => {
    // 1. Check for duplicate active listings first
    if (wardrobeItemId) {
        const existing = await repositories.listings.list();
        const alreadyListed = existing.find(
            (l) => l.wardrobeItemId === wardrobeItemId && l.status === 'Active',
        );
        if (alreadyListed) {
            throw new Error('This item already has an active listing.');
        }
    }

    // 2. Resolve the image URL
    let imageUrl = values.imageUrl ?? PLACEHOLDER_IMAGE;
    if (!values.imageUrl && wardrobeItemId) {
        try {
            const item = await repositories.wardrobe.getById(wardrobeItemId);
            imageUrl = item.imageUrl || item.images?.[0] || PLACEHOLDER_IMAGE;
        } catch {
            /* use placeholder */
        }
    }

    // 3. Create and return the listing
    return createListingFromInput({
        name: values.title.trim() || 'Untitled Item',
        price: Number(values.price) || 0,
        imageUrl,
        status: 'Active',
        wardrobeItemId,
        category: values.category || undefined,
        size: values.size || undefined,
        condition: values.condition || undefined,
    });
};
export type QuickListInput = {
    price: number;
    condition?: string;
};

export const createListingFromWardrobe = async (
    item: {
        id: string;
        name: string;
        imageUrl: string;
        category: string;
        size: string;
        condition: string;
    },
    quick: QuickListInput,
): Promise<Listing> => {
    const existing = await repositories.listings.list();
    const alreadyListed = existing.find(
        (l) => l.wardrobeItemId === item.id && l.status === 'Active',
    );
    if (alreadyListed) {
        throw new Error('This item already has an active listing.');
    }

    return createListingFromInput({
        name: item.name,
        price: quick.price,
        imageUrl: item.imageUrl,
        status: 'Active',
        wardrobeItemId: item.id,
        category: item.category,
        size: item.size,
        condition: quick.condition || item.condition,
    });
};
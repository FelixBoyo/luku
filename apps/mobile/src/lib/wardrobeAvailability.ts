import type { Listing } from '../types/domain/listing';

/**
 * Wardrobe items that are spoken for by a listing, and so are hidden from the
 * wardrobe surfaces.
 *
 * `Active` means it is on sale and `Sold` means it is gone; a `Draft` listing
 * has not been published, so its item still belongs in the wardrobe.
 *
 * This rule lived in three screens independently and drifted, which is how the
 * item detail arrows ended up walking into items no list would show.
 */
export const listedWardrobeItemIds = (listings: Listing[]): Set<string> =>
    new Set(
        listings
            .filter((l) => (l.status === 'Active' || l.status === 'Sold') && l.wardrobeItemId)
            .map((l) => l.wardrobeItemId as string),
    );

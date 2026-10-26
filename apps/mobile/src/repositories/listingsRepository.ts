import { mockListings } from '../data/mock/listings';
import type { Listing } from '../types/domain/listing';
import {
    fetchBffListings,
    fetchBffListingById,
    createBffListing,
    updateBffListing,
    deleteBffListing,
} from '../api/bffListings';
import { dtoToListing, toListingWritePayload, toListingUpdatePayload } from '../lib/listingsAdapter';

export const createApiListingsRepository = (): ListingsRepository => ({
    list: async () => {
        const rows = await fetchBffListings();
        return rows.map(dtoToListing);
    },
    getById: async (id) => {
        const row = await fetchBffListingById(id);
        return row ? dtoToListing(row) : null;
    },
    create: async (input) => {
        const row = await createBffListing(toListingWritePayload(input));
        return dtoToListing(row);
    },
    update: async (id, patch) => {
        const row = await updateBffListing(id, toListingUpdatePayload(patch));
        return dtoToListing(row);
    },
    remove: async (id) => {
        await deleteBffListing(id);
    },
});

let listings: Listing[] = [];
let mockInitialized = false;

const ensureMockListings = () => {
    if (!mockInitialized) {
        listings = mockListings.map((l) => ({ ...l }));
        mockInitialized = true;
    }
};

export type ListingsRepository = {
    list: () => Promise<Listing[]>;
    getById: (id: string) => Promise<Listing | null>;
    create: (input: Omit<Listing, 'id' | 'views'> & { id?: string }) => Promise<Listing>;
    update: (id: string, patch: Partial<Listing>) => Promise<Listing>;
    remove: (id: string) => Promise<void>;
};

const notAvailable = () => {
    throw new Error('Listings API not available');
};

export const createEmptyListingsRepository = (): ListingsRepository => ({
    list: async () => [],
    getById: async () => null,
    create: async () => notAvailable(),
    update: async () => notAvailable(),
    remove: async () => notAvailable(),
});

export const createMockListingsRepository = (): ListingsRepository => {
    ensureMockListings();
    return {
    list: async () => [...listings],
    getById: async (id) => listings.find((l) => l.id === id) ?? null,
    create: async (input) => {
        const listing: Listing = {
            id: input.id ?? `l${Date.now()}`,
            name: input.name,
            price: input.price,
            imageUrl: input.imageUrl,
            views: 0,
            status: input.status,
            wardrobeItemId: input.wardrobeItemId,
            category: input.category,
            size: input.size,
            condition: input.condition,
            createdAt: input.createdAt ?? new Date().toISOString(),
        };
        listings = [listing, ...listings];
        return listing;
    },
    update: async (id, patch) => {
        listings = listings.map((l) => (l.id === id ? { ...l, ...patch } : l));
        const updated = listings.find((l) => l.id === id);
        if (!updated) throw new Error(`Listing ${id} not found`);
        return updated;
    },
    remove: async (id) => {
        listings = listings.filter((l) => l.id !== id);
    },
};
};


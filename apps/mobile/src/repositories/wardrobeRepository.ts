import {
    getWardrobeItemById,
    mockWardrobeItems,
} from '../data/mock/wardrobe';
import type { WardrobeItem, WearHistoryEntry } from '../types/domain/wardrobe';
import {
    fetchBffWardrobeItems,
    fetchBffWardrobeItemById,
    createBffWardrobeItem,
    updateBffWardrobeItem,
    deleteBffWardrobeItem,
    logBffWear,
} from '../api/bffWardrobe';
import { dtoToWardrobeItem, toWardrobeWritePayload } from '../lib/wardrobeAdapter';

export const createApiWardrobeRepository = (): WardrobeRepository => ({
    list: async () => {
        const rows = await fetchBffWardrobeItems();
        return rows.map(dtoToWardrobeItem);
    },
    getById: async (id) => {
        const row = await fetchBffWardrobeItemById(id);
        if (!row) return notFound(id);
        return dtoToWardrobeItem(row);
    },
    create: async (input) => {
        const row = await createBffWardrobeItem(toWardrobeWritePayload(input));
        return dtoToWardrobeItem(row);
    },
    update: async (id, patch) => {
        const row = await updateBffWardrobeItem(id, toWardrobeWritePayload(patch));
        return dtoToWardrobeItem(row);
    },
    logWear: async (id, occasion) => {
        await logBffWear(id, occasion);
        // route returns data: null, so refetch to satisfy the "returns updated item" contract
        const row = await fetchBffWardrobeItemById(id);
        if (!row) return notFound(id);
        return dtoToWardrobeItem(row);
    },
    remove: async (id) => {
    await deleteBffWardrobeItem(id);
},
});

let items: WardrobeItem[] = [];
let mockInitialized = false;

const ensureMockWardrobe = () => {
    if (!mockInitialized) {
        items = mockWardrobeItems.map((i) => ({ ...i }));
        mockInitialized = true;
    }
};

/** Sync read for screens not yet on async repository hooks. */
export const getWardrobeItemsSync = (): WardrobeItem[] => [...items];

export const getWardrobeItemSync = (id: string): WardrobeItem =>
    items.find((i) => i.id === id) ?? getWardrobeItemById(id);

export const getWardrobeItemIndexSync = (id: string): number =>
    items.findIndex((i) => i.id === id);

export type WardrobeCreateInput = Omit<
    WardrobeItem,
    'id' | 'wearCount' | 'wearHistory' | 'dateAdded'
> & { id?: string };

export type WardrobeRepository = {
    list: () => Promise<WardrobeItem[]>;
    getById: (id: string) => Promise<WardrobeItem>;
    create: (input: WardrobeCreateInput) => Promise<WardrobeItem>;
    logWear: (id: string, occasion?: string) => Promise<WardrobeItem>;
    update: (id: string, patch: Partial<WardrobeItem>) => Promise<WardrobeItem>;
    remove: (id: string) => Promise<void>; 
};

const notFound = (id: string) => {
    throw new Error(`Wardrobe item ${id} not found`);
};

const notAvailable = () => {
    throw new Error('Wardrobe API not available');
};

export const createEmptyWardrobeRepository = (): WardrobeRepository => ({
    list: async () => [],
    getById: async (id) => notFound(id),
    create: async () => notAvailable(),
    logWear: async (id) => notFound(id),
    update: async (id) => notFound(id),
    remove: async (id) => notFound(id),
});

export const createMockWardrobeRepository = (): WardrobeRepository => {
    ensureMockWardrobe();
    return {
    list: async () => [...items],
    getById: async (id) => {
        const found = items.find((i) => i.id === id);
        return found ?? getWardrobeItemById(id);
    },
    create: async (input) => {
        const imageUrl =
            input.imageUrl ||
            'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=600';
        const newItem: WardrobeItem = {
            ...input,
            id: input.id ?? `w${Date.now()}`,
            imageUrl,
            images: input.images?.length ? input.images : [imageUrl],
            wearCount: 0,
            wearHistory: [],
            dateAdded: 'Today',
            color: input.color ?? '',
            purchasePrice: input.purchasePrice ?? 0,
            source: input.source ?? 'manual',
        };
        items = [newItem, ...items];
        return newItem;
    },
    logWear: async (id, occasion = 'Logged wear') => {
        const today = new Date().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
        });
        const entry: WearHistoryEntry = { date: today, occasion };
        items = items.map((i) =>
            i.id === id
                ? {
                      ...i,
                      wearCount: i.wearCount + 1,
                      wearHistory: [entry, ...(i.wearHistory ?? [])],
                  }
                : i,
        );
        const updated = items.find((i) => i.id === id);
        if (!updated) throw new Error(`Wardrobe item ${id} not found`);
        return updated;
    },
    update: async (id, patch) => {
        items = items.map((i) => (i.id === id ? { ...i, ...patch } : i));
        const updated = items.find((i) => i.id === id);
        if (!updated) throw new Error(`Wardrobe item ${id} not found`);
        return updated;
    },
    remove: async (id) => {
        items = items.filter((i) => i.id !== id);
    },
};
};


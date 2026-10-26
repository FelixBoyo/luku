import {
    getOutfitById,
    savedInspirations as initialInspirations,
    userOutfits as initialUserOutfits,
} from '../data/mock/outfits';
import type { Outfit, OutfitPiece, OutfitSource } from '../types/domain/outfit';
import {
    fetchBffOutfits,
    fetchBffOutfitById,
    createBffOutfit,
    updateBffOutfit,
    deleteBffOutfit,
} from '../api/bffOutfits';

export type OutfitKind = 'created' | 'inspiration';

export type OutfitsRepository = {
    list: (kind: OutfitKind) => Promise<Outfit[]>;
    getById: (id: string) => Promise<Outfit | null>;
    create: (input: Omit<Outfit, 'id' | 'createdAt'> & { id?: string }) => Promise<Outfit>;
    update: (id: string, patch: Partial<Pick<Outfit, 'name' | 'occasion' | 'pieces' | 'coverImageUrl'>>) => Promise<Outfit>;
    delete: (id: string) => Promise<void>;
    saveInspiration: (input: {
        name: string;
        occasion: string;
        coverImageUrl: string;
        pieces: OutfitPiece[];
        source?: OutfitSource;
    }) => Promise<Outfit>;
};

let userOutfits: Outfit[] = [];
let inspirations: Outfit[] = [];
let mockInitialized = false;

const ensureMockOutfits = () => {
    if (!mockInitialized) {
        userOutfits = initialUserOutfits.map((o) => ({ ...o, pieces: [...o.pieces] }));
        inspirations = initialInspirations.map((o) => ({ ...o, pieces: [...o.pieces] }));
        mockInitialized = true;
    }
};

const todayLabel = () =>
    new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

const notFound = (id: string) => {
    throw new Error(`Outfit ${id} not found`);
};

const notAvailable = () => {
    throw new Error('Outfits API not available');
};

export const createEmptyOutfitsRepository = (): OutfitsRepository => ({
    list: async () => [],
    getById: async () => null,
    create: async () => notAvailable(),
    update: async (id) => notFound(id),
    delete: async () => {},
    saveInspiration: async () => notAvailable(),
});

export const createMockOutfitsRepository = (): OutfitsRepository => {
    ensureMockOutfits();
    return {
        list: async (kind) =>
            kind === 'created' ? [...userOutfits] : [...inspirations],

        getById: async (id) => {
            const found =
                getOutfitById(id) ??
                userOutfits.find((o) => o.id === id) ??
                inspirations.find((o) => o.id === id);
            return found ? { ...found, pieces: [...found.pieces] } : null;
        },

        create: async (input) => {
            const outfit: Outfit = {
                id: input.id ?? `out-${Date.now()}`,
                name: input.name,
                occasion: input.occasion,
                coverImageUrl: input.coverImageUrl,
                pieces: input.pieces,
                source: input.source ?? 'manual',
                createdAt: todayLabel(),
            };
            userOutfits = [outfit, ...userOutfits];
            return outfit;
        },

        update: async (id, patch) => {
            const idx = userOutfits.findIndex((o) => o.id === id);
            if (idx < 0) throw new Error(`Outfit ${id} not found`);
            userOutfits[idx] = { ...userOutfits[idx], ...patch };
            return userOutfits[idx];
        },

        delete: async (id) => {
            userOutfits = userOutfits.filter((o) => o.id !== id);
            inspirations = inspirations.filter((o) => o.id !== id);
        },

        saveInspiration: async (input) => {
            const outfit: Outfit = {
                id: `fav-${Date.now()}`,
                name: input.name,
                occasion: input.occasion,
                coverImageUrl: input.coverImageUrl,
                pieces: input.pieces,
                source: input.source ?? 'inspiration',
                createdAt: 'Just now',
            };
            inspirations = [outfit, ...inspirations];
            return outfit;
        },
    };
};

export const createApiOutfitsRepository = (): OutfitsRepository => ({
    list: async (kind) => fetchBffOutfits(kind),
    getById: async (id) => fetchBffOutfitById(id),
    create: async (input) =>
        createBffOutfit({
            name: input.name,
            occasion: input.occasion,
            coverImageUrl: input.coverImageUrl,
            pieces: input.pieces,
            source: input.source ?? 'manual',
        }),
    update: async (id, patch) => updateBffOutfit(id, patch),
    delete: async (id) => {
        await deleteBffOutfit(id);
    },
    saveInspiration: async (input) =>
        createBffOutfit({
            name: input.name,
            occasion: input.occasion,
            coverImageUrl: input.coverImageUrl,
            pieces: input.pieces,
            source: input.source ?? 'inspiration',
        }),
});

/**
 * Picks a cover image from an outfit's pieces by looking up the first
 * wardrobe piece in the already-loaded wardrobe items list.
 * Takes the list as a param (instead of a sync global lookup) so it works
 * correctly with the real API-backed wardrobe data.
 */
export const getOutfitCoverFromPieces = (
    pieces: OutfitPiece[],
    wardrobeItems: { id: string; imageUrl: string }[],
): string => {
    for (const p of pieces) {
        if (p.type === 'wardrobe') {
            const item = wardrobeItems.find((w) => w.id === p.id);
            if (item?.imageUrl) return item.imageUrl;
        }
    }
    return 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?w=600';
};
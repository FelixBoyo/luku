import { getProductById } from '../data/mock/products';
import { mockWishlist } from '../data/mock/wishlist';
import type { WishlistItem } from '../types/domain/wishlist';
import { fetchBffWishlist, addToBffWishlist, removeFromBffWishlist } from '../api/bffWishlist';
import { fetchBffProductById } from '../api/bffProducts';
import { dtoToDisplayProduct } from '../lib/productAdapter';

let items = new Map<string, WishlistItem>();
let mockInitialized = false;

const ensureMockWishlist = () => {
    if (!mockInitialized) {
        items = new Map(mockWishlist.map((w) => [w.id, { ...w }]));
        mockInitialized = true;
    }
};

const productToWishlistItem = (id: string): WishlistItem => {
    const p = getProductById(id);
    return {
        id: p.id,
        name: p.name,
        brand: p.brand,
        price: p.price,
        imageUrl: p.imageUrl,
        addedDate: 'Just now',
    };
};

export type WishlistRepository = {
    list: () => Promise<WishlistItem[]>;
    isWishlisted: (productId: string) => Promise<boolean>;
    toggle: (productId: string, snapshot?: WishlistItem) => Promise<boolean>;
};

export const createEmptyWishlistRepository = (): WishlistRepository => ({
    list: async () => [],
    isWishlisted: async () => false,
    toggle: async () => false,
});

export const createMockWishlistRepository = (): WishlistRepository => {
    ensureMockWishlist();
    return {
    list: async () => [...items.values()],
    isWishlisted: async (productId) => items.has(productId),
    toggle: async (productId, snapshot) => {
        if (items.has(productId)) {
            items.delete(productId);
            return false;
        }
        const entry = snapshot ?? items.get(productId) ?? productToWishlistItem(productId);
        items.set(productId, { ...entry, id: productId });
        return true;
    },
};
};

export const createApiWishlistRepository = (): WishlistRepository => {
    // We maintain a local cache to avoid constant network calls for `isWishlisted` checks,
    // though the real source of truth is the backend. The `AppStateProvider` already caches IDs.
    return {
        list: async () => {
            const dtos = await fetchBffWishlist();
            const items = await Promise.all(dtos.map(async (dto) => {
                const productDto = await fetchBffProductById(dto.productId);
                if (productDto) {
                    const product = dtoToDisplayProduct(productDto);
                    return {
                        id: product.id,
                        name: product.name,
                        brand: product.brand,
                        price: product.price,
                        imageUrl: product.imageUrl,
                        addedDate: new Date(dto.addedAt).toLocaleDateString(),
                    };
                }
                return {
                    id: dto.productId,
                    name: 'Unknown',
                    brand: '',
                    price: 0,
                    imageUrl: '',
                    addedDate: new Date(dto.addedAt).toLocaleDateString(),
                };
            }));
            return items;
        },
        isWishlisted: async () => false, // Handled by AppStateContext caching `wishlistedIds`
        toggle: async (productId: string, snapshot?: WishlistItem) => {
            // First we try to add. If it's already there (or we want to remove), how do we know?
            // The AppStateContext knows if it was added or removed and we just return the new state.
            // Wait, toggle in the mock returns the new boolean state.
            // Let's assume we fetch current status or rely on the caller knowing.
            // Actually, `AppStateContext` says: `const added = await repositories.wishlist.toggle(productId);`
            // Let's implement a naive toggle using the BFF:
            // Since we don't know the current state here, we'd have to either add or remove based on a check.
            // But AppStateContext knows! If only it passed `isWishlisted`.
            // Let's fetch the list, check if it's there, then add/remove.
            const list = await fetchBffWishlist();
            const exists = list.some(i => i.productId === productId);
            if (exists) {
                await removeFromBffWishlist(productId);
                return false;
            } else {
                await addToBffWishlist(productId);
                return true;
            }
        },
    };
};


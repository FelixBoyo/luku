import React, {
    createContext,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getInitialCartLines } from '../repositories/cartBootstrap';
import { repositories } from '../repositories';
import type { Outfit, OutfitPiece } from '../types/domain/outfit';
import type { WardrobeItem } from '../types/domain/wardrobe';
import type { WishlistItem } from '../types/domain/wishlist';
import type { OutfitKind } from '../repositories/outfitsRepository';
import { apiGet, apiPost, apiPut, apiDelete, ApiError } from '../api/apiClient';
import { USE_MOCK_DATA } from '../lib/config';
import { useAuth } from './AuthContext';
import type { CartItemDto } from '../../../../packages/contracts/src/cart';

export type CartLine = {
    productId: string;
    name: string;
    brand: string;
    price: number;
    imageUrl: string;
    quantity: number;
    color?: string;
    stockQuantity?: number;
    /** Groups the cart by seller; checkout runs one group at a time (ADR D9). */
    businessId: string;
    sellerName?: string;
    isActive?: boolean;
};

type AppStateContextValue = {
    cartItemCount: number;
    cartItems: CartLine[];
    inboxUnreadCount: number;
    refreshInboxUnread: () => Promise<void>;
    wishlistedIds: Set<string>;
    wishlistItems: WishlistItem[];
    wardrobeItems: WardrobeItem[];
    createdOutfits: Outfit[];
    inspirationOutfits: Outfit[];
    addToCart: (productId?: string) => Promise<void>;
    removeFromCart: (productId: string) => Promise<void>;
    removePurchasedItems: (productIds: string[]) => void;
    clearCart: () => Promise<void>;
    refreshCart: () => Promise<void>;
    updateCartQty: (productId: string, quantity: number) => Promise<void>;
    toggleWishlist: (productId: string, snapshot?: WishlistItem) => Promise<boolean>;
    isWishlisted: (productId: string) => boolean;
    refreshWishlist: () => Promise<void>;
    refreshWardrobe: () => Promise<void>;
    refreshOutfits: () => Promise<void>;
    logWear: (itemId: string, occasion?: string) => Promise<void>;
    saveInspiration: (input: {
        name: string;
        occasion: string;
        coverImageUrl: string;
        pieces: OutfitPiece[];
    }) => Promise<Outfit>;
    createOutfit: (input: {
        name: string;
        occasion: string;
        coverImageUrl: string;
        pieces: OutfitPiece[];
    }) => Promise<Outfit>;
    updateOutfit: (
        id: string,
        input: {
            name: string;
            occasion: string;
            coverImageUrl: string;
            pieces: OutfitPiece[];
        },
    ) => Promise<Outfit>;
    deleteOutfit: (id: string) => Promise<void>;
    markInboxThreadAsRead: (threadId: string) => Promise<void>;
};

const WISHLIST_KEY = 'luku_wishlist_ids';

const AppStateContext = createContext<AppStateContextValue | null>(null);

const UNKNOWN_SELLER_KEY = 'unknown-seller';

const toCartLine = (
    p: {
        id: string;
        name: string;
        brand: string;
        price: number;
        imageUrl: string;
        stockQuantity?: number;
        businessId?: string;
        seller?: { id?: string; name?: string };
    },
    quantity = 1,
): CartLine => ({
    productId: p.id,
    name: p.name,
    brand: p.brand,
    price: p.price,
    imageUrl: p.imageUrl,
    quantity,
    stockQuantity: p.stockQuantity,
    businessId: p.businessId || p.seller?.id || UNKNOWN_SELLER_KEY,
    sellerName: p.seller?.name,
});

const mapCartDtoToLine = (item: CartItemDto): CartLine => ({
    productId: item.productId,
    name: item.product?.name || 'Unknown Item',
    brand: item.product?.style || 'LUKU',
    price: item.product?.price || 0,
    imageUrl: item.product?.imageUrls?.[0] || '',
    quantity: item.quantity,
    color: item.product?.color || undefined,
    stockQuantity: item.product?.stockQuantity,
    businessId: item.product?.businessId || UNKNOWN_SELLER_KEY,
    sellerName: item.product?.sellerName,
    isActive: item.product?.isActive,
});

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({
    children,
}) => {
    const { isAuthenticated, user } = useAuth();
    const lastUserIdRef = useRef<string | null>(null);

    const [cartItems, setCartItems] = useState<CartLine[]>(
        getInitialCartLines().map((i) => ({
            productId: i.productId,
            name: i.name,
            brand: i.brand,
            price: i.price,
            imageUrl: i.imageUrl,
            quantity: i.quantity,
            color: i.color,
            businessId: i.businessId,
            sellerName: i.sellerName,
        })),
    );
    const [inboxUnreadCount, setInboxUnreadCount] = useState(0);
    const [wishlistedIds, setWishlistedIds] = useState<Set<string>>(new Set());
    const [wishlistItems, setWishlistItems] = useState<WishlistItem[]>([]);
    const [wardrobeItems, setWardrobeItems] = useState<WardrobeItem[]>([]);
    const [createdOutfits, setCreatedOutfits] = useState<Outfit[]>([]);
    const [inspirationOutfits, setInspirationOutfits] = useState<Outfit[]>([]);

    const refreshWardrobe = useCallback(async () => {
        const items = await repositories.wardrobe.list();
        setWardrobeItems(items);
    }, []);

    const refreshOutfits = useCallback(async () => {
        const [created, inspirations] = await Promise.all([
            repositories.outfits.list('created' as OutfitKind),
            repositories.outfits.list('inspiration' as OutfitKind),
        ]);
        setCreatedOutfits(created);
        setInspirationOutfits(inspirations);
    }, []);

    const refreshWishlist = useCallback(async () => {
        const list = await repositories.wishlist.list();
        setWishlistItems(list);
        setWishlistedIds(new Set(list.map((w) => w.id)));
    }, []);

    const resetUserSession = useCallback(async () => {
        setCartItems([]);
        setWishlistedIds(new Set());
        setWishlistItems([]);
        setWardrobeItems([]);
        setCreatedOutfits([]);
        setInspirationOutfits([]);
        setInboxUnreadCount(0);
        await AsyncStorage.removeItem(WISHLIST_KEY);
    }, []);

    const refreshInboxUnread = useCallback(async () => {
        try {
            const count = await repositories.inbox.unreadCount();
            setInboxUnreadCount(count);
        } catch {
            setInboxUnreadCount(0);
        }
    }, []);

    const refreshCart = useCallback(async () => {
        if (USE_MOCK_DATA) {
            return;
        }
        try {
            const cartRes = await apiGet<CartItemDto[]>('/v1/api/cart');
            if (cartRes.data) {
                setCartItems(cartRes.data.map(mapCartDtoToLine));
            }
        } catch {
            setCartItems([]);
        }
    }, []);

    const reloadUserSession = useCallback(async () => {
        await Promise.all([
            refreshWardrobe(),
            refreshOutfits(),
            refreshWishlist(),
            refreshInboxUnread(),
            refreshCart(),
        ]);
    }, [refreshWardrobe, refreshOutfits, refreshWishlist, refreshInboxUnread, refreshCart]);

    useEffect(() => {
        if (!isAuthenticated) {
            if (lastUserIdRef.current !== null) {
                void resetUserSession();
            }
            lastUserIdRef.current = null;
            return;
        }

        const userId = user?.id ?? null;
        if (userId && userId !== lastUserIdRef.current) {
            lastUserIdRef.current = userId;
            void reloadUserSession();
        }
    }, [isAuthenticated, user?.id, resetUserSession, reloadUserSession]);

    const persistWishlist = useCallback(async (ids: Set<string>) => {
        await AsyncStorage.setItem(WISHLIST_KEY, JSON.stringify([...ids]));
    }, []);

    const addToCart = useCallback(async (productId?: string) => {
        const id = productId;
        if (!id) return;
        if (USE_MOCK_DATA) {
            try {
                const product = await repositories.products.getById(id);
                if (!product) return;
                setCartItems((prev) => {
                    const existing = prev.find((l) => l.productId === id);
                    if (existing) {
                        return prev.map((l) =>
                            l.productId === id
                                ? { ...l, quantity: l.quantity + 1 }
                                : l,
                        );
                    }
                    return [...prev, toCartLine(product)];
                });
            } catch {
                /* product unavailable */
            }
        } else {
            let previousCartItems: CartLine[] = [];
            try {
                const product = await repositories.products.getById(id);
                if (!product) return;
                setCartItems((prev) => {
                    previousCartItems = prev;
                    const existing = prev.find((l) => l.productId === id);
                    if (existing) {
                        return prev.map((l) =>
                            l.productId === id ? { ...l, quantity: l.quantity + 1 } : l
                        );
                    }
                    return [...prev, toCartLine(product)];
                });
                await apiPost<CartItemDto>('/v1/api/cart', { productId: id });
            } catch (error) {
                // Fetch latest to make sure we're in sync or fallback
                const cartRes = await apiGet<CartItemDto[]>('/v1/api/cart').catch(() => ({ data: [] }));
                if (cartRes.data) {
                    setCartItems(cartRes.data.map(mapCartDtoToLine));
                } else if (previousCartItems.length > 0) {
                    setCartItems(previousCartItems);
                }
                if (error instanceof ApiError) {
                    throw error;
                }
            }
        }
    }, []);

    const removeFromCart = useCallback(async (productId: string) => {
        if (USE_MOCK_DATA) {
            setCartItems((prev) => prev.filter((l) => l.productId !== productId));
            return;
        }
        let removedLine: CartLine | undefined;
        setCartItems((prev) => {
            removedLine = prev.find((l) => l.productId === productId);
            return prev.filter((l) => l.productId !== productId);
        });
        try {
            await apiDelete(`/v1/api/cart/${productId}`);
        } catch (err) {
            if (removedLine) {
                setCartItems((prev) => {
                    if (prev.some((l) => l.productId === productId)) {
                        return prev;
                    }
                    return [...prev, removedLine!];
                });
            }
            throw err;
        }
    }, []);

    const clearCart = useCallback(async () => {
        if (USE_MOCK_DATA) {
            setCartItems([]);
            return;
        }
        let previousCartItems = cartItems;
        setCartItems([]);
        try {
            await apiDelete('/v1/api/cart');
        } catch {
            setCartItems(previousCartItems);
        }
    }, [cartItems]);

    /**
     * Local-only drop for lines the order already consumed — `createOrder` deletes
     * them server-side, so re-issuing DELETEs would race the reload.
     */
    const removePurchasedItems = useCallback((productIds: string[]) => {
        const purchased = new Set(productIds);
        if (purchased.size === 0) {
            return;
        }
        setCartItems((prev) => prev.filter((l) => !purchased.has(l.productId)));
    }, []);

    const updateCartQty = useCallback(async (productId: string, quantity: number) => {
        if (quantity < 1) {
            await removeFromCart(productId);
            return;
        }
        if (USE_MOCK_DATA) {
            setCartItems((prev) =>
                prev.map((l) => (l.productId === productId ? { ...l, quantity } : l)),
            );
            return;
        }
        let previousQty: number | undefined;
        setCartItems((prev) => {
            const line = prev.find((l) => l.productId === productId);
            previousQty = line?.quantity;
            return prev.map((l) => (l.productId === productId ? { ...l, quantity } : l));
        });
        try {
            await apiPut(`/v1/api/cart/${productId}`, { quantity });
        } catch (err) {
            if (previousQty != null) {
                setCartItems((prev) =>
                    prev.map((l) =>
                        l.productId === productId ? { ...l, quantity: previousQty! } : l,
                    ),
                );
            }
            throw err;
        }
    }, [removeFromCart]);

    const toggleWishlist = useCallback(
        async (productId: string, snapshot?: WishlistItem) => {
            let wasWishlisted = false;
            let expectedState = false;

            // Optimistic update
            setWishlistedIds((prev) => {
                wasWishlisted = prev.has(productId);
                expectedState = !wasWishlisted;
                const next = new Set(prev);
                if (expectedState) next.add(productId);
                else next.delete(productId);
                return next;
            });
            
            setWishlistItems((prev) => {
                if (expectedState && snapshot) {
                    // Prepend new item
                    return [{ ...snapshot, id: productId }, ...prev.filter(i => i.id !== productId)];
                } else if (!expectedState) {
                    return prev.filter(w => w.id !== productId);
                }
                return prev;
            });

            try {
                const added = await repositories.wishlist.toggle(productId);
                setWishlistedIds((prev) => {
                    const next = new Set(prev);
                    if (added) next.add(productId);
                    else next.delete(productId);
                    persistWishlist(next);
                    return next;
                });
                refreshWishlist().catch(() => {});
                return added;
            } catch (error) {
                // Revert on error
                setWishlistedIds((prev) => {
                    const next = new Set(prev);
                    if (wasWishlisted) next.add(productId);
                    else next.delete(productId);
                    return next;
                });
                return wasWishlisted;
            }
        },
        [persistWishlist, refreshWishlist],
    );

    const isWishlisted = useCallback(
        (productId: string) => wishlistedIds.has(productId),
        [wishlistedIds],
    );

    const logWear = useCallback(
        async (itemId: string, occasion?: string) => {
            await repositories.wardrobe.logWear(itemId, occasion);
            await refreshWardrobe();
        },
        [refreshWardrobe],
    );

    const saveInspiration = useCallback(
        async (input: {
            name: string;
            occasion: string;
            coverImageUrl: string;
            pieces: OutfitPiece[];
        }) => {
            const outfit = await repositories.outfits.saveInspiration(input);
            await refreshOutfits();
            return outfit;
        },
        [refreshOutfits],
    );

    const createOutfit = useCallback(
        async (input: {
            name: string;
            occasion: string;
            coverImageUrl: string;
            pieces: OutfitPiece[];
        }) => {
            const outfit = await repositories.outfits.create({
                ...input,
                source: 'manual',
            });
            await refreshOutfits();
            return outfit;
        },
        [refreshOutfits],
    );

    const updateOutfit = useCallback(
        async (
            id: string,
            input: {
                name: string;
                occasion: string;
                coverImageUrl: string;
                pieces: OutfitPiece[];
            },
        ) => {
            const outfit = await repositories.outfits.update(id, input);
            await refreshOutfits();
            return outfit;
        },
        [refreshOutfits],
    );

    const deleteOutfit = useCallback(
        async (id: string) => {
            await repositories.outfits.delete(id);
            await refreshOutfits();
        },
        [refreshOutfits],
    );

    const markInboxThreadAsRead = useCallback(async (threadId: string) => {
        try {
            await repositories.inbox.markAsRead(threadId);
            const count = await repositories.inbox.unreadCount();
            setInboxUnreadCount(count);
        } catch (err) {
            console.error('Failed to mark thread as read:', err);
        }
    }, []);

    const cartItemCount = useMemo(
        () => cartItems.reduce((sum, l) => sum + l.quantity, 0),
        [cartItems],
    );

    const value = useMemo(
        () => ({
            cartItemCount,
            cartItems,
            inboxUnreadCount,
            refreshInboxUnread,
            wishlistedIds,
            wishlistItems,
            wardrobeItems,
            createdOutfits,
            inspirationOutfits,
            addToCart,
            removeFromCart,
            removePurchasedItems,
            clearCart,
            refreshCart,
            updateCartQty,
            toggleWishlist,
            isWishlisted,
            refreshWishlist,
            refreshWardrobe,
            refreshOutfits,
            logWear,
            saveInspiration,
            createOutfit,
            updateOutfit,
            deleteOutfit,
            markInboxThreadAsRead,
        }),
        [
            cartItemCount,
            cartItems,
            inboxUnreadCount,
            refreshInboxUnread,
            wishlistedIds,
            wishlistItems,
            wardrobeItems,
            createdOutfits,
            inspirationOutfits,
            addToCart,
            removeFromCart,
            removePurchasedItems,
            clearCart,
            refreshCart,
            updateCartQty,
            toggleWishlist,
            isWishlisted,
            refreshWishlist,
            refreshWardrobe,
            refreshOutfits,
            logWear,
            saveInspiration,
            createOutfit,
            updateOutfit,
            deleteOutfit,
            markInboxThreadAsRead,
        ],
    );

    return (
        <AppStateContext.Provider value={value}>
            {children}
        </AppStateContext.Provider>
    );
};

export const useAppState = (): AppStateContextValue => {
    const ctx = useContext(AppStateContext);
    if (!ctx) {
        throw new Error('useAppState must be used within AppStateProvider');
    }
    return ctx;
};

/** @deprecated Use useAppState */
export const useMockApp = (): Pick<
    AppStateContextValue,
    'cartItemCount' | 'inboxUnreadCount' | 'addToCart'
> => {
    const { cartItemCount, inboxUnreadCount, addToCart } = useAppState();
    return { cartItemCount, inboxUnreadCount, addToCart };
};

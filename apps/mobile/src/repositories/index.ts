import { USE_MOCK_DATA } from '../lib/config';

import {
    createApiProductsRepository,
    createMockProductsRepository,
    type ProductsRepository,
} from './productsRepository';
import {
    createApiWardrobeRepository,
    createMockWardrobeRepository,
    type WardrobeRepository,
} from './wardrobeRepository';
import {
    createApiWishlistRepository,
    createMockWishlistRepository,
    type WishlistRepository,
} from './wishlistRepository';
import {
    createMockInboxRepository,
    createApiInboxRepository,
    type InboxRepository,
} from './inboxRepository';
import {
    createApiOutfitsRepository,
    createMockOutfitsRepository,
    type OutfitsRepository,
} from './outfitsRepository';
import {
    createApiListingsRepository,
    createMockListingsRepository,
    type ListingsRepository,
} from './listingsRepository';
import {
    createMockOrdersRepository,
    createApiOrdersRepository,
    type OrdersRepository,
} from './ordersRepository';
import {
    createMockMessagesRepository,
    createApiMessagesRepository,
    type MessagesRepository,
} from './messagesRepository';
import {
    createApiConnectionsRepository,
    createMockConnectionsRepository,
    type ConnectionsRepository,
} from './connectionsRepository';
import {
    createApiProfileRepository,
    createMockProfileRepository,
    type ProfileRepository,
} from './profileRepository';
import {
    createApiUserProfileRepository,
    createMockUserProfileRepository,
    type UserProfileRepository,
} from './userProfileRepository';
import {
    createEmptyStylistRepository,
    createMockStylistRepository,
    createApiStylistRepository,
    type StylistRepository,
} from './stylistRepository';
import {
    createEmptyWardrobePairingsRepository,
    createMockWardrobePairingsRepository,
    createApiWardrobePairingsRepository,
    type WardrobePairingsRepository,
} from './wardrobePairingsRepository';
import {
    createEmptyDiscoverCatalogRepository,
    createApiDiscoverCatalogRepository,
    createMockDiscoverCatalogRepository,
    type DiscoverCatalogRepository,
} from './discoverCatalogRepository';
import {
    createEmptyHomeRepository,
    createMockHomeRepository,
    createApiHomeRepository,
    type HomeRepository,
} from './homeRepository';
import {
    createMockNotificationsRepository,
    createApiNotificationsRepository,
    type NotificationsRepository,
} from './notificationsRepository';

export type Repositories = {
    products: ProductsRepository;
    wardrobe: WardrobeRepository;
    wishlist: WishlistRepository;
    inbox: InboxRepository;
    outfits: OutfitsRepository;
    listings: ListingsRepository;
    orders: OrdersRepository;
    messages: MessagesRepository;
    connections: ConnectionsRepository;
    profile: ProfileRepository;
    userProfile: UserProfileRepository;
    stylist: StylistRepository;
    wardrobePairings: WardrobePairingsRepository;
    discoverCatalog: DiscoverCatalogRepository;
    home: HomeRepository;
    notifications: NotificationsRepository;
};

export const createRepositories = (): Repositories => {
    if (USE_MOCK_DATA) {
        return {
            products: createMockProductsRepository(),
            wardrobe: createMockWardrobeRepository(),
            wishlist: createMockWishlistRepository(),
            inbox: createMockInboxRepository(),
            outfits: createMockOutfitsRepository(),
            listings: createMockListingsRepository(),
            orders: createMockOrdersRepository(),
            messages: createMockMessagesRepository(),
            connections: createMockConnectionsRepository(),
            profile: createMockProfileRepository(),
            userProfile: createMockUserProfileRepository(),
            stylist: createMockStylistRepository(),
            wardrobePairings: createMockWardrobePairingsRepository(),
            discoverCatalog: createMockDiscoverCatalogRepository(),
            home: createMockHomeRepository(),
            notifications: createMockNotificationsRepository(),
        };
    }

    // Integration mode: one createApi* per shipped domain; createEmpty* for unshipped UI shells.
    return {
        products: createApiProductsRepository(),
        profile: createApiProfileRepository(),
        connections: createApiConnectionsRepository(),
        userProfile: createApiUserProfileRepository(),
        wardrobe: createApiWardrobeRepository(),
        wishlist: createApiWishlistRepository(),
        inbox: createApiInboxRepository(),
        outfits: createApiOutfitsRepository(),
        listings: createApiListingsRepository(),
        orders: createApiOrdersRepository(),
        messages: createApiMessagesRepository(),
        stylist: createApiStylistRepository(),
        wardrobePairings: createApiWardrobePairingsRepository(),
        discoverCatalog: createApiDiscoverCatalogRepository(),
        home: createApiHomeRepository(),
        notifications: createApiNotificationsRepository(),
    };
};

export const repositories = createRepositories();

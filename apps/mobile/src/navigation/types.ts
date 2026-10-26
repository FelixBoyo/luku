import type { NavigatorScreenParams } from '@react-navigation/native';

export type AuthStackParamList = {
    Splash: undefined;
    Landing: undefined;
    SignIn: undefined;
    SignUp: undefined;
    VerifyOtp: { email: string };
    PasswordReset: { recoveryToken?: string } | undefined;
    Onboarding: { mode?: 'signup' | 'preferences' } | undefined;
    OnboardingComplete: undefined;
};

export type HomeStackParamList = {
    HomeMain: undefined;
    Inbox: undefined;
    /** Kept for MarketplaceScreen type compat; route is not registered in HomeStack */
    Marketplace: undefined;
};

export type DiscoverStackParamList = {
    DiscoverMain: undefined;
};

export type SellStackParamList = {
    SellMain: { wardrobeItemId?: string } | undefined;
    ListingConfirmation: { listingId: string };
};

export type StylistStackParamList = {
    StylistMain: undefined;
};

export type MeStackParamList = {
    MeMain: undefined;
    Settings: undefined;
    Wishlist: undefined;
    EditProfile: undefined;
    SecuritySettings: undefined;
    LanguageRegion: undefined;
    PrivacySettings: undefined;
    BlockedAccounts: undefined;
    Contact: undefined;
    PaymentMethods: undefined;
    /** `returnToOrderId`: reopen that order after a save so the seller can mark it shipped. */
    PayoutDetails: { returnToOrderId?: string } | undefined;
    Connections: { initialTab?: 'followers' | 'following' } | undefined;
    SavedOutfits: { initialTab?: 'created' | 'inspirations' } | undefined;
    Commerce: { initialTab?: 'listings' | 'purchases' | 'sales' } | undefined;
};

export type MainTabParamList = {
    Home: NavigatorScreenParams<HomeStackParamList>;
    Discover: NavigatorScreenParams<DiscoverStackParamList>;
    Sell: NavigatorScreenParams<SellStackParamList>;
    Stylist: NavigatorScreenParams<StylistStackParamList>;
    Me: NavigatorScreenParams<MeStackParamList>;
};

export type RootStackParamList = {
    MainTabs: NavigatorScreenParams<MainTabParamList>;
    ProductDetail: { productId: string };
    Cart: undefined;
    Conversation: { conversationId: string; name: string };
    Orders: undefined;
    OrderTracking: { orderId: string };
    WardrobeItemDetail: { itemId: string };
    AIRecommendations: undefined;
    Trending: undefined;
    Wardrobe: undefined;
    WardrobePairings: undefined;
    VirtualTryOn: undefined;
    Payment: undefined;
    OrderConfirmation: { orderId: string };
    Help: undefined;
    HelpArticle: { title: string; body: string };
    Notifications: undefined;
    Legal: { tab?: 'terms' | 'privacy' };
    BrandDetail: { brandId: string };
    StyleDetail: { styleId: string };
    UserProfile: { userId: string };
    ComingSoon: { feature?: string } | undefined;
    Onboarding: { mode?: 'signup' | 'preferences' } | undefined;
    OutfitDetail: { outfitId: string };
    CreateOutfit: { outfitId?: string } | undefined;
    ListItemModal: { wardrobeItemId: string };
    ListingDetail: { listingId: string };
    SharedOutfit: { outfitId: string };
};

declare global {
    namespace ReactNavigation {
        interface RootParamList extends RootStackParamList {}
    }
}

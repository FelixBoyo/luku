# Phase 1 screen inventory

Route → data source → Phase 2 wave. Use when assigning member specs.

**Legend — data source:** `mock` = `data/mock/` via `createMock*`; `repository` = `repositories/` (mock, api, or empty per `USE_MOCK_DATA`); `empty` = `createEmpty*` returns `[]` when flag is false; `context` = `AppStateContext`; `stub` = UI only / ComingSoon.

**When `USE_MOCK_DATA=false`:** M1 domains use `api` (auth, profile, connections, user profile). Products use `api` when BFF is running, else empty. All other list screens (wardrobe, wishlist, inbox, outfits, listings, orders, messages) use `empty` until M2–M4 ship endpoints.

| Route | Screen file | Auth | Data source | Phase 2 wave | Owner | Notes |
|-------|-------------|------|-------------|--------------|-------|-------|
| **Auth stack** |
| Splash | `auth/SplashScreen` | no | stub | — | — | Brand splash |
| Landing | `auth/LandingScreen` | no | stub | W1 | TBD | Dev bypass `__DEV__` only |
| SignIn | `auth/SignInScreen` | no | repository | W1 | M1 | Express login via AuthContext |
| SignUp | `auth/SignUpScreen` | no | repository | W1 | M1 | Express signup via AuthContext |
| PasswordReset | `auth/PasswordResetScreen` | no | repository | W1 | M1 | BFF password-reset + deep link |
| Onboarding | `auth/OnboardingScreen` | partial | context | W1 | TBD | Preferences persistence |
| OnboardingComplete | `auth/OnboardingCompleteScreen` | partial | stub | W1 | TBD | |
| **Home tab** |
| HomeMain | `HomeScreen` | yes | repository + context | W2/W4 | TBD | Products, wishlist, cart |
| Inbox | `InboxScreen` | yes | repository | W6 | TBD | Collapsing chrome |
| Marketplace | `MarketplaceScreen` | yes | mock | — | — | **Not registered** in nav |
| **Discover tab** |
| DiscoverMain | `DiscoverScreen` | yes | repository + context | W2/W4 | TBD | Masonry, filters, wishlist |
| **Sell tab** |
| SellMain | `SellScreen` | yes | repository | W3 | TBD | Draft hidden |
| ListingConfirmation | `ListingConfirmationScreen` | yes | repository | W3 | TBD | |
| **Stylist tab** |
| StylistMain | `StylistScreen` | yes | mock + context | W6 | TBD | AI BFF later |
| **Me tab** |
| MeMain | `MeScreen` | yes | repository + context | W3/W4 | TBD | Hub previews |
| Settings | `SettingsScreen` | yes | stub | W2 | TBD | Links to settings sub-screens |
| Wishlist | `WishlistScreen` | yes | repository + context | W4 | TBD | |
| EditProfile | `EditProfileScreen` | yes | repository | W1 | M1 | BFF PATCH /v1/api/profile |
| SecuritySettings | `settings/SecuritySettingsScreen` | yes | stub | W2 | TBD | Local validation only |
| LanguageRegion | `settings/LanguageRegionScreen` | yes | stub | W2 | TBD | |
| PrivacySettings | `settings/PrivacySettingsScreen` | yes | stub | W2 | TBD | |
| BlockedAccounts | `settings/BlockedAccountsScreen` | yes | repository | W2 | M1 | BFF GET /connections/blocked |
| Contact | `settings/ContactScreen` | yes | stub | W2 | TBD | |
| PaymentMethods | `settings/PaymentMethodsScreen` | yes | stub | W5 | TBD | |
| Connections | `ConnectionsScreen` | yes | repository | W2 | M1 | BFF connections API |
| SavedOutfits | `SavedOutfitsScreen` | yes | repository + context | W6 | TBD | Created \| Inspirations |
| Commerce | `CommerceScreen` | yes | repository | W5 | TBD | Listings \| Purchases |
| **Root stack** |
| ProductDetail | `ProductDetailScreen` | yes | repository + context | W2/W4 | TBD | |
| Cart | `CartScreen` | yes | context | W4/W5 | TBD | |
| Conversation | `ConversationScreen` | yes | mock | W6 | TBD | |
| Orders | `OrdersScreen` | yes | mock | W5 | TBD | |
| OrderTracking | `OrderTrackingScreen` | yes | mock | W5 | TBD | |
| WardrobeItemDetail | `WardrobeItemDetailScreen` | yes | repository + context | W3 | TBD | |
| Wardrobe | `WardrobeScreen` | yes | repository + context | W3 | TBD | Collapsing chrome |
| WardrobePairings | `WardrobePairingsScreen` | yes | mock | W2 | TBD | From Discover |
| VirtualTryOn | `VirtualTryOnScreen` | yes | stub | post-v1 | — | Deferred |
| Payment | `PaymentScreen` | yes | stub | W5 | TBD | Express payments |
| OrderConfirmation | `OrderConfirmationScreen` | yes | mock | W5 | TBD | |
| Help | `HelpScreen` | yes | mock | W2 | TBD | Contact stub |
| HelpArticle | `HelpArticleScreen` | yes | mock | W2 | TBD | |
| Notifications | `NotificationsScreen` | yes | mock | W6 | TBD | |
| Legal | `LegalScreen` | yes | stub | — | — | Terms/privacy static |
| AIRecommendations | `AIRecommendationsScreen` | yes | mock | W6 | TBD | |
| Trending | `TrendingScreen` | yes | repository | W2 | TBD | |
| BrandDetail | `BrandDetailScreen` | yes | mock | W2 | TBD | |
| StyleDetail | `StyleDetailScreen` | yes | mock | W2 | TBD | |
| UserProfile | `UserProfileScreen` | yes | mock | W2 | TBD | |
| OutfitDetail | `OutfitDetailScreen` | yes | repository + context | W3/W6 | TBD | |
| CreateOutfit | `CreateOutfitScreen` | yes | repository + context | W3 | TBD | |
| ListItemModal | `ListItemModalScreen` | yes | repository | W3 | TBD | Modal |
| ListingDetail | `ListingDetailScreen` | yes | repository | W3 | TBD | |
| SharedOutfit | `SharedOutfitScreen` | yes | stub | W1 | TBD | Deep link |
| ComingSoon | `ComingSoonScreen` | yes | stub | — | — | Fallback route |
| Onboarding (root) | `auth/OnboardingScreen` | yes | context | W1 | TBD | Preferences from Settings |
| ProfileScreen | `ProfileScreen` | — | — | — | — | **Removed** |

## Repositories (shared layer)

| Repository | Mock | Supabase live | Phase 2 wave |
|------------|------|---------------|--------------|
| products | yes | partial reads | W2 |
| wardrobe | yes | stub | W3 |
| wishlist | yes | stub | W4 |
| inbox | yes | stub | W6 |
| outfits | yes | stub | W6 |
| listings | yes | stub | W3 |
| connections | yes | api | W2 |
| profile | yes | api | W1 |

## Context (to migrate per `REDUX_EXPRESS_ARCHITECTURE.md`)

| Domain | Today | Target |
|--------|-------|--------|
| Session | `App.tsx` useState | Redux `authSlice` |
| Cart | `AppStateContext` | Redux `cartSlice` + API |
| Wishlist | `AppStateContext` + AsyncStorage | Redux `wishlistSlice` + API |
| Wardrobe / outfits / inbox counts | `AppStateContext` | Domain slices W3–W6 |

# ComingSoon route triage

Routes that navigate to `ComingSoon` and their Phase 2 disposition.

| Trigger | Screen | Phase 2 action | Notes |
|---------|--------|----------------|-------|
| Add Item | WardrobeScreen | **Done** — add wardrobe BottomSheet | Collection polish pass |
| Save Draft | SellScreen | Hide until API | Draft button hidden in v1 |
| Saved Outfit | MeScreen | **Done** — `SavedOutfits` merged screen | Created \| Inspirations tabs |
| Outfit detail | WardrobeItemDetailScreen | **Done** — `OutfitDetail` route | Wave 3 |
| Photo Upload | VirtualTryOnScreen | Defer — button disabled | Coming soon helper text |
| VTO save look (header heart) | VirtualTryOnScreen | Phase 2 — wire to inspirations or remove | **Done** — heart hidden in v1 |
| Inspiration Remix | OutfitDetailScreen | **Done** — Edit copies to Created tab | Phase 1 polish |
| Preferences | Settings (was ProfileScreen) | Use onboarding preferences flow | ProfileScreen removed |
| Privacy & Security | — | Stay stub | Was on removed ProfileScreen |
| Subscription | — | Stay stub | Was on removed ProfileScreen |
| Security | SettingsScreen | **Done** — `SecuritySettings` + toast/inline validation | Pre-Phase 2 pass |
| Payment Methods | SettingsScreen | **Done** — `PaymentMethods` + toast | Pre-Phase 2 pass |
| Language & Region | SettingsScreen | **Done** — `LanguageRegion` | Wave 2 |
| Privacy | SettingsScreen | **Done** — `PrivacySettings` | Wave 2 |
| Blocked Accounts | SettingsScreen | **Done** — `BlockedAccounts` | Wave 2 |
| Contact | SettingsScreen | **Done** — `Contact` | Wave 2 |
| Appearance | SettingsScreen | Deferred | Hidden in v1 |
| Help contact | HelpScreen | Stay stub | Ops not ready |
| Followers / Following | MeScreen stats | **Done** — `Connections` screen | CollectionHeader + PillTabs |
| Listing create | Sell / Me / modal | **Done** — unified paths → `ListingConfirmation` | Collection polish pass |
| Listing detail | MeScreen listings | **Done** — metadata + sold/pause/delete | Pre-Phase 2 pass |
| Wishlist sync | Me / WishlistScreen | **Done** — single `wishlistRepository` source | Pre-Phase 2 pass |
| Edit profile | EditProfileScreen | **Done** — single header Save | Collection polish pass |
| Trending browse | HomeScreen | **Done** — `TrendingScreen` + CollectionHeader | Collection polish pass |
| Wardrobe pairings browse | DiscoverScreen | **Done** — `WardrobePairings` root screen | Browse UX follow-up |
| Commerce browse | Me commerce | **Done** — `CommerceScreen` | Listings \| Purchases tabs; status filters use `FilterChips` |
| Wardrobe inventory browse | WardrobeScreen | **Done** — compact hero + masonry grid + collapsing search/tabs | Collapsing chrome rollout |
| Discover product feed | DiscoverScreen | **Done** — `useCollapsingChrome` + filter BottomSheet, masonry, wishlist, infinite scroll | Collapsing chrome rollout |
| Inbox browse | InboxScreen | **Done** — `CollapsingChromeSlot` search + tab collapse | Collapsing chrome rollout |
| Shared outfit | Share link / deep link | **Stub** — `SharedOutfit` screen; linking Phase 2 | UX polish batch |
| Confirm dialogs | Settings / auth / destructive actions | **Done** — `ConfirmDialog` + `InfoDialog` | Pre-Phase 2 pass |

## Manual QA matrix (Collection polish pass)

- [ ] Me wardrobe/wishlist/saved/listings show capped previews; View all opens full browse
- [ ] No duplicate navbar + hero titles on Trending, Wardrobe, Wishlist, AI Picks, Connections, Commerce, Saved Outfits
- [ ] Stylist hero reads "STYLIST"; outfit item rows scroll horizontally with peek
- [ ] Outfit detail piece strips use horizontal peek scroll
- [ ] Wardrobe FAB adds item via sheet (Items tab only)
- [ ] Saved Outfits: Created \| Inspirations tabs on one screen
- [ ] Commerce: Listings \| Purchases tabs; Manage all orders → Orders
- [ ] Edit Profile has single Save in header only
- [ ] Home: one See all → AI Picks; one See all → Trending; YMAL has no See all; no bottom AI duplicate CTA
- [ ] Quick list from Me → ListingConfirmation; Full details → ListItemModal (no Sell tab hop)
- [ ] Notifications uses FlatList with sticky filter chips

## Manual QA matrix (Pre-Phase 2 pass)

- [ ] Sell tab → publish → listing appears on Me → edit → mark sold
- [ ] Me quick-list with price → correct price on listing detail
- [ ] Heart product on Home → appears on Me wishlist + WishlistScreen
- [ ] Edit profile bio → reflects on Me after save
- [ ] Home Trending See all → TrendingScreen
- [ ] Inbox: scroll collapses search + tabs to compact bar; scroll to top restores full chrome
- [ ] Sign out uses custom ConfirmDialog

## Manual QA matrix (Browse & Home UX follow-up)

- [ ] Discover PAIR WITH YOUR WARDROBE View All → `WardrobePairings` (not `Wardrobe` inventory)
- [ ] Me View all wardrobe → `Wardrobe` inventory (unchanged)
- [ ] Commerce listing status chips (`FilterChips`) readable; Wardrobe primary `PillTabs` readable
- [ ] Me wishlist preview shows View all when mock has 5+ items

## Manual QA matrix (Wardrobe & Discover feed pass)

- [ ] Wardrobe: compact hero + masonry grid visible immediately; no empty black gap under tabs
- [ ] Wardrobe: filter chips and search filter items correctly
- [ ] Discover: at top, full search + Filters row visible; no overlapping duplicate chrome
- [ ] Discover: scroll down collapses to compact bar (search icon + Filters); scroll to top restores full chrome
- [ ] Discover: Filters opens BottomSheet (category/size/price) from full or compact chrome
- [ ] Discover: featured hero + masonry grid with varied card heights
- [ ] Discover: bookmark on card toggles wishlist (syncs to Me)
- [ ] Discover: scroll to bottom loads more items
- [ ] Discover: search modes (profiles/brands/styles) still work
- [ ] Discover: no item count label in full or compact chrome

## Manual QA matrix (Collapsing chrome rollout)

- [ ] Shared: `useCollapsingChrome` + `CollapsingChromeSlot` used on Discover, Inbox, Wardrobe
- [ ] Inbox: compact search icon scrolls to top and focuses input; compact chip shows active tab
- [ ] Wardrobe: header title stays fixed; search + PillTabs collapse; compact chip shows active tab (e.g. Laundry badge)
- [ ] Wardrobe: compact search focuses input; FAB and add sheet unchanged
- [ ] No double/overlapping chrome on Discover, Inbox, or Wardrobe

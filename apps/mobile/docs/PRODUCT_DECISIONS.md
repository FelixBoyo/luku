# Product decisions (locked for Phase 2)

Decisions members must not re-litigate when writing Phase 2 specs. Update this file only via explicit product review.

## Navigation and IA

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Primary tabs | Home, Discover, Sell, Stylist, Me (5 tabs) | Figma IA |
| Marketplace tab | **Hidden** — route exists but not in tab bar | Commerce via Home, Discover, Stylist, ProductDetail, Cart |
| TopNav | Inbox \| LUKU \| Cart on tab roots; back on Inbox | Shell convention |
| Refine Your Picks on Home | **Hidden** (`SHOW_REFINE_PICKS = false`) | Preferences via Settings / onboarding |

## Interaction conventions

| Decision | Choice |
|----------|--------|
| Product save / wishlist | `Bookmark` icon |
| Outfit save / inspiration | `Heart` icon |
| Destructive actions | `ConfirmDialog` (not system alert) |
| Sign out | Custom `ConfirmDialog` |

## Data and mocks

| Decision | Choice |
|----------|--------|
| Default data mode | `EXPO_PUBLIC_USE_MOCK_DATA=true` (designers); members use `false` for integration |
| Mock import rule | Screens/context/components → `types/domain` + repositories only; see `MOCK_DATA_POLICY.md` |
| Release gate | Mock flag off + no dev bypass + QA matrices signed |
| Product display type | `Product` from `types/domain/product`; `productAdapter` maps `ProductDto` at repository boundary |
| Wishlist source | Single `wishlistRepository` (+ AppStateContext sync today) |

## Deferred / stub features

| Feature | Phase 2 disposition |
|---------|---------------------|
| Virtual try-on | Post-v1; upload disabled, heart hidden |
| Shared outfit deep link | `SharedOutfit` stub; `expo-linking` in Wave 1 |
| Help contact form | Stay stub until ops ready |
| Sell draft save | Button hidden until listings API |
| Appearance settings | Hidden in v1 |
| Privacy & Security / Subscription (old Profile) | Removed with ProfileScreen |

## Backend integration (target)

| Decision | Choice |
|----------|--------|
| Client state | `AuthContext` + `AppStateContext` + repositories — **no Redux** |
| Data access | Express BFF `/v1/api/*` only in production |
| Auth (today) | Supabase client in `App.tsx` (migrate to `AuthContext` + API) |
| Auth + API (target) | `apiClient` + Bearer tokens; see `docs/architecture/BFF_OVERVIEW.md` |
| Shared types | `packages/contracts/` |
| AI | Task routes `/v1/api/ai/*`; Gemini v1 provider on server only |
| Payments | Shared monorepo Express `/v1/api/payments/*` — never secret keys in mobile |
| Legacy web | `apps/web-legacy/` — reference only, do not extend |

## Phase 2 wave ownership (assign names before distributing specs)

| Wave | Domain | Status |
|------|--------|--------|
| W1 | Auth deep links, profile persistence, onboarding | Pending |
| W2 | Products live on all discovery surfaces | Mostly done — verify Discover |
| W3 | Wardrobe upload, Sell, log-wear, outfits API | Pending |
| W4 | Cart / wishlist Supabase | Pending |
| W5 | Checkout, orders, payments | Pending |
| W6 | Inbox realtime, Stylist AI, saved outfits API | Pending |

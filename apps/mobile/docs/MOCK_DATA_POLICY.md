# Mock data policy

Controls how Phase 1 fixtures appear in the mobile app and how members wire live BFF data.

## Flag

`EXPO_PUBLIC_USE_MOCK_DATA` is read in **one place**: `apps/mobile/src/lib/config.ts`.

| Value | Behavior |
|-------|----------|
| `true` (default) | Full offline demo via `createMock*` repositories |
| `false` | Live BFF where implemented; **empty** repositories elsewhere — skeleton while loading, then empty state |

Set in `apps/mobile/.env`. Restart Expo after changes.

## Architecture rules

1. **Screens, context, and components must not import runtime data from `data/mock/`.**
   - Types: import from `types/domain/*`
   - Data: import from `repositories` only
2. **`repositories/index.ts` is the factory switch.** When `USE_MOCK_DATA=false`, no `createMock*` is used for pending domains.
3. **Three factory types per domain:** `createMock*` | `createApi*` | `createEmpty*`
4. **No mock fallbacks in UI.** Forbidden: `data.length ? data : mockProducts`
5. **Empty ≠ broken.** Use `EmptyState` with domain-specific copy.

CI enforces rule 1: `npm run verify:no-direct-mock-imports`

## Type naming

| Layer | Use | Avoid |
|-------|-----|-------|
| Fixtures | `mockProducts`, `createMock*` factories | — |
| UI / repository returns | `Product`, `Order`, `Profile` from `types/domain/` | `MockProduct` in new code |
| Wire / API | `ProductDto` in `packages/contracts/` | — |

`Mock*` aliases in `types/domain/` are deprecated; they exist only for backward compatibility during migration.

## Repository pattern

```typescript
// repositories/index.ts — when USE_MOCK_DATA=false
products: createApiProductsRepository(),     // M2 — live when API up
profile: createApiProfileRepository(),       // M1
connections: createApiConnectionsRepository(), // M1
userProfile: createApiUserProfileRepository(), // M1
wardrobe: createEmptyWardrobeRepository(),   // M3 replaces with createApi*
wishlist: createEmptyWishlistRepository(),   // M2
inbox: createEmptyInboxRepository(),         // M4
outfits: createEmptyOutfitsRepository(),     // M3
listings: createEmptyListingsRepository(),   // M3
orders: createEmptyOrdersRepository(),       // M4
messages: createEmptyMessagesRepository(),   // M4
```

## How members ship live data

When your BFF endpoints are ready:

1. Implement `createApi*Repository` in `repositories/<domain>Repository.ts`
2. **Replace only** `createEmpty*` with `createApi*` in `repositories/index.ts`
3. Do **not** import `data/mock/` in screens — repository returns live data
4. Run manual QA with `EXPO_PUBLIC_USE_MOCK_DATA=false`
5. Update `apps/mobile/docs/PHASE1_INVENTORY.md` row for your screens

## What this initiative does **not** do

- Populate Supabase with seed rows to fill empty screens
- Build M2–M4 endpoints (each member owns their spec)
- Remove `data/mock/` (kept for demo mode)
- Change the default in `.env.example` from `true`

## Cart and inbox counts

- **Cart:** seeded from fixtures only when `USE_MOCK_DATA=true` (`repositories/cartBootstrap.ts`)
- **Inbox unread:** always from `repositories.inbox.unreadCount()` — never hardcoded

## Skeleton components

`components/skeletons/` — `ProductGridSkeleton`, `MasonrySkeleton`, `InboxListSkeleton`, `OrderListSkeleton`, `ConnectionRowSkeleton`, `WardrobeGridSkeleton`, `ProfileHeaderSkeleton`, plus M1 profile skeletons.

Show skeleton while `loading`; show `EmptyState` when the repository returns `[]`.

## Related docs

- [`PRODUCT_DECISIONS.md`](./PRODUCT_DECISIONS.md) — default `true` for designers
- [`PHASE1_INVENTORY.md`](./PHASE1_INVENTORY.md) — screen-by-screen data source
- [`../../docs/architecture/BFF_OVERVIEW.md`](../../docs/architecture/BFF_OVERVIEW.md) — request flow

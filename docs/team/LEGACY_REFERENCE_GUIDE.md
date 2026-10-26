# Legacy web reference guide

`apps/web-legacy/` is the archived Vite + Redux LUKU web app. **Read only.**

Before porting any slice, check table **scope** in [`TABLE_SCOPE.md`](../database/TABLE_SCOPE.md). If scope is `web-legacy` or `mobile-phase-2b`, **do not port** that slice to mobile Phase 2.

## When to open legacy

| You need… | Open |
|-----------|------|
| How Supabase query worked | `apps/web-legacy/store/slices/{domain}Slice.ts` |
| Field names / validation | `core/validation.ts` + slice mappers |
| Payment client flow | `apps/web-legacy/services/paystackService.ts` |
| AI prompt / JSON schema | `apps/web-legacy/services/geminiService.ts` → port to `backend/ai/prompts/` |
| Desktop UI behavior | `apps/web-legacy/components/{Screen}.tsx` |
| Mobile UI | `apps/mobile/src/screens/` (already built) |

## How to port (pattern)

1. Read legacy slice thunk → note Supabase table/RPC/filters
2. Confirm table scope is `mobile-v1` in [`TABLE_SCOPE.md`](../database/TABLE_SCOPE.md)
3. Add row to `docs/api/CONTRACT_MATRIX.md` (platform lead approves)
4. Add DTO to `packages/contracts/src/`
5. Implement `backend/services/` + `backend/data/` + `backend/router/v1/`
6. Add `createApi*Repository` in mobile calling `apiClient`
7. Map DTO → domain in `apps/mobile/src/adapters/`
8. Wire screen via repository + `AppStateContext.refresh*()` if needed

## Do not

- `import` from `apps/web-legacy` in mobile or backend
- Copy Redux into mobile
- Add features to `apps/web-legacy`
- Call Supabase from mobile screens
- Use `gemini` in mobile file names
- Port slices whose primary tables are `web-legacy` (trips, mood boards, albums, clothing_items)

## Slice → member → scope

| Legacy slice | Member | Primary tables | Scope |
|--------------|--------|----------------|-------|
| authSlice | M1 | `profiles`, auth | mobile-v1 |
| productsSlice, wishlistSlice | M2 | `products`, `wishlist` | mobile-v1 |
| wardrobeSlice | M3 | `wardrobe_items` (not `clothing_items`) | mobile-v1 |
| albumsSlice | — | `albums`, `album_outfits` | web-legacy |
| cartSlice, ordersSlice | M4 | `cart_items`, `orders` | mobile-v1 |
| featuresSlice (AI) | M4 | — (server tasks) | shared-infra |
| trips / mood board slices | — | `trips`, `mood_boards*` | web-legacy / phase-2b |

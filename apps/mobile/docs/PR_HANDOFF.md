# PR handoff: mock data gating + pre-PR polish

Use this as the PR description body when merging mock data gating to the team branch.

## Summary

- Gates all fixture data behind `EXPO_PUBLIC_USE_MOCK_DATA=true`
- When `false`: `createApi*` for M1 (+ products); `createEmpty*` for M2–M4 pending domains
- Screens show skeleton → empty state; no mock fallbacks in integration mode
- Display types renamed: use `Product`, `Order`, `Profile` from `types/domain/` (not `Mock*`)

**Policy:** [MOCK_DATA_POLICY.md](./MOCK_DATA_POLICY.md)

## Repository factories (`USE_MOCK_DATA=false`)

| Domain | Factory | Owner |
|--------|---------|-------|
| products | `createApiProductsRepository` | M2 |
| profile, connections, userProfile | `createApi*` | M1 |
| wardrobe, outfits, listings | `createEmpty*` | M3 |
| wishlist | `createEmpty*` | M2 |
| inbox, messages, orders | `createEmpty*` | M4 |

**Member instruction:** implement `createApi*Repository`, then replace `createEmpty*` with `createApi*` in `repositories/index.ts` only. Never import `data/mock/` in screens.

## Empty screens are intentional

Wardrobe, inbox, orders, etc. show empty UI until your BFF ships when `USE_MOCK_DATA=false`. Stylist, Discover pairings, notifications, and brand/style detail screens show demo content when mock is on.

## M1 reminder

Run `npm run db:migrate` for `database/migrations/009_handle_new_user.sql` if signup trigger not yet applied.

## Verification

```bash
npm run lint:mobile
npm run verify:no-direct-mock-imports
npm run verify:no-mobile-supabase
npm run verify:mobile
npm test -- apps/mobile/__tests__/productAdapter.test.ts
```

## Manual QA

| Flow | `USE_MOCK_DATA=true` | `USE_MOCK_DATA=false` |
|------|----------------------|------------------------|
| Home / Discover | Full grids | BFF products or empty |
| ProductDetail invalid id | Mock product | Not found empty state |
| Me | Full demo | Profile/connections BFF; other tabs empty |
| Cart / Inbox | Demo data | Empty |
| Sign in | Works | BFF only |

Test on physical device with LAN `EXPO_PUBLIC_API_BASE_URL`.

## Expo Go vs dev build (auth)

| Runtime | Google / Apple | Email auth |
|---------|----------------|------------|
| **Expo Go** | Hidden (no native `RNGoogleSignin`) | Register → OTP → login, password reset, demo seed accounts |
| **Dev / standalone build** | Available via lazy-loaded native modules | Same as above |

To test Google/Apple: `eas build --profile development`, or `npx expo run:ios` / `npx expo run:android`. Set `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` and `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` in `apps/mobile/.env`.

**Supabase:** Confirm signup + Magic Link templates must expose `{{ .Token }}` — see [supabase-email-otp.md](../../../docs/ops/supabase-email-otp.md). Password reset: [supabase-password-reset.md](../../../docs/ops/supabase-password-reset.md). QA: [M1_QA_CHECKLIST.md](../../../docs/team/M1_QA_CHECKLIST.md).

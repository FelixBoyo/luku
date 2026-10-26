# LUKU Mobile (Expo)

Expo client for LUKU — Phase 2 shell with mock data by default. **Sign-in** uses
Express `/v1/api/auth/*` via `AuthContext`. With `EXPO_PUBLIC_USE_MOCK_DATA=false`,
products load from the BFF (`createApiProductsRepository`).

## Navigation (Figma 5-tab IA)

```
Auth (unauthenticated) — NavigationContainer in App.tsx
  Splash → Landing → SignIn / SignUp / PasswordReset / Onboarding

Main (authenticated) — NavigationContainer in RootNav.tsx
  Root stack
    MainTabs
      Home      → HomeMain, Inbox (nested Home stack)
      Discover  → DiscoverMain
      Sell      → SellMain, ListingConfirmation
      Stylist   → StylistMain
      Me        → MeMain, Settings, Wishlist, EditProfile
    ProductDetail, Cart, Orders, OrderTracking, Conversation,
    WardrobeItemDetail, Wardrobe, VirtualTryOn, Payment, …
```

**Marketplace tab is hidden** — browse via Home, Discover, Stylist, and ProductDetail.

TopNav (Inbox | LUKU | Cart) appears on tab roots. On Inbox, mail icon becomes back.

## Architecture

```
apps/mobile/src/
├── theme/tokens.ts
├── lib/config.ts           # USE_MOCK_DATA, API_BASE_URL, SHOW_REFINE_PICKS
├── lib/productAdapter.ts   # ProductDto ↔ MockProduct
├── repositories/           # mock + api + empty factories (see MOCK_DATA_POLICY)
├── types/domain/           # display types (screens import here, not data/mock)
├── hooks/useProducts.ts
├── context/
│   ├── AppStateContext.tsx # cart, wishlist, wardrobe, inbox
│   └── ToastContext.tsx
├── components/
│   ├── shell/              # TopNav, BottomTabBar, TabScreenLayout
│   ├── home/               # RefineYourPicksCard (hidden by default)
│   └── ErrorBoundary.tsx
├── data/mock/              # Phase 1 fixtures (repositories only — not screens)
└── screens/
```

## Environment variables

Create `apps/mobile/.env`:

```bash
# Default true (mocks). Set false for Express BFF (auth, profile, connections, products).
EXPO_PUBLIC_USE_MOCK_DATA=false
# Express BFF — use your LAN IP on a physical device
EXPO_PUBLIC_API_BASE_URL=http://localhost:3001
```

Supabase credentials belong in **server** `.env.local` only (see root `.env.example`).
Mobile talks to Express `/v1/api/*` per [ADR-1](../../docs/architecture/ADR.md).

### Mock data policy

| `USE_MOCK_DATA` | What you see |
|-----------------|--------------|
| `true` (default) | Full offline demo — all `createMock*` repositories |
| `false` | M1 BFF (auth, profile, connections) + M2 products when API is up; other domains show skeleton → empty |

Screens must not import `data/mock/` — see [`docs/MOCK_DATA_POLICY.md`](docs/MOCK_DATA_POLICY.md).

**Dev seed logins** (after `npm run db:seed` from repo root): see
[`database/seeds/dev_seed.sql`](../../database/seeds/dev_seed.sql) header.

**Backend** requires root `.env.local` with `SUPABASE_SERVICE_ROLE_KEY` — see
[`.env.example`](../../.env.example). Set `ALLOWED_ORIGINS` for Expo web/device.

### Connecting mobile to the local API

| Target | `EXPO_PUBLIC_API_BASE_URL` | Notes |
|--------|---------------------------|-------|
| iOS Simulator / Android emulator | `http://localhost:3001` | Same machine as `npm run dev:api` |
| Physical device | `http://<YOUR-LAN-IP>:3001` | Phone and laptop on same Wi-Fi; add LAN origins to `ALLOWED_ORIGINS` in `.env.local` |
| Remote teammate | Tunnel URL (ngrok, etc.) | Set mobile env + add tunnel origin to `ALLOWED_ORIGINS` |

1. Start API: `npm run dev:api` (repo root)
2. Set `EXPO_PUBLIC_USE_MOCK_DATA=false` in `apps/mobile/.env`
3. Restart Expo after env changes (`npm run dev:mobile:clean` if needed)
4. Smoke test: Sign in with seed user → Me shows profile from BFF

API changes are tracked in [`docs/api/CHANGELOG.md`](../../docs/api/CHANGELOG.md) and [`docs/api/CONTRACT_MATRIX.md`](../../docs/api/CONTRACT_MATRIX.md).

## Run

From the **repo root** (npm workspaces):

```bash
npm install
npm run dev:mobile
```

After dependency changes, clear Metro cache:

```bash
npm run dev:mobile:clean
```

## Monorepo / Metro

This app shares a root `node_modules` with `@luku/web-legacy` and root test tooling. Two failure modes:

| Symptom | Cause | Check |
|---------|-------|-------|
| **Invalid hook call** | Duplicate `react` copies | `npm run verify:deps` |
| **Unable to resolve "scheduler"** (etc.) | Hoisted/nested deps invisible to Metro | `npm run verify:mobile` |

- Always `npm install` from the repo root — do not maintain a separate `apps/mobile/package-lock.json`
- Root `package.json` `overrides` pins `react` / `react-dom` to match Expo's version in this app's `package.json`
- [`metro.config.js`](metro.config.js) uses [`metro/monorepo-resolver.js`](metro/monorepo-resolver.js) to map `react` (mobile copy) and react-native transitive deps for flat Metro lookup
- Both verify scripts run in CI

If bundling breaks: `npm run verify:deps && npm run verify:mobile`, then `npm run dev:mobile:clean`. For missing packages, `npm install <pkg> --workspace=@luku/mobile` from repo root.

**Expo SDK upgrade checklist**

1. `cd apps/mobile && npx expo install react react-native`
2. Update root `package.json` `overrides` to match the new pinned versions
3. `npm install` at repo root
4. `npm run verify:deps && npm run verify:mobile`
5. `npm run dev:mobile:clean`

## Phase 1.5 vs Phase 2

| Area | Phase 1.5 (current) | Phase 2 |
|------|---------------------|---------|
| Auth | BFF sign-in/up/reset via `AuthContext` | Deep links, profile persistence |
| Products | Repository + mock (Home, ProductDetail wired) | All discovery surfaces live |
| Cart / wishlist | AppStateContext + AsyncStorage wishlist | Supabase tables |
| Wardrobe | Mock repository + log wear sync | Upload + Gemini BFF |
| Checkout | UI stepper (mock) | Stripe / Paystack / M-Pesa |
| Marketplace tab | Hidden | Stays hidden; browse via discovery |
| Virtual try-on | Stub screen | Post-v1 |

See `docs/COMING_SOON_TRIAGE.md` for stub route disposition.

## Phase 1 closure and Phase 2 prep

| Doc | Purpose |
|-----|---------|
| [`docs/MOCK_DATA_POLICY.md`](docs/MOCK_DATA_POLICY.md) | Mock vs empty vs API repositories |
| [`docs/PHASE1_INVENTORY.md`](docs/PHASE1_INVENTORY.md) | Every route → data source → Phase 2 wave |
| [`docs/PRODUCT_DECISIONS.md`](docs/PRODUCT_DECISIONS.md) | Locked IA and integration decisions |
| [`docs/QA_SIGNOFF.md`](docs/QA_SIGNOFF.md) | Manual QA matrices (37 items) |
| [`docs/REDUX_EXPRESS_DISCOVERY_PROMPT.md`](docs/REDUX_EXPRESS_DISCOVERY_PROMPT.md) | Copy-paste prompt for your reference project |
| [`docs/REDUX_EXPRESS_ARCHITECTURE.md`](docs/REDUX_EXPRESS_ARCHITECTURE.md) | Pointer → [`docs/architecture/redux-express-reference.md`](../../docs/architecture/redux-express-reference.md) |
| [`docs/PHASE2_SPEC_TEMPLATE.md`](docs/PHASE2_SPEC_TEMPLATE.md) | Member spec template |
| [`../../docs/team/README.md`](../../docs/team/README.md) | Phase 2 team specs (01–04) |
| [`../../docs/api/CONTRACT_MATRIX.md`](../../docs/api/CONTRACT_MATRIX.md) | API source of truth |
| [`../../docs/architecture/BFF_OVERVIEW.md`](../../docs/architecture/BFF_OVERVIEW.md) | Express + mobile flow |

**Phase 2:** Mobile uses `src/api/apiClient.ts` → Express `/v1/api/*`. No Redux. See team docs after platform gate sign-off.

## Typecheck

```bash
cd apps/mobile && npm run lint:check
```

## Troubleshooting

- **Invalid hook call / useState of null** — see [Monorepo / Metro](#monorepo--metro) above
- **Unable to resolve package** — `npm run verify:mobile`, add direct dep if needed, `dev:mobile:clean`
- **Fonts not loading** — `npm run dev:mobile:clean` (from repo root)
- **Reanimated** — `react-native-reanimated/plugin` must be last in `babel.config.js`
- **Dev bypass** — only available in `__DEV__` builds (Landing screen)

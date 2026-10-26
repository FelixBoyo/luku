# Core extraction audit

Prepared for React Native readiness: classify modules under `store/`, `services/`, `utils/`, `analytics/`, and `theme/` by platform coupling.

**Legend**

- **PORTABLE** — No direct `document` / `window` / DOM storage / Node-only APIs in the file.
- **WEB-ONLY** — Uses browser DOM or web-only APIs as part of normal operation.
- **SERVER-ONLY** — Intended for Node/Express only (none of the audited paths are Express-only; client services may read `process.env` for tests/Vite).
- **MIXED** — Needs refactor, adapters, or env indirection for RN / strict isomorphic use.

---

## `store/`

| File | Tag | Notes |
|------|-----|--------|
| `store/store.ts` | **PORTABLE** | Redux store wiring only. |
| `store/hooks.ts` | **PORTABLE** | Typed `useDispatch` / `useSelector`. |
| `store/slices/cartSlice.ts` | **PORTABLE** | Pure reducers; domain types only. |
| `store/slices/toastSlice.ts` | **PORTABLE** | UI state only; no I/O. |
| `store/slices/uiOnboardingSlice.ts` | **PORTABLE** | In-memory UI flag only. |
| `store/slices/analyticsSlice.ts` | **PORTABLE** | Async Supabase + `retryHandler`; no DOM in file. |
| `store/slices/reviewsSlice.ts` | **PORTABLE** | Supabase only (inherits client env from `supabaseClient`). |
| `store/slices/returnsSlice.ts` | **PORTABLE** | Supabase only. |
| `store/slices/sellerKycSlice.ts` | **PORTABLE** | Supabase only. |
| `store/slices/userEngagementSlice.ts` | **PORTABLE** | Supabase only. |
| `store/slices/productsSlice.ts` | **MIXED** | Uses `supabaseClient` (Vite `import.meta` / `process.env` in dependency) + `marketplaceService`. |
| `store/slices/wishlistSlice.ts` | **MIXED** | Supabase + `trackEvent` (`analytics/events` uses web storage / `window`). |
| `store/slices/ordersSlice.ts` | **MIXED** | Supabase + `trackEvent` + `@core/validation` (portable logic). |
| `store/slices/albumsSlice.ts` | **MIXED** | Supabase + `trackEvent`. |
| `store/slices/businessSlice.ts` | **MIXED** | Supabase + `trackEvent`. |
| `store/slices/businessKycSlice.ts` | **MIXED** | Supabase + `trackEvent`. |
| `store/slices/promotionsSlice.ts` | **MIXED** | Supabase + `trackEvent`. |
| `store/slices/authSlice.ts` | **MIXED** | `window.location.origin` for Supabase `redirectTo` + `trackEvent` + Supabase auth. |
| `store/slices/tryOnSlice.ts` | **MIXED** | `Blob` upload to Supabase storage (RN may use different binary types). |
| `store/slices/featuresSlice.ts` | **MIXED** | Heavy `geminiService` usage. |
| `store/slices/playgroundSlice.ts` | **MIXED** | `geminiService` + `Blob` upload pipeline. |
| `store/slices/tripsSlice.ts` | **MIXED** | `geminiService` + `trackEvent`. |
| `store/slices/wardrobeSlice.ts` | **MIXED** | `geminiService` + `trackEvent`. |
| `store/slices/*.test.ts` | **PORTABLE** | Unit tests; no runtime DOM by themselves. |

---

## `services/`

| File | Tag | Notes |
|------|-----|--------|
| `services/retryHandler.ts` | **PORTABLE** | Promise + backoff; no DOM/Node-only APIs. |
| `services/serviceWrapper.ts` | **PORTABLE** | Orchestrates retries/metrics; no DOM in file. |
| `services/marketplaceService.ts` | **PORTABLE** | Supabase + retry helper; no `window`/`document` in file. |
| `services/moodBoardService.ts` | **PORTABLE** | Same as above. |
| `services/supabaseClient.ts` | **MIXED** | `import.meta.env` (Vite) and `process.env`; not RN-default without abstraction. |
| `services/integrationConfig.ts` | **MIXED** | `import.meta` + `process.env` for keys and flags. |
| `services/integrationManager.ts` | **MIXED** | Uses `integrationConfig`; module-level `if (typeof window !== 'undefined')` health check on import. |
| `services/errorLogger.ts` | **MIXED** | `import.meta.env.DEV` (Vite-specific). |
| `services/paymentsConfigService.ts` | **MIXED** | `import.meta.env` + relative `fetch('/api/...')` (RN needs explicit API base). |
| `services/mpesaService.ts` | **MIXED** | `import.meta` + `fetch` to backend. |
| `services/paystackService.ts` | **MIXED** | Same pattern. |
| `services/stripeService.ts` | **WEB-ONLY** | `@stripe/stripe-js`, Elements flows, `window.location.origin`. |
| `services/geminiService.ts` | **MIXED** | `@google/genai`, `Blob` in image paths, config via `getIntegrationConfig`. |
| `services/imageService.ts` | **MIXED** | Web `File` type + Supabase storage uploads. |

---

## `utils/`

| File | Tag | Notes |
|------|-----|--------|
| `utils/productTags.ts` | **PORTABLE** | Supabase CRUD only; no DOM in file (depends on `supabaseClient` wiring). |
| `utils/recentlyViewed.ts` | **WEB-ONLY** | `localStorage`. |
| `utils/shareUtils.ts` | **WEB-ONLY** | `window`, `navigator.share`, `navigator.clipboard`, `window.open`, mailto links. |
| `utils/imageCropper.ts` | **WEB-ONLY** | `document.createElement('canvas')` and canvas cropping. |

`utils/validation.ts` was moved to **`@core/validation`** (see `core/validation.ts`).

---

## `analytics/`

| File | Tag | Notes |
|------|-----|--------|
| `analytics/events.ts` | **MIXED** | Event names and TypeScript payload types are portable; runtime `trackEvent` / session id uses `window`, `sessionStorage`, `localStorage` — treat as **WEB-ONLY** at runtime until split into interface + platform adapters. |

---

## `theme/`

| File | Tag | Notes |
|------|-----|--------|
| `theme/tokens.ts` | — | **Moved** to `@core/theme/tokens` (`core/theme/tokens.ts`). Was **PORTABLE** (Tailwind class strings only; RN may want parallel raw tokens if not using NativeWind-style classes). |

---

## Target layout options (not implemented beyond `core/` + aliases)

### Option A: npm workspaces (`packages/core`, `apps/web`, `apps/mobile`)

- **Pros:** Hard boundaries, separate bundlers per app, scales to more packages.
- **Cons:** Higher setup cost, peer dependency alignment (`react`, RTK), CI for two apps.
- **Rough effort:** Initial workspace + green web build **2–5 days**; full RN parity is **weeks** (see `docs/product/rn-v1-scope.md`).

### Option B: Monorepo `core/` + path aliases (current first step)

- **Pros:** Lowest friction; single `npm install`; incremental migration.
- **Cons:** Easier to accidentally import web code into `core/` without lint rules.
- **Rough effort:** Aliases + small moves **under 1 day**; optional ESLint `no-restricted-imports` for `core/**` **+0.5 day**.

**Recommendation:** Option B now; consider Option A when `core/` grows or RN app is split formally.

---

## Open questions

1. Should long-term `core/theme` hold Tailwind class strings, parallel semantic color/spacing tokens, or both?
2. Split `analytics/events.ts` into portable types + web adapter vs keep and stub on RN?

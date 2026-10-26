# Mobile follow-ups (Phase 2+)

Tracked here so the v1 scaffold stays small. None of these are on the v1
critical path.

## Payments

- [ ] **Stripe RN** — replace the web's `@stripe/react-stripe-js` flow with
  `@stripe/stripe-react-native`. Different API (no Elements), needs a
  config plugin in `app.config.ts`, and an Apple / Google Pay capability
  setup. Reuses the existing backend `POST /api/payments/...` endpoints.
- [ ] **Paystack RN** — web flow uses a hosted authorization URL opened in
  a new tab. On RN, use `expo-web-browser` (`openAuthSessionAsync`) so we
  can intercept the `luku://` redirect on completion. See
  `services/paystackService.ts` for the call site to mirror.
- [ ] **M-Pesa STK push** — proxy already exists at
  `api/payments/mpesa/stk-push.ts`. Mobile UX needs phone-number masking,
  background-resume tolerance for STK polling, and idempotency keys.

## Cross-cutting infra

- [ ] **Push notifications** (`expo-notifications`) — order shipped, OOTD,
  laundry reminders.
- [x] **Deep links** (`expo-linking`) — password reset deep link opens set-password flow via BFF confirm.

- [ ] **Image picker** (`expo-image-picker`) — needed for wardrobe upload
  parity with `components/FileUpload.tsx`. Watch memory when base64-ing
  large iOS HEIC photos.
- [ ] **Redux** (`@reduxjs/toolkit` + `react-redux`) — currently the
  mobile screens use local `useState`. When we lift wardrobe / cart /
  orders, version-match the root (`@reduxjs/toolkit@2.2.6`,
  `react-redux@9.1.2`) to avoid a duplicate `react-redux`.

## Tooling / DX

- [ ] **Mobile-local Jest runner** — root Vitest covers the shared hook,
  but a `jest-expo` setup will be needed for screen-level tests that
  exercise React Native components.
- [ ] **React 19 alignment** — root is on React 19.1.x; this app is on
  React 18.3.1 (Expo SDK 52). Bump to Expo SDK 53+ when we want to share
  components, not just pure hooks, with the web.
- [ ] **`@core` lint guard** — add an ESLint `no-restricted-imports` rule
  in `apps/mobile/` that forbids reaching into web-only code paths
  (`@/services/...`, `@/components/...`, etc).
- [x] **Replace direct Supabase reads with backend API** — product catalog
  routes through `EXPO_PUBLIC_API_BASE_URL` via `createApiProductsRepository`;
  mobile Supabase client removed (BFF-only per ADR-1).

## Documentation

- [ ] Add a CI lane that runs `cd apps/mobile && npx tsc --noEmit` on PRs
  touching `apps/mobile/**` or `core/**`.
- [ ] Document the EAS build / submit pipeline once we have an Apple /
  Google developer account.

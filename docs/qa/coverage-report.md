# Coverage Report (Pre-Refactor Safety Net)

## Baseline Run Snapshot
- Command: `npm test -- --run`
  - Result: failed
  - Summary: `Test Files 6 failed | 17 passed (23)`, `Tests 23 failed | 210 passed (233)`
- Command: `npm run test:coverage`
  - Result: failed before usable coverage summary
  - Blocking signal: existing suite failures plus mixed Vitest coverage package versions (`vitest@4.0.17` with `@vitest/coverage-v8@4.0.18`)

## Stabilization Run Snapshot (initial pass)
- Command: `npm test`
  - Result: passed
  - Summary: `Test Files 27 passed (27)`, `Tests 247 passed (247)`
- Command: `npm run test:coverage`
  - Result: passed
  - Summary: `Test Files 27 passed (27)`, `Tests 247 passed (247)`
  - Overall coverage: `Statements 26.54%`, `Branches 18.13%`, `Functions 20.59%`, `Lines 27.15%`

## Verification Run Snapshot (current, post follow-ups)
- Command: `npm test`
  - Result: passed
  - Summary: `Test Files 29 passed (29)`, `Tests 266 passed (266)`
- Command: `npm run test:coverage`
  - Result: passed
  - Summary: `Test Files 29 passed (29)`, `Tests 266 passed (266)`
  - Overall coverage: `Statements 27.51%`, `Branches 19.38%`, `Functions 20.72%`, `Lines 28.18%`
  - New endpoint coverage:
    - `backend/handlers/payments/mpesa/stk-push.ts`: `Lines 100%`, `Statements 97.22%`
    - `backend/handlers/payments/mpesa/status.ts`: `Lines 100%`, `Statements 97.56%`

## Critical Path Status

### Auth
- Existing tests: `components/Auth.test.tsx`, `src/test/smoke/App.smoke.test.tsx`
- Strength:
  - Base auth screen behavior is tested.
  - App-level smoke now covers four route branches: unauthenticated default, `/business`, `/reset-password`, **and the Supabase recovery email hash flow** (`#access_token=...&type=recovery`).
- Gaps:
  - Deep coverage of password reset error states (token expiry, token reuse) still not exercised.

### Checkout
- Existing tests: `components/Checkout.test.tsx`
- Strength:
  - Checkout form, Stripe-init UX paths, Stripe error fallback, and shipping address inputs are covered at component level.
  - **All `act(...)` warnings eliminated** in this suite (synchronous tests now await `findBy*` / `waitFor` so the on-mount `fetchPaymentsConfig` and `initializeStripe` promises flush inside `act()`).
- Gaps / instability:
  - Strict service contract tests exist for `services/paystackService.ts` and `services/mpesaService.ts`.
  - Checkout component line coverage remains modest (`33.33%` lines) - no UI path covers M-Pesa polling completion or Paystack redirect resume.

### Marketplace
- Existing tests: `components/Marketplace.test.tsx`, `src/test/services/marketplaceService.contract.test.ts`
- Strength:
  - Component-level marketplace suite passing.
  - Contract tests validate `services/marketplaceService.ts` output shapes (`Product[]`, `Map<string, Product[]>`, `WardrobeRecommendation[]`).
- Gaps / instability:
  - Stderr noise from `ProductSellerInfo` and analytics network side effects still appears (real `fetch` to localhost during render). Functional but noisy.

### Payment Endpoints
- Existing tests:
  - `backend/handlers/webhooks/paystack.test.ts` (signature verification + idempotency for the inbound Paystack webhook)
  - **NEW** `backend/handlers/payments/mpesa/stk-push.test.ts` (8 cases: secret-key gate, amount/phone/email validation, Kenyan phone normalization to `2547XXXXXXXX`, upstream error surfacing, malformed-body handling, response-shape lock)
  - **NEW** `backend/handlers/payments/mpesa/status.test.ts` (10 cases: secret-key gate, ID required, all five Paystack status mappings, upstream error surfacing, malformed-body handling, verify endpoint URL + Bearer auth contract)
- Strength: Paystack webhook idempotency + signature handling and the M-Pesa STK push / status proxy endpoints now have first-class coverage.
- Architectural note: this app does **not** receive an inbound M-Pesa webhook. M-Pesa confirmations come back via Paystack's mobile-money channel and the frontend polls `GET /api/payments/mpesa/requests/:id`. The previous "M-Pesa webhook gap" entry was misleading and is now reframed as STK push + status proxy coverage.

## Risk Summary Before Refactor
- Test and coverage commands are reliable pass gates in current state (29 files / 266 tests).
- `act(...)` noise has been removed from the Checkout suite; remaining stderr is real network attempts from analytics/seller-info during render and is documented as a separate follow-up.
- Critical path coverage depth is still low in several UI modules (especially `Checkout.tsx` interactive payment paths and broader marketplace interactions).

## Actions Implemented In This Work

### Initial pass (recorded above)
- Added contract tests for:
  - `services/marketplaceService.ts`
  - `services/paystackService.ts`
  - `services/mpesaService.ts`
- Added app smoke test for rendering and route branching:
  - `src/test/smoke/App.smoke.test.tsx`
- Stabilized test harness and suites:
  - aligned Vitest versions and run-mode scripts in `package.json`
  - aligned `src/test/utils.tsx` reducer map with `store/store.ts`
  - updated failing tests in `Header`, `Marketplace`, `CartSidebar`, `Checkout`, `Auth`, `ProductDetail`
  - added global mock cleanup and default fetch stubbing in `src/test/setup.ts`

### Follow-up pass (this work)
- **Smoke coverage:** added a fourth case to `src/test/smoke/App.smoke.test.tsx` that simulates a Supabase recovery email landing (`#access_token=...&type=recovery`) and asserts the `<PasswordReset />` branch renders.
- **M-Pesa endpoint coverage:** added co-located unit tests next to `backend/handlers/payments/mpesa/stk-push.ts` and `backend/handlers/payments/mpesa/status.ts`, mocking upstream Paystack via `fetch` and locking response shapes against the corresponding service-side contract tests.
- **Checkout `act()` cleanup:** converted seven synchronous `Checkout.test.tsx` cases to `await findBy*` / `await waitFor` so the on-mount `fetchPaymentsConfig` and `initializeStripe` promises resolve inside `act()`. No application code touched.
- **Coverage report refresh:** numbers, snapshot section, and follow-up list updated in `docs/qa/coverage-report.md`.

## Follow-Up Required
- Add explicit network mocks for `ProductSellerInfo`, `SearchAutocomplete`, and analytics in affected component suites to eliminate the remaining real-`fetch` stderr noise during render.
- Increase critical-path line/branch coverage in `App.tsx`, `Checkout.tsx` (M-Pesa polling success, Paystack redirect resume, Apple Pay branch), and payment edge paths.
- Consider stricter contract tests via runtime schema validation. `zod` is **not** currently a project dependency; this would need PR-level justification before adoption. Today's contracts compare `Object.keys().sort()` plus targeted `typeof` / enum membership checks.
- Add deeper auth coverage for password reset error states (expired token, token reuse, network failure on `updateUser`).

# Member 1 QA checklist

**Phase 0 remediation:** [`ZEUS_REMEDIATION.md`](../qa/ZEUS_REMEDIATION.md) § M1 · [`PHASE0_STATUS.md`](./PHASE0_STATUS.md)

Manual QA for auth, profile, and social layer ([01_MEMBER_AUTH_PROFILE.md](./01_MEMBER_AUTH_PROFILE.md)).

### Your next manual tests (John)

1. **M1-02** — Logout → must land on **Sign In** (not Splash).
2. **M1-01** — Upload profile photo → appears on Me after save.
3. **M1-03** — Login with unconfirmed email → routes to Verify OTP.

**Tester:** _____________ **Date:** _____________ **Platform:** _____________

## Setup

- [✔️] `npm run db:seed` (repo root)
- [✔️] `npm run db:migrate` if `009_handle_new_user.sql` not applied
- [✔️] Root `.env.local`: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_ANON_KEY`
- [✔️] `npm run dev:api`
- [✔️] Mobile: `EXPO_PUBLIC_USE_MOCK_DATA=false`, `EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3001`
- [ ] Supabase templates configured per [supabase-email-otp.md](../ops/supabase-email-otp.md) (Confirm signup + Magic Link) and [supabase-password-reset.md](../ops/supabase-password-reset.md)
- [ ] Redirect URL `luku://reset-password` allowlisted in Supabase

### Seed accounts

| Email | Password | User ID |
|-------|----------|---------|
| `dev+buyer@luku.app` | `LukuDev2026!` | `f0000001-0000-4000-8000-000000000001` |
| `dev+seller@luku.app` | `LukuDev2026!` | `f0000001-0000-4000-8000-000000000002` |
| `dev+seller2@luku.app` | `LukuDev2026!` | `f0000001-0000-4000-8000-000000000003` |

Buyer follows seller1 and seller2 in seed data.

## Auth — email OTP

- [✔️] Register new email → inbox shows **6-digit code** (Confirm signup template)
- [✔️] Enter code on Verify OTP → session + onboarding
- [✔️] Resend code works after 60s cooldown
- [✔️] Wrong/expired code shows clear error
- [ ✔️] Abandon OTP, kill app → reopen routes to Verify OTP (pending verification)
- [✔️] Re-register same email with **new password** → verify succeeds with new password
- [ ] Unconfirmed login → app routes to Verify OTP + resend
- [✔️] Confirmed duplicate email → “already exists” error

## Auth — password reset

- [ ] `dev+buyer@luku.app` (confirmed) → Forgot password → reset email arrives (`delivery: reset`)
- [ ] Open link on device with LUKU → set new password → login works
- [✔️] **Unverified** account → Forgot password → app navigates to **Verify OTP** (`delivery: otp`), 6-digit email (not reset link)
- [✔️] **Unknown** email → Forgot password → generic success, no error

## Auth — session & logout

- [ ] Logout → lands on **Sign In** (not Splash/Landing) *(M1-02 — verify)*
- [✔️] Kill app while logged in → reopen → still authenticated
- [✔️] Sign out uses custom ConfirmDialog

## Auth — guardrails

- [✔️] `npm run verify:no-mobile-supabase` passes
- [✔️] Google/Apple hidden in Expo Go; available in dev build (if configured)

## Profile

- [✔️] Me shows seed buyer profile when logged in as buyer
- [✔️] Edit Profile → change bio → Save → Me reflects change
- [ ] Edit Profile → upload profile photo → Save → Me reflects change *(M1-01 — verify on zeus after merge)*
- [ ] Open seller profile from product detail → loads via `GET /profile/:userId`

## Social (`user_follows`, `user_blocks`)

- [✔️] Me → Connections → Following shows 2 seed sellers (buyer account)
- [] Tap connection row → opens UserProfile
- [✔️] Follow/unfollow on UserProfile updates Connections - could do with better ui/ux showcasing te instatenous upate of the follow/following - currently we have to move to our me screen to see the updates tally
- [✔️] Block on UserProfile → appears in Settings → Blocked Accounts (no seed blocked accounts could we create them to test)
- [✔️] Unblock removes user from list

## Automated gates

```bash
npm run lint:mobile
npm run verify:no-mobile-supabase
npm run verify:no-direct-mock-imports
```

- [ ] All commands pass

## Regression (other members)

- [✔️] Home/products still load with seed data
- [✔️] No changes required to M2–M4 empty domains

## Sign-off

- [ ] All P0 items pass
- [ ] Failures logged with ticket IDs
- [ ] [PR_CHECKLIST.md](./PR_CHECKLIST.md) satisfied

**Remediation tasks:** [`../qa/ZEUS_REMEDIATION.md`](../qa/ZEUS_REMEDIATION.md) § M1

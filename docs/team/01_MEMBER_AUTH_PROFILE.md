# Member 1 (John) — Auth, profile & settings

**Owner:** John (also **platform lead** and **program owner** — see [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md))  
**Depends on:** Platform gate sign-off

## Phase 0 — your status (remediation)

**Branch:** `fix/m1-auth-profile-qa` (after platform merge to `zeus`)  
**Live dashboard:** [`PHASE0_STATUS.md`](./PHASE0_STATUS.md)

| ID | Status | What to do |
|----|--------|------------|
| M1-01 | Done | QA: profile photo on Me |
| M1-02 | Verify | Confirm logout → Sign In screen |
| M1-08 | Done | Via PLT-01 logout cart reset |
| M1-03–07 | Pending | P1/P2 after M1-02 verified |

**Do next (John):**

1. Complete [`TEAM_GO_CHECKLIST.md`](./TEAM_GO_CHECKLIST.md) and merge platform PR.
2. Verify **M1-02** on `fix/m1-auth-profile-qa`.
3. **M1-03** — unconfirmed login → Verify OTP + resend.

**QA:** [`M1_QA_CHECKLIST.md`](./M1_QA_CHECKLIST.md)

---

## Original spec (reference)

## Dev environment

- Seed: `npm run db:seed` (repo root)
- Login: `dev+buyer@luku.app` / `LukuDev2026!` (see [`database/seeds/dev_seed.sql`](../../database/seeds/dev_seed.sql))
- API: `npm run dev:api` — requires `SUPABASE_SERVICE_ROLE_KEY` in root `.env.local` ([`.env.example`](../../.env.example))
- Mobile: `EXPO_PUBLIC_USE_MOCK_DATA=false`, `EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3001`

## Tables in scope (`mobile-v1`)

- `profiles`
- `user_follows`
- `user_blocks`

## Tables indirect

- `auth.users` — via Supabase Auth through BFF (no direct mobile admin calls)

## Do not use (`web-legacy` / out of scope)

- `trips`, `mood_boards*`, `clothing_items`, `albums*`, KYC tables, `user_preferences` (onboarding stays local for v1)

Full list: [`TABLE_SCOPE.md`](../database/TABLE_SCOPE.md)

## Goal

Complete Express auth/profile/social layer. **SignIn** already uses `AuthContext` + `/v1/api/auth/login` as reference.

## Auth strategy (2026-06-16)

New accounts are created only via:

- **Google / Apple** native sign-in — provider ID token → `POST /v1/api/auth/oauth` → Supabase `signInWithIdToken`.
- **Email + password** — `POST /v1/api/auth/register` creates an UNCONFIRMED account and emails a 6-digit code; `POST /v1/api/auth/verify-otp` confirms it and returns a session. `VerifyOtpScreen` collects the code.

Open self-signup (`/signup`) is disabled (`AUTH_FORBIDDEN`). `/login` returns `AUTH_EMAIL_UNCONFIRMED` for unverified emails so the app routes to OTP. Existing demo password accounts (seed) stay confirmed and continue to log in unchanged. Password reset is unchanged (password accounts only; OAuth users have none).

Dashboard setup: disable public sign-ups, enable Google + Apple providers. For email OTP, follow [supabase-email-otp.md](../ops/supabase-email-otp.md) (**Confirm signup** + **Magic Link** templates with `{{ .Token }}`). For password reset, follow [supabase-password-reset.md](../ops/supabase-password-reset.md). Manual QA: [M1_QA_CHECKLIST.md](./M1_QA_CHECKLIST.md). Backend needs `SUPABASE_ANON_KEY`; mobile needs `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` and an EAS/dev build.

## Where to put code

| Layer | Path |
|-------|------|
| DTOs | `packages/contracts/src/auth.ts` (extend profile PATCH) |
| Routes | `backend/router/v1/auth.ts`, `profile.ts`, `connections.ts` |
| Services | `backend/services/authService.ts`, `profileService.ts` |
| Data | `backend/data/profileData.ts`, `connectionsData.ts` |
| Mobile | `apps/mobile/src/context/AuthContext.tsx` (extend) |
| Mobile repos | `profileRepository`, `connectionsRepository` → `createApi*` |
| Screens | `auth/*`, `EditProfileScreen`, `ConnectionsScreen`, `SettingsScreen` |

## Reference implementation (platform gate)

- [`AuthContext.tsx`](../../apps/mobile/src/context/AuthContext.tsx) — login, refresh, logout, tokens
- [`SignInScreen.tsx`](../../apps/mobile/src/screens/auth/SignInScreen.tsx) — Express login wired

## API endpoints

See [`CONTRACT_MATRIX.md`](../api/CONTRACT_MATRIX.md) auth + profile rows marked M1.

## Tasks

- [x] Migrate SignUp, PasswordReset, Settings logout from `supabase.auth` to BFF
- [x] `PATCH /v1/api/profile` + EditProfile save (`profiles` columns from migration 003)
- [x] `GET/POST/DELETE` connections routes (`user_follows`, `user_blocks`)
- [x] `POST /v1/api/auth/password-reset` (request email)
- [x] `createApiProfileRepository`, `createApiConnectionsRepository`
- [x] Deep links: `expo-linking` password reset (request + confirm via BFF)
- [x] `GET /v1/api/connections/blocked` + BlockedAccountsScreen wired
- [x] `GET /v1/api/profile/:userId` + UserProfile follow/unfollow
- [x] Migration `009_handle_new_user.sql` for signup profile trigger
- [x] M1 screens use loading skeletons (no mock name fallbacks when `USE_MOCK_DATA=false`)
- [x] SecureStore upgrade for tokens (`expo-secure-store` with AsyncStorage migration)

## Acceptance

- [x] Sign in/up/out via Express only (no `supabase.auth` in migrated screens)
- [x] Session survives app restart (refresh token)
- [x] Profile bio saves and shows on Me
- [x] PR checklist complete (automated checks; full E2E requires `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`)

## Out of scope

Products, wardrobe, cart, AI tasks, `web-legacy` tables

# API changelog

Track contract changes for mobile and backend consumers. Update this file in the same PR as endpoint changes.

## 2026-06-16 — Smart password reset routing

| Change | Endpoint | Mobile impact |
|--------|----------|---------------|
| Updated | `POST /v1/api/auth/password-reset` | Returns `PasswordResetResponseDto` with `delivery: 'reset' \| 'otp'`. Unverified accounts receive OTP and app navigates to `VerifyOtpScreen`; unknown emails get generic success (no enumeration). |

**DTOs:** `PasswordResetDelivery`, `PasswordResetResponseDto` in `packages/contracts/src/auth.ts`.

## 2026-06-16 — Auth strategy overhaul (OAuth + email OTP)

New sign-up/sign-in strategy. Existing demo password accounts keep working via `/login`.

| Change | Endpoint | Mobile impact |
|--------|----------|---------------|
| Added | `POST /v1/api/auth/register` | Email+password creates an UNCONFIRMED account and emails a 6-digit code; returns `RegistrationPendingDto` (no session) |
| Added | `POST /v1/api/auth/verify-otp` | Confirms the emailed code, activates the account, returns `SessionDto` |
| Added | `POST /v1/api/auth/resend-otp` | Resends the verification code (success-shaped, never leaks existence) |
| Added | `POST /v1/api/auth/oauth` | Exchanges a native Google/Apple ID token for a `SessionDto` |
| Disabled | `POST /v1/api/auth/signup` | Open self-signup now returns `AUTH_FORBIDDEN`; use `/register` |
| Updated | `POST /v1/api/auth/login` | Unconfirmed emails return `403 AUTH_EMAIL_UNCONFIRMED` so the app routes to OTP |

**DTOs:** `RegisterRequest`, `RegistrationPendingDto`, `VerifyOtpRequest`, `ResendOtpRequest`, `OAuthSignInRequest`, `OAuthProvider` in `packages/contracts/src/auth.ts`. New error code `AUTH_EMAIL_UNCONFIRMED`.

**Mobile:** new `VerifyOtpScreen`; `AuthContext` gains `register`, `verifyOtp`, `resendOtp`, `signInWithGoogle`, `signInWithApple`. Native sign-in requires an EAS/dev build and `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` / `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID`.

**Backend:** requires `SUPABASE_ANON_KEY` (already used for token verification) for `signInWithOtp` / `verifyOtp` / `signInWithIdToken`. Configure Google + Apple providers and the email OTP template (`{{ .Token }}`) in the Supabase dashboard; disable public sign-ups.

## 2026-06-15 — Mock data gating (mobile-only)

No API contract changes.

- `EXPO_PUBLIC_USE_MOCK_DATA=false` uses `createEmpty*` repositories for pending domains (wardrobe, wishlist, inbox, outfits, listings, orders, messages)
- Screens show skeleton while loading, then `EmptyState` — no fixture fallbacks
- CI: `npm run verify:no-direct-mock-imports`
- Policy: `apps/mobile/docs/MOCK_DATA_POLICY.md`

## 2026-06-15 — M1 polish (skeletons, blocked list, public profile, password confirm)

| Change | Endpoint | Mobile impact |
|--------|----------|---------------|
| Added | `GET /v1/api/connections/blocked` | `BlockedAccountsScreen` loads live blocked users |
| Added | `GET /v1/api/profile/:userId` | `UserProfileScreen` loads another user's profile |
| Added | `POST /v1/api/auth/password-reset/confirm` | Deep-link password reset completion |
| Added | `database/migrations/009_handle_new_user.sql` | Signup profile trigger hardened |

**DTOs:** `PasswordResetConfirmRequest` in `packages/contracts/src/auth.ts`.

## 2026-06-15 — M1 auth, profile, connections

| Change | Endpoint | Mobile impact |
|--------|----------|---------------|
| Added | `POST /v1/api/auth/password-reset` | `PasswordResetScreen` uses BFF instead of `supabase.auth` |
| Added | `GET /v1/api/profile` | Optional; mobile uses `GET /v1/api/auth/me` for profile reads |
| Added | `PATCH /v1/api/profile` | `EditProfileScreen` saves bio and profile fields via `createApiProfileRepository` |
| Added | `GET /v1/api/connections/followers` | `ConnectionsScreen` followers tab |
| Added | `GET /v1/api/connections/following` | `ConnectionsScreen` following tab |
| Added | `POST /v1/api/connections/follow` | Follow user |
| Added | `DELETE /v1/api/connections/follow/:userId` | Unfollow from Connections |
| Added | `POST /v1/api/connections/block` | Block user (API ready; UI uses mock in settings for now) |
| Added | `DELETE /v1/api/connections/block/:userId` | Unblock user |
| Updated | `GET /v1/api/auth/me` | Reads `profiles` table instead of auth `user_metadata` only |
| Updated | `SessionDto.user` | Enriched from `profiles` on login, signup, refresh |

**DTOs:** `ProfilePatchRequest`, `ConnectionUserDto`, `FollowRequest`, `BlockRequest` in `packages/contracts/`.

**Mobile env:** set `EXPO_PUBLIC_USE_MOCK_DATA=false` and `EXPO_PUBLIC_API_BASE_URL` to your Express host (LAN IP on physical devices).

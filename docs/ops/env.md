# Environment Variables

This document defines environment variables required by LUKU services.

## Web (Vite client)

These values are bundled into client code and are **not secrets**.

- `VITE_SUPABASE_PROJECT_ID`
- `VITE_SUPABASE_ANON_KEY`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_API_BASE_URL`
- `VITE_PAYSTACK_DEFAULT_CURRENCY`
- `VITE_PAYSTACK_ENABLE_CARDS`
- `VITE_PAYSTACK_ENABLE_APPLE_PAY`
- `VITE_PAYSTACK_ENABLE_MPESA`
- `VITE_ENABLE_GEMINI`
- `VITE_MPESA_ENVIRONMENT`
- `VITE_APP_URL`

## Backend / API (Express server)

These must be provided to server runtime only.

- `PORT`
- `NODE_ENV`
- `APP_URL`
- `PAYMENTS_ENV_MODE`
- `PAYSTACK_SECRET_KEY` **(server-only secret)**
- `PAYSTACK_WEBHOOK_SECRET` **(server-only secret)**
- `STRIPE_SECRET_KEY` **(server-only secret)**
- `GEMINI_API_KEY` **(server-only secret)**

Optional compatibility/runtime values:

- `PAYSTACK_PUBLIC_KEY`
- `STRIPE_PUBLISHABLE_KEY`

## Mobile (Expo)

Mobile uses the Express BFF only — no Supabase client in the app (ADR-1).

- `EXPO_PUBLIC_API_BASE_URL` — Express server base URL (e.g. `http://localhost:3001`)
- `EXPO_PUBLIC_USE_MOCK_DATA` — `true` (default) for mock repos; `false` for live BFF
- `EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID` — Google OAuth iOS client ID for native sign-in
- `EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID` — Google OAuth web client ID (Supabase "Authorized Client ID")

Native Google/Apple sign-in requires an EAS/dev build (not Expo Go).

Supabase keys (`SUPABASE_SERVICE_ROLE_KEY`, etc.) belong in **backend** `.env.local` only.
The backend also needs `SUPABASE_ANON_KEY` (or `VITE_SUPABASE_ANON_KEY`) for the email OTP
and provider ID-token flows (`signInWithOtp`, `verifyOtp`, `signInWithIdToken`).
Email OTP send/verify does **not** use a redirect URL (unlike password reset).
See [supabase-email-otp.md](./supabase-email-otp.md) for OTP dashboard setup and
[supabase-password-reset.md](./supabase-password-reset.md) for password reset.

Backend auth env (`.env.local`):

- `PASSWORD_RESET_REDIRECT_URL` — defaults to `luku://reset-password`; must match Supabase redirect allowlist
Never embed payment secret keys in mobile binaries.

## Security Notes

- Never commit real `.env` values to git.
- Never print secrets, token values, phone numbers, card numbers, or raw webhook payloads to logs.

# Supabase email OTP setup

Runbook for **OTP-first** sign-up verification. The mobile app sends users to `VerifyOtpScreen` to enter a **6-digit code**; it does not handle magic-link clicks.

**BFF flow:** `POST /v1/api/auth/register` → `signInWithOtp` → user enters code → `POST /v1/api/auth/verify-otp`.

## Prerequisites

Root `.env.local` (see [`.env.example`](../../.env.example)):

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — `admin.createUser`
- `SUPABASE_ANON_KEY` — `signInWithOtp` / `verifyOtp`

OTP registration does **not** use a redirect URL. Do not pass `emailRedirectTo` in code (unlike `PASSWORD_RESET_REDIRECT_URL` for password reset — see [supabase-password-reset.md](./supabase-password-reset.md)).

## 1. Auth provider settings

**Supabase Dashboard → Authentication → Providers → Email**

| Setting | Value |
|---------|--------|
| Enable email provider | On |
| Confirm email | On (users stay unconfirmed until OTP verified) |
| Allow new users to sign up | **Off** — registration is BFF-only via service role |

## 2. Email templates (critical)

LUKU registration calls `signInWithOtp` after `admin.createUser({ email_confirm: false })`. Supabase picks the template based on user state:

| Template | When it is sent |
|----------|-----------------|
| **Confirm signup** | **First OTP** after `/register` (unconfirmed user) |
| **Magic Link** | OTP **resend**, repeat `signInWithOtp`, or some returning flows |

**Configure both** with the same OTP-first content. Editing Magic Link alone will **not** fix the first registration email.

### Subject (both templates)

```text
Your LUKU verification code
```

### Body (copy-paste into Confirm signup and Magic Link)

```html
<h2>Verify your LUKU account</h2>
<p>Your verification code is:</p>
<p style="font-size: 32px; font-weight: bold; letter-spacing: 4px;">{{ .Token }}</p>
<p>This code expires in a few minutes. Enter it in the LUKU app to continue.</p>
<p>If you did not request this, you can ignore this email.</p>
```

### Do not include

- `{{ .ConfirmationURL }}` — sends users a clickable link instead of focusing on the code
- “Click here to confirm” copy — the app expects in-app code entry on `VerifyOtpScreen`

Save both templates and send a test registration (see §5).

## 3. OTP expiry and URL configuration

**Authentication → Providers → Email** (or Auth settings, depending on dashboard version)

- Set OTP expiry to **600 seconds (10 minutes)** or your team preference (aligns with app resend cooldown and pending-verification recovery).

**Authentication → URL Configuration**

| Setting | Recommendation |
|---------|----------------|
| Site URL | Project URL is fine for OTP-only |
| Redirect URLs | Keep `luku://reset-password` for password reset only |
| OTP redirect | **Not required** — BFF does not pass `emailRedirectTo` for registration OTP |

## 4. Optional: custom SMTP (Zoho, etc.)

**Project Settings → Authentication → SMTP** (or equivalent)

Use if Supabase default mail is slow or lands in spam. Template variables (`{{ .Token }}`) are unchanged. Works with any inbox provider (Gmail, Zoho, Outlook, etc.).

## 5. Manual verification

1. Start API: `npm run dev:api` from repo root.
2. Mobile: `EXPO_PUBLIC_USE_MOCK_DATA=false`, `EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3001`.
3. Register with a **new** email in the app (Sign up → Verify OTP).
4. Confirm the email subject/body shows a **6-digit code** prominently, not only a link.
5. Enter the code → user reaches onboarding / authenticated session.
6. Test **Resend** after the 60s cooldown.
7. Test wrong/expired code → clear error from the app.
8. Abandon OTP, re-register same email with a new password → new code; verify with updated password.

### curl smoke test

```bash
curl -X POST http://localhost:3001/v1/api/auth/register \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"otp-test@example.com\",\"password\":\"TestPass123!\",\"displayName\":\"OTP Test\"}"
```

Expect HTTP **202** with JSON `requiresVerification: true`. Check inbox for the code.

```bash
curl -X POST http://localhost:3001/v1/api/auth/verify-otp \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"otp-test@example.com\",\"code\":\"123456\"}"
```

Replace `123456` with the code from email; expect **200** with `SessionDto` on success.

## 6. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| Subject “Confirm your signup”, link not code | **Confirm signup** template not updated | Edit **Confirm signup** template; use `{{ .Token }}` (§2) |
| Resend email wrong template | **Magic Link** template not updated | Edit **Magic Link** with same OTP body (§2) |
| Email has link, no code | Template still uses `ConfirmationURL` | Remove link-first copy; use `{{ .Token }}` |
| OTP send fails (JSON error from API) | Missing `SUPABASE_ANON_KEY` on backend | Add to `.env.local`; restart `dev:api` |
| 404 on register | API not running or stale server | Restart `npm run dev:api` |
| Code never arrives | Spam / provider delay | Check spam; configure custom SMTP (§4) |
| “Invalid or expired code” | Wrong code, expired OTP, or typo | Resend; enter within expiry window |
| Re-sign-up, new password fails login | Old bug — backend now updates unconfirmed user on re-register | Pull latest; verify resume flow in [M1_QA_CHECKLIST.md](../team/M1_QA_CHECKLIST.md) |
| Demo seed login broken | Unrelated — seed users are pre-confirmed | Use password login; OTP only affects new registrations |

## Related docs

- [supabase-password-reset.md](./supabase-password-reset.md) — password reset emails (different template)
- [env.md](./env.md) — backend env vars
- [01_MEMBER_AUTH_PROFILE.md](../team/01_MEMBER_AUTH_PROFILE.md) — auth strategy overview
- [M1_QA_CHECKLIST.md](../team/M1_QA_CHECKLIST.md) — full Member 1 manual QA

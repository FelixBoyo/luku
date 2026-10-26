# Supabase password reset setup

Runbook for **email + password** account recovery. OAuth-only users (Google/Apple) have no password to reset.

**BFF flow:** `POST /v1/api/auth/password-reset` → smart routing (see §0) → recovery link or OTP → app handles result.

## 0. Smart routing (BFF)

The API inspects the account before sending mail. Response: `PasswordResetResponseDto` with `delivery: 'reset' | 'otp'`.

| Account state | Backend | Mobile |
|---------------|---------|--------|
| Email not in project | No email sent | Generic “link sent” (`delivery: 'reset'`) — anti-enumeration |
| Unconfirmed | `signInOtp` (6-digit code) | Navigate to **Verify OTP** (`delivery: 'otp'`) |
| Confirmed password user | `resetPasswordForEmail` | “Link on its way” (`delivery: 'reset'`) |

Unverified users need the **Confirm signup** / **Magic Link** OTP templates ([supabase-email-otp.md](./supabase-email-otp.md)), not the reset-password template.

## Prerequisites
Root `.env.local`:

- `SUPABASE_URL`
- `SUPABASE_SERVICE_ROLE_KEY` — `resetPasswordForEmail` via admin client
- `PASSWORD_RESET_REDIRECT_URL=luku://reset-password` (optional; this is the default in code)

## 1. Redirect URL (required)

**Supabase Dashboard → Authentication → URL Configuration → Redirect URLs**

Add:

```text
luku://reset-password
```

Without this allowlist, Supabase may reject the reset request or the link will not redirect correctly.

## 2. Email template

**Authentication → Email Templates → Reset password**

This is a **different** template from OTP sign-up ([supabase-email-otp.md](./supabase-email-otp.md)). Password reset uses a **link**, not an in-app code.

### Subject

```text
Reset your LUKU password
```

### Body (copy-paste)

```html
<h2>Reset your password</h2>
<p>Tap the link below to choose a new password in the LUKU app:</p>
<p><a href="{{ .ConfirmationURL }}">Reset password</a></p>
<p>If you did not request this, you can ignore this email.</p>
<p>This link expires in 24 hours.</p>
```

### Required variable

- `{{ .ConfirmationURL }}` — Supabase builds this from `redirectTo` (`luku://reset-password`) plus recovery token

Do **not** use OTP-only templates here; the mobile app expects a deep link with `access_token` and `type=recovery`.

## 3. Deep link shape

When the user taps the email link on a device with LUKU installed:

```text
luku://reset-password#access_token=<token>&type=recovery&expires_in=3600
```

The app parses `access_token` ([`parseRecoveryToken.ts`](../../apps/mobile/src/lib/parseRecoveryToken.ts)) and opens `PasswordResetScreen` in confirm mode.

## 4. Manual verification

1. Start API: `npm run dev:api`.
2. Use a **confirmed password account** (e.g. seed `dev+buyer@luku.app`).
3. App: Sign in → Forgot password → enter email → “Link on its way”.
4. Open the reset email **on the same device** with LUKU installed.
5. Set a new password → sign in with the new password.

### curl smoke test

```bash
curl -X POST http://localhost:3001/v1/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"dev+buyer@luku.app\"}"
```

Expect HTTP **200** with `{ "delivery": "reset", "email": "..." }`. Check inbox (and spam).

```bash
# Unverified account — expect delivery: "otp" (no recovery link)
curl -X POST http://localhost:3001/v1/api/auth/password-reset \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"pending-signup@example.com\"}"
```
## 5. Troubleshooting

| Symptom | Likely cause | Fix |
|---------|--------------|-----|
| API “Reset failed” | Redirect URL not allowlisted | Add `luku://reset-password` (§1) |
| “Link on its way” but no email | Wrong inbox, spam, or email not in project | Check **Authentication → Users** and **Logs** |
| Link opens browser, not app | Custom scheme not registered | Confirm `scheme: "luku"` in [apps/mobile/app.json](../../apps/mobile/app.json) |
| Token invalid on confirm | Link expired or already used | Request a new reset email |
| OAuth user, no email | No password on account | Use Google/Apple sign-in instead |
| Unverified sign-up account | BFF sends OTP, not recovery link | Forgot password → Verify OTP screen; use Confirm signup template |
| Unknown email | No mail sent; generic success | Expected — no enumeration |

## Related docs

- [supabase-email-otp.md](./supabase-email-otp.md) — sign-up OTP (Confirm signup + Magic Link templates)
- [env.md](./env.md) — `PASSWORD_RESET_REDIRECT_URL`
- [M1_QA_CHECKLIST.md](../team/M1_QA_CHECKLIST.md) — password reset QA row

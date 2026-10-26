# Payments secrets and environment boundaries

This document defines what payment-related configuration can be exposed to the browser and what must remain server-only.

## Environment mode

- Use `PAYMENTS_ENV_MODE` with one of: `test`, `live`.
- Server startup validates payment provider key prefixes and fails fast if:
  - test/live keys are mixed across providers, or
  - `PAYMENTS_ENV_MODE` conflicts with detected key mode.

## Server-only variables

Do not expose these in `VITE_*` variables or in client bundle defines.

- `PAYSTACK_SECRET_KEY`
- `PAYSTACK_WEBHOOK_SECRET`
- `STRIPE_SECRET_KEY`
- `MPESA_API_KEY`
- `MPESA_PASSKEY`
- `MPESA_SHORT_CODE`
- Any provider webhook signing secret/token

## Client-visible variables

Only non-secret, public configuration may be exposed with `VITE_*`.

- `VITE_API_BASE_URL`
- `VITE_STRIPE_PUBLISHABLE_KEY`
- `VITE_PAYSTACK_DEFAULT_CURRENCY`
- `VITE_PAYSTACK_ENABLE_CARDS`
- `VITE_PAYSTACK_ENABLE_APPLE_PAY`
- `VITE_PAYSTACK_ENABLE_MPESA`

## Logging policy for payments and webhooks

- Never log webhook payload bodies.
- Never log card data, phone numbers, API keys, tokens, or webhook secrets.
- Rejection logs should include only sanitized metadata:
  - provider name
  - rejection reason
  - safe reference ID (if available)

## Webhook verification and idempotency

- Paystack webhooks are verified with HMAC SHA512 of the raw body. The key is `PAYSTACK_WEBHOOK_SECRET` if set, otherwise `PAYSTACK_SECRET_KEY` (Paystack signs with the secret key, not a Stripe-style `whsec_`).
- Unverified webhook requests are rejected with `401`.
- Duplicate deliveries are ignored via idempotency keys of `provider:reference`.

## Mobile follow-ups (out of scope)

- Stripe React Native flow:
  - Migrate from web Stripe Elements to Stripe RN SDK payment sheet/intents flow.
- Paystack mobile flow:
  - Define deep-link/browser-return handling for authorization callbacks and app resume.
- Direct M-Pesa callback route:
  - If enabled later, apply the same signature verification + idempotency contract before processing side effects.

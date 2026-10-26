# M-Pesa Kenya (Paystack) — troubleshooting

Paystack’s Charge API for Kenya M-Pesa STK (`mobile_money.provider: "mpesa"`) expects the phone in **E.164 with a leading plus**, e.g. **`+254712345678`**. Sending `254712345678` without `+` returns `Invalid phone number format` (`invalid_params` / `validation_error`).

Internally, LUKU still validates and logs using plain `254` + 9 digits (`core/validation.ts`); only the Paystack request body uses `toPaystackKenyaMpesaChargePhone()`.

## What LUKU sends to Paystack

| User input        | Validated as (internal) | `mobile_money.phone` on wire |
|-------------------|-------------------------|------------------------------|
| `0712345678`      | `254712345678`          | `+254712345678`              |
| `254712345678`    | `254712345678`          | `+254712345678`              |
| `2540712345678`   | `254712345678`          | `+254712345678`              |

Invalid numbers are rejected with **400** and code `MPESA_INVALID_PHONE` (or `VALIDATION_ERROR` on the HTTP validation layer) **before** Paystack is called.

## Paystack sandbox test number

For **test keys** (`sk_test_…`), Paystack documents M-Pesa test MSISDN **`+254 710 000 000`** (no PIN/OTP on sandbox). Use `0710000000` or `254710000000` in the app; the backend sends `+254710000000` to Paystack.

## Direct Paystack diagnostic (bypass LUKU)

Compare wire formats without the app (replace `YOUR_SECRET_KEY`):

```bash
# Fails: Invalid phone number format
curl -X POST https://api.paystack.co/charge \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"email":"you@example.com","currency":"KES","reference":"diag_no_plus","mobile_money":{"phone":"254710000000","provider":"mpesa"}}'

# Succeeds on sandbox with test number
curl -X POST https://api.paystack.co/charge \
  -H "Authorization: Bearer YOUR_SECRET_KEY" \
  -H "Content-Type: application/json" \
  -d '{"amount":10000,"email":"you@example.com","currency":"KES","reference":"diag_plus","mobile_money":{"phone":"+254710000000","provider":"mpesa"}}'
```

If both fail with Paystack’s official test number, check dashboard M-Pesa enablement and key mode—not LUKU formatting.

## Smoke test (local API)

Ensure `PAYSTACK_SECRET_KEY` is set. Restart the API after code/env changes (`npm run dev:api`).

```bash
curl -X POST http://localhost:3001/v1/api/payments/mpesa/stk-push \
  -H "Content-Type: application/json" \
  -d "{\"amount\":100,\"phoneNumber\":\"0710000000\",\"metadata\":{\"email\":\"you@example.com\"}}"
```

- **201** / pending or `pay_offline` → charge accepted (sandbox may auto-success for test MSISDN).
- **400** `MPESA_INVALID_PHONE` with Paystack text → see logs (`phoneLast4`, `requestId`).
- **400** `MPESA_UNPROCESSED` → real Safaricom number on **test** keys; use `0710000000` in sandbox or switch to live keys.

## Going live (no code change)

1. In `.env.local` (or production secrets), set `PAYSTACK_SECRET_KEY` and `PAYSTACK_PUBLIC_KEY` to **`sk_live_…`** / **`pk_live_…`**.
2. Optionally set `PAYMENTS_ENV_MODE=live`. Restart `npm run dev:api` (or redeploy). [`validatePaymentsEnvironment`](../../backend/payments/configValidator.ts) rejects mixed test/live keys.
3. Paystack Dashboard (live): enable and activate **M-Pesa (Kenya)** for the business.
4. Register **`POST /webhooks/paystack`** on a public HTTPS URL. Paystack signs with your **secret key** (`sk_test_…` / `sk_live_…`); `PAYSTACK_WEBHOOK_SECRET` is optional and defaults to `PAYSTACK_SECRET_KEY`.
5. **Test vs live:** test mode only simulates M-Pesa success reliably for **`+254710000000`**. Real STK prompts on handsets require live keys and a registered Safaricom MSISDN.

### Webhooks and polling (current state)

- **Webhook:** [`backend/handlers/webhooks/paystack.ts`](../../backend/handlers/webhooks/paystack.ts) verifies HMAC SHA512, deduplicates per event (`charge.success` keys stay `paystack:<ref>`; `transfer.*` / `refund.processed` use `paystack:<event>:<ref>`), then `charge.success` walks the order `paid → in_escrow`. Keep poll as backup (Paystack recommends verify on slow paths).
- **Local:** `ngrok config add-authtoken <token>` once, then `npm run dev:api` and `npm run tunnel:api`. In Paystack → Settings → API Keys & Webhooks, set **Test Webhook URL** (`sk_test_`) or **Live Webhook URL** (`sk_live_`) to `https://<subdomain>.ngrok-free.app/webhooks/paystack` (no trailing slash). Free ngrok URLs change on every tunnel restart — update the dashboard if that happens. If Paystack shows HTML and no API log, the free browser interstitial is in the way (reserved domain or Cloudflare Tunnel).
- **Polling:** Mobile checkout polls [`GET /v1/api/payments/mpesa/requests/:id`](../../backend/handlers/payments/mpesa/status.ts) via `waitForMpesaSuccess` for up to ~3 minutes while the customer approves STK.

## Paystack dashboard

1. Enable **M-Pesa (Kenya)** for the business on Paystack.
2. Use **test** secret key with test mode and **live** key only in production.
3. If direct curl with `+254710000000` works but real numbers fail, use a registered Safaricom line; test keys still simulate STK for the documented test MSISDN.

## Mobile checkout

Cart M-Pesa field accepts `07XX…` or `2547XX…`. Use a **real** Safaricom number in live mode; in test mode prefer Paystack’s `0710000000` test line.

## Payments Integration Checklist & Guidelines

This checklist helps the LUKU team consistently implement and maintain third-party payment integrations (Stripe, M-Pesa, future gateways).

Use it when:
- Adding a new payment gateway.
- Modifying existing payment flows.
- Reviewing PRs that touch payments or external payment APIs.

---

### 1. Configuration & Secrets

- **Config entries**
  - [ ] Add/update configuration in `services/integrationConfig.ts` (non-secret fields only).
  - [ ] Ensure `validateIntegrationConfig` and `getServiceStatus` reflect the new service.

- **Environment variables**
  - [ ] Define required backend environment variables (secret keys, webhook secrets, etc.).
  - [ ] Verify that **no secret keys** are referenced from frontend-only code paths.
  - [ ] Document required env vars in:
    - `BACKEND_PAYMENTS_API.md`
    - Any relevant infrastructure/environment docs.

---

### 2. Backend API & Webhooks

- **Endpoints**
  - [ ] For each gateway, define clear backend REST contracts (see `BACKEND_PAYMENTS_API.md`):
    - Stripe: `POST /api/payments/stripe/intents`, `GET /api/payments/stripe/intents/:id`, `POST /webhooks/stripe`.
    - M-Pesa: `POST /api/payments/mpesa/stk-push`, `GET /api/payments/mpesa/requests/:id`, `POST /webhooks/mpesa/callback`.
  - [ ] Ensure all endpoints:
    - Validate inputs (amount, currency, phone number, metadata).
    - Return structured error payloads (`{ error: { code, message } }`).

- **Webhooks**
  - [ ] Verify signature using gateway-specific libraries (e.g. `STRIPE_WEBHOOK_SECRET`).
  - [ ] Implement idempotency (e.g. `processed_webhook_events` table keyed by event ID).
  - [ ] Map external events to internal order/payment states (e.g. call `create_order_with_stock_check`).

---

### 3. Frontend Services & Error Handling

- **Service layer**
  - [ ] Wrap external calls in a dedicated service module (`stripeService.ts`, `mpesaService.ts`, etc.).
  - [ ] Use `withRetry` from `services/retryHandler.ts` for network calls to your backend.
  - [ ] Use `errorLogger` and `integrationManager.recordRequest` for all success/failure paths.
  - [ ] Provide convenience functions:
    - Stripe: `initializeStripe`, `createPaymentIntent`, `confirmPayment`, `retrievePaymentIntent`.
    - M-Pesa: `isMpesaAvailable`, `startMpesaCheckout`, `getMpesaPaymentStatus`.

- **User-facing errors**
  - [ ] Map gateway error codes to **user-friendly messages** in UI components:
    - Card declined, expired card, incorrect CVC, insufficient funds, processing errors, etc.
  - [ ] Avoid leaking raw technical messages to users while still logging detailed errors for debugging.

---

### 4. UI & UX Flows

- **Payment method selection**
  - [ ] Offer a clear choice when multiple methods are available (e.g. card vs M-Pesa).
  - [ ] Hide or disable unavailable methods based on `IntegrationConfig` flags.

- **Stripe flows**
  - [ ] Initialize Stripe once per checkout session (`initializeStripe`).
  - [ ] Create **one** payment intent per session and reuse its `clientSecret`.
  - [ ] Use `<Elements>` + `<PaymentElement>` with the same `clientSecret` used in `confirmPayment`.
  - [ ] Show loading/progress states while initializing or confirming payments.

- **M-Pesa flows**
  - [ ] Validate phone numbers (basic digit length / format checks).
  - [ ] See [M-Pesa Kenya troubleshooting](./mpesa-kenya-troubleshooting.md) for MSISDN format, curl smoke test, and Paystack dashboard checks.
  - [ ] Show clear instructions: “Check your phone and approve the M-Pesa prompt.”
  - [ ] Poll status via `getMpesaPaymentStatus` with a reasonable timeout.
  - [ ] Surface distinct states: waiting, success, failure/cancelled, timeout.

---

### 5. Monitoring, Metrics & Alerts

- **Integration Manager**
  - [ ] Add new service name to `ServiceName` in `services/integrationManager.ts`.
  - [ ] Initialize health and metrics maps for the new service.
  - [ ] Implement a basic health check method (and extend later as needed).
  - [ ] Ensure `checkAllServicesHealth` includes the new service.

- **Integration Monitor UI**
  - [ ] Add the service to the `services` list in `components/IntegrationMonitor.tsx`.
  - [ ] Verify metrics and error stats render correctly for the new service.

- **Backend metrics (observability stack)**
  - [ ] Expose counters/histograms (e.g. `payments_requests_total`, `payments_failures_total`, `payments_amount_sum`).
  - [ ] Define SLOs per gateway (success rate, p95 latency).
  - [ ] Configure alerting rules for:
    - Sustained failure spikes.
    - Full outage (all requests failing).
    - Webhook processing failures.

---

### 6. Security & Compliance

- [ ] Keep all card data handling within Stripe Elements / Stripe.js only.
- [ ] Never log full card numbers, full phone numbers, or other sensitive data.
- [ ] Mask identifiers when logging (e.g. last 4 digits only).
- [ ] Use HTTPS for all payment-related endpoints and webhooks.
- [ ] Document PCI-DSS responsibility boundaries (Stripe as PCI Level 1 provider; app does not handle raw card data).

---

### 7. Testing Strategy

- **Unit tests**
  - [ ] Service modules (`stripeService`, `mpesaService`) with mocked `fetch`/SDK calls.
  - [ ] Error mapping helpers (ensure correct user-friendly messages).

- **Integration / E2E tests**
  - [ ] Happy-path Stripe card payment in checkout (single item + multi-item).
  - [ ] Common failure paths: card declined, insufficient funds, network timeouts.
  - [ ] M-Pesa STK push start + callback handling in staging or sandbox.

- **Resilience tests**
  - [ ] Simulate gateway downtime (return 5xx from mocked backend).
  - [ ] Verify UI degradation and error messaging.
  - [ ] Confirm that alerts fire in monitoring stack when thresholds are breached.

---

### 8. Review Before Merge

Before merging any payment integration PR:

- [ ] Checklist items above have been reviewed.
- [ ] New or changed contracts are reflected in:
  - `BACKEND_PAYMENTS_API.md`
  - `INTEGRATION_GUIDE.md` / `INTEGRATION_SUMMARY.md` if relevant.
- [ ] Manual tests completed in a staging environment with sandbox credentials.


# LUKU Security Threat Model (Baseline)

## Scope

This baseline covers:

- Supabase auth and session handling
- Payment endpoints and Paystack webhook flow
- File upload entry points in `components/FileUpload.tsx` and `components/ProductImageUpload.tsx`
- Gemini API usage in `services/geminiService.ts`
- Seller KYC data in `store/slices/sellerKycSlice.ts` and `components/SellerKycForm.tsx`

## System Boundaries and Trust Zones

- Browser client (React + Redux) is untrusted.
- Backend payment routes (`/api`, `/backend`) are trusted but internet-facing.
- Supabase (Postgres + Storage + Auth) is a trusted third-party boundary.
- Payment providers (Paystack/M-Pesa/Stripe) and Gemini are external trusted dependencies with separate risk.

## Assets

- User identity/session tokens
- Payment references and transaction metadata
- Uploaded images and generated images
- Seller KYC PII (legal name, phone, address, DOB, ID metadata)
- API secrets (`PAYSTACK_SECRET_KEY`, webhook secret, Gemini keys)

## Threats and Controls by Area

### 1) Auth (Supabase) and Session Storage

**Threats**

- XSS can access browser-managed sessions.
- Broken RLS can expose cross-tenant data.
- Accidental logging of user/session identifiers.

**Current posture**

- Auth user context is read client-side via Supabase auth.
- Security depends on Supabase RLS correctness for each table.

**Baseline controls**

- Enforce RLS on all app tables and storage objects.
- Prevent token/session logging in frontend and backend code paths.
- Keep secret/service-role credentials out of browser code.
- Strengthen XSS defenses (strict CSP, sanitize user-generated HTML if introduced).

### 2) Payment Endpoints and Webhooks

**Threats**

- Forged webhook requests.
- Replay/duplicate webhooks.
- Leaking provider/internal errors to clients.
- Sensitive log leakage from payment failures.

**Current posture**

- Webhook signature verification uses HMAC SHA512 and timing-safe comparison.
- Webhook idempotency store exists and duplicate events are ignored.
- Backend routes are rate-limited.

**Baseline controls**

- Keep webhook signature checks mandatory with fail-closed behavior.
- Keep idempotency keys stable and replay-safe.
- Return generic 5xx errors; avoid passing provider/raw error details to clients.
- Redact sensitive fields in logs for payment and auth paths.

### 3) File Uploads

**Threats**

- Upload of oversized files or unsupported mime types.
- Malicious content with disguised extensions.
- Sensitive image data exposure via public URLs.

**Current posture**

- Upload entry points are client-side and use `FileReader`.
- Storage helpers publish URLs from `product-images`/`business-assets`.

**Baseline controls**

- Validate file type and size on both client and server/storage policy boundary.
- Restrict storage paths by authenticated owner prefix.
- Use private buckets and signed URLs for non-public assets.
- Avoid logging file payloads or base64 image contents.

### 4) AI Endpoints Calling Gemini

**Threats**

- Prompt injection and untrusted instructions.
- Sending sensitive user images/PII to third-party model APIs.
- API key exposure if key is configured via `VITE_*`.

**Current posture**

- Gemini calls are invoked from frontend service code.
- Prompt and image payloads can include user content.

**Baseline controls**

- Move Gemini calls to server-only endpoints when possible.
- Classify and minimize data sent to Gemini; avoid KYC/financial payloads.
- Do not log prompts, image payloads, or model responses containing user data.
- Apply rate limiting and abuse controls on server-side AI routes.

### 5) Seller KYC Data

**Threats**

- Cross-user data access from weak policies.
- Overexposure of PII in logs or analytics.
- Retention without clear lifecycle.

**Current posture**

- KYC data is read/upserted from client via Supabase table `seller_kyc`.
- Form captures legal name, phone, address, and optional identity attributes.

**Baseline controls**

- Strict owner-only RLS (`auth.uid() = user_id`) for `seller_kyc`.
- Mask or redact KYC fields in all logs and error telemetry.
- Define retention and deletion policy for KYC records.
- Limit who can read KYC for operations/admin use cases.

## Cross-Cutting Security Requirements

- Never log API keys, tokens, webhook signatures, card-like strings, phone numbers, or raw webhook bodies.
- Keep server code free of browser globals and client components free of Node-only APIs.
- Keep payment business logic unchanged without payments-team coordination.
- Add/maintain tests for all security-sensitive utility logic (redaction, validation, auth checks).

## Residual Risks / Follow-ups

- Gemini traffic now routes through server proxy; add auth/session binding to `/api/ai/gemini/generate-content` before production rollout.
- Storage bucket policies must be audited alongside table RLS (object-level access).
- A formal incident response/runbook is still needed for payment webhook failures and suspicious traffic.

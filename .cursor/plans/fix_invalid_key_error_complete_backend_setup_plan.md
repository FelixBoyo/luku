# Fix Invalid Key Error - Complete Backend Setup Plan

## Problem Summary

The "Invalid key" error occurs because Paystack's `transaction/initialize` endpoint **requires a secret key**, not a public key. The frontend services (`paystackService.ts` and `mpesaService.ts`) are currently calling Paystack API directly using public keys, which Paystack rejects.

**Root Cause:**
- Paystack's `transaction/initialize` endpoint requires `Authorization: Bearer SECRET_KEY`
- Public keys (`pk_...`) cannot be used for direct API calls to `transaction/initialize`
- Secret keys (`sk_...`) must NEVER be exposed in frontend code
- A backend proxy is required to securely handle Paystack API calls

## Current State

**Backend:**
- ✅ `backend/server.ts` exists with Express.js setup
- ✅ Has `/api/payments/config` endpoint
- ✅ Has `/api/payments/paystack/charges` endpoint
- ❌ Missing `/api/payments/mpesa/stk-push` endpoint
- ❌ Missing `/api/payments/mpesa/requests/:id` endpoint
- ✅ Has `/webhooks/paystack` endpoint

**Frontend:**
- ❌ `paystackService.ts` calls Paystack API directly (causing "Invalid key" error)
- ❌ `mpesaService.ts` calls Paystack API directly (will cause "Invalid key" error)
- ✅ `paymentsConfigService.ts` has fallback to env vars (works)

## Solution

Update frontend services to call backend proxy endpoints instead of Paystack API directly. Complete the backend server with missing M-Pesa endpoints.

## Implementation Tasks

### 1. Update paystackService.ts to use backend proxy

**File:** `[services/paystackService.ts](services/paystackService.ts)`

**Change:** Revert `createPaystackCharge` to call `/api/payments/paystack/charges` backend endpoint instead of direct Paystack API.

**Current (broken):**
```typescript
const response = await fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    headers: { Authorization: `Bearer ${paystackPublicKey}` },
    // ...
});
```

**New (fixed):**
```typescript
const response = await fetch('/api/payments/paystack/charges', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
});
```

**Rationale:** Backend proxy will use secret key securely, frontend only sends payment request.

---

### 2. Update mpesaService.ts to use backend proxy

**File:** `[services/mpesaService.ts](services/mpesaService.ts)`

**Change:** Update `startMpesaCheckout` to call `/api/payments/mpesa/stk-push` backend endpoint instead of direct Paystack API.

**Current (broken):**
```typescript
return fetch(`${PAYSTACK_BASE_URL}/transaction/initialize`, {
    headers: { Authorization: `Bearer ${paystackPublicKey}` },
    // ...
});
```

**New (fixed):**
```typescript
return fetch('/api/payments/mpesa/stk-push', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
});
```

**Change:** Update `getMpesaPaymentStatus` to call `/api/payments/mpesa/requests/:id` backend endpoint instead of direct Paystack API.

**Current (broken):**
```typescript
return fetch(`${PAYSTACK_BASE_URL}/transaction/verify/${paymentRequestId}`, {
    headers: { Authorization: `Bearer ${paystackPublicKey}` },
});
```

**New (fixed):**
```typescript
return fetch(`/api/payments/mpesa/requests/${paymentRequestId}`, {
    method: 'GET',
    headers: { 'Content-Type': 'application/json' },
});
```

**Rationale:** Backend proxy handles secret key authentication securely.

---

### 3. Add M-Pesa endpoints to backend server

**File:** `[backend/server.ts](backend/server.ts)`

**Add missing endpoints:**

1. **POST /api/payments/mpesa/stk-push**
   ```typescript
   import { startPaystackMpesaCheckout } from '../api/payments/mpesa/stk-push';
   
   app.post('/api/payments/mpesa/stk-push', async (req, res) => {
       try {
           const result = await startPaystackMpesaCheckout(req.body);
           res.status(201).json(result);
       } catch (error: any) {
           console.error('M-Pesa STK push error', error);
           res.status(500).json({
               error: {
                   code: 'MPESA_STK_PUSH_FAILED',
                   message: error.message || 'Unable to start M-Pesa payment.',
               },
           });
       }
   });
   ```

2. **GET /api/payments/mpesa/requests/:id**
   ```typescript
   import { getPaystackMpesaStatus } from '../api/payments/mpesa/status';
   
   app.get('/api/payments/mpesa/requests/:id', async (req, res) => {
       try {
           const result = await getPaystackMpesaStatus(req.params.id);
           res.json(result);
       } catch (error: any) {
           console.error('M-Pesa status error', error);
           res.status(500).json({
               error: {
                   code: 'MPESA_STATUS_FETCH_FAILED',
                   message: error.message || 'Unable to fetch payment status.',
               },
           });
       }
   });
   ```

**Rationale:** Complete the backend API so frontend can call all Paystack endpoints through secure proxy.

---

### 4. Update backend server CORS configuration

**File:** `[backend/server.ts](backend/server.ts)`

**Current:**
```typescript
app.use(cors({
    origin: process.env.VITE_APP_URL || 'http://localhost:3000',
    credentials: true,
}));
```

**Update:** Ensure CORS allows requests from Vite dev server (typically `http://localhost:5173`):
```typescript
app.use(cors({
    origin: [
        process.env.VITE_APP_URL || 'http://localhost:5173',
        'http://localhost:5173', // Vite default
        'http://localhost:3000', // Alternative
    ],
    credentials: true,
}));
```

**Rationale:** Frontend runs on Vite dev server (port 5173), backend needs to accept requests from it.

---

### 5. Configure backend environment variables

**File:** `[backend/.env](backend/.env)` (create if doesn't exist) or use `.env.local` at root

**Required variables:**
```bash
PAYSTACK_SECRET_KEY=sk_test_9ff685c50c206e8d9eaddc7644b04adaf9450d5b
PAYSTACK_WEBHOOK_SECRET=whsec_... # Get from Paystack dashboard
APP_URL=http://localhost:5173
PORT=3001
```

**Note:** Backend should read from `.env.local` at project root (already configured in `server.ts`).

---

### 6. Update frontend API base URL configuration

**Files:** `[services/paystackService.ts](services/paystackService.ts)`, `[services/mpesaService.ts](services/mpesaService.ts)`

**Consideration:** Frontend fetch calls use relative URLs (`/api/...`). This works if:
- Backend is proxied through Vite dev server, OR
- Backend runs on same origin, OR
- Frontend uses absolute URL with backend base URL

**Option A:** Use Vite proxy (recommended for development)
- Add proxy config to `vite.config.ts`

**Option B:** Use absolute URLs with environment variable
- Add `VITE_API_BASE_URL` to `.env.local`
- Update fetch calls to use `${VITE_API_BASE_URL}/api/...`

**Recommendation:** Use Vite proxy for development, absolute URLs for production.

---

### 7. Add Vite proxy configuration (Optional but Recommended)

**File:** `[vite.config.ts](vite.config.ts)`

**Add proxy configuration:**
```typescript
export default defineConfig({
    // ... existing config
    server: {
        proxy: {
            '/api': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
            '/webhooks': {
                target: 'http://localhost:3001',
                changeOrigin: true,
            },
        },
    },
});
```

**Rationale:** Allows frontend to call `/api/...` URLs which get proxied to backend server, avoiding CORS issues.

---

### 8. Update backend server to handle raw body for webhooks

**File:** `[backend/server.ts](backend/server.ts)`

**Current:** Webhook endpoint uses `express.raw({ type: 'application/json' })` which is correct.

**Verify:** Ensure webhook endpoint is configured correctly for signature verification.

---

## Testing Checklist

After implementation:

- [ ] Start backend server: `cd backend && npm run dev`
- [ ] Verify backend is running on `http://localhost:3001`
- [ ] Test `/api/payments/config` endpoint returns correct config
- [ ] Test Paystack card payment in checkout (should not show "Invalid key" error)
- [ ] Test Paystack Apple Pay payment (should not show "Invalid key" error)
- [ ] Test M-Pesa payment initiation (should not show "Invalid key" error)
- [ ] Test M-Pesa status polling (should work)
- [ ] Verify backend logs show Paystack API calls with secret key
- [ ] Verify no secret keys are exposed in browser network tab
- [ ] Test webhook endpoint (when Paystack sends events)

## Deployment Notes

**Development:**
- Run backend: `cd backend && npm run dev` (port 3001)
- Run frontend: `npm run dev` (port 5173)
- Frontend calls `/api/...` which Vite proxies to backend

**Production:**
- Deploy backend to hosting service (Vercel, Railway, Render, etc.)
- Set `VITE_API_BASE_URL` environment variable to backend URL
- Update frontend fetch calls to use `${VITE_API_BASE_URL}/api/...`
- Configure Paystack webhook URL to point to production backend

## Security Reminders

- ✅ Secret keys only in backend environment variables
- ✅ Never expose `PAYSTACK_SECRET_KEY` in frontend code
- ✅ Backend validates requests before forwarding to Paystack
- ✅ Webhook signature verification uses secret key (backend only)
- ✅ CORS configured to allow only frontend origin

## Files to Modify

1. `services/paystackService.ts` - Revert to backend proxy
2. `services/mpesaService.ts` - Update to use backend proxy
3. `backend/server.ts` - Add missing M-Pesa endpoints
4. `vite.config.ts` - Add proxy configuration (optional)
5. `.env.local` - Ensure `PAYSTACK_SECRET_KEY` is set (backend will read this)

## Notes

- The backend server already exists and has the structure - we just need to complete it
- Backend handlers are already implemented in `api/` directory - just need to wire them up
- Frontend services need to be reverted from direct Paystack calls to backend proxy calls
- This approach maintains security (secret keys stay on backend) while allowing frontend to initiate payments

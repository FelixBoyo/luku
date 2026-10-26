# Paystack Frontend Integration Guide

This document describes the frontend-only Paystack integration approach used in LUKU.

## Architecture Overview

LUKU uses a **frontend-only approach** for Paystack payment initiation, calling Paystack API directly from the browser using public keys. This eliminates the need for backend proxy endpoints for payment initiation.

## What Works from Frontend

### Payment Initiation (Frontend Direct Calls)

All payment methods are initiated directly from the frontend:

1. **M-Pesa Payments** (`services/mpesaService.ts`)
   - Calls `POST https://api.paystack.co/transaction/initialize` directly
   - Uses `VITE_PAYSTACK_PUBLIC_KEY` for authentication
   - Handles mobile money channel with M-Pesa provider

2. **Card Payments** (`services/paystackService.ts`)
   - Calls `POST https://api.paystack.co/transaction/initialize` directly
   - Uses `VITE_PAYSTACK_PUBLIC_KEY` for authentication
   - Supports card and Apple Pay channels

3. **Payment Status Verification** (`services/mpesaService.ts`)
   - Calls `GET https://api.paystack.co/transaction/verify/:reference` directly
   - Uses public key for verification

4. **Payment Configuration** (`services/paymentsConfigService.ts`)
   - Reads from environment variables (`VITE_PAYSTACK_ENABLE_*`)
   - Optionally fetches from backend if available

## What Requires Backend

### Webhooks (MUST be Backend)

**Critical:** Webhooks **MUST** be handled by a backend service because:

1. **Secret Key Required:** Webhook signature verification requires the Paystack secret key
2. **Security:** Secret keys cannot be exposed in frontend code
3. **Reliability:** Webhooks are the authoritative source for payment confirmations

**Required Backend Endpoint:**
- `POST /webhooks/paystack` - Handle Paystack webhook events

**Implementation:** See `api/webhooks/paystack.ts` for reference implementation.

**Webhook Events to Handle:**
- `charge.success` - Payment confirmed
- `charge.failed` - Payment failed
- `transfer.success` - Refund/transfer completed

## Environment Variables

### Frontend (`.env.local`)

```bash
# Paystack Configuration
VITE_PAYSTACK_ENABLE_CARDS=true
VITE_PAYSTACK_ENABLE_APPLE_PAY=true
VITE_PAYSTACK_ENABLE_MPESA=true
VITE_PAYSTACK_PUBLIC_KEY=pk_test_...
VITE_PAYSTACK_DEFAULT_CURRENCY=USD
```

### Backend (for webhooks only)

```bash
PAYSTACK_SECRET_KEY=sk_test_...
# Optional; defaults to PAYSTACK_SECRET_KEY (Paystack signs with the secret key)
# PAYSTACK_WEBHOOK_SECRET=
```

## Security Considerations

### Public Key Usage

- ✅ **Safe for frontend:** Public keys (`pk_test_...` or `pk_live_...`) can be exposed in frontend code
- ✅ **Limited permissions:** Public keys can only initiate transactions, not access sensitive data
- ⚠️ **Limitations:** Some Paystack operations may require secret keys

### Secret Key Protection

- ❌ **Never expose in frontend:** Secret keys (`sk_test_...` or `sk_live_...`) must NEVER be in frontend code
- ✅ **Backend only:** Secret keys should only be used in backend services
- ✅ **Webhook verification:** Secret keys are required for webhook signature verification

## Payment Flow

### M-Pesa Flow

1. User enters phone number and clicks "Pay with M-Pesa"
2. Frontend calls `startMpesaCheckout()` in `mpesaService.ts`
3. Service calls Paystack `transaction/initialize` API directly
4. Paystack sends STK push to user's phone
5. Frontend polls `transaction/verify` endpoint for status
6. Backend webhook receives `charge.success` event (authoritative confirmation)
7. Backend updates order status in database

### Card/Apple Pay Flow

1. User selects payment method and clicks pay button
2. Frontend calls `createPaystackCharge()` in `paystackService.ts`
3. Service calls Paystack `transaction/initialize` API directly
4. If `authorization_url` returned → redirect user to Paystack checkout
5. User completes payment on Paystack page
6. Backend webhook receives `charge.success` event
7. Backend updates order status in database

## Error Handling

All Paystack API calls include:
- Retry logic for network errors
- Error message extraction from Paystack responses
- User-friendly error messages
- Integration logging for monitoring

## Testing

### Test Mode

Use test keys (`pk_test_...` and `sk_test_...`) for development:
- Test transactions don't involve real money
- Test webhooks can be configured in Paystack dashboard
- Test phone numbers: Use Paystack test numbers for M-Pesa

### Live Mode

For production:
- Use live keys (`pk_live_...` and `sk_live_...`)
- Configure live webhook URL in Paystack dashboard
- Ensure webhook endpoint is publicly accessible (HTTPS required)

## Limitations

1. **Webhook Requirement:** While payment initiation is frontend-only, webhooks still require backend for reliable payment confirmation
2. **Public Key Restrictions:** Some Paystack features may require secret keys
3. **CORS:** Paystack API should allow CORS for frontend calls (verify if issues occur)

## Migration Notes

If you need to add backend support later:

1. The frontend code is already structured to work with or without backend
2. Backend endpoints can be added incrementally
3. Webhook endpoint is the only critical backend requirement
4. See `api/` directory for backend implementation examples

## References

- Paystack API Documentation: https://paystack.com/docs/api/
- Paystack Transaction API: https://paystack.com/docs/api/transaction
- Paystack Webhooks: https://paystack.com/docs/payments/webhooks

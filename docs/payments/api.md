## Payments Backend API & Webhook Spec

This document defines the **backend contracts and reference implementation** for Stripe (and, in a later phase, M‑Pesa) that the LUKU frontend already expects.

It is framework‑agnostic but the examples use **TypeScript + Express** for clarity. You can adapt the same shapes to Next.js API routes, NestJS controllers, Supabase Edge Functions, etc.

> The frontend never uses secret keys. All calls below are **server-only**.

---

### Environment Variables (Backend)

- `STRIPE_SECRET_KEY` – Stripe secret key (live or test).
- `STRIPE_WEBHOOK_SECRET` – Stripe webhook signing secret for payment intent events.

Optional (but recommended):

- `PAYMENTS_LOG_LEVEL` – e.g. `info | warn | error`.
- `PAYMENTS_ENV` – `development | staging | production`.

---

## 1. Stripe Payment Intents API

### 1.1 `POST /api/payments/stripe/intents`

**Purpose**

Create a Stripe Payment Intent for a given cart/order and return the `client_secret` that the frontend uses with Stripe Elements.

**Request (JSON body)**

```json
{
  "amount": 1299,
  "currency": "usd",
  "metadata": {
    "product_id": "prod_123",
    "quantity": "2",
    "buyer_id": "user-uuid",
    "order_reference": "optional-app-side-reference"
  }
}
```

- `amount` – integer, smallest currency unit (e.g. cents).
- `currency` – ISO currency code, e.g. `usd`, `kes`.
- `metadata` – arbitrary key/value map (all string values) used later in analytics / reconciliation.

**Response – success (HTTP 201)**

```json
{
  "clientSecret": "pi_12345_secret_67890",
  "paymentIntentId": "pi_12345"
}
```

**Response – error (HTTP 4xx/5xx)**

```json
{
  "error": {
    "code": "PAYMENT_INTENT_CREATION_FAILED",
    "message": "Unable to create payment intent",
    "details": "Human-readable description, safe to log"
  }
}
```

**Reference implementation (Express, TypeScript)**

```ts
import type { Request, Response } from 'express';
import Stripe from 'stripe';

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
  apiVersion: '2024-11-20.acacia'
});

export const createStripePaymentIntent = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'usd', metadata = {} } = req.body as {
      amount: number;
      currency?: string;
      metadata?: Record<string, string>;
    };

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive integer in the smallest currency unit.'
        }
      });
    }

    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency,
      metadata,
      automatic_payment_methods: { enabled: true }
    });

    return res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id
    });
  } catch (error: any) {
    console.error('Stripe create payment intent error', error);

    return res.status(500).json({
      error: {
        code: 'PAYMENT_INTENT_CREATION_FAILED',
        message: 'Unable to create payment intent. Please try again.',
        details: process.env.PAYMENTS_ENV === 'development' ? error.message : undefined
      }
    });
  }
};
```

---

### 1.2 `GET /api/payments/stripe/intents/:id`

**Purpose**

Fetch the current status of a Stripe Payment Intent, primarily for reconciliation or defensive UI polling in edge cases.

**Path params**

- `:id` – Stripe Payment Intent ID (e.g. `pi_12345`).

**Response – success (HTTP 200)**

```json
{
  "id": "pi_12345",
  "status": "succeeded",
  "amount": 1299,
  "currency": "usd",
  "metadata": {
    "product_id": "prod_123",
    "quantity": "2"
  }
}
```

**Reference implementation (Express, TypeScript)**

```ts
export const getStripePaymentIntent = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    if (!id) {
      return res.status(400).json({
        error: { code: 'MISSING_ID', message: 'Payment intent ID is required.' }
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(id);

    return res.status(200).json({
      id: paymentIntent.id,
      status: paymentIntent.status,
      amount: paymentIntent.amount,
      currency: paymentIntent.currency,
      metadata: paymentIntent.metadata
    });
  } catch (error: any) {
    console.error('Stripe get payment intent error', error);

    return res.status(500).json({
      error: {
        code: 'PAYMENT_INTENT_RETRIEVE_FAILED',
        message: 'Unable to retrieve payment intent.',
        details: process.env.PAYMENTS_ENV === 'development' ? error.message : undefined
      }
    });
  }
};
```

---

## 2. Stripe Webhook Handler

### 2.1 `POST /webhooks/stripe`

**Purpose**

Receive asynchronous events from Stripe (e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`) and update the LUKU domain state (orders, analytics, etc.) accordingly.

> This endpoint must **not** be behind JSON body-parsers that modify the raw body before signature verification. Configure your framework to give you the raw request body for this route.

**Important events**

- `payment_intent.succeeded` – treat as an authoritative confirmation that payment is captured/confirmed.
- `payment_intent.payment_failed` – permanent failure.
- `charge.refunded` – used for refunds/reconciliation.

**High-level flow**

1. Verify Stripe signature with `STRIPE_WEBHOOK_SECRET`.
2. Switch on `event.type`:
   - Map Stripe `payment_intent.id` to your internal order(s) or session using metadata (e.g. product ID, buyer ID).
   - For `succeeded`, mark the order as **paid / confirmed** and, if applicable, trigger Supabase `create_order_with_stock_check`.
   - For `payment_failed`, update order/payment records accordingly and surface a user-friendly message next time the UI queries order status.
3. Ensure idempotency:
   - Store `event.id` in a `processed_webhook_events` table (or equivalent) and skip any duplicate events.

**Reference implementation (Express, TypeScript)**

```ts
import type { Request, Response } from 'express';
import Stripe from 'stripe';

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET as string;

export const stripeWebhookHandler = async (req: Request, res: Response) => {
  const sig = req.headers['stripe-signature'] as string | undefined;

  if (!sig || !webhookSecret) {
    return res.status(400).send('Missing Stripe signature or webhook secret.');
  }

  let event: Stripe.Event;

  try {
    // req.body here must be the raw Buffer, not parsed JSON
    event = new Stripe(process.env.STRIPE_SECRET_KEY as string, {
      apiVersion: '2024-11-20.acacia'
    }).webhooks.constructEvent(req.body, sig, webhookSecret);
  } catch (err: any) {
    console.error('Stripe webhook signature verification failed', err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  try {
    // Idempotency: check if event.id already processed in your DB
    // if (await hasProcessedStripeEvent(event.id)) return res.status(200).send('OK');

    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Example mapping (pseudo-code):
        // const orderId = paymentIntent.metadata.order_id;
        // await markOrderAsPaid(orderId, paymentIntent.id, paymentIntent.amount_received);

        break;
      }
      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;

        // Example:
        // const orderId = paymentIntent.metadata.order_id;
        // await markOrderAsFailed(orderId, paymentIntent.last_payment_error?.message);

        break;
      }
      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;

        // Example:
        // const orderId = charge.metadata.order_id;
        // await markOrderAsRefunded(orderId, charge.amount_refunded);

        break;
      }
      default:
        // Optionally log unhandled events for later expansion
        console.log(`Unhandled Stripe event type: ${event.type}`);
    }

    // await recordProcessedStripeEvent(event.id);
    return res.status(200).send('OK');
  } catch (error: any) {
    console.error('Error handling Stripe webhook event', event.id, error);
    // Let Stripe retry on 5xx
    return res.status(500).send('Webhook handler error');
  }
};
```

---

## 3. Frontend Contracts (What LUKU Already Expects)

The existing frontend code in `services/stripeService.ts` and checkout components will be wired to:

- `POST /api/payments/stripe/intents` for creating payment intents.
- `GET /api/payments/stripe/intents/:id` for defensive status checks (optional).

The shapes above are intentionally simple, so that:

- The **frontend remains unchanged** other than the base URL it calls.
- Backend teams can evolve the internal order/payment schema independently as long as these HTTP contracts remain stable.

This file should be kept in sync with any changes to:

- `services/stripeService.ts`
- `components/Checkout.tsx`
- `components/MultiItemCheckout.tsx`

---

## 4. M-Pesa Backend Endpoints (for mpesaService)

The frontend `services/mpesaService.ts` expects the following backend contracts for M-Pesa STK push payments:

### 4.1 `POST /api/payments/mpesa/stk-push`

**Request (JSON body)**

```json
{
  "amount": 1299,
  "phoneNumber": "254712345678",
  "accountReference": "prod_123",
  "metadata": {
    "product_id": "prod_123",
    "quantity": "2"
  }
}
```

**Response – success (HTTP 201/200)**

```json
{
  "paymentRequestId": "mpesa-req-uuid-or-id",
  "mpesaReference": "SafaricomReferenceIfAvailable",
  "status": "PENDING",
  "customerMessage": "A payment prompt has been sent to your phone. Please enter your PIN to approve."
}
```

**Response – error**

```json
{
  "error": {
    "code": "MPESA_STK_PUSH_FAILED",
    "message": "Unable to start M-Pesa payment. Please try again."
  }
}
```

### 4.2 `GET /api/payments/mpesa/requests/:paymentRequestId`

Used by the frontend to poll for the current payment status.

**Response – success**

```json
{
  "paymentRequestId": "mpesa-req-uuid-or-id",
  "status": "COMPLETED",
  "mpesaReference": "MPESA_TRANSACTION_REFERENCE",
  "customerMessage": "Payment completed successfully."
}
```

Status values should align with:

- `"PENDING"`, `"PROCESSING"`, `"COMPLETED"`, `"FAILED"`, `"CANCELLED"`.

### 4.3 `POST /webhooks/mpesa/callback`

This endpoint receives asynchronous callbacks from M-Pesa and should:

1. Verify authenticity of the callback.
2. Update your internal payment/ order records using `paymentRequestId` or `mpesaReference`.
3. Optionally create or update Supabase orders (e.g. via `create_order_with_stock_check`) so that the UI can reflect the final state.

---

## 5. Paystack Backend Endpoints

The frontend `services/paystackService.ts` and checkout components expect the following backend contracts for Paystack payments (cards, Apple Pay, and M-Pesa via Paystack).

### Environment Variables (Backend)

- `PAYSTACK_SECRET_KEY` – Paystack secret key (live or test).
- `PAYSTACK_PUBLIC_KEY` – Paystack public key (for frontend initialization, if needed).

Optional:
- `PAYSTACK_WEBHOOK_SECRET` – Paystack webhook signing secret for payment events.

---

### 5.1 `GET /api/payments/config`

**Purpose**

Returns available payment methods and their configuration. This endpoint allows the backend to dynamically control which payment methods are available to the frontend.

**Response – success (HTTP 200)**

```json
{
  "stripe": {
    "cards": true
  },
  "paystack": {
    "cards": true,
    "applePay": true,
    "mpesa": true
  }
}
```

**Response – error (HTTP 4xx/5xx)**

```json
{
  "error": {
    "code": "CONFIG_FETCH_FAILED",
    "message": "Unable to fetch payment configuration."
  }
}
```

**Reference implementation (Express, TypeScript)**

```ts
import type { Request, Response } from 'express';

export const getPaymentsConfig = async (req: Request, res: Response) => {
  try {
    const config = {
      stripe: {
        cards: !!process.env.STRIPE_SECRET_KEY,
      },
      paystack: {
        cards: !!process.env.PAYSTACK_SECRET_KEY,
        applePay: !!process.env.PAYSTACK_SECRET_KEY, // Apple Pay requires Paystack setup
        mpesa: !!process.env.PAYSTACK_SECRET_KEY, // M-Pesa via Paystack
      },
    };

    // Remove paystack if no methods are enabled
    if (!config.paystack.cards && !config.paystack.applePay && !config.paystack.mpesa) {
      delete (config as any).paystack;
    }

    return res.status(200).json(config);
  } catch (error: any) {
    console.error('Get payments config error', error);

    return res.status(500).json({
      error: {
        code: 'CONFIG_FETCH_FAILED',
        message: 'Unable to fetch payment configuration.',
        details: process.env.PAYMENTS_ENV === 'development' ? error.message : undefined,
      },
    });
  }
};
```

---

### 5.2 `POST /api/payments/paystack/charges`

**Purpose**

Create a Paystack charge for card or Apple Pay payments. The backend handles the Paystack API interaction and returns a normalized response.

**Request (JSON body)**

```json
{
  "amount": 1299,
  "currency": "USD",
  "method": "card",
  "metadata": {
    "product_id": "prod_123",
    "quantity": "2",
    "buyer_id": "user-uuid"
  }
}
```

- `amount` – integer, smallest currency unit (e.g. cents for USD, kobo for NGN).
- `currency` – ISO currency code, e.g. `USD`, `NGN`, `KES`, `ZAR`, `GHS`.
- `method` – `"card"` or `"apple_pay"`.
- `metadata` – arbitrary key/value map (all string values) for order tracking.

**Response – success (HTTP 200)**

```json
{
  "status": "success",
  "reference": "paystack_ref_12345",
  "message": "Payment successful"
}
```

**Response – requires action (HTTP 200)**

For 3DS verification or other user actions:

```json
{
  "status": "requires_action",
  "authorizationUrl": "https://paystack.com/authorize/...",
  "reference": "paystack_ref_12345",
  "message": "Please complete authentication"
}
```

**Response – error (HTTP 4xx/5xx)**

```json
{
  "error": {
    "code": "PAYSTACK_CHARGE_FAILED",
    "message": "Card payment failed. Please try a different card or payment method."
  }
}
```

**Reference implementation (Express, TypeScript)**

```ts
import type { Request, Response } from 'express';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const createPaystackCharge = async (req: Request, res: Response) => {
  try {
    const { amount, currency = 'USD', method, metadata = {} } = req.body as {
      amount: number;
      currency?: string;
      method: 'card' | 'apple_pay';
      metadata?: Record<string, string>;
    };

    if (!amount || amount <= 0) {
      return res.status(400).json({
        error: {
          code: 'INVALID_AMOUNT',
          message: 'Amount must be a positive integer in the smallest currency unit.',
        },
      });
    }

    // For card payments, Paystack typically requires:
    // 1. Initialize transaction (get authorization URL)
    // 2. User completes payment (redirect or inline)
    // 3. Verify transaction

    // Example: Initialize transaction
    const initResponse = await axios.post(
      `${PAYSTACK_BASE_URL}/transaction/initialize`,
      {
        amount: amount * 100, // Paystack expects amount in kobo/cent equivalent
        currency: currency.toLowerCase(),
        metadata,
        callback_url: `${process.env.APP_URL}/payments/paystack/callback`,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    const { authorization_url, reference } = initResponse.data.data;

    // If authorization URL is present, payment requires user action (3DS, etc.)
    if (authorization_url) {
      return res.status(200).json({
        status: 'requires_action',
        authorizationUrl: authorization_url,
        reference,
        message: 'Please complete authentication',
      });
    }

    // If no authorization URL, payment may be immediate (verify transaction)
    // In production, you'd verify the transaction status here
    return res.status(200).json({
      status: 'success',
      reference,
      message: 'Payment successful',
    });
  } catch (error: any) {
    console.error('Paystack charge error', error);

    let errorMessage = 'There was a problem processing your Paystack payment.';
    if (error.response?.data?.message) {
      errorMessage = error.response.data.message;
    } else if (error.message?.includes('insufficient')) {
      errorMessage = 'Insufficient funds. Please check your account balance.';
    } else if (error.message?.includes('card')) {
      errorMessage = 'Card payment failed. Please try a different card or payment method.';
    }

    return res.status(500).json({
      error: {
        code: 'PAYSTACK_CHARGE_FAILED',
        message: errorMessage,
        details: process.env.PAYMENTS_ENV === 'development' ? error.message : undefined,
      },
    });
  }
};
```

---

### 5.3 `POST /api/payments/mpesa/stk-push` (Paystack-backed)

**Purpose**

Initiate an M-Pesa STK push payment via Paystack. This endpoint should use Paystack's M-Pesa integration instead of direct Safaricom APIs.

**Request (JSON body)**

```json
{
  "amount": 1299,
  "phoneNumber": "254712345678",
  "accountReference": "prod_123",
  "metadata": {
    "product_id": "prod_123",
    "quantity": "2"
  }
}
```

**Response – success (HTTP 201/200)**

```json
{
  "paymentRequestId": "paystack-mpesa-req-uuid",
  "mpesaReference": "PaystackReferenceIfAvailable",
  "status": "PENDING",
  "customerMessage": "A payment prompt has been sent to your phone. Please enter your PIN to approve."
}
```

**Response – error**

```json
{
  "error": {
    "code": "MPESA_STK_PUSH_FAILED",
    "message": "Unable to start M-Pesa payment. Please try again."
  }
}
```

**Reference implementation (Express, TypeScript)**

```ts
import type { Request, Response } from 'express';
import axios from 'axios';

const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY as string;
const PAYSTACK_BASE_URL = 'https://api.paystack.co';

export const startPaystackMpesaCheckout = async (req: Request, res: Response) => {
  try {
    const { amount, phoneNumber, accountReference, metadata = {} } = req.body as {
      amount: number;
      phoneNumber: string;
      accountReference: string;
      metadata?: Record<string, string>;
    };

    // Paystack M-Pesa integration (check Paystack docs for exact endpoint)
    // Example using Paystack's mobile money API:
    const response = await axios.post(
      `${PAYSTACK_BASE_URL}/charge`,
      {
        amount: amount * 100, // Convert to smallest currency unit
        email: `${phoneNumber}@mpesa.temp`, // Paystack may require email
        currency: 'KES',
        mobile_money: {
          phone: phoneNumber,
          provider: 'mpesa',
        },
        reference: accountReference,
        metadata,
      },
      {
        headers: {
          Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
          'Content-Type': 'application/json',
        },
      }
    );

    return res.status(201).json({
      paymentRequestId: response.data.data.id || accountReference,
      mpesaReference: response.data.data.reference,
      status: 'PENDING',
      customerMessage: 'A payment prompt has been sent to your phone. Please enter your PIN to approve.',
    });
  } catch (error: any) {
    console.error('Paystack M-Pesa STK push error', error);

    return res.status(500).json({
      error: {
        code: 'MPESA_STK_PUSH_FAILED',
        message: 'Unable to start M-Pesa payment. Please try again.',
        details: process.env.PAYMENTS_ENV === 'development' ? error.message : undefined,
      },
    });
  }
};
```

---

### 5.4 `GET /api/payments/mpesa/requests/:id` (Paystack-backed)

**Purpose**

Poll for the status of an M-Pesa payment request initiated via Paystack.

**Path params**

- `:id` – Payment request ID (from `POST /api/payments/mpesa/stk-push` response).

**Response – success**

```json
{
  "paymentRequestId": "paystack-mpesa-req-uuid",
  "status": "COMPLETED",
  "mpesaReference": "MPESA_TRANSACTION_REFERENCE",
  "customerMessage": "Payment completed successfully."
}
```

Status values: `"PENDING"`, `"PROCESSING"`, `"COMPLETED"`, `"FAILED"`, `"CANCELLED"`.

**Reference implementation (Express, TypeScript)**

```ts
export const getPaystackMpesaStatus = async (req: Request, res: Response) => {
  try {
    const { id } = req.params;

    // Query Paystack API for transaction status
    const response = await axios.get(`${PAYSTACK_BASE_URL}/transaction/verify/${id}`, {
      headers: {
        Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,
      },
    });

    const transaction = response.data.data;
    let status = 'PENDING';
    let customerMessage = 'Payment is being processed.';

    if (transaction.status === 'success') {
      status = 'COMPLETED';
      customerMessage = 'Payment completed successfully.';
    } else if (transaction.status === 'failed') {
      status = 'FAILED';
      customerMessage = transaction.gateway_response || 'Payment failed.';
    }

    return res.status(200).json({
      paymentRequestId: id,
      status,
      mpesaReference: transaction.reference,
      customerMessage,
    });
  } catch (error: any) {
    console.error('Get Paystack M-Pesa status error', error);

    return res.status(500).json({
      error: {
        code: 'MPESA_STATUS_FETCH_FAILED',
        message: 'Unable to fetch payment status.',
        details: process.env.PAYMENTS_ENV === 'development' ? error.message : undefined,
      },
    });
  }
};
```

---

### 5.5 `POST /webhooks/paystack`

**Purpose**

Receive asynchronous events from Paystack (e.g. `charge.success`, `charge.failed`) and update the LUKU domain state accordingly.

**Important events**

- `charge.success` – payment confirmed.
- `charge.failed` – permanent failure.
- `transfer.success` – refund/transfer completed.

**High-level flow**

1. Verify Paystack webhook signature (see Paystack docs for signature verification).
2. Switch on `event.event`:
   - Map Paystack `reference` to your internal order(s) using metadata.
   - For `charge.success`, mark the order as **paid / confirmed**.
   - For `charge.failed`, update order/payment records accordingly.
3. Ensure idempotency by storing processed event IDs.

**Reference implementation (Express, TypeScript)**

```ts
import crypto from 'crypto';

const PAYSTACK_WEBHOOK_SECRET = process.env.PAYSTACK_WEBHOOK_SECRET as string;

export const paystackWebhookHandler = async (req: Request, res: Response) => {
  const hash = req.headers['x-paystack-signature'] as string | undefined;

  if (!hash || !PAYSTACK_WEBHOOK_SECRET) {
    return res.status(400).send('Missing Paystack signature or webhook secret.');
  }

  // Verify webhook signature
  const hashCheck = crypto
    .createHmac('sha512', PAYSTACK_WEBHOOK_SECRET)
    .update(JSON.stringify(req.body))
    .digest('hex');

  if (hash !== hashCheck) {
    return res.status(400).send('Invalid Paystack webhook signature.');
  }

  const event = req.body;

  try {
    // Idempotency: check if event.id already processed
    // if (await hasProcessedPaystackEvent(event.id)) return res.status(200).send('OK');

    switch (event.event) {
      case 'charge.success': {
        const charge = event.data;

        // Example mapping:
        // const orderId = charge.metadata.order_id;
        // await markOrderAsPaid(orderId, charge.reference, charge.amount / 100);

        break;
      }
      case 'charge.failed': {
        const charge = event.data;

        // Example:
        // const orderId = charge.metadata.order_id;
        // await markOrderAsFailed(orderId, charge.gateway_response);

        break;
      }
      default:
        console.log(`Unhandled Paystack event type: ${event.event}`);
    }

    // await recordProcessedPaystackEvent(event.id);
    return res.status(200).send('OK');
  } catch (error: any) {
    console.error('Error handling Paystack webhook event', event.id, error);
    return res.status(500).send('Webhook handler error');
  }
};
```

---

## 6. Frontend Contracts (What LUKU Already Expects)

The existing frontend code expects:

- `GET /api/payments/config` – Returns available payment methods (Stripe, Paystack).
- `POST /api/payments/paystack/charges` – Creates Paystack card/Apple Pay charges.
- `POST /api/payments/mpesa/stk-push` – Initiates M-Pesa payments (Paystack-backed).
- `GET /api/payments/mpesa/requests/:id` – Polls M-Pesa payment status.

The frontend currently:
- Falls back to environment variables (`VITE_PAYSTACK_ENABLE_*`) when `/api/payments/config` is unavailable.
- Handles `requires_action` status by redirecting to `authorizationUrl`.
- Uses dynamic currency from `VITE_PAYSTACK_DEFAULT_CURRENCY` (defaults to USD).

This file should be kept in sync with any changes to:

- `services/paymentsConfigService.ts`
- `services/paystackService.ts`
- `components/Checkout.tsx`
- `components/MultiItemCheckout.tsx`

---

## Notes

- Paystack API documentation: https://paystack.com/docs/api/
- Paystack supports multiple currencies: USD, NGN, KES, ZAR, GHS.
- The frontend temporarily reuses `stripe_payment_intent_id` field in orders to store Paystack references. Consider adding `payment_provider` and `payment_reference` fields in a future migration.
- Currency detection could be enhanced later to detect user location and auto-select appropriate currency (KES for Kenya, NGN for Nigeria, etc.).


# Backend API Implementation

This directory contains backend API endpoint implementations for Paystack payment integration.

## Structure

- `payments/config.ts` - GET /api/payments/config endpoint
- `payments/paystack/charges.ts` - POST /api/payments/paystack/charges endpoint
- `payments/mpesa/stk-push.ts` - POST /api/payments/mpesa/stk-push endpoint
- `payments/mpesa/status.ts` - GET /api/payments/mpesa/requests/:id endpoint
- `webhooks/paystack.ts` - POST /webhooks/paystack endpoint

## Deployment Options

### Option 1: Supabase Edge Functions (Recommended)

1. Install Supabase CLI:
   ```bash
   npm install -g supabase
   ```

2. Initialize Supabase in your project (if not already):
   ```bash
   supabase init
   ```

3. Create Edge Functions:
   ```bash
   supabase functions new payments-config
   supabase functions new paystack-charges
   supabase functions new mpesa-stk-push
   supabase functions new mpesa-status
   supabase functions new paystack-webhook
   ```

4. Copy the handler code from each `.ts` file into the corresponding Edge Function.

5. Set environment variables:
   ```bash
   supabase secrets set PAYSTACK_SECRET_KEY=sk_test_...
   supabase secrets set PAYSTACK_WEBHOOK_SECRET=whsec_...
   supabase secrets set APP_URL=https://your-app-domain.com
   ```

6. Deploy:
   ```bash
   supabase functions deploy payments-config
   supabase functions deploy paystack-charges
   supabase functions deploy mpesa-stk-push
   supabase functions deploy mpesa-status
   supabase functions deploy paystack-webhook
   ```

### Option 2: Express.js Backend

1. Create a new `backend/` directory:
   ```bash
   mkdir backend
   cd backend
   npm init -y
   npm install express cors dotenv
   npm install -D @types/express @types/cors typescript ts-node
   ```

2. Create `backend/server.ts`:
   ```typescript
   import express from 'express';
   import cors from 'cors';
   import { getPaymentsConfig } from '../api/payments/config';
   import { createPaystackCharge } from '../api/payments/paystack/charges';
   import { startPaystackMpesaCheckout } from '../api/payments/mpesa/stk-push';
   import { getPaystackMpesaStatus } from '../api/payments/mpesa/status';
   import { handlePaystackWebhook } from '../api/webhooks/paystack';

   const app = express();
   app.use(cors());
   app.use(express.json());

   app.get('/api/payments/config', async (req, res) => {
     try {
       const config = getPaymentsConfig();
       res.json(config);
     } catch (error: any) {
       res.status(500).json({ error: { code: 'CONFIG_FETCH_FAILED', message: error.message } });
     }
   });

   app.post('/api/payments/paystack/charges', async (req, res) => {
     try {
       const result = await createPaystackCharge(req.body);
       res.json(result);
     } catch (error: any) {
       res.status(500).json({ error: { code: 'PAYSTACK_CHARGE_FAILED', message: error.message } });
     }
   });

   app.post('/api/payments/mpesa/stk-push', async (req, res) => {
     try {
       const result = await startPaystackMpesaCheckout(req.body);
       res.status(201).json(result);
     } catch (error: any) {
       res.status(500).json({ error: { code: 'MPESA_STK_PUSH_FAILED', message: error.message } });
     }
   });

   app.get('/api/payments/mpesa/requests/:id', async (req, res) => {
     try {
       const result = await getPaystackMpesaStatus(req.params.id);
       res.json(result);
     } catch (error: any) {
       res.status(500).json({ error: { code: 'MPESA_STATUS_FETCH_FAILED', message: error.message } });
     }
   });

   app.post('/webhooks/paystack', express.raw({ type: 'application/json' }), async (req, res) => {
     try {
       const signature = req.headers['x-paystack-signature'] as string;
       await handlePaystackWebhook(signature, req.body.toString());
       res.status(200).send('OK');
     } catch (error: any) {
       console.error('Webhook error', error);
       res.status(400).send('Webhook Error');
     }
   });

   const PORT = process.env.PORT || 3001;
   app.listen(PORT, () => {
     console.log(`Backend API server running on port ${PORT}`);
   });
   ```

3. Create `backend/.env`:
   ```bash
   PAYSTACK_SECRET_KEY=sk_test_...
   PAYSTACK_WEBHOOK_SECRET=whsec_...
   APP_URL=http://localhost:5173
   ```

4. Run:
   ```bash
   npm run dev
   ```

### Option 3: Next.js API Routes

If using Next.js, create these files in `pages/api/` or `app/api/`:

- `pages/api/payments/config.ts`
- `pages/api/payments/paystack/charges.ts`
- `pages/api/payments/mpesa/stk-push.ts`
- `pages/api/payments/mpesa/requests/[id].ts`
- `pages/api/webhooks/paystack.ts`

Import and use the handler functions from the `api/` directory.

## Environment Variables

Required environment variables:

- `PAYSTACK_SECRET_KEY` - Paystack secret key (test or live)
- `PAYSTACK_WEBHOOK_SECRET` - Webhook signing secret (from Paystack dashboard)
- `APP_URL` - Your application URL (for callback URLs)
- `STRIPE_SECRET_KEY` - Stripe secret key (for payments config endpoint)

## Testing

After deployment, test the endpoints:

1. **Config endpoint:**
   ```bash
   curl http://localhost:3001/api/payments/config
   ```

2. **Paystack charge:**
   ```bash
   curl -X POST http://localhost:3001/api/payments/paystack/charges \
     -H "Content-Type: application/json" \
     -d '{"amount": 1299, "currency": "USD", "method": "card", "metadata": {"product_id": "test"}}'
   ```

3. **M-Pesa STK push:**
   ```bash
   curl -X POST http://localhost:3001/api/payments/mpesa/stk-push \
     -H "Content-Type: application/json" \
     -d '{"amount": 100, "phoneNumber": "254712345678", "accountReference": "test123"}'
   ```

4. **M-Pesa status:**
   ```bash
   curl http://localhost:3001/api/payments/mpesa/requests/{reference}
   ```

## Webhook Setup

1. Go to Paystack Dashboard → Settings → Webhooks
2. Add webhook URL: `https://your-domain.com/webhooks/paystack`
3. Copy the webhook secret and set it as `PAYSTACK_WEBHOOK_SECRET`
4. Test webhook delivery from the dashboard

## Notes

- All amounts are in the smallest currency unit (cents/kobo). Multiply by 100 before sending to Paystack.
- Paystack supports multiple currencies: USD, NGN, KES, ZAR, GHS
- M-Pesa payments use KES currency
- Webhook signature verification is critical for security
- Implement idempotency checks to prevent duplicate event processing

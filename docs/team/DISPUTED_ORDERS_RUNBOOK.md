# C-CORE-5 — Disputed Orders Ops Runbook

**Who:** Ops / John  
**When:** A buyer has hit "Report a problem" and the order is in `disputed` state  
**Why:** There is no ops screen yet (C-CORE-10, Brian). Until then, resolution is manual.

---

## How disputes work

When a buyer taps "Report a problem":
- Order status moves to `disputed`
- Timers are paused — auto-release does **not** fire on disputed rows
- Funds stay held in escrow
- A refund does **not** happen automatically

The API logs: `[Escrow] DISPUTE_OPENED { orderId, buyerId, sellerUserId }`

There are two possible resolutions — both are ops-only, neither is in the app:
- **Buyer wins** → `disputed → refunded` (buyer gets 100% of what they paid)
- **Seller wins** → `disputed → released` (seller gets paid out, buyer gets nothing)

---

## Step 1 — Find the disputed order

Search API logs for the dispute:
```
[Escrow] DISPUTE_OPENED
```

Or query Supabase directly:
```sql
select id, stripe_payment_intent_id, status, buyer_id, seller_user_id, disputed_at
from orders
where status = 'disputed'
order by disputed_at desc;
```

Note the `stripe_payment_intent_id` — this is the `orderId` used in all calls below.

---

## Step 2a — Resolve for the buyer (refund)

This drives `disputed → refunded` and calls `refundOrder` with 100% of what the buyer paid.

Run this in the Supabase SQL editor:

```sql
-- 1. Confirm the order is disputed and get the payment reference and amount
select
    o.stripe_payment_intent_id as order_id,
    o.status,
    p.reference as payment_reference,
    p.amount_minor
from orders o
join payments p on p.reference = o.stripe_payment_intent_id
where o.stripe_payment_intent_id = '<ORDER_ID>'
  and o.status = 'disputed';

-- 2. Drive the transition (ops-only edge: disputed → refunded)
update orders
set
    status = 'refunded',
    refunded_at = now()
where stripe_payment_intent_id = '<ORDER_ID>'
  and status = 'disputed';
```

Then trigger the Paystack refund manually via the Paystack dashboard:
1. Go to **Transactions** in the Paystack dashboard
2. Find the transaction by `payment_reference`
3. Click **Refund** → confirm full amount
4. Paystack will fire `refund.processed` webhook to confirm settlement

> **Note:** `refundOrder` in code is called automatically from `orderTransitionEffects`
> on `cancelled` orders (ship-by miss). For disputed→refunded, ops drives this
> manually until C-CORE-10 builds the screen.

---

## Step 2b — Resolve for the seller (release)

This drives `disputed → released` and triggers `payoutOnRelease` automatically
via `orderTransitionEffects`.

Run this in the Supabase SQL editor:

```sql
-- 1. Confirm the order is disputed
select
    stripe_payment_intent_id as order_id,
    status,
    seller_user_id,
    disputed_at
from orders
where stripe_payment_intent_id = '<ORDER_ID>'
  and status = 'disputed';

-- 2. Drive the transition (ops-only edge: disputed → released)
update orders
set
    status = 'released',
    released_at = now()
where stripe_payment_intent_id = '<ORDER_ID>'
  and status = 'disputed';
```

Once `released` is committed:
- `payoutOnRelease` fires automatically if `PAYSTACK_TRANSFERS_ENABLED=true`
- If Transfers are off, payout is deferred and logged — retry manually via Paystack dashboard
- Watch logs for `[Escrow] TRANSFER_SUCCESS` or `[Escrow] TRANSFER_FAILED`

---

## Cancelled but not refunded

A ship-by miss moves the order to `cancelled` and relists the listing, then calls `refundOrder`. If Paystack rejects the refund, the order stays `cancelled` and the buyer is still owed. These rows show up in `GET /v1/api/internal/stuck-orders` (search logs for `[Escrow] Refund on cancel failed`). Refund the full `amount_minor` from the Paystack dashboard as in Step 2a, then set `status = 'refunded', refunded_at = now()` where `status = 'cancelled'`.

---

## What not to do

- Do **not** set status to anything other than `refunded` or `released` from `disputed`
- Do **not** auto-release disputed rows by changing timer queries — pause-on-dispute is the product rule (Brian)
- Do **not** issue a partial refund — v1 refunds are always 100% of `amount_minor`
- Do **not** roll back `released` if a transfer fails — log it and retry the transfer only

---

## Verifying resolution

After either resolution, confirm in Supabase:

```sql
select stripe_payment_intent_id, status, refunded_at, released_at
from orders
where stripe_payment_intent_id = '<ORDER_ID>';
```

Expected:
- Buyer win → `status = refunded`, `refunded_at` is set
- Seller win → `status = released`, `released_at` is set

---

## Related

- `backend/payments/refund.ts` — refund logic
- `backend/payments/payout.ts` — payout logic  
- `backend/services/orderTransitionEffects.ts` — side effects on transition
- `backend/services/orderStateMachine.ts` — full transition graph
- C-CORE-10 (Brian) — ops screen for stuck/disputed orders; replaces this runbook

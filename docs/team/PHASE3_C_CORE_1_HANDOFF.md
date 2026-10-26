# C-CORE-1 handoff — escrow data foundation is live

**Status:** shipped · **Gate:** [`PHASE3_GO_NO_GO.md`](./PHASE3_GO_NO_GO.md) C4 + C7 · **Policy:** [`../architecture/ESCROW_POLICY.md`](../architecture/ESCROW_POLICY.md)

Shannon, Felix, Brian — you are unblocked. This page is the exact shape of what landed, so nobody has to read the migration to start. Names here are final; code against them directly.

**Apply the migration first:** [`database/migrations/012_escrow_orders.sql`](../../database/migrations/012_escrow_orders.sql) in the Supabase SQL editor (dev), per [`MIGRATION_RUNBOOK.md`](../database/MIGRATION_RUNBOOK.md). It is idempotent and safe to re-run.

**Then prove it landed:**

```bash
npm run verify:escrow
```

[`scripts/verify-escrow-migration.mjs`](../../scripts/verify-escrow-migration.mjs) runs structural, backfill, behavioural, RLS-under-role, and PostgREST embed checks against your database — columns, constraints, indexes, RLS, backfill state, the `create_escrow_order` paths (peer, catalog, Sold listing, self-purchase, bad input), buyer/non-buyer payment visibility, peer-seller order visibility, and that the BFF's PostgREST embed resolves. Behavioural checks run inside a transaction that is always rolled back, so it leaves no rows behind and is safe to re-run. Run it after any change to the escrow schema.

For the live HTTP path (POST + GET against a running BFF):

```bash
npm run dev:api   # in another terminal
npm run verify:order-api
```

That script writes a real order under a synthetic payment reference, asserts grouping / payment embed / escrow deadlines, then deletes what it created.

```bash
npm run verify:order-api -- --peer   # peer listingId path (creates a temp listing if needed)
```


---

## Order statuses (exact values)

`public.orders.status` — `text` with a CHECK constraint, default `pending_payment`:

```
pending_payment  paid  in_escrow  shipped  delivered  released  completed  cancelled  refunded  disputed
```

Legacy `pending` / `confirmed` are **gone** — backfilled to `paid`. The CHECK rejects anything outside the list, so an invalid transition fails loudly at the DB rather than silently persisting. Those two strings survive only in retired [`apps/web-legacy`](../../apps/web-legacy/README.md); a grep hit there is not live product code.

Mirrored in TypeScript as `OrderStatus` in [`packages/contracts/src/orders.ts`](../../packages/contracts/src/orders.ts). Import the union; do not re-declare it. Keep the repo's relative-path convention:

```ts
// from backend/services/
import type { OrderStatus, OrderDto, PaymentDto } from '../../packages/contracts/src/orders';
```

Mobile note: [`ordersRepository.ts`](../../apps/mobile/src/repositories/ordersRepository.ts) maps `released`/`completed` → `delivered` and `refunded` → `cancelled` so terminal escrow orders leave the active list. In-flight statuses (`pending_payment`, `paid`, `in_escrow`, `disputed`) still map to `processing`. Shannon's C-CORE-2 stepper owns the richer buyer-facing labels — this mapping is only the interim filter.

---

## New columns on `public.orders`

| Column | Type | Notes |
|--------|------|-------|
| `paid_at` | timestamptz | Set by the RPC today; webhook owns it after C-CORE-3 |
| `shipped_at` | timestamptz | Seller transition |
| `delivered_at` | timestamptz | Buyer transition |
| `released_at` | timestamptz | Funds left escrow |
| `cancelled_at` | timestamptz | |
| `refunded_at` | timestamptz | |
| `disputed_at` | timestamptz | Pauses timers (D5) |
| `ship_by_at` | timestamptz | D3 deadline, set at order creation from `escrowPolicy.shipByDays` |
| `auto_release_at` | timestamptz | D2 deadline — **null until shipped**; Brian sets it on the `shipped` transition |
| `payment_id` | uuid FK → `payments` | One payment funds many orders |
| `listing_id` | uuid FK → `listings` | Peer sales |
| `seller_user_id` | uuid FK → `auth.users` | Peer seller |

`product_id` and `seller_id` are now **nullable**, guarded by two constraints:

- `orders_item_source_check` — exactly one of `product_id` / `listing_id`
- `orders_seller_target_check` — at least one of `seller_id` / `seller_user_id`

**Timer queries:** backfilled history has `ship_by_at` and `auto_release_at` null on purpose, so pre-escrow orders are never treated as overdue. Filter on `... is not null`. Two partial indexes already match that shape: `idx_orders_ship_by_at_pending` and `idx_orders_auto_release_at_pending`.

---

## `public.payments` (new)

Payment truth, one row per provider charge.

| Column | Type | Notes |
|--------|------|-------|
| `id` | uuid PK | |
| `provider` | text | default `paystack` |
| `reference` | text **UNIQUE** | Paystack reference — the idempotency anchor |
| `buyer_id` | uuid FK → `auth.users` | |
| `amount_minor` | integer | **Minor units** (KES cents) |
| `currency` | text | default `KES` |
| `status` | text | `pending` \| `success` \| `failed` \| `abandoned` \| `reversed` |
| `channel` | text | `mpesa` \| `card` (nullable) |
| `raw_payload` | jsonb | Store the provider event here |
| `paid_at` | timestamptz | |
| `created_at` / `updated_at` | timestamptz | `updated_at` trigger installed |

RLS: buyers select their own rows; the BFF uses the service role.

`amount_minor` is currently the line-item total, not the charged total (checkout adds tax and shipping client-side). **C-CORE-6 reconciliation will correct it from Paystack Verify** — treat provider Verify as authoritative, not this column.

---

## `public.processed_webhook_events` (new) — for Shannon, C-CORE-3

| Column | Type |
|--------|------|
| `key` | text **PK** |
| `provider` | text |
| `reference` | text |
| `event_type` | text |
| `payload` | jsonb |
| `processed_at` | timestamptz |

RLS enabled with **no policies** — service role only.

**No refactor needed.** [`handlePaystackWebhook`](../../backend/handlers/webhooks/paystack.ts) already injects both seams, and `key` matches what `buildWebhookIdempotencyKey('paystack', reference)` produces:

```ts
options?: {
    idempotencyStore?: IdempotencyStore;
    processEvent?: (event: PaystackWebhookEvent) => Promise<void>;
}
```

Implement the same two-method `IdempotencyStore` interface from [`idempotencyStore.ts`](../../backend/payments/idempotencyStore.ts) against this table and pass it in.

---

## Escrow policy config — for Felix and Brian

Never hardcode `7` / `3` / `0.10`. Read [`backend/payments/escrowPolicy.ts`](../../backend/payments/escrowPolicy.ts):

```ts
import { getEscrowPolicy } from '../payments/escrowPolicy';

const { autoReleaseDays, shipByDays, commissionRate } = getEscrowPolicy();
```

| Env var | Default | Validation |
|---------|---------|------------|
| `ESCROW_SHIP_BY_DAYS` | `3` | integer > 0 |
| `ESCROW_AUTO_RELEASE_DAYS` | `7` | integer, > `shipByDays` |
| `ESCROW_COMMISSION_RATE` | `0.10` | `0 <= x < 1` |
| `ESCROW_BUYER_REMINDER_DAYS` | `3,6` | positive ints, each < `autoReleaseDays` |
| `ESCROW_SELLER_REMINDER_DAYS` | `2` | positive ints, each < `shipByDays` |

Out-of-range values throw at boot via `validatePaymentsEnvironment`, so a bad env fails fast instead of silently mis-paying a seller.

---

## Order creation now supports peer listings

`create_order_with_stock_check` is superseded by **`create_escrow_order`**, which handles both sources:

```
create_escrow_order(
  p_buyer_id, p_payment_id, p_payment_reference,
  p_product_id, p_listing_id, p_quantity,
  p_shipping_address, p_ship_by_days
)
```

- **Catalog:** locks the product row, checks and decrements stock (unchanged behaviour)
- **Peer:** locks the listing, requires `status = 'Active'`, forces quantity 1, flips it to `Sold`, rejects buying your own listing
- Both insert `status = 'paid'`, `paid_at = now()`, `ship_by_at = now() + p_ship_by_days`

The old RPC still exists and now delegates to the new one, so nothing breaks if something still calls it. If you ever re-apply `006`, re-apply `012` afterwards — `006` restores the old body that inserts the now-invalid `pending`.

`CreateOrderRequest` changes: `paymentReference` replaces `stripePaymentIntentId` (the old field still works, marked deprecated), and items take `productId` **or** `listingId`.

---

## What is intentionally NOT done

| Not built | Owner |
|-----------|-------|
| State machine / transition endpoints | Shannon (C-CORE-2) |
| DB-backed idempotency implementation | Shannon (C-CORE-3) |
| Payout, refunds, commission math | Felix (C-CORE-4/5) |
| Timers, `auto_release_at` writes, notifications | Brian (C-CORE-7, C-NOTIF-*) |
| Multi-seller guard | John (C-CORE-8) — **shipped**: multi-seller cart, single-seller order (D9), `MULTI_SELLER_NOT_ALLOWED` |
| Reconciliation detect/fix/flag | John (C-CORE-6a) — **shipped**: Verify + amount/pending/orphan; no order status writes |
| Reconciliation status repair | John (C-CORE-6b) — blocked on Shannon `StatusRepairPort` |
| Webhook URL registration | Needs a public API URL; polling covers checkout until then |

**Invariant to preserve:** the payment webhook is the only writer of `paid`, sellers only drive `shipped`, buyers only drive `delivered` / `disputed`, and a `disputed` order pauses auto timers.

---

## C-CORE-8 — single-seller checkout (D9)

The **cart** may hold several sellers. An **order** may not: v1 blocks mixed-seller orders rather than splitting one payment into N escrows.

Seller keys: `business:{products.business_id}` | `peer:{listings.seller_id}`.

- Guard in [`ordersService.createOrder`](../../backend/services/ordersService.ts) before payment/RPC — the hard lock
- API: **400** `MULTI_SELLER_NOT_ALLOWED`
- [`cartService.addToCart`](../../backend/services/cartService.ts) accepts any seller; only product existence / availability is enforced
- On success `createOrder` calls `removeCartProducts` with the ordered product IDs, so unpaid sellers survive for the next checkout

Buyer UX ([`CartScreen`](../../apps/mobile/src/screens/CartScreen.tsx)): the cart groups by seller and each group has its own checkout action. Totals, the order payload, and the post-order cart clear all scope to the chosen group.

---

## C-CORE-6a — reconciliation (no order status writes)

- Helper: [`paystackVerify.ts`](../../backend/payments/paystackVerify.ts)
- Job: [`reconciliationService.ts`](../../backend/payments/reconciliationService.ts)
- Trigger: `POST /v1/api/internal/reconcile` with header `x-reconcile-secret: $RECONCILE_SECRET`

**6a does:** fix `amount_minor` / `raw_payload` / `paid_at` from Verify; `pending` → `success` | `failed` | `abandoned`; orphan Paystack success with no order → **flag only** in `raw_payload.reconciliation`.

**6a does not:** write `orders.status` to `paid`. That is C-CORE-6b via Shannon's port below.

---

## Checkout safety rails (added after the RLS incident)

Checkout used to INSERT into `public.payments` as the PostgREST client role.
That table has RLS on and **no INSERT policy**, so any connection that is not
bypassing RLS is refused **after** Paystack has captured the money. The key on
disk was a valid `service_role` credential the whole time; swapping JWT vs
`sb_secret_` could not fix a table insert that depended on the client role.

Checkout writes now go through [`ensure_payment_record`](../../database/migrations/016_ensure_payment_record.sql)
(`SECURITY DEFINER`, owned by `postgres`) — the same pattern as `create_escrow_order`.
Apply **016** (`node scripts/apply-migrations.mjs 16 16`) or checkout stays broken
on a fresh database.

Rails that remain useful:

1. **Boot guard** — [`backend/config/supabaseEnv.ts`](../../backend/config/supabaseEnv.ts) `assertServiceRoleKey`. Refuses to start on a publishable/anon/unrecognized key.
2. **`createOrder` is idempotent per payment reference** — retrying a captured charge cannot duplicate orders or double-decrement stock.
3. **Client reuses a confirmed reference** — the cart holds `paidReference` after capture and skips re-charging on retry.
4. **Env loading is one path, and it is observable** — `.env` then `.env.local`, files beat inherited shell values. Env is read once at startup; restart the API after editing a key.

Triage for charges that were captured with no order: `npm run triage:payments [-- --days 7] [-- --strict]`. Strictly read-only — refunds and manual order creation stay manual.

### Checking which key a process is actually using

Boot prints env files, key kind, project and a short fingerprint (never the key):

```
Env files: .env not found, .env.local loaded
Supabase key: secret project=<ref> fingerprint=7f6558b2
```

| Question | Command |
|----------|---------|
| What is on disk? | `npm run check:supabase` |
| What did the server boot with? | `curl localhost:3001/health/supabase` |
| Does this process write payments the way checkout does? | `curl "localhost:3001/health/supabase?write=1"` (non-production) |
| Roles, RLS flags, DEFINER function | `npm run diagnose:rls` (prints the same fingerprint) |

Same fingerprint on disk and boot means the restart took effect. `?write=1` calls `ensure_payment_record`; a failed cleanup delete is non-fatal.

If Postgres still refuses a write, the API returns `503 SERVER_MISCONFIGURED` with the **Postgres text and SQLSTATE** (and logs the payment reference). That message must not be read as "the key is wrong."

Webhook and reconciliation still write `payments` as table DML. That is a known residual, not this checkout path.

---

## RESOLVED: the 16% tax is part of the escrowed amount (D12)

Previously open, now decided and implemented. See [D12 in ESCROW_POLICY.md](../architecture/ESCROW_POLICY.md#d12-in-practice).

Escrow holds the **full captured charge** (`subtotal + VAT`), and the **payout base is the line-item subtotal**. These are not in tension: we hold everything the buyer paid so a 100% refund (D11) is possible, and we pay commission on item price only (D7) so the seller is never paid a share of tax.

What changed in the code:

- `createOrder` writes `subtotal + VAT` to `payments.amount_minor`. It means *what the provider captured*, full stop.
- The rate moved to `VAT_RATE` in [`packages/contracts/src/pricing.ts`](../../packages/contracts/src/pricing.ts), shared by cart and BFF, with an `ESCROW_VAT_RATE` server override surfaced as `escrowPolicy.vatRate`.

What this means for you:

- **Felix (C-CORE-4)** — `calculatePayout` must be handed the **line-item subtotal** from `order_items.total_price`. Never `payments.amount_minor`; it now includes VAT and would pay the seller a cut of tax.
- **Felix (C-CORE-5)** — reversing the full `amount_minor` is now D11-correct on its own. The note in `refund.ts` about `amount_minor` being subtotal-only is stale and the workaround can go.
- **Everyone** — reconciliation amount mismatches used to fire on every order and were ignorable. They are now meaningful. Treat one as a real discrepancy.

Order totals in the app are `subtotal + VAT` with **no** shipping fee — delivery is buyer-arranged.

---

## Driving a transition — for Shannon, Felix and Brian

`transitionOrder` in [`orderStateMachine.ts`](../../backend/services/orderStateMachine.ts) is the **only** writer of `orders.status`. No feature should ever `.update({ status })` directly; the graph, the actor check and the timestamp stamping all live in one place and a direct write skips all three.

### The rule: the actor owns the route

Each edge in the graph declares which actor may take it, and `transitionOrder` rejects a mismatch. That determines who builds which endpoint.

| Transition | Actor | Owner | Surface |
|---|---|---|---|
| `pending_payment -> paid` | `webhook` | Shannon (C-CORE-3) | Paystack `charge.success` — already wired |
| `paid -> in_escrow` | `system` | Shannon (C-CORE-3) | chained in the webhook, see below |
| `in_escrow -> shipped` | `seller` | Felix | `POST /v1/api/orders/:id/ship` |
| `shipped -> delivered` | `buyer` | Shannon | `POST /v1/api/orders/:id/confirm-receipt` |
| `shipped \| in_escrow -> disputed` | `buyer` | Shannon | `POST /v1/api/orders/:id/dispute` |
| `delivered -> released` | `system` | Felix (payout) / Brian (auto-release timer) | job, not a route |
| `in_escrow -> cancelled` | `system` | Brian (C-CORE-7 ship-by timer) | job, not a route |
| `disputed -> refunded`, `cancelled -> refunded` | `system` | Felix (refund) | job / ops action |

`:id` is the **payment reference** (`stripe_payment_intent_id`), which is what the app calls an order id, not the `orders.id` row uuid.

### Endpoint shape

All three buyer/seller routes are the same four lines. Mount with `verifyToken`, pass `req.userId`, and let the state machine do the authorization — do not pre-check ownership yourself.

```ts
// backend/router/v1/orders.ts
router.post('/:id/ship', async (req, res) => {
  try {
    await markOrderShipped(req.params.id, req.userId!);   // seller actor
    res.json(createResponse({ ok: true }));
  } catch (err) {
    return sendOrderTransitionError(res, err);
  }
});
```

`markOrderShipped`, `confirmOrderDelivery` and `reportOrderProblem` are thin wrappers already exported for exactly this. Map the errors consistently:

| Error | Status | Code |
|---|---|---|
| `OrderNotFoundError` | 404 | `NOT_FOUND` |
| `IllegalOrderTransitionError` | 409 | `CONFLICT` — carries `.from` and `.to` |
| `UnauthorizedOrderTransitionError` | 403 | `FORBIDDEN` |

409 rather than 400 matters: a double-tap on "Mark as shipped" is a legal client action against a state that already moved, and the app should treat it as already-done, not as a validation failure.

### `paid -> in_escrow` needs chaining — Shannon

`create_escrow_order` inserts rows already at `paid`, and **nothing currently promotes them to `in_escrow`**. The webhook stops at `paid`.

That gap silently disables Brian's work: the ship-by auto-cancel edge is `in_escrow -> cancelled`, so if orders never reach `in_escrow`, **the timer can never fire** no matter how correct it is. It will look like a bug in the timer.

Chain it in the same webhook handler right after the `paid` transition succeeds:

```ts
await transitionOrder({ orderId: reference, toStatus: 'paid', actor: 'webhook' });
await transitionOrder({ orderId: reference, toStatus: 'in_escrow', actor: 'system' });
```

`paid -> shipped` stays in the graph as a fallback so a seller isn't blocked by an order stranded at `paid` in the meantime.

### StatusRepairPort — Shannon (C-CORE-6b)

John's reconciler calls this when Verify says success and a repairable order exists. Shannon owns the implementation; the reconciler injects it and never writes status itself. Orphan success payments with no order stay **flag-only** — do not invent an order.

```ts
// backend/services/statusRepair.ts — Shannon
import { transitionOrder, OrderNotFoundError, IllegalOrderTransitionError } from './orderStateMachine';
import type { StatusRepairPort } from '../payments/reconciliationService';

export const statusRepairPort: StatusRepairPort = {
  async markPaidFromProvider({ reference }) {
    try {
      await transitionOrder({ orderId: reference, toStatus: 'paid', actor: 'webhook' });
      await transitionOrder({ orderId: reference, toStatus: 'in_escrow', actor: 'system' });
      return { ok: true };
    } catch (err) {
      if (err instanceof OrderNotFoundError) return { ok: false, reason: 'order_not_found' };
      // Already past `paid` — a missed webhook that a later one covered. Not a failure.
      if (err instanceof IllegalOrderTransitionError) return { ok: true };
      throw err;
    }
  },
};
```

Treating `IllegalOrderTransitionError` as success is what makes the reconciler idempotent: re-running it over already-repaired orders has to be a no-op, or the job can never be safely retried.

---

## Paystack Transfers enablement (C-CORE-9 leftover → unblocks C9)

Before Felix C-CORE-4 moves live payouts:

1. Confirm **Transfers** is enabled on the live Paystack business dashboard.
2. Confirm the balance can fund a small test transfer (KES).
3. Create a test M-Pesa recipient (`bank_code=MPESA`) and verify the recipient code persists.
4. Run one sandbox/live test transfer to that recipient; confirm webhook / transfer status.
5. Point sellers at [`015_seller_payout_details.sql`](../../database/migrations/015_seller_payout_details.sql) once applied — `seller_id` is an `auth.users` id; resolve it from an order with `resolveSellerUserId` (see [`PHASE3_INTEGRATION_STATUS.md`](./PHASE3_INTEGRATION_STATUS.md) §3.2).

Ops/dashboard work — no app code beyond storing `paystack_recipient_code`.

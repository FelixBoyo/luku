# Phase 3 — team update

**Updated:** 2026-09-02 · **Development:** `zeus` (PRs go here) · **Release:** `master`

This is the shareable “what’s going on” doc. Read this first; dig into the longer runbook only if you need detail.

- Full runbook: [`PHASE3_INTEGRATION_STATUS.md`](./PHASE3_INTEGRATION_STATUS.md)
- Paste-ready wiring (endpoints, errors, webhook chain): [`PHASE3_C_CORE_1_HANDOFF.md`](./PHASE3_C_CORE_1_HANDOFF.md#driving-a-transition--for-shannon-felix-and-brian)

---

## What’s going on (plain English)

### We built escrow in four parallel tracks

| Who | What they built |
|-----|-----------------|
| **John** | Schema, single-seller checkout, cart UX, reconciliation, money-math fix |
| **Shannon** | Order state machine + Paystack webhook that marks an order `paid` |
| **Felix** | Seller payout details, payout on release, refunds |
| **Brian** | Notifications table, push tokens, order-status → push |

Those lived on different branches for a while. Felix + Brian were on `zeus`; Shannon + John on `feature/phase3-order-schema`. They are now in **one** tree. Tests and typechecks are green on that combined branch.

**Why that matters for you:** remaining work cuts from **`zeus`** and PRs **into `zeus`**. `master` is the release line — John promotes `zeus` → `master`; do not open day-to-day PRs into `master`. Do not keep building on the old feature tips. See [How to continue](#how-to-continue).

Also already shipped on this branch:

- **D12** — escrow holds what the buyer actually paid (`subtotal + VAT`); the seller payout base is still the **line-item subtotal** only
- Charge / STK payment endpoints now require auth
- `resolveSellerUserId` — maps a catalog order’s business seller to the user id payout details are stored under
- **Checkout writes `payments` via `ensure_payment_record` (016)** — a real purchase now creates an order. Do not chase the service role key for 42501.
- Sold-out items grey out on Home / Discover / Market (including featured/hero); detail still opens, Add to Cart is disabled
- **Poll checkout and the Paystack webhook both promote `paid → in_escrow`**
- **Confirm receipt releases immediately** (`shipped → delivered → released`) and calls `payoutOnRelease` with the line-item subtotal
- **Ship-by miss cancels then refunds**; D2 auto-release is `shipped` past `auto_release_at`
- **C-CORE-6b** — reconciler injects `statusRepairPort`
- Sellers can load their orders and **Mark as shipped** in Order Tracking (409 is `CONFLICT`)

### The money path is wired

Payment can mark an order **`paid`**, and the follow-on graph now runs:

```text
pending_payment → paid ✅
                 ↘ in_escrow ✅  → shipped ✅  → delivered ✅  → released / payout ✅
                              ↘ cancelled / refund ✅
```

What still waits on ops / follow-up tickets (not this wiring):

- Register Paystack `https://<api>/webhooks/paystack` and confirm Transfers are enabled
- Supabase DB webhook → `POST /webhooks/orders`
- Expo push token on login (Shannon C-NOTIF-2) — §8 step 10
- Real shipping address (Cart still defaults Shannon Martinez / Kimathi St)
- D10 reminder jobs, C-CORE-10 stuck-order ops view, server-priced checkout

Until Paystack Transfers and seller payout details are live, a correct `released` order can still fail the Transfer call — status stays `released`; we log and do not roll back.

### One-sentence summary

Poll + webhook reach `in_escrow`; confirm releases and pays out; a ship-by miss refunds. Remaining work is ops (webhook URL, Transfers) and the follow-up tickets above — not more unhooked function calls.

---

## Who does what (and why)

Shannon / Felix / Brian ticket bodies are unchanged in [`PHASE3_TICKETS.md`](./PHASE3_TICKETS.md). The three wiring pieces those tickets were blocked on have landed:

1. `paid → in_escrow` in the webhook **and** at the end of `createOrder` (poll path).
2. `POST /v1/api/orders/:id/ship` + seller GET + Order Tracking “Mark as shipped”.
3. Confirm-receipt / dispute routes + buyer UI; confirm now continues to `released` and payout.

### Shannon

Push-token registration on login (C-NOTIF-2) and real shipping-address capture are still yours. Confirm-receipt and dispute are in.

### Felix

Payout/refund **functions are now called** from transition side-effects (`payoutOnRelease` on `released`, `refundOrder` on `cancelled`). Still outstanding: apply **015** if it is not on the shared project yet; `transfer.*` / `refund.*` async webhooks; live Transfers must be enabled before real payouts.

**Payout math (D12):** side-effects hand `payoutOnRelease` the **line-item `total_price` sum**, not `payments.amount_minor`.

### Brian

Timers now see `in_escrow` from both poll and webhook. Auto-cancel is `in_escrow` + past `ship_by_at` → `cancelled` → refund. Auto-release is **`shipped` + past `auto_release_at` → `released`** (D2 is 7 days after shipped, not `delivered`). Disputed rows are not selected. D10 reminder jobs and C-CORE-10 remain tickets.

### John

- **016 is on the shared Supabase project.** Checkout writes through `ensure_payment_record`.
- **C-CORE-6b is wired** (`statusRepairPort` into `runReconciliation`).
- Ops: register the Paystack webhook URL; confirm Transfers; optional Supabase DB webhook.
- Promote `zeus` → `master` when this slice is ready. §8 steps 6–9 are the manual escrow pass; step 10 waits on Shannon’s push-token ticket.

---

## Action checklist

| Priority | Owner | Action |
|----------|--------|--------|
| 1 | John (ops) | Register Paystack webhook URL + confirm Transfers enabled |
| 2 | Shannon | Expo push token on login (C-NOTIF-2) — unblocks §8 step 10 |
| — | Shannon | Real shipping address at checkout |
| — | Felix | Apply `015` if not on the shared project; async transfer/refund webhooks |
| — | Brian | D10 reminder jobs; C-CORE-10 stuck-order ops view |
| — | John | Server-priced checkout (later); promote zeus → master after §8.6–9 |

Paste-ready endpoint shapes and error mapping are in the handoff doc.

---

## How to continue

Two lines:

- **`zeus`** — development. Cut a **new** personal branch from `zeus` and open PRs **into `zeus`**.
- **`master`** — release. John promotes `zeus` → `master` when a slice is ready. Do not PR into `master`.
- **`legacy-master`** — frozen snapshot of the old web-era `master`. Do not commit there.

```bash
git fetch origin
git checkout -b feature/<your-ticket> origin/zeus
```

Do **not** keep committing on `escro-buyer-Shannon`, `phase3-seller-payout`, or `feature/phase3-notify-surfacing`. Those tips are already merged; building there means missing 016, D12, and the rest of the integration.

Do **not** pile remaining tickets onto `zeus` itself (open a PR) or onto `master`. Do **not** rename the old branches to match the kickoff doc.

Migrations run **once on the shared Supabase project** (SQL Editor or `apply-migrations.mjs` with `SUPABASE_DB_URL`). Nobody runs a local Postgres. **016 is already applied.** **015** is still Felix, once, on that same project.

---

## Do not assume

- Recipient routes **are** mounted (old PR note was wrong).
- `amount_minor` is now the **full capture** — Felix refund workaround can go.
- Auth on charges is a mitigation; **server-priced checkout** is still an open ticket (integration status §7).
- Migrations / live Transfers are not “done” just because the branch merged. **016 is on the shared Supabase project.** Apply **015** once on that project (Felix); enable Transfers before real payouts.
- This update is **not** “escrow is live in production.” It is “the money path is hooked; ops + follow-up tickets remain.”
- A 42501 on `payments` is not “wrong service role key.” Checkout goes through `ensure_payment_record`. See the handoff.

---

## WhatsApp / Slack blurb

Keep the chat short; point people here for the explanation.

```
Two lines now:
- zeus = development. Pull origin/zeus, cut a NEW branch, PR into zeus.
- master = release. John promotes zeus → master. Do not PR into master.

Old master is frozen as legacy-master. Do not commit there or on the old feature tips.

016 is on the shared Supabase project (not a local DB). 015 still Felix, once, on that project.

Read: docs/team/PHASE3_TEAM_UPDATE.md

Money path is now wired:
- poll + webhook both reach in_escrow
- confirm receipt → released + payout (line-item subtotal)
- ship-by miss → cancelled + refund
- seller can Mark as shipped in the app

Still tickets / ops (not unhooked calls):
1. John: register Paystack webhook URL + Transfers
2. Shannon: Expo push token on login (C-NOTIF-2); real shipping address
3. Brian: D10 reminders; C-CORE-10 ops view
4. Felix: 015 on Supabase if not applied; async transfer/refund webhooks

Ping with blockers after you read the doc.
```

After the next promote to `master`, leave this blurb as-is — PRs still go to `zeus`.

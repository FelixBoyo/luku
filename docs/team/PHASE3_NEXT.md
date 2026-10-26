# Phase 3 remaining — complete

**Updated:** 2026-09-23 · **Development:** `zeus` (PRs go here) · **Release:** `master`  
**Status:** Phase 3 complete (sign-off: [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md), evidence: [`PHASE3_INTEGRATION_STATUS.md`](./PHASE3_INTEGRATION_STATUS.md) §8).

The longer story is [`PHASE3_TEAM_UPDATE.md`](./PHASE3_TEAM_UPDATE.md). Ticket acceptance criteria stay in [`PHASE3_TICKETS.md`](./PHASE3_TICKETS.md).

## One-sentence status

Phase 3 is signed off: pay → escrow → ship → confirm (release) or ship-by miss (cancel + relist) or dispute (ON HOLD). Open items below are carried forward — not more unhooked function calls.

## How money and disputes work today

```text
pending_payment → paid → in_escrow → shipped → delivered → released  (payout if Transfers on)
                              ↘ cancelled → refunded                 (ship-by miss)
                 in_escrow|shipped → disputed                        (buyer reports a problem)
                              disputed → refunded | released         (ops only — not in the app)
```

**Report a problem** does **not** refund. Watch API logs for `[Escrow] DISPUTE_OPENED` `{ orderId, buyerId, sellerUserId }`. Funds stay held until ops drives `disputed → refunded` (buyer, 100% of what they paid) or `disputed → released` (seller). Ops steps: [`DISPUTED_ORDERS_RUNBOOK.md`](./DISPUTED_ORDERS_RUNBOOK.md).

**Payouts:** `released` is real even when Paystack Transfer fails or is skipped. Status is not rolled back. Starter Paystack businesses cannot third-party payout until Transfers are enabled (`PAYSTACK_TRANSFERS_ENABLED=true`).

**MP-12:** a Sold peer listing returns to `Active` on `cancelled` (even if the synthetic/Paystack refund fails) and on ops `disputed → refunded`. Catalog orders have no listing to relist.

---

## Already done — do not redo

- Catalog self-buy blocked (`CANNOT_BUY_OWN_ITEM`); own items stay on Home with a YOURS chip
- Payout prompt after first listing; ship blocked with `PAYOUT_DETAILS_REQUIRED` until details exist
- Empty inbox threads hidden until the first message
- Sold-out corner chip
- `paid → in_escrow` on poll checkout **and** the Paystack webhook
- Confirm receipt: `shipped → delivered → released` (payout is not awaited)
- Ship-by miss: `cancelled` then `refundOrder`; listing relisted to `Active`
- Confirm/dispute hang: bounded undici pool + `503 ESCROW_BACKEND_TIMEOUT`
- C-CORE-6b reconciler injects `statusRepairPort`; `GET /internal/stuck-orders` includes `disputed`
- D10 reminders (buyer days 3/6, seller day 2); never for `disputed`
- Seller GET + Mark as shipped (409 `CONFLICT` = already done)
- Event-aware webhook idempotency (`charge.success` keeps `paystack:<ref>`; other events `paystack:<event>:<ref>`)
- Refund webhook reference fallback (`reference` → `transaction_reference` → `transaction.reference`)

---

## Carried forward (not Phase 3 blockers)

| Item | Why it waits | Owner |
|------|----------------|-------|
| Enable **Transfers** (`PAYSTACK_TRANSFERS_ENABLED=true`) | Starter / unregistered Paystack business cannot third-party payout | John |
| `transfer.*` going live | Same as Transfers; handlers already route `transfer.success\|failed\|reversed` | Felix + John |
| EAS `projectId` | Expo push is a no-op until a project exists (C-NOTIF-2 token capture is already wired) | Shannon + John |
| Server-priced checkout | Client still sends amounts | later |
| Optional: Supabase DB webhook → `POST /webhooks/orders` | Order-status trigger to the BFF | John |
| Device QA leftovers | Dashboard "Send test webhook" via `npm run tunnel:api`; checkout address prefill; disputed ON HOLD copy; confirm after laptop sleep | John (manual) |

Do **not** pick these up as leftover Phase 3 tickets:

- Cart minus-at-qty-1 polish, optimistic qty
- Inbox avatars / read receipts
- Automated dispute mediation (v1 is manual ops — [`DISPUTED_ORDERS_RUNBOOK.md`](./DISPUTED_ORDERS_RUNBOOK.md))
- Hiding own catalog from Home (items stay visible, not buyable)
- Payout backfill/retry while Transfers are off

### Local webhook (ngrok)

Paystack cannot hit `localhost`. With `npm run dev:api` running:

1. `ngrok config add-authtoken <token>` once, then `npm run tunnel:api`.
2. Paystack → **Settings → API Keys & Webhooks** → match **Test** vs **Live** Webhook URL to `sk_test_` vs `sk_live_`. URL = `https://<subdomain>.ngrok-free.app/webhooks/paystack`.
3. Signing uses `PAYSTACK_WEBHOOK_SECRET` if set, otherwise `PAYSTACK_SECRET_KEY`.
4. Done when a dashboard test logs on the API and Paystack records **200**.

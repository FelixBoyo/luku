# Member 4 (Shannon) — Commerce, inbox & AI UX

**Owner:** Shannon  
**Depends on:** Products (M2), cart schema (006), auth (M1)

> **Phase 2+:** Peer listing checkout — see [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md). Phase 0 focuses on catalog cart/checkout polish.

## Phase 0 — your status (Shannon)

**Wait for team go**, then branch `fix/m4-commerce-inbox-qa` from `zeus`.  
**Live dashboard:** [`PHASE0_STATUS.md`](./PHASE0_STATUS.md)

| ID | Status | What to do |
|----|--------|------------|
| M4-01 | Done | Cart tenant isolation — QA |
| M4-07 | Done | Removed fake "active now" |
| M4-08 | Done | Stylist → live AI API |
| M4-03 | Partial | Envelope OK; STK prompt missing — see M4-13 |
| M4-13 | **Pending — start here** | M-Pesa STK prompt + poll before order |
| M4-02 | Partial | Clear cart done; finish minus-at-1 UX |
| M4-11 | Pending | Optimistic cart +/- on `CartScreen.tsx` |
| M4-12 | Pending | Grey minus at qty 1 |
| M4-06 | Pending | Inbox avatar, time, unread badges |

**Do next (Shannon):**

1. `git checkout zeus && git pull` after team go.
2. **M4-13** — wait for STK prompt, poll payment status, then create order.
3. **Re-verify M4-03** — checkout without ApiError 201.
4. **M4-11 + M4-12** — fast cart UI; disabled minus at qty 1.
5. **M4-06** — inbox polish.
6. Run [`04_commerce_inbox_checklist.md`](../qa/04_commerce_inbox_checklist.md).

**Do not touch:** wardrobe/listings CRUD, wishlist catalog routes, auth screens.

---

## Original spec (reference)

## Dev environment

- Seed: `npm run db:seed`
- Login: `dev+buyer@luku.app` / `LukuDev2026!`
- API: `npm run dev:api`
- Mobile: `EXPO_PUBLIC_USE_MOCK_DATA=false`

## Tables in scope (`mobile-v1`)

- `cart_items`
- `orders`
- `inbox_threads`
- `inbox_messages`
- `inbox_thread_reads`

## Tables indirect

- `business_accounts` — `orders.seller_id` FK
- `create_order_with_stock_check` RPC (migration 006)
- `products` — cart lines reference `product_id`

## Do not use

- `returns`, `promotions` — web seller portal
- `listings` inbox context is optional; primary commerce is `products` + `orders`
- Realtime websockets (Phase 2b)

## Commerce model

Checkout uses **business marketplace `products`** + `orders` RPC. Peer `listings` checkout is out of scope for v1.

## Goal

Cart, checkout, orders, inbox, and Stylist AI consume Express APIs and existing payment routes.

## Mock data policy

Replace `createEmptyOrdersRepository`, `createEmptyInboxRepository`, and `createEmptyMessagesRepository` with `createApi*` in `repositories/index.ts` when your endpoints land. Cart bootstrap is empty when `USE_MOCK_DATA=false`. Do not import mocks in screens. See [`../../apps/mobile/docs/MOCK_DATA_POLICY.md`](../../apps/mobile/docs/MOCK_DATA_POLICY.md).

## Where to put code

| Layer | Path |
|-------|------|
| Routes | `backend/router/v1/cart.ts`, `orders.ts`, `inbox.ts`, `ai/outfitSuggestions.ts` |
| Services | `backend/services/cartService.ts`, `ordersService.ts`, `inboxService.ts` |
| AI | Extend stub in `backend/router/v1/ai/outfitSuggestions.ts` — [`AI_PROVIDER.md`](../architecture/AI_PROVIDER.md) |
| Mobile | Cart, Payment, Orders, OrderTracking, Commerce, Inbox, Conversation, Stylist, Notifications |
| Payments | Reuse `/v1/api/payments/*` via `apiClient` |

## Reference (platform gate)

- `POST /v1/api/ai/outfit-suggestions` — **stub** live; replace with real task

## Legacy reference

- `apps/web-legacy/store/slices/cartSlice.ts`, `ordersSlice.ts`
- `apps/web-legacy/services/paystackService.ts`, `mpesaService.ts`

## Tasks

- [ ] Cart CRUD API + AppStateContext migration
- [ ] Order create via `create_order_with_stock_check` + OrderTracking list
- [ ] Payment screen → existing payment endpoints
- [ ] Inbox list + Conversation messages (REST)
- [ ] Replace AI stub with `backend/ai/tasks/outfitSuggestions.ts`
- [ ] Notifications list endpoint

## Acceptance

- [ ] Add to cart persists; checkout reaches payment
- [ ] Order appears in Commerce purchases
- [ ] Stylist loads suggestions from task API (not mock)
- [ ] Inbox shows threads from API

## Out of scope

Virtual try-on, business seller portal, `web-legacy` tables, websockets

## Remediation

Post-merge fixes: [`../qa/ZEUS_REMEDIATION.md`](../qa/ZEUS_REMEDIATION.md) § M4

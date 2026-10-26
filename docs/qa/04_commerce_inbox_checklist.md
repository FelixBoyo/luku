# Member 4 (Commerce, Inbox & AI UX) — QA Checklist

**Remediation tracker:** [`ZEUS_REMEDIATION.md`](./ZEUS_REMEDIATION.md) § M4 · [`PHASE0_STATUS.md`](../team/PHASE0_STATUS.md)

### Your next manual tests (Shannon)

1. **M4-13** — M-Pesa: real `254…` number → STK prompt on phone; app shows "Check your phone…" and **polls** before creating order.
2. **M4-03** — Checkout M-Pesa: no `ApiError: 201` *(partial pass — envelope OK)*.
3. **M4-11/12** — Cart +/- feels instant; minus **disabled/grey** at qty 1.
4. **M4-01** — Logout → login as other user → cart empty *(Done via PLT-01; re-verify)*.

This document covers automated checks, checkout, inbox, and Stylist AI under `EXPO_PUBLIC_USE_MOCK_DATA=false`.

---

## 1. Automated Verification Checks

Before running manual scripts, ensure the codebase passes automated criteria:

- [ ] **Contract Typecheck**: Run `npm run typecheck:contracts`. Must compile without errors.
- [ ] **BFF API Vitest Suite**: Run `npx vitest run backend/`. Verify all tests (73 total) pass.
- [ ] **API Platform Gate Validation**: Start the backend server (`npm run dev:api`) and run `npm run verify:gate`.

---

## 2. Manual Verification Checklist (Mobile App)

Ensure Metro and the backend API server are running locally with mock data disabled (`EXPO_PUBLIC_USE_MOCK_DATA=false`).

### 2.1 Cart CRUD Operations
*   **Tenant Isolation & Persistence**
    - [✔️] Add multiple products to the cart from the marketplace/discover.
    - [✔️] Verify that items are persisted to the backend API (`GET /v1/api/cart`) and link correctly with product tables (name, size, price, image).
    - [✔️] Log out, log in as a different user, and verify that the second user's cart is empty *(M4-01 — Done on integration branch; re-verify after team go)*
*   **Quantity Modification & Deletion**
    - [✔️] Update item quantities using the plus/minus buttons; verify the changes persist.
    - [ ] Reduce an item's quantity using minus at qty 1 — minus should be **disabled/grey**; use Remove - currently does not indicate that it is disabled  *(M4-12)*
    - [ ] Click remove/delete on a line — item removed from cart and API
    - [✔️] Click "Clear Cart" — all rows purged *(M4-02 partial — verify)*
    - [✔️] Cart +/- updates UI **immediately** before API completes *(M4-11)*

### 2.2 Payment & Checkout Flow
*   **Billing Details & Method Selection**
    - [ ] Populate shipping address fields (Name, Street, City, Postal, Phone).
    - [ ] Select payment method: **Card** (processed via Paystack Charge) or **M-Pesa** (processed via Paystack/M-Pesa STK Push).
*   **Payment Execution**
    - [ ] Trigger the payment action.
    - [ ] For Card payment, verify loading state and successful confirmation page redirect.
    - [ ] For M-Pesa, verify STK push sends prompt to phone *(M4-13 — **fails**: no prompt observed in smoke)*
    - [ ] App shows "Check your phone and approve the M-Pesa prompt" and polls `GET /v1/api/payments/mpesa/requests/:id`
    - [ ] Order **not** created until M-Pesa status is success *(today: order created immediately after POST)*
*   **Checkout Completion Side Effects**
    - [ ] Confirm that the user's cart is automatically cleared from the backend database upon a successful checkout.
    - [ ] Confirm that orders are correctly created in the `orders` database table.

### 2.3 Orders & Delivery Tracking
*   **Grouping & Purchase History**
    - [ ] Navigate to the Profile -> Purchase History screen.
    - [ ] Verify that individual order lines with identical transaction references (mapped via `stripe_payment_intent_id`) are grouped as single orders.
    - [ ] Verify totals reflect `subtotal + 16% VAT + 500 KES flat-rate shipping` matching the backend calculation.
*   **Stepper Timeline Tracking**
    - [ ] Click on order details; check the horizontal progress stepper labels (`Placed`, `Confirmed`, `Shipped`, `Delivered`).
    - [ ] Verify step highlighting matches the order's status retrieved from the database (e.g., delivered order highlights all 4 stages with delivery date).

### 2.4 Inbox & Real-time Messaging
*   **Threads List Experience**
    - [✔️] Load the Inbox view; verify threads load from `GET /v1/api/inbox/threads`.
    - [✔️] Confirm threads display recipient name and preview *(avatar, relative time, unread — M4-06 pending)*
    - [✔️] "Active now" presence removed if not implemented *(M4-07 — Done)*
*   **Conversation & Read Receipts**
    - [ ] Select a thread to view message history. Verify user participation is authorized.
    - [✔️] Send a message; verify that it persists and immediately appends to the conversation view.
    - [❌] Confirm that opening an unread conversation updates the read receipt (`POST /v1/api/inbox/threads/:threadId/read`) and clears the inbox badge.

### 2.5 Stylist AI Suggestions

*   **Occasion & Style Preference Queries**
    - [✔️] Stylist calls `POST /v1/api/ai/outfit-suggestions` *(M4-08 — Done; verify outfits render)*
    - [ ] Open Stylist; select occasion — recommendations load from API
    - [ ] Verify the response returns 3 distinct outfits with custom names, cohesive item choices, and description rationales.
*   **Wardrobe Constraints & Fallback Checks**
    - [ ] Test suggestion loading with an empty user wardrobe; verify the system builds prompts using the fallback default wardrobe without crashing.
    - [ ] Test the interface's behavior under AI timeouts/network failures; confirm a safe fallback outfit is returned to ensure a premium user experience.

---

## 3. Session Log Template

| Test Case | Scenario / Step | Input Data | Observed Behavior | Status (Pass/Fail) |
|---|---|---|---|---|
| **M4-01** | Add product to cart | Product ID: `prod_abc`, Qty: `1` | | |
| **M4-02** | Increment quantity to 3 | Qty: `3` | | |
| **M4-03** | Checkout with M-Pesa | Real `254…` phone, Paystack keys in `.env.local` | No ApiError 201; STK prompt + poll before order *(M4-13)* | |
| **M4-04** | Check Purchase History | Order ID: `pi_test_123` | | |
| **M4-05** | Load Inbox Threads | User ID: `user_123` | | |
| **M4-06** | Send Chat Message | Thread ID: `thread_abc`, Body: `"Hello"` | | |
| **M4-07** | Query AI Stylist | Occasion: `"Dinner"`, Wardrobe: `Empty` | | |

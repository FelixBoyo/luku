# Zeus remediation — task tracker

**Live status:** [`../team/PHASE0_STATUS.md`](../team/PHASE0_STATUS.md)  
**Program roadmap:** [`../team/TEAM_ROADMAP.md`](../team/TEAM_ROADMAP.md)  
**John pre-flight:** [`../team/TEAM_GO_CHECKLIST.md`](../team/TEAM_GO_CHECKLIST.md)

**Goal:** Close P0/P1 QA failures on `zeus` without cross-member merge conflicts.

---

## Quick links

| Member | Section | Branch | QA doc |
|--------|---------|--------|--------|
| Platform — John | [§ Platform](#platform--integration-john) | `fix/zeus-integration` | — |
| M1 — John | [§ M1](#m1--john-auth-profile-social) | `fix/m1-auth-profile-qa` | [`M1_QA_CHECKLIST.md`](../team/M1_QA_CHECKLIST.md) |
| M2 — Brian | [§ M2](#m2--brian-catalog--discovery) | `fix/m2-catalog-qa` | [`02_member_catalog_checklist.md`](./02_member_catalog_checklist.md) |
| M3 — Felix | [§ M3](#m3--felix-wardrobe-outfits-peer-listings) | `fix/m3-wardrobe-sell-qa` | [`03_MEMBER_WARDROBE_SELL.md`](../team/03_MEMBER_WARDROBE_SELL.md) |
| M4 — Shannon | [§ M4](#m4--shannon-cart-checkout-orders-inbox-stylist) | `fix/m4-commerce-inbox-qa` | [`04_commerce_inbox_checklist.md`](./04_commerce_inbox_checklist.md) |

---

## How to read status

| Status | Meaning |
|--------|---------|
| **Done** | On `fix/zeus-integration`; merges with platform PR |
| **Verify** | Code present — run manual QA |
| **Partial** | Incomplete — finish in member branch |
| **Pending** | Not started — member work after team go |

**Status legend in tables below uses these values.**

---

## FAQ

**Two commerce tracks?**  
**Catalog** = `products` + `business_accounts` (Discover, checkout today). **Peer** = `listings` from wardrobe (sell flow; no checkout until Phase 2). See [`TEAM_ROADMAP.md`](../team/TEAM_ROADMAP.md) commerce FAQ.

**Why manual mark sold on listings?**  
Until peer checkout ships (Phase 2), sellers toggle sold manually. Catalog orders do not auto-sold listings.

**Add to cart behavior?**  
Toast + badge update; **do not** navigate to Cart automatically (M2-04).

**Who edits `repositories/index.ts`?**  
**John (platform) only.** Members ask for repo wiring via `[Platform]` PR.

**When can I branch?**  
**Now.** Platform PR is merged to `zeus`. `git checkout zeus && git pull`, then open your member fix branch per [`TEAM_ROADMAP.md`](../team/TEAM_ROADMAP.md).

**Why no M-Pesa prompt on my phone?**  
Paystack **test keys** may not send a real STK push. Even when the API returns 201, `CartScreen` creates the order immediately without showing `customerMessage` or polling payment status. See **M4-13** and [`integration-checklist.md`](../payments/integration-checklist.md) §4 M-Pesa flows.

**Wishlist shows "Loading…" and 0 KES?**  
API persist works (M2-01); display fails because BFF returns ids only and `wishlistRepository.ts` uses placeholders. Fix **M2-03**; duplicate key on toggle is **M2-05** (`ProductDetailScreen` similar items).

---

## Product decisions (locked)

| Topic | Decision |
|-------|----------|
| Peer listing sold | Manual until peer checkout |
| Add to cart | Toast + badge; no auto-navigate |
| Cart qty → 0 | Min qty 1; explicit Remove; Clear cart |
| Shipping | Hidden; buyer arranges delivery |
| Listed wardrobe items | Hide or badge Active; do not delete row |

**Execution steps:** [`ZEUS_EXECUTION_PLAN.md`](./ZEUS_EXECUTION_PLAN.md)

---

## Platform / integration — John

**Branch:** `fix/zeus-integration` — **merge before member branches**

| ID | Pri | Status | Task | File hint |
|----|-----|--------|------|-----------|
| PLT-01 | P0 | Done | Logout clears AppState; refetch on login | `AppStateContext.tsx` |
| PLT-02 | P0 | Done | Payment routes return envelope (no ApiError 201) | `backend/server.ts` |
| PLT-03 | P0 | Done | `repositories/index.ts` — all `createApi*` wired | `repositories/index.ts` |
| PLT-04 | P1 | Verify | Vitest / react module resolution | `package.json` |
| PLT-05 | P2 | Partial | Remove dev `console.log` | mobile API/screens |

### Do next — John (platform)

1. Run [`TEAM_GO_CHECKLIST.md`](../team/TEAM_GO_CHECKLIST.md) smoke tests.
2. Commit + PR `fix/zeus-integration` → `zeus`.
3. Post team go; set [`PHASE0_STATUS.md`](../team/PHASE0_STATUS.md) to OPEN.

---

## M1 — John (Auth, profile, social)

**Branch:** `fix/m1-auth-profile-qa` (after platform merge)  
**Spec:** [`01_MEMBER_AUTH_PROFILE.md`](../team/01_MEMBER_AUTH_PROFILE.md)

| ID | Pri | Status | Task | File hint |
|----|-----|--------|------|-----------|
| M1-01 | P0 | Done | Profile photo on Me | `EditProfileScreen.tsx`, `MeScreen.tsx` |
| M1-02 | P0 | Verify | Logout → Sign In | `AuthContext`, `App.tsx` |
| M1-03 | P1 | Pending | Unconfirmed login → Verify OTP | auth screens |
| M1-04 | P1 | Pending | Password reset flow | `PasswordResetScreen` |
| M1-05 | P1 | Pending | Seller UserProfile from product detail | `UserProfileScreen` |
| M1-06 | P2 | Pending | Follow tally instant on Connections | `ConnectionsScreen` |
| M1-07 | P2 | Pending | Seed blocked accounts | `database/seeds/` |
| M1-08 | P0 | Done | Logout cart reset (PLT-01) | — |

**Do not touch:** cart, orders, wishlist routes, wardrobe/listings, Discover feeds.

### Do next — John (M1)

1. Verify **M1-02** — logout lands on Sign In.
2. **M1-03** — unconfirmed email routes to Verify OTP.
3. **M1-05** — tap seller on ProductDetail → live profile.

---

## M2 — Brian (Catalog & discovery)

**Branch:** `fix/m2-catalog-qa`  
**Spec:** [`02_MEMBER_CATALOG.md`](../team/02_MEMBER_CATALOG.md)

| ID | Pri | Status | Task | File hint |
|----|-----|--------|------|-----------|
| M2-01 | P0 | Partial | Persist OK; display fails smoke — see M2-03 | `repositories/index.ts` (platform) |
| M2-04 | P1 | Done | Add to cart toast; no navigate | `ProductDetailScreen.tsx` |
| M2-07 | P1 | Pending | Remove duplicate Buy Now | `ProductDetailScreen.tsx` |
| M2-03 | P1 | Partial | Hydrate wishlist rows (name, price, image); sync all surfaces | `wishlistRepository.ts`, `WishlistScreen`, BFF join |
| M2-05 | P1 | Pending | Dedupe React keys — ProductDetail **Similar items** concat | `ProductDetailScreen.tsx` |
| M2-02 | P1 | Pending | Discover pagination / infinite scroll | `DiscoverScreen`, `bffProducts.ts` |
| M2-06 | P2 | Pending | BrandDetail / StyleDetail API feeds | `BrandDetailScreen`, `StyleDetailScreen` |

**Do not touch:** `CartScreen`, wardrobe/listings, inbox, payments.

### Do next — Brian

1. **M2-05** — dedupe `similar` product ids on ProductDetail (fixes duplicate key on heart toggle).
2. **M2-03** — hydrate wishlist from product API or BFF join (fix "Loading…" / 0 KES).
3. **M2-07** — delete Buy Now button; keep single Add to Cart.
4. Run [`02_member_catalog_checklist.md`](./02_member_catalog_checklist.md).

---

## M3 — Felix (Wardrobe, outfits, peer listings)

**Branch:** `fix/m3-wardrobe-sell-qa`  
**Spec:** [`03_MEMBER_WARDROBE_SELL.md`](../team/03_MEMBER_WARDROBE_SELL.md)

### P0

| ID | Status | Task | File hint |
|----|--------|------|-----------|
| M3-01 | Done | Block duplicate active listing | `listingsService.ts`, `createListing.ts` |
| M3-02 | Verify | Resume listing Draft → Active | `ListingDetailScreen.tsx` |
| M3-03 | Verify | Hide/badge listed items in wardrobe | `WardrobeScreen.tsx`, `MeScreen.tsx` |
| M3-04 | Verify | No duplicate wardrobe row after list | `WardrobeScreen.tsx` |
| M3-05 | Verify | Mark sold persists after reload | `ListingDetailScreen.tsx` |

### P1 / P2

| ID | Status | Task | File hint |
|----|--------|------|-----------|
| M3-14 | Pending | Spinner inside GradientButton | `ListForSaleSheet.tsx` |
| M3-06 | Pending | Button-level loading; silent refetch | wardrobe/outfit screens |
| M3-07 | Pending | Description on item + listing | `WardrobeItemDetail`, sell flow |
| M3-08 | Pending | Extra photo slots or disable honestly | sell form |
| M3-09 | Pending | Outfit picker keyboard dismiss | `CreateOutfitScreen` |
| M3-10 | Pending | Outfit cover preview | outfit screens |
| M3-11 | Pending | Skeletons on edit screens | edit screens |
| M3-12 | Pending | Double-tap guards | submit buttons |
| M3-13 | Pending | Remix inspiration seed or doc | outfits seed |

**Do not touch:** cart, orders, wishlist backend, payment, inbox.

### Do next — Felix

1. QA **M3-02–M3-05** — fix anything that fails verify.
2. **M3-14** — move loading into `GradientButton`; remove external spinner.
3. **M3-06** — button spinners on log wear / submit.

---

## M4 — Shannon (Cart, checkout, orders, inbox, stylist)

**Branch:** `fix/m4-commerce-inbox-qa`  
**Spec:** [`04_MEMBER_COMMERCE_INBOX.md`](../team/04_MEMBER_COMMERCE_INBOX.md)

### P0

| ID | Status | Task | File hint |
|----|--------|------|-----------|
| M4-01 | Done | Cart tenant isolation | PLT-01 |
| M4-02 | Partial | Delete line, qty min 1, Clear cart | `CartScreen.tsx` |
| M4-03 | Partial | Envelope OK (no ApiError 201); STK UX incomplete | `CartScreen.tsx`, payments |
| M4-04 | Done | PLT-02 coordination | — |
| M4-13 | Pending | M-Pesa STK prompt + poll status before `orders.create` | `CartScreen.tsx`, `stk-push.ts` |

### P1

| ID | Status | Task | File hint |
|----|--------|------|-----------|
| M4-11 | Pending | Optimistic cart +/- | `CartScreen.tsx` |
| M4-12 | Pending | Disable minus at qty 1 | `CartScreen.tsx` |
| M4-05 | Partial | Hide shipping; buyer delivery copy | `CartScreen.tsx` |
| M4-06 | Pending | Inbox avatar, time, unread, receipts | `InboxScreen`, `ConversationScreen` |
| M4-07 | Done | Remove "active now" | `ConversationScreen.tsx` |
| M4-08 | Done | Stylist → live AI API | `StylistScreen.tsx` |

### P2

| ID | Status | Task |
|----|--------|------|
| M4-09 | Pending | Orders grouping, VAT, tracking stepper |
| M4-10 | Pending | Card checkout full pass |

**Do not touch:** wardrobe/listings CRUD, wishlist catalog routes, auth screens.

### Do next — Shannon

1. **M4-13** — show "Check your phone…", poll `GET /v1/api/payments/mpesa/requests/:id`, block order until paid.
2. **Re-verify M4-03** — full checkout smoke with real `254…` number + Paystack keys.
3. **M4-11** — optimistic UI on +/- ; background API sync.
4. **M4-12** — grey out minus when qty is 1.
5. **M4-06** — inbox polish.
6. Run [`04_commerce_inbox_checklist.md`](./04_commerce_inbox_checklist.md).

---

## Backlog (after Phase 0)

| ID | Task | Owner |
|----|------|-------|
| BL-01 | Recommendation engine v1 | John + M2 |
| BL-02 | Escrow | M4 + John |
| BL-03 | Multi-photo galleries | M3 |
| BL-04 | Custom outfit cover | M3 |
| BL-05 | Peer checkout → auto sold | M4 + M3 |
| BL-06 | Rec on rails; Gemini for Stylist | John + M4 |

---

## Already working (regression)

- **M3:** Wardrobe CRUD, log wear, outfits, sell + quick-list, pause/edit/delete listing
- **M4:** Cart add/persist, qty update, inbox threads, send message
- **M1:** OTP register, session persist, bio edit, connections/block
- **M2:** Products from API; wishlist after M2-01

---

## Merge zones (do not cross)

| Zone | Paths |
|------|--------|
| M1 | `AuthContext`, auth screens, `profile*`, `connections*`, Me header |
| M2 | `DiscoverScreen`, `HomeScreen`, `ProductDetail`, `WishlistScreen`, `bffProducts`, `bffWishlist` |
| M3 | `Wardrobe*`, `Outfit*`, `Sell*`, `Listing*`, `ListItemModal`, listings routes |
| M4 | `CartScreen`, `Order*`, `Inbox*`, `Conversation*`, `StylistScreen`, payments |
| Platform | `apiClient.ts`, `repositories/index.ts`, logout ↔ AppState |

**Hot file:** `repositories/index.ts` — John only.

---

## PR template

```markdown
## Remediation PR — M{N}

Closes: M{N}-01, M{N}-02, …

### Checklist
- [ ] Only touched merge zone paths
- [ ] `npm run lint:mobile` passes
- [ ] Manual QA items re-tested
- [ ] No changes to other members' routes/services

### Regression
- [ ] …
```

**Title:** `[Phase0|M2] M2-07: Remove Buy Now duplicate`

---

## Sign-off record

| Field | Value |
|-------|-------|
| Integration branch | `fix/zeus-integration` — merged 2026-07-03 |
| Merged to `zeus` | 2026-07-03 |
| Team go posted | 2026-07-03 |
| All P0 closed | |
| Re-test date | |
| Signed off by | John |

**Phase 0 complete when:** all P0 Done or Verify-pass; member checklists re-run; [`PHASE0_STATUS.md`](../team/PHASE0_STATUS.md) updated.

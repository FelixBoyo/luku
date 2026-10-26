# Phase 0 — live status dashboard

**Last updated:** 2026-07-03 (team go OPEN)  
**Program:** [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md)  
**Detail / FAQ:** [`ZEUS_REMEDIATION.md`](../qa/ZEUS_REMEDIATION.md)

| Field | Value |
|-------|-------|
| **Team go** | **OPEN** — platform PR merged to `zeus`; members may branch |
| **Integration branch** | `fix/zeus-integration` → merged to `zeus` (2026-07-03) |
| **After team go** | Members branch from **`zeus`** only |

---

## How to read status

| Status | Meaning |
|--------|---------|
| **Done** | Merged to `zeus`; verify in member branch if needed |
| **Verify** | Code present — you must manual QA and mark pass/fail |
| **Partial** | Some acceptance criteria met; finish remaining in your branch |
| **Pending** | Not started — your work after team go |

---

## Platform — John

**Branch:** merged to `zeus` — members use their fix branches below

| ID | Pri | Status | Next action | File hint |
|----|-----|--------|-------------|-----------|
| PLT-01 | P0 | **Done** | On `zeus` | `AppStateContext.tsx` |
| PLT-02 | P0 | **Done** | On `zeus` | `backend/server.ts` |
| PLT-03 | P0 | **Done** | On `zeus` | `repositories/index.ts` |
| PLT-04 | P1 | **Verify** | Run `npm test` on `zeus` | `package.json` |
| PLT-05 | P2 | **Partial** | Grep remaining `console.log` in mobile API | `apiClient.ts`, screens |

**Platform merge:** complete (2026-07-03). Review member PRs for merge zones.

---

## M1 — John (after platform merge)

**Branch:** `fix/m1-auth-profile-qa`

| ID | Pri | Status | Next action | File hint |
|----|-----|--------|-------------|-----------|
| M1-01 | P0 | **Done** | QA: upload photo → shows on Me | `EditProfileScreen.tsx`, `MeScreen.tsx` |
| M1-02 | P0 | **Verify** | QA: logout lands on Sign In | `AuthContext`, `App.tsx` |
| M1-03 | P1 | Pending | Unconfirmed login → Verify OTP | auth screens |
| M1-04 | P1 | Pending | Password reset E2E | `PasswordResetScreen` |
| M1-05 | P1 | Pending | Seller profile from product detail | `UserProfileScreen`, `ProductDetailScreen` |
| M1-06 | P2 | Pending | Follow tally instant on Connections | `ConnectionsScreen` |
| M1-07 | P2 | Pending | Seed blocked accounts | `database/seeds/` |
| M1-08 | P0 | **Done** | Covered by PLT-01 | — |

---

## M2 — Brian (after team go)

**Branch:** `fix/m2-catalog-qa`

| ID | Pri | Status | Next action | File hint |
|----|-----|--------|-------------|-----------|
| M2-01 | P0 | **Partial** | Persist OK; display + keys fail smoke — see M2-03/M2-05 | `repositories/index.ts` |
| M2-04 | P1 | **Done** | QA: toast, stay on ProductDetail | `ProductDetailScreen.tsx` |
| M2-07 | P1 | **Pending** | Remove Buy Now button | `ProductDetailScreen.tsx` |
| M2-03 | P1 | **Partial** | Hydrate wishlist name/price/image (not "Loading…" / 0 KES) | `wishlistRepository.ts`, optional BFF join |
| M2-05 | P1 | **Pending** | **Start here:** dedupe ProductDetail `similar` keys | `ProductDetailScreen.tsx` |
| M2-02 | P1 | Pending | Discover infinite scroll / pagination | `DiscoverScreen`, `bffProducts.ts` |
| M2-06 | P2 | Pending | BrandDetail / StyleDetail API feeds | `BrandDetailScreen`, `StyleDetailScreen` |

**QA:** [`02_member_catalog_checklist.md`](../qa/02_member_catalog_checklist.md)

---

## M3 — Felix (after team go)

**Branch:** `fix/m3-wardrobe-sell-qa`

| ID | Pri | Status | Next action | File hint |
|----|-----|--------|-------------|-----------|
| M3-01 | P0 | **Done** | QA: duplicate active listing blocked | `listingsService.ts`, `createListing.ts` |
| M3-02 | P0 | **Verify** | QA: Draft → Active resume | `ListingDetailScreen.tsx` |
| M3-03 | P0 | **Verify** | QA: listed items hidden/badged in wardrobe | `WardrobeScreen.tsx`, `MeScreen.tsx` |
| M3-04 | P0 | **Verify** | QA: no duplicate wardrobe row after list | `WardrobeScreen.tsx` |
| M3-05 | P0 | **Verify** | QA: mark sold persists after reload | `ListingDetailScreen.tsx` |
| M3-14 | P1 | **Pending** | **Start here:** spinner in GradientButton | `ListForSaleSheet.tsx` |
| M3-06–13 | P1/P2 | Pending | Polish per remediation table | see [`ZEUS_REMEDIATION.md`](../qa/ZEUS_REMEDIATION.md) |

**QA:** [`03_MEMBER_WARDROBE_SELL.md`](./03_MEMBER_WARDROBE_SELL.md) manual pass

---

## M4 — Shannon (after team go)

**Branch:** `fix/m4-commerce-inbox-qa`

| ID | Pri | Status | Next action | File hint |
|----|-----|--------|-------------|-----------|
| M4-01 | P0 | **Done** | QA: cart empty after user switch | PLT-01 + `CartScreen.tsx` |
| M4-04 | P0 | **Done** | PLT-02 merged | — |
| M4-07 | P1 | **Done** | QA: no fake "active now" | `ConversationScreen.tsx` |
| M4-08 | P1 | **Done** | QA: Stylist hits live API | `StylistScreen.tsx` |
| M4-02 | P0 | **Partial** | Finish: minus disabled at qty 1 (M4-12) | `CartScreen.tsx` |
| M4-03 | P0 | **Partial** | Envelope OK (no ApiError 201); STK prompt missing — see M4-13 | `CartScreen.tsx`, payments |
| M4-13 | P0 | **Pending** | **Start here:** M-Pesa wait for STK + poll status before order | `CartScreen.tsx`, `stk-push.ts` |
| M4-05 | P1 | **Partial** | Confirm shipping copy + hidden methods | `CartScreen.tsx` |
| M4-11 | P1 | **Pending** | Optimistic cart +/- | `CartScreen.tsx` |
| M4-12 | P1 | **Pending** | Grey minus at qty 1; use Remove | `CartScreen.tsx` |
| M4-06 | P1 | Pending | Inbox avatar, time, unread badges | `InboxScreen`, `ConversationScreen` |
| M4-09–10 | P2 | Pending | Orders grouping; card checkout pass | `Order*` screens |

**QA:** [`04_commerce_inbox_checklist.md`](../qa/04_commerce_inbox_checklist.md)

---

## Open P0 summary (must close for Phase 0 sign-off)

| Owner | Open P0 |
|-------|---------|
| John (platform) | PLT-04 verify |
| John (M1) | M1-02 verify |
| Brian | M2-03 partial, M2-05 (P1 — smoke blockers before sign-off) |
| Felix | M3-02–05 verify (QA pass or fix) |
| Shannon | M4-02 partial, M4-03 partial, **M4-13**, M4-11/12 |

---

## Regression — do not break

- **M1:** OTP register, session persist, bio edit, connections/block basics
- **M2:** Products load from API; wishlist toggle (after M2-01)
- **M3:** Wardrobe CRUD, log wear, outfits, sell + quick-list, pause/edit/delete listing
- **M4:** Cart add/persist, qty update, inbox threads, send message

---

## Sign-off log

| Event | Date | Notes |
|-------|------|-------|
| Integration branch ready | 2026-07-03 | `fix/zeus-integration` |
| Merged to `zeus` | 2026-07-03 | PR merged |
| Team go posted | 2026-07-03 | Banner **OPEN** — members may branch |
| All P0 closed | | |
| Phase 0 complete | | |

---

## Changelog

| Date | Change |
|------|--------|
| 2026-07-03 | Initial audit from `fix/zeus-integration` working tree |
| 2026-07-03 | Team go OPEN after platform PR merge to `zeus` |

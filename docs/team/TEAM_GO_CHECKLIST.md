# Team go checklist — John only

Run this **before** posting "team go" to Brian, Felix, and Shannon.

**Related:** [`PHASE0_STATUS.md`](./PHASE0_STATUS.md) · [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md) · [`ZEUS_EXECUTION_PLAN.md`](../qa/ZEUS_EXECUTION_PLAN.md)

---

## 1. Automated checks (repo root)

```bash
npm install
npm run lint:mobile
npm run verify:deps
npm test
```

- [x] All commands pass on `fix/zeus-integration` (2026-07-03)

Optional (API running):

```bash
npm run dev:api   # separate terminal
npm run verify:gate
```

---

## 2. Manual smoke (integration mode)

Mobile: `EXPO_PUBLIC_USE_MOCK_DATA=false`, API on LAN IP.

| Test | ID | Steps | Pass |
|------|-----|-------|------|
| Logout cart reset | PLT-01 | Login buyer → add to cart → logout → login seller → cart **empty** → logout → login buyer → cart restores | ✔️ |
| Add to cart UX | M2-04 | ProductDetail → Add to Cart → **toast**, stay on screen, badge updates | ✔️ |
| Checkout envelope | M4-03 | Cart → checkout → M-Pesa STK → **no** `ApiError: 201` in console | Partial |
| M-Pesa STK prompt | M4-13 | Cart → M-Pesa → real `254…` phone → **STK prompt appears** on device | Fail |
| Wishlist wired | M2-01 | Toggle wishlist on ProductDetail → persists after app reload | Partial |

### Smoke findings (2026-07-03 — `fix/zeus-integration`)

Record before team go. Update [`PHASE0_STATUS.md`](./PHASE0_STATUS.md) when fixed.

#### Wishlist (M2-01 / M2-03 / M2-05)

- **Pass:** Heart toggles; item persists in DB; tab count updates.
- **Fail — duplicate key:** LogBox: `Encountered two children with the same key` (e.g. `c0000001-…-007`). **Cause:** `ProductDetailScreen` **Similar items** — category filter + concat duplicates the same `p.id`. **Fix: M2-05** (Brian).
- **Fail — display:** Me → Wishlist shows **"Loading…"** and **0 KES** despite saved item. **Cause:** BFF returns `{ productId, addedAt }` only; `createApiWishlistRepository` maps placeholders (`name: 'Loading...'`, `price: 0`). **Fix: M2-03** (Brian).

#### M-Pesa checkout (M4-03 / M4-13)

- **Pass:** No `ApiError: 201` in console; checkout may reach complete step.
- **Fail — no phone prompt:** STK push API succeeds but **no M-Pesa PIN prompt** on device. **Cause:** `CartScreen.tsx` `handlePlaceOrder` creates the order immediately after POST returns — no `customerMessage` UI, no poll of `GET /v1/api/payments/mpesa/requests/:id`. **Fix: M4-13** (Shannon).
- **Also check:** `PAYSTACK_SECRET_KEY` in `.env.local` (test vs live); real Safaricom number (not seed placeholder `0712345678` only); [`docs/payments/secrets.md`](../payments/secrets.md) and [`integration-checklist.md`](../payments/integration-checklist.md) §4 M-Pesa flows.

---

## 3. Git / PR

```bash
git checkout fix/zeus-integration
git status   # review changed files — platform + bundled fixes only
```

- [x] All intended files staged (no `.env.local`, no secrets)
- [x] Commit with message e.g. `fix(platform): zeus integration PLT-01–03 + remediation bundle`
- [x] Push branch
- [x] Open PR: **`fix/zeus-integration` → `zeus`**
- [x] PR description lists: PLT IDs closed, member fixes included, files **not** touched
- [ ] Optional: Brian or Shannon smoke review on PR branch
- [x] Merge to `zeus` (2026-07-03)

---

## 4. After merge — update docs

- [x] [`PHASE0_STATUS.md`](./PHASE0_STATUS.md) — set **Team go: OPEN**
- [x] [`PHASE0_STATUS.md`](./PHASE0_STATUS.md) — fill "Merged to zeus" date (2026-07-03)
- [x] [`TEAM_ROADMAP.md`](./TEAM_ROADMAP.md) — update team go banner

---

## 5. Announce team go

Copy/paste (Slack / WhatsApp / email):

```
Team go on zeus.

1. git checkout zeus && git pull
2. Read docs/team/TEAM_ROADMAP.md → your member card (Brian / Felix / Shannon)
3. Check docs/team/PHASE0_STATUS.md for what's already done vs your next tasks
4. Branch:
   - Brian: fix/m2-catalog-qa
   - Felix: fix/m3-wardrobe-sell-qa
   - Shannon: fix/m4-commerce-inbox-qa
5. EXPO_PUBLIC_USE_MOCK_DATA=false, seed dev+buyer@luku.app / LukuDev2026!
6. Before PR: npm run lint:mobile + your QA checklist

Platform work is merged. Do not edit repositories/index.ts without tagging me.
```

---

## 6. Your next work (after announce)

- [ ] Branch `fix/m1-auth-profile-qa` off `zeus`
- [ ] M1-02 verify + M1-03–05 as time allows
- [ ] Review member PRs for merge zone violations

---

## Changelog

| Date | Event |
|------|-------|
| 2026-07-03 | Checklist created |
| 2026-07-03 | Smoke findings: wishlist M2-03/M2-05; M-Pesa M4-13 |
| 2026-07-03 | Platform PR merged to `zeus`; team go OPEN |

# Member 2 (Catalog & Discovery) — QA Checklist

**Remediation tracker:** [`ZEUS_REMEDIATION.md`](./ZEUS_REMEDIATION.md) § M2 · [`PHASE0_STATUS.md`](../team/PHASE0_STATUS.md)

### Your next manual tests (Brian)

1. **M2-05** — Toggle wishlist on ProductDetail → **no** duplicate key LogBox error.
2. **M2-03** — Me → Wishlist shows real name/price/image (not "Loading…" / 0 KES).
3. **M2-07** — ProductDetail has **one** Add to Cart button (no Buy Now duplicate).
4. **M2-04** — Add to cart shows toast; does **not** navigate to Cart tab.

**Spec:** [`../team/02_MEMBER_CATALOG.md`](../team/02_MEMBER_CATALOG.md)  
**Scope:** Business marketplace `products` + `wishlist` — **not** peer `listings` (M3), cart/orders (M4), or wardrobe.

---

## Prerequisites

```bash
# Repo root
npm install
npm run db:migrate          # includes 007_update_search_rpc.sql (M2)
npm run db:seed
npm run dev:api

# Mobile
cd apps/mobile
# EXPO_PUBLIC_USE_MOCK_DATA=false
# EXPO_PUBLIC_API_BASE_URL=http://<LAN-IP>:3001
npm run start
```

| Field | Value |
|-------|-------|
| Test account | `dev+buyer@luku.app` / `LukuDev2026!` |
| Seed products | 8 business catalog items (`c0000001-…`) |
| Seed wishlist | 2 items for buyer |
| Second account (tenant test) | `dev+seller@luku.app` / `LukuDev2026!` |

---

## 1. Post-merge integration checks (before manual UI)

- [ ] M2 PR merged to `zeus`; local branch pulled
- [ ] **`repositories/index.ts`** — when `USE_MOCK_DATA=false`:
  - [ ] `products: createApiProductsRepository()`
  - [ ] `wishlist: createApiWishlistRepository()` (**not** `createEmpty*`)
- [ ] **`backend/router/v1/index.ts`** mounts `wishlist` router
- [ ] No duplicate keys in `repositories/index.ts` (M3/M4 repos still `createApi*` for wardrobe, listings, inbox, orders, etc.)
- [ ] **`npm run lint:mobile`** passes
- [ ] **`npm run typecheck:contracts`** passes
- [ ] **`npm run verify:no-direct-mock-imports`** passes
- [ ] **`npm run verify:no-mobile-supabase`** passes

---

## 2. API verification (optional but recommended)

With API running and buyer bearer token:

### Products

- [ ] `GET /v1/api/products` — returns paginated seed catalog
- [ ] `GET /v1/api/products?page=1&limit=4` — pagination metadata (`pages`, `total`)
- [ ] `GET /v1/api/products?category=Tops` — filtered results
- [ ] `GET /v1/api/products?search=denim` — search works
- [ ] `GET /v1/api/products?minPrice=5000&maxPrice=10000` — price filter works
- [ ] `GET /v1/api/products/:id` — valid id returns product; invalid id → 404

### Wishlist (auth required)

- [ ] `GET /v1/api/wishlist` — returns buyer’s 2 seeded items
- [ ] `POST /v1/api/wishlist/:productId` — adds item; second GET includes it
- [ ] `DELETE /v1/api/wishlist/:productId` — removes item; persists after reload
- [ ] Log in as **different user** — wishlist empty or only their rows (tenant isolation)

---

## 3. Manual mobile checklist (`EXPO_PUBLIC_USE_MOCK_DATA=false`)

### 3.1 Discover (primary deliverable)

- [✔️] Discover tab loads **live products** (not empty skeleton forever)
- [✔️] Masonry grid shows product cards with image, name, price
- [✔️] **Scroll to bottom** loads more products (pagination / infinite scroll)
- [✔️] **Filters** (category, size, price via bottom sheet) change the feed
- [✔️] **Search** (items mode) filters products correctly
- [❌] Search modes **profiles / brands / styles** still work
- [❌] Bookmark on card toggles wishlist heart state
- [✔️] Tapping card opens **ProductDetail** with correct product

### 3.2 Home & Trending

- [✔️] Home trending / product rails show API products
- [❌] Heart on Home product toggles wishlist
- [✔️] “See all” → TrendingScreen shows live catalog

### 3.3 Product detail

- [ ] ProductDetail loads by id from API
- [ ] Invalid product id shows not-found empty state (not mock fallback)
- [ ] Heart toggle on ProductDetail persists after leaving and returning
- [ ] Add to cart shows **toast** and stays on ProductDetail *(M2-04 — Done on integration branch; verify)*
- [ ] **Only one** purchase button — Add to Cart only, no duplicate Buy Now *(M2-07 — Pending)*
- [ ] Add to cart still works (M4 regression)

### 3.4 Wishlist sync (cross-surface)

- [ ] **Me → Wishlist tab** shows seeded + newly hearted items with **real name, price, image** *(M2-03 — fails: "Loading…" / 0 KES)*
- [ ] **WishlistScreen** lists same items with search
- [ ] Heart on Discover → item appears on Me wishlist + WishlistScreen
- [ ] Un-heart on any surface removes from all surfaces after refresh
- [ ] **Kill app / re-login** — wishlist matches server (not only AsyncStorage)
- [ ] Toggle heart on ProductDetail → **no** duplicate React key warning *(M2-05 — fails on Similar items)*

### 3.4.1 Known smoke failures (2026-07-03)

| ID | Symptom | Root cause | File hint |
|----|---------|------------|-----------|
| M2-03 | "Loading…", 0 KES on wishlist rows | BFF returns ids only; repo placeholders | `wishlistRepository.ts` |
| M2-05 | Duplicate key on heart toggle | Similar items concat duplicates `p.id` | `ProductDetailScreen.tsx` |

### 3.5 Brand & style detail

- [ ] BrandDetail / StyleDetail product feeds use API products
- [❌] Wishlist toggle works on those cards

---

## 4. Acceptance criteria (from team spec)

- [✔️] Discover loads live products with filters
- [❌] Wishlist toggle persists server-side
- [ ] ProductDetail loads by id from API
- [ ] `cd apps/mobile && npm run lint:check` passes

---

## 5. Out of scope (do not fail M2 on these)

- Cart checkout, orders, inbox (M4)
- Peer listings / Sell flow (M3)
- Wardrobe, outfits (M3)
- Stylist AI (M4)
- Business seller portal UI

---

## 6. Known merge risks on `zeus`

When merging M2 **after** M3/M4 are already on `zeus`, verify:

| File | Expected after clean merge |
|------|---------------------------|
| `repositories/index.ts` | `wishlist` → API **and** M3/M4 domains still API |
| `backend/router/v1/index.ts` | Both `wishlist` + cart/orders/inbox routes |
| `AppStateContext.tsx` | Wishlist uses `repositories.wishlist.toggle`; cart uses API (M4) |

If hearts “work” locally but **Me wishlist stays empty**, check `createEmptyWishlistRepository` was not left in `index.ts`.

---

## 7. Session log template

| ID | Scenario | Steps | Expected | Pass/Fail |
|----|----------|-------|----------|-----------|
| M2-01 | Discover initial load | Open Discover | Seed products visible | |
| M2-02 | Infinite scroll | Scroll to bottom | More products load | |
| M2-03 | Category filter | Filter → Tops | Feed updates | |
| M2-04 | Price filter | Under 5,000 KES | Only matching items | |
| M2-05 | Heart on Discover | Bookmark product | Filled heart | |
| M2-06 | Wishlist persistence | Me → Wishlist | Same product listed | |
| M2-07 | Restart app | Kill + reopen, login | Wishlist unchanged | |
| M2-08 | Tenant isolation | Login as seller2 | Different/empty wishlist | |
| M2-09 | ProductDetail | Tap product | Correct detail from API | |
| M2-10 | Invalid product | Bad id in nav | Not found state | |

---

## 8. Sign-off record

| Field | Value |
|-------|-------|
| Tester | |
| Date | |
| Branch | `zeus` after M2 PR merge |
| M2 PR | |
| Lint | `npm run lint:mobile` |

**M2 accepted when:** integration checks pass, acceptance criteria met, no P0 failures in sections 3–4.

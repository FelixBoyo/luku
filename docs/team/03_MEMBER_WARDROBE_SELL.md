# Member 3 (Felix) — Wardrobe, outfits & seller

**Owner:** Felix  
**Depends on:** Auth (M1), migrations 004–005 (applied)

## Phase 0 — your status (Felix)

**Wait for team go**, then branch `fix/m3-wardrobe-sell-qa` from `zeus`.  
**Live dashboard:** [`PHASE0_STATUS.md`](./PHASE0_STATUS.md)

| ID | Status | What to do |
|----|--------|------------|
| M3-01 | Done | Duplicate listing guard — QA |
| M3-02–05 | Verify | Manual pass resume, hide listed, no dup row, sold persists |
| M3-14 | **Pending — start here** | Spinner in `GradientButton` on `ListForSaleSheet.tsx` |
| M3-06–13 | Pending | P1 polish after P0 verify |

**Do next (Felix):**

1. `git checkout zeus && git pull` after team go.
2. Run manual QA for **M3-02–M3-05**; fix failures first.
3. **M3-14** — remove external `ActivityIndicator`; use `GradientButton` `loading`.
4. **M3-06** — button spinners on log wear / list submit.

**Do not touch:** cart, orders, wishlist routes, payments.

---

## Original spec (reference)

## Dev environment

- Seed: `npm run db:seed` (includes sample `wardrobe_items`, `listings`)
- Login: `dev+buyer@luku.app` / `LukuDev2026!`
- API: `npm run dev:api`
- Mobile: `EXPO_PUBLIC_USE_MOCK_DATA=false`

## Tables in scope (`mobile-v1`)

- `wardrobe_items`
- `wardrobe_wear_log`
- `outfits`
- `outfit_pieces`
- `listings`

## Tables indirect

- `wardrobe-images` storage bucket (migration 008)

## Do not use (`web-legacy`)

- `clothing_items`, `outfit_items`, `albums`, `album_outfits` — mobile uses `wardrobe_items` / `outfit_pieces`
- Do **not** port `albumsSlice` or web wardrobe upload paths verbatim

## Commerce model

**Peer resale** — `listings` published from closet (`wardrobe_items`). Distinct from M2 **`products`** (business marketplace).

## Goal

Wardrobe inventory, outfits, and listings persist via Express; Sell flow publishes listings.

## Mock data policy

Replace `createEmptyWardrobeRepository`, `createEmptyOutfitsRepository`, and `createEmptyListingsRepository` with `createApi*` in `repositories/index.ts` when your endpoints are live. Screens must not import `data/mock/`. See [`../../apps/mobile/docs/MOCK_DATA_POLICY.md`](../../apps/mobile/docs/MOCK_DATA_POLICY.md).

## Where to put code

| Layer | Path |
|-------|------|
| Routes | `backend/router/v1/wardrobe.ts`, `outfits.ts`, `listings.ts`, `uploads.ts` |
| Services | `backend/services/wardrobeService.ts`, etc. |
| Storage | `wardrobe-images` bucket — signed upload URLs |
| Mobile repos | `wardrobeRepository`, `outfitsRepository`, `listingsRepository` |
| Screens | Wardrobe, WardrobeItemDetail, SavedOutfits, OutfitDetail, CreateOutfit, Sell, ListingDetail, ListItemModal |

## Legacy reference

- `apps/web-legacy/store/slices/wardrobeSlice.ts` — **field ideas only**; target `wardrobe_items` not `clothing_items`
- Port Gemini wardrobe analyze to `backend/ai/tasks/` (not mobile)

## Database

[`SCHEMA.md`](../database/SCHEMA.md), [`TABLE_SCOPE.md`](../database/TABLE_SCOPE.md) — migrations 004, 005, 008 applied.

## Tasks

- [ ] Wardrobe CRUD + log-wear
- [ ] Outfits created / inspirations (`outfit_pieces`)
- [ ] Listings create, update, sold/pause/delete
- [ ] Image upload via signed URL endpoint (`wardrobe-images`)
- [ ] `AppStateContext.refreshWardrobe/refreshOutfits` call API repos
- [ ] Sell publish → ListingConfirmation with real id

## Acceptance

- [ ] Wardrobe grid shows API items
- [ ] FAB add item persists
- [ ] Sell flow creates listing visible on Me
- [ ] Outfit save/remix works across tabs

## Out of scope

Payments, inbox, stylist AI UI (M4), `products` catalog (M2)

## Remediation

Post-merge fixes: [`../qa/ZEUS_REMEDIATION.md`](../qa/ZEUS_REMEDIATION.md) § M3 · [`PHASE0_STATUS.md`](./PHASE0_STATUS.md)

### Your next manual tests (Felix)

1. **M3-02–05** — Run full P0 pass: resume listing, hide listed in wardrobe, no dup row, sold persists.
2. **M3-14** — List for sale: spinner only inside button, not below.
3. **M3-01** — Quick-list same item twice → blocked with clear error.

| ID | Scenario | Pass |
|----|----------|------|
| M3-01 | Duplicate active listing blocked | [ ] |
| M3-02 | Draft → Active resume | [ ] |
| M3-03 | Listed item hidden/badged in wardrobe | [ ] |
| M3-04 | No duplicate wardrobe row after list | [ ] |
| M3-05 | Mark sold survives reload | [ ] |
| M3-14 | ListForSaleSheet button loading UX | [ ] |

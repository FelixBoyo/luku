# Phase 2 member spec template

Copy this template for each Phase 2 workstream. **Do not distribute** until:

1. [`QA_SIGNOFF.md`](QA_SIGNOFF.md) — no open P0 items
2. [`PHASE1_INVENTORY.md`](PHASE1_INVENTORY.md) — routes assigned
3. [`PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md) — locked
4. [`REDUX_EXPRESS_ARCHITECTURE.md`](REDUX_EXPRESS_ARCHITECTURE.md) — ported from reference project (not placeholder)

---

## Spec: _[Wave name, e.g. W4 Cart + Wishlist]_

| Field | Value |
|-------|-------|
| **Owner** | _name_ |
| **Wave** | W1 \| W2 \| W3 \| W4 \| W5 \| W6 |
| **Reviewers** | _names_ |
| **Target sprint** | _dates_ |

### 1. Goal

_One paragraph: what ships and why._

### 2. Screens in scope

From [`PHASE1_INVENTORY.md`](PHASE1_INVENTORY.md):

| Route | Changes |
|-------|---------|
| _e.g. Cart_ | _Wire to Redux cartSlice + API_ |

### 3. Architecture (follow ported doc)

Reference [`REDUX_EXPRESS_ARCHITECTURE.md`](REDUX_EXPRESS_ARCHITECTURE.md) sections:

- **Redux slices to add/modify:** _e.g. `cartSlice`, `wishlistSlice`_
- **API endpoints:** _method, path, auth required (bearer yes/no)_
- **Token handling:** _how this wave uses stored access token per ported doc_
- **Repository fate:** _keep repository delegating to thunk, or replace_

### 4. Data contract

| Entity | Source | Shape | Notes |
|--------|--------|-------|-------|
| _CartLine_ | _API / Supabase_ | _fields_ | |

### 5. Implementation tasks

- [ ] _Task 1_
- [ ] _Task 2_
- [ ] Migrate screens from `AppStateContext` / mock to Redux + live API
- [ ] Update `PHASE1_INVENTORY.md` data source column when done

### 6. Environment / config

```bash
# New or required env vars
EXPO_PUBLIC_API_BASE_URL=
EXPO_PUBLIC_USE_MOCK_DATA=false  # for integration testing
```

### 7. Test plan

**Mock off:**

- [ ] _Happy path_
- [ ] _401 / logout behavior per REDUX_EXPRESS_ARCHITECTURE_
- [ ] _Offline / error toast_

**Automated:**

- [ ] `cd apps/mobile && npm run lint:check`

**Manual QA** — add rows to [`COMING_SOON_TRIAGE.md`](COMING_SOON_TRIAGE.md):

- [ ] _New matrix item 1_
- [ ] _New matrix item 2_

### 8. Out of scope

- _Explicitly list what this spec does NOT include_

### 9. Dependencies

| Depends on | Reason |
|------------|--------|
| _W1 auth slice_ | _Bearer token in api client_ |

### 10. Acceptance criteria

- [ ] All screens in §2 work with `EXPO_PUBLIC_USE_MOCK_DATA=false`
- [ ] No P0 regressions in [`QA_SIGNOFF.md`](QA_SIGNOFF.md) matrices
- [ ] Matches bearer auth pattern in ported architecture doc
- [ ] PR linked; inventory updated

---

## Wave reference (from [`PRODUCT_DECISIONS.md`](PRODUCT_DECISIONS.md))

| Wave | Domain | Typical slices / APIs |
|------|--------|------------------------|
| W1 | Auth deep links, profile, onboarding | `authSlice`, profile API, `expo-linking` |
| W2 | Products on all discovery surfaces | `productsSlice` or repository → thunk |
| W3 | Wardrobe upload, Sell, log-wear | `wardrobeSlice`, listings API, Gemini BFF |
| W4 | Cart / wishlist Supabase | `cartSlice`, `wishlistSlice` |
| W5 | Checkout, orders, payments | `ordersSlice`, `/v1/api/payments/*` |
| W6 | Inbox realtime, Stylist AI, outfits | `inboxSlice`, AI routes, outfits API |

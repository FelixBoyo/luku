# Phase 1 QA sign-off

Manual QA for Phase 1 closure. Check items in [`COMING_SOON_TRIAGE.md`](COMING_SOON_TRIAGE.md) as you verify; update status here.

**Automated gate:** `cd apps/mobile && npm run lint:check` — passed on sign-off creation.

## Sign-off record

| Field | Value |
|-------|-------|
| Tester | _TBD_ |
| Date | _TBD_ |
| Platforms | iOS simulator / Android emulator / device |
| Build | Expo dev / preview build _TBD_ |
| `USE_MOCK_DATA` | `true` (default) |

## Summary

| Matrix | Total items | Passed | Failed | Blocked |
|--------|-------------|--------|--------|---------|
| Collection polish | 11 | — | — | — |
| Pre-Phase 2 | 7 | — | — | — |
| Browse & Home UX | 4 | — | — | — |
| Wardrobe & Discover feed | 10 | — | — | — |
| Collapsing chrome rollout | 5 | — | — | — |
| **Total** | **37** | — | — | — |

## Failures log

Record P0/P1/P2 issues found during manual pass. Fix P0 before Phase 2 spec distribution.

| ID | Severity | Matrix item | Description | Status |
|----|----------|-------------|-------------|--------|
| — | — | — | _No failures logged yet_ | — |

### Severity guide

- **P0** — Blocks core flow, crash, data loss, wrong navigation
- **P1** — Visual/UX regression, workaround exists
- **P2** — Polish, copy, edge case

## Per-matrix checklist

Copy from `COMING_SOON_TRIAGE.md` and mark `[x]` when verified on at least one platform.

### Collection polish pass

- [ ] Me wardrobe/wishlist/saved/listings show capped previews; View all opens full browse
- [ ] No duplicate navbar + hero titles on Trending, Wardrobe, Wishlist, AI Picks, Connections, Commerce, Saved Outfits
- [ ] Stylist hero reads "STYLIST"; outfit item rows scroll horizontally with peek
- [ ] Outfit detail piece strips use horizontal peek scroll
- [ ] Wardrobe FAB adds item via sheet (Items tab only)
- [ ] Saved Outfits: Created \| Inspirations tabs on one screen
- [ ] Commerce: Listings \| Purchases tabs; Manage all orders → Orders
- [ ] Edit Profile has single Save in header only
- [ ] Home: one See all → AI Picks; one See all → Trending; YMAL has no See all; no bottom AI duplicate CTA
- [ ] Quick list from Me → ListingConfirmation; Full details → ListItemModal (no Sell tab hop)
- [ ] Notifications uses FlatList with sticky filter chips

### Pre-Phase 2 pass

- [ ] Sell tab → publish → listing appears on Me → edit → mark sold
- [ ] Me quick-list with price → correct price on listing detail
- [ ] Heart product on Home → appears on Me wishlist + WishlistScreen
- [ ] Edit profile bio → reflects on Me after save
- [ ] Home Trending See all → TrendingScreen
- [ ] Inbox: scroll collapses search + tabs to compact bar; scroll to top restores full chrome
- [ ] Sign out uses custom ConfirmDialog

### Auth (email OTP)

Requires Supabase **Confirm signup** + **Magic Link** templates with `{{ .Token }}` — see [supabase-email-otp.md](../../../docs/ops/supabase-email-otp.md). Full checklist: [M1_QA_CHECKLIST.md](../../../docs/team/M1_QA_CHECKLIST.md).

- [ ] Register new email → inbox shows **6-digit code** (not link-only)
- [ ] Enter code on Verify OTP → session + onboarding
- [ ] Resend code works after 60s cooldown
- [ ] Wrong/expired code shows clear error
- [ ] Unconfirmed login → app routes to Verify OTP

### Browse & Home UX follow-up

- [ ] Discover PAIR WITH YOUR WARDROBE View All → `WardrobePairings` (not `Wardrobe` inventory)
- [ ] Me View all wardrobe → `Wardrobe` inventory (unchanged)
- [ ] Commerce listing status chips (`FilterChips`) readable; Wardrobe primary `PillTabs` readable
- [ ] Me wishlist preview shows View all when mock has 5+ items

### Wardrobe & Discover feed pass

- [ ] Wardrobe: compact hero + masonry grid visible immediately; no empty black gap under tabs
- [ ] Wardrobe: filter chips and search filter items correctly
- [ ] Discover: at top, full search + Filters row visible; no overlapping duplicate chrome
- [ ] Discover: scroll down collapses to compact bar (search icon + Filters); scroll to top restores full chrome
- [ ] Discover: Filters opens BottomSheet (category/size/price) from full or compact chrome
- [ ] Discover: featured hero + masonry grid with varied card heights
- [ ] Discover: bookmark on card toggles wishlist (syncs to Me)
- [ ] Discover: scroll to bottom loads more items
- [ ] Discover: search modes (profiles/brands/styles) still work
- [ ] Discover: no item count label in full or compact chrome

### Collapsing chrome rollout

- [ ] Shared: `useCollapsingChrome` + `CollapsingChromeSlot` used on Discover, Inbox, Wardrobe
- [ ] Inbox: compact search icon scrolls to top and focuses input; compact chip shows active tab
- [ ] Wardrobe: header title stays fixed; search + PillTabs collapse; compact chip shows active tab (e.g. Laundry badge)
- [ ] Wardrobe: compact search focuses input; FAB and add sheet unchanged
- [ ] No double/overlapping chrome on Discover, Inbox, or Wardrobe

## Exit criteria

Phase 1 is signed off when:

1. All 37 items checked **or** remaining failures are P1/P2 with tickets
2. No open P0 items
3. `lint:check` green
4. `PHASE1_INVENTORY.md` and `PRODUCT_DECISIONS.md` complete

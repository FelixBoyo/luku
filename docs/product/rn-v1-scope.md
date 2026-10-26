# React Native v1 — product scope

Source: feature wiring in `App.tsx`, shell navigation in `components/Header.tsx` and `components/MobileBottomNav.tsx`, and the `components/` tree (including checkout, marketplace, and auth).

See also: `docs/product/rn-ui-tokens-and-contracts.md` for shared UI primitive and token contract guidance that supports this scope.

## Scope matrix

| Feature | v1 decision | Rationale |
|--------|-------------|-----------|
| Supabase auth (`Auth.tsx`) | **In** | Required for wardrobe, albums, purchases, and API identity. |
| Password reset (`PasswordReset.tsx`, hash recovery in `App.tsx`) | **In** | Standard account recovery; same deep-link patterns needed on mobile. |
| Lifestyle Hub (`LifestyleHub.tsx`) | **In** | Default home in mobile nav; bundles high-value shortcuts (OOTD, laundry, sustainability, budget tips, style guidance, links to Discover / wardrobe / mood boards). |
| Discover (`Discover.tsx`: suggestions + trends + style DNA) | **In** | Primary AI exploration surface on mobile; subsumes standalone `OutfitSuggestions` / `FashionTrends` / `StyleEvolution` flows for most users. |
| Wardrobe (`WardrobeGrid.tsx`, `WardrobeItemCard.tsx`, `FileUpload.tsx`) | **In** | Core data model for personalization; upload + Gemini detection drive the rest of the product. |
| Mood boards / albums (`Albums.tsx`, `SaveOutfitModal.tsx`) | **In** | Saves and organizes outfits; connects AI output to long-term value. |
| AI outfit suggestions (via Discover / Hub; `OutfitSuggestions.tsx`) | **In** | Main repeat engagement loop with wardrobe. |
| Fashion trends (via Discover; `FashionTrends.tsx`) | **In** | Already part of Discover; avoid duplicating as a separate top-level tab unless desktop parity demands it. |
| Style evolution / “Style DNA” (via Discover; `StyleEvolution.tsx`) | **In** | Same as above—deliver through Discover sub-tabs in v1. |
| Standalone tabs `Tab.Suggestions`, `Tab.Trends`, `Tab.Evolution` in `App.tsx` | **Cut** (as top-level RN routes) | Redundant if Discover is the canonical AI surface; reduces navigation and test matrix. |
| Color harmony (`ColorHarmony.tsx`) | **Phase 2** | Secondary tool; in web “More” sheet but not primary mobile journey; defer to shrink Gemini/API surface for v1. |
| Trip planner (`TripPlanner.tsx`) | **Phase 2** | Same as above; complex forms + multi-day UI; lower frequency than daily outfit use. |
| Style Playground (`StylePlayground.tsx`) | **Phase 2** | Session/query model and optional imagery; nice-to-have vs wardrobe-first v1. |
| Virtual try-on (`VirtualTryOn.tsx`, `MannequinSettingsModal.tsx`, `tryOnSlice`) | **Phase 2** *or* **In** with hardening | **Option A (recommended default):** Phase 2—large images, multi-mode UX (mannequin / saved photo / new upload), and visualization latency are the highest technical risk. **Option B:** In v1 as flagship—accept longer timeline and explicit performance QA. |
| Marketplace browse (`Marketplace.tsx`, filters, search, recommendations) | **Cut (mobile tab)** / **In (via discovery)** | RN mobile hides the Marketplace tab; browse via Home, Discover, Stylist, and ProductDetail. Web/desktop marketplace remains **In**. |
| Product detail (`ProductDetail.tsx`, reviews, sizing, etc.) | **In** | Needed for conversion; child components (`ProductReviews`, `SizeGuide`, …) ship with marketplace unless individually cut. |
| Cart (`CartSidebar.tsx` pattern) | **In** | Commerce core; reimplement as native drawer/modal—not a reason to defer. |
| Checkout — Stripe / Paystack / M-Pesa (`Checkout.tsx`, `MultiItemCheckout.tsx`) | **In** | Revenue-critical; expect RN-specific integration work (no `@stripe/react-stripe-js` as on web). |
| Wishlist (`WishlistPage.tsx`, `WishlistButton.tsx`) | **In** | Header entry on web; standard e-commerce expectation on mobile. |
| My orders (`MyOrders.tsx`) | **In** | Post-purchase trust; already linked from marketplace flow in code—surface clearly in RN nav. |
| Returns (`ReturnManagement.tsx`, `ReturnRequest.tsx`) | **Phase 2** *or* **In** | **Option:** Phase 2 if policies/ops are not ready for mobile volume. **In** if marketplace ships and CS burden requires self-serve returns immediately. |
| User engagement analytics (`UserEngagementAnalytics.tsx`) | **Phase 2** | Power-user / internal flavor; not in mobile bottom “More” list today; low end-user value for v1. |
| Toasts (`ToastContainer` / `toastSlice`) | **In** | Cross-cutting feedback for uploads, checkout, and errors. |
| Business portal (`/business`, `BusinessAuth.tsx`, `SellerDashboard.tsx` and children) | **Phase 2** (or separate app) | Different persona, heavy CRUD (inventory, KYC, promotions), image uploads—large RN scope; keep server APIs shared. |
| Dev bypass (`DevBypassBanner`, `ENABLE_DEV_BYPASS`) | **Cut** (prod) | Dev-only; must not ship store builds with mock sessions. |
| PWA install (`InstallButton.tsx`, commented in `Header.tsx`) | **Cut** | N/A on native RN; use store listing instead. |
| Error boundary (`ErrorBoundary.tsx`) | **In** | Stability; wrap root navigators. |
| `IntegrationMonitor.tsx` | **Cut** | Not mounted in `App.tsx`; internal/dev tooling—not a consumer v1 feature. |
| Orphan `MoreMenu.tsx` | **Cut** (as-is) | Not imported by `App.tsx`; replace with RN-native “More” / profile stack that intentionally includes Orders, Returns, Settings. |

## Mobile UX risks — items marked **In** (and checkout)

### Supabase auth & password reset

- **Navigation:** Deep links for email confirmation and `type=recovery` must open the correct RN screen (not `window.location` / hash).
- **Payments:** N/A.
- **Camera / files:** N/A unless you add profile photo later.
- **Push:** Optional for magic links / security alerts—not required for v1 login.

### Lifestyle Hub

- **Navigation:** Many cross-links (Discover, wardrobe, mood boards, suggestions); define a single stack vs tabs to avoid circular navigation.
- **Payments:** N/A.
- **Camera / files:** Indirect (try-on CTAs lead to flows with uploads)—preload expectations copy.
- **Push:** Optional for OOTD / laundry reminders (phase 2).

### Discover (suggestions, trends, style DNA)

- **Navigation:** Three sub-tabs; preserve state when switching tabs; long scroll + memory on low-end devices.
- **Payments:** Product taps → marketplace (hand off state cleanly).
- **Camera / files:** N/A on Discover itself.
- **Push:** N/A for v1.

### Wardrobe + file upload

- **Camera / files:** Gallery vs camera permissions, HEIC/rotation, large images, background upload, and **memory spikes** when base64-ing many photos (align with native image APIs vs web `FileReader`).
- **Navigation:** Filters + delete confirmations (`window.confirm` on web → native alert/dialog).
- **Payments:** N/A.
- **Push:** N/A.

### Mood boards + save outfit modal

- **Navigation:** Modal stacking with marketplace and checkout; avoid losing unsaved outfit state on backgrounding.
- **Payments:** N/A.
- **Camera / files:** N/A.
- **Push:** N/A.

### Marketplace + product detail

- **Navigation:** Deep links to product; back stack from checkout to product to grid.
- **Payments:** See checkout row.
- **Camera / files:** Seller images are read-only for buyers; still need performant image caching.
- **Push:** Phase 2 (price drops, order shipped).

### Cart (native reimplementation)

- **Navigation:** Slide-over vs full-screen cart; preserve when switching tabs.
- **Payments:** Hand off line items and totals consistently to checkout.
- **Camera / files:** N/A.
- **Push:** N/A.

### Checkout (Stripe / Paystack / M-Pesa)

- **Payments:** **Highest risk:** Web Stripe Elements and Paystack hosted/redirect flows do not map 1:1 to RN; M-Pesa STK polling and phone entry need **secure** UX (masking, no sensitive logging, clear pending state when app backgrounds).
- **Navigation:** Return from browser / 3DS / Paystack authorization URL must resume app state safely.
- **Camera / files:** N/A.
- **Push:** Optional payment confirmation (phase 2; webhook-driven).

### Wishlist & my orders

- **Navigation:** Ensure visible IA (web mobile currently relies on header / marketplace links; RN should add profile or tab entries).
- **Payments:** Refunds and partial captures are support-heavy—coordinate copy with ops.
- **Camera / files:** N/A.
- **Push:** High value for **order shipped** (phase 2).

### Toasts & global errors

- **Navigation:** Non-blocking overlays vs native snackbars; safe area and keyboard overlap.
- **Payments:** Do not surface raw gateway errors containing identifiers.
- **Camera / files:** N/A.
- **Push:** N/A.

### Error boundary

- **Navigation:** Fallback UI with “restart” or “go home” without losing auth session blindly.
- **Payments:** If checkout crashes, avoid duplicate charges—rely on idempotent server reconciliation.
- **Camera / files:** N/A.
- **Push:** N/A.

---

## Product decisions for RN v1

1. **Virtual try-on:** **Phase 2** by default. Revisit only if explicitly promoted to a flagship milestone with dedicated performance QA scope.
2. **Returns:** **Phase 2** by default. Keep post-purchase support in `MyOrders` until mobile returns operations are ready.
3. **Standalone `Tab.*` parity:** **Cut** duplicate top-level tabs (`Suggestions`, `Trends`, `Evolution`) and keep Discover as the canonical AI surface.
4. **Seller RN:** **Out of scope** for v1. Keep seller workflows web-first while sharing backend APIs.

## Follow-ups & notes

- **Navigation parity:** `MyOrders`, `Returns`, `UserAnalytics`, and `Wishlist` are not all in `MobileBottomNav`; RN v1 should define explicit entry points (profile menu, post-purchase, etc.).
- **`MoreMenu.tsx`:** Lists several tabs but is not wired into `App.tsx` today—treat as reference only for IA gaps on web mobile.

# LUKU MVP Ship Assessment

**Perspective:** Senior UI/UX, Senior Product/Software Dev & Manager, Senior (20yr) Cybersecurity  
**Scope:** Styling + Marketplace | **Target:** Ship in 1 month  
**Goal:** What makes it a strong MVP, what’s left to do, and what’s realistic for first-time users.

---

## 1. What Makes It a Strong MVP (If We Prove You Wrong)

You already have a lot of what defines a shippable MVP: one clear value path, real data, and guarded secrets.

### 1.1 Single, Coherent Value Path (Styling → Marketplace)

- **Wardrobe → AI analysis → Outfit suggestions → Save to albums** is implemented end-to-end: upload photos, Gemini analyzes (name, category, color, style, season), items persist in Supabase, suggestions generated from “clean” items, feedback and favorites, albums for mood boards.
- **Marketplace** is wired: products, cart, wishlist, product detail, checkout UI, order creation in state/DB, seller dashboard, business/KYC. So the *product surface* for “style + shop” is there.

That gives you a **narrative**: “Organize your closet with AI, get outfit ideas, then discover and buy more.” That’s a valid MVP story.

### 1.2 Security Posture (Where It’s Actually Good)

- **Supabase RLS:** Schemas in `supabaseClient.ts` and `ecommerce_schema.sql` use RLS and `auth.uid()` for clothing_items, outfits, albums, trips, business_accounts, products, orders. So tenant isolation is designed correctly.
- **Auth:** Supabase Auth (sign up/in, password reset, session). No auth bypass in code for production (`ENABLE_DEV_BYPASS` is false and must stay that way in prod).
- **Secrets:** Stripe *publishable* key is correctly used via `VITE_STRIPE_PUBLISHABLE_KEY` (client-safe). Gemini key is read from `process.env.GEMINI_API_KEY` in `integrationConfig`; in a Vite SPA that’s typically build-time env, so the key isn’t exposed in the browser the way a `VITE_*` would be—acceptable for MVP if the backend is “the build server” and key isn’t in client bundle.
- **No server-side secret key in frontend:** Stripe `createPaymentIntent` in the app is explicitly a mock (see below). So you’re not accidentally shipping the Stripe secret in the client.

So for a first ship, **auth + RLS + no secret in client** is a solid base.

### 1.3 UX Foundations for First-Time Users

- **Empty states** exist where they matter: Outfit Suggestions (“Add more clothes” / “Ready for a style upgrade”), Cart (“Your cart is empty”), Wishlist (“No items in your wishlist”), Wardrobe (“No matching items” when filters hide everything).
- **Wardrobe** always shows the upload card; new users see “add items” immediately.
- **Discover** groups Suggestions, Trends, Style Evolution in one place; **Lifestyle Hub** gives a single dashboard (eco score, outfit of the day, laundry, budget tips, Style Sanctuary). So there’s a clear “first place to land” (Lifestyle Hub) and a clear “do something” path (Wardrobe → Suggestions).

That’s enough for a first-time user to have a coherent first session without a formal “onboarding wizard.”

### 1.4 Tech Stack and Maintainability

- React 19, TypeScript, Redux Toolkit, Vite, Supabase, Gemini, Stripe (client). One main `App.tsx` with tab-based routing, slices for auth, wardrobe, features, cart, orders, etc. Test setup (Vitest, Testing Library) exists. For a 1-month ship, this is maintainable and debuggable.

**Bottom line:** The product is *close* to a “perfect MVP” for styling + marketplace **if** you fix the gaps below and scope ruthlessly. The main missing piece is **real payments**; the rest is hardening and clarity.

---

## 2. What’s Left to Do (Same 1-Month Window)

Prioritized by “must have for MVP” vs “nice to have.”

### 2.1 Must-Have (Blockers)

| Item | Why | Effort (rough) |
|------|-----|------------------|
| **Backend for Stripe PaymentIntent** | `stripeService.createPaymentIntent` returns a **mock** client secret. `confirmPayment` with Stripe Elements will fail with a real Stripe publishable key because the secret is fake. You need a small backend (e.g. Supabase Edge Function or a minimal Node/Cloud Function) that uses the Stripe **secret** key to create a PaymentIntent and returns `client_secret` to the client. No way around this for real payments. | 1–2 days (edge function + wire in `createPaymentIntent` to call it). |
| **CartSidebar → Checkout flow** | In `App.tsx`, `CartSidebar`’s `onCheckout` is `(product, quantity) => { setIsCartOpen(false); console.log(...) }`. The sidebar does open `Checkout`/`MultiItemCheckout` internally via its own state, so the UI path exists—but confirm that from cart → payment → order creation the flow is consistent and that `onSuccess` clears cart and shows a clear “Order placed” state. | 0.5 day (verify and fix any wiring). |
| **Environment and config validation** | `integrationConfig` uses `process.env.GEMINI_API_KEY`; Vite only exposes `import.meta.env.VITE_*` to the client. Ensure production build gets Gemini key (e.g. `VITE_GEMINI_API_KEY` for client-only, or call Gemini from your new backend). If Gemini is client-called, use `VITE_` and accept key in browser (rate-limit and monitor). Validate at app init: Supabase + Gemini (and Stripe if you enable payments) and show a single “misconfiguration” screen instead of random failures. | 0.5 day. |
| **ENABLE_DEV_BYPASS and build safety** | Ensure `ENABLE_DEV_BYPASS` is `false` in production and not overridable by env. Add a simple build check or runtime guard so a production build never enables bypass. | 0.25 day. |

### 2.2 Should-Have (High Impact, Still in 1 Month)

| Item | Why | Effort (rough) |
|------|-----|------------------|
| **First-time default tab and one “next step”** | Default tab is Lifestyle Hub; that’s good. Add one line of copy or a small CTA on the hub when wardrobe is empty: “Add your first items to get started” → links or scrolls to Wardrobe. So the very first action is obvious. | 0.25 day. |
| **Graceful degradation when Gemini fails** | If Gemini is down or key missing, wardrobe analysis and suggestions break. Show a clear message (“AI is temporarily unavailable; you can still add items manually”) and, if possible, a manual form for name/category/color/style/season so users can add items without AI. | 0.5–1 day. |
| **MultiItemCheckout** | `MultiItemCheckout.tsx` says “This is a placeholder checkout flow.” For MVP you can either: (a) route multi-item cart to multiple single-item checkouts (simplest), or (b) implement a single PaymentIntent for the full cart in your new backend and one confirmation. (a) is faster. | 0.5–1 day if (a). |
| **Orders and post-checkout** | After successful payment, user should see “Order placed” and be sent to My Orders (or a success page with link). Ensure `createOrder` in `ordersSlice` persists to Supabase and that My Orders reads from it. | 0.5 day (if not already done). |

### 2.3 Nice-to-Have (Only If Time)

- **Virtual Try-On:** Heavy (AI image gen, latency, cost). Realistic for MVP: keep the tab but show “Coming soon” or a short waitlist CTA so you don’t promise what isn’t reliable.
- **Style Playground / Style Evolution / Trip Planner / Color Harmony:** Already built; keep them. No need to expand; just ensure they don’t crash when data is empty (e.g. “Save 3+ outfits to unlock Style Evolution” is already there).
- **Seller onboarding (KYC, verification):** If “marketplace” for MVP means “buy only,” you can defer full seller flows and invite a few manual sellers. If “sellers can list” is MVP, keep current KYC and dashboard but don’t add more.

---

## 3. What Is Realistic for First-Time Users

What you can honestly promise in the first session and over the first week.

### 3.1 First Session (First 10–15 Minutes)

- **Sign up / sign in** (Supabase Auth).
- **Land on Lifestyle Hub** with empty or minimal state.
- **Add 2–5 wardrobe items:** upload photos → AI suggests name, category, color, style, season → save. If Gemini fails, either a clear error or (after you add it) manual entry.
- **Open Discover → Suggestions.** Generate outfit suggestions from “clean” items; see a few outfits; like/dislike; save one to an album.
- **Open Wardrobe** and see items, status (clean / in wash / dirty), and laundry flow.
- **Browse Marketplace:** see products, open product detail, add to cart, add to wishlist.
- **Cart:** see items, click “Proceed to Checkout.” If you’ve implemented the backend: enter address, pay with test card, see “Order placed” and order in My Orders. If not: either hide checkout and show “Checkout coming soon” or show a clear “Payments coming soon” message so they don’t hit a broken payment.

So: **discover value (AI wardrobe + outfit ideas), then browse and (if you ship payments) complete one test purchase.** That’s a realistic and strong first-time experience.

### 3.2 First Week (Retention)

- **Albums:** create an album, save more outfits, use it as a mood board.
- **Outfit of the day** on Lifestyle Hub (when they have enough clean items).
- **Sustainability:** run eco insight once; see score and tips.
- **One real order** (if payments are live) and maybe a return request (if you expose Returns in MVP).

You do *not* need to promise for MVP: Virtual Try-On, full seller signup, Style Evolution (needs 3+ saved outfits anyway), or Trip Planner. You can list them as “Explore” features with soft CTAs.

---

## 4. Scope Recommendation: “MVP in 1 Month”

- **In scope:** Auth, Wardrobe (add with AI or manual fallback), Outfit Suggestions, Albums (mood boards), Lifestyle Hub (dashboard, laundry, outfit of the day, sustainability, budget tips), Marketplace (browse, product detail, cart, wishlist), **Checkout with real Stripe** (via backend), My Orders, basic Returns if already wired.
- **Out of scope for launch:** Virtual Try-On as a working feature (keep as “Coming soon”), complex seller onboarding beyond what exists, new styling features. Defer analytics and advanced seller tools to post-MVP.

---

## 5. Summary Table

| Dimension | Verdict | Action |
|-----------|---------|--------|
| **MVP “perfect” for styling + marketplace?** | Almost. One critical fix (real payments) and small UX/config fixes. | Add PaymentIntent backend; validate env; optional manual fallback for wardrobe. |
| **What’s left in 1 month?** | Backend for Stripe; env/Gemini handling; Cart/Checkout/Orders flow verified; first-time CTA; optional multi-item checkout or “single-item only” for MVP. | See §2.1–2.2. |
| **Realistic for first-time users?** | Yes: sign up → add wardrobe → get suggestions → save to album → browse shop → (if payments ready) place one order. | Don’t over-promise Try-On or advanced features; make first step obvious. |

**Final take:** The codebase is in good shape for an MVP. The thing that would *disprove* “we can ship in a month” is not the feature set—it’s skipping the payment backend and shipping a checkout that can’t complete. Add the small backend for Stripe, lock down config and dev bypass, and scope the rest as above; then shipping in a month is realistic, and first-time users can get real value from styling and marketplace in one place.

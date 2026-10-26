# Phase 4 & Phase 5: AI Recommendation Engine & Stylist Integration

**Program Owner & AI Engineering Lead:** John  
**Teammates:** Brian (Catalog & Discovery), Felix (Wardrobe & Sell), Shannon (Commerce & Stylist UX)  
**Branch Strategy:** Development on `zeus`, release line on `master`. Feature branches: `feat/ai-*`  
**Target Duration:** ~3–4 weeks (3 Sprints)  
**Status:** In Kickoff — Phase 4A (Shared Platform Foundation by John: Days 1–2)  

---

## 1. Executive Summary & Where We Are

LUKU's foundational commerce infrastructure is now complete:
- **Phase 0 (Remediation):** Typecheck, linting, shared data contracts, and platform setup passed.
- **Phase 1 (Discovery & Catalog):** Fast marketplace catalog, brand directory, wishlist saving, and peer listings.
- **Phase 2 (Peer Cart & Checkout):** Multi-seller carts, Paystack M-Pesa STK push, and order creation.
- **Phase 3 (Escrow & Settlement):** Complete 7-state order lifecycle (`pending_payment → paid → in_escrow → shipped → delivered → released / cancelled / disputed`), dispute operations runbook, and unified mobile commerce tabs (`Purchases`, `Sales`, `Listings`, `Orders`).

### The Next Frontier: AI Stylist & Core Recommendations (Tight MVP Scope)
We are turning LUKU into an AI-powered personal stylist and smart marketplace with a focused MVP scope covering our core recommendation and styling surfaces:
1. **AI Stylist Screen:** Prompt-based outfit generation from user descriptions, parameter-based recommendations, "Complete The Look" (shop-the-look missing item with direct Add to Cart), "Style Enhancers" (% Match grid), and saving favorite looks.
2. **Home Screen Recommendation Rails:**
   - **Outfit of the Day (OOTD):** Daily curated look with weather and occasion parameters (`Casual Chic Weekend · 22°C`), Save, Try On, and New refresh actions.
   - **"PICKED FOR YOU":** Hero match with `% Match` and AI reason ("Complements your earth-tone wardrobe") directly on the Home feed.
   - **"TRENDING NOW":** Horizontal rail of trending marketplace items.
   - **"YOU MIGHT ALSO LIKE":** 2-column grid of items recommended based on clothes in the user's wardrobe.
   - **"MORE FOR YOU":** Vertical recommendation list with personalized `% Match` badges.
3. **Discover Screen Recommendation Sections:**
   - **"PAIR WITH YOUR WARDROBE" Rail:** Horizontal rail of items with `% Match` and `with your {item.pairs}` directly on the Discover feed.
   - **Curated Parameter-Based Feed (Underneath Rail):** Marketplace feed recommending clothes filtered by parameters (categories, brands, price range, condition) and smart sorting.
4. **Virtual Try-On Studio:** Interactive mannequin studio with body type & skin tone customization and outfit selection, directly launched from Home OOTD and the Stylist screen.

> [!NOTE]
> **Post-MVP Deferrals:**  
> - Dedicated full sub-screens **`AIRecommendationsScreen.tsx`** and **`WardrobePairingsScreen.tsx`** are **deferred to Post-MVP**. All recommendations and pairings live directly on the main Home and Discover tabs for MVP.
> - Clothing photo camera scanning (AI wardrobe vision ingestion / seller listing auto-fill) and moodboards/albums are **deferred to Post-MVP** to keep the initial launch tight and fast.

---

## 2. Payment Quarantine & Safe Progress

### The Situation
When testing payments locally, M-Pesa STK push and webhook callbacks rely on ngrok tunnels and external Paystack sandboxes. Occasional connection blips can cause order status updates to stall until the server restarts.

### How We Keep Moving Safely
We strictly isolate payment code so the team can build AI features without being blocked:
1. **Isolated Code Zones:** AI code lives exclusively in `backend/ai/` and `backend/router/v1/ai/`. It never touches payment tables, webhooks, or escrow state machines.
2. **Automated Safety Shield:** All 70 automated vitest suites protect escrow rules. If any code changes break escrow, tests fail immediately.
3. **Mock Data for UI Work:** Brian, Felix, and Shannon can develop all non-checkout screens using `EXPO_PUBLIC_USE_MOCK_DATA=true` without needing active M-Pesa or ngrok tunnels.
4. **Server Timeout Protection:** The backend limits escrow calls to 10 seconds to prevent server freezing.

---

## 3. How the Recommendation Engine Works (In Plain English)

### Why We Use a 2-Step Approach (Search First, Then Ask AI)
- **Why not just dump everything into AI?** If we sent all 2,000+ marketplace products to an AI model every time a user scrolled, it would take 3–5 seconds to load, cost huge API bills, and the AI might accidentally recommend an item that was already sold or out of stock!
- **Our Fast 2-Step Solution:**
  1. **Step 1 (Instant Database Search — 20ms):** Our database quickly finds 20–30 in-stock products matching the user's style preferences, favorite colors, and size.
  2. **Step 2 (Smart Styling & Explanations — 500ms):** The AI examines those 20 candidates alongside the user's closet, picks the best 6–8 pieces, and writes a helpful reason (e.g., *"Pairs with your Vintage Leather Jacket"*).
  3. **Instant Feed:** Results are saved for 2 hours per user so browsing feels immediate.

### How the 5 Recommendation Rails Work

The recommendation system powers 5 distinct user-facing surfaces across Home and Discover:

| Surface | UI Section | Data Endpoint | Mobile Repository Call | Description & AI Logic |
|:---|:---|:---|:---|:---|
| **Home Screen** | **"Outfit of the Day" (OOTD)** | `GET /v1/api/ai/ootd` | `repositories.home.getOotd()` | Daily curated 4-piece look tailored to user style preferences with weather context (`22°C · Nairobi`), 24-hr cache, and Save/Try On actions. |
| **Home Screen** | **"PICKED FOR YOU"** | `GET /v1/api/ai/recommendations` | `repositories.home.getRecommendations()` | Top single hero product recommendation with match % (e.g. `98%`) and styling explanation badge (*"Complements your earth-tone wardrobe"*). |
| **Home Screen** | **"TRENDING NOW"** | `GET /v1/api/ai/recommendations` | `repositories.home.getRecommendations()` | Horizontal rail of active marketplace listings ordered by popularity and engagement. |
| **Home Screen** | **"YOU MIGHT ALSO LIKE"** | `GET /v1/api/ai/recommendations` | `repositories.home.getRecommendations()` | 2-column grid of products specifically matching clothes already inside the user's wardrobe. |
| **Home Screen** | **"MORE FOR YOU"** | `GET /v1/api/ai/recommendations` | `repositories.home.getRecommendations()` | Vertical scroll list of personalized catalog pieces with calculated `% Match` tags. |
| **Discover Screen** | **"PAIR WITH YOUR WARDROBE"** | `GET /v1/api/ai/wardrobe-pairings` | `repositories.wardrobePairings.list()` | Horizontal rail showing catalog items with explicit styling pairings (e.g., `[Classic Denim Jacket] paired with [High-Rise Relaxed Chinos] (95% match)`). |

```
       [ 5,000 Catalog Items in Database ]
                       │
                       ▼
┌────────────────────────────────────────────────────────┐
│  STEP 1: Quick Database Filter (15–30ms)               │
│  • Only active, in-stock items                         │
│  • Matches user's favorite colors & style tags         │
└──────────────────────┬─────────────────────────────────┘
                       │ Top 20 Candidates
                       ▼
┌────────────────────────────────────────────────────────┐
│  STEP 2: AI Fashion Picker & Reason Writer             │
│  • Evaluates candidates against user's closet          │
│  • Picks top pieces & writes styling reason badges     │
│  • Cached for 2 hours per user in memory               │
└──────────────────────┬─────────────────────────────────┘
                       │
                       ▼
       [ Fast, Personalized Feed in App ]
```

### Mobile Integration Cheat Sheet for Brian & Felix

```typescript
// 1. Fetching Home Screen recommendations (Brian):
const response = await repositories.home.getRecommendations();
const { pickedForYou, trending, youMightLike, moreForYou } = response;

// 2. Fetching Daily OOTD (Brian):
const ootd = await repositories.home.getOotd();
// ootd.title, ootd.matchPercentage, ootd.pieces, ootd.weatherContext

// 3. Fetching Discover Screen Pairings (Felix):
const pairings = await repositories.wardrobePairings.list();
// pairings[0].wardrobeItemName, pairings[0].pairedProductTitle, pairings[0].matchPercentage
```

---

## 4. Swappable AI Models: Running Locally for Free vs. Cloud in Production

Per [ADR-10](../architecture/AI_PROVIDER.md), mobile screens call simple server endpoints (`POST /v1/api/ai/...`) and never talk to AI models directly.

The server has a simple model switcher so developers can run AI locally for free without burning cloud API keys:

```
                  ┌───────────────────────┐
                  │    Task Layer         │
                  │ (outfit, recs, vision)│
                  └───────────┬───────────┘
                              │
                    getAiProvider()
                              │
          ┌───────────────────┼───────────────────┐
          ▼                   ▼                   ▼
┌──────────────────┐┌──────────────────┐┌──────────────────┐
│  GeminiProvider  ││  OllamaProvider  ││   MockProvider   │
│ (Cloud Prod)     ││ (Local Dev)      ││ (Offline Tests)  │
│ High intelligence││ Free local run   ││ Instant dummy    │
│ Live in prod     ││ via Ollama       ││ data for CI      │
└──────────────────┘└──────────────────┘└──────────────────┘
```

### Quick Switch in `.env.local`:
```bash
# Option 1: Free Local Model (Ollama - llama3.2 tested and verified)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
AI_DEFAULT_MODEL=llama3.2

# Option 2: Cloud Production (Gemini)
AI_PROVIDER=gemini
AI_DEFAULT_MODEL=gemini-2.5-flash
GEMINI_API_KEY=your_key_here

# Option 3: Offline Dummy Mode (Zero dependencies)
AI_PROVIDER=mock
```

---

## 5. John's Deliverables & Status

The shared platform foundation is **100% complete and fully verified**:

| Deliverable | Status | Components Built | Verification |
|:---|:---|:---|:---|
| **Shared Data Contracts** | ✅ Completed | `packages/contracts/src/ai/` (`ootd`, `recommendations`, `wardrobePairings`, `outfitSuggestions`) | `npm run typecheck:contracts` (0 errors) |
| **Multi-Model Layer** | ✅ Completed | `backend/ai/providers/` (`OllamaProvider`, `GeminiProvider`, `MockProvider`, and `router.ts`) | Tested live with local `llama3.2:latest` |
| **Core AI Tasks & Cache** | ✅ Completed | `backend/ai/tasks/` (`ootd.ts`, `recommendations.ts`, `wardrobePairings.ts`, `outfitSuggestions.ts`) | 2-hr and 24-hr caches, favorite detection |
| **Express V1 Endpoints** | ✅ Completed | `backend/router/v1/ai/` mounted at `/v1/api/ai/*` | `npm run verify:ai` (all 4 routes 200 OK) |
| **Mobile Repositories** | ✅ Completed | `apps/mobile/src/repositories/` (`homeRepository`, `stylistRepository`, `wardrobePairingsRepository`) | `npm run lint:mobile` (0 errors) |
| **Full Regression Suite** | ✅ Completed | Monorepo test harness | `npm test` (74/74 test files, 598/598 tests passed) |

---

## 6. Blockers & Easy Fixes

| # | What Could Go Wrong | How We Prevent It |
|:---|:---|:---|
| **1** | **Local AI is slow on laptops without graphics cards** | Use `AI_PROVIDER=mock` for instant UI testing, or use lightweight `llama3.2:1b`. |
| **2** | **Phone photos are too large over slow data networks** | Automatically shrink photos on the phone to max 800px and 0.7 JPEG (<250KB) before uploading. |
| **3** | **Brand new users have empty closets** | If a user has <2 items, show popular trending products instead of an empty white space, with an invite to add clothes. |
| **4** | **Payment/Escrow hiccups during dev** | AI tasks never touch payment code. Frontend devs can test all UI using `EXPO_PUBLIC_USE_MOCK_DATA=true`. |

---

## 7. Plain-English Team Work Breakdown with Action Tags

Check [`PHASE4_TICKETS.md`](./PHASE4_TICKETS.md) for full issue criteria. Look for 🟢 **`[START NOW]`** tags to start working immediately!

### Screen Navigation Quick Reference:
- **Stylist Screen:** Bottom Tab Bar ➔ Tap **`STYLIST`** (sparkles icon) (`apps/mobile/src/screens/StylistScreen.tsx`).
- **Home Screen:** Bottom Tab Bar ➔ Tap **`HOME`** (1st icon) (`apps/mobile/src/screens/HomeScreen.tsx`).
- **Discover Screen:** Bottom Tab Bar ➔ Tap **`DISCOVER`** (compass icon) (`apps/mobile/src/screens/DiscoverScreen.tsx`).
- **Virtual Try-On Screen:** Tap **`Try On`** on Home OOTD or the purple camera icon on any Stylist outfit card (`apps/mobile/src/screens/VirtualTryOnScreen.tsx`).
- **Saved Outfits Tab:** Bottom Tab Bar ➔ Tap **`ME`** ➔ Tap **`SAVED`** sub-tab (heart icon).

---

### John (Platform Lead & AI Engineer)
- ✅ **`[COMPLETED]`** **AI-CORE-1:** Define shared data contracts for outfit suggestions (descriptions, parameters, shop-the-look, enhancers), OOTD, recommendations, and wardrobe pairings.
- ✅ **`[COMPLETED]`** **AI-CORE-2:** Build the multi-model switcher (Ollama local with Llama 3.2, Gemini cloud, and Mock offline).
- ✅ **`[COMPLETED]`** **AI-CORE-3 & 4:** Build the fast database filter and recommendation / pairings endpoints with 2-hour caching.
- ✅ **`[COMPLETED]`** **AI-CORE-5:** Build the Stylist outfit generation and OOTD engine combining wardrobe pieces with missing catalog items.
- ✅ **`[COMPLETED]`** **AI-CORE-6:** Automated test suites to ensure everything stays green and reliable.

### Shannon (Member 4 — AI Stylist Screen)
*📍 Nav: Bottom Tab Bar ➔ `STYLIST` | Try-On: Purple camera icon | Saved Outfits: `ME` ➔ `SAVED`*
- 🟢 **`[START NOW]`** **M4-AI-1:** Wire Stylist outfit actions: Favorite heart saves/unsaves to `outfits` table (`repositories.outfits`), Try-On camera button navigates to `VirtualTryOn`, and "Complete The Look" shopping bag button calls `addToCart(item.productId)`.
- 🟢 **`[READY TO INTEGRATE]`** **M4-AI-2:** Connect prompt input ("Describe Your Needs") and "Generate" button to `repositories.stylist.generateSuggestions()`.
- 🟢 **`[READY TO INTEGRATE]`** **M4-AI-3:** Connect parameter-based outfit recommendations and "Style Enhancers" grid (`% Match` badge, name, price) to `repositories.stylist.generateSuggestions()`.

### Brian (Member 2 — Home Screen Recommendations)
*📍 Nav: Bottom Tab Bar ➔ `HOME`*
- 🟢 **`[START NOW]`** **M2-AI-1:** Wire loading skeletons & section states for "Outfit of the Day", "PICKED FOR YOU", "TRENDING NOW", "YOU MIGHT ALSO LIKE", and "MORE FOR YOU" directly in `HomeScreen.tsx`.
- 🟢 **`[READY TO INTEGRATE]`** **M2-AI-2:** Connect `HomeScreen.tsx` "Outfit of the Day" card to `repositories.home.getOotd()` (Save, Try On, and New refresh).
- 🟢 **`[READY TO INTEGRATE]`** **M2-AI-3:** Connect "PICKED FOR YOU" hero card directly in `HomeScreen.tsx` to `repositories.home.getRecommendations()`. Connect "YOU MIGHT ALSO LIKE" (based on wardrobe) and "MORE FOR YOU" (with `% Match` badges) to `repositories.home.getRecommendations()`.

### Felix (Member 3 — Discover Screen, Pairings & Virtual Try-On)
*📍 Nav: Bottom Tab Bar ➔ `DISCOVER` | Try-On: Tap `Try On`*
- 🟢 **`[START NOW]`** **M3-AI-1:** In `VirtualTryOnScreen.tsx`, wire body type selector (`Petite`, `Slim`, `Athletic`, `Curvy`, `Plus Size`), skin tone palette, and outfit list selector to dynamically update the mannequin preview.
- 🟢 **`[READY TO INTEGRATE]`** **M3-AI-2:** Connect `DiscoverScreen.tsx` "PAIR WITH YOUR WARDROBE" rail to `repositories.wardrobePairings.list()` directly on the Discover screen.
- 🟢 **`[READY TO INTEGRATE]`** **M3-AI-3:** In `DiscoverScreen.tsx`, wire the product feed underneath the pairing rail with filter parameters (Categories, Price, Condition, Brand) and match sorting so recommended clothes adapt dynamically.
- 🟢 **`[READY TO INTEGRATE]`** **M3-AI-4:** Wire `VirtualTryOnScreen.tsx` to accept the selected outfit passed via route navigation params from Home OOTD or Stylist.




---

## 8. Definition of Done Checklist

- [ ] All new routes return the standard `{ data, error, message, status }` response.
- [ ] No mobile code imports `@google/genai` or exposes `GEMINI_API_KEY`.
- [ ] Setting `AI_PROVIDER=ollama` runs the full flow locally without cloud keys.
- [ ] Only existing screen layouts and UI components are wired up — no new unapproved screens or layout additions.
- [ ] `npm run lint:mobile` (`tsc --noEmit`) passes cleanly.
- [ ] `npm run typecheck:backend` (`tsc --noEmit`) passes cleanly.
- [ ] `npm run typecheck:contracts` passes cleanly.
- [ ] All 70 existing test suites (`npm test`) remain green.

---
# LUKU Acquisition → Activation Funnels

**Last Updated:** February 2026  
**Status:** Draft v1 – focused on core consumer activation; extends `MARKETING_STRATEGY.md` and `ANALYTICS_SYSTEM.md`

---

## Purpose

This document defines the **critical activation funnels** that move new users from first touch to real value, with a specific focus on:

- **Signup / first login**
- **First DIY Mood Board (Albums)**
- **First AI-Driven Recommendation interaction**

It is the bridge between:

- High-level strategy in `MARKETING_STRATEGY.md`
- Multi-sided personas in `MULTI_SIDED_PERSONAS.md`
- Analytics architecture in `ANALYTICS_SYSTEM.md` and `userEngagementSlice`

---

## Core Consumer Activation Funnel

### High-Level Funnel

1. **Awareness → Click**
   - Channel: Paid social, organic social, PR, referral, influencer content.
   - Destination: LUKU homepage or a **feature-focused landing page** (e.g. “Design your first mood board in 5 minutes”).

2. **Signup / Login**
   - Surface: `Auth` (personal users).
   - Goal: Create account and reach first session with clear guidance.

3. **Wardrobe Seeding**
   - Surface: Wardrobe upload (e.g. `WardrobeGrid`).
   - Goal: Add initial wardrobe items (or import demo items) to unlock AI and mood boards.

4. **First Mood Board (DIY Albums)**
   - Surface: `Albums` / mood board feature.
   - Goal: Create and name a mood board, add at least 3 outfits/items.

5. **First AI Recommendation Interaction**
   - Surface: `OutfitSuggestions`, `Discover`, or other AI-powered flows.
   - Goal: Generate AI suggestions, save at least one outfit, optionally add it to a mood board and/or shop related products.

6. **Commerce / Retention Hooks (Optional in v1)**
   - Surface: `Marketplace`, Wishlist, Orders.
   - Goal: Save or purchase items that connect back to boards and AI flows.

---

### Detailed Step-by-Step with Events & Metrics

> **Note:** Event names here are **conceptual**; implementation details and payloads are specified in the analytics foundation doc (`ANALYTICS_ACTIVATION_EVENTS.md`).

#### 1. Landing → Signup Started → Signup Completed

- **Surfaces:**
  - Marketing landing page(s)
  - `Auth` component

- **Key Behaviors:**
  - User clicks **“Get Started” / “Create your first mood board”** CTA.
  - User enters email/password in `Auth` and submits.

- **Core Events:**
  - `signup_viewed` – user lands on signup/auth screen.
  - `signup_started` – user begins form input.
  - `signup_completed` – account created / session established.

- **Primary Metrics:**
  - Landing page → `signup_viewed` rate.
  - `signup_started` → `signup_completed` conversion.
  - Time from first visit to completed signup.

#### 2. First Session → Wardrobe Seeded

- **Surfaces:**
  - Post-auth first-screen experience (initial tab in `App` – currently `LifestyleHub`).
  - Wardrobe upload interface in `WardrobeGrid`.

- **Key Behaviors:**
  - User is prompted to **add wardrobe items** or explore demo content.
  - User uploads at least 1 item, ideally 5+.

- **Core Events:**
  - `onboarding_prompt_shown` – first-session guidance shown (e.g. “Add your wardrobe to unlock AI and mood boards”).
  - `wardrobe_item_added` – user adds an item via upload.
  - `wardrobe_seeded` – user reaches threshold (e.g. ≥5 items).

- **Primary Metrics:**
  - % of new signups who add ≥1 item in first 24h.
  - % of new signups who reach `wardrobe_seeded`.
  - Time from `signup_completed` to first wardrobe item.

#### 3. Wardrobe Seeded → First Mood Board Created

- **Surfaces:**
  - `Albums` (mood boards).
  - In-app prompts from `LifestyleHub`, `OutfitSuggestions`, or Discover flows.

- **Key Behaviors:**
  - User navigates to Albums / mood boards.
  - Creates a new board and adds outfits/items to it.

- **Core Events:**
  - `mood_board_education_shown` – tooltip/empty state explaining boards.
  - `mood_board_created` – new album/board created.
  - `mood_board_populated` – board reaches at least N outfits/items (e.g. 3).

- **Primary Metrics:**
  - % of new signups who create **any** mood board within first 7 days.
  - % who reach `mood_board_populated` threshold.
  - Time from `signup_completed` to `mood_board_created`.

#### 4. First AI Recommendation → AI Engagement

- **Surfaces:**
  - `OutfitSuggestions` tab.
  - `Discover` (combined trends + AI).
  - Any context where `generateOutfitSuggestions` or similar thunks are fired.

- **Key Behaviors:**
  - User requests AI recommendations.
  - User likes/dislikes suggestions and saves at least one.
  - User optionally adds AI-suggested outfit to a mood board.

- **Core Events:**
  - `ai_recommendation_requested` – user requests AI outfit(s).
  - `ai_recommendation_shown` – suggestions rendered to user.
  - `ai_recommendation_feedback` – thumbs up/down or similar.
  - `ai_recommendation_saved` – outfit from AI is saved.
  - `ai_recommendation_added_to_board` – AI outfit added to a mood board.

- **Primary Metrics:**
  - % of new signups who request AI recommendations within first 7 days.
  - % who save at least one AI-generated outfit.
  - Feedback mix (like vs dislike ratio).
  - % of AI outfits that end up on mood boards.

#### 5. Optional: Commerce & Deeper Retention

While the immediate activation goal is **first mood board + first AI interaction**, the same funnel should gently introduce commerce:

- **Core Events (conceptual):**
  - `product_viewed_from_board`
  - `product_viewed_from_ai`
  - `product_added_to_wishlist`
  - `product_added_to_cart`
  - `order_completed`

These are already partially reflected in marketplace analytics and can be layered into future activation/monetization funnels.

---

## Supporting Funnels (Brief)

### Reactivation Funnel (Dormant Consumer)

1. Email / push: “Your style story is waiting – update your mood board this week.”
2. Deep link to existing mood board or to a **new seasonal board template**.
3. Prompt to generate **new AI outfits** based on updated wardrobe or new season.

**Key Metrics:**

- Dormant → active rate (e.g. 30-day inactive to “used boards or AI in last 7 days”).
- Re-engagement conversion on campaigns targeting mood boards and AI.

### Seller / Brand Activation Funnel

1. Awareness: Seller-focused landing page (see `SELLER_ACQUISITION_BRAINSTORM.md`).
2. Signup via `BusinessAuth` and completion of business account/KYC.
3. Listing first products.
4. Having at least some products **appear in mood boards and AI-driven recommendations**.

This funnel is documented in more depth in seller-focused marketing docs; here it’s important that analytics and discovery systems **track seller-side activation in relation to mood boards and AI** (e.g. products featured on boards, in AI outfits, and in “complete the look” flows).

---

## Funnel Health Dashboards

To operationalize these funnels, we recommend:

- A dedicated **“Activation Funnel” section** in analytics dashboards (powered by `userEngagementSlice` and existing Supabase tables), showing:
  - New users this period.
  - % reaching `wardrobe_seeded`.
  - % creating a mood board.
  - % interacting with AI.
  - % doing both **board + AI** within the first 7 days.

- Segmentation by:
  - Acquisition channel (where available).
  - Persona proxy (e.g. heavy marketplace use vs heavy albums use).

Implementation details for events, properties, and dashboards are defined in  
`ANALYTICS_ACTIVATION_EVENTS.md` (analytics foundation todo).


# Activation & Acquisition Analytics – Event & Dashboard Specification

**Last Updated:** February 2026  
**Status:** v1 – extends `ANALYTICS_SYSTEM.md` and `ACTIVATION_FUNNELS.md`

---

## 1. Purpose

This document defines the **core analytics events, funnels, and dashboards** needed to measure:

- New user **acquisition → activation** (first mood board, first AI interaction)
- **Cross-persona activation** (Consumers, Pros, Sellers)
- The impact of **feature and marketing campaigns** on behavior

It complements:

- `ANALYTICS_SYSTEM.md` – backend-driven engagement analytics  
- `store/slices/userEngagementSlice.ts` – aggregate metrics & recommendations  
- `marketing/ACTIVATION_FUNNELS.md` – conceptual funnels  
- `marketing/FIRST_MOOD_BOARD_FUNNEL.md` – first-board campaign  
- `marketing/AI_RECOMMENDATIONS_CAMPAIGN.md` – AI campaign

---

## 2. Event Taxonomy & Naming

### 2.1 Principles

- Use **snake_case** event names (e.g. `signup_completed`, `mood_board_created`).
- Keep events **behavioral and product-focused**, not channel-specific.
- Include **context properties** when useful:
  - `source` / `campaign` / `persona_hint`
  - `device`, `plan_type`, etc. (as available).

### 2.2 Core Event Groups

1. **Acquisition & Auth**
2. **Wardrobe & Content Seeding**
3. **Mood Boards / Albums**
4. **AI-Driven Recommendations**
5. **Marketplace & Commerce**
6. **Seller / Business Activation**

These can be implemented either:

- As **client-side events** (event table or external analytics tool), or  
- Derived from existing **Supabase tables** (as done in `userEngagementSlice`) where appropriate.

---

## 3. Core Events by Group

### 3.1 Acquisition & Auth

| Event Name           | When it Fires                                            | Key Properties                                  |
|----------------------|----------------------------------------------------------|-------------------------------------------------|
| `landing_viewed`     | User views a key landing page (e.g. `/first-mood-board`) | `path`, `campaign`, `source`, `referrer`        |
| `signup_viewed`      | User views signup/auth screen                            | `source`, `campaign`                            |
| `signup_started`     | User begins filling signup form                          | `source`, `campaign`                            |
| `signup_completed`   | New account created / session established                | `source`, `campaign`, `is_business_portal`      |

**Primary use:** Track **conversion from visit → signup**, segment by campaigns and personas.

### 3.2 Wardrobe & Content Seeding

| Event Name             | When it Fires                                                 | Key Properties                              |
|------------------------|---------------------------------------------------------------|---------------------------------------------|
| `onboarding_prompt_shown` | On first session prompt to add wardrobe items / try AI/boards | `prompt_type` (e.g. `wardrobe_seed`)        |
| `wardrobe_item_added`  | User adds a clothing item                                     | `method` (upload, manual), `campaign`       |
| `wardrobe_seeded`      | User reaches seed threshold (e.g. ≥5 items)                  | `item_count`                                |

**Primary use:** Understand how many users get a **minimally useful wardrobe** for boards and AI.

### 3.3 Mood Boards / Albums

| Event Name              | When it Fires                                                  | Key Properties                          |
|-------------------------|----------------------------------------------------------------|-----------------------------------------|
| `mood_board_education_shown` | Tooltip/empty state explaining boards is shown                | `location` (e.g. Albums, onboarding)    |
| `mood_board_created`   | New album / mood board is created                              | `board_id`, `board_name`, `source`      |
| `mood_board_populated` | Board reaches N+ items/outfits (e.g. 3+)                       | `board_id`, `item_count`                |
| `board_item_added`     | An outfit/item is added to a board                             | `board_id`, `source` (manual, AI, trip) |

**Primary use:** Measure **first-board activation** and ongoing board-based engagement.

### 3.4 AI-Driven Recommendations

| Event Name                    | When it Fires                                                | Key Properties                                       |
|-------------------------------|--------------------------------------------------------------|------------------------------------------------------|
| `ai_recommendation_requested` | User initiates AI suggestions                                | `entry_surface` (Suggestions, Discover, Board CTA)   |
| `ai_recommendation_shown`     | AI results are successfully displayed                        | `count`, `entry_surface`                             |
| `ai_recommendation_feedback`  | Thumbs up/down or similar feedback is provided               | `outfit_id`, `feedback` (`liked`/`disliked`)         |
| `ai_recommendation_saved`     | User saves an AI-generated outfit                            | `outfit_id`, `destination` (favorites, board)        |
| `ai_recommendation_added_to_board` | Saved AI outfit is added to a mood board                 | `board_id`, `outfit_id`                              |

**Primary use:** Track **AI adoption and satisfaction**, and its connection to boards & commerce.

### 3.5 Marketplace & Commerce

Much of this is already modeled in Supabase tables; events help tie flows together and segment by campaigns.

| Event Name                 | When it Fires                                     | Key Properties                            |
|----------------------------|---------------------------------------------------|-------------------------------------------|
| `product_viewed`           | User opens a product page or drawer               | `product_id`, `source` (board, AI, search)|
| `product_added_to_wishlist`| User adds product to wishlist                      | `product_id`                              |
| `product_added_to_cart`    | User adds product to cart                          | `product_id`, `quantity`                  |
| `checkout_started`         | User starts checkout                               | `cart_value`, `item_count`                |
| `order_completed`          | Order successfully placed                          | `order_id`, `order_value`, `seller_id`    |

### 3.6 Seller / Business Activation

For the seller side (via `BusinessAuth`, `SellerDashboard`):

| Event Name                  | When it Fires                                      | Key Properties                             |
|-----------------------------|----------------------------------------------------|--------------------------------------------|
| `business_signup_completed` | User completes business signup/auth                | `source`, `business_id`                    |
| `business_profile_created`  | Business account & KYC info saved                  | `business_id`                              |
| `product_listed`            | Seller lists a product                             | `business_id`, `product_id`                |
| `first_order_received`      | Seller receives first order                        | `business_id`, `order_id`, `order_value`   |
| `seller_dashboard_viewed`   | Seller views `SellerDashboard`                     | `business_id`, `section` (products, orders, analytics) |

**Primary use:** Measure **seller-side activation** and health of the marketplace.

---

## 4. Core Funnels

### 4.1 Consumer Activation Funnel (Mood Boards + AI)

From `ACTIVATION_FUNNELS.md`:

1. `landing_viewed` or `signup_viewed`  
2. `signup_completed`  
3. `wardrobe_seeded`  
4. `mood_board_created`  
5. `mood_board_populated`  
6. `ai_recommendation_requested`  
7. `ai_recommendation_saved`

**Key Funnel Views:**

- Overall conversion through each step.
- Time to first `mood_board_created` and `ai_recommendation_requested`.
- Segment by:
  - Acquisition channel (`source`/`campaign`).
  - Device type (if tracked).

### 4.2 Creator / Pro Funnel

Heuristics for identifying pro/creator behavior:

1. `signup_completed`  
2. `mood_board_created` with **client-like naming pattern** or tag (optional)  
3. Multiple boards or high board complexity  
4. Repeated AI sessions (`ai_recommendation_requested` ≥ N times)

**Key analytics:**  
Board count, AI session count, repeat sessions per “pro-like” user.

### 4.3 Seller Funnel

1. `business_signup_completed`  
2. `business_profile_created`  
3. `product_listed` (first, then N products)  
4. `first_order_received`

Optionally later:

5. Products from that seller appear in AI outfits or mood boards (requires joins with outfits/boards).

---

## 5. Dashboards

### 5.1 Activation Dashboard (Consumers)

**Primary Panels:**

- **Funnel chart:** `signup_completed` → `wardrobe_seeded` → `mood_board_created` → `ai_recommendation_saved`.
- **Cohort table:** First-week behavior by signup date.
- **Segment views:**
  - By `campaign` / `source` (e.g. first-board campaign, AI campaign).
  - By persona proxy (e.g. board-heavy vs AI-heavy vs marketplace-heavy users).

### 5.2 Engagement & Feature Adoption (Overlay on `userEngagementSlice`)

Augment existing metrics in `userEngagementSlice` with:

- **AI adoption:**
  - % of active users with at least one AI session this period.
  - Average AI sessions per AI user.
- **Board adoption:**
  - % of active users with at least one populated board.
  - Boards per active user.

Tie these into `UserEngagementAnalytics` UI as additional cards or trending lines.

### 5.3 Seller / Marketplace Health

- Seller funnel conversion:
  - `business_signup_completed` → `business_profile_created` → `product_listed` → `first_order_received`.
- Per-seller:
  - Products listed, orders, revenue, repeat buyers (if available).
- Connection to consumer features:
  - % of orders originating from:
    - AI flows (AI-driven outfits).  
    - Mood boards (board → product → order).

---

## 6. Implementation Notes

- **Short term:**  
  - Use existing Supabase tables (`clothing_items`, `albums`, `outfits`, `orders`, `products`, etc.) as proxies where possible, as already done in `userEngagementSlice`.
  - Start by **naming and tracking** the essential milestones in reports, even if not every event is yet instrumented as a client event.

- **Medium term:**  
  - Introduce a simple **`events` table** or external analytics provider:
    - `event_name`  
    - `user_id`  
    - `business_id` (optional)  
    - `properties` (JSON)  
    - `created_at`
  - Wire up front-end calls from key components:
    - `Auth`, `WardrobeGrid`, `Albums`, `OutfitSuggestions`, `Discover`, `Marketplace`, `SellerDashboard`.

- **Long term:**  
  - Integrate events into the recommendations and experimentation stack:
    - Use event data to refine AI prompts and personalization.
    - Support A/B testing of onboarding, prompts, and campaign flows.

---

## 7. How Marketing & Product Use This Spec

- **Marketing & Growth**
  - Define campaign success criteria using these events (e.g. “uplift in `ai_recommendation_saved` for campaign-tagged cohort”).
  - Segment funnel performance by `campaign` and iterate channel mix accordingly.

- **Product**
  - Use activation dashboards to understand where users drop off (wardrobe seeding vs board creation vs AI).
  - Prioritize UX improvements and experiments to move users through these milestones.

- **Analytics / Engineering**
  - Use this spec as the **source of truth** when adding new tracking:
    - Keep event names stable and documented here.
    - Update this file when events are added/deprecated.


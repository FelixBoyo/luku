# “Your Style Story Starts Here” – First Mood Board Funnel

**Last Updated:** February 2026  
**Objective:** Drive new users to create and populate their **first DIY mood board** shortly after signup.

---

## 1. Campaign Overview

- **Campaign Name:** *Your Style Story Starts Here*  
- **Primary Persona:** Consumer (Style-Seeking User) – see `MULTI_SIDED_PERSONAS.md`  
- **Supporting Personas:** Creators & Pros (as secondary benefit)  
- **Primary Goal:** Increase % of new signups who create and populate at least one mood board in their first 7 days.

### Target Metric

- **Primary KPI:**  
  - `First Board Rate` = % of new users with `mood_board_created` **and** `mood_board_populated` (≥3 items) within 7 days of `signup_completed`.

- **Secondary KPIs:**
  - Time from signup → first board created.
  - % of first boards that contain at least one AI-recommended outfit.
  - Downstream: % of users with first board who return in week 2.

---

## 2. High-Level Funnel

1. **Ad / Social / Referral Click**  
   → 2. **Feature-focused Landing Page**  
   → 3. **Signup via `Auth`**  
   → 4. **Onboarding Nudge to Boards**  
   → 5. **First Mood Board Created & Populated**  
   → 6. **Follow-up AI & Retention Touches**

This funnel is a **specialized path** built on top of the generic consumer activation flows described in `ACTIVATION_FUNNELS.md`.

---

## 3. Landing Page – Structure & Copy Outline

**URL:** (example) `/first-mood-board`  
**Traffic Sources:** Paid social, organic social, email, influencer links, cross-promotion from blog.

### 3.1 Hero Section

- **Headline (H1):**  
  - “Create Your First Style Mood Board in 5 Minutes”

- **Subhead:**  
  - “Turn screenshots and outfit ideas into a beautiful board – then let AI suggest new looks from your wardrobe.”

- **Primary CTA Button:**  
  - Label: “Start My First Board”  
  - Behavior: Scroll to simple explainer or directly open signup modal.

- **Secondary CTA:**  
  - Label: “See Example Boards” (anchors to gallery section).

### 3.2 “How It Works” (3-Step Explainer)

**Section Title:** “From Inspo to Board in 3 Simple Steps”

1. **Add a few items**  
   - “Upload photos or add items to your digital wardrobe.”
2. **Create your first board**  
   - “Name a board – like ‘Spring Outfits’ or ‘Work Essentials’ – and drop in looks you love.”
3. **Let AI help**  
   - “Ask AI for outfit ideas and add your favorites to the board.”

Each step pairs **short copy + illustration or screenshot**.

### 3.3 Social Proof / Examples

- **Title:** “Boards from the LUKU Community”  
- **Content:** 3–6 visual examples:
  - “Everyday Work Looks”  
  - “Weekend Neutrals”  
  - “Vacation Capsule Wardrobe”

CTA under gallery: “Create a board like this →”

### 3.4 Benefits Section

Bullets focused on **emotional and practical** outcomes:

- “Feel in control of your style.”
- “Plan looks for your week or next event.”
- “See what you own, and where you actually need to shop.”

Include a note on sustainability:  
> “LUKU helps you make more of what you already own.”

### 3.5 FAQ / Objections

Address top concerns briefly:

- “Do I have to upload my entire wardrobe?” → “No – start with just a few favorites.”  
- “Is LUKU free?” → Basic mood boards and AI recs.  
- “Do I need to be ‘into fashion’?” → “If you wear clothes, you have a style story.”

### 3.6 Sticky / Final CTA

- Reuse hero CTA: “Start My First Board” → opens signup (`Auth`) with a tracking parameter (e.g. `utm_campaign=first_board`).

---

## 4. In-App Flow to First Board

Once a user signs up from this campaign, their first session should **reinforce the promise** of “First Mood Board in 5 Minutes.”

### 4.1 Entry Experience

- Detect campaign source (e.g. query param `source=first_board`) where feasible.
- On first load after `Auth`, show a **compact guided prompt**:

> “You’re 3 steps away from your first mood board.  
> 1) Add a few items → 2) Name your board → 3) Let AI suggest outfits.”

### 4.2 Flow Sequence (Conceptual)

1. **Wardrobe seed prompt**
   - Nudge: “Add 3–5 items to get started. You can always add more later.”
2. **Board creation prompt**
   - After threshold reached (or via skip path):  
     - “Great – now let’s create your first board.”  
     - Suggest a pre-filled name (e.g. “First Board” or “This Week’s Outfits”).
3. **AI prompt**
   - Once board exists: “Want AI to help fill this board?” → leads into `OutfitSuggestions` or a dedicated call to `generateOutfitSuggestions`.

> Implementation details for prompts/tooltips can be added into the relevant React components later; this doc defines the **intended user journey**.

---

## 5. Channel Strategy

### 5.1 Paid Social

- **Angle:** “5-Minute Style Upgrade”  
- **Example Ad Line:**  
  - “In 5 minutes, turn inspo screenshots into a real style mood board. Let AI fill in the gaps.”
- **Creative:**  
  - Before/after: messy screenshots → clean LUKU board.
  - Short screen capture of board creation.

### 5.2 Organic Social

- Creator/influencer content:
  - “Watch me build my first LUKU board.”
  - “I let AI plan a week of outfits from this board.”

- LUKU-owned content:
  - Carousel: “3 board ideas to try this weekend.”
  - Reels/TikToks pulling from `FEATURE_HIGHLIGHTS.md` mood board angles.

### 5.3 Email

- **Subject:** “Create Your First Style Mood Board Tonight”  
- **Body:** Adapt mood-board launch email template from `EMAIL_TEMPLATES.md`, but focused on:
  - Speed (“5 minutes”).
  - Visual transformation.
  - Gentle prompt to use AI to fill the board.

### 5.4 Onsite Promos

- Small banner or placement on homepage:
  - “New? Start with your first mood board →”
  - Links to `/first-mood-board` landing page.

---

## 6. Measurement & Iteration

Tie this funnel explicitly into the analytics foundation:

- **Track:**
  - Landing page views (`first_board_landing_viewed`).
  - Clicks on primary CTA (`first_board_cta_clicked`).
  - `signup_started` / `signup_completed` with campaign/source parameter.
  - `mood_board_created` and `mood_board_populated` for these users.

- **Compare:**
  - First-board rate for **campaign-tagged** users vs general cohort.
  - Retention for first-board users vs non-board users.

Depending on results:

- If **click-through but low board creation**, simplify in-app steps or add stronger prompts.  
- If **board creation is high but AI usage is low**, add a follow-up campaign focused on “Let AI help you fill your board” (bridging into the AI campaign defined separately).

---

## 7. Handoffs & Ownership

- **Marketing:**
  - Own landing page copy, email, and social campaign assets.
  - Define and monitor campaign KPIs.

- **Product/Engineering:**
  - Implement tracking events (as defined in analytics docs).
  - Implement minimal in-app prompts and any new route (`/first-mood-board`) if/when prioritized.

- **Design:**
  - Create landing visuals, in-app banners/tooltips, and social templates following `BRAND_GUIDELINES.md`.

This document is the **source of truth** for the first-mood-board acquisition funnel and should be updated as flows, routes, and messaging evolve.


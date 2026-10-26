# “Your Personal Stylist, Powered by AI” – Campaign Plan

**Last Updated:** February 2026  
**Objective:** Showcase LUKU’s **AI-Driven Recommendations** to drive **new user acquisition and early activation** around AI-powered outfits.

---

## 1. Campaign Overview

- **Campaign Name:** *Your Personal Stylist, Powered by AI*  
- **Primary Personas:**
  - Consumer – Style-Seeking User
  - Tech-Savvy Early Adopter (from `MARKETING_STRATEGY.md`)
- **Secondary Personas:**
  - Creators & Pros (AI as idea generator)
  - Sellers (AI as “complete the look” engine – later phase)

### Core Goal

Increase the share of new and existing users who:

1. **Request AI recommendations** at least once.  
2. **Save at least one AI-generated outfit.**  
3. Optionally **connect AI outfits to mood boards and products**.

### Primary KPIs

- % of new signups who trigger `ai_recommendation_requested` within 7 days.
- % of those signups who trigger `ai_recommendation_saved`.
- Feedback mix on AI suggestions (like vs dislike) and repeat AI usage.

Secondary KPIs:

- Uplift in time spent engaging with outfits and boards.
- Downstream commerce for users heavily engaging with AI.

---

## 2. Messaging Framework

Pulls from `FEATURE_HIGHLIGHTS.md` and `MESSAGING_MATRIX.md`.

### 2.1 Core Promise

> “LUKU’s AI learns your style and builds outfits you’ll actually wear – using the clothes you already own.”

### 2.2 Supporting Pillars

1. **Personalization Over Time**
   - “The more you use it, the smarter it gets.”
   - “Teach it with simple thumbs up/down.”

2. **Time & Decision Fatigue Relief**
   - “Spend less time deciding, more time living.”
   - “Let AI plan your week of outfits in minutes.”

3. **Discovery from Your Existing Wardrobe**
   - “New combinations from pieces you already own.”
   - “See your wardrobe in a completely new way.”

4. **Smart Shopping (Optional Angle)**
   - “When you do shop, AI suggests pieces that actually fit your style and wardrobe gaps.”

---

## 3. Funnel & User Journey

This campaign sits alongside and complements the **First Mood Board** funnel.

### 3.1 High-Level Funnel

1. **Ad / Content / Referral** – AI-focused hook.  
2. **Landing or Homepage** – short explainer and promise.  
3. **Signup / Login** through `Auth`.  
4. **Onboarding Prompt** – nudge to try AI.  
5. **First AI Recommendation Session** – user generates outfits.  
6. **Save & Organize** – user saves at least one outfit and optionally adds to a board.

### 3.2 Key Product Moments (Conceptual)

- Entry:
  - On first or early session, show a **“Try AI now”** strip in appropriate tabs (`Suggestions`, `Discover`, or `LifestyleHub`).
- Within AI view:
  - Clear CTA: “Teach LUKU your style – tap thumbs up/down.”
  - One-tap option: “Save this outfit to a mood board.”

The exact implementation of prompts and UI copy will live in the React components; this document defines the **intended narrative and behaviors**.

---

## 4. Channel-by-Channel Plan

### 4.1 Paid Social (Acquisition)

**Angle:** “An AI stylist that uses your real wardrobe.”

- **Concept 1 – Before/After Decision Fatigue**
  - Visual: Split screen – left: confused in front of wardrobe; right: phone displaying AI outfits.
  - Copy:  
    - “Still staring at your closet every morning?”  
    - “Let AI plan your outfits in minutes.”

- **Concept 2 – AI Learning Your Style**
  - Visual: Quick sequence of thumbs up/down, then evolving recommendations.
  - Copy:  
    - “The more you tap, the smarter it gets.”  
    - “Meet the AI stylist that actually learns you.”

**CTA:** “Try AI styling free” → sign up → pushed quickly into AI suggestions.

### 4.2 Organic Social

**Platforms:** Instagram, TikTok

- Short-form videos:
  - “I let AI plan my outfits for the week – here’s what happened.”
  - “Rating my AI outfits from LUKU 1–10.”
  - “I told LUKU’s AI: ‘90s minimal, neutral colors only’ – results inside.”

- Static/Carousel:
  - “3 prompts to try with LUKU’s AI tonight.”
  - “How to teach LUKU your style in 5 minutes.”

Use hashtag sets from `MARKETING_STRATEGY.md` and “AI” variants (e.g. `#AIFashion`, `#PersonalStylist`).

### 4.3 Email

**Target cohorts:**

- New users who have **not** triggered AI events yet.
- Existing users who have used boards/wardrobe but not AI.

**Key sequences:**

1. **Intro to AI (welcome series extension)**
   - Subject: “Let LUKU’s AI learn your style today”  
   - Body: Explains “how it works” simply, with a clear CTA: “Try AI outfits now.”

2. **Prompt Ideas & Tips**
   - Subject: “3 AI styling prompts to try tonight”  
   - Content: Prompts like:
     - “Smart casual, neutral colors, for rainy days.”
     - “Travel capsule: 5 outfits, 3 bottoms, 2 shoes.”

3. **Reactivation**
   - Subject: “Your AI stylist misses you”  
   - Angle: “We saved where you left off – tap once to get new ideas.”

Email templates can reuse and extend the AI sections already present in `EMAIL_TEMPLATES.md`.

### 4.4 Website & In-App

- Homepage or feature page:
  - Short block: “Your AI stylist that learns your style.”
  - Link to a “How it works” section or video.

- In-app:
  - Microcopy in `OutfitSuggestions` / `Discover`:
    - “Every thumbs up/down teaches LUKU more about your style.”
    - “Save your favorite AI outfits and add them to a board.”

---

## 5. Integration with Mood Boards & Sellers

### 5.1 With Mood Boards

To keep messaging coherent:

- Encourage users to **turn AI outfits into boards**:
  - In-product: “Like this AI outfit? Add it to a mood board.”
  - Email: “How to build a full board from your favorite AI looks.”

- Campaign storytelling:
  - AI as the **engine** and mood boards as the **canvas**:
    - “Let AI generate outfits – then curate your favorites into a board.”

### 5.2 With Sellers (Later Phase)

For sellers and brands (tying into `SELLER_ACQUISITION_BRAINSTORM.md`):

- Angle: “AI helps buyers discover your products in complete looks.”
- Future campaign layer:
  - “Your items can power ‘complete the look’ suggestions on LUKU.”
  - Requires product→outfit→order attribution in analytics foundation.

---

## 6. Measurement Plan

Tie to the analytics foundation and user engagement system:

**Events to watch (conceptual names; see analytics doc for spec):**

- `ai_recommendation_requested`
- `ai_recommendation_shown`
- `ai_recommendation_feedback`
- `ai_recommendation_saved`
- `ai_recommendation_added_to_board`

**Dashboards / views:**

- New vs existing users:
  - Adoption and conversion by cohort.
- Source-based:
  - Campaign-tagged cohorts vs baseline (if UTM data or inferred sources are available).
- Retention:
  - Compare users who save at least one AI outfit vs those who don’t.

**Optimization Loop:**

- If **many users request but few save**:
  - Improve initial wardrobe seeding prompts (more items before AI).
  - Strengthen explanations / prompt suggestions.

- If **saved outfits rarely move into boards**:
  - Add clearer “Add to board” CTAs.
  - Run a follow-up experiment combining AI + mood-board prompts.

---

## 7. Execution Summary

- **Marketing** owns:
  - Paid/organic creative and copy.
  - Email sequences and landing copy.
  - Performance monitoring and reporting.

- **Product/Engineering** owns:
  - Ensuring AI flow is smooth, fast, and reliable.
  - Implementing and validating analytics events.
  - Small in-app nudges to drive first AI use and saving.

- **Design** owns:
  - Visual storytelling for AI (screens, motion, icons).
  - Keeping the experience aligned with `BRAND_GUIDELINES.md`.

This document should be used as the **reference campaign plan** for AI-driven recommendations and updated as the product and analytics capabilities evolve.


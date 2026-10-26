# LUKU Feature Launch Playbook

**Last Updated:** February 2026  
**Status:** v1 – complements “Launch Campaigns for New Features” in `MARKETING_STRATEGY.md`

---

## Purpose

This playbook turns the high-level launch framework in `MARKETING_STRATEGY.md` into an **operational checklist** for any significant feature, especially:

- DIY Mood Board improvements
- AI-Driven Recommendations upgrades
- New seller/marketplace features
- New analytics or engagement tools

Every feature launch should answer the same core questions:

1. **Who is this for?** (persona + side of marketplace)  
2. **What behavior do we want to change or create?**  
3. **How will we tell the story across channels?**  
4. **How will we educate users in-product?**  
5. **How will we know it worked?**

---

## Phase 0 – Discovery & Brief (Pre-Build or Early Build)

**Goal:** Align product, marketing, and design on *why* the feature exists and *how* we will position it.

**Inputs:**

- Product spec / PRD
- `MULTI_SIDED_PERSONAS.md`
- `FEATURE_HIGHLIGHTS.md`
- `MESSAGING_MATRIX.md`

**Outputs:**

- A **1-page launch brief** stored in the marketing folder (e.g. `FEATURE_LAUNCH_[FEATURE_NAME].md`) including:

1. **Feature summary (non-technical)**
   - What is the feature?  
   - Is it net-new, an improvement, or a repackage?

2. **Target persona(s) & side(s)**
   - Consumer, Pro, Seller – and which specific segment(s) in `MARKETING_STRATEGY.md`.

3. **Key user problem(s) solved**
   - 2–3 bullet points mapping pain → outcome.

4. **Hero benefit statement**
   - One sentence: “With this feature, [persona] can [do X] so they [achieve Y].”

5. **Primary activation metric**
   - The *one* behavior we must see increase (e.g. mood boards created, AI outfits saved, seller products featured in outfits).

6. **Secondary metrics**
   - Engagement, retention, or revenue signals influenced by the feature.

7. **Release scope & risks**
   - What’s in v1 vs later.

---

## Phase 1 – Pre-Launch (Designing the Story & Assets)

**Goal:** Prepare all external and in-product assets **before** the feature ships.

### 1. Messaging & Positioning

- Use `MESSAGING_MATRIX.md` to derive:
  - **1 hero message** per primary persona.
  - **Support messages** (2–3 proof points).
- Update or extend `FEATURE_HIGHLIGHTS.md` with:
  - Short, medium, and long descriptions.
  - Social snippets and email hooks.

### 2. GTM Asset Checklist

For each launch, decide which assets are **in scope**:

- **Website / Landing**
  - Hero banner or section update.
  - Dedicated feature/landing section (if major).

- **Email**
  - Use `EMAIL_TEMPLATES.md` feature launch sections as a base.
  - At minimum: one **announcement email** and, for key features, a **follow-up tips email**.

- **Social & Content**
  - 1–3 Instagram/TikTok pieces (demo, tutorial, before/after).
  - 1–2 static posts (carousels with steps or benefits).
  - Optional blog post or case study if the feature is substantial.

- **Paid**
  - Simple adaptation of social assets into paid creatives.
  - Clear CTA aligned with activation metrics (e.g. “Create your first board”, “Try AI outfits”).

### 3. In-Product Education

Plan the **minimum viable in-product education**:

- Tooltips, banners, or **empty state copy**:
  - Where should users first see this feature?  
  - What is the one-sentence explanation there?
- Onboarding touches:
  - Should first-time users see an inline walkthrough?

Reference:

- `MARKETING_STRATEGY.md` sections on onboarding & engagement.
- `ACTIVATION_FUNNELS.md` to ensure launches tie into key journeys (e.g. first board, first AI use).

---

## Phase 2 – Launch Day

**Goal:** Coordinate a consistent story across channels on or around the release date.

### Launch Day Checklist

- [ ] Confirm production deployment and core UX flow is stable.  
- [ ] Update any **in-app labels/text** needed to reveal the feature (if copy changes are required).  
- [ ] Push:
  - [ ] Website hero or feature section.
  - [ ] Announcement email (or include in weekly newsletter).
  - [ ] Primary social posts (Instagram, TikTok, others).
  - [ ] Any seller/pro specific comms if the feature targets them.
- [ ] Ensure **support resources** are aware:
  - [ ] Add a short entry in `SUPPORT_FAQ.md` or support docs if relevant.
  - [ ] Provide 3–5 quick answers for expected questions.

### Example Launch-Level Scoping

- **“Major” launch (e.g. new AI mode, big mood board upgrade):**
  - Dedicated landing section.
  - Email + multiple social posts + potentially paid promotion.
  - One blog/tutorial asset.

- **“Minor”/iterative launch (e.g. improved filters, minor UX changes):**
  - In-app banner or tooltip.
  - Mention in release notes/email roundup.
  - One social post or story.

---

## Phase 3 – Post-Launch (First 2–4 Weeks)

**Goal:** Drive adoption, collect feedback, and validate impact against activation metrics.

### Adoption & Education

- Run a **short campaign window**:
  - Highlight the feature in social content and stories.
  - Re-share user examples where possible (e.g. new mood boards, AI looks).
- In-product:
  - Keep gentle prompts in empty states or key surfaces.
  - Experiment with micro-CTAs:
    - “Try AI on this board.”
    - “Turn this outfit into a mood board.”

### Measurement

Using `ANALYTICS_SYSTEM.md` and the activation events defined in `ANALYTICS_ACTIVATION_EVENTS.md`:

- Compare **pre vs post**:
  - Feature-specific events (e.g. `mood_board_created`, `ai_recommendation_saved`).
  - Downstream behavior (e.g. wishlist, orders for sellers).
- Segment by:
  - New vs existing users.
  - Persona proxies (heavy boards users, heavy AI users, heavy marketplace users).

### Feedback Loop

- Collect:
  - Support tickets & FAQs.
  - Qualitative feedback from power users, sellers, or creators.
  - Social mentions and UGC.
- Summarize in a **Post-Launch Review**:
  - What worked well.
  - What confused users.
  - What needs iteration in product or messaging.

---

## Phase 4 – Iterate & Re-Roll (Optional)

For features central to activation (e.g., mood boards, AI recs), plan **small follow-up releases**:

- Improve UX based on data and feedback.
- Run a **“re-launch” moment**:
  - “We listened” updates.
  - New examples and tutorials.

---

## Example: Applying the Playbook

**Feature:** “AI-Powered Mood Board Suggestions”  
**Persona:** Consumer + Creator/Pro  
**Primary Metric:** Number of mood boards created and populated with AI-suggested outfits within 7 days of signup.

**Phase 0 Brief (compressed):**

- Problem: Users love AI outfits, but don’t always organize them; mood boards adoption is strong but could be smoother.  
- Solution: Let AI propose an initial mood board layout and suggested outfits; user edits rather than starts from scratch.  
- Hero line: “Let AI draft your first mood board – you just fine-tune the story.”

**Phase 1 Assets:**

- Feature highlight update in `FEATURE_HIGHLIGHTS.md`.  
- Email template adaptation from feature launch section in `EMAIL_TEMPLATES.md`.  
- Social post: short Reel/TikTok “Watch AI build my board in 30 seconds.”

**Phase 2 Launch:**

- In-app banner near Albums: “New: AI mood board drafts – try it on your first board.”  
- Email: “Let AI start your first board tonight.”  
- Social: Launch Reel and a static post linking to the feature.

**Phase 3+:**

- Track uplift in:
  - `mood_board_created` / `mood_board_populated`  
  - `ai_recommendation_saved` tied to boards.
- If uplift and qualitative feedback are strong, consider:
  - Highlighting this feature prominently in onboarding.
  - Creating a dedicated “First Board” acquisition campaign (see separate funnel docs).

---

## How to Use This Playbook

- For each new feature or major improvement:
  1. Create a brief using **Phase 0**.
  2. Decide the scope of GTM assets using **Phase 1**.
  3. Run the **Phase 2–3** checklist around launch.
  4. Summarize learnings and iterations in a short **Post-Launch Review** stored alongside the feature brief.

- Reuse this structure, but keep it **lightweight**:
  - Major hero features: apply all phases in full.
  - Small improvements: run a “mini” version (brief + a small set of assets).


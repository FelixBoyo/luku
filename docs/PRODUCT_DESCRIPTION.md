# LUKU — Detailed Product Description

**Version:** 1.0.0  
**Tagline:** Your Personal Style Companion

---

## Overview

**LUKU** is an AI-powered wardrobe stylist and lifestyle platform that helps users express their unique style through personalized fashion recommendations while promoting sustainable choices and conscious living. The product combines cutting-edge AI (Google Gemini), a full wardrobe and outfit management system, a seller marketplace with Stripe checkout, and a PWA-ready web application.

---

## Mission & Brand

### Mission Statement
LUKU empowers individuals to express their unique style through AI-powered fashion recommendations while promoting sustainable choices and conscious living.

### Brand Personality
- **Empowering** — Focus on self-expression and confidence
- **Inclusive** — Celebrate diversity in style and body types
- **Sustainable** — Champion conscious fashion choices
- **Modern** — Tech-forward yet approachable
- **Innovative** — Cutting-edge AI meets timeless style wisdom
- **Approachable** — Professional yet friendly, never intimidating

### Visual Identity
- **Primary gradient:** Indigo (#6366f1) to Purple (#a855f7)
- **Accent:** Pink (#ec4899)
- **Secondary:** Green (#10b981), Blue (#3b82f6), Yellow (#f59e0b)
- **Neutrals:** Gray scale for backgrounds and text; white for clean layouts
- **Logo:** Sparkle icon representing AI-powered insights; always displayed as "LUKU" (uppercase)

---

## Core Value Propositions

1. **Discover Your Style DNA** — Analyze fashion evolution and preferences
2. **Personalized Outfit Suggestions** — AI-curated looks based on the user’s wardrobe
3. **Sustainable Choices** — Track eco-impact and get green styling tips
4. **Color Harmony** — Find color combinations grounded in color theory
5. **Trip Wardrobes** — Pack smart with versatile, AI-generated outfit plans
6. **Virtual Try-On** — Visualize outfits before wearing them
7. **Shop & Sell** — Browse marketplace and run a seller business from the same app

---

## Product Features (As Implemented)

### Lifestyle Hub
Personalized dashboard for conscious living:
- **Eco Score** — Sustainability impact tracking
- **Daily Outfit** — AI-recommended outfit of the day
- **Laundry Tracker** — Manage clothing status (clean / in wash / dirty)
- **Style Sanctuary** — Daily affirmations and exercises
- **Smart Shopping / Budget Suggestions** — Budget-friendly purchase suggestions

### My Wardrobe
- Add, edit, and delete clothing items
- AI-powered image analysis for items
- Status tracking (clean, in wash, dirty) and laundry workflows
- Usage analytics (e.g. use count)
- Attributes: name, category, color, style, season, date added

### Outfit Suggestions
- AI-generated outfit combinations from the user’s wardrobe
- Custom prompts and style preferences
- Feedback (liked/disliked) to improve recommendations
- Outfit preview and visualization support

### Fashion Trends
- AI-analyzed trends aligned with the user’s wardrobe
- Trend descriptions and suggested outfits
- Feedback on trend outfits

### Style DNA / Style Evolution
- Core style profile (keywords, top colors, top categories)
- Style evolution narrative
- Personalized recommendations and guidance
- Style Playground for experimenting with looks

### Color Harmony
- Color theory–based analysis for a chosen base item
- Suggested outfits that harmonize with the selected color
- Explanation of why combinations work

### Trip Planner
- Create trips with destination, dates, and notes
- AI-generated daily outfit plans and packing lists
- Reuse and edit saved trip plans

### Virtual Try-On
- Visualize how outfits look (AI image generation)
- Queue outfits for try-on and view results
- Mannequin/settings for try-on experience

### Albums (Mood Boards)
- Create custom collections of favorite outfits
- Organize by occasion, season, or theme
- Save and remove outfits from albums
- DIY mood boards as a core differentiator

### Sustainability
- Sustainability score and justification
- Suggested outfits that support sustainable choices
- Actionable tips for more conscious fashion

### Marketplace (E-Commerce)
- **Buyer:** Browse products, search, filters, product detail, reviews, size guide, wishlist, cart, Stripe checkout, order history, return requests
- **Seller:** Business account registration, KYC, product management (CRUD), image upload, inventory alerts, promotions, order dashboard, returns handling, sales widgets, analytics
- **Product features:** Tags, recently viewed, social proof, share, quick view, seller info, contact seller
- **Checkout:** Single-item and multi-item checkout; Stripe integration

### Discover
- Discovery feed for products and content (structure in app)

### User & Account
- Auth (Supabase): sign up, sign in, sign out, password reset
- Session handling and optional dev bypass for testing
- Business account linked for sellers
- Wishlist page, My Orders, Return Management
- User engagement analytics (in-app)

### Technical UX
- **PWA:** manifest, service worker, install prompt, icons (e.g. 192, 512)
- **Responsive:** Mobile bottom nav and layout for small screens
- **UI:** Header, cart sidebar, toasts, error boundary, common components (Spinner, Toast, etc.)
- **Integrations:** Google Gemini (e.g. 2.5 Flash), Supabase (auth + PostgreSQL), Stripe (payments)

---

## Tech Stack

| Layer           | Technology                          |
|----------------|-------------------------------------|
| Frontend       | React 19, TypeScript                |
| Build          | Vite 6                              |
| State          | Redux Toolkit, React-Redux          |
| Styling        | Tailwind CSS (inferred from usage)  |
| AI             | Google Gemini (@google/genai)       |
| Backend / Data | Supabase (Auth + PostgreSQL)        |
| Payments       | Stripe (React + JS SDKs)            |
| Testing        | Vitest, Testing Library (React/DOM/user-event) |

---

## Data & Integrations

- **Environment:** `GEMINI_API_KEY`, `SUPABASE_PROJECT_ID`, `SUPABASE_ANON_KEY` (and Stripe keys where used)
- **Database:** SQL schemas for e-commerce, KYC, product tags, returns, social proof, style playground, virtual try-on, and backend optimizations
- **APIs:** Supabase client, Gemini for AI features; Stripe for payment and checkout

---

## Keywords (Product & SEO)

Fashion, AI stylist, sustainable fashion, wardrobe organizer, personal style, outfit suggestions, color harmony, LUKU.

---

## Support & Documentation (In Repo)

- **Support:** SUPPORT_FAQ.md, SUPPORT_GUIDES.md, SUPPORT_RESOURCES.md
- **Brand:** BRAND_GUIDELINES.md
- **Marketing:** marketing/ (strategy, content calendar, email templates, feature highlights, quick start)
- **Implementation:** IMPLEMENTATION_REPORT.md, QUICK_REFERENCE.md, INTEGRATION_GUIDE.md, BACKEND_QUICK_START.md
- **Testing:** TESTING.md; Vitest scripts: test, test:ui, test:coverage, test:watch, test:run

---

## License & Attribution

- **License:** MIT  
- **Author:** LUKU Team  
- **Tagline:** *Where Style Meets Sustainability*

---

*This document describes LUKU as implemented in the codebase and existing documentation, without normative or forward-looking claims.*

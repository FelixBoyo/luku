Figma Make Prompt — LUKU Revamp (v2 — composition-aware)
Paste everything between the lines into Figma Make. Replace [paste your Figma file URL here] with your existing draft link.

1) Product context
You are designing the revamp of LUKU — Your Personal Style Companion, an AI-powered wardrobe stylist that fuses personal styling, sustainable fashion, and a creator/seller marketplace.

What LUKU does:

Digitize and organize a user's wardrobe with AI image tagging.
Generate personalized outfit suggestions, fashion trends, and a "Style DNA" analysis (Google Gemini).
Save outfits to mood boards (albums) and try them on virtually (mannequin / saved photo / new upload).
Track sustainability impact (eco score, laundry status, smart-shopping tips, style sanctuary).
Shop a curated marketplace where independent sellers list items, with end-to-end checkout via Stripe, Paystack, and M-Pesa STK push.
Empower sellers via a Seller Dashboard (business + seller KYC, product mgmt, orders, promotions, payouts, analytics).
Empower style creators via affiliate earnings on "shop the look."
Target users: fashion-conscious, sustainability-aware individuals 18–45 across East Africa first (Kenya, Uganda, Tanzania) and progressively global. Mobile-first; must also render beautifully on desktop web. Dark mode is a first-class deliverable.

Existing mockups: I already have a draft Figma file at [paste your Figma file URL here]. Treat it as the visual reference for design language. Do not regenerate screens that already exist there from scratch — apply a light visual refresh to align them with the new design system, and add the net-new sections / screens listed in section 5.

2) Brand & design system (must honor)
Name (always uppercase): LUKU
Tagline: Your Personal Style Companion
Personality: Empowering, inclusive, sustainable, modern, approachable. Never judgmental, never body-shaming.
Primary brand gradient: Indigo #6366f1 → Purple #a855f7
Accent: Pink #ec4899
Secondary semantic colors: Green #10b981 (sustainability), Blue #3b82f6 (wellness/info), Yellow #f59e0b (warmth/promos), Red for destructive actions only.
Neutrals: Gray 50→900; white surfaces in light mode, near-black (#0b0b12) + raised surfaces (#16161f, #1f1f2b) in dark mode.
Typography: System sans-serif. pageTitle 3xl/bold, sectionTitle 2xl/bold, subtitle sm/muted, generous body line-height, tight tracking on headings.
Iconography: Line icons, 1.5–2.5 px stroke, rounded caps. Sizes: 20 px (buttons), 32 px (section headers), 64 px (hero).
Radii: sm 6 / md 8 / lg 12 / pill. Shadows: subtle / medium / strong — sparingly; prefer 1 px borders on neutral surfaces.
Layout: max-w-7xl page container, card-based modules, mobile bottom nav (5 primary tabs + "More" sheet), persistent web header with Wishlist + Cart actions.
Voice: "Discover," "Celebrate," "Build a sustainable wardrobe that works for you." Avoid "fix," "problem area," "must-have for your body type."
Accessibility: WCAG 2.1 AA in light and dark. Test text on gradient backgrounds. Min 44×44 tap targets. Alt-text fields on every image component.
Deliver tokens as Figma Variables in collections: color/, space/, radius/, shadow/, typography/, layout/. Each color variable must have Light and Dark modes so screens flip with a single variable-mode switch. These map directly to core/theme/tokens.ts in the codebase — call out any new tokens in the hand-off notes.

3) Information architecture (current shipping app)
Mobile bottom nav — Tier 1 (5 tabs): Hub · Discover · Wardrobe · Mood Boards · Shop · (+ "More" overflow) More sheet (Tier 3): Virtual Try-On · Color Harmony · Trip Planner · Style Playground · Seller Dashboard (only if user has a business account) · Creator Dashboard (only if user has joined the creator program) · Account. Desktop web: Same primary nav rendered as horizontal nav inside the header, plus Wishlist, Cart, user menu (which exposes Account, Seller, Creator). Hidden / routed via header or surfaces: Wishlist, My Orders, Returns, Engagement Analytics, Business portal (/business), Notifications inbox.

4) Composition principles — features live on shared pages, not separate routes
This is the most important constraint in this brief.

Page-first, not feature-first. Each top-level route is a page that hosts multiple sections (cards, lists, charts, mini-dashboards). Treat new features as candidate sections on an existing page before proposing a new route.
Section taxonomy. Every section uses the shared SectionCard component (title, optional subtitle, optional CTA in the header, body slot, optional footer). Sections collapse, reorder responsively, and can host KPIs, lists, charts, or composed sub-components.
Responsive density rules.
Desktop (1440): show multiple sections side-by-side in a 12-column grid; hero sections span 8–12 cols, secondary 4–6.
Mobile (390): sections stack vertically; long pages use a sticky sub-nav (chip rail) that scrolls between section anchors. A section may also collapse behind a "See all" link that opens a focused sub-page.
Detail surfaces.
Default to in-place drawers / bottom sheets / modals for item-level detail (wardrobe item, outfit, product quick view, order detail, return detail, notification detail).
Promote to a full sub-page only when the detail has its own deep interaction (e.g. Product Detail with reviews, Outfit Detail full-screen with wear log, Seller Order detail with shipping label, Creator Look composer).
Re-use Hub as the spine. The Lifestyle Hub is the canonical multi-feature dashboard — surface previews from Wardrobe, Discover, Mood Boards, Marketplace, Sustainability, Notifications, Creator, Seller into Hub sections, each with a "See all" link to its parent page. Avoid "naked" pages that exist only to host one widget.
Hide-when-empty / hide-when-irrelevant. Sections gated by role (seller, creator, Pro) or by data presence (no trips → hide Trip section, show CTA card instead) should be designed with an explicit empty / locked / CTA variant rather than hidden without trace.
Avoid route explosion. If a "new screen" idea below can become a section or a drawer on an existing parent, design it that way. Use new routes only when (a) the surface has deep IA of its own, (b) it's commonly bookmarked or linked externally, or (c) it's needed for SEO/sharing.
5) Page-by-page composition (existing + new, consolidated)
For each page below, design mobile (390×844) and desktop web (1440) in Light + Dark, with default / empty / loading (skeleton) / error / success states for every section.

Each entry lists:

Existing sections (already in the draft — refresh visuals only)
NEW sections to add (this is where the missing features get composed in)
Detail surfaces (modals, drawers, sheets, or sub-pages it spawns)
5.1 Lifestyle Hub (the personal dashboard — biggest composition target)
Existing sections: OOTD card · Eco score gauge · Laundry tracker · Style sanctuary (daily affirmation + exercise + article) · Smart shopping (budget) suggestions · Onboarding banner.

NEW sections to add (on the same page):

Welcome strip — greeting, weather-aware hint, streak count, weekly recap CTA.
Quick actions row — "Add to wardrobe," "Log today's outfit," "Generate outfit," "Open try-on" (chips).
Wardrobe insights mini — items, items needing wash, most-worn this month, "See all" → Wardrobe Insights drawer.
Discover preview rail — top 3 AI suggestions + top 1 trend card; "See all" → Discover.
Marketplace recommendations rail — wardrobe-based picks + recently viewed; "See all" → Marketplace.
Sustainability snapshot — CO₂ saved this month, water saved, swaps suggested; "Deep dive" → Sustainability page.
Achievements & streaks card — current streak ring + 1 in-progress badge.
Notifications preview — last 3 unread; "See all" → Notifications.
LUKU Pro upsell card (collapsible; hidden when subscribed; replaced by a "Pro benefits" mini-card).
Creator earnings widget (only if creator) — month-to-date earnings, top-performing look, "Open dashboard."
Seller widget (only if seller) — pending orders, low-stock alerts, today's revenue, "Open dashboard."
Refer-a-friend banner (rotational, dismissible).
Detail surfaces from Hub: OOTD → Outfit Detail full-screen · Try-on CTA → Virtual Try-On · Wardrobe insights → Wardrobe Insights drawer · Notification item → Notification Detail panel · Seller/creator widgets → respective dashboards.

5.2 Discover
Existing sections: Suggestions tab (style selector + custom-prompt + outfit grid) · Trends tab · Style DNA tab.

NEW sections to add (on the same page):

Persistent filter chips at top (aesthetic, occasion, color, season) shared across all three tabs.
"Shop the look" inline insert — on every outfit card, show a collapsible row of matching marketplace products.
Style DNA result composition — keywords cloud, top colors swatch, top categories, evolution narrative, recommendations carousel — all on one tab, no sub-pages.
Save-to-mood-board inline action (sheet) instead of dedicated modal page.
Detail surfaces: Outfit Detail full-screen · Product Quick View · Save-to-Mood-Board sheet.

5.3 Wardrobe
Existing sections: Grid · Status chips · Item card · Upload entry.

NEW sections to add (on the same page, as tabbed/segmented control at the top):

Items tab (default) — current grid + filters + multi-select bulk actions.
Insights tab — most/least worn, cost-per-wear, category balance donut, color distribution bar, "items not worn in 90 days" list.
Laundry tab — pull the laundry tracker out of Hub into a focused view; statuses + finish-laundry action.
Wear log tab — calendar / timeline of "I wore this today" check-ins.
Floating action button (FAB) — opens Upload flow.
Detail surfaces: Wardrobe Item Detail (right-side drawer on desktop, full-screen on mobile) · Upload flow (full-screen wizard) · AI-tag review (full-screen step inside Upload) · Delete-with-affected-outfits confirmation modal.

5.4 Mood Boards (Albums)
Existing sections: Albums grid · Album detail (drill-in) · Create-album modal · Save-outfit modal · Generate-from-album action.

NEW sections to add:

Album detail revamp — cover image header, outfit count, share to social (image export), reorder outfits, "Generate similar" inline button.
Public mood board view — read-only at a public URL with OG meta.
Collaborate placeholder (Phase 2) — invite UI without backing logic.
Detail surfaces: Outfit Detail full-screen · Save-to-Mood-Board sheet · Share sheet.

5.5 Marketplace (also a dashboard-style page)
Existing sections: Featured grid · All products grid · Filters · Search w/ autocomplete · Wardrobe-based recs · Recently viewed · Product card · Quick view.

NEW sections to add (on the same page):

Hero / promo strip — current flash sale countdown if active.
Category rail — horizontal chips with icon thumbnails.
"Complete the look" rail — products that pair with the user's wardrobe items.
Creator picks rail — shoppable looks from followed/featured creators.
New arrivals rail · Trending now rail.
Sticky filter rail on desktop (left); on mobile, filters open as a bottom sheet from a sticky filter button.
Detail surfaces: Product Detail full sub-page (reviews, size guide, share, contact seller — already its own route) · Product Quick View modal · Filter sheet · Search Results sub-page (when user submits a query — share its layout with Marketplace landing minus the rails).

5.6 Cart & Checkout
One linear page with a stepper, not multiple routes.

Existing sections: Line items · Qty adjust · Totals · Checkout CTA.

NEW sections to add (composed on the Checkout page as steps):

Step 1 — Address (pick from address book or add new, inline editor).
Step 2 — Payment method — segmented control between M-Pesa STK (default in KE), Paystack, Stripe card; each method's form renders inline on the same page.
Step 3 — Review — order summary, currency switcher (KES / UGX / TZS / USD), promo code entry, delivery estimate.
Step 4 — Confirm — inline state machine: Idle → Pending (M-Pesa: "Check your phone" / Stripe: 3DS / Paystack: redirect) → Success | Declined | Failed | Stock-out. All states are variants of the same frame, not separate routes.
Receipt panel — appears in place of the stepper after success; "Track order" CTA links into Orders.
Detail surfaces: Saved cards / Paystack profiles edit (modal) · Add address (modal) · Promo code error (inline).

5.7 Account Hub (new — second-biggest composition target)
A single page that hosts every settings + role-related entry. Do not create one route per setting — open each detail as an in-place panel or a sub-route only when it has deep IA.

Sections (all on one page):

Identity card — avatar, name, email, role badges (Style enthusiast / Pro / Seller / Creator), edit-profile inline.
Quick stats row — wardrobe items, mood boards, eco score, streak.
Style & body — Style preferences + Body & fit profile (two cards) → each opens in a side drawer / mobile full-screen edit.
Subscription & monetization — LUKU Pro status (subscribe / manage / cancel), Creator program (join / earnings preview / open dashboard), Seller program (apply / open dashboard).
Shopping — Payment methods, Address book, Language & region, Currency.
Notifications & privacy — Notification preferences, Privacy & data, Connected accounts, Security.
Appearance — Light / Dark / System.
Support & legal — Help center, Contact support, About, T&Cs, Privacy Policy.
Refer-a-friend card.
Sign out button.
Detail surfaces: Each row opens an inline drawer on desktop / full-screen edit on mobile. Only Help Center and Seller / Creator dashboards are true sub-pages.

5.8 Notifications
Single page with sections:

Category filter chips (All / Orders / Style / Marketplace / System / Creator / Seller).
Inbox list (grouped by day, unread first).
Detail pane on desktop (selected item shows on the right); on mobile, tap → full-screen detail.
Notification preferences entry pinned to header (links into Account Hub section).
5.9 Buyer ↔ Seller Messaging
Single page with sections:

Threads list (left rail desktop / top list mobile).
Active thread with message bubbles, image attachments, "View product" inline card.
No separate "compose" route — Contact Seller spawns a thread directly here.
5.10 Virtual Try-On
Single page with sections:

Mode tabs at top — Mannequin · Saved photo · New upload.
Mannequin settings drawer (inline, not a separate modal) — body type, measurements, skin tone, save preset.
Source picker (saved photo gallery / camera / upload).
Outfit picker — pulls from wardrobe + saved outfits + queue.
Result viewer inline below the picker.
Save / share / send to mood board as inline actions.
5.11 Trip Planner
Single page with sections:

Trip list rail (left desktop / top mobile) — upcoming + past.
Active trip detail on the same page — header (name, destination, dates, notes), day-by-day editor, packing list (editable inline), "Save as mood board" CTA.
New trip form opens as a drawer, not a route.
5.12 Color Harmony
Single page with sections:

Base item picker (top).
Generated palette card (below).
Color theory explanation (collapsible).
Suggested outfits grid (bottom).
Share palette card as inline action.
5.13 Style Playground
Single page with sections:

Sessions list rail (left desktop / top mobile).
Active session canvas — generated image gallery + customization history.
Query composer as a bottom drawer (inline, not a separate route): style fusion, color palette, occasion, intensity slider.
"Shop the look" inline action.
5.14 Sustainability deep-dive
Single page composed of sections (linked from Hub):

Hero stats — CO₂ saved, water saved, items rescued.
Monthly trend chart.
Suggested swaps rail.
Badges & achievements grid (mini version of Achievements page).
Sustainability tips carousel.
5.15 Achievements / Gamification
Single page (linked from Hub & Sustainability):

Streak hero (current + longest).
Badges grid — unlocked + locked, with progress bars.
Weekly digest card (shareable image export).
Refer-a-friend module.
5.16 Orders & Returns (merged)
Single page with sections:

Tabs: Orders · Returns.
Orders list with status pills; tap → order detail drawer (desktop) / full-screen (mobile).
Order detail hosts: items, status timeline (placed → confirmed → shipped → out for delivery → delivered), carrier + tracking, contact seller, request return CTA, review prompt (after delivery).
Returns list with status pills; tap → return detail (timeline, refund amount + method, support chat link).
Return request flow opens as an inline multi-step drawer (pick items → reason → photos → refund vs replace → submit), not a separate route.
5.17 Wishlist
Single page: grid + filters + "Move all to cart" bulk action + empty state. Add-to-cart / remove inline.

5.18 Seller Dashboard (major composition target — one page, many sections via segmented control)
Existing sections: Products · Orders · Analytics · Promotions · Settings. KYC + Business registration flows.

NEW segmented sections on the same dashboard:

Overview (default landing) — KPIs (today's revenue, pending orders, low-stock count, avg rating), sales chart, recent orders preview, recent reviews preview, payouts preview.
Products — list + filters; create/edit opens as full-screen wizard (multi-image upload with reorder, AI auto-tag review, variants, per-variant inventory, shipping, draft/publish).
Orders — list with status pills; order detail drawer (buyer info, items, shipping label, mark-as-shipped + tracking entry, refund/cancel).
Promotions — composer (discount %, bundle, flash sale, schedule, eligible products) + active/scheduled/expired lists.
Inbox — buyer messages + SLA indicator.
Payouts & earnings — balance, next payout, history, taxes/fees breakdown (East-Africa-aware).
Analytics — revenue chart, top products, conversion funnel, return rate, review sentiment.
Store profile — public storefront card preview, edit.
Settings — Seller KYC, Business KYC, payout method (Stripe Connect / Paystack subaccount / M-Pesa Till), shipping options.
Seller onboarding wizard lives as a separate route (/business/onboarding) since it's pre-dashboard: Business registration → Business KYC → Seller KYC → Payout method → Success → drop user into the Overview section.

5.19 Creator Dashboard (new — same composition pattern as Seller)
Segmented sections on one page:

Overview — MTD earnings, top-performing look, pending payout, conversion rate.
Looks — library of shoppable looks; composer opens as a full-screen wizard (pick outfit → tag products → set commission band → publish).
Earnings — filterable timeline, per-look breakdown.
Audience — followers, top regions, engagement rate.
Payouts — balance, history, request payout, method link.
Public profile preview — bio, link, shoppable feed.
Settings — payout method, tax info, content guidelines.
Public creator profile is a separate route (sharable URL) — bio, follower count, shoppable-look feed.

5.20 Auth & Onboarding (linear flow, single coherent layout)
Existing screens: Sign in · Sign up · Forgot password · Password reset · Backend-config error · Business variant.

NEW screens (kept as separate routes because they're a linear flow):

Splash / launch.
Welcome value-prop carousel (3–4 slides).
Style preferences quiz (post-signup, single page with grouped chip sections).
Body & fit profile setup (single page, optional skip).
Permission primers (one per ask — camera, photos, push, location).
First-wardrobe-upload coach marks (overlay on Hub).
5.21 Help, Legal, System
Single Help Center page with sections:

Search bar at top.
Categories grid.
Recent / popular articles.
"Contact support" inline form (with screenshot upload + diagnostic toggle).
Article view opens in side panel (desktop) / sub-page (mobile).
Legal page — tabs for T&Cs · Privacy Policy · Cookie/tracking preferences (toggles inline).

System screens (standalone routes): Offline · Maintenance · App-update-required · Generic error fallback.

6) Component library (Figma Components + Variants, bound to Variables)
Add the composition-aware primitives at the top:

SectionCard (new, critical for this revamp) — title slot, optional subtitle, optional header CTA (text link or icon button), optional badge, body slot (free-form), optional footer, optional "collapse" affordance. Variants: default | elevated | muted | gradient; density: comfortable | compact; states: default | loading (with embedded skeleton) | empty | error | locked (Pro/role-gated).
PageHeader — page title, optional subtitle, breadcrumb slot, action slot (buttons).
SegmentedControl (for dashboard section switching) — sizes sm | md; max 5 segments before overflow scroll.
SubNavChipRail — sticky scrollable chip rail used on long mobile pages to jump between sections.
StatCard — label + value + delta + icon; variants default | accent | warning | success.
KPIRow — auto-layout container of StatCards with responsive wrapping.
InsightChart wrappers — bar, line, donut, ring (eco score).
Drawer / Side panel — right-side on desktop, bottom-sheet on mobile via variants.
Wizard / Stepper — header with step labels + content slot + footer with Back/Next.
InlineEditor — pencil-tap-to-edit pattern for Account Hub rows.
RoleBadge — Style enthusiast / Pro / Seller / Creator.
PaywallCard — for LUKU Pro upsells in Hub / locked sections.
CreatorEarningsCard, SellerWidgetCard — dashboard-mini cards re-used in Hub.
Plus the standard set:

Button (primary | secondary | ghost | destructive; sm | md | lg; default | hover | pressed | loading | disabled), IconButton, Input (incl. phone with +254 mask), Textarea, Select, Checkbox, Radio, Switch, Slider, Chip / Tag, Stepper, PriceRangeSlider.
Card (default | elevated | muted).
OutfitCard, WardrobeItemCard, ProductCard, AlbumCard, TrendCard.
Avatar, Badge, Rating stars, Progress bar, Circular score gauge.
Toast / Snackbar, InlineError, Banner, Skeleton set, Spinner, EmptyState, Modal / Dialog, Bottom Sheet, Tabs, Breadcrumbs, Filter rail, Search bar with autocomplete, Image upload tile, Image carousel + zoom, Status timeline, Activity feed item, Notification list item, Conversation message bubble, Currency selector, Language selector.
Header (web), MobileBottomNav (5 tabs + More), MoreSheet, OnboardingDot, PermissionPrimer.
For every component, document purpose, props/variants, do/don'ts, accessibility notes, and which pages/sections it appears on in the component description field.

7) Interaction & motion
200–300 ms ease-out default; 400 ms for sheet/drawer; respect prefers-reduced-motion.
Bottom-nav tab switches: cross-fade content (no horizontal slide).
Segmented-control switches within a page: fade the section slot, keep header + KPIs static.
Outfit/product cards: subtle scale-up on hover (web only).
Toasts: slide up from bottom on mobile; top-right on web.
Dark-mode switch animates color tokens, never re-mounts content.
Sticky sub-nav chip rail elevates with a shadow once scrolled past the page hero.
8) Output expectations from Figma Make
Produce in the Figma file:

01 — Foundations — tokens (color w/ Light + Dark, type, space, radius, shadow), grid, iconography, illustration style notes, composition rules from section 4.
02 — Components — library above, all variants + states, in Light + Dark. SectionCard and its variants must be the first component shown.
03 — Mobile screens (Light) grouped by page (one frame per page state). Each page frame must show every section stacked, not just a hero. Cover default / empty / loading / error / success per page.
04 — Mobile screens (Dark) mirroring 03.
05 — Desktop / Web screens (Light) mirroring 03 — sections in their multi-column layout.
06 — Desktop / Web screens (Dark) mirroring 05.
07 — Section blueprints (new page) — for the five dashboard-style pages (Lifestyle Hub, Account Hub, Wardrobe, Seller Dashboard, Creator Dashboard), show a tall annotated frame listing every section with notes: data source, role-gating, empty-variant copy, "See all" destination, mobile collapse rule.
08 — Flows (arrow-connected): First-run onboarding · Wardrobe upload + AI tagging · Outfit generation → save → try-on → shop · Marketplace browse → product → cart → checkout (Stripe / Paystack / M-Pesa branches all on the same checkout page) · Orders & Returns · Seller onboarding (Business registration → KYC → payout → publish first product → Overview) · LUKU Pro subscribe → manage → cancel · Creator onboarding → publish shoppable look → earnings → payout.
09 — Hand-off notes — deviations from core/theme/tokens.ts, recommended new tokens, component-to-code mapping (e.g. SectionCard ↔ proposed components/common/SectionCard.tsx; OutfitCard ↔ existing components/common/OutfitCard.tsx), copy decks for empty states, list of assumptions, and a page composition map showing every section, which page it lives on, and which sub-surfaces it spawns.
Naming convention for frames:

Pages: [Platform] / [Mode] / [Page] — [State] (e.g. Mobile / Dark / Lifestyle Hub — Default).
Sections inside a page: name the section frame [Page] · [Section] — [State] (e.g. Lifestyle Hub · Sustainability snapshot — Empty) so engineering can isolate it.
Detail surfaces: [Platform] / [Mode] / [Page] / [Detail] — [State] (e.g. Mobile / Light / Wardrobe / Item detail — Default).
9) Constraints & non-goals
Do not redesign the logo or rename the brand.
Do not introduce a new color palette — extend the existing indigo/purple/pink/green/blue/yellow with neutrals and on-brand dark-mode surfaces only.
Do not design internal admin tools beyond Seller Dashboard + Engagement Analytics + Creator Dashboard.
Do not create one route per setting / per widget / per feature. Compose first; promote to a route only when section 4 rule 7 is satisfied.
Keep React Native v1 scope in mind: Auth, Hub, Discover, Wardrobe, Mood Boards, Marketplace, Cart, Checkout, Wishlist, Orders, Account must work cleanly on 390×844 with native nav patterns (bottom tabs, push stacks, modals, action sheets). Try-On, Color Harmony, Trip Planner, Style Playground, Returns, Seller, Creator can ship later but designs should still exist now.
Payment screens must not show raw card data, full phone numbers, or gateway internals. Mask phone as +254 ••• ••• 123. Sanitize all error copy.
All currency strings must be variable-driven so they can switch between KES / UGX / TZS / USD without redesign. All copy strings must be variable-driven so they can switch between English and Swahili — provide both languages for the top 20 highest-frequency screens (Auth, Hub, Discover landing, Wardrobe, Cart, Checkout step states, Orders & Returns, Account Hub, empty states).
10) Deliverable
Output everything as editable Figma frames (not images), with components and Variables, ready for engineering handoff. Where you make assumptions (illustration style, empty-state copy, exact section ordering on Hub), call them out in the 09 — Hand-off notes page.

End of prompt.
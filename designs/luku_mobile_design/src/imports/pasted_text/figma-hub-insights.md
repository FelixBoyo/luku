Here’s a paste-ready Figma Make prompt for the lean Hub plus a new overflow screen for everything you cut from the Hub (so nothing is lost—just relocated with a clear future purpose).

Figma Make Prompt — LUKU Hub Revamp + Insights Screen
Paste into Figma Make. Replace [paste your Figma file URL here] with your existing file.

Context
You are updating the LUKU mobile app (390×844, Light + Dark). LUKU is an AI wardrobe stylist + sustainable fashion + marketplace app for East Africa (KES/UGX/TZS, M-Pesa, English + Swahili-ready copy).

Existing Hub mockup: warm beige/tan palette, serif “LUKU” logotype, brown text, orange accent for active states and highlights. Preserve this visual direction on the revamped Hub unless noted below.

Existing file: [paste your Figma file URL here]

Job of the Hub: What should I wear today—and what can I buy to complete it?
Job of the new screen (“Insights”): How am I doing with my wardrobe, style, and impact over time? (reflection & depth—not primary shopping.)

Composition rules (mandatory)
Hub = action. Outfit + shop + save/try-on. Max ~6–7 content blocks on mobile.
Insights = reflection. All Hub-cut widgets live here as sections—not deleted.
Use shared SectionCard components (title, optional subtitle, header CTA “See all”, body, empty/loading states).
No duplicate metrics (e.g. wear rate appears once per screen, not in header chips and again in a full card on the same screen).
Design Light + Dark for both screens; use Figma Variables for colors.
English copy on frames; note where Swahili strings will mirror in hand-off.
Screen 1 — Lifestyle Hub (revamp)
Route: Bottom nav · Hub (home icon, active state orange).

Zone A — Above the fold
#	Section	Content	Notes
1	Header	Logo “LUKU”, profile avatar (top right), date (“Tuesday, May 19”), greeting (“Good afternoon! Ready to make a statement?”), one-line context: “24°C · Sunny · Light layers” (merge TODAY'S_CONTEXT here—no second weather card).	Weather pill optional; don’t repeat full forecast on Hub.
2	Stat chips	3 pills: ITEMS 24 · OUTFITS 18 · WEAR RATE 78% (or drop wear rate—see Insights).	Same style as current mock (white cards, one accent).
3	TODAY'S_PICK (hero)	Label + NEW badge + Regenerate (sparkle). Large outfit carousel (e.g. “SOFT POWER”: coat, top, boots). Primary CTAs: Try on · Save · Shop this look. Secondary: heart/favorite.	Hero = 50–60% of above-fold height.
4	Shop this look	Horizontal product rail (3–5 cards): items that complete the hero outfit + “Complete the look” from wardrobe. Header: “Shop this look” + See all → Marketplace. Pro: extra SKUs or “Unlock curated picks” as inline locked cards—not a separate big promo block.	Replaces standalone SHOP_CURATED / QUICK_ACTIONS shop block.
Zone B — One short scroll
#	Section	Content	Notes
5	More outfits	2–3 outfit cards from AI (“More from your wardrobe”). Header CTA: See all → Discover.	Preview only.
6	Mood boards	2 thumbnails + count badge 2. See all → Boards.	No full grid on Hub.
Optional micro-elements (pick at most one)
Eco pill (single line): “24 kg CO₂ saved this month” → taps to Insights · Sustainability section.
Streak dot on profile or hero: “7-day streak” → Insights · Achievements.
Do NOT place on Hub
WARDROBE_PULSE (full), UPCOMING_EVENTS, ECO_IMPACT (full card), RECENT_ACTIVITY, ACHIEVEMENTS grid, TRENDING_STYLES, STYLE_TIP, STYLE_INSIGHTS, COMMUNITY_FEED, WEAR_LOG calendar, duplicate TODAY'S_CONTEXT card, standalone SHOP_CURATED card.

Hub states to design
Default · Empty wardrobe (CTA: Add items) · Loading (skeleton on hero + rails) · Error (retry on hero) · Dark mode variants.

Hub entry to Insights
Header: optional “Insights” text link or chart icon next to profile → opens Insights screen.
Or: first stat chip “Wear rate” taps through to Insights · Wardrobe pulse (if you remove wear from chips, use profile menu / More).
Screen 2 — Insights (NEW — home for cut Hub widgets)
Route: Reachable via Hub header link, More menu item “Insights”, or tap on eco/streak pills. Not in bottom nav Tier 1 (avoid 6th tab); Tier 3 in More sheet is acceptable.

Purpose (document on frame):
Secondary dashboard for wardrobe health, habits, sustainability, and community signals. Users visit weekly, not every session. Hub stays fast; Insights holds depth.

Page structure: Scrollable vertical stack of SectionCards. Sticky top: “Insights” title + date range filter chip (This week / This month / All time) — optional for v1, can show “This month” only.

Sections (map 1:1 from cut Hub widgets)
Section	Source widget	Content to design
Wardrobe pulse	WARDROBE_PULSE	WEAR RATE 78% +12% · AVG USES 24 +3. Mini trend sparkline. Empty: “Add items to see pulse.”
Upcoming events	UPCOMING_EVENTS	List: Team Meeting 22 May · Dinner Party 24 May with dress code chips. CTA: “Add to trip planner” (Phase 2) or “View calendar”. Empty: “No events—add one?”
Eco impact	ECO_IMPACT	CO₂ saved 24 kg · Wear/item ratio 3.2x. Link: “Sustainability tips”.
Recent activity	RECENT_ACTIVITY	Timeline: “Wore SOFT POWER 2h ago”, “Saved 3 favorites 5h ago”, etc.
Achievements	ACHIEVEMENTS	Badges: 7-day streak, Color master, Eco warrior. Locked states with progress.
Trending in community	TRENDING_STYLES	Cards: Layered look 142 wears, Minimalist 98 wears. CTA → Discover · Trends.
Style tip	STYLE_TIP	Daily card: “Color harmony—earth tones…” Expandable.
Style insights	STYLE_INSIGHTS	Most worn color AMBER · Favorite category TOPS · Avg rating 4.6★. CTA → Discover · Style DNA.
Wear log	WEAR_LOG	Month calendar with worn days highlighted. CTA “Log today” if empty today.
Community feed	COMMUNITY_FEED	2–3 posts: avatar, name, outfit thumb. CTA See all (Phase 2 full social).
Order on page (top → bottom): Wardrobe pulse → Upcoming events → Eco impact → Style insights → Wear log → Achievements → Recent activity → Trending → Style tip → Community feed.
(Analytics first, social last—reduces noise for users who only want stats.)

Insights states
Default (populated) · New user (mostly empty sections with CTAs) · Loading · Dark mode.

Future-purpose note (on Hand-off page)
Label this screen: “Insights v0 — container for deferred Hub widgets.” Product may later split into separate routes (Sustainability, Achievements, Social); keep sections as independent SectionCards so they can be extracted without redesign.

Navigation update
More sheet (bottom nav): add row Insights with chart/pulse icon, between existing items.

Do not add Insights to the 5 primary bottom tabs.

Components to create/update
SectionCard (variants: default, elevated, empty, loading, locked/Pro)
StatChip (3-up row)
OutfitHeroCard (carousel + CTAs)
ProductRail + ProductRailCard
OutfitPreviewCard (small)
MoodBoardThumb
InsightMetricRow (+ delta badge +12%)
EventListItem
ActivityTimelineItem
AchievementBadge (locked/unlocked)
WearLogCalendar
CommunityPostCard
Bind colors to Variables: keep Hub warm beige (#F5F0E8 app bg, #8B6914 brown text, #E87B35 orange accent); Insights can share the same tokens for consistency.

Deliverables in Figma
Mobile / Light / Lifestyle Hub — Default (full page, all Zone A + B sections)
Mobile / Dark / Lifestyle Hub — Default
Mobile / Light / Insights — Default (all sections)
Mobile / Dark / Insights — Default
Mobile / Light / Lifestyle Hub — Empty wardrobe
Mobile / Light / Insights — New user
Flow: Hub → tap Insights → Insights screen; Hub hero → Shop this look → Marketplace (arrow annotation)
Hand-off note: table mapping old widget name → new screen + section name
Naming: Mobile / Light / Hub / [Section] — [State] and Mobile / Light / Insights / [Section] — [State]

Constraints
Do not redesign LUKU logo or rename the app.
Hub must feel lighter than the current 15-widget scroll—target 6–7 blocks max.
Insights may be dense; use consistent section spacing and collapsible sections optional for v2.
Min 44×44 tap targets; WCAG AA contrast in dark mode.
End of prompt.

Quick reference: where every widget went
Original Hub widget	New home
TODAY'S_PICK	Hub (hero)
Greeting / date / weather	Hub (header, merged context)
ITEMS / OUTFITS / WEAR_RATE chips	Hub (stats) — or move WEAR_RATE detail to Insights only
TODAY'S_CONTEXT	Hub (one line in header)
Shop / SHOP_CURATED	Hub (“Shop this look” rail)
MOOD_BOARDS preview	Hub
More AI outfits	Hub → link Discover
WARDROBE_PULSE	Insights
UPCOMING_EVENTS	Insights
ECO_IMPACT	Insights
RECENT_ACTIVITY	Insights
ACHIEVEMENTS	Insights
TRENDING_STYLES	Insights (link Discover)
STYLE_TIP	Insights
STYLE_INSIGHTS	Insights (link Style DNA)
WEAR_LOG	Insights
COMMUNITY_FEED	Insights (Phase 2 social)
Naming the new screen (pick one for Figma)
Name	Pros
Insights	Clear, analytics + habits; works long-term
Pulse	Matches “Wardrobe pulse”; feels on-brand
Your style	Friendly; vague enough for future features
Recommendation: Insights in UI copy; subtitle in Figma: “Wardrobe & style at a glance.”

One-liner for your full revamp doc
If you’re merging this into the big Figma prompt from earlier, replace section 5.1 Lifestyle Hub with the Hub table above and add 5.1b Insights (overflow / reflection screen) with the Insights section table—explicitly marked as the store for all Hub-cut widgets until product splits them later.

If you want, I can also give you a shorter “Hub + Insights only” prompt (~half the length) for a focused Figma Make run without the rest of the app.
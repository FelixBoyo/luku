# LUKU Theme Guide - Black, White & Luminous Green

## Design Inspiration
The LUKU app design is inspired by Vogue magazine's bold, geometric layouts with:
- High-contrast black and white photography
- Clean, minimal geometric panels
- Bold typography
- Overlapping image layouts
- Magazine-style grid systems

---

## Color Palette

### Primary Colors

**Black**
- Hex: `#000000` / `#0A0A0A`
- Usage: Primary text, buttons, borders, headings
- Tailwind: `bg-black`, `text-black`

**White**
- Hex: `#FFFFFF`
- Usage: Card backgrounds, button text, icons
- Tailwind: `bg-white`, `text-white`

**Off-White Background**
- Hex: `#FAFAFA`
- Usage: Main app background
- Tailwind: `bg-[#FAFAFA]`

### Accent Colors

**Luminous Green (Primary Accent)**
- Hex: `#00FF88`
- Usage: Active states, highlights, underlines, badges, CTAs
- Tailwind: `bg-[#00FF88]`, `text-[#00FF88]`, `border-[#00FF88]`
- Examples: Active nav items, trending badges, AI match scores

**Bright Green (Secondary Accent)**
- Hex: `#39FF14` (Neon Green)
- Usage: Gradients, hover states, secondary highlights
- Tailwind: `bg-[#39FF14]`, `text-[#39FF14]`
- Examples: Gradient buttons, special badges

**Soft Green (Tertiary Accent)**
- Hex: `#00FFA3`
- Usage: Subtle accents, gradient variations
- Tailwind: `bg-[#00FFA3]`

### Grays

**Light Gray (Secondary Background)**
- Hex: `#F5F5F5`
- Usage: Muted cards, secondary backgrounds, product placeholders
- Tailwind: `bg-[#F5F5F5]`

**Mid Gray (Borders)**
- Hex: `#E5E5E5`
- Usage: Subtle borders, dividers
- Tailwind: `border-[#E5E5E5]`

**Dark Gray (Muted Text)**
- Hex: `#737373`
- Usage: Secondary text, metadata
- Tailwind: `text-[#737373]`

**Darkest Gray (Hover States)**
- Hex: `#1A1A1A`
- Usage: Hover states for black buttons
- Tailwind: `bg-[#1A1A1A]`, `hover:bg-[#1A1A1A]`

---

## Typography

**Font Family**
- Primary: `'Outfit', sans-serif` (loaded from Google Fonts)
- Weights: 400 (normal), 500 (medium), 700 (bold), 900 (black)

**Text Styles**
- Headlines: `font-black` (900 weight), uppercase, tight tracking
- Body: `font-semibold` (600 weight) or `font-bold` (700 weight)
- Metadata: `font-semibold` with reduced opacity

**Common Patterns**
```tsx
// Page titles
<h1 className="text-black text-5xl font-black tracking-tight relative">
  LUKU
  <span className="absolute -bottom-1 left-0 right-0 h-1 bg-[#00FF88] rounded-full"></span>
</h1>

// Section headers
<h2 className="text-black text-sm font-black uppercase tracking-wide">
  SECTION_TITLE
</h2>

// Body text
<p className="text-black/70 text-sm font-semibold">
  Description text
</p>
```

---

## Component Patterns

### Buttons

**Primary Button (Black)**
```tsx
<button className="bg-black text-white py-4 px-6 rounded-lg font-black uppercase hover:bg-[#1A1A1A] transition-colors">
  Button Text
</button>
```

**Secondary Button (White Outline)**
```tsx
<button className="bg-white text-black border-2 border-black/30 py-4 px-6 rounded-lg font-black uppercase hover:bg-[#FAFAFA] transition-colors">
  Button Text
</button>
```

**Accent Button (Luminous Green)**
```tsx
<button className="bg-[#00FF88] text-black py-4 px-6 rounded-lg font-black uppercase hover:opacity-90 transition-opacity">
  Button Text
</button>
```

### Cards

**Default Card**
```tsx
<div className="bg-white border-2 border-black/30 rounded-xl p-6 shadow-md">
  Content
</div>
```

**Elevated Card (Magazine Style)**
```tsx
<div className="bg-white border-2 border-black/30 outline outline-2 outline-offset-2 outline-black/20 shadow-lg rounded-xl p-6">
  Content
</div>
```

**Muted Card**
```tsx
<div className="bg-[#F5F5F5] border-2 border-black/20 rounded-xl p-6">
  Content
</div>
```

**Gradient Card (Accent)**
```tsx
<div className="bg-gradient-to-br from-[#00FF88]/20 to-[#39FF14]/20 border-2 border-black/30 rounded-xl p-6">
  Content
</div>
```

### Badges

**Trending Badge**
```tsx
<span className="px-2 py-1 bg-[#00FF88] text-black text-xs font-black rounded flex items-center gap-1">
  <TrendingUp className="w-3 h-3" strokeWidth={3} />
  HOT
</span>
```

**New Badge**
```tsx
<span className="px-2 py-1 bg-black text-white text-xs font-black rounded">
  NEW
</span>
```

**AI Match Badge**
```tsx
<div className="px-2 py-0.5 bg-gradient-to-r from-[#00FF88] to-[#39FF14] rounded-full flex items-center gap-1">
  <Sparkles className="w-3 h-3 text-black" strokeWidth={3} />
  <span className="text-black text-xs font-black">98% Match</span>
</div>
```

### Navigation

**Bottom Nav Active State**
```tsx
<button className={`${isActive ? 'text-[#00FF88]' : 'text-black/50'}`}>
  <Icon className={`${isActive ? 'fill-[#00FF88]' : ''}`} />
  <span className="text-[10px] font-black uppercase">Label</span>
</button>
```

---

## Layout Patterns

### Magazine-Style Grid
Inspired by Vogue layouts with overlapping panels and asymmetric grids:

```tsx
// Two-column product grid
<div className="grid grid-cols-2 gap-4">
  {products.map(product => (
    <ProductCard key={product.id} {...product} />
  ))}
</div>

// Three-column grid for thumbnails
<div className="grid grid-cols-3 gap-3">
  {items.map(item => (
    <ThumbnailCard key={item.id} {...item} />
  ))}
</div>
```

### Overlapping Elements
```tsx
<div className="relative">
  {/* Background image */}
  <div className="h-32 bg-[#F5F5F5] overflow-hidden">
    <img src={coverImage} className="w-full h-full object-cover opacity-60" />
  </div>
  
  {/* Overlapping avatar */}
  <div className="px-6 -mt-12">
    <div className="w-20 h-20 bg-white rounded-full border-4 border-white shadow-md -mt-8">
      <img src={avatar} className="w-full h-full object-cover" />
    </div>
  </div>
</div>
```

### Sharp Corners & Bold Borders
```tsx
// Angular design with thick borders
<div className="border-3 border-black rounded-lg" style={{ borderWidth: '3px' }}>
  Content
</div>
```

---

## Gradients

### Green Gradient (Background)
```tsx
<div className="bg-gradient-to-br from-[#00FF88]/20 to-[#39FF14]/20">
  Content
</div>
```

### Green Gradient (Text/Badge)
```tsx
<div className="bg-gradient-to-r from-[#00FF88] to-[#39FF14] text-black">
  Content
</div>
```

### Dark Overlay (For images)
```tsx
<div className="absolute inset-0 bg-black/50">
  Content
</div>
```

---

## Shadows

**Subtle Shadow (Cards)**
```tsx
className="shadow-md"
```

**Elevated Shadow (Important cards)**
```tsx
className="shadow-lg"
```

**No Shadow (Flat design)**
- Most elements use borders instead of shadows for a flatter, more graphic look

---

## Border Radius

**Default Radius**
- `rounded-lg` - 0.5rem (8px) - Default for most elements
- `rounded-xl` - 0.75rem (12px) - Cards and larger containers
- `rounded-2xl` - 1rem (16px) - Section cards
- `rounded-full` - Full circle - Avatars, badges, pills

**Angular Design**
- Minimal border radius for a sharper, more geometric feel
- Use `rounded` (4px) or `rounded-lg` (8px) max for most UI elements
- Avoid overly rounded corners to maintain Vogue-style aesthetic

---

## Spacing

**Consistent Padding**
- Cards: `p-6` (1.5rem / 24px)
- Compact cards: `p-4` (1rem / 16px)
- Page content: `px-6` (horizontal padding)

**Consistent Gaps**
- Grid gaps: `gap-3` or `gap-4`
- Stack spacing: `space-y-4` or `space-y-6`

---

## Icons

**Icon Library**
- Lucide React icons
- Stroke width: `strokeWidth={2.5}` or `strokeWidth={3}` for bold icons
- Size: `w-5 h-5` (20px) or `w-6 h-6` (24px)

**Icon Colors**
- Primary: `text-black`
- Accent: `text-[#00FF88]`
- Muted: `text-black/40` or `text-black/60`
- Active: `fill-[#00FF88]` with `text-[#00FF88]`

---

## Opacity Levels

**Text Opacity**
- Primary text: `text-black` (100%)
- Secondary text: `text-black/70` (70%)
- Metadata: `text-black/60` (60%)
- Muted: `text-black/40` (40%)

**Border Opacity**
- Primary: `border-black/30` (30%)
- Subtle: `border-black/20` (20%)
- Very subtle: `border-black/10` (10%)

---

## Transitions

**Standard Transition**
```tsx
className="transition-colors"
```

**All Properties**
```tsx
className="transition-all"
```

**Custom Duration**
```tsx
className="transition-colors duration-300"
```

---

## States

### Hover States
```tsx
// Buttons
hover:bg-[#1A1A1A]  // For black buttons
hover:bg-[#FAFAFA]  // For white buttons
hover:opacity-90    // For accent buttons

// Links/Text
hover:text-[#00FF88]  // For interactive text

// Borders
hover:border-[#00FF88]  // For cards
```

### Active States
```tsx
// Navigation
text-[#00FF88]
fill-[#00FF88]

// Buttons
bg-black text-white  // Selected state
```

### Disabled States
```tsx
opacity-50
cursor-not-allowed
```

---

## Design Principles

1. **High Contrast**: Strong black and white contrast for readability
2. **Luminous Accents**: Strategic use of bright green for key interactions
3. **Geometric Layouts**: Grid-based, magazine-style compositions
4. **Bold Typography**: Heavy font weights, uppercase for emphasis
5. **Minimal Decoration**: Let content and typography lead
6. **Sharp Edges**: Angular borders, minimal rounding
7. **Overlapping Layers**: Magazine-style overlapping panels
8. **Photography Focus**: Large, bold product imagery

---

## Component Library

### SectionCard Variants
- `variant="default"` - White with border
- `variant="elevated"` - White with outline and shadow
- `variant="muted"` - Gray background
- `variant="gradient"` - Green gradient background

### Common Color Combinations

**Black on White**
```tsx
<div className="bg-white text-black">Content</div>
```

**White on Black**
```tsx
<div className="bg-black text-white">Content</div>
```

**Green Accent on White**
```tsx
<div className="bg-white">
  <span className="text-[#00FF88]">Accent</span>
</div>
```

**Green Background with Black Text**
```tsx
<div className="bg-[#00FF88] text-black">Content</div>
```

---

## Accessibility

**Contrast Ratios**
- Black on White: 21:1 (AAA)
- Green (#00FF88) on Black: ~8:1 (AA)
- Green (#00FF88) on White: ~2.5:1 (Use for accents only, not body text)

**Focus States**
```tsx
focus:outline-none focus:border-[#00FF88]
```

---

## Migration Notes

### Color Replacements (Old → New)
- `#F7F3EE` → `#FAFAFA` (main background)
- `#EFE7DD` → `#F5F5F5` (secondary background)
- `#593622` → `#000000` / `#0A0A0A` (primary text/buttons)
- `#F2B872` → `#00FF88` (primary accent)
- `#D98C4A` → `#39FF14` (secondary accent)
- `#A65A2E` → `#000000` (borders)

### Component Updates
All components have been updated to use the new color scheme while maintaining the same functional structure.

---

## Future Considerations

- **Dark Mode**: Can be implemented by inverting colors (#000 ↔ #FFF) and adjusting green luminosity
- **Additional Accents**: Consider adding secondary accent colors if needed (cyan, magenta)
- **Animation**: Add subtle micro-interactions with green glow effects
- **Texture**: Consider adding subtle noise/grain overlays for a print magazine feel

---

This theme creates a bold, modern, high-fashion aesthetic perfect for LUKU's commerce-centered platform while maintaining excellent usability and accessibility.

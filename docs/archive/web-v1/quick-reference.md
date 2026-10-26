# LUKU - Quick Reference Guide

## 🎨 Brand At A Glance

### Name & Tagline

```
LUKU
Your Personal Style Companion
```

### Mission (One-Liner)

> Empower sustainable fashion choices through AI-powered personalization

---

## 🎨 Colors

### Primary Gradient

```css
/* Indigo to Purple */
background: linear-gradient(to right, #6366f1, #a855f7);
```

### Individual Colors

| Color  | Hex       | Usage                      |
| ------ | --------- | -------------------------- |
| Indigo | `#6366f1` | Primary brand color, trust |
| Purple | `#a855f7` | Innovation, creativity     |
| Pink   | `#ec4899` | Accent, energy             |
| Green  | `#10b981` | Sustainability             |
| Blue   | `#3b82f6` | Wellness                   |
| Yellow | `#f59e0b` | Optimism                   |

---

## 📝 Typography

### Headings

```css
font-weight: bold;
letter-spacing: tight (-0.025em);
background: linear-gradient(to right, #6366f1, #a855f7);
background-clip: text;
-webkit-text-fill-color: transparent;
```

### Body

```css
font-family: system-ui, sans-serif;
font-weight: normal;
line-height: 1.5;
```

### Tagline

```css
font-weight: light (300);
color: #6b7280; /* gray-500 */
```

---

## 🏷️ Key Messaging

### Value Propositions

1. **Personalization** - AI learns your style
2. **Sustainability** - Eco-conscious choices
3. **Empowerment** - Express yourself confidently
4. **Versatility** - Maximize existing wardrobe
5. **Innovation** - Cutting-edge AI tech

### Tone of Voice

-   **Positive:** "Discover your style DNA"
-   **Inclusive:** "Fashion for everyone"
-   **Sustainable:** "Conscious choices for a better planet"
-   **Friendly:** "Your personal style companion"

---

## 🖼️ Logo Usage

### When to Use LUKU Logo

-   App header (always)
-   Loading screens
-   Email signatures
-   Marketing materials

### Logo Specifications

```tsx
<LukuLogo className="h-8 w-8" /> // Standard size
<LukuLogo className="h-16 w-16" /> // Hero size
```

### Clear Space

-   Minimum 20px around logo on all sides
-   Never place on busy backgrounds
-   Ensure good contrast

---

## 📱 UI Components

### Header

```tsx
<header className="bg-white shadow-sm border-b border-gray-100">
    <LukuLogo className="h-8 w-8" />
    <h1 className="text-2xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
        LUKU
    </h1>
    <span className="text-xs text-gray-500 font-light">
        Your Personal Style Companion
    </span>
</header>
```

### Empty States

```tsx
<div className="text-center py-20 bg-gradient-to-br from-indigo-50 to-purple-50">
    <h3>Welcome to LUKU</h3>
    <p>Add items to unlock personalized insights</p>
</div>
```

### Buttons (Primary)

```tsx
<button className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white">
    Get Started
</button>
```

---

## 🔤 Writing Style

### DO ✅

-   "Discover outfits that celebrate your unique style"
-   "Build a sustainable wardrobe"
-   "Your style evolution starts here"
-   "Express yourself with confidence"

### DON'T ❌

-   "Fix your wardrobe problems"
-   "Hide your flaws"
-   "Must-have items"
-   "Look better/younger/thinner"

---

## 🌐 SEO Keywords

### Primary (High Priority)

-   LUKU personal stylist
-   AI wardrobe organizer
-   Sustainable fashion app
-   Virtual outfit planner

### Secondary (Medium Priority)

-   Color harmony fashion
-   Personal style AI
-   Eco-friendly wardrobe
-   Digital closet organizer

### Long-tail (Specific)

-   "AI fashion recommendations for sustainable living"
-   "Personal style companion with virtual try-on"
-   "Organize wardrobe with AI color harmony"

---

## 📊 Social Media

### Hashtags

Primary: `#LUKU` `#SustainableStyle`
Secondary: `#YourStyleDNA` `#AIFashion` `#ConsciousCloset`

### Post Templates

**Inspirational:**

> "Your style is uniquely yours. Let LUKU help you express it sustainably. 🌿✨ #LUKU #SustainableStyle"

**Educational:**

> "Did you know? LUKU's AI learns your preferences to suggest outfits you'll actually wear. Less waste, more style. 💜 #LUKU #AIFashion"

**Engaging:**

> "What's your dominant style? Casual, Formal, or Bohemian? LUKU's Style DNA feature reveals your fashion personality! 🎨 #LUKU"

---

## 🎯 Target Audience

### Demographics

-   **Age:** 18-45
-   **Tech-savvy** individuals
-   **Environmentally conscious** consumers
-   **Budget-conscious** shoppers
-   **Fashion-interested** but not obsessed

### Psychographics

-   Values sustainability
-   Seeks convenience
-   Appreciates personalization
-   Comfortable with AI/tech
-   Wants to express individuality

---

## ✅ Brand Checklist

Before publishing any LUKU content, verify:

-   [ ] "LUKU" is uppercase
-   [ ] Tagline included where appropriate
-   [ ] Colors match brand palette
-   [ ] Tone is empowering, not judgmental
-   [ ] Sustainability mentioned
-   [ ] Inclusive language used
-   [ ] Logo clear and visible
-   [ ] No distortion of brand assets

---

## 📞 Quick Links

-   **Brand Guidelines:** `BRAND_GUIDELINES.md`
-   **Implementation Report:** `IMPLEMENTATION_REPORT.md`
-   **Project README:** `README.md`
-   **Logo Component:** `components/icons/LukuLogo.tsx`
-   **Favicon:** `public/luku-favicon.svg`

---

<div align="center">

**LUKU** | _Your Personal Style Companion_
Where Style Meets Sustainability 💜

</div>

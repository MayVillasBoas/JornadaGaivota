# Design System — may.labs

## Product Context
- **What this is:** A personal site and thinking lab — part library, part journal, part interactive tools for clarity and self-knowledge
- **Who it's for:** People in moments of transition, career change, or deep personal reflection
- **Space/industry:** Personal development, AI-assisted thinking, editorial/reflective content
- **Project type:** Hybrid — editorial content site + interactive tools (copilot, guided exercises, journal)

## Aesthetic Direction
- **Direction:** Editorial/Magazine — strong typographic hierarchy, content-first, minimal decoration
- **Decoration level:** Intentional — thin borders as visual structure, subtle hover animations, typography does the heavy lifting
- **Mood:** Calm, contemplative, precise. Like a beautifully typeset personal essay. Warm and human but not playful. Intellectual but not cold. The visual equivalent of a well-organized mind.
- **Anti-patterns (never use):**
  - Purple/violet gradients as default accent
  - 3-column feature grids with icons in colored circles
  - Uniform bubbly border-radius on everything
  - Gradient buttons
  - Generic stock-photo hero sections
  - Emojis as visual markers — use SVG line art or typographic symbols instead

## Typography

### Fonts
- **Serif (Display/Headers):** EB Garamond — elegant, literary, warm. Used for all headings, lead paragraphs, quotes, and emotional/reflective text
- **Sans (Body/UI):** Inter — clean, legible, modern. Used for body text, labels, navigation, metadata, and interactive elements
- **Loading:** Google Fonts CDN
  - EB Garamond: weights 400, 500, 600, italic
  - Inter: weights 300, 400, 500

### Type Scale
| Element | Font | Size | Weight | Line-height | Letter-spacing | Color |
|---------|------|------|--------|-------------|----------------|-------|
| h1 | EB Garamond | 3.2rem (mobile: 2.4rem) | 400 | 1.15 | -0.01em | --ink |
| h2 | EB Garamond | 1.6rem (mobile: 1.35rem) | 400 | 1.3 | — | --ink |
| h3 | EB Garamond | 1.3rem | 500 | 1.3 | — | --ink |
| Lead paragraph | EB Garamond | 1.3rem | 400 | 1.6 | — | --ink |
| Body | Inter | 1rem | 300 | 1.75 | — | --ink-light |
| Small body | Inter | 0.95rem | 300 | 1.7 | — | --ink-light |
| Section label | Inter | 0.8rem | 500 | — | 0.1em | --ink-muted |
| Metadata/dates | Inter | 0.78rem | 400 | — | — | --ink-muted |
| Button text | Inter | 0.9rem | 400 | — | 0.03em | — |
| Navigation | Inter | 0.85rem | 400 | — | — | --ink-light |

### Typography Rules
- **Headers (h1-h3):** Always EB Garamond. Never Inter for headers.
- **Section labels (uppercase):** Always Inter, small (0.7-0.8rem), uppercase, letter-spacing 0.08-0.12em
- **Quotes and reflective text:** EB Garamond italic
- **Body text:** Always Inter weight 300. Never weight 400 for body (too heavy for the editorial feel)
- **Italic text legibility:** When using italic text, never combine with `--ink-muted` — use at minimum `--ink-light` for readability

## Color

### Palette
- **Approach:** Restrained — color is rare and meaningful. The palette is warm and muted.

| Token | Hex | Usage |
|-------|-----|-------|
| --cream | #FAFAF7 | Primary background |
| --warm-white | #F5F4F0 | Cards, secondary surfaces |
| --ink | #1a1a18 | Primary text, headings |
| --ink-light | #4a4a45 | Body text |
| --ink-muted | #6a6a62 | Metadata, placeholders, tertiary text |
| --accent | #2B4A3E | CTAs, active states, links, brand color (muted teal) |
| --accent-light | #e8eeec | Accent backgrounds, subtle highlights |
| --border | #e8e8e2 | Dividers, card borders |
| --border-light | #d0d0c8 | Subtle dividers |

### Category Colors (for tools/mentors)
| Token | Hex | Category |
|-------|-----|----------|
| --cat-decisions | #4a7aad | Decisions (blue) |
| --cat-thinking | #8b6aad | Thinking (purple) |
| --cat-action | #4aad6a | Action (green) |
| --cat-relationships | #c27a5a | Relationships (burnt orange) |
| --cat-energy | #2B4A3E | Energy (teal, same as accent) |
| --cat-perspective | #ada45a | Perspective (olive/gold) |

### Copilot Layer Colors
| Token | Hex | Layer |
|-------|-----|-------|
| --feel-color | #c27a5a | Feel (emotional) |
| --see-color | #8b6aad | See (perspective) |
| --think-color | #4a7aad | Think (analytical) |
| --act-color | #2B4A3E | Act (practical) |

### Color Rules
- Background is always `--cream`. Dark backgrounds are only used for special immersive experiences (Lab page)
- Links: `--accent` with underline, `text-underline-offset: 3px`
- Hover states: transition to `--accent`
- Never use pure black (#000) or pure white (#fff) — always use the warm variants
- Category colors are reserved for their specific semantic purpose (dots, tags, borders) — never used for general UI

## Spacing

### Base Unit: 4px (0.25rem)
All spacing should be multiples of this base.

### Scale
| Token | Value | Usage |
|-------|-------|-------|
| 2xs | 2px (0.125rem) | Hairline gaps |
| xs | 4px (0.25rem) | Tight inline spacing |
| sm | 8px (0.5rem) | Tight element spacing |
| md | 16px (1rem) | Default element spacing |
| lg | 24px (1.5rem) | Section sub-spacing |
| xl | 32px (2rem) | Page padding, major spacing |
| 2xl | 48px (3rem) | Between sections |
| 3xl | 64px (4rem) | Major section separation |
| 4xl | 80px (5rem) | Page top margin |

### Container Widths
- **Full container:** max-width 1200px, padding 0 2rem (desktop), 0 1.5rem (mobile)
- **Narrow content:** max-width 680px — used for reading-length content (essays, about, now)
- **Compact content:** max-width 520px — used for centered forms (copilot input)

## Layout

### Grid System
- **Approach:** Content-first, not grid-first. Most pages use narrow (680px) single-column layout
- **Card grids:** `repeat(auto-fill, minmax(320px, 1fr))` with gap 20px
- **Stats/small cards:** `repeat(4, 1fr)` desktop, `repeat(2, 1fr)` mobile
- **Responsive breakpoint:** 768px (single breakpoint for simplicity)

### Dividers
- **Horizontal rule:** 40px width, 1px height, `--border-light`, centered
- **Section border:** full-width, 1px solid `--border`
- **Content separator:** border-bottom 1px solid `--border` on items

## Components

### Buttons
| Variant | Background | Color | Border | Radius |
|---------|-----------|-------|--------|--------|
| Primary | --accent | --cream | none | 4px |
| Secondary | transparent | --accent | 1px solid --accent | 4px |
| Ghost/icon | transparent | --ink-muted | 1px solid --border | 50% (circular) |

- Hover: `translateY(-1px)` + color/background swap
- Padding: primary `0.9rem 2.2rem`, secondary `0.75rem 1.8rem`

### Cards
- Background: `--warm-white`
- Border: 1px solid `--border`
- Border-radius: 12px
- Padding: 24px (1.5rem)
- Hover: `translateY(-3px)`, `box-shadow: 0 6px 20px rgba(0, 0, 0, 0.06)`

### Inputs
- Background: `rgba(255, 255, 255, 0.5)` or `--warm-white`
- Border: 1px solid `--border`
- Border-radius: 12px (textareas), 8px (small inputs)
- Padding: 1.2rem 1.4rem
- Font: Inter 0.95rem, weight 300
- Focus: `border-color: var(--accent)`, `box-shadow: 0 0 0 3px rgba(43, 74, 62, 0.08)`

### Pills/Chips
- Padding: 0.4rem 0.8rem
- Border-radius: 20px
- Border: 1px solid `--border`
- Font: Inter 0.8rem
- Active: background `--accent`, color white

### AI Insight Boxes
- Background: `rgba(255, 255, 255, 0.6)`
- Backdrop-filter: `blur(12px)`
- Border: 1px solid `rgba(43, 74, 62, 0.08)`
- Border-left: 3px solid `--accent`
- Border-radius: 8px
- Padding: 1.2rem 1.5rem
- Label: Inter 0.7rem, uppercase, letter-spacing 0.08em, color `--accent`
- Text: EB Garamond 1rem, italic

### Blockquotes
- Border-left: 2px solid `--border`
- Padding-left: 1.5rem
- Font: EB Garamond, italic
- Hover: border-left-color transitions to `--accent`

### Icons (SVG Line Art)
- Size: 18px
- Stroke: `var(--ink-muted)`, width 1.5
- Fill: none
- Line-cap/join: round
- Hover: stroke transitions to `--accent`
- Never use emojis as section markers — always SVG or typographic symbols (—, ·, →)

## Border Radius Scale
| Token | Value | Usage |
|-------|-------|-------|
| none | 0 | — |
| sm | 4px | Buttons, small elements |
| md | 8px | Inputs, reflection cards, principle cards |
| lg | 12px | Cards, textareas, modal surfaces |
| pill | 20px | Pills, chips, tags |
| full | 50% | Circular buttons, orbs, avatars |
| round | 999px | Rounded inputs (search bar) |

## Motion

### Approach: Intentional
Motion exists to communicate state changes, not to decorate. Every animation serves a purpose.

### Timing
| Token | Duration | Usage |
|-------|----------|-------|
| instant | 0.15s | Micro-interactions (opacity, color) |
| fast | 0.2s | Arrow reveals, small transforms |
| normal | 0.3s | Most hover transitions, color changes |
| slow | 0.6s | Page-level animations, orb entrances |

### Easing
- **Enter:** `ease-out` (elements appearing)
- **Exit:** `ease-in` (elements leaving)
- **Movement:** `ease-in-out` (position changes)
- **Bounce:** `cubic-bezier(0.34, 1.56, 0.64, 1)` (playful entrances, orbs only)

### Hover Patterns
- **Cards/blocks:** `translateY(-3px)` + shadow (standardized)
- **Text links:** color transition to `--accent`
- **Arrows:** `opacity 0→1` + `translateX(-4px → 0)`
- **Icons:** stroke color transition to `--accent`

## Glass Effect (Frosted Glass)
Used for floating UI elements over content:
```css
background: rgba(255, 255, 255, 0.5);
backdrop-filter: blur(12px);
-webkit-backdrop-filter: blur(12px);
border: 1px solid rgba(43, 74, 62, 0.08);
```

## Shadows
| Level | Value | Usage |
|-------|-------|-------|
| subtle | 0 2px 8px rgba(0, 0, 0, 0.04) | Resting cards |
| medium | 0 6px 20px rgba(0, 0, 0, 0.06) | Hovered cards |
| elevated | 0 8px 24px rgba(0, 0, 0, 0.06) | Modals, expanded elements |

## Special Sections

### Lab Page (Exception)
The Lab page intentionally breaks the editorial aesthetic with a dark (#1a1a1a) immersive background. This is deliberate — it's the "experimental" space. When building lab features, use the inverted palette (light text on dark bg) but maintain the same typography and spacing rules.

### Explore Page (Canvas)
The Explore page uses canvas-based visualization with floating orbs. It uses the category color palette for orbs and maintains the cream background.

## Decisions Log

| Date | Decision | Rationale |
|------|----------|-----------|
| 2026-03-22 | Initial design system documented | Codified from existing site patterns via /design-consultation |
| 2026-03-22 | SVG line art replaces emojis on Now page | Emojis broke editorial aesthetic — SVG stroke icons match the minimal, typographic feel |
| 2026-03-22 | Standardized card hover to translateY(-3px) | Was inconsistent (-1px to -4px) across pages |
| 2026-03-22 | Italic text must use --ink-light minimum | Per user feedback: italic + light gray is not legible |

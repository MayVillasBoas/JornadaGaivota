# Unfold — Home Redesign & Board of Mentors

**Date:** 2026-03-20
**Status:** Approved

## Overview

Redesign the Jornada da Gaivota site into **Unfold** — an interactive board of mentors and mental model atlas. The site becomes a visual, engaging platform where users explore frameworks from 12 thinkers to make better decisions about life, career, and relationships.

**Name:** Unfold
**Tagline:** *Explore the mind you live in.*
**Subtitle (PT):** *Modelos mentais, mentores e ferramentas para pensar com mais clareza.*

**Language strategy:** The site's primary language is Portuguese (target audience is Brazilian). The brand name "Unfold" and tagline "Explore the mind you live in" remain in English as brand identity. All section titles, labels, UI text, and content are in Portuguese. The `<html lang="pt-BR">` attribute reflects this. A future `/en/` subdirectory can provide an English version (out of scope for this redesign).

## Aesthetic Direction: Cream Cosmos

Psychedelic elegant — warm, luminous, organic.

- **Background:** Cream (#FAFAF7), warm whites (#F5F4F0)
- **Visual language:** Organic blobs floating like ink in milk. Gradients of sage, lilac, terracotta that drift slowly. No neon, no dark mode for the main site.
- **Typography:** EB Garamond (serif, headlines, 3.5rem+ for h1) + Inter (sans, body, 18-20px with line-height 1.7). Already in use.
- **Colors:** Existing palette (cream, sage #2B4A3E, ink #1a1a18) extended with 6 category colors
- **Motion:** Slow, meditative, contemplative. Nothing abrupt.
  - Blob animation cycles: **15-25 seconds** using prime-number durations per layer (e.g., 13s, 17s, 23s) so patterns never repeat exactly
  - Easing: `cubic-bezier(0.4, 0.0, 0.2, 1)` for breathing quality
  - Animate only `transform` and `opacity` (GPU-composited)
  - Blob blur: `filter: blur(60-100px)` with opacity 0.3-0.7
  - Maximum 3-4 gradient colors per blob composition
  - **Contemplative test:** if a visitor can watch the background for 60 seconds without feeling anxious, the motion is right
- **Inspiration:** Waking Up app (organic, meditative) + The Marginalian (editorial elegance, narrow reading column) + current site (cream minimalism)

## Mentors (12)

| Mentor | Key Book(s) | Primary Category |
|--------|------------|-----------------|
| Derek Sivers | Hell Yeah or No, Anything You Want | Decisions |
| Tim Ferriss | Tools of Titans, 4-Hour Workweek | Decisions / Action |
| Sam Harris | Waking Up | Thinking / Perspective |
| Henry Schukman | Original Love | Perspective |
| Andrew Huberman | Huberman Lab Protocols | Energy / Action |
| Peter Attia | Outlive | Energy |
| Bruce Tift | Already Free | Thinking / Relationships |
| Adam Grant | Think Again, Give and Take | Thinking / Decisions |
| Brene Brown | Daring Greatly, Atlas of the Heart | Relationships / Thinking |
| Maria Popova | Figuring, The Marginalian | Perspective |
| Marcus Aurelius | Meditations | Perspective / Thinking |
| Tim Urban | Wait But Why | Perspective / Action |

Each mentor will have all their frameworks/principles mapped — the full set of lenses they offer (like Farnam Street does for mental models).

**Data prerequisite:** Before UI implementation, create `src/data/mentors.ts` with seed data: 3-5 principles per mentor as a first pass. This unblocks all sections. A separate content expansion task will fill in the complete principle set later.

## Categories (6)

Categories define the TYPE of problem a lens helps with. They drive the color system across the site — hero orbit points, mentor orbs, lens cards, and filter pills.

| Category | Label (PT) | Color | What it covers |
|----------|-----------|-------|---------------|
| **Decisions** | Decisões | Blue (#4a7aad) | Evaluating options, weighing risks, choosing |
| **Thinking** | Pensamento | Lilac (#8b6aad) | Examining beliefs, biases, narratives |
| **Action** | Ação | Green (#4aad6a) | Breaking inertia, executing, prototyping |
| **Relationships** | Relações | Terracotta (#c27a5a) | Communication, conflict, boundaries |
| **Energy** | Energia | Sage (#2B4A3E) | Body, focus, sustainability |
| **Perspective** | Perspectiva | Gold (#ada45a) | Zoom out, impermanence, what matters |

Note: A principle can belong to multiple categories. The primary category determines the orb/point color; secondary categories appear as tags. Category labels in the UI use the Portuguese column (Label PT).

## Page Structure

### Home (single page with scroll sections)

**Section navigation:** Fixed dot indicators on the right side of the viewport. 5 dots for Hero, Lentes, Mentores, Ferramentas, Escrita (no dot for Footer). Active section dot is filled (accent color), others are hollow. Active state tracked via `IntersectionObserver` on each section. Dots are visible on desktop only (hidden on mobile to save space). Clicking a dot smooth-scrolls to that section.

#### 1. Hero (100vh)

**Canvas animation (Cream Cosmos):**
- Cream background with organic blobs drifting (sage, lilac, terracotta gradients)
- 12 luminous points orbiting in 3 elliptical rings around a central subtle glow
- Each point colored by the mentor's primary category
- Blobs react subtly to mouse position (parallax drift)

**HTML overlay:**
- "Unfold" — EB Garamond, large (3.5rem+), centered
- "Explore the mind you live in." — EB Garamond italic, muted color
- Input field at bottom: placeholder "o que tá na sua cabeça?" with microphone icon. **Visually present but explicitly disabled** — styled with reduced opacity (0.5), `pointer-events: none`, and a subtle "em breve" label beneath. Sets the tone without misleading users into expecting functionality. Functional AI routing is out of scope.

**Interactions:**
- Hover on orbit point: mentor name fades in as floating label
- Click on orbit point: smooth zoom, opens mentor preview panel as a **centered modal overlay** (name, book, 3 top principles, "ver perfil completo →" link). Click outside or X button closes.
- Scroll down: smooth transition to next section
- Mobile (< 768px): reduce background blobs from 12 to 6 (orbit points remain 12 but smaller), slow orbit speed by 50%, disable mouse parallax. Tap on points opens mentor panel.
- **Performance:** Use `requestAnimationFrame` with pause when hero is off-screen (`IntersectionObserver`). Handle `devicePixelRatio` for retina. Respect `prefers-reduced-motion` by showing static blobs with no animation.

#### 2. Lentes

- Section title: "Lentes" (anchor: `#lentes`)
- Filter row: 6 category pills (colored, using Portuguese labels), "Todas" default active
- Show result count after filtering: "Mostrando 8 lentes"
- Grid of principle cards (all ~40+ principles from all mentors)
- Each card: principle name, mentor name, short description, category color tag
- Click: card expands **inline** (pushes cards below down, `grid-column: 1 / -1`) showing full description + link to mentor profile. Click again or X to collapse.
- Search box to filter by text. Result count reflects both active category filter and search text combined (e.g., "Mostrando 3 lentes em Decisões").
- **Rationale for placing before Mentors:** The framework/lens is what solves the user's problem; the mentor provides credibility. Framework-first browsing matches how users think ("I need help deciding" not "I need Derek Sivers").

#### 3. Mentores

- Section title: "Mentores" (anchor: `#mentores`)
- Grid of 12 mentor cards (responsive: 4 cols desktop, 2 cols mobile)
- Each card: orb with radial gradient in category color, name (EB Garamond), primary book title
- Hover: lift + shadow. Click: navigates to `/mentores/[slug]`

#### 4. Ferramentas

- Section title: "Ferramentas" (anchor: `#ferramentas`)
- Grid of the 7 existing guided tools, organized by category:
  - **Decidir:** medo-na-mesa, tres-futuros, sim-inteiro
  - **Se Ouvir:** bussola-interna, auditoria-de-energia
  - **Comunicar:** o-que-quero-dizer, prototipos-de-futuro
- Each card: tool name, framework origin, mentor, number of steps
- "Life Calendar" placeholder card: same card style but with reduced opacity (0.6), a "em breve" badge (small pill, accent color), and no click action (cursor: default)
- Click on active tools: navigates to `/ferramentas/[slug]`

#### 5. Escrita — Jornada da Gaivota

- Section title: "Escrita" (anchor: `#escrita`)
- Existing writing section (essays and fragments)
- Keep current design, just ensure visual consistency with new aesthetic

#### 6. Footer

- Existing footer structure

### Mentor Profile Page (`/mentores/[slug]`)

**Routing:** Astro dynamic route at `src/pages/mentores/[slug].astro` using `getStaticPaths()` to generate one page per mentor from the static data file. Consistent with the project's SSG approach.

Individual page for each of the 12 mentors:

- **Header:** Name, orb with category color, tagline/one-liner about their perspective
- **Bio:** 2-3 paragraphs — who they are and why they matter as a mentor
- **Books:** List of key books with the most relevant one highlighted
- **Quotes:** 3-5 impactful quotes
- **Frameworks:** Cards of all principles from this mentor, each with:
  - Name, description, category tag (color)
  - Link to related guided tool (if one exists)
- **Connections:** Which other mentors complement this one and why (e.g., "Tift + Harris on acceptance", "Ferriss + Sivers on decisions"). Connections are displayed only on mentor profile pages, not on the home page.

### Navigation

Replaces current `Nav.astro` component entirely.

- Logo: "Unfold" (EB Garamond, serif)
- Links (PT): lentes · mentores · ferramentas · escrita · sobre · agora
- Link order matches section order on the home page
- On home: links use `smooth scroll` via JS (`element.scrollIntoView({ behavior: 'smooth' })`) to scroll to section anchors
- On other pages: links navigate to `/#lentes`, `/#mentores`, etc. (home + anchor)
- **Mobile:** Hamburger button toggles a slide-down menu (new implementation — current mobile menu has no JS handler). Menu items close menu on click.
- Language toggle: "en" button (existing, links to future `/en/` version)
- Replaces `HeroIllustration.astro` component (currently empty, can be deleted)

## Voice Input (Web Speech API)

**Where:** Textarea fields inside guided tools (ferramentas). NOT on the hero input (which is disabled/decorative).

**Implementation:**
- Browser-native Web Speech API (SpeechRecognition)
- Microphone button next to textarea — click to start, click to stop
- Three distinct visual states: idle (static mic icon), recording (pulsing border glow + mic highlighted), done (text appears in field)
- Real-time transcription into the text field
- ARIA label toggled: "Iniciar gravação de voz" / "Parar gravação"
- `aria-live="polite"` on the textarea for transcription updates
- Graceful fallback: if browser doesn't support Web Speech API, hide microphone button entirely
- No backend needed, no cost

**Scope:** Transcription only. AI processing of the transcribed text is future work.

## Data Architecture

### Mentor data structure

```typescript
interface Mentor {
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  books: { title: string; highlight?: boolean }[];
  quotes: string[];
  primaryCategory: Category; // determines orb color via categoryColors[primaryCategory]
  principles: Principle[];
  connections: { mentorSlug: string; reason: string }[];
}
// Mentor's full category list is derived from the union of all principles' categories.
// Mentor's color is derived from categoryColors[primaryCategory].
```

### Principle data structure

```typescript
interface Principle {
  id: string;
  name: string;
  shortDescription: string; // 1-2 sentences, shown on card in Lentes grid
  description: string; // full description, shown on card expand and mentor profile
  mentorSlug: string;
  categories: Category[];
  relatedToolSlug?: string; // link to guided tool if exists
}
```

### Category enum

```typescript
type Category = 'decisions' | 'thinking' | 'action' | 'relationships' | 'energy' | 'perspective';

const categoryLabels: Record<Category, string> = {
  decisions: 'Decisões',
  thinking: 'Pensamento',
  action: 'Ação',
  relationships: 'Relações',
  energy: 'Energia',
  perspective: 'Perspectiva',
};

const categoryColors: Record<Category, string> = {
  decisions: '#4a7aad',
  thinking: '#8b6aad',
  action: '#4aad6a',
  relationships: '#c27a5a',
  energy: '#2B4A3E',
  perspective: '#ada45a',
};
```

### Data storage

Mentor and principle data stored as a TypeScript data file (`src/data/mentors.ts`) — no database needed. Static at build time via Astro.

## Tech Stack

- **Framework:** Astro 6 (existing)
- **3D/Canvas:** HTML5 Canvas 2D API for hero animation (no Three.js needed for Cream Cosmos style — organic blobs are 2D radial gradients)
- **Voice:** Web Speech API (browser native)
- **Styling:** CSS (existing global.css extended)
- **Deployment:** Vercel (existing)
- **Data:** Static TypeScript file, no new backend

## Accessibility

- **Canvas orbit points:** Not keyboard-navigable (decorative). The Mentores grid below provides the same access via standard focusable cards.
- **Voice input button:** ARIA labels in Portuguese, toggled with state. `aria-live="polite"` on transcription target.
- **`prefers-reduced-motion`:** Hero shows static blobs, no orbit animation. Hover/click interactions still work.
- **Color contrast:** All 6 category colors are used on cream backgrounds for orbs/badges only (decorative), never as text color. Text remains ink (#1a1a18) or ink-light (#4a4a45).
- **Section headings:** Proper heading hierarchy (h1 for Unfold, h2 for sections, h3 for cards).
- **Dot navigation:** Dots have `aria-label` with section name (e.g., "Ir para Lentes"). `aria-current="true"` on active dot.

## What Changes vs Current Site

| Current | After |
|---------|-------|
| Name: "May" | Name: "Unfold" |
| Hero: static text + 3 cards | Hero: animated Cream Cosmos canvas |
| Home: flat sections | Home: hero + lentes + mentores + ferramentas + escrita |
| No mentor profiles | 12 mentor profile pages at `/mentores/[slug]` |
| 7 tools listed | 7 tools + Life Calendar placeholder |
| No voice input | Web Speech API on guided tool textareas |
| No framework categories | 6 categories with color system |
| Nav: ferramentas · escrita · sobre · agora | Nav: lentes · mentores · ferramentas · escrita · sobre · agora |
| Mixed EN/PT on same page | PT primary, EN brand only, `lang="pt-BR"` |
| No section indicators | Dot navigation on right side |

## What Does NOT Change

- Existing guided tools (ferramentas) and their architecture
- Escrita/essays content and layout
- Supabase auth system
- Claude API reflect endpoint
- About and Agora pages
- Domain/deployment setup

## Out of Scope (Future)

- AI routing from input to frameworks (requires prompt engineering + backend work)
- Life Calendar interactive tool (Tim Urban)
- Freemium model / invite codes
- Migrating remaining 6 tools to new GuidedTool architecture
- Whisper API upgrade for voice
- English version (`/en/` subdirectory)

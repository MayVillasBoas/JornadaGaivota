# Unfold Home Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Redesign the Jornada da Gaivota site into Unfold — an interactive board of mentors with Cream Cosmos animated hero, 12 mentor profiles, 40+ mental model lenses with category filters, and voice input on guided tools.

**Architecture:** Astro 6 static site with a new `src/data/mentors.ts` data file feeding all sections. Hero uses Canvas 2D for organic blob animation. New pages at `/mentores/[slug]` via `getStaticPaths()`. Voice input via browser-native Web Speech API.

**Tech Stack:** Astro 6, HTML5 Canvas 2D, Web Speech API, CSS (no new dependencies)

**Spec:** `docs/superpowers/specs/2026-03-20-unfold-home-redesign.md`

**Parallelization notes:**
- Tasks 2 and 3 are independent of each other (both depend on Task 1)
- Tasks 4, 5, 6, 7, 8, 9 all depend on Task 1 but have shared files: Tasks 6, 7, and 9 all write to `home.css` — run these sequentially
- Task 10 depends on Task 1 only — can run in parallel with Tasks 4-9
- Task 12 is fully independent — can run any time after Task 1
- Task 11 depends on all section tasks (4-9) completing first
- Task 13 depends on everything

---

## File Structure

### New directories to create
- `src/data/` — Data layer directory
- `src/pages/mentores/` — Mentor profile pages directory

### New files to create
- `src/data/mentors.ts` — All mentor data, principles, categories, colors, labels
- `src/components/CreamCosmos.astro` — Hero canvas animation component
- `src/components/DotNav.astro` — Fixed dot section navigation
- `src/components/LensesSection.astro` — Lenses grid with filters
- `src/components/MentorsSection.astro` — Mentors grid
- `src/components/ToolsSection.astro` — Tools grid with Life Calendar placeholder
- `src/components/MentorModal.astro` — Modal overlay for mentor preview from hero
- `src/components/VoiceInput.astro` — Microphone button component for Web Speech API
- `src/pages/mentores/[slug].astro` — Dynamic mentor profile pages
- `src/styles/home.css` — Home page section styles
- `src/styles/mentors.css` — Mentor profile page styles
- `src/scripts/cream-cosmos.ts` — Canvas animation logic (blobs + orbit points)
- `src/scripts/dot-nav.ts` — Dot navigation IntersectionObserver logic
- `src/scripts/lenses-filter.ts` — Category filter + search logic
- `src/scripts/voice-input.ts` — Web Speech API logic

### Files to modify
- `src/pages/index.astro` — Complete rewrite (new home)
- `src/components/Nav.astro` — Rewrite (new links, mobile menu, "Unfold" logo)
- `src/styles/global.css` — Add category color variables
- `src/layouts/Base.astro` — Update title default

### Files to delete
- `src/components/HeroIllustration.astro` — Replaced by CreamCosmos

---

## Task 1: Data Layer — Mentors, Principles, Categories

**Files:**
- Create: `src/data/mentors.ts`

This is the foundation everything else depends on. Seed data: 3-5 principles per mentor.

- [ ] **Step 1: Create the data directory and file with types and category maps**

```bash
mkdir -p "/Users/mayravillasboas/Claude/May Terapia/site/src/data"
```

```typescript
// src/data/mentors.ts

export type Category = 'decisions' | 'thinking' | 'action' | 'relationships' | 'energy' | 'perspective';

export const categoryLabels: Record<Category, string> = {
  decisions: 'Decisões',
  thinking: 'Pensamento',
  action: 'Ação',
  relationships: 'Relações',
  energy: 'Energia',
  perspective: 'Perspectiva',
};

export const categoryColors: Record<Category, string> = {
  decisions: '#4a7aad',
  thinking: '#8b6aad',
  action: '#4aad6a',
  relationships: '#c27a5a',
  energy: '#2B4A3E',
  perspective: '#ada45a',
};

export interface Principle {
  id: string;
  name: string;
  shortDescription: string;
  description: string;
  mentorSlug: string;
  categories: Category[];
  relatedToolSlug?: string;
}

export interface Mentor {
  slug: string;
  name: string;
  tagline: string;
  bio: string;
  books: { title: string; highlight?: boolean }[];
  quotes: string[];
  primaryCategory: Category;
  principles: Principle[];
  connections: { mentorSlug: string; reason: string }[];
}
```

- [ ] **Step 2: Add mentors 1-4 with seed principles**

Research each mentor using WebSearch. Get accurate bios, real quotes (verified), and correct framework descriptions. Each mentor needs: slug, name, tagline, bio (2-3 paragraphs), books, quotes (3-5), primaryCategory, principles (3-5 with shortDescription + description), connections (2-3).

Batch 1:
1. `derek-sivers` — Decisions (Hell Yeah or No, Useful Not True, Do This No That). Link: `hell_yeah_or_no` → `relatedToolSlug: 'sim-inteiro'`
2. `tim-ferriss` — Decisions (Fear Setting, 80/20 Principle, Lifestyle Design). Link: `fear_setting` → `relatedToolSlug: 'medo-na-mesa'`
3. `sam-harris` — Thinking (Mindfulness, No-Self, Free Will Skepticism)
4. `henry-schukman` — Perspective (Original Love, Ordinary Awakening, Koan Practice)

- [ ] **Step 3: Add mentors 5-8 with seed principles**

Batch 2:
5. `andrew-huberman` — Energy (Dopamine Protocols, Stress as Enhancer, Sleep Hygiene)
6. `peter-attia` — Energy (Four Pillars of Exercise, Emotional Health, Centenarian Decathlon)
7. `bruce-tift` — Thinking (Developmental vs Fruitional, Already Whole, Neurotic Intelligence)
8. `adam-grant` — Thinking (Think Again, Give and Take, Originals)

- [ ] **Step 4: Add mentors 9-12 with seed principles**

Batch 3:
9. `brene-brown` — Relationships (Vulnerability, Shame Resilience, Rumbling with Vulnerability)
10. `maria-popova` — Perspective (Figuring, Combinatorial Creativity, Shoreless Seeds)
11. `marcus-aurelius` — Perspective (Dichotomy of Control, Memento Mori, View from Above)
12. `tim-urban` — Perspective (Life Calendar, Procrastination Matrix, The Tail End)

Additional tool links for all batches:
- `odyssey_plan` → `relatedToolSlug: 'tres-futuros'`
- `internal_compass` → `relatedToolSlug: 'bussola-interna'`
- `energy_audit` → `relatedToolSlug: 'auditoria-de-energia'`
- `nonviolent_communication` → `relatedToolSlug: 'o-que-quero-dizer'`
- `life_prototyping` → `relatedToolSlug: 'prototipos-de-futuro'`

- [ ] **Step 5: Add helper functions**

```typescript
export function getAllPrinciples(): Principle[] {
  return mentors.flatMap(m => m.principles);
}

export function getMentorBySlug(slug: string): Mentor | undefined {
  return mentors.find(m => m.slug === slug);
}

export function getPrinciplesByCategory(category: Category): Principle[] {
  return getAllPrinciples().filter(p => p.categories.includes(category));
}

export function getMentorColor(mentor: Mentor): string {
  return categoryColors[mentor.primaryCategory];
}
```

- [ ] **Step 6: Verify data compiles**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npx astro check`
Expected: No TypeScript errors

- [ ] **Step 7: Commit**

```bash
git add src/data/mentors.ts
git commit -m "feat: add mentor data layer with 12 mentors and seed principles"
```

---

## Task 2: Global CSS — Category Colors & New Variables

**Files:**
- Modify: `src/styles/global.css`

- [ ] **Step 1: Add category color CSS variables**

Add to the `:root` block in `global.css`:

```css
/* Category colors */
--cat-decisions: #4a7aad;
--cat-thinking: #8b6aad;
--cat-action: #4aad6a;
--cat-relationships: #c27a5a;
--cat-energy: #2B4A3E;
--cat-perspective: #ada45a;
```

- [ ] **Step 2: Verify site still builds**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run build`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/styles/global.css
git commit -m "feat: add category color CSS variables"
```

---

## Task 3: Navigation — Rewrite Nav.astro

**Files:**
- Modify: `src/components/Nav.astro`

- [ ] **Step 1: Rewrite Nav.astro**

Replace the entire component. New nav must have:
- Logo: "Unfold" in EB Garamond serif
- Links (PT): lentes · mentores · ferramentas · escrita · sobre · agora
- On home page (detected via `Astro.url.pathname === '/'`): links use `#lentes`, `#mentores`, etc.
- On other pages: links use `/#lentes`, `/#mentores`, etc.
- Mobile: hamburger button with working JS toggle for slide-down menu
- "en" language toggle button (links to `#`, placeholder for future)

```astro
---
const isHome = Astro.url.pathname === '/';
const prefix = isHome ? '' : '/';
// Section links scroll on home, navigate to home+anchor on other pages
const sectionLinks = [
  { href: `${prefix}#lentes`, label: 'lentes' },
  { href: `${prefix}#mentores`, label: 'mentores' },
  { href: `${prefix}#ferramentas`, label: 'ferramentas' },
  { href: `${prefix}#escrita`, label: 'escrita' },
];
// Page links always navigate to their page
const pageLinks = [
  { href: '/sobre', label: 'sobre' },
  { href: '/agora', label: 'agora' },
];
const links = [...sectionLinks, ...pageLinks];
---
```

Include smooth scroll JS for home page anchor links:
```javascript
document.querySelectorAll('a[href^="#"]').forEach(link => {
  link.addEventListener('click', (e) => {
    const target = document.querySelector(link.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
      // Close mobile menu if open
      document.querySelector('.nav-links')?.classList.remove('open');
    }
  });
});
```

Mobile hamburger toggle:
```javascript
document.querySelector('.mobile-menu-btn')?.addEventListener('click', () => {
  document.querySelector('.nav-links')?.classList.toggle('open');
});
```

- [ ] **Step 2: Verify navigation renders**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run dev`
Check: Nav shows "Unfold" logo and all 6 links. Mobile hamburger toggles menu.

- [ ] **Step 3: Commit**

```bash
git add src/components/Nav.astro
git commit -m "feat: rewrite nav with Unfold branding and mobile menu"
```

---

## Task 4: Cream Cosmos Hero — Canvas Animation

**Files:**
- Create: `src/scripts/cream-cosmos.ts`
- Create: `src/components/CreamCosmos.astro`

- [ ] **Step 1a: Create canvas script — blob system**

`src/scripts/cream-cosmos.ts` — Start with the Blob class and basic canvas setup:
- Canvas sizing: fill parent container, handle `window.resize` and `devicePixelRatio` for retina
- Blob class: x, y, radius (60-150px), color (sage, lilac, terracotta from category palette), vx/vy (very slow), phase (random)
- Use large radial gradients with wide falloff (not CSS `filter: blur`)
- Sinusoidal movement: `Math.sin(t * speed + phase)` for breathing quality
- Prime-number cycle durations: 13s, 17s, 23s per blob group
- 12 blobs on desktop, 6 on mobile (< 768px)
- `requestAnimationFrame` loop to draw

- [ ] **Step 1b: Add orbit points system**

Add to `cream-cosmos.ts`:
- 12 orbit points (one per mentor) in 3 elliptical rings around canvas center
- Each point colored by mentor's `primaryCategory` via `categoryColors`
- Slow orbital movement, different speeds per ring (ring 1: 0.0004, ring 2: 0.0003, ring 3: 0.0002)
- Mobile: same 12 points but smaller radius, 50% orbit speed

- [ ] **Step 1c: Add interaction handlers**

Add to `cream-cosmos.ts`:
- Mouse move: parallax drift on blobs (desktop only, disabled < 768px)
- Hover detection: check mouse distance to each orbit point (< 15px threshold), emit hover callback with mentor data or null
- Click detection: check click position against orbit points, emit click callback

**API:**
```typescript
export class CreamCosmos {
  constructor(canvas: HTMLCanvasElement, mentors: MentorPoint[])
  start(): void
  stop(): void
  onMentorHover(callback: (mentor: MentorPoint | null) => void): void
  onMentorClick(callback: (mentor: MentorPoint) => void): void
}
```

- [ ] **Step 1d: Add performance and accessibility**

Add to `cream-cosmos.ts`:
- `IntersectionObserver` to pause `requestAnimationFrame` when canvas is off-screen
- `prefers-reduced-motion` check: if true, draw static blobs once (no animation loop), orbit points still visible
- Canvas resize handler: debounced `window.resize` listener recalculates dimensions

- [ ] **Step 2: Create the Astro component**

`src/components/CreamCosmos.astro` — Wraps the canvas with HTML overlay:

```astro
---
import { mentors, getMentorColor } from '../data/mentors';
---
<section class="hero" id="hero">
  <canvas id="cream-cosmos-canvas"></canvas>
  <div class="hero-overlay">
    <h1 class="hero-title">Unfold</h1>
    <p class="hero-tagline">Explore the mind you live in.</p>
    <div class="hero-input-wrapper">
      <input
        type="text"
        class="hero-input"
        placeholder="o que tá na sua cabeça?"
        disabled
        aria-hidden="true"
      />
      <span class="hero-input-mic" aria-hidden="true">
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/>
          <path d="M19 10v2a7 7 0 0 1-14 0v-2"/>
          <line x1="12" y1="19" x2="12" y2="23"/>
        </svg>
      </span>
      <span class="hero-input-badge">em breve</span>
    </div>
  </div>
  <div class="mentor-label" id="mentor-hover-label" aria-hidden="true"></div>
</section>
```

Scoped styles for the hero section. Import and initialize `CreamCosmos` in a `<script>` tag.

- [ ] **Step 3: Verify canvas renders on dev server**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run dev`
Check: Canvas fills viewport, blobs animate slowly, orbit points visible and colored

- [ ] **Step 4: Test hover and click interactions**

Check: Hovering over orbit points shows mentor name label. Clicking logs mentor slug to console (modal comes in Task 8).

- [ ] **Step 5: Test mobile behavior**

Resize browser to < 768px. Check: fewer blobs, no parallax, tap works on points.

- [ ] **Step 6: Test prefers-reduced-motion**

In browser dev tools, enable `prefers-reduced-motion: reduce`. Check: static blobs, no movement.

- [ ] **Step 7: Commit**

```bash
git add src/scripts/cream-cosmos.ts src/components/CreamCosmos.astro
git commit -m "feat: add Cream Cosmos hero with animated blobs and orbit points"
```

---

## Task 5: Dot Navigation

**Files:**
- Create: `src/components/DotNav.astro`
- Create: `src/scripts/dot-nav.ts`

- [ ] **Step 1: Create dot nav script**

`src/scripts/dot-nav.ts` — IntersectionObserver watches 5 sections (hero, lentes, mentores, ferramentas, escrita). Updates active dot. Click on dot scrolls to section.

```typescript
const sections = ['hero', 'lentes', 'mentores', 'ferramentas', 'escrita'];

const observer = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const id = entry.target.id;
      document.querySelectorAll('.dot-nav-dot').forEach(dot => {
        dot.classList.toggle('active', dot.dataset.section === id);
        dot.setAttribute('aria-current', dot.dataset.section === id ? 'true' : 'false');
      });
    }
  });
}, { threshold: 0.3 });
```

- [ ] **Step 2: Create Astro component**

`src/components/DotNav.astro` — Fixed position right side, 5 dots with aria-labels. Hidden on mobile (< 768px).

```astro
<nav class="dot-nav" aria-label="Navegação por seções">
  {['hero', 'lentes', 'mentores', 'ferramentas', 'escrita'].map((section, i) => (
    <button
      class="dot-nav-dot"
      data-section={section}
      aria-label={`Ir para ${section === 'hero' ? 'início' : section}`}
      aria-current="false"
    />
  ))}
</nav>
```

Scoped styles: fixed right 20px, top 50%, transform translateY(-50%), flex column, gap 12px. Dot: 10px circle, border 1.5px solid ink-muted, background transparent. Active: background accent, border accent.

- [ ] **Step 3: Verify dots track scroll position**

Run dev server, scroll through sections. Active dot should update. Click dot should scroll to section.

- [ ] **Step 4: Commit**

```bash
git add src/components/DotNav.astro src/scripts/dot-nav.ts
git commit -m "feat: add dot navigation for home sections"
```

---

## Task 6: Lenses Section — Filter + Search + Cards

**Files:**
- Create: `src/components/LensesSection.astro`
- Create: `src/scripts/lenses-filter.ts`
- Create: `src/styles/home.css`

- [ ] **Step 1: Create home.css with section styles**

`src/styles/home.css` — Styles shared across home sections:
- Section base: padding 80px 40px, max-width 1200px, margin auto
- Section title: EB Garamond, 1.8rem, ink color, centered, margin-bottom 40px
- Card grid: `grid-template-columns: repeat(auto-fill, minmax(320px, 1fr))`, gap 20px
- Card base: background warm-white, border 1px border color, border-radius 12px, padding 24px
- Card hover: translateY(-4px), shadow
- Filter pills: inline-flex, gap 8px, margin-bottom 24px
- Pill: padding 8px 16px, border-radius 20px, font-size 13px, border 1px solid border, cursor pointer
- Pill active: background = category color, color white, border-color = category color
- Result count: font-size 13px, ink-muted, margin-bottom 16px
- Card expanded: `grid-column: 1 / -1`, with transition
- Search box: padding 10px 16px, border-radius 8px, border, width 240px, font-size 14px
- Responsive: 1 col on mobile, smaller padding

- [ ] **Step 2: Create LensesSection component**

`src/components/LensesSection.astro` — Renders:
- Section title "Lentes"
- Filter row with 7 pills: "Todas" + 6 categories (colored, PT labels)
- Search input
- Result count
- Grid of principle cards from `getAllPrinciples()`

Each card renders: principle name (h3), mentor name (small), shortDescription (p), category tags (colored pills).

Expanded state shows: full description, "Ver perfil de [mentor] →" link.

- [ ] **Step 3: Create filter/search script**

`src/scripts/lenses-filter.ts`:
- Category pill click: toggle active, filter cards by `data-categories` attribute
- Search input: filter by text match on name + description
- Combined: both filters apply simultaneously
- Update result count text using format:
  - No filter: `"Mostrando ${count} lentes"`
  - With category: `"Mostrando ${count} lentes em ${categoryLabel}"`
  - With search: `"Mostrando ${count} lentes para '${searchTerm}'"`
  - Both: `"Mostrando ${count} lentes em ${categoryLabel} para '${searchTerm}'"`
- "Todas" pill resets category filter

- [ ] **Step 4: Verify filtering works**

Run dev server. Click category pills — cards filter. Type in search — cards filter. Count updates. Click "Todas" — all show.

- [ ] **Step 5: Verify card expand/collapse**

Click a card — it expands inline, pushes others down. Click again — collapses. Only one card expanded at a time.

- [ ] **Step 6: Commit**

```bash
git add src/components/LensesSection.astro src/scripts/lenses-filter.ts src/styles/home.css
git commit -m "feat: add Lenses section with category filters and search"
```

---

## Task 7: Mentors Section — Grid Cards

**Files:**
- Create: `src/components/MentorsSection.astro`

- [ ] **Step 1: Create MentorsSection component**

`src/components/MentorsSection.astro` — Renders:
- Section title "Mentores"
- Grid of 12 mentor cards (4 cols desktop, 2 mobile)
- Each card: orb (48px circle, radial gradient in category color), name (EB Garamond h3), primary book (small text)
- Cards link to `/mentores/[slug]`
- Hover: lift + shadow

```astro
---
import { mentors, getMentorColor } from '../data/mentors';
---
<section class="section" id="mentores">
  <h2 class="section-title">Mentores</h2>
  <div class="mentors-grid">
    {mentors.map(m => (
      <a href={`/mentores/${m.slug}`} class="mentor-card">
        <div class="mentor-orb" style={`background: radial-gradient(circle at 35% 35%, ${getMentorColor(m)}66, ${getMentorColor(m)}cc)`} />
        <h3>{m.name}</h3>
        <span class="mentor-book">{m.books.find(b => b.highlight)?.title || m.books[0]?.title}</span>
      </a>
    ))}
  </div>
</section>
```

- [ ] **Step 2: Add mentors grid styles to home.css**

`.mentors-grid`: 4 cols desktop, 2 mobile. `.mentor-card`: card base + text-align center. `.mentor-orb`: 48px circle, margin auto.

- [ ] **Step 3: Verify grid renders with all 12 mentors**

Run dev server. Check: 12 cards, correct colors, names, books. Links work (404 for now — mentor pages come in Task 10).

- [ ] **Step 4: Commit**

```bash
git add src/components/MentorsSection.astro src/styles/home.css
git commit -m "feat: add Mentors grid section"
```

---

## Task 8: Mentor Modal — Hero Preview Panel

**Files:**
- Create: `src/components/MentorModal.astro`

- [ ] **Step 1: Create modal component**

`src/components/MentorModal.astro` — Centered modal overlay that shows when clicking an orbit point in the hero:
- Backdrop: semi-transparent dark overlay
- Modal: cream background, border-radius 16px, max-width 480px, padding 32px
- Content: mentor name, book, 3 top principles (name + shortDescription), "ver perfil completo →" link
- Close: X button top-right + click outside closes

All mentor data rendered as hidden `<template>` elements, JS shows the right one on click.

- [ ] **Step 2: Wire modal to CreamCosmos click events**

In the hero's `<script>`, connect `cosmos.onMentorClick()` to show the modal with the correct mentor data.

- [ ] **Step 3: Verify modal opens and closes**

Click orbit point → modal appears with correct mentor. Click X or outside → closes. Click "ver perfil completo" → navigates to `/mentores/[slug]`.

- [ ] **Step 4: Commit**

```bash
git add src/components/MentorModal.astro
git commit -m "feat: add mentor preview modal for hero orbit points"
```

---

## Task 9: Tools Section — Ferramentas Grid

**Files:**
- Create: `src/components/ToolsSection.astro`

- [ ] **Step 1: Create ToolsSection component**

`src/components/ToolsSection.astro` — Renders:
- Section title "Ferramentas"
- 3 category sub-headers: Decidir, Se Ouvir, Comunicar
- Tool cards under each category with: tool name, framework origin, mentor name, step count
- Life Calendar placeholder: same card style, opacity 0.6, "em breve" badge, cursor default

Tool data hardcoded in component (matches existing ferramentas pages):

```typescript
const toolCategories = [
  {
    name: 'Decidir',
    tools: [
      { slug: 'medo-na-mesa', name: 'Botando o medo na mesa', framework: 'Fear Setting', mentor: 'Tim Ferriss', steps: 7 },
      { slug: 'tres-futuros', name: '3 futuros plausíveis', framework: 'Odyssey Plan', mentor: 'Bill Burnett & Dave Evans', steps: 5 },
      { slug: 'sim-inteiro', name: 'Sim de corpo inteiro', framework: 'Hell Yes or No', mentor: 'Derek Sivers', steps: 5 },
    ]
  },
  {
    name: 'Se Ouvir',
    tools: [
      { slug: 'bussola-interna', name: 'Bússola interna', framework: 'North Star', mentor: 'Martha Beck', steps: 5 },
      { slug: 'auditoria-de-energia', name: 'Auditoria de energia', framework: 'Energy Audit', mentor: 'May', steps: 5 },
    ]
  },
  {
    name: 'Comunicar',
    tools: [
      { slug: 'o-que-quero-dizer', name: 'O que eu quero dizer de verdade', framework: 'CNV', mentor: 'Marshall Rosenberg', steps: 5 },
      { slug: 'prototipos-de-futuro', name: 'Protótipos de futuro', framework: 'Life Prototyping', mentor: 'Bill Burnett & Dave Evans', steps: 5 },
    ]
  }
];
```

- [ ] **Step 2: Add Life Calendar placeholder**

After the Comunicar section, add:
```astro
<div class="tool-card placeholder">
  <span class="badge-coming">em breve</span>
  <h3>Life Calendar</h3>
  <span class="tool-meta">Tim Urban · Wait But Why</span>
</div>
```

Style: opacity 0.6, cursor default, badge = small pill with accent background.

- [ ] **Step 3: Verify all tools render with correct links**

Run dev server. Check: 7 tool cards + 1 placeholder. Active cards link to `/ferramentas/[slug]`. Placeholder has no link.

- [ ] **Step 4: Commit**

```bash
git add src/components/ToolsSection.astro src/styles/home.css
git commit -m "feat: add Tools section with Life Calendar placeholder"
```

---

## Task 10: Mentor Profile Pages

**Files:**
- Create: `src/pages/mentores/[slug].astro`
- Create: `src/styles/mentors.css`

- [ ] **Step 1: Create mentores directory and dynamic route**

```bash
mkdir -p "/Users/mayravillasboas/Claude/May Terapia/site/src/pages/mentores"
```

`src/pages/mentores/[slug].astro`:

```astro
---
import Base from '../../layouts/Base.astro';
import { mentors, getMentorBySlug, getMentorColor, categoryLabels, categoryColors } from '../../data/mentors';

export function getStaticPaths() {
  return mentors.map(m => ({ params: { slug: m.slug }, props: { mentor: m } }));
}

const { mentor } = Astro.props;
const color = getMentorColor(mentor);
---
```

Layout:
- Header: name (h1), orb, tagline
- Bio section (2-3 paragraphs, narrow max-width 680px)
- Books list (highlighted book gets accent border)
- Quotes (blockquote with accent left-border, italic EB Garamond)
- Frameworks grid (principle cards with category color tags, links to tools if `relatedToolSlug`)
- Connections (links to other mentor profiles with reason text)

- [ ] **Step 2: Create mentors.css**

`src/styles/mentors.css` — Styles for mentor profile page:
- Header with orb and gradient accent
- Bio in narrow column (max-width 680px, Marginalian-inspired)
- Quote blocks with accent left border
- Principle cards grid
- Connection links

- [ ] **Step 3: Verify mentor pages generate**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run build`
Check: Build generates 12 pages at `/mentores/[slug]`. No errors.

- [ ] **Step 4: Verify a mentor page renders correctly**

Run dev server, navigate to `/mentores/derek-sivers`. Check: all sections render — header, bio, books, quotes, frameworks, connections.

- [ ] **Step 5: Verify cross-links work**

Check: "ver perfil completo" from mentor modal → mentor page. Connection links → other mentor pages. Tool links → `/ferramentas/[slug]`.

- [ ] **Step 6: Commit**

```bash
git add src/pages/mentores/[slug].astro src/styles/mentors.css
git commit -m "feat: add dynamic mentor profile pages"
```

---

## Task 11: Home Page — Assemble All Sections

**Files:**
- Modify: `src/pages/index.astro`
- Modify: `src/layouts/Base.astro`
- Delete: `src/components/HeroIllustration.astro`

- [ ] **Step 1: Update Base.astro title**

Change default title from "May" to "Unfold".

- [ ] **Step 2: Rewrite index.astro**

Replace the entire home page with the new section layout:

```astro
---
import Base from '../layouts/Base.astro';
import CreamCosmos from '../components/CreamCosmos.astro';
import DotNav from '../components/DotNav.astro';
import LensesSection from '../components/LensesSection.astro';
import MentorsSection from '../components/MentorsSection.astro';
import ToolsSection from '../components/ToolsSection.astro';
import MentorModal from '../components/MentorModal.astro';
import '../styles/home.css';
---
<Base title="Unfold — Explore the mind you live in" description="Modelos mentais, mentores e ferramentas para pensar com mais clareza.">
  <CreamCosmos />
  <LensesSection />
  <MentorsSection />
  <ToolsSection />
  <section class="section" id="escrita">
    <h2 class="section-title">Escrita</h2>
    <!-- Keep existing writing content, adapted to new styles -->
  </section>
  <DotNav />
  <MentorModal />
</Base>
```

Port the existing Escrita section content from current `index.astro`. The 4 featured essays to preserve:
1. "a vergonha da primeira versão" (Nov 2024) → `/escrita/vergonha-da-primeira-versao`
2. "ubuntu" (Nov 2024) → `/escrita/ubuntu`
3. "a gaivota" (Jun 2023) → `/escrita/a-gaivota`
4. "o que fazer com a minha vida?" (Jun 2023) → `/escrita/o-que-fazer-com-a-minha-vida`

Keep the same card structure (title, date, link) but apply new home.css card styles for visual consistency.

- [ ] **Step 3: Delete HeroIllustration.astro**

```bash
rm src/components/HeroIllustration.astro
```

- [ ] **Step 4: Verify full home page renders**

Run dev server. Check all 5 sections render in order: Hero → Lentes → Mentores → Ferramentas → Escrita. Dot nav tracks scroll. All interactions work.

- [ ] **Step 5: Verify mobile layout**

Resize to < 768px. Check: responsive grids, hamburger menu, simplified hero, no dot nav.

- [ ] **Step 6: Commit**

```bash
git add src/pages/index.astro src/layouts/Base.astro
git rm src/components/HeroIllustration.astro
git commit -m "feat: assemble new Unfold home page with all sections"
```

---

## Task 12: Voice Input — Web Speech API

**Files:**
- Create: `src/components/VoiceInput.astro`
- Create: `src/scripts/voice-input.ts`
- Modify: `src/scripts/guided-tool.ts` (add voice input integration)

- [ ] **Step 1: Create voice input script**

`src/scripts/voice-input.ts`:
- Check `window.SpeechRecognition || window.webkitSpeechRecognition` support
- Three states: idle, recording, done
- On start: create SpeechRecognition instance, `lang = 'pt-BR'`, `continuous = true`, `interimResults = true`
- On result: append transcript to target textarea
- Visual: toggle pulsing class on button, update aria-label
- On stop or error: reset to idle state

```typescript
export function initVoiceInput(button: HTMLButtonElement, textarea: HTMLTextAreaElement) {
  const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRecognition) {
    button.style.display = 'none';
    return;
  }
  // ... implementation
}
```

- [ ] **Step 2: Create VoiceInput Astro component**

`src/components/VoiceInput.astro` — Renders a microphone button with SVG icon. Accepts `targetId` prop to know which textarea to fill.

```astro
---
interface Props { targetId: string; }
const { targetId } = Astro.props;
---
<button
  class="voice-btn"
  data-target={targetId}
  aria-label="Iniciar gravação de voz"
  type="button"
>
  <svg><!-- mic icon --></svg>
</button>
```

Styles: positioned absolute right of textarea, 3 visual states via CSS classes.

- [ ] **Step 3: Self-initializing voice input (decoupled from guided-tool.ts)**

The voice input script should self-initialize on page load — **do not modify `guided-tool.ts`**. Instead, `voice-input.ts` queries all `.voice-btn[data-target]` elements on the page and initializes each one with its corresponding textarea. This keeps voice input decoupled.

```typescript
// Self-initialize on DOMContentLoaded
document.addEventListener('DOMContentLoaded', () => {
  document.querySelectorAll<HTMLButtonElement>('.voice-btn[data-target]').forEach(btn => {
    const textarea = document.getElementById(btn.dataset.target!);
    if (textarea instanceof HTMLTextAreaElement) {
      initVoiceInput(btn, textarea);
    }
  });
});
```

The VoiceInput Astro component is placed next to each textarea in the guided tool `.astro` templates. No changes to `guided-tool.ts` needed.

- [ ] **Step 4: Verify voice input on a guided tool**

Run dev server, navigate to `/ferramentas/sim-inteiro`. Check: mic button visible next to textarea. Click mic → browser asks for permission → speak → text appears. Click again → stops.

- [ ] **Step 5: Verify fallback**

In a browser that doesn't support Web Speech API (or with it disabled): mic button should be hidden entirely.

- [ ] **Step 6: Commit**

```bash
git add src/components/VoiceInput.astro src/scripts/voice-input.ts src/scripts/guided-tool.ts
git commit -m "feat: add Web Speech API voice input to guided tools"
```

---

## Task 13: Final Polish & Build Verification

**Files:**
- All files from previous tasks

- [ ] **Step 1: Full build test**

```bash
cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run build
```
Expected: Build succeeds with no errors. All 12 mentor pages + home + existing pages generated.

- [ ] **Step 2: Verify existing pages still work**

Check: `/ferramentas`, `/escrita`, `/sobre`, `/agora`, `/login` all still render correctly. No regressions.

- [ ] **Step 3: Check accessibility basics**

- Tab through the page: focus order makes sense
- Section headings: h1 (Unfold) → h2 (Lentes, Mentores, etc.) → h3 (cards)
- Dot nav: aria-labels present, aria-current updates
- Voice button: aria-label toggles

- [ ] **Step 4: Performance check**

- Open Chrome DevTools → Performance → record scroll through home
- Canvas animation should not cause frame drops (target 60fps)
- Check that animation pauses when hero scrolls off-screen

- [ ] **Step 5: Commit any final fixes**

```bash
git add -A
git commit -m "fix: final polish and build verification"
```

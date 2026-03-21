# Copilot UX Redesign Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Transform the Decision Copilot from a static form-based experience into a flowing, voice-first conversation with organic visuals, streaming AI reflections, and half the questions.

**Architecture:** The copilot page becomes a single scrolling timeline. The engine is rewritten as an event-driven flow: question appears → user responds (voice/text) → AI reflection streams in (fake streaming) → next question auto-appears after 2s. A canvas-based "breathing line" grows along the left edge, changing color by module layer. Voice input uses the existing `voice-input.ts` module. The API endpoint is unchanged.

**Tech Stack:** Astro 6 (SSR/Vercel), Canvas 2D, Web Speech API, existing Claude Sonnet API endpoint.

**Design Spec:** `docs/superpowers/specs/2026-03-21-copilot-ux-redesign.md`

**Working Directory:** `/Users/mayravillasboas/Claude/May Terapia/site/.worktrees/copilot-ux/`

---

## File Structure

```
src/
  scripts/copilot/
    modules.ts          — MODIFY: reduce each module to 2-3 questions
    engine.ts           — REWRITE: flowing session with streaming + auto-advance
    breathing-line.ts   — CREATE: organic canvas line visualization
    routing.ts          — NO CHANGES
    persistence.ts      — NO CHANGES
    tracking.ts         — NO CHANGES
  styles/
    copilot.css         — REWRITE: flowing timeline styles
  pages/
    copilot.astro       — MODIFY: add canvas + voice button + sticky input
  pages/api/
    copilot.ts          — NO CHANGES
```

---

### Task 1: Reduce Module Questions

**Files:**
- Modify: `src/scripts/copilot/modules.ts`

Cut each module from 4-5 questions to 2-3, per the spec. The questions are more focused and the AI compensates with deeper reflections.

- [ ] **Step 1: Replace modules.ts with reduced questions**

```typescript
// src/scripts/copilot/modules.ts

export interface ModuleStep {
  question: string;
  guidance: string;
  placeholder: string;
}

export interface ModuleDefinition {
  slug: string;
  title: string;
  source: string;
  layer: 'feel' | 'see' | 'think' | 'act';
  description: string;
  steps: ModuleStep[];
}

export const MODULES: Record<string, ModuleDefinition> = {
  'body-scan': {
    slug: 'body-scan',
    title: 'Body Scan',
    source: 'Damasio (Somatic Markers) + Polyvagal Theory',
    layer: 'feel',
    description: 'Your body knows before your mind does.',
    steps: [
      {
        question: 'Close your eyes. Imagine choosing the first path you\'re considering. Stay with that image. What happens in your body?',
        guidance: 'Does something tighten? Open? Does your breathing change? Notice shoulders, chest, stomach, jaw.',
        placeholder: 'When I imagine this option, my body...',
      },
      {
        question: 'Now imagine the other path. Stay with it. What does your body do? Which option felt more like expansion, and which more like contraction?',
        guidance: 'Expansion (relief, opening, energy) often signals alignment. Contraction (tightness, heaviness) often signals resistance.',
        placeholder: 'When I imagine this option, my body...',
      },
    ],
  },
  'parts-mapping': {
    slug: 'parts-mapping',
    title: 'Parts Mapping',
    source: 'Internal Family Systems (Richard Schwartz)',
    layer: 'see',
    description: 'Different parts of you want different things.',
    steps: [
      {
        question: 'There\'s a voice inside you that wants one thing, and another pulling differently. Describe them both — what does each want? What does each fear?',
        guidance: 'Give them names if you can. "The provider" or "The adventurer." What is each part protecting you from?',
        placeholder: 'One part of me wants... because it fears...\nAnother part wants... because it fears...',
      },
      {
        question: 'Stepping back from both parts — like a wise mediator — what do you notice? Is there a way to honor what both actually need?',
        guidance: 'You are not your parts. You are the one who can see them both. What does that perspective reveal?',
        placeholder: 'Stepping back, I notice...',
      },
    ],
  },
  'first-principles': {
    slug: 'first-principles',
    title: 'First Principles',
    source: 'Charlie Munger + Elon Musk',
    layer: 'think',
    description: 'Strip away assumptions. What\'s actually true?',
    steps: [
      {
        question: 'Write down every belief about this situation — every "I have to," "I can\'t," "they expect me to." Then mark each one: is it a verifiable FACT or an assumption?',
        guidance: 'A fact: "My contract ends in June." An assumption: "They\'ll never hire me again." Be ruthless.',
        placeholder: 'Facts:\n\nAssumptions:',
      },
      {
        question: 'Looking at just the facts — what\'s one assumption you\'ve been treating as fact that, if challenged, would change everything?',
        guidance: 'This is often the hidden lever. The one thing everyone "knows" that might not be true.',
        placeholder: 'The assumption that would change everything is...',
      },
    ],
  },
  'regret-minimization': {
    slug: 'regret-minimization',
    title: 'Regret Minimization',
    source: 'Jeff Bezos',
    layer: 'think',
    description: 'Project yourself to 80. Look back.',
    steps: [
      {
        question: 'You\'re 80 years old, looking back. You chose path A and lived with it for decades. Then imagine you chose path B instead. Which regret feels heavier?',
        guidance: 'Don\'t think about next month. Think about the arc of your life. Regret of action vs regret of inaction.',
        placeholder: 'The heavier regret would be...',
      },
      {
        question: 'What would 80-year-old you tell present-day you? If they could send one message back in time, what would it be?',
        guidance: 'Wisdom often lives in this gap between your present fear and your future self\'s perspective.',
        placeholder: '80-year-old me would say...',
      },
    ],
  },
  'decision-memo': {
    slug: 'decision-memo',
    title: 'Decision Memo',
    source: 'Farnam Street Decision Journal',
    layer: 'act',
    description: 'Everything you\'ve uncovered, compiled into clarity.',
    steps: [
      {
        question: 'Based on everything — body signals, inner parts, facts vs assumptions, regret — what are your REAL options and their trade-offs?',
        guidance: 'Include the option you\'re afraid to write down. It might be the real one.',
        placeholder: 'Option 1: I gain... but I give up...\nOption 2: I gain... but I give up...',
      },
      {
        question: 'Right now, what does your gut say? If you had to choose in 10 seconds, what would you pick? Write it before your mind argues.',
        guidance: 'This isn\'t your final answer. It\'s a signal. Trust it enough to write it down.',
        placeholder: 'My gut says...',
      },
      {
        question: 'What\'s the smallest next step you can take in the next 24 hours?',
        guidance: 'A conversation. An email. A walk to think. One micro-action that breaks the paralysis.',
        placeholder: 'In the next 24 hours, I will...',
      },
    ],
  },
};

export const MODULE_ORDER = ['body-scan', 'parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'];
```

- [ ] **Step 2: Verify build**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site/.worktrees/copilot-ux" && npx astro build 2>&1 | tail -3`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/scripts/copilot/modules.ts
git commit -m "refactor(copilot): reduce modules to 2-3 questions each (down from 4-5)

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 2: Breathing Line Canvas

**Files:**
- Create: `src/scripts/copilot/breathing-line.ts`

A lightweight 2D canvas visualization that draws an organic line along the left edge of the session timeline. The line grows as the user progresses, changes color per module layer, and has small nodes where themes are extracted.

- [ ] **Step 1: Create breathing-line.ts**

```typescript
// src/scripts/copilot/breathing-line.ts

const LAYER_COLORS: Record<string, string> = {
  feel: '#c27a5a',
  see: '#8b6aad',
  think: '#4a7aad',
  act: '#2B4A3E',
  intake: '#8a8a82',
};

interface LineSegment {
  startY: number;
  endY: number;
  layer: string;
}

interface ThemeNode {
  y: number;
  label: string;
  layer: string;
}

export class BreathingLine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private segments: LineSegment[] = [];
  private nodes: ThemeNode[] = [];
  private animFrame: number | null = null;
  private time = 0;
  private container: HTMLElement;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.container = container;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = 40 * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = '40px';
    this.canvas.style.height = `${rect.height}px`;
    this.ctx.scale(dpr, dpr);
    this.draw();
  }

  addSegment(startY: number, endY: number, layer: string): void {
    this.segments.push({ startY, endY, layer });
    this.resize();
  }

  addNode(y: number, label: string, layer: string): void {
    this.nodes.push({ y, label, layer });
    this.draw();
  }

  // Rebuild from block positions — call after DOM updates
  rebuildFromBlocks(blocks: HTMLElement[], layers: string[]): void {
    this.segments = [];
    const canvasRect = this.canvas.getBoundingClientRect();

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const rect = block.getBoundingClientRect();
      const startY = rect.top - canvasRect.top;
      const endY = rect.bottom - canvasRect.top;
      const layer = layers[i] || 'intake';
      this.segments.push({ startY, endY, layer });
    }

    this.resize();
  }

  private draw(): void {
    const w = 40;
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.clearRect(0, 0, w, h);

    if (this.segments.length === 0) return;

    this.time += 0.02;
    const centerX = 20;

    for (const seg of this.segments) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = LAYER_COLORS[seg.layer] || LAYER_COLORS.intake;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';

      const steps = Math.max(1, Math.floor((seg.endY - seg.startY) / 4));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = seg.startY + t * (seg.endY - seg.startY);
        // Organic wobble: sine wave offset
        const wobble = Math.sin(y * 0.02 + this.time) * 3 +
                       Math.sin(y * 0.05 + this.time * 1.3) * 1.5;
        const x = centerX + wobble;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }

    // Draw nodes
    for (const node of this.nodes) {
      const color = LAYER_COLORS[node.layer] || LAYER_COLORS.intake;
      const wobble = Math.sin(node.y * 0.02 + this.time) * 3;
      const x = centerX + wobble;

      this.ctx.beginPath();
      this.ctx.arc(x, node.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
  }

  startAnimation(): void {
    if (this.animFrame) return;
    const animate = () => {
      this.draw();
      this.animFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimation(): void {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  destroy(): void {
    this.stopAnimation();
    window.removeEventListener('resize', () => this.resize());
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/copilot/breathing-line.ts
git commit -m "feat(copilot): add organic breathing line canvas visualization

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 3: Copilot Page + Styles

**Files:**
- Rewrite: `src/styles/copilot.css`
- Modify: `src/pages/copilot.astro`

New flowing timeline layout with sticky input bar, voice button, canvas element for breathing line, and conversation-block styles.

- [ ] **Step 1: Rewrite copilot.css**

Write the complete new CSS file for the flowing session. Key classes:

- `.copilot-container` — full-width with left padding for breathing line
- `.copilot-canvas` — absolute positioned canvas on left edge
- `.copilot-timeline` — the scrolling area for conversation blocks
- `.copilot-block` — each question/answer/reflection unit
- `.copilot-question` — copilot's question in large serif
- `.copilot-response` — user's answer with warm-white background
- `.copilot-reflection` — AI reflection with accent-light background, left border
- `.copilot-themes` — theme tag badges
- `.copilot-transition` — module transition divider
- `.copilot-input` — sticky bottom input bar with mic + textarea + send
- `.copilot-thinking` — 3-dot pulse animation
- `.copilot-header` — header with layer progress dots
- `.voice-recording` — waveform state
- `.copilot-dimmed` — opacity 0.7 for past blocks on resume

The CSS should use the site's existing design tokens (--cream, --ink, --serif, etc) and add the new copilot-specific tokens (--feel-color, --see-color, etc). Follow the mockup layout from `/tmp/copilot-mockup.html`.

```css
/* src/styles/copilot.css */

:root {
  --feel-color: #c27a5a;
  --see-color: #8b6aad;
  --think-color: #4a7aad;
  --act-color: #2B4A3E;
}

/* Container */
.copilot-container {
  position: relative;
  min-height: calc(100vh - 60px);
}

.copilot-canvas {
  position: absolute;
  left: 0;
  top: 0;
  width: 40px;
  pointer-events: none;
  z-index: 1;
}

.copilot-timeline {
  max-width: 640px;
  margin: 0 auto;
  padding: 2rem 1.5rem 8rem 3.5rem;
}

/* Header with layer dots */
.copilot-header {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 0;
  margin-bottom: 1.5rem;
}

.copilot-header .layer-dot {
  width: 8px;
  height: 8px;
  border-radius: 50%;
  background: var(--border);
  transition: all 0.5s ease;
}

.copilot-header .layer-dot.active {
  width: 24px;
  border-radius: 4px;
}

.copilot-header .layer-dot.done {
  opacity: 1;
}

.copilot-header .layer-dot.feel { background: var(--feel-color); }
.copilot-header .layer-dot.see { background: var(--see-color); }
.copilot-header .layer-dot.think { background: var(--think-color); }
.copilot-header .layer-dot.act { background: var(--act-color); }

.copilot-header .layer-label {
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-muted);
  margin-left: 0.5rem;
}

/* Conversation blocks */
.copilot-block {
  margin-bottom: 2rem;
  animation: copilotFadeIn 0.5s ease;
}

.copilot-block.dimmed {
  opacity: 0.7;
}

@keyframes copilotFadeIn {
  from { opacity: 0; transform: translateY(12px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Copilot question */
.copilot-question {
  margin-bottom: 0.75rem;
}

.copilot-question .speaker {
  font-family: var(--sans);
  font-size: 0.7rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--accent);
  font-weight: 600;
  margin-bottom: 0.4rem;
}

.copilot-question p {
  font-family: var(--serif);
  font-size: 1.15rem;
  line-height: 1.55;
  color: var(--ink);
}

.copilot-question .guidance {
  font-family: var(--serif);
  font-size: 0.9rem;
  font-style: italic;
  color: var(--ink-muted);
  line-height: 1.5;
  margin-top: 0.4rem;
}

/* User response */
.copilot-response {
  background: var(--warm-white);
  border-radius: 8px;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  border-left: 3px solid var(--border);
}

.copilot-response p {
  font-family: var(--sans);
  font-size: 0.95rem;
  line-height: 1.6;
  color: var(--ink-light);
  white-space: pre-line;
}

.copilot-response .meta {
  font-size: 0.75rem;
  color: var(--ink-muted);
  margin-top: 0.5rem;
  display: flex;
  align-items: center;
  gap: 0.4rem;
}

.copilot-response .meta svg {
  width: 12px;
  height: 12px;
}

/* AI reflection */
.copilot-reflection {
  background: var(--accent-light);
  border-left: 3px solid var(--accent);
  border-radius: 0 8px 8px 0;
  padding: 1rem 1.25rem;
  margin-bottom: 0.5rem;
  min-height: 48px;
}

.copilot-reflection .marker {
  font-family: var(--sans);
  font-size: 0.7rem;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.05em;
  margin-bottom: 0.3rem;
}

.copilot-reflection p {
  font-family: var(--serif);
  font-size: 0.95rem;
  line-height: 1.55;
  color: var(--ink-light);
  font-style: italic;
}

/* Theme tags */
.copilot-themes {
  display: flex;
  gap: 0.4rem;
  margin-top: 0.5rem;
  margin-bottom: 1rem;
  flex-wrap: wrap;
}

.theme-tag {
  font-family: var(--sans);
  font-size: 0.7rem;
  padding: 2px 8px;
  border-radius: 10px;
  background: rgba(43, 74, 62, 0.08);
  color: var(--accent);
}

/* Thinking dots */
.thinking-dots {
  display: flex;
  gap: 5px;
  padding: 0.5rem 0;
}

.thinking-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink-muted);
  animation: dotPulse 1.4s ease-in-out infinite;
}

.thinking-dots span:nth-child(2) { animation-delay: 0.2s; }
.thinking-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

/* Module transition */
.copilot-module-transition {
  text-align: center;
  padding: 1.5rem 0;
  position: relative;
  margin: 1rem 0;
}

.copilot-module-transition::before {
  content: '';
  position: absolute;
  left: 0;
  right: 0;
  top: 50%;
  height: 1px;
  background: var(--border);
}

.copilot-module-transition span {
  position: relative;
  background: var(--cream);
  padding: 0 1rem;
  font-family: var(--sans);
  font-size: 0.75rem;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-muted);
}

.copilot-module-transition .transition-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 1rem;
  position: relative;
}

/* Sticky input bar */
.copilot-input {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  background: var(--cream);
  border-top: 1px solid var(--border);
  padding: 0.75rem 1rem;
  z-index: 10;
}

.copilot-input-inner {
  max-width: 640px;
  margin: 0 auto;
  display: flex;
  gap: 0.75rem;
  align-items: flex-end;
}

.copilot-input textarea {
  flex: 1;
  padding: 0.75rem 1rem;
  font-family: var(--sans);
  font-size: 0.9rem;
  border: 1px solid var(--border);
  border-radius: 8px;
  background: var(--warm-white);
  color: var(--ink);
  resize: none;
  line-height: 1.5;
  min-height: 44px;
  max-height: 120px;
}

.copilot-input textarea:focus {
  outline: none;
  border-color: var(--accent);
}

.copilot-input textarea.full-width {
  /* When voice is unavailable */
}

.copilot-voice-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: 2px solid var(--accent);
  background: transparent;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
  flex-shrink: 0;
}

.copilot-voice-btn:hover {
  background: var(--accent);
}

.copilot-voice-btn:hover svg {
  stroke: var(--cream);
}

.copilot-voice-btn svg {
  width: 18px;
  height: 18px;
  stroke: var(--accent);
  stroke-width: 2;
  fill: none;
}

.copilot-voice-btn.voice-btn--recording {
  border-color: var(--feel-color);
  animation: recordPulse 1.5s ease-in-out infinite;
}

.copilot-voice-btn.voice-btn--recording svg {
  stroke: var(--feel-color);
}

@keyframes recordPulse {
  0%, 100% { box-shadow: 0 0 0 0 rgba(194, 122, 90, 0.3); }
  50% { box-shadow: 0 0 0 8px rgba(194, 122, 90, 0); }
}

.copilot-send-btn {
  width: 44px;
  height: 44px;
  border-radius: 50%;
  border: none;
  background: var(--ink);
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  transition: opacity 0.2s;
}

.copilot-send-btn:hover { opacity: 0.8; }

.copilot-send-btn:disabled {
  opacity: 0.3;
  cursor: not-allowed;
}

.copilot-send-btn svg {
  width: 18px;
  height: 18px;
  stroke: var(--cream);
  stroke-width: 2;
  fill: none;
}

/* Empty state hint */
.copilot-empty-hint {
  font-size: 0.8rem;
  color: var(--feel-color);
  text-align: center;
  padding: 0.25rem;
  display: none;
}

.copilot-empty-hint.visible {
  display: block;
}

/* Decision memo output */
.copilot-memo {
  animation: copilotFadeIn 0.5s ease;
}

.copilot-memo h2 {
  font-family: var(--serif);
  font-size: 1.8rem;
  color: var(--ink);
  margin-bottom: 0.25rem;
}

.copilot-memo-date {
  color: var(--ink-muted);
  font-size: 0.85rem;
  margin-bottom: 2rem;
}

.memo-section {
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid var(--border);
}

.memo-section:last-of-type {
  border-bottom: none;
}

.memo-section h3 {
  font-family: var(--sans);
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.1em;
  color: var(--ink-muted);
  margin-bottom: 0.5rem;
}

.memo-section p {
  font-family: var(--serif);
  font-size: 1rem;
  line-height: 1.6;
  color: var(--ink);
  white-space: pre-line;
}

.memo-next-step {
  background: var(--accent-light);
  padding: 1.25rem;
  border-radius: 6px;
  border-bottom: none;
}

.copilot-memo-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
  padding-top: 1rem;
}

/* Buttons */
.btn-primary {
  font-family: var(--sans);
  font-size: 0.9rem;
  padding: 0.75rem 1.5rem;
  background: var(--ink);
  color: var(--cream);
  border: none;
  border-radius: 6px;
  cursor: pointer;
  transition: opacity 0.2s;
}

.btn-primary:hover { opacity: 0.85; }

.btn-secondary {
  font-family: var(--sans);
  font-size: 0.9rem;
  padding: 0.75rem 1.5rem;
  background: transparent;
  color: var(--ink);
  border: 1px solid var(--border);
  border-radius: 6px;
  cursor: pointer;
  transition: border-color 0.2s;
  text-decoration: none;
}

.btn-secondary:hover { border-color: var(--ink-muted); }

/* Loading */
.copilot-loading {
  text-align: center;
  padding: 2rem 0;
}

.copilot-loading-text {
  font-family: var(--serif);
  font-style: italic;
  color: var(--ink-muted);
  font-size: 1rem;
  margin-bottom: 1rem;
}

/* Mobile */
@media (max-width: 640px) {
  .copilot-canvas { width: 20px; }
  .copilot-timeline { padding-left: 2rem; padding-right: 1rem; }
  .copilot-question p { font-size: 1.05rem; }
  .copilot-input-inner { gap: 0.5rem; }
  .copilot-memo-actions { flex-wrap: wrap; }
}
```

- [ ] **Step 2: Update copilot.astro with canvas + voice + sticky input**

```astro
---
import Base from '../layouts/Base.astro';
import '../styles/copilot.css';
---

<Base title="Decision Copilot — May">
  <div class="copilot-container">
    <canvas class="copilot-canvas" id="breathing-canvas"></canvas>
    <div class="copilot-timeline" id="copilot-timeline">
      <!-- Engine renders conversation blocks here -->
    </div>
    <div class="copilot-input" id="copilot-input">
      <div class="copilot-input-inner">
        <button class="copilot-voice-btn" id="copilot-mic" aria-label="Start voice recording" aria-pressed="false">
          <svg viewBox="0 0 24 24"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>
        </button>
        <textarea id="copilot-text" placeholder="type or tap the mic to speak..." rows="1"></textarea>
        <button class="copilot-send-btn" id="copilot-send" disabled>
          <svg viewBox="0 0 24 24"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </div>
      <p class="copilot-empty-hint" id="copilot-hint">take your time — even a few words help</p>
    </div>
  </div>
</Base>

<script>
  import { CopilotEngine } from '../scripts/copilot/engine';

  if (!(window as any).__copilotInit) {
    (window as any).__copilotInit = true;

    const timeline = document.getElementById('copilot-timeline');
    const canvas = document.getElementById('breathing-canvas') as HTMLCanvasElement;
    const mic = document.getElementById('copilot-mic') as HTMLButtonElement;
    const textarea = document.getElementById('copilot-text') as HTMLTextAreaElement;
    const sendBtn = document.getElementById('copilot-send') as HTMLButtonElement;
    const hint = document.getElementById('copilot-hint') as HTMLElement;

    if (timeline) {
      const engine = new CopilotEngine({
        timeline,
        canvas,
        mic,
        textarea,
        sendBtn,
        hint,
      });
      engine.init();
    }
  }
</script>
```

- [ ] **Step 3: Verify build**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site/.worktrees/copilot-ux" && npx astro build 2>&1 | tail -3`
Expected: Build succeeds (engine.ts will error since it's not rewritten yet — that's expected, commit page+styles first)

- [ ] **Step 4: Commit**

```bash
git add src/styles/copilot.css src/pages/copilot.astro
git commit -m "feat(copilot): rewrite page + styles for flowing session UX

Adds canvas element for breathing line, sticky input bar with
voice button, and flowing timeline layout with conversation blocks.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 4: Rewrite Engine

**Files:**
- Rewrite: `src/scripts/copilot/engine.ts`

The engine is completely rewritten for the flowing session model. Key changes:
- Constructor takes DOM refs (timeline, canvas, mic, textarea, send button) instead of a single container
- Builds a scrolling timeline of conversation blocks instead of replacing innerHTML each phase
- Implements fake streaming (fetch full response, reveal char by char)
- Auto-advances between questions within a module (2s delay after reflection)
- Manual gate between modules (continue/pause buttons)
- Integrates voice input via existing `initVoiceInput()`
- Integrates breathing line canvas
- On resume: reconstructs full timeline from stored data, dims past blocks

This is the largest task. The engine should:

1. On init: check for active journey → if exists, reconstruct timeline (dimmed) and show next question. If not, show intake question.
2. `appendQuestion(text, guidance)` → adds a `.copilot-question` block to timeline
3. After user submits (voice or text) → `appendResponse(text, isVoice, duration?)` → adds `.copilot-response` block
4. Fetch AI reflection → show thinking dots → when response arrives → `streamReflection(text, themes)` → reveal char by char at 20ms
5. After streaming completes → wait 2s → either auto-advance (next question in module) or show module transition
6. At end of all modules → generate memo via API → render memo

The engine should import and use:
- `MODULES` from `./modules` (question data)
- `buildRoute, describeTypes` from `./routing` (classification → route)
- `createJourney, saveJourney, loadActiveJourney` from `./persistence`
- `trackEvent` from `./tracking`
- `initVoiceInput` from `../voice-input` (voice integration)
- `BreathingLine` from `./breathing-line` (canvas visualization)

**Important implementation details:**
- `escapeHtml()` must be used for ALL user-provided text in innerHTML
- The textarea must enable/disable the send button based on content
- Voice input wires the existing `initVoiceInput(mic, textarea)` function
- The breathing line rebuilds after each block is appended (calls `rebuildFromBlocks`)
- On resume, all prior blocks are rendered with `.dimmed` class, breathing line renders full state

- [ ] **Step 1: Write the new engine**

Write the complete `src/scripts/copilot/engine.ts` file implementing all the above. The file should be self-contained — all interaction flow, DOM manipulation, API calls, streaming simulation, voice integration, and breathing line integration in one file.

Key methods:
- `init()` — entry point
- `reconstructTimeline(journey)` — rebuild from saved data on resume
- `showIntake()` — first question
- `handleSubmit()` — process user input
- `classify(situation)` — call API, get classification
- `showNextQuestion()` — render next question in route
- `fetchAndStreamReflection(module, step, userText)` — call API + fake stream
- `showModuleTransition(completedModule, nextModule)` — between-module gate
- `generateAndShowMemo()` — final memo
- `appendBlock(html, className)` — utility to add block to timeline
- `scrollToBottom()` — smooth scroll to latest block
- `updateBreathingLine()` — rebuild canvas from current blocks
- `updateLayerDots(currentLayer)` — update header progress

- [ ] **Step 2: Verify build**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site/.worktrees/copilot-ux" && npx astro build 2>&1 | tail -5`
Expected: Build succeeds

- [ ] **Step 3: Commit**

```bash
git add src/scripts/copilot/engine.ts
git commit -m "feat(copilot): rewrite engine for flowing session with streaming + voice

Complete rewrite: timeline-based conversation flow, fake streaming
reflections, voice input integration, breathing line canvas,
auto-advance between questions, module transition gates.

Co-Authored-By: Claude Opus 4.6 (1M context) <noreply@anthropic.com>"
```

---

### Task 5: Integration Test + Visual Verification

**Files:** None (testing only)

- [ ] **Step 1: Start dev server in worktree**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site/.worktrees/copilot-ux" && npm run dev`

- [ ] **Step 2: Navigate to /copilot and verify intake**

Open `http://localhost:4321/copilot`. Expected:
- Header with layer dots (all inactive)
- First question "What's on your mind?" appears in serif
- Sticky input bar at bottom with mic button + textarea + send button
- Breathing line canvas visible on left edge (empty)
- Send button disabled until text entered

- [ ] **Step 3: Test voice input**

Tap the mic button. Expected:
- Button shows recording state (pulse animation, border changes to coral)
- Speech recognition activates (browser may prompt for permission)
- Spoken text appears in textarea
- Send button enables

- [ ] **Step 4: Submit intake and verify classification**

Enter test text and click send (or press Enter). Expected:
- User response block appears in timeline (warm-white background)
- Thinking dots appear in a reflection block
- After 2-4s, classification result streams in: "It sounds like what's making this hard is..."
- Layer dots update to first module's layer
- First module question fades in after 2s delay

- [ ] **Step 5: Test module flow with streaming**

Answer the first module question. Expected:
- Response block appears
- Thinking dots show while API processes
- AI reflection streams in character by character (~20ms per char)
- Theme tags fade in after streaming
- Breathing line extends and wobbles organically
- Next question auto-appears after 2s

- [ ] **Step 6: Test persistence (refresh)**

Refresh the page mid-session. Expected:
- "Welcome back" or timeline reconstructs
- All prior Q&A blocks visible (dimmed)
- Current question shows at bottom
- Breathing line renders full history
- Can continue from where they left off

- [ ] **Step 7: Test module transition**

Complete a module (answer all 2 questions). Expected:
- Transition block appears with checkmark and module name
- "continue →" and "save & come back later" buttons
- Tapping "continue" loads next module's first question
- Layer dots update

- [ ] **Step 8: Verify mobile layout**

Resize to mobile width (375px). Expected:
- Breathing line thinner (20px)
- Input bar functional
- Blocks readable
- No horizontal overflow

- [ ] **Step 9: Deploy**

```bash
# Merge worktree branch to main and push
cd "/Users/mayravillasboas/Claude/May Terapia/site"
git merge feature/copilot-ux
git push
```

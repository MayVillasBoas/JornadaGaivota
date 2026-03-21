# Copilot Framework Picker Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Give users visibility and control over which thinking frameworks the Copilot uses, plus a progress bar showing where they are in the journey.

**Architecture:** Modify the classification flow in engine.ts to show an inline framework picker before starting exercises. Update the API prompt to return per-framework reasoning. Add a sticky progress bar that updates as modules complete.

**Tech Stack:** TypeScript (Astro client scripts), Claude API (classification prompt), CSS (cards, progress bar)

**Spec:** `docs/superpowers/specs/2026-03-21-copilot-framework-picker-design.md`

---

### Task 1: Update Classification API Prompt

**Files:**
- Modify: `src/pages/api/copilot.ts` (lines 21-39, CLASSIFICATION_PROMPT)

- [ ] **Step 1: Update the classification prompt to return frameworkReasons**

In `src/pages/api/copilot.ts`, replace the `CLASSIFICATION_PROMPT` constant (lines 21-39) with:

```typescript
const CLASSIFICATION_PROMPT = `You are an expert decision-making therapist. The user has described a difficult life decision they're struggling with. Your job is to:
1. Classify the TYPE of confusion they're experiencing
2. Suggest which thinking frameworks would help most
3. Explain WHY each framework was chosen, using the user's own words

The confusion types are:
- "fear-based": blocked by imagined negative outcomes, hasn't committed to a preference yet
- "identity-split": two or more internal parts want different things (safety vs freedom, loyalty vs authenticity)
- "information-gap": genuinely lacks clarity about what the options are or what each implies
- "paralysis": has already identified a preferred option but cannot execute
- "values-conflict": two deeply held values collide and neither can be dismissed
- "external-pressure": the person's own preference is clear but overridden by others' expectations

The available frameworks are:
- "body-scan": Somatic awareness — what the body is signaling about each option (Damasio)
- "parts-mapping": Internal Family Systems — mapping the conflicting inner voices (Schwartz)
- "first-principles": Separating facts from assumptions (Munger)
- "regret-minimization": Projecting to age 80 to compare regrets (Bezos)

Return ONLY valid JSON (no markdown, no backticks):
{
  "types": ["type1", "type2"],
  "confidence": 0.0-1.0,
  "reasoning": "1-2 sentences explaining why you classified it this way",
  "suggestedRoute": ["framework-slug-1", "framework-slug-2", "framework-slug-3"],
  "frameworkReasons": {
    "framework-slug-1": "One sentence explaining why this framework fits, referencing the user's specific words",
    "framework-slug-2": "One sentence...",
    "framework-slug-3": "One sentence..."
  }
}

Be specific. Reference the user's actual words in frameworkReasons. Suggest 3-4 frameworks.
Respond in the same language the user writes in (all fields including frameworkReasons).`;
```

- [ ] **Step 2: Increase maxTokens for classify action**

In the `switch (body.action)` block, change the classify case maxTokens from 200 to 400:

```typescript
case 'classify': {
  systemPrompt = CLASSIFICATION_PROMPT;
  const intake = body.intakeAnswers?.length
    ? `\n\nAdditional context from intake questions:\n${body.intakeAnswers.join('\n')}`
    : '';
  userMessage = `Here is my situation:\n\n${body.situation}${intake}`;
  maxTokens = 400;
  break;
}
```

- [ ] **Step 3: Build and verify API compiles**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run build 2>&1 | tail -5`
Expected: "Complete!" with no errors

- [ ] **Step 4: Commit**

```bash
git add src/pages/api/copilot.ts
git commit -m "feat: update classification prompt to return frameworkReasons"
```

---

### Task 2: Export Available Frameworks from modules.ts

**Files:**
- Modify: `src/scripts/copilot/modules.ts` (line 121)

- [ ] **Step 1: Add PICKABLE_MODULES constant**

At the end of `src/scripts/copilot/modules.ts`, after the `MODULE_ORDER` export, add:

```typescript
// Frameworks available for user selection (excludes decision-memo which is always auto-appended)
export const PICKABLE_MODULES = MODULE_ORDER.filter(slug => slug !== 'decision-memo');
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/copilot/modules.ts
git commit -m "feat: export PICKABLE_MODULES for framework picker"
```

---

### Task 3: Add Framework Picker CSS

**Files:**
- Modify: `src/styles/copilot.css` (append at end, before mobile media query)

- [ ] **Step 1: Add framework picker styles**

Append these styles before the `@media (max-width: 640px)` block in `src/styles/copilot.css`:

```css
/* Framework Picker */
.framework-picker {
  animation: copilotFadeIn 0.5s ease;
}

.framework-picker-intro {
  font-family: var(--serif);
  font-size: 1.1rem;
  color: var(--ink-muted);
  margin-bottom: 1.25rem;
  font-style: italic;
}

.framework-card {
  display: flex;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  margin-bottom: 0.75rem;
  background: var(--warm-white);
  border: 1px solid var(--border);
  border-radius: 8px;
  cursor: pointer;
  transition: border-color 0.2s, background 0.2s;
  align-items: flex-start;
}

.framework-card:hover {
  border-color: var(--accent);
}

.framework-card.selected {
  border-color: var(--accent);
  background: var(--accent-light);
}

.framework-card-check {
  width: 20px;
  height: 20px;
  border-radius: 4px;
  border: 2px solid var(--border);
  flex-shrink: 0;
  margin-top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.2s;
}

.framework-card.selected .framework-card-check {
  border-color: var(--accent);
  background: var(--accent);
  color: var(--cream);
}

.framework-card-check::after {
  content: '';
}

.framework-card.selected .framework-card-check::after {
  content: '✓';
  font-size: 0.75rem;
  color: var(--cream);
  font-weight: 700;
}

.framework-card-content {
  flex: 1;
}

.framework-card-title {
  font-family: var(--sans);
  font-size: 0.95rem;
  font-weight: 600;
  color: var(--ink);
  margin-bottom: 0.2rem;
}

.framework-card-tagline {
  font-family: var(--serif);
  font-size: 0.9rem;
  color: var(--ink-muted);
  font-style: italic;
  margin-bottom: 0.3rem;
}

.framework-card-reason {
  font-family: var(--sans);
  font-size: 0.8rem;
  color: var(--accent);
  line-height: 1.4;
}

.framework-explore-toggle {
  font-family: var(--sans);
  font-size: 0.85rem;
  color: var(--ink-muted);
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem 0;
  transition: color 0.2s;
  display: block;
  margin: 0.5rem 0;
}

.framework-explore-toggle:hover {
  color: var(--ink);
}

.framework-explore-list {
  max-height: 0;
  overflow: hidden;
  transition: max-height 0.3s ease;
}

.framework-explore-list.open {
  max-height: 500px;
}

.framework-picker-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.25rem;
  align-items: center;
}

.framework-picker-hint {
  font-family: var(--sans);
  font-size: 0.8rem;
  color: var(--feel-color);
}

/* Progress Bar */
.copilot-progress {
  position: sticky;
  top: 60px;
  z-index: 50;
  background: var(--cream);
  border-bottom: 1px solid var(--border);
  padding: 0.75rem 1.5rem;
  display: flex;
  align-items: center;
  gap: 0.75rem;
  max-width: 640px;
  margin: 0 auto;
}

.progress-dots {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.progress-dot {
  width: 10px;
  height: 10px;
  border-radius: 50%;
  border: 2px solid var(--border);
  background: transparent;
  transition: all 0.3s;
}

.progress-dot.done {
  background: var(--accent);
  border-color: var(--accent);
}

.progress-dot.current {
  border-color: var(--accent);
  box-shadow: 0 0 0 3px rgba(43, 74, 62, 0.15);
}

.progress-connector {
  width: 16px;
  height: 2px;
  background: var(--border);
  transition: background 0.3s;
}

.progress-connector.done {
  background: var(--accent);
}

.progress-label {
  font-family: var(--sans);
  font-size: 0.8rem;
  color: var(--ink-muted);
  margin-left: auto;
  white-space: nowrap;
}
```

- [ ] **Step 2: Add mobile styles inside the existing media query**

Inside the `@media (max-width: 640px)` block, add:

```css
  .framework-card { padding: 0.75rem 1rem; }
  .copilot-progress { top: 50px; padding: 0.5rem 1rem; }
  .progress-label { font-size: 0.7rem; }
```

- [ ] **Step 3: Commit**

```bash
git add src/styles/copilot.css
git commit -m "feat: add framework picker and progress bar styles"
```

---

### Task 4: Implement Framework Picker in Engine

**Files:**
- Modify: `src/scripts/copilot/engine.ts`

This is the core task. Three changes to engine.ts:

- [ ] **Step 1: Add PICKABLE_MODULES import**

At the top of engine.ts, update the modules import (line 1-2 area):

```typescript
import { MODULES, MODULE_ORDER, PICKABLE_MODULES } from './modules';
```

- [ ] **Step 2: Add showFrameworkPicker() method**

After the `classify()` method (around line 230), add the new method:

```typescript
  private showFrameworkPicker(
    suggestedRoute: string[],
    frameworkReasons: Record<string, string>,
  ): void {
    this.state = 'picking-frameworks';

    const picker = document.createElement('div');
    picker.className = 'copilot-block framework-picker';

    const intro = document.createElement('p');
    intro.className = 'framework-picker-intro';
    intro.textContent = "Here's what I'd suggest:";
    picker.appendChild(intro);

    // Track selected frameworks
    const selected = new Set(suggestedRoute.filter(s => s !== 'decision-memo'));

    // Render a framework card
    const renderCard = (slug: string, container: HTMLElement) => {
      const mod = MODULES[slug];
      if (!mod || slug === 'decision-memo') return;

      const card = document.createElement('div');
      card.className = `framework-card${selected.has(slug) ? ' selected' : ''}`;
      card.dataset.slug = slug;

      const check = document.createElement('div');
      check.className = 'framework-card-check';

      const content = document.createElement('div');
      content.className = 'framework-card-content';

      const title = document.createElement('div');
      title.className = 'framework-card-title';
      title.textContent = mod.title;

      const tagline = document.createElement('div');
      tagline.className = 'framework-card-tagline';
      tagline.textContent = mod.description;

      content.appendChild(title);
      content.appendChild(tagline);

      const reason = frameworkReasons[slug];
      if (reason) {
        const reasonEl = document.createElement('div');
        reasonEl.className = 'framework-card-reason';
        reasonEl.textContent = reason;
        content.appendChild(reasonEl);
      }

      card.appendChild(check);
      card.appendChild(content);

      card.addEventListener('click', () => {
        if (selected.has(slug)) {
          selected.delete(slug);
          card.classList.remove('selected');
        } else {
          selected.add(slug);
          card.classList.add('selected');
        }
        updateStartButton();
      });

      container.appendChild(card);
    };

    // Suggested cards
    suggestedRoute.forEach(slug => renderCard(slug, picker));

    // Explore more toggle
    const otherSlugs = PICKABLE_MODULES.filter(s => !suggestedRoute.includes(s));
    if (otherSlugs.length > 0) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'framework-explore-toggle';
      toggleBtn.textContent = '▸ explore more frameworks';

      const exploreList = document.createElement('div');
      exploreList.className = 'framework-explore-list';

      otherSlugs.forEach(slug => renderCard(slug, exploreList));

      toggleBtn.addEventListener('click', () => {
        const isOpen = exploreList.classList.toggle('open');
        toggleBtn.textContent = isOpen ? '▾ hide' : '▸ explore more frameworks';
      });

      picker.appendChild(toggleBtn);
      picker.appendChild(exploreList);
    }

    // Actions
    const actions = document.createElement('div');
    actions.className = 'framework-picker-actions';

    const startBtn = document.createElement('button');
    startBtn.className = 'btn-primary';
    startBtn.textContent = 'start journey →';

    const hint = document.createElement('span');
    hint.className = 'framework-picker-hint';

    const updateStartButton = () => {
      if (selected.size < 2) {
        startBtn.disabled = true;
        hint.textContent = 'select at least 2 frameworks';
      } else {
        startBtn.disabled = false;
        hint.textContent = '';
      }
    };
    updateStartButton();

    startBtn.addEventListener('click', () => {
      // Build route from selection, maintaining MODULE_ORDER, append decision-memo
      const orderedRoute = PICKABLE_MODULES.filter(s => selected.has(s));
      orderedRoute.push('decision-memo');

      this.journey.route = orderedRoute;
      this.journey.status = 'active';
      this.journey.currentModuleIndex = 0;
      this.journey.currentStepIndex = 0;
      this.currentModuleIndex = 0;
      this.currentStepIndex = 0;
      saveJourney(this.journey);

      trackEvent('frameworks_confirmed', this.journey.id, {
        route: orderedRoute,
        suggested: suggestedRoute,
      });

      this.renderProgressBar();
      this.showNextQuestion();
    });

    actions.appendChild(startBtn);
    actions.appendChild(hint);
    picker.appendChild(actions);

    this.els.timeline.appendChild(picker);
    this.scrollToBottom();
  }
```

- [ ] **Step 3: Add renderProgressBar() and updateProgressBar() methods**

After `showFrameworkPicker()`, add:

```typescript
  private progressBarEl: HTMLElement | null = null;

  private renderProgressBar(): void {
    const route = this.journey.route.filter(s => s !== 'decision-memo');
    const bar = document.createElement('div');
    bar.className = 'copilot-progress';

    const dots = document.createElement('div');
    dots.className = 'progress-dots';

    route.forEach((slug, i) => {
      if (i > 0) {
        const connector = document.createElement('div');
        connector.className = 'progress-connector';
        connector.dataset.index = String(i - 1);
        dots.appendChild(connector);
      }
      const dot = document.createElement('div');
      dot.className = 'progress-dot';
      dot.dataset.index = String(i);
      dot.title = MODULES[slug]?.title || slug;
      dots.appendChild(dot);
    });

    const label = document.createElement('div');
    label.className = 'progress-label';

    bar.appendChild(dots);
    bar.appendChild(label);

    // Insert before the timeline
    this.els.timeline.parentElement?.insertBefore(bar, this.els.timeline);
    this.progressBarEl = bar;
    this.updateProgressBar();
  }

  private updateProgressBar(): void {
    if (!this.progressBarEl) return;
    const route = this.journey.route.filter(s => s !== 'decision-memo');
    const currentIdx = this.currentModuleIndex;

    // Update dots
    this.progressBarEl.querySelectorAll('.progress-dot').forEach((dot) => {
      const idx = parseInt((dot as HTMLElement).dataset.index || '0');
      dot.classList.toggle('done', idx < currentIdx);
      dot.classList.toggle('current', idx === currentIdx);
    });

    // Update connectors
    this.progressBarEl.querySelectorAll('.progress-connector').forEach((conn) => {
      const idx = parseInt((conn as HTMLElement).dataset.index || '0');
      conn.classList.toggle('done', idx < currentIdx);
    });

    // Update label
    const label = this.progressBarEl.querySelector('.progress-label');
    if (label) {
      if (currentIdx >= route.length) {
        label.textContent = '✓ All complete';
      } else {
        const mod = MODULES[route[currentIdx]];
        label.textContent = `Step ${currentIdx + 1} of ${route.length}: ${mod?.title || ''}`;
      }
    }
  }
```

- [ ] **Step 4: Modify classify() to call showFrameworkPicker()**

In the `classify()` method, replace the section after `this.removeBlock(thinkingBlock)` (around lines 204-212). Change from:

```typescript
      this.removeBlock(thinkingBlock);
      await this.streamReflection(
        `I hear you. It sounds like what's making this hard is ${description}. I'm going to guide you through a few exercises to untangle this: ${moduleNames}.`,
        [],
        'intake'
      );

      await delay(2000);
      this.showNextQuestion();
```

To:

```typescript
      this.removeBlock(thinkingBlock);

      const suggestedRoute = data.suggestedRoute || this.journey.route.filter((s: string) => s !== 'decision-memo');
      const frameworkReasons: Record<string, string> = data.frameworkReasons || {};

      await this.streamReflection(
        `I hear you. It sounds like what's making this hard is ${description}.`,
        [],
        'intake'
      );

      await delay(1500);
      this.showFrameworkPicker(suggestedRoute, frameworkReasons);
```

- [ ] **Step 5: Call updateProgressBar() in showNextQuestion() and completeModule()**

In `showNextQuestion()`, add `this.updateProgressBar();` as the first line of the method body.

In `completeModule()`, add `this.updateProgressBar();` after `saveJourney(this.journey);` (around line 354).

- [ ] **Step 6: Handle fallback in classify() catch block**

In the catch block of `classify()` (around line 213-228), change the flow similarly — show picker with default route and no reasons:

```typescript
    } catch {
      this.removeBlock(thinkingBlock);
      this.journey.classification = {
        types: ['fear-based'] as ConfusionType[],
        confidence: 0.5,
        reasoning: 'Classification failed.',
      };
      this.journey.route = buildRoute(this.journey.classification);
      this.journey.status = 'active';
      saveJourney(this.journey);

      await this.streamReflection(
        "Let me guide you through a few exercises to help you think through this.",
        [], 'intake'
      );
      await delay(1500);
      const fallbackRoute = this.journey.route.filter(s => s !== 'decision-memo');
      this.showFrameworkPicker(fallbackRoute, {});
    }
```

- [ ] **Step 7: Build and verify**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run build 2>&1 | tail -5`
Expected: "Complete!" with no errors

- [ ] **Step 8: Commit**

```bash
git add src/scripts/copilot/engine.ts
git commit -m "feat: add framework picker and progress bar to Copilot"
```

---

### Task 5: Integration Test and Deploy

- [ ] **Step 1: Build final**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run build 2>&1 | tail -5`

- [ ] **Step 2: Push to deploy**

```bash
git push
```

- [ ] **Step 3: Manual verification checklist**

After Vercel deploy completes:
1. Go to `/copilot`
2. Describe a situation (e.g., "I'm thinking about leaving my job but I'm scared")
3. Verify: framework cards appear with names, taglines, and personalized reasons
4. Verify: cards are checkable/uncheckable
5. Verify: "explore more frameworks" toggle works
6. Verify: "start journey" button disabled with <2 selections
7. Verify: progress bar appears after confirming
8. Verify: progress bar updates as you complete modules
9. Verify: Decision Memo generates normally at the end

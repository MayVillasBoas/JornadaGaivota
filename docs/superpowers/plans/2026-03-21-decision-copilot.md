# Decision Copilot Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a multi-session Decision Copilot that classifies a person's confusion type and routes them through the right sequence of decision-making frameworks (Body Scan, Parts Mapping, First Principles, Regret Minimization, Decision Memo) until they reach clarity.

**Architecture:** Single Astro page at `/copilot` handles the entire journey flow — intake → classification → module routing → guided steps → decision memo. Client-side state machine (`CopilotEngine`) manages navigation and persistence via localStorage (MVP). A new API endpoint `/api/copilot` handles AI classification and per-module guided reflections with tool-specific system prompts. The 5 MVP modules are defined as data configs, rendered dynamically by the engine.

**Tech Stack:** Astro 6 (SSR/Vercel), Claude Sonnet API, localStorage (persistence), existing CSS design tokens, existing GuidedTool patterns (adapted, not extended).

**Design Spec:** `~/.gstack/projects/may-terapia/mayravillasboas-main-design-20260321-decision-copilot.md`

### MVP Deviations from Spec

These are conscious trade-offs for the Wednesday deadline:

1. **localStorage instead of Supabase** — The spec defines Supabase tables with RLS policies. MVP uses localStorage for persistence. This means single-device only, no cross-device sync. Supabase migration (spec's SQL DDL) is a post-MVP task.
2. **No auth required** — The spec says "auth required" for saving. MVP makes `/copilot` public and saves anonymously to localStorage. A soft prompt to sign in can be added post-MVP.
3. **No intake deepening questions** — The spec says the Copilot asks 2-3 deepening questions before classification. MVP goes directly from situation text to classification. The `intakeAnswers` field exists in the data model for future use.
4. **Routes constrained to 5 MVP modules** — The spec's routing table references 17 modules. MVP routes only use the 5 available modules (body-scan, parts-mapping, first-principles, regret-minimization, decision-memo). Routes will expand as modules are built.

---

## File Structure

```
src/
  pages/
    copilot.astro              — Main copilot page (intake + modules + memo)
    api/copilot.ts             — API: classification + module reflections + memo generation
  scripts/
    copilot/
      engine.ts                — Client-side state machine
      modules.ts               — Module definitions (5 MVP modules: steps, questions, configs)
      routing.ts               — Classification types → module sequence mapping
      persistence.ts           — localStorage save/load for journeys
      tracking.ts              — Event tracking (console + localStorage for MVP)
  styles/
    copilot.css                — Copilot-specific styles
  components/
    Nav.astro                  — (modify) Add copilot link
  middleware.ts                — (modify) Add /copilot to public routes
```

---

### Task 1: Module Definitions

**Files:**
- Create: `src/scripts/copilot/modules.ts`

This file defines the 5 MVP modules as pure data. Each module has a slug, title, source attribution, layer, and an array of steps with questions and guidance text. No AI logic here — just the content.

- [ ] **Step 1: Create the modules data file**

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
    description: 'Your body knows before your mind does. Let\'s listen.',
    steps: [
      {
        question: 'Close your eyes for a moment. Take three deep breaths. Now — what does your body feel like right now? Where is there tension, tightness, or heaviness?',
        guidance: 'Don\'t analyze. Just notice. Shoulders, chest, stomach, jaw, hands.',
        placeholder: 'I notice tension in my...',
      },
      {
        question: 'Now imagine choosing Option A — the first path you\'re considering. Stay with that image for a moment. What happens in your body?',
        guidance: 'Does something tighten? Open? Does your breathing change? Does anything relax or constrict?',
        placeholder: 'When I imagine this option, my body...',
      },
      {
        question: 'Now imagine choosing Option B — the other path. Again, stay with it. What does your body do?',
        guidance: 'Compare honestly. Your body doesn\'t lie — it doesn\'t know how to.',
        placeholder: 'When I imagine this option, my body...',
      },
      {
        question: 'Looking at what your body told you — was there a difference between the two? Which option felt more like expansion? Which felt more like contraction?',
        guidance: 'Expansion (relief, opening, energy) often signals alignment. Contraction (tightness, heaviness, holding breath) often signals resistance or misalignment.',
        placeholder: 'The difference I noticed was...',
      },
    ],
  },

  'parts-mapping': {
    slug: 'parts-mapping',
    title: 'Parts Mapping',
    source: 'Internal Family Systems (Richard Schwartz)',
    layer: 'see',
    description: 'You\'re not confused — different parts of you want different things. Let\'s hear them all.',
    steps: [
      {
        question: 'Think about this decision. There\'s a voice inside you that wants one thing, and another that wants something different. Can you describe the first voice? What does it want? What does it say?',
        guidance: 'Give it a name if you can. "The part that wants safety" or "The ambitious one." What is its core concern?',
        placeholder: 'One part of me wants...',
      },
      {
        question: 'Now the other voice — the one pulling in a different direction. What does it want? What is it saying?',
        guidance: 'This part isn\'t wrong either. It\'s protecting something or longing for something. What?',
        placeholder: 'Another part of me wants...',
      },
      {
        question: 'What is each part afraid would happen if it didn\'t get its way? What\'s the fear underneath each one?',
        guidance: 'Parts usually protect us from something. Safety protects from failure. Ambition protects from regret. What\'s the fear driving each?',
        placeholder: 'The first part is afraid that... The second part is afraid that...',
      },
      {
        question: 'If you could step back from both parts and observe them with compassion — like a wise mediator — what do you notice? Is there a way to honor what both parts actually need?',
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
    description: 'Strip away assumptions. What\'s actually true here?',
    steps: [
      {
        question: 'Write down everything you believe about this situation — every assumption, every "I have to," every "I can\'t," every "they expect me to." All of it.',
        guidance: 'Don\'t filter. Include the dramatic ones, the practical ones, and the ones you\'re embarrassed about.',
        placeholder: 'I believe that...',
      },
      {
        question: 'Now go through each belief. Which ones are verifiable FACTS and which ones are assumptions, stories, or fears? Mark each one.',
        guidance: 'A fact: "My contract ends in June." An assumption: "They\'ll never hire me again." Be ruthless about the distinction.',
        placeholder: 'Facts: ...\nAssumptions: ...',
      },
      {
        question: 'Look at just the facts — the things that are actually, provably true. If you only had these facts and no assumptions, what would the decision look like?',
        guidance: 'This is the foundation. When you strip away the stories, what remains?',
        placeholder: 'With only the facts, the situation is...',
      },
      {
        question: 'What\'s one assumption you\'ve been treating as fact that, if challenged, would change everything about this decision?',
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
    description: 'Project yourself to 80. Look back. What would you regret?',
    steps: [
      {
        question: 'Imagine you\'re 80 years old, sitting in a quiet room, looking back at your life. You chose Option A. You lived with that choice for decades. What do you feel? Any regret?',
        guidance: 'Don\'t think about next month. Think about the arc of your life. What would 80-year-old you say?',
        placeholder: 'If I chose this path, at 80 I would feel...',
      },
      {
        question: 'Now you\'re 80, but you chose Option B instead. You lived with THAT choice for decades. What do you feel now? Any regret?',
        guidance: 'Be honest about both sides. Regret of action AND regret of inaction are both real.',
        placeholder: 'If I chose this path instead, at 80 I would feel...',
      },
      {
        question: 'Which regret feels heavier? The regret of doing it or the regret of not doing it?',
        guidance: 'Research shows people regret inaction more than action over long time horizons. But your situation is yours. What\'s true for YOU?',
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
        question: 'In one or two sentences, what is the actual decision you\'re facing? Not the backstory — the choice itself.',
        guidance: 'If you can\'t write it clearly, you\'re not ready to decide yet — and that\'s valuable information too.',
        placeholder: 'The decision I\'m facing is...',
      },
      {
        question: 'Based on everything you\'ve explored — what your body told you, what your internal parts want, what the facts actually are, what you\'d regret — what are your real options? (Not the ones others gave you. YOUR options.)',
        guidance: 'Include the option you\'re afraid to write down. It might be the real one.',
        placeholder: 'My real options are:\n1. \n2. \n3. ',
      },
      {
        question: 'For each option, what\'s the trade-off? What do you gain and what do you give up?',
        guidance: 'Every choice has a cost. Naming it honestly makes the decision lighter, not heavier.',
        placeholder: 'Option 1: I gain... but I give up...\nOption 2: I gain... but I give up...',
      },
      {
        question: 'Right now, in this moment — what does your gut say? If you had to choose in the next 10 seconds, what would you pick? Write it down before your mind starts arguing.',
        guidance: 'This isn\'t your final answer. It\'s a signal. Trust it enough to write it down.',
        placeholder: 'My gut says...',
      },
      {
        question: 'What is the smallest next step you can take in the next 24 hours that moves you toward clarity or action? Not the whole plan — just the first step.',
        guidance: 'A conversation. An email. A walk to think. One micro-action that breaks the paralysis.',
        placeholder: 'In the next 24 hours, I will...',
      },
    ],
  },
};

export const MODULE_ORDER = ['body-scan', 'parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'];
```

- [ ] **Step 2: Verify the file has no TypeScript errors**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npx tsc --noEmit src/scripts/copilot/modules.ts 2>&1 | head -20`
Expected: No errors (or only unrelated errors from other files)

- [ ] **Step 3: Commit**

```bash
git add src/scripts/copilot/modules.ts
git commit -m "feat(copilot): add 5 MVP module definitions"
```

---

### Task 2: Routing Logic

**Files:**
- Create: `src/scripts/copilot/routing.ts`

Maps classification types to module sequences. Pure functions, no side effects.

- [ ] **Step 1: Create the routing logic**

```typescript
// src/scripts/copilot/routing.ts

export type ConfusionType =
  | 'fear-based'
  | 'identity-split'
  | 'information-gap'
  | 'paralysis'
  | 'values-conflict'
  | 'external-pressure';

export interface Classification {
  types: ConfusionType[];
  confidence: number;
  reasoning: string;
}

// MVP: Routes are constrained to the 5 available modules.
// The spec defines routes using all 17 modules (Fear Setting, Inversion, 10/10/10, etc).
// These routes will be expanded as more modules are built post-MVP.
const SINGLE_TYPE_ROUTES: Record<ConfusionType, string[]> = {
  'fear-based':        ['body-scan', 'first-principles', 'regret-minimization', 'decision-memo'],
  'identity-split':    ['parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'],
  'information-gap':   ['first-principles', 'regret-minimization', 'decision-memo'],
  'paralysis':         ['body-scan', 'regret-minimization', 'decision-memo'],
  'values-conflict':   ['parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'],
  'external-pressure': ['parts-mapping', 'first-principles', 'regret-minimization', 'decision-memo'],
};

const DEFAULT_ROUTE = ['body-scan', 'first-principles', 'decision-memo'];

export function buildRoute(classification: Classification): string[] {
  const { types, confidence } = classification;

  // Low confidence or too many types → default route
  if (confidence < 0.6 || types.length === 0 || types.length > 2) {
    return DEFAULT_ROUTE;
  }

  if (types.length === 1) {
    return SINGLE_TYPE_ROUTES[types[0]] || DEFAULT_ROUTE;
  }

  // Dual-type: concatenate, deduplicate, cap at 4 + decision-memo
  const combined: string[] = [];
  for (const type of types) {
    for (const mod of (SINGLE_TYPE_ROUTES[type] || [])) {
      if (!combined.includes(mod) && mod !== 'decision-memo') {
        combined.push(mod);
      }
    }
  }
  // Cap at 4 modules before decision-memo
  const capped = combined.slice(0, 4);
  capped.push('decision-memo');
  return capped;
}

export function describeTypes(types: ConfusionType[]): string {
  const descriptions: Record<ConfusionType, string> = {
    'fear-based': 'fear of what could go wrong',
    'identity-split': 'different parts of you wanting different things',
    'information-gap': 'lack of clarity about your real options',
    'paralysis': 'knowing what you want but not being able to act',
    'values-conflict': 'two things you deeply value pulling in opposite directions',
    'external-pressure': 'other people\'s expectations overriding what you actually want',
  };
  return types.map(t => descriptions[t] || t).join(' and ');
}
```

- [ ] **Step 2: Verify no TypeScript errors**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npx astro check 2>&1 | tail -5`

- [ ] **Step 3: Commit**

```bash
git add src/scripts/copilot/routing.ts
git commit -m "feat(copilot): add classification → route mapping"
```

---

### Task 3: Persistence Layer

**Files:**
- Create: `src/scripts/copilot/persistence.ts`

localStorage-based journey persistence for MVP. Supabase persistence is deferred.

- [ ] **Step 1: Create persistence layer**

```typescript
// src/scripts/copilot/persistence.ts

import type { Classification } from './routing';

export interface JourneyData {
  id: string;
  situation: string;
  intakeAnswers: string[];
  classification: Classification | null;
  route: string[];
  currentModuleIndex: number;
  currentStepIndex: number;
  moduleResponses: Record<string, string[]>;   // moduleSlug → array of answers per step
  moduleInsights: Record<string, string[]>;     // moduleSlug → array of AI insights per step
  moduleSummaries: Record<string, string>;      // moduleSlug → summary text
  memo: MemoData | null;
  status: 'intake' | 'classifying' | 'active' | 'completed';
  createdAt: string;
  updatedAt: string;
}

export interface MemoData {
  situation: string;
  classification: string;
  bodyInsights: string;
  identityInsights: string;
  rationalInsights: string;
  options: string;
  tradeoffs: string;
  gutFeeling: string;
  nextStep: string;
  openQuestions: string;
  generatedAt: string;
}

const STORAGE_KEY = 'may-copilot-journeys';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
}

export function createJourney(): JourneyData {
  const now = new Date().toISOString();
  return {
    id: generateId(),
    situation: '',
    intakeAnswers: [],
    classification: null,
    route: [],
    currentModuleIndex: 0,
    currentStepIndex: 0,
    moduleResponses: {},
    moduleInsights: {},
    moduleSummaries: {},
    memo: null,
    status: 'intake',
    createdAt: now,
    updatedAt: now,
  };
}

export function saveJourney(journey: JourneyData): void {
  journey.updatedAt = new Date().toISOString();
  const all = loadAllJourneys();
  const idx = all.findIndex(j => j.id === journey.id);
  if (idx >= 0) {
    all[idx] = journey;
  } else {
    all.push(journey);
  }
  localStorage.setItem(STORAGE_KEY, JSON.stringify(all));
}

export function loadAllJourneys(): JourneyData[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

export function loadActiveJourney(): JourneyData | null {
  const all = loadAllJourneys();
  return all.find(j => j.status !== 'completed') || null;
}

export function loadJourney(id: string): JourneyData | null {
  const all = loadAllJourneys();
  return all.find(j => j.id === id) || null;
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/copilot/persistence.ts
git commit -m "feat(copilot): add localStorage persistence layer"
```

---

### Task 4: Event Tracking

**Files:**
- Create: `src/scripts/copilot/tracking.ts`

Simple event tracking — logs to console + localStorage for MVP. Easy to swap for Supabase/analytics later.

- [ ] **Step 1: Create tracking module**

```typescript
// src/scripts/copilot/tracking.ts

interface TrackingEvent {
  type: string;
  journeyId: string;
  metadata: Record<string, any>;
  timestamp: string;
}

const EVENTS_KEY = 'may-copilot-events';

export function trackEvent(
  type: string,
  journeyId: string,
  metadata: Record<string, any> = {}
): void {
  const event: TrackingEvent = {
    type,
    journeyId,
    metadata,
    timestamp: new Date().toISOString(),
  };

  // Console for dev visibility
  console.log(`[copilot] ${type}`, metadata);

  // Persist to localStorage
  try {
    const events: TrackingEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    events.push(event);
    // Keep last 500 events
    if (events.length > 500) events.splice(0, events.length - 500);
    localStorage.setItem(EVENTS_KEY, JSON.stringify(events));
  } catch { /* silent */ }
}

export function getEvents(journeyId?: string): TrackingEvent[] {
  try {
    const events: TrackingEvent[] = JSON.parse(localStorage.getItem(EVENTS_KEY) || '[]');
    if (journeyId) return events.filter(e => e.journeyId === journeyId);
    return events;
  } catch {
    return [];
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/copilot/tracking.ts
git commit -m "feat(copilot): add event tracking"
```

---

### Task 5: API Endpoint

**Files:**
- Create: `src/pages/api/copilot.ts`

New API endpoint that handles two actions: `classify` (intake → classification JSON) and `reflect` (module step → insight). Follows the same pattern as `/api/reflect.ts` but with copilot-specific prompts.

- [ ] **Step 1: Create the API endpoint**

```typescript
// src/pages/api/copilot.ts

export const prerender = false;

import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';

function loadEnvKey(): string {
  try {
    const fromMeta = (import.meta as any).env?.ANTHROPIC_API_KEY;
    if (fromMeta) return fromMeta;
    const fromProcess = process.env.ANTHROPIC_API_KEY;
    if (fromProcess) return fromProcess;
    const envPath = resolve(process.cwd(), '.env');
    const content = readFileSync(envPath, 'utf8');
    const match = content.match(/^ANTHROPIC_API_KEY=(.+)$/m);
    return match?.[1]?.trim() || '';
  } catch {
    return '';
  }
}

// ─── Classification Prompt ───

const CLASSIFICATION_PROMPT = `You are an expert decision-making therapist. The user has described a difficult life decision they're struggling with. Your job is to classify the TYPE of confusion they're experiencing.

The types are:
- "fear-based": blocked by imagined negative outcomes, hasn't committed to a preference yet
- "identity-split": two or more internal parts want different things (safety vs freedom, loyalty vs authenticity)
- "information-gap": genuinely lacks clarity about what the options are or what each implies
- "paralysis": has already identified a preferred option but cannot execute
- "values-conflict": two deeply held values collide and neither can be dismissed
- "external-pressure": the person's own preference is clear but overridden by others' expectations

Return ONLY valid JSON (no markdown, no backticks):
{
  "types": ["type1", "type2"],  // 1-2 types, most dominant first
  "confidence": 0.0-1.0,        // how confident you are in this classification
  "reasoning": "1-2 sentences explaining why you classified it this way"
}

Be specific. Don't default to "fear-based" for everything. Look for the real root.
Respond in the same language the user writes in (reasoning field).`;

// ─── Module Prompts ───

const MODULE_PROMPTS: Record<string, string> = {
  'body-scan': `You are a gentle somatic therapist guiding someone through a body scan for decision-making. Based on Damasio's Somatic Marker Hypothesis — the body often knows before the mind.

The user is scanning their body's response to different options in a difficult decision.

Return ONLY valid JSON (no markdown, no backticks):
- "insight": 1-2 sentences reflecting what their body is telling them. Name the somatic patterns you notice. Be warm, grounding. Never generic.
- "themes": 2-4 keywords from their text (body sensations, emotions)
- "summary": 1 sentence capturing the key body signal for this step

Respond in the same language the user writes in.`,

  'parts-mapping': `You are a compassionate IFS (Internal Family Systems) therapist. You help people see their inner parts — the different voices inside them that want different things.

The user is mapping the parts that are in conflict about a big decision.

Return ONLY valid JSON (no markdown, no backticks):
- "insight": 1-2 sentences that name the parts they've described, validate each one, and point to what they might have in common or where the real tension lives. Be warm. Never generic.
- "themes": 2-4 keywords (part names, fears, desires)
- "summary": 1 sentence capturing the key inner conflict for this step

Respond in the same language the user writes in.`,

  'first-principles': `You are a sharp, Socratic thinker in the tradition of Charlie Munger. You help people separate facts from assumptions.

The user is dismantling their beliefs about a decision to find the fundamental truths underneath.

Return ONLY valid JSON (no markdown, no backticks):
- "insight": 1-2 sentences that challenge an assumption they're holding, or name a fact they might be overlooking. Be direct but respectful. Never generic.
- "themes": 2-4 keywords (facts, assumptions, beliefs)
- "summary": 1 sentence capturing the key insight for this step

Respond in the same language the user writes in.`,

  'regret-minimization': `You are a wise elder helping someone use Jeff Bezos' Regret Minimization Framework. You help people project themselves to age 80 and look back.

The user is exploring which path they would regret more — action or inaction.

Return ONLY valid JSON (no markdown, no backticks):
- "insight": 1-2 sentences reflecting on what their future self revealed. Name the asymmetry between regret of action vs inaction if you see one. Be warm, honest. Never generic.
- "themes": 2-4 keywords (regret, values, fears)
- "summary": 1 sentence capturing the key regret signal for this step

Respond in the same language the user writes in.`,

  'decision-memo': `You are a structured thinking partner helping someone compile their Decision Memo — the final output of a guided decision-making journey.

The user has already explored their body's signals, inner parts, first principles, and regret patterns. Now they're synthesizing everything into a clear decision document.

Return ONLY valid JSON (no markdown, no backticks):
- "insight": 1-2 sentences that connect what they just wrote to what emerged in earlier modules. Point out patterns, contradictions, or clarity that's emerging. Be direct. Never generic.
- "themes": 2-4 keywords
- "summary": 1 sentence capturing the key synthesis for this step

Respond in the same language the user writes in.`,
};

// ─── Memo Generation Prompt ───

const MEMO_PROMPT = `You are a decision clarity synthesizer. The user has completed a multi-step guided decision-making journey. Your job is to compile everything they explored into a clear, structured Decision Memo.

You will receive their original situation and all their responses from multiple modules (body scan, parts mapping, first principles, regret minimization, and their own memo notes).

Return ONLY valid JSON (no markdown, no backticks):
{
  "situation": "1-2 sentence restatement of their core decision",
  "bodySignals": "What their body revealed — key somatic signals",
  "innerParts": "The parts in conflict and what each wants/fears",
  "factsVsAssumptions": "Key facts separated from assumptions",
  "regretAnalysis": "What their future self revealed about regret",
  "options": ["Option 1 description", "Option 2 description"],
  "tradeoffs": "Key trade-offs for each option",
  "emergingClarity": "The pattern or direction that emerged across all modules",
  "recommendedNextStep": "One concrete action for the next 24 hours",
  "openQuestions": "1-2 questions still worth sitting with"
}

Be specific to what they actually wrote. Never generic. Respond in the same language they wrote in.`;

// ─── Handler ───

interface CopilotRequest {
  action: 'classify' | 'reflect' | 'generate-memo';
  // For classify:
  situation?: string;
  intakeAnswers?: string[];
  // For reflect:
  module?: string;
  step?: number;
  userText?: string;
  journeyContext?: string;  // summarized prior module outputs
  // For generate-memo:
  allResponses?: Record<string, string[]>;
  originalSituation?: string;
}

export async function POST({ request }: { request: Request }): Promise<Response> {
  const apiKey = loadEnvKey();
  if (!apiKey) {
    return new Response(JSON.stringify({ error: 'No API key', fallback: true }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const body: CopilotRequest = await request.json();

  let systemPrompt: string;
  let userMessage: string;
  let maxTokens = 300;

  switch (body.action) {
    case 'classify': {
      systemPrompt = CLASSIFICATION_PROMPT;
      const intake = body.intakeAnswers?.length
        ? `\n\nAdditional context from intake questions:\n${body.intakeAnswers.join('\n')}`
        : '';
      userMessage = `Here is my situation:\n\n${body.situation}${intake}`;
      maxTokens = 200;
      break;
    }

    case 'reflect': {
      systemPrompt = MODULE_PROMPTS[body.module || ''] || MODULE_PROMPTS['decision-memo'];
      const context = body.journeyContext
        ? `\n\nContext from earlier in this journey:\n${body.journeyContext}`
        : '';
      userMessage = `Step ${(body.step || 0) + 1} response:\n\n${body.userText}${context}`;
      maxTokens = 250;
      break;
    }

    case 'generate-memo': {
      systemPrompt = MEMO_PROMPT;
      const sections = Object.entries(body.allResponses || {}).map(
        ([mod, answers]) => `## ${mod}\n${answers.map((a, i) => `Step ${i + 1}: ${a}`).join('\n')}`
      ).join('\n\n');
      userMessage = `Original situation: ${body.originalSituation}\n\n${sections}`;
      maxTokens = 600;
      break;
    }

    default:
      return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400 });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages: [{ role: 'user', content: userMessage }],
      }),
    });

    const data = await response.json();
    const text = data.content?.[0]?.text || '';

    // Parse JSON from response
    const jsonMatch = text.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      return new Response(jsonMatch[0], {
        headers: { 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ fallback: true, raw: text }), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (err) {
    return new Response(JSON.stringify({ fallback: true, error: String(err) }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
```

- [ ] **Step 2: Test the endpoint is loadable**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npx astro build 2>&1 | tail -5`
Expected: Build succeeds (or only warnings, no errors in copilot.ts)

- [ ] **Step 3: Commit**

```bash
git add src/pages/api/copilot.ts
git commit -m "feat(copilot): add API endpoint for classification + module reflections + memo generation"
```

---

### Task 6: Copilot Engine (Client-Side State Machine)

**Files:**
- Create: `src/scripts/copilot/engine.ts`

The core state machine that manages the entire copilot flow: intake → classification → routing → module navigation → memo generation. Handles AI calls, step transitions, and persistence.

- [ ] **Step 1: Create the engine**

```typescript
// src/scripts/copilot/engine.ts

import { MODULES } from './modules';
import type { ModuleDefinition } from './modules';
import { buildRoute, describeTypes } from './routing';
import type { Classification, ConfusionType } from './routing';
import { createJourney, saveJourney, loadActiveJourney } from './persistence';
import type { JourneyData } from './persistence';
import { trackEvent } from './tracking';

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

type Phase = 'intake' | 'classifying' | 'module' | 'memo' | 'complete';

export class CopilotEngine {
  private journey: JourneyData;
  private phase: Phase = 'intake';
  private container: HTMLElement;
  private isProcessing = false;

  constructor(container: HTMLElement) {
    this.container = container;

    // Check for active journey
    const active = loadActiveJourney();
    if (active) {
      this.journey = active;
      this.phase = active.status === 'intake' ? 'intake' :
                   active.status === 'completed' ? 'complete' : 'module';
    } else {
      this.journey = createJourney();
    }
  }

  init(): void {
    if (this.journey.status !== 'intake' && this.journey.classification) {
      this.showResumePrompt();
    } else {
      this.renderIntake();
    }
    trackEvent('session_started', this.journey.id);
  }

  // ─── INTAKE PHASE ───

  private renderIntake(): void {
    this.phase = 'intake';
    this.container.innerHTML = `
      <div class="copilot-intake">
        <div class="copilot-intro">
          <h2>What's on your mind?</h2>
          <p class="copilot-subtitle">Describe the decision you're struggling with. Be messy, be honest — this is just for you. The more real you are, the more useful this will be.</p>
        </div>
        <textarea id="copilot-situation" rows="8" placeholder="I've been going back and forth about...">${this.journey.situation}</textarea>
        <button class="btn-primary" id="copilot-submit">begin untangling →</button>
      </div>
    `;

    document.getElementById('copilot-submit')?.addEventListener('click', () => {
      const textarea = document.getElementById('copilot-situation') as HTMLTextAreaElement;
      const text = textarea?.value.trim();
      if (!text) return;
      this.journey.situation = text;
      this.journey.status = 'intake';
      saveJourney(this.journey);
      trackEvent('intake_completed', this.journey.id, { length: text.length });
      this.classify(text);
    });
  }

  // ─── CLASSIFICATION PHASE ───

  private async classify(situation: string): Promise<void> {
    this.phase = 'classifying';
    this.container.innerHTML = `
      <div class="copilot-loading">
        <p class="copilot-thinking">listening to what you said...</p>
        <div class="copilot-dots"><span></span><span></span><span></span></div>
      </div>
    `;

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'classify',
          situation,
          intakeAnswers: this.journey.intakeAnswers,
        }),
      });

      const data = await res.json();

      if (data.fallback || !data.types) {
        // Fallback classification
        this.journey.classification = {
          types: ['fear-based'] as ConfusionType[],
          confidence: 0.5,
          reasoning: 'Could not classify — using default path.',
        };
      } else {
        this.journey.classification = data as Classification;
      }

      this.journey.route = buildRoute(this.journey.classification);
      this.journey.status = 'active';
      this.journey.currentModuleIndex = 0;
      this.journey.currentStepIndex = 0;
      saveJourney(this.journey);

      trackEvent('classification_shown', this.journey.id, {
        types: this.journey.classification.types,
        confidence: this.journey.classification.confidence,
        route: this.journey.route,
      });

      this.showClassificationResult();
    } catch {
      // Fallback to default route
      this.journey.classification = {
        types: ['fear-based'] as ConfusionType[],
        confidence: 0.5,
        reasoning: 'Classification failed — using default path.',
      };
      this.journey.route = buildRoute(this.journey.classification);
      this.journey.status = 'active';
      saveJourney(this.journey);
      this.showClassificationResult();
    }
  }

  private showClassificationResult(): void {
    const types = this.journey.classification!.types;
    const description = describeTypes(types);
    const route = this.journey.route;
    const moduleNames = route.map(slug => MODULES[slug]?.title || slug).join(' → ');

    this.container.innerHTML = `
      <div class="copilot-classification">
        <p class="copilot-observation">I hear you. It sounds like what's making this hard is <strong>${description}</strong>.</p>
        <p class="copilot-plan">I'm going to guide you through a few exercises designed to untangle this: <strong>${moduleNames}</strong>.</p>
        <p class="copilot-reassurance">Each one takes about 5 minutes. You can pause and come back anytime — I'll remember where you left off.</p>
        <button class="btn-primary" id="copilot-start-modules">let's begin →</button>
      </div>
    `;

    document.getElementById('copilot-start-modules')?.addEventListener('click', () => {
      this.renderCurrentModule();
    });
  }

  // ─── RESUME ───

  private showResumePrompt(): void {
    const currentModule = this.getCurrentModule();
    const progress = this.journey.currentModuleIndex + 1;
    const total = this.journey.route.length;

    this.container.innerHTML = `
      <div class="copilot-resume">
        <h2>Welcome back</h2>
        <p>You were working on: <strong>${escapeHtml(this.journey.situation.slice(0, 100))}${this.journey.situation.length > 100 ? '...' : ''}</strong></p>
        <p>Progress: ${progress} of ${total} exercises. ${currentModule ? `Next up: <strong>${currentModule.title}</strong>` : 'Ready to finish.'}</p>
        <div class="copilot-resume-actions">
          <button class="btn-primary" id="copilot-continue">continue →</button>
          <button class="btn-secondary" id="copilot-restart">start fresh</button>
        </div>
      </div>
    `;

    document.getElementById('copilot-continue')?.addEventListener('click', () => {
      trackEvent('session_returned', this.journey.id);
      if (this.journey.currentModuleIndex >= this.journey.route.length) {
        this.generateMemo();
      } else {
        this.renderCurrentModule();
      }
    });

    document.getElementById('copilot-restart')?.addEventListener('click', () => {
      this.journey = createJourney();
      saveJourney(this.journey);
      this.renderIntake();
    });
  }

  // ─── MODULE RENDERING ───

  private getCurrentModule(): ModuleDefinition | null {
    const slug = this.journey.route[this.journey.currentModuleIndex];
    return slug ? MODULES[slug] || null : null;
  }

  private renderCurrentModule(): void {
    this.phase = 'module';
    const mod = this.getCurrentModule();
    if (!mod) {
      this.generateMemo();
      return;
    }

    trackEvent('module_started', this.journey.id, {
      module: mod.slug,
      moduleIndex: this.journey.currentModuleIndex,
    });

    // Initialize responses array for this module if needed
    if (!this.journey.moduleResponses[mod.slug]) {
      this.journey.moduleResponses[mod.slug] = [];
      this.journey.moduleInsights[mod.slug] = [];
    }

    this.renderModuleStep(mod);
  }

  private renderModuleStep(mod: ModuleDefinition): void {
    const stepIdx = this.journey.currentStepIndex;
    const step = mod.steps[stepIdx];
    if (!step) {
      this.completeModule(mod);
      return;
    }

    const progress = this.journey.currentModuleIndex + 1;
    const totalModules = this.journey.route.length;
    const layerLabels: Record<string, string> = {
      feel: 'FEEL', see: 'SEE', think: 'THINK', act: 'ACT'
    };

    const existingAnswer = this.journey.moduleResponses[mod.slug]?.[stepIdx] || '';
    const existingInsight = this.journey.moduleInsights[mod.slug]?.[stepIdx] || '';

    this.container.innerHTML = `
      <div class="copilot-module">
        <div class="copilot-module-header">
          <span class="copilot-layer">${layerLabels[mod.layer] || mod.layer}</span>
          <span class="copilot-module-title">${mod.title}</span>
          <span class="copilot-progress">${progress} of ${totalModules}</span>
        </div>
        <p class="copilot-source">${mod.source}</p>

        ${existingInsight ? `
          <div class="copilot-insight">
            <span class="copilot-insight-marker">✦ reflection</span>
            <p>${existingInsight}</p>
          </div>
        ` : ''}

        <div class="copilot-step">
          <h3>${step.question}</h3>
          <p class="copilot-guidance">${step.guidance}</p>
          <textarea id="copilot-answer" rows="5" placeholder="${step.placeholder}">${escapeHtml(existingAnswer)}</textarea>
          <div class="copilot-step-nav">
            ${stepIdx > 0 ? '<button class="btn-secondary" id="copilot-prev">← back</button>' : ''}
            <button class="btn-primary" id="copilot-next">${stepIdx === mod.steps.length - 1 ? 'finish exercise →' : 'next →'}</button>
          </div>
          <span class="copilot-step-count">${stepIdx + 1} of ${mod.steps.length}</span>
        </div>
      </div>
    `;

    document.getElementById('copilot-next')?.addEventListener('click', () => this.handleStepNext(mod));
    document.getElementById('copilot-prev')?.addEventListener('click', () => this.handleStepPrev(mod));
  }

  private async handleStepNext(mod: ModuleDefinition): Promise<void> {
    if (this.isProcessing) return;
    this.isProcessing = true;

    const textarea = document.getElementById('copilot-answer') as HTMLTextAreaElement;
    const answer = textarea?.value.trim() || '';
    const stepIdx = this.journey.currentStepIndex;

    // Save answer
    if (!this.journey.moduleResponses[mod.slug]) {
      this.journey.moduleResponses[mod.slug] = [];
    }
    this.journey.moduleResponses[mod.slug][stepIdx] = answer;

    // Get AI insight if there's text
    if (answer) {
      try {
        // Build context from prior modules
        const priorSummaries = Object.entries(this.journey.moduleSummaries)
          .map(([slug, summary]) => `${MODULES[slug]?.title || slug}: ${summary}`)
          .join('\n');

        const res = await fetch('/api/copilot', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            action: 'reflect',
            module: mod.slug,
            step: stepIdx,
            userText: answer,
            journeyContext: priorSummaries || undefined,
          }),
        });

        const data = await res.json();
        if (data.insight) {
          if (!this.journey.moduleInsights[mod.slug]) {
            this.journey.moduleInsights[mod.slug] = [];
          }
          this.journey.moduleInsights[mod.slug][stepIdx] = data.insight;

          // Store summary for context passing
          if (data.summary) {
            this.journey.moduleSummaries[mod.slug] =
              (this.journey.moduleSummaries[mod.slug] || '') +
              ` Step ${stepIdx + 1}: ${data.summary}`;
          }
        }
      } catch { /* silent — insight is nice-to-have */ }
    }

    // Advance step
    this.journey.currentStepIndex = stepIdx + 1;
    saveJourney(this.journey);

    this.isProcessing = false;
    this.renderModuleStep(mod);
  }

  private handleStepPrev(mod: ModuleDefinition): void {
    if (this.journey.currentStepIndex > 0) {
      this.journey.currentStepIndex--;
      saveJourney(this.journey);
      this.renderModuleStep(mod);
    }
  }

  private completeModule(mod: ModuleDefinition): void {
    trackEvent('module_completed', this.journey.id, {
      module: mod.slug,
      moduleIndex: this.journey.currentModuleIndex,
    });

    this.journey.currentModuleIndex++;
    this.journey.currentStepIndex = 0;
    saveJourney(this.journey);

    // Check if there are more modules
    if (this.journey.currentModuleIndex >= this.journey.route.length) {
      this.generateMemo();
    } else {
      // Show transition between modules
      const nextMod = this.getCurrentModule();
      this.container.innerHTML = `
        <div class="copilot-transition">
          <p class="copilot-checkmark">✓</p>
          <h3>${mod.title} — done</h3>
          <p>You've explored ${this.journey.currentModuleIndex} of ${this.journey.route.length} exercises.</p>
          ${nextMod ? `
            <p>Next: <strong>${nextMod.title}</strong> — ${nextMod.description}</p>
            <div class="copilot-transition-actions">
              <button class="btn-primary" id="copilot-next-module">continue →</button>
              <button class="btn-secondary" id="copilot-pause">save & come back later</button>
            </div>
          ` : ''}
        </div>
      `;

      document.getElementById('copilot-next-module')?.addEventListener('click', () => {
        this.renderCurrentModule();
      });

      document.getElementById('copilot-pause')?.addEventListener('click', () => {
        saveJourney(this.journey);
        this.container.innerHTML = `
          <div class="copilot-paused">
            <h3>Saved</h3>
            <p>Come back anytime. I'll remember where you left off.</p>
            <a href="/" class="btn-secondary">go home</a>
          </div>
        `;
      });
    }
  }

  // ─── MEMO GENERATION ───

  private async generateMemo(): Promise<void> {
    this.phase = 'memo';
    this.container.innerHTML = `
      <div class="copilot-loading">
        <p class="copilot-thinking">compiling everything you've explored...</p>
        <div class="copilot-dots"><span></span><span></span><span></span></div>
      </div>
    `;

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-memo',
          allResponses: this.journey.moduleResponses,
          originalSituation: this.journey.situation,
        }),
      });

      const memoData = await res.json();

      this.journey.memo = {
        situation: memoData.situation || this.journey.situation,
        classification: describeTypes(this.journey.classification?.types || []),
        bodyInsights: memoData.bodySignals || '',
        identityInsights: memoData.innerParts || '',
        rationalInsights: memoData.factsVsAssumptions || '',
        options: Array.isArray(memoData.options) ? memoData.options.join('\n') : (memoData.options || ''),
        tradeoffs: memoData.tradeoffs || '',
        gutFeeling: memoData.emergingClarity || '',
        nextStep: memoData.recommendedNextStep || '',
        openQuestions: memoData.openQuestions || '',
        generatedAt: new Date().toISOString(),
      };

      this.journey.status = 'completed';
      saveJourney(this.journey);

      trackEvent('memo_generated', this.journey.id);
      this.renderMemo();
    } catch {
      // Fallback: render memo from raw responses
      this.renderFallbackMemo();
    }
  }

  private renderMemo(): void {
    this.phase = 'complete';
    const m = this.journey.memo!;

    this.container.innerHTML = `
      <div class="copilot-memo">
        <h2>Your Decision Memo</h2>
        <p class="copilot-memo-date">${new Date(m.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>

        <div class="memo-section">
          <h3>The Decision</h3>
          <p>${escapeHtml(m.situation)}</p>
        </div>

        <div class="memo-section">
          <h3>What was making it hard</h3>
          <p>${escapeHtml(m.classification)}</p>
        </div>

        ${m.bodyInsights ? `
          <div class="memo-section">
            <h3>What your body said</h3>
            <p>${escapeHtml(m.bodyInsights)}</p>
          </div>
        ` : ''}

        ${m.identityInsights ? `
          <div class="memo-section">
            <h3>The inner conflict</h3>
            <p>${escapeHtml(m.identityInsights)}</p>
          </div>
        ` : ''}

        ${m.rationalInsights ? `
          <div class="memo-section">
            <h3>Facts vs assumptions</h3>
            <p>${escapeHtml(m.rationalInsights)}</p>
          </div>
        ` : ''}

        ${m.options ? `
          <div class="memo-section">
            <h3>Your real options</h3>
            <p>${escapeHtml(m.options)}</p>
          </div>
        ` : ''}

        ${m.tradeoffs ? `
          <div class="memo-section">
            <h3>Trade-offs</h3>
            <p>${escapeHtml(m.tradeoffs)}</p>
          </div>
        ` : ''}

        ${m.gutFeeling ? `
          <div class="memo-section">
            <h3>The emerging clarity</h3>
            <p>${escapeHtml(m.gutFeeling)}</p>
          </div>
        ` : ''}

        ${m.nextStep ? `
          <div class="memo-section memo-next-step">
            <h3>Your next step</h3>
            <p>${escapeHtml(m.nextStep)}</p>
          </div>
        ` : ''}

        ${m.openQuestions ? `
          <div class="memo-section">
            <h3>Questions worth sitting with</h3>
            <p>${escapeHtml(m.openQuestions)}</p>
          </div>
        ` : ''}

        <div class="copilot-memo-actions">
          <button class="btn-secondary" id="copilot-copy">copy memo</button>
          <button class="btn-secondary" id="copilot-download">download</button>
          <button class="btn-secondary" id="copilot-new">new decision</button>
        </div>
      </div>
    `;

    document.getElementById('copilot-copy')?.addEventListener('click', () => {
      const text = this.memoToText();
      navigator.clipboard.writeText(text);
      trackEvent('memo_exported', this.journey.id, { method: 'copy' });
      const btn = document.getElementById('copilot-copy')!;
      btn.textContent = 'copied ✓';
      setTimeout(() => btn.textContent = 'copy memo', 2000);
    });

    document.getElementById('copilot-download')?.addEventListener('click', () => {
      const text = this.memoToText();
      const blob = new Blob([text], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decision-memo-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      trackEvent('memo_exported', this.journey.id, { method: 'download' });
    });

    document.getElementById('copilot-new')?.addEventListener('click', () => {
      this.journey = createJourney();
      saveJourney(this.journey);
      this.renderIntake();
    });
  }

  private renderFallbackMemo(): void {
    // Use raw responses when AI memo generation fails
    const responses = this.journey.moduleResponses;
    const sections = Object.entries(responses).map(([slug, answers]) => {
      const mod = MODULES[slug];
      return `<div class="memo-section">
        <h3>${mod?.title || slug}</h3>
        ${answers.map((a, i) => `<p><em>${mod?.steps[i]?.question || `Step ${i+1}`}</em></p><p>${a}</p>`).join('')}
      </div>`;
    }).join('');

    this.journey.status = 'completed';
    this.journey.memo = {
      situation: this.journey.situation,
      classification: describeTypes(this.journey.classification?.types || []),
      bodyInsights: '', identityInsights: '', rationalInsights: '',
      options: '', tradeoffs: '', gutFeeling: '', nextStep: '', openQuestions: '',
      generatedAt: new Date().toISOString(),
    };
    saveJourney(this.journey);

    this.container.innerHTML = `
      <div class="copilot-memo">
        <h2>Your Decision Memo</h2>
        <div class="memo-section">
          <h3>The Decision</h3>
          <p>${this.journey.situation}</p>
        </div>
        ${sections}
        <div class="copilot-memo-actions">
          <button class="btn-secondary" id="copilot-copy">copy memo</button>
          <button class="btn-secondary" id="copilot-new">new decision</button>
        </div>
      </div>
    `;

    document.getElementById('copilot-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.container.innerText);
    });
    document.getElementById('copilot-new')?.addEventListener('click', () => {
      this.journey = createJourney();
      saveJourney(this.journey);
      this.renderIntake();
    });
  }

  private memoToText(): string {
    const m = this.journey.memo!;
    return [
      `DECISION MEMO — ${new Date(m.generatedAt).toLocaleDateString()}`,
      '',
      `THE DECISION: ${m.situation}`,
      `WHAT MADE IT HARD: ${m.classification}`,
      m.bodyInsights ? `BODY SIGNALS: ${m.bodyInsights}` : '',
      m.identityInsights ? `INNER CONFLICT: ${m.identityInsights}` : '',
      m.rationalInsights ? `FACTS VS ASSUMPTIONS: ${m.rationalInsights}` : '',
      m.options ? `OPTIONS: ${m.options}` : '',
      m.tradeoffs ? `TRADE-OFFS: ${m.tradeoffs}` : '',
      m.gutFeeling ? `EMERGING CLARITY: ${m.gutFeeling}` : '',
      m.nextStep ? `NEXT STEP: ${m.nextStep}` : '',
      '',
      '— Generated by May Decision Copilot',
    ].filter(Boolean).join('\n\n');
  }
}
```

- [ ] **Step 2: Commit**

```bash
git add src/scripts/copilot/engine.ts
git commit -m "feat(copilot): add CopilotEngine state machine"
```

---

### Task 7: Copilot Page + Styles

**Files:**
- Create: `src/pages/copilot.astro`
- Create: `src/styles/copilot.css`

The main page that renders the copilot. Simple shell that loads the engine.

- [ ] **Step 1: Create copilot styles**

```css
/* src/styles/copilot.css */

.copilot-container {
  max-width: 640px;
  margin: 0 auto;
  padding: 3rem 1.5rem 4rem;
  min-height: calc(100vh - 60px);
}

/* Intake */
.copilot-intake {
  animation: fadeIn 0.5s ease;
}

.copilot-intro h2 {
  font-family: var(--serif);
  font-size: 2rem;
  color: var(--ink);
  margin-bottom: 0.5rem;
}

.copilot-subtitle {
  color: var(--ink-muted);
  font-size: 0.95rem;
  line-height: 1.6;
  margin-bottom: 2rem;
}

#copilot-situation {
  width: 100%;
  padding: 1rem;
  font-family: var(--sans);
  font-size: 0.95rem;
  line-height: 1.6;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--warm-white);
  color: var(--ink);
  resize: vertical;
  min-height: 160px;
  margin-bottom: 1.5rem;
  transition: border-color 0.2s;
}

#copilot-situation:focus {
  outline: none;
  border-color: var(--accent);
}

/* Loading / Thinking */
.copilot-loading {
  text-align: center;
  padding: 4rem 0;
  animation: fadeIn 0.3s ease;
}

.copilot-thinking {
  font-family: var(--serif);
  font-style: italic;
  color: var(--ink-muted);
  font-size: 1.1rem;
  margin-bottom: 1.5rem;
}

.copilot-dots {
  display: flex;
  gap: 6px;
  justify-content: center;
}

.copilot-dots span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--ink-muted);
  animation: dotPulse 1.4s ease-in-out infinite;
}

.copilot-dots span:nth-child(2) { animation-delay: 0.2s; }
.copilot-dots span:nth-child(3) { animation-delay: 0.4s; }

@keyframes dotPulse {
  0%, 80%, 100% { opacity: 0.3; transform: scale(0.8); }
  40% { opacity: 1; transform: scale(1); }
}

/* Classification result */
.copilot-classification {
  animation: fadeIn 0.5s ease;
  padding: 2rem 0;
}

.copilot-observation {
  font-family: var(--serif);
  font-size: 1.2rem;
  line-height: 1.6;
  color: var(--ink);
  margin-bottom: 1.5rem;
}

.copilot-plan {
  color: var(--ink-light);
  line-height: 1.6;
  margin-bottom: 1rem;
}

.copilot-reassurance {
  color: var(--ink-muted);
  font-size: 0.9rem;
  margin-bottom: 2rem;
}

/* Module */
.copilot-module {
  animation: fadeIn 0.4s ease;
}

.copilot-module-header {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.25rem;
}

.copilot-layer {
  font-family: var(--sans);
  font-size: 0.7rem;
  font-weight: 600;
  letter-spacing: 0.1em;
  text-transform: uppercase;
  color: var(--accent);
  background: var(--accent-light);
  padding: 2px 8px;
  border-radius: 3px;
}

.copilot-module-title {
  font-family: var(--serif);
  font-size: 1.1rem;
  color: var(--ink);
}

.copilot-progress {
  margin-left: auto;
  font-size: 0.8rem;
  color: var(--ink-muted);
}

.copilot-source {
  font-size: 0.8rem;
  color: var(--ink-muted);
  font-style: italic;
  margin-bottom: 2rem;
}

/* Insight */
.copilot-insight {
  background: var(--accent-light);
  border-left: 3px solid var(--accent);
  padding: 1rem 1.25rem;
  border-radius: 0 6px 6px 0;
  margin-bottom: 1.5rem;
}

.copilot-insight-marker {
  font-size: 0.75rem;
  color: var(--accent);
  font-weight: 600;
  letter-spacing: 0.05em;
  display: block;
  margin-bottom: 0.3rem;
}

.copilot-insight p {
  font-family: var(--serif);
  font-size: 0.95rem;
  line-height: 1.5;
  color: var(--ink-light);
  margin: 0;
}

/* Step */
.copilot-step h3 {
  font-family: var(--serif);
  font-size: 1.15rem;
  color: var(--ink);
  line-height: 1.5;
  margin-bottom: 0.5rem;
}

.copilot-guidance {
  font-size: 0.85rem;
  color: var(--ink-muted);
  font-style: italic;
  margin-bottom: 1rem;
  line-height: 1.5;
}

#copilot-answer {
  width: 100%;
  padding: 1rem;
  font-family: var(--sans);
  font-size: 0.95rem;
  line-height: 1.6;
  border: 1px solid var(--border);
  border-radius: 6px;
  background: var(--warm-white);
  color: var(--ink);
  resize: vertical;
  min-height: 120px;
  margin-bottom: 1.5rem;
  transition: border-color 0.2s;
}

#copilot-answer:focus {
  outline: none;
  border-color: var(--accent);
}

.copilot-step-nav {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.5rem;
}

.copilot-step-count {
  font-size: 0.75rem;
  color: var(--ink-muted);
}

/* Transition between modules */
.copilot-transition {
  text-align: center;
  padding: 3rem 0;
  animation: fadeIn 0.5s ease;
}

.copilot-checkmark {
  font-size: 2rem;
  color: var(--accent);
  margin-bottom: 0.5rem;
}

.copilot-transition h3 {
  font-family: var(--serif);
  font-size: 1.3rem;
  color: var(--ink);
  margin-bottom: 1rem;
}

.copilot-transition-actions {
  display: flex;
  gap: 1rem;
  justify-content: center;
  margin-top: 2rem;
}

/* Resume */
.copilot-resume {
  padding: 2rem 0;
  animation: fadeIn 0.5s ease;
}

.copilot-resume h2 {
  font-family: var(--serif);
  font-size: 1.5rem;
  margin-bottom: 1rem;
}

.copilot-resume-actions {
  display: flex;
  gap: 1rem;
  margin-top: 2rem;
}

/* Memo */
.copilot-memo {
  animation: fadeIn 0.5s ease;
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

/* Buttons (reuse site patterns) */
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

/* Paused */
.copilot-paused {
  text-align: center;
  padding: 4rem 0;
  animation: fadeIn 0.5s ease;
}

.copilot-paused h3 {
  font-family: var(--serif);
  font-size: 1.3rem;
  margin-bottom: 1rem;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
}

/* Mobile */
@media (max-width: 640px) {
  .copilot-container { padding: 2rem 1rem 3rem; }
  .copilot-intro h2 { font-size: 1.6rem; }
  .copilot-step-nav { flex-direction: column; }
  .copilot-memo-actions { flex-wrap: wrap; }
}
```

- [ ] **Step 2: Create the Astro page**

```astro
---
// src/pages/copilot.astro
import Base from '../layouts/Base.astro';
import '../styles/copilot.css';
---

<Base title="Decision Copilot — May">
  <div class="copilot-container" id="copilot-root">
    <!-- Engine renders here -->
  </div>
</Base>

<script>
  import { CopilotEngine } from '../scripts/copilot/engine';

  if (!(window as any).__copilotInit) {
    (window as any).__copilotInit = true;

    const container = document.getElementById('copilot-root');
    if (container) {
      const engine = new CopilotEngine(container);
      engine.init();
    }
  }
</script>
```

- [ ] **Step 3: Commit**

```bash
git add src/pages/copilot.astro src/styles/copilot.css
git commit -m "feat(copilot): add copilot page and styles"
```

---

### Task 8: Navigation + Middleware

**Files:**
- Modify: `src/components/Nav.astro`
- Modify: `src/middleware.ts`

Add the copilot link to navigation and make the route public.

- [ ] **Step 1: Add copilot to Nav.astro**

In `src/components/Nav.astro`, find the `links` array:

```typescript
// Current:
const links = [
  { href: '/unfold', label: 'unfold' },
  { href: '/escrita', label: 'escrita' },
  { href: '/lab', label: 'lab' },
  { href: '/agora', label: 'now' },
  { href: '/sobre', label: 'about' },
];

// Change to:
const links = [
  { href: '/unfold', label: 'unfold' },
  { href: '/copilot', label: 'copilot' },
  { href: '/escrita', label: 'escrita' },
  { href: '/lab', label: 'lab' },
  { href: '/agora', label: 'now' },
  { href: '/sobre', label: 'about' },
];
```

- [ ] **Step 2: Add /copilot to public routes in middleware.ts**

In `src/middleware.ts`, find the public routes array (which includes `'/', '/login', '/api/auth', '/api/reflect'`, etc.) and add `'/copilot'` and `'/api/copilot'` to it.

- [ ] **Step 3: Verify the site builds**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npx astro build 2>&1 | tail -10`
Expected: Build succeeds

- [ ] **Step 4: Commit**

```bash
git add src/components/Nav.astro src/middleware.ts
git commit -m "feat(copilot): add copilot to nav + public routes"
```

---

### Task 9: Integration Test — End-to-End Flow

**Files:** None (testing only)

Verify the entire flow works: intake → classification → modules → memo.

- [ ] **Step 1: Start dev server**

Run: `cd "/Users/mayravillasboas/Claude/May Terapia/site" && npm run dev`

- [ ] **Step 2: Test the intake flow**

Navigate to `http://localhost:4321/copilot`. Enter a test scenario: "I've been at my job for 5 years and I'm thinking about leaving to start my own company, but I have a mortgage and two kids."

Expected:
1. Text area renders with prompt
2. "begin untangling →" button works
3. Loading state shows "listening to what you said..."
4. Classification result appears with confusion types and module plan

- [ ] **Step 3: Test module flow**

Click "let's begin →" and work through the first module (Body Scan). Enter text in each step.

Expected:
1. Module header shows layer (FEEL), title, progress (1 of N)
2. AI insight appears after each step
3. Navigation (next/back) works
4. Transition screen appears between modules

- [ ] **Step 4: Test persistence**

Refresh the page mid-journey.

Expected:
1. Resume prompt appears showing current progress
2. "continue →" resumes at the correct module and step
3. Previous answers are preserved

- [ ] **Step 5: Test memo generation**

Complete all modules.

Expected:
1. Loading state shows "compiling everything you've explored..."
2. Decision Memo renders with all sections populated
3. Copy and download buttons work

- [ ] **Step 6: Check tracking events**

Open browser console and check for `[copilot]` log entries:
- `session_started`
- `intake_completed`
- `classification_shown`
- `module_started` (for each module)
- `module_completed` (for each module)
- `memo_generated`

- [ ] **Step 7: Deploy**

Run: `git push` (triggers Vercel deploy)

- [ ] **Step 8: Verify production**

Visit the deployed site at the Vercel URL and confirm the copilot page loads and the intake flow works.

- [ ] **Step 9: Commit any fixes**

If any fixes were needed during testing, commit them.

```bash
git add -A
git commit -m "fix(copilot): integration test fixes"
```

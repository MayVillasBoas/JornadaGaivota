// src/scripts/copilot2/immersive-engine.ts - Immersive Meditation Copilot Engine
// Reuses modules, routing, persistence, tracking from copilot v1
// New UX: voice-guided, sentence-by-sentence reveal, breathing rituals

import { MODULES_EN as MODULES, PICKABLE_MODULES_EN as PICKABLE_MODULES } from './modules-en';
import { buildRoute } from '../copilot/routing';
import type { Classification, ConfusionType } from '../copilot/routing';
import { describeTypesEN as describeTypes } from './routing-en';
import type { JourneyData } from '../copilot/persistence';

// Copilot 2.0 uses its own localStorage key to avoid conflicts with v1
const STORAGE_KEY_V2 = 'may-copilot2-journeys';

function createJourney(): JourneyData {
  const now = new Date().toISOString();
  return {
    id: Date.now().toString(36) + Math.random().toString(36).slice(2, 7),
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

function saveJourney(journey: JourneyData): void {
  journey.updatedAt = new Date().toISOString();
  try {
    const all: JourneyData[] = JSON.parse(localStorage.getItem(STORAGE_KEY_V2) || '[]');
    const idx = all.findIndex(j => j.id === journey.id);
    if (idx >= 0) all[idx] = journey; else all.push(journey);
    localStorage.setItem(STORAGE_KEY_V2, JSON.stringify(all));
  } catch {}
}

function loadActiveJourney(): JourneyData | null {
  try {
    const all: JourneyData[] = JSON.parse(localStorage.getItem(STORAGE_KEY_V2) || '[]');
    return all.find(j => j.status !== 'completed') || null;
  } catch { return null; }
}
import { trackEvent } from '../copilot/tracking';
import { TTSService } from './tts';
import { AmbientLayer } from './ambient';
import { BreathingCircle } from './breathing';
import { initVoiceInput } from '../voice-input';

// ─── Utilities ───

function escapeHtml(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

function delay(ms: number): Promise<void> {
  return new Promise(r => setTimeout(r, ms));
}

// ─── Types ───

interface ImmersiveElements {
  breathingCanvas: HTMLCanvasElement;
  textDisplay: HTMLElement;
  inputArea: HTMLElement;
  textarea: HTMLTextAreaElement;
  sendBtn: HTMLButtonElement;
  mic: HTMLButtonElement;
  phaseLabel: HTMLElement;
  container: HTMLElement;
  voiceToggle: HTMLButtonElement;
}

type ImmersiveState =
  | 'idle'
  | 'opening'
  | 'intake'
  | 'classifying'
  | 'guiding'
  | 'awaiting-input'
  | 'processing'
  | 'transitioning'
  | 'picking-frameworks'
  | 'generating-memo'
  | 'closing'
  | 'complete';

// ─── Engine ───

export class ImmersiveCopilotEngine {
  private els: ImmersiveElements;
  private tts: TTSService;
  private ambient: AmbientLayer;
  private breathing: BreathingCircle;
  private journey: JourneyData;
  private state: ImmersiveState = 'idle';
  private currentModuleIndex = 0;
  private currentStepIndex = 0;
  private voiceEnabled = true;

  constructor(els: ImmersiveElements) {
    this.els = els;
    this.tts = new TTSService();
    this.ambient = new AmbientLayer();
    this.breathing = new BreathingCircle(els.breathingCanvas);

    const active = loadActiveJourney();
    if (active && active.status !== 'completed') {
      this.journey = active;
      this.currentModuleIndex = active.currentModuleIndex;
      this.currentStepIndex = active.currentStepIndex;
    } else {
      this.journey = createJourney();
    }

    this.wireInput();
  }

  async init(): Promise<void> {
    trackEvent('session_started', this.journey.id);

    // Check for resumed journey
    if (this.journey.status === 'active' && this.journey.classification) {
      // Resume mid-journey
      await this.resumeJourney();
    } else {
      await this.openingCeremony();
    }
  }

  // ─── Input Wiring ───

  private wireInput(): void {
    const { mic, textarea, sendBtn } = this.els;

    const langToggle = document.getElementById('voice-lang') as HTMLButtonElement | null;
    initVoiceInput(mic, textarea, langToggle);

    textarea.addEventListener('input', () => {
      sendBtn.disabled = !textarea.value.trim();
    });

    sendBtn.addEventListener('click', () => this.handleSubmit());

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (textarea.value.trim()) this.handleSubmit();
      }
    });

    // Voice toggle
    this.els.voiceToggle.addEventListener('click', () => {
      this.voiceEnabled = !this.voiceEnabled;
      this.els.voiceToggle.classList.toggle('off', !this.voiceEnabled);
      this.els.voiceToggle.textContent = this.voiceEnabled ? 'voice on' : 'voice off';
      if (!this.voiceEnabled) this.tts.stop();
    });
  }

  // ─── Opening Ceremony ───

  private async openingCeremony(): Promise<void> {
    this.state = 'opening';
    this.hideInput();

    // Start ambient softly
    this.ambient.start();

    // Simple, direct opening
    const intro = 'Describe the decision you\'re struggling with. It can be messy - just get it out.';
    await this.speakAndReveal(intro);
    await delay(800);

    const explain = 'Once you do, I\'ll guide you through a series of exercises - body, mind, and heart - to help you find clarity.';
    await this.speakAndReveal(explain);
    await delay(800);

    this.state = 'intake';
    this.showInput('I\'ve been going back and forth about...');
    this.els.textarea.focus();
  }

  // ─── Submit Handler ───

  private async handleSubmit(): Promise<void> {
    const text = this.els.textarea.value.trim();
    if (!text) return;

    this.els.textarea.value = '';
    this.els.sendBtn.disabled = true;
    this.hideInput();

    if (this.state === 'intake') {
      this.journey.situation = text;
      saveJourney(this.journey);
      trackEvent('intake_completed', this.journey.id, { length: text.length });

      // Show what they said briefly
      await this.revealUserText(text);
      await delay(1500);
      await this.classify(text);

    } else if (this.state === 'awaiting-input') {
      await this.revealUserText(text);
      await delay(1000);
      await this.processModuleResponse(text);

    } else if (this.state === 'picking-frameworks') {
      // Framework selection - text is ignored, handled by buttons
    }
  }

  // ─── Classification ───

  private async classify(situation: string): Promise<void> {
    this.state = 'classifying';
    this.clearText();
    await this.revealText('Let me feel what you brought...');
    this.showBreathing(true);
    this.breathing.startIdle();

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'classify', situation, lang: 'en' }),
      });
      const data = await res.json();

      this.breathing.stop();
      this.showBreathing(false);

      if (data.fallback || !data.types) {
        this.journey.classification = {
          types: ['fear-based'] as ConfusionType[],
          confidence: 0.5,
          reasoning: 'Using default path.',
        };
      } else {
        this.journey.classification = data as Classification;
      }

      this.journey.route = buildRoute(this.journey.classification);
      this.journey.status = 'active';
      this.journey.currentModuleIndex = 0;
      this.journey.currentStepIndex = 0;
      this.currentModuleIndex = 0;
      this.currentStepIndex = 0;
      saveJourney(this.journey);

      trackEvent('classification_shown', this.journey.id, {
        types: this.journey.classification.types,
        route: this.journey.route,
      });

      const description = describeTypes(this.journey.classification.types);
      this.clearText();

      const classText = `It seems like what makes this hard is ${description}.`;
      await this.speakAndReveal(classText);
      await delay(2000);

      const suggestedRoute = data.suggestedRoute || this.journey.route.filter((s: string) => s !== 'decision-memo');
      const frameworkReasons: Record<string, string> = data.frameworkReasons || {};

      await this.showFrameworkPicker(suggestedRoute, frameworkReasons);

    } catch {
      this.breathing.stop();
      this.showBreathing(false);

      this.journey.classification = {
        types: ['fear-based'] as ConfusionType[],
        confidence: 0.5,
        reasoning: 'Classification failed.',
      };
      this.journey.route = buildRoute(this.journey.classification);
      this.journey.status = 'active';
      saveJourney(this.journey);

      this.clearText();
      await this.speakAndReveal('I\'ll guide you through some exercises to help you think about this.');
      await delay(1500);
      const fallbackRoute = this.journey.route.filter(s => s !== 'decision-memo');
      await this.showFrameworkPicker(fallbackRoute, {});
    }
  }

  // ─── Framework Picker ───

  private async showFrameworkPicker(
    suggestedRoute: string[],
    frameworkReasons: Record<string, string>,
  ): Promise<void> {
    this.state = 'picking-frameworks';
    this.clearText();

    await this.speakAndReveal('Here\'s the journey I\'ve designed for you:');
    await delay(1000);

    const selected = new Set(suggestedRoute.filter(s => s !== 'decision-memo'));

    const layerColors: Record<string, string> = {
      feel: '#c27a5a',
      see: '#8b6aad',
      think: '#4a7aad',
      act: '#2B4A3E',
    };
    const layerLabels: Record<string, string> = {
      feel: 'FEEL', see: 'SEE', think: 'THINK', act: 'ACT',
    };

    // Build visual journey path
    const journey = document.createElement('div');
    journey.className = 'immersive-journey';

    const routeSlugs = suggestedRoute.filter(s => s !== 'decision-memo');

    // Render each framework as a node on a vertical path
    for (let i = 0; i < routeSlugs.length; i++) {
      const slug = routeSlugs[i];
      const mod = MODULES[slug];
      if (!mod) continue;

      const color = layerColors[mod.layer] || '#6b6b68';

      // Connector line (except before first)
      if (i > 0) {
        const line = document.createElement('div');
        line.className = 'journey-line';
        line.style.borderColor = color;
        journey.appendChild(line);
      }

      // Node
      const node = document.createElement('button');
      node.className = `journey-node${selected.has(slug) ? ' selected' : ''}`;
      node.dataset.slug = slug;

      node.innerHTML = `
        <div class="journey-node-circle" style="border-color: ${color}; background: ${selected.has(slug) ? color : 'transparent'}">
          <span class="journey-node-num">${i + 1}</span>
        </div>
        <div class="journey-node-info">
          <span class="journey-node-layer" style="color: ${color}">${layerLabels[mod.layer] || ''}</span>
          <span class="journey-node-title">${escapeHtml(mod.title)}</span>
          <span class="journey-node-desc">${escapeHtml(mod.description)}</span>
          ${frameworkReasons[slug] ? `<span class="journey-node-reason">${escapeHtml(frameworkReasons[slug])}</span>` : ''}
        </div>
      `;

      node.addEventListener('click', () => {
        if (selected.has(slug)) {
          selected.delete(slug);
          node.classList.remove('selected');
          const circle = node.querySelector('.journey-node-circle') as HTMLElement;
          if (circle) circle.style.background = 'transparent';
        } else {
          selected.add(slug);
          node.classList.add('selected');
          const circle = node.querySelector('.journey-node-circle') as HTMLElement;
          if (circle) circle.style.background = color;
        }
        startBtn.disabled = selected.size < 2;
      });

      journey.appendChild(node);
    }

    // Final node: Decision Memo (always included, not toggleable)
    const memoLine = document.createElement('div');
    memoLine.className = 'journey-line';
    memoLine.style.borderColor = layerColors.act;
    journey.appendChild(memoLine);

    const memoNode = document.createElement('div');
    memoNode.className = 'journey-node journey-node-final';
    memoNode.innerHTML = `
      <div class="journey-node-circle" style="border-color: ${layerColors.act}; background: ${layerColors.act}">
        <span class="journey-node-num">&#10003;</span>
      </div>
      <div class="journey-node-info">
        <span class="journey-node-layer" style="color: ${layerColors.act}">ACT</span>
        <span class="journey-node-title">Decision Memo</span>
        <span class="journey-node-desc">Everything compiled into clarity.</span>
      </div>
    `;
    journey.appendChild(memoNode);

    const startBtn = document.createElement('button');
    startBtn.className = 'immersive-start-btn';
    startBtn.textContent = 'begin journey';
    startBtn.disabled = selected.size < 2;

    startBtn.addEventListener('click', async () => {
      const orderedRoute = PICKABLE_MODULES.filter(s => selected.has(s));
      orderedRoute.push('decision-memo');

      this.journey.route = orderedRoute;
      this.journey.currentModuleIndex = 0;
      this.journey.currentStepIndex = 0;
      this.currentModuleIndex = 0;
      this.currentStepIndex = 0;
      saveJourney(this.journey);

      trackEvent('frameworks_confirmed', this.journey.id, {
        route: orderedRoute,
        suggested: suggestedRoute,
      });

      journey.remove();
      startBtn.remove();
      this.clearText();

      await this.ambient.chime();
      await delay(500);
      await this.startNextModule();
    });

    this.els.textDisplay.appendChild(journey);
    this.els.textDisplay.appendChild(startBtn);
  }

  // ─── Module Flow ───

  private async startNextModule(): Promise<void> {
    if (this.currentModuleIndex >= this.journey.route.length) {
      await this.showPreMemoPrompt();
      return;
    }

    const moduleSlug = this.journey.route[this.currentModuleIndex];

    if (moduleSlug === 'decision-memo') {
      await this.showPreMemoPrompt();
      return;
    }

    const mod = MODULES[moduleSlug];
    if (!mod) {
      this.currentModuleIndex++;
      await this.startNextModule();
      return;
    }

    if (this.currentStepIndex === 0) {
      trackEvent('module_started', this.journey.id, {
        module: mod.slug,
        moduleIndex: this.currentModuleIndex,
      });

      // Module intro
      this.clearText();
      this.updatePhaseLabel(mod.layer, mod.title);

      // Mini breathing transition
      this.showBreathing(true);
      await this.breathing.breathe(1);
      this.showBreathing(false);
      await delay(500);

      await this.speakAndReveal(mod.activity);
      await delay(1500);
    }

    await this.showModuleStep();
  }

  private async showModuleStep(): Promise<void> {
    const moduleSlug = this.journey.route[this.currentModuleIndex];
    const mod = MODULES[moduleSlug];
    if (!mod) return;

    if (this.currentStepIndex >= mod.steps.length) {
      await this.completeModule(mod);
      return;
    }

    const step = mod.steps[this.currentStepIndex];
    this.clearText();

    await this.speakAndReveal(step.question);

    if (step.guidance) {
      await delay(1000);
      this.appendGuidance(step.guidance);
    }

    this.state = 'awaiting-input';
    this.showInput(step.placeholder);
    this.els.textarea.focus();
  }

  private async processModuleResponse(text: string): Promise<void> {
    this.state = 'processing';
    const moduleSlug = this.journey.route[this.currentModuleIndex];
    const mod = MODULES[moduleSlug];
    if (!mod) return;

    if (!this.journey.moduleResponses[moduleSlug]) {
      this.journey.moduleResponses[moduleSlug] = [];
      this.journey.moduleInsights[moduleSlug] = [];
    }
    this.journey.moduleResponses[moduleSlug][this.currentStepIndex] = text;

    this.clearText();
    this.showBreathing(true);
    this.breathing.startIdle();
    await this.revealText('Let me reflect on that...');

    try {
      const priorSummaries = Object.entries(this.journey.moduleSummaries)
        .map(([slug, summary]) => `${MODULES[slug]?.title || slug}: ${summary}`)
        .join('\n');

      const currentModuleResponses = this.journey.moduleResponses[moduleSlug] || [];
      const priorStepResponses = currentModuleResponses
        .slice(0, this.currentStepIndex)
        .map((r: string, i: number) => `Step ${i + 1}: ${r}`)
        .join('\n');

      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'reflect',
          module: moduleSlug,
          step: this.currentStepIndex,
          userText: text,
          journeyContext: priorSummaries || undefined,
          originalSituation: this.journey.situation,
          priorStepResponses: priorStepResponses || undefined,
          lang: 'en',
        }),
      });

      const data = await res.json();
      this.breathing.stop();
      this.showBreathing(false);

      if (data.insight && !data.fallback) {
        if (data.needsMore) {
          this.clearText();
          await this.speakAndReveal(data.insight);
          this.state = 'awaiting-input';
          this.showInput('take a deep breath and try again...');
          this.els.textarea.focus();
          return;
        }

        this.journey.moduleInsights[moduleSlug][this.currentStepIndex] = data.insight;
        if (data.summary) {
          this.journey.moduleSummaries[moduleSlug] =
            (this.journey.moduleSummaries[moduleSlug] || '') +
            ` Step ${this.currentStepIndex + 1}: ${data.summary}`;
        }

        this.clearText();
        await this.speakAndReveal(data.insight);

        // Themes
        if (data.themes && data.themes.length > 0) {
          await delay(500);
          this.appendThemes(data.themes);
        }
      }
    } catch {
      this.breathing.stop();
      this.showBreathing(false);
      this.clearText();
      await this.speakAndReveal('Couldn\'t reflect on that - but your answer is saved. Let\'s continue.');
    }

    this.currentStepIndex++;
    this.journey.currentModuleIndex = this.currentModuleIndex;
    this.journey.currentStepIndex = this.currentStepIndex;
    saveJourney(this.journey);

    // Reflection pause
    await delay(3000);
    await this.showModuleStep();
  }

  private async completeModule(mod: { slug: string; title: string; layer: string }): Promise<void> {
    trackEvent('module_completed', this.journey.id, {
      module: mod.slug,
      moduleIndex: this.currentModuleIndex,
    });

    this.currentModuleIndex++;
    this.currentStepIndex = 0;
    this.journey.currentModuleIndex = this.currentModuleIndex;
    this.journey.currentStepIndex = 0;
    saveJourney(this.journey);

    // Transition
    this.clearText();
    await this.ambient.chime();
    await this.revealText(`${mod.title} complete.`);
    await delay(2000);

    await this.startNextModule();
  }

  // ─── Pre-Memo ───

  private async showPreMemoPrompt(): Promise<void> {
    this.state = 'transitioning';
    this.clearText();

    await this.ambient.chime();
    await delay(500);

    await this.speakAndReveal('All exercises complete.');
    await delay(1500);
    await this.speakAndReveal('Before compiling your Decision Memo - is there anything else you\'d like to add?');
    await delay(1000);

    // Show two buttons
    const btnRow = document.createElement('div');
    btnRow.className = 'immersive-btn-row';

    const addBtn = document.createElement('button');
    addBtn.className = 'immersive-secondary-btn';
    addBtn.textContent = 'I want to add something';
    addBtn.addEventListener('click', async () => {
      btnRow.remove();
      this.clearText();
      await this.speakAndReveal('What else would you like to say?');
      this.state = 'awaiting-input';
      this.showInput('there\'s one more thing...');
      this.els.textarea.focus();
      // Override handleSubmit temporarily for additional context
      const origState = this.state;
      const waitForAdditional = () => {
        const text = this.els.textarea.value.trim();
        if (text) {
          this.journey.additionalContext = (this.journey.additionalContext || '') + '\n' + text;
          saveJourney(this.journey);
          this.els.textarea.value = '';
          this.hideInput();
          this.generateAndShowMemo();
        }
      };
      this.els.sendBtn.onclick = waitForAdditional;
    });

    const generateBtn = document.createElement('button');
    generateBtn.className = 'immersive-primary-btn';
    generateBtn.textContent = 'I\'m ready - generate my memo';
    generateBtn.addEventListener('click', async () => {
      btnRow.remove();
      await this.generateAndShowMemo();
    });

    btnRow.appendChild(addBtn);
    btnRow.appendChild(generateBtn);
    this.els.textDisplay.appendChild(btnRow);
  }

  // ─── Memo Generation ───

  private async generateAndShowMemo(): Promise<void> {
    this.state = 'generating-memo';
    this.clearText();
    this.showBreathing(true);
    this.breathing.startIdle();
    await this.revealText('Compiling everything you explored...');

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'generate-memo',
          allResponses: this.journey.moduleResponses,
          originalSituation: this.journey.situation,
          additionalContext: this.journey.additionalContext || undefined,
          lang: 'en',
        }),
      });
      const memoData = await res.json();

      this.breathing.stop();
      this.showBreathing(false);

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

      await this.closingCeremony();

    } catch {
      this.breathing.stop();
      this.showBreathing(false);
      this.clearText();
      await this.speakAndReveal('Couldn\'t generate the full memo. Your answers are saved.');
      this.journey.status = 'completed';
      saveJourney(this.journey);
    }
  }

  // ─── Closing Ceremony ───

  private async closingCeremony(): Promise<void> {
    this.state = 'closing';
    this.clearText();

    await this.ambient.chime();
    await delay(1000);

    const memo = this.journey.memo!;

    // Read key sections aloud
    await this.speakAndReveal('What emerged today...');
    await delay(1500);

    if (memo.gutFeeling) {
      this.clearText();
      await this.speakAndReveal(memo.gutFeeling);
      await delay(2500);
    }

    if (memo.nextStep) {
      this.clearText();
      await this.speakAndReveal(`Your next step: ${memo.nextStep}`);
      await delay(2500);
    }

    this.clearText();
    await this.speakAndReveal('Sit with this. Come back whenever you\'re ready.');
    await delay(2000);

    // Show full memo
    this.clearText();
    this.renderMemo();

    // Fade out ambient
    this.ambient.stop();
    this.state = 'complete';
  }

  private renderMemo(): void {
    const m = this.journey.memo!;
    const section = (title: string, content: string) =>
      content ? `<div class="immersive-memo-section"><h3>${title}</h3><p>${escapeHtml(content)}</p></div>` : '';

    const memoHtml = `
      <div class="immersive-memo">
        <h2>Your Decision Memo</h2>
        <p class="immersive-memo-date">${new Date(m.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${section('The Decision', m.situation)}
        ${section('What made it hard', m.classification)}
        ${section('What your body said', m.bodyInsights)}
        ${section('The inner conflict', m.identityInsights)}
        ${section('Facts vs assumptions', m.rationalInsights)}
        ${section('Your real options', m.options)}
        ${section('Trade-offs', m.tradeoffs)}
        ${section('The emerging clarity', m.gutFeeling)}
        ${section('Your next step', m.nextStep)}
        ${section('Questions to sit with', m.openQuestions)}
        <div class="immersive-memo-actions">
          <button class="immersive-secondary-btn" id="immersive-copy">copy memo</button>
          <button class="immersive-secondary-btn" id="immersive-new">new decision</button>
        </div>
      </div>
    `;

    this.els.textDisplay.innerHTML = memoHtml;
    this.wireMemoActions();
  }

  private wireMemoActions(): void {
    document.getElementById('immersive-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.memoToText());
      trackEvent('memo_exported', this.journey.id, { method: 'copy' });
      const btn = document.getElementById('immersive-copy')!;
      btn.textContent = 'copied';
      setTimeout(() => btn.textContent = 'copy memo', 3000);
    });
    document.getElementById('immersive-new')?.addEventListener('click', () => {
      this.restart();
    });
  }

  private restart(): void {
    this.tts.stop();
    this.ambient.stop();
    this.breathing.stop();
    this.journey = createJourney();
    saveJourney(this.journey);
    this.currentModuleIndex = 0;
    this.currentStepIndex = 0;
    this.clearText();
    this.openingCeremony();
  }

  // ─── Resume ───

  private async resumeJourney(): Promise<void> {
    this.ambient.start();
    this.clearText();

    await this.speakAndReveal('Welcome back. Let\'s continue where we left off.');
    await delay(2000);

    const moduleSlug = this.journey.route[this.currentModuleIndex];
    const mod = MODULES[moduleSlug];
    if (mod) {
      this.updatePhaseLabel(mod.layer, mod.title);
    }

    await this.showModuleStep();
  }

  // ─── Display Helpers ───

  private async speakAndReveal(text: string): Promise<void> {
    if (this.voiceEnabled) {
      await this.tts.speakWithSync(text, (sentence, _idx) => {
        this.appendSentence(sentence);
      }, 600);
    } else {
      // Just reveal sentence by sentence with timing
      const sentences = text.match(/[^.!?]+[.!?]+|[^.!?]+$/g) || [text];
      for (const s of sentences) {
        this.appendSentence(s.trim());
        await delay(1200);
      }
    }
  }

  private async revealText(text: string): Promise<void> {
    const el = document.createElement('p');
    el.className = 'immersive-text fade-in';
    this.els.textDisplay.appendChild(el);

    // Reveal character by character
    for (let i = 0; i < text.length; i++) {
      el.textContent = text.slice(0, i + 1);
      await delay(30);
    }
  }

  private appendSentence(sentence: string): void {
    const el = document.createElement('p');
    el.className = 'immersive-text immersive-sentence fade-in';
    el.textContent = sentence;
    this.els.textDisplay.appendChild(el);
    this.scrollToBottom();
  }

  private async revealUserText(text: string): Promise<void> {
    const el = document.createElement('p');
    el.className = 'immersive-user-text fade-in';
    el.textContent = text;
    this.els.textDisplay.appendChild(el);
    this.scrollToBottom();
  }

  private appendGuidance(text: string): void {
    const el = document.createElement('p');
    el.className = 'immersive-guidance fade-in';
    el.textContent = text;
    this.els.textDisplay.appendChild(el);
    this.scrollToBottom();
  }

  private appendThemes(themes: string[]): void {
    const el = document.createElement('div');
    el.className = 'immersive-themes fade-in';
    el.innerHTML = themes.map(t => `<span class="immersive-theme">${escapeHtml(t)}</span>`).join('');
    this.els.textDisplay.appendChild(el);
  }

  private clearText(): void {
    this.els.textDisplay.innerHTML = '';
  }

  private showInput(placeholder: string): void {
    this.els.inputArea.classList.remove('hidden');
    this.els.textarea.placeholder = placeholder;
    this.els.textarea.value = '';
    this.els.sendBtn.disabled = true;
    // Re-wire submit handler
    this.els.sendBtn.onclick = () => this.handleSubmit();
  }

  private hideInput(): void {
    this.els.inputArea.classList.add('hidden');
  }

  private showBreathing(show: boolean): void {
    this.els.breathingCanvas.classList.toggle('hidden', !show);
  }

  private updatePhaseLabel(layer: string, title: string): void {
    const labels: Record<string, string> = {
      feel: 'FEEL', see: 'SEE', think: 'THINK', act: 'ACT'
    };
    this.els.phaseLabel.textContent = `${labels[layer] || ''} - ${title}`;
    this.els.phaseLabel.dataset.layer = layer;
    this.els.phaseLabel.classList.remove('hidden');
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      this.els.textDisplay.scrollTop = this.els.textDisplay.scrollHeight;
    });
  }

  private memoToText(): string {
    const m = this.journey.memo!;
    return [
      `DECISION MEMO - ${new Date(m.generatedAt).toLocaleDateString('en-US')}`, '',
      `THE DECISION: ${m.situation}`,
      `WHAT MADE IT HARD: ${m.classification}`,
      m.bodyInsights ? `BODY SIGNALS: ${m.bodyInsights}` : '',
      m.identityInsights ? `INNER CONFLICT: ${m.identityInsights}` : '',
      m.rationalInsights ? `FACTS VS ASSUMPTIONS: ${m.rationalInsights}` : '',
      m.options ? `OPTIONS: ${m.options}` : '',
      m.tradeoffs ? `TRADE-OFFS: ${m.tradeoffs}` : '',
      m.gutFeeling ? `EMERGING CLARITY: ${m.gutFeeling}` : '',
      m.nextStep ? `NEXT STEP: ${m.nextStep}` : '',
      m.openQuestions ? `QUESTIONS TO SIT WITH: ${m.openQuestions}` : '',
      '', '- Generated by May Decision Copilot',
    ].filter(Boolean).join('\n\n');
  }
}

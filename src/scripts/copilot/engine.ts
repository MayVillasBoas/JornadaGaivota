// src/scripts/copilot/engine.ts — Flowing Session Engine

import { MODULES } from './modules';
import { buildRoute, describeTypes } from './routing';
import type { Classification, ConfusionType } from './routing';
import { createJourney, saveJourney, loadActiveJourney } from './persistence';
import type { JourneyData } from './persistence';
import { trackEvent } from './tracking';
import { BreathingLine } from './breathing-line';
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

interface EngineElements {
  timeline: HTMLElement;
  canvas: HTMLCanvasElement | null;
  mic: HTMLButtonElement;
  textarea: HTMLTextAreaElement;
  sendBtn: HTMLButtonElement;
  hint: HTMLElement;
}

type EngineState =
  | 'intake'
  | 'classifying'
  | 'awaiting-input'
  | 'processing'
  | 'streaming'
  | 'transitioning'
  | 'generating-memo'
  | 'complete';

// ─── Engine ───

export class CopilotEngine {
  private els: EngineElements;
  private journey: JourneyData;
  private state: EngineState = 'intake';
  private breathingLine: BreathingLine | null = null;
  private blockLayers: string[] = [];
  private currentModuleIndex = 0;
  private currentStepIndex = 0;

  constructor(els: EngineElements) {
    this.els = els;
    if (els.canvas) {
      this.breathingLine = new BreathingLine(els.canvas, els.timeline);
    }

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

  init(): void {
    trackEvent('session_started', this.journey.id);

    if (this.journey.status === 'active' && this.journey.classification) {
      this.reconstructTimeline();
    } else {
      this.showIntake();
    }

    this.breathingLine?.startAnimation();
  }

  // ─── Input Wiring ───

  private wireInput(): void {
    const { mic, textarea, sendBtn, hint } = this.els;

    initVoiceInput(mic, textarea);

    textarea.addEventListener('input', () => {
      sendBtn.disabled = !textarea.value.trim();
      hint.classList.remove('visible');
    });

    sendBtn.addEventListener('click', () => this.handleSubmit());

    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        if (textarea.value.trim()) this.handleSubmit();
      }
    });
  }

  // ─── Intake ───

  private showIntake(): void {
    this.state = 'intake';
    this.appendQuestion(
      "What's on your mind?",
      'Describe the decision you\'re struggling with. Be messy, be honest — this is just for you.',
      'intake'
    );
    this.els.textarea.placeholder = "I've been going back and forth about...";
    this.els.textarea.focus();
  }

  // ─── Submit Handler ───

  private async handleSubmit(): Promise<void> {
    const text = this.els.textarea.value.trim();
    if (!text) {
      this.els.hint.classList.add('visible');
      return;
    }

    const isVoice = this.els.mic.classList.contains('voice-btn--done') ||
                    this.els.mic.classList.contains('voice-btn--recording');

    this.els.textarea.value = '';
    this.els.sendBtn.disabled = true;

    if (this.state === 'intake') {
      this.journey.situation = text;
      saveJourney(this.journey);
      trackEvent('intake_completed', this.journey.id, { length: text.length });
      this.appendResponse(text, isVoice);
      await this.classify(text);
    } else if (this.state === 'awaiting-input') {
      this.appendResponse(text, isVoice);
      await this.processModuleResponse(text);
    }
  }

  // ─── Classification ───

  private async classify(situation: string): Promise<void> {
    this.state = 'classifying';
    const thinkingBlock = this.appendThinking();

    try {
      const res = await fetch('/api/copilot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'classify', situation }),
      });

      const data = await res.json();

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
      const moduleNames = this.journey.route
        .map(slug => MODULES[slug]?.title || slug)
        .join(' → ');

      this.removeBlock(thinkingBlock);
      await this.streamReflection(
        `I hear you. It sounds like what's making this hard is ${description}. I'm going to guide you through a few exercises to untangle this: ${moduleNames}.`,
        [],
        'intake'
      );

      await delay(2000);
      this.showNextQuestion();
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
      await delay(2000);
      this.showNextQuestion();
    }
  }

  // ─── Module Flow ───

  private showNextQuestion(): void {
    const route = this.journey.route;
    if (this.currentModuleIndex >= route.length) {
      this.generateAndShowMemo();
      return;
    }

    const moduleSlug = route[this.currentModuleIndex];
    const mod = MODULES[moduleSlug];
    if (!mod) {
      this.currentModuleIndex++;
      this.showNextQuestion();
      return;
    }

    if (this.currentStepIndex >= mod.steps.length) {
      this.completeModule(mod);
      return;
    }

    if (this.currentStepIndex === 0) {
      trackEvent('module_started', this.journey.id, {
        module: mod.slug,
        moduleIndex: this.currentModuleIndex,
      });
    }

    const step = mod.steps[this.currentStepIndex];
    this.state = 'awaiting-input';
    this.updateLayerDots(mod.layer);
    this.appendQuestion(step.question, step.guidance, mod.layer);
    this.els.textarea.placeholder = step.placeholder;
    this.els.textarea.focus();
    this.scrollToBottom();
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

    const thinkingBlock = this.appendThinking();
    this.scrollToBottom();

    try {
      const priorSummaries = Object.entries(this.journey.moduleSummaries)
        .map(([slug, summary]) => `${MODULES[slug]?.title || slug}: ${summary}`)
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
        }),
      });

      const data = await res.json();
      this.removeBlock(thinkingBlock);

      if (data.insight && !data.fallback) {
        this.journey.moduleInsights[moduleSlug][this.currentStepIndex] = data.insight;
        if (data.summary) {
          this.journey.moduleSummaries[moduleSlug] =
            (this.journey.moduleSummaries[moduleSlug] || '') +
            ` Step ${this.currentStepIndex + 1}: ${data.summary}`;
        }
        await this.streamReflection(data.insight, data.themes || [], mod.layer);
      }
    } catch {
      this.removeBlock(thinkingBlock);
      await this.streamReflection(
        "I couldn't reflect on that one — but your answer is saved. Let's keep going.",
        [], mod.layer
      );
    }

    this.currentStepIndex++;
    this.journey.currentModuleIndex = this.currentModuleIndex;
    this.journey.currentStepIndex = this.currentStepIndex;
    saveJourney(this.journey);

    await delay(2000);
    this.showNextQuestion();
  }

  private completeModule(mod: { slug: string; title: string }): void {
    trackEvent('module_completed', this.journey.id, {
      module: mod.slug,
      moduleIndex: this.currentModuleIndex,
    });

    this.currentModuleIndex++;
    this.currentStepIndex = 0;
    this.journey.currentModuleIndex = this.currentModuleIndex;
    this.journey.currentStepIndex = 0;
    saveJourney(this.journey);

    if (this.currentModuleIndex >= this.journey.route.length) {
      this.generateAndShowMemo();
      return;
    }

    const nextSlug = this.journey.route[this.currentModuleIndex];
    const nextMod = MODULES[nextSlug];
    this.state = 'transitioning';

    const div = document.createElement('div');
    div.innerHTML = `
      <div class="copilot-module-transition">
        <span>✓ ${escapeHtml(mod.title)} complete</span>
      </div>
      ${nextMod ? `
        <div class="copilot-block" style="text-align:center;padding:1rem 0">
          <p style="font-family:var(--serif);color:var(--ink-light);margin-bottom:1rem">
            Next: <strong>${escapeHtml(nextMod.title)}</strong> — ${escapeHtml(nextMod.description)}
          </p>
          <div style="display:flex;gap:1rem;justify-content:center">
            <button class="btn-primary" id="copilot-continue">continue →</button>
            <button class="btn-secondary" id="copilot-pause">save & come back later</button>
          </div>
        </div>
      ` : ''}
    `;
    this.els.timeline.appendChild(div);
    this.scrollToBottom();

    document.getElementById('copilot-continue')?.addEventListener('click', () => {
      this.showNextQuestion();
    });

    document.getElementById('copilot-pause')?.addEventListener('click', () => {
      saveJourney(this.journey);
      this.els.timeline.insertAdjacentHTML('beforeend', `
        <div class="copilot-block" style="text-align:center;padding:2rem 0">
          <h3 style="font-family:var(--serif);font-size:1.3rem;margin-bottom:.5rem">Saved</h3>
          <p style="color:var(--ink-muted)">Come back anytime. I'll remember where you left off.</p>
        </div>
      `);
      this.scrollToBottom();
    });
  }

  // ─── Memo Generation ───

  private async generateAndShowMemo(): Promise<void> {
    this.state = 'generating-memo';

    const loading = document.createElement('div');
    loading.className = 'copilot-block copilot-loading';
    loading.innerHTML = `
      <p class="copilot-loading-text">compiling everything you've explored...</p>
      <div class="thinking-dots"><span></span><span></span><span></span></div>
    `;
    this.els.timeline.appendChild(loading);
    this.scrollToBottom();

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
      loading.remove();

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
      loading.remove();
      this.renderFallbackMemo();
    }
  }

  private renderMemo(): void {
    this.state = 'complete';
    const m = this.journey.memo!;
    const section = (title: string, content: string, extra = '') =>
      content ? `<div class="memo-section ${extra}"><h3>${title}</h3><p>${escapeHtml(content)}</p></div>` : '';

    this.els.timeline.insertAdjacentHTML('beforeend', `
      <div class="copilot-memo">
        <h2>Your Decision Memo</h2>
        <p class="copilot-memo-date">${new Date(m.generatedAt).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${section('The Decision', m.situation)}
        ${section('What was making it hard', m.classification)}
        ${section('What your body said', m.bodyInsights)}
        ${section('The inner conflict', m.identityInsights)}
        ${section('Facts vs assumptions', m.rationalInsights)}
        ${section('Your real options', m.options)}
        ${section('Trade-offs', m.tradeoffs)}
        ${section('The emerging clarity', m.gutFeeling)}
        ${section('Your next step', m.nextStep, 'memo-next-step')}
        ${section('Questions worth sitting with', m.openQuestions)}
        <div class="copilot-memo-actions">
          <button class="btn-secondary" id="copilot-copy">copy memo</button>
          <button class="btn-secondary" id="copilot-download">download</button>
          <button class="btn-secondary" id="copilot-new">new decision</button>
        </div>
      </div>
    `);
    this.scrollToBottom();
    this.wireMemoActions();
  }

  private renderFallbackMemo(): void {
    let sections = '';
    for (const [slug, answers] of Object.entries(this.journey.moduleResponses)) {
      const mod = MODULES[slug];
      sections += `<div class="memo-section"><h3>${escapeHtml(mod?.title || slug)}</h3>`;
      for (const a of answers) sections += `<p>${escapeHtml(a)}</p>`;
      sections += '</div>';
    }
    this.journey.status = 'completed';
    this.journey.memo = {
      situation: this.journey.situation, classification: describeTypes(this.journey.classification?.types || []),
      bodyInsights: '', identityInsights: '', rationalInsights: '', options: '',
      tradeoffs: '', gutFeeling: '', nextStep: '', openQuestions: '',
      generatedAt: new Date().toISOString(),
    };
    saveJourney(this.journey);

    this.els.timeline.insertAdjacentHTML('beforeend', `
      <div class="copilot-memo">
        <h2>Your Decision Memo</h2>
        <div class="memo-section"><h3>The Decision</h3><p>${escapeHtml(this.journey.situation)}</p></div>
        ${sections}
        <div class="copilot-memo-actions">
          <button class="btn-secondary" id="copilot-copy">copy memo</button>
          <button class="btn-secondary" id="copilot-new">new decision</button>
        </div>
      </div>
    `);
    this.wireMemoActions();
  }

  private wireMemoActions(): void {
    document.getElementById('copilot-copy')?.addEventListener('click', () => {
      navigator.clipboard.writeText(this.memoToText());
      trackEvent('memo_exported', this.journey.id, { method: 'copy' });
      const btn = document.getElementById('copilot-copy')!;
      btn.textContent = 'copied ✓';
      setTimeout(() => btn.textContent = 'copy memo', 2000);
    });
    document.getElementById('copilot-download')?.addEventListener('click', () => {
      const blob = new Blob([this.memoToText()], { type: 'text/plain' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `decision-memo-${new Date().toISOString().slice(0, 10)}.txt`;
      a.click();
      URL.revokeObjectURL(url);
      trackEvent('memo_exported', this.journey.id, { method: 'download' });
    });
    document.getElementById('copilot-new')?.addEventListener('click', () => this.restart());
  }

  private restart(): void {
    this.journey = createJourney();
    saveJourney(this.journey);
    this.els.timeline.innerHTML = '';
    this.blockLayers = [];
    this.currentModuleIndex = 0;
    this.currentStepIndex = 0;
    this.showIntake();
  }

  // ─── Resume ───

  private reconstructTimeline(): void {
    trackEvent('session_returned', this.journey.id);
    const route = this.journey.route;

    for (let mi = 0; mi < this.currentModuleIndex; mi++) {
      const moduleSlug = route[mi];
      const mod = MODULES[moduleSlug];
      if (!mod) continue;

      for (let si = 0; si < mod.steps.length; si++) {
        this.appendQuestion(mod.steps[si].question, mod.steps[si].guidance, mod.layer, true);
        const response = this.journey.moduleResponses[moduleSlug]?.[si];
        if (response) this.appendResponse(response, false, true);
        const insight = this.journey.moduleInsights[moduleSlug]?.[si];
        if (insight) this.appendReflectionStatic(insight, [], mod.layer, true);
      }

      this.els.timeline.insertAdjacentHTML('beforeend',
        `<div class="copilot-module-transition dimmed"><span>✓ ${escapeHtml(mod.title)} complete</span></div>`
      );
    }

    // Current module: show completed steps
    if (this.currentModuleIndex < route.length) {
      const moduleSlug = route[this.currentModuleIndex];
      const mod = MODULES[moduleSlug];
      if (mod) {
        for (let si = 0; si < this.currentStepIndex; si++) {
          this.appendQuestion(mod.steps[si].question, mod.steps[si].guidance, mod.layer, true);
          const response = this.journey.moduleResponses[moduleSlug]?.[si];
          if (response) this.appendResponse(response, false, true);
          const insight = this.journey.moduleInsights[moduleSlug]?.[si];
          if (insight) this.appendReflectionStatic(insight, [], mod.layer, true);
        }
        this.updateLayerDots(mod.layer);
      }
    }

    this.showNextQuestion();
    this.updateBreathingLine();
  }

  // ─── DOM Helpers ───

  private appendQuestion(text: string, guidance: string, layer: string, dimmed = false): void {
    const block = document.createElement('div');
    block.className = `copilot-block${dimmed ? ' dimmed' : ''}`;
    block.setAttribute('data-layer', layer);
    block.innerHTML = `
      <div class="copilot-question">
        <div class="speaker">copilot</div>
        <p>${escapeHtml(text)}</p>
        ${guidance ? `<p class="guidance">${escapeHtml(guidance)}</p>` : ''}
      </div>
    `;
    this.els.timeline.appendChild(block);
    this.blockLayers.push(layer);
    this.updateBreathingLine();
  }

  private appendResponse(text: string, isVoice: boolean, dimmed = false): void {
    const block = document.createElement('div');
    block.className = `copilot-block${dimmed ? ' dimmed' : ''}`;
    block.innerHTML = `
      <div class="copilot-response">
        <p>${escapeHtml(text)}</p>
        ${isVoice ? '<div class="meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>voice</div>' : ''}
      </div>
    `;
    this.els.timeline.appendChild(block);
    this.updateBreathingLine();
    this.scrollToBottom();
  }

  private appendThinking(): HTMLElement {
    const block = document.createElement('div');
    block.className = 'copilot-block';
    block.innerHTML = `
      <div class="copilot-reflection">
        <div class="marker">✦ reflection</div>
        <div class="thinking-dots"><span></span><span></span><span></span></div>
      </div>
    `;
    this.els.timeline.appendChild(block);
    this.scrollToBottom();
    return block;
  }

  private removeBlock(block: HTMLElement): void {
    block.remove();
  }

  private async streamReflection(text: string, themes: string[], layer: string): Promise<void> {
    this.state = 'streaming';
    const block = document.createElement('div');
    block.className = 'copilot-block';
    block.setAttribute('data-layer', layer);

    const reflDiv = document.createElement('div');
    reflDiv.className = 'copilot-reflection';
    reflDiv.innerHTML = '<div class="marker">✦ reflection</div>';

    const textP = document.createElement('p');
    reflDiv.appendChild(textP);
    block.appendChild(reflDiv);
    this.els.timeline.appendChild(block);
    this.blockLayers.push(layer);
    this.scrollToBottom();

    for (let i = 0; i < text.length; i++) {
      textP.textContent = text.slice(0, i + 1);
      if (i % 10 === 0) this.scrollToBottom();
      await delay(20);
    }

    if (themes.length > 0) {
      const td = document.createElement('div');
      td.className = 'copilot-themes';
      td.innerHTML = themes.map(t => `<span class="theme-tag">${escapeHtml(t)}</span>`).join('');
      block.appendChild(td);
    }

    this.updateBreathingLine();
    this.scrollToBottom();
  }

  private appendReflectionStatic(text: string, themes: string[], layer: string, dimmed = false): void {
    const block = document.createElement('div');
    block.className = `copilot-block${dimmed ? ' dimmed' : ''}`;
    block.setAttribute('data-layer', layer);
    block.innerHTML = `
      <div class="copilot-reflection">
        <div class="marker">✦ reflection</div>
        <p>${escapeHtml(text)}</p>
      </div>
      ${themes.length > 0 ? `<div class="copilot-themes">${themes.map(t => `<span class="theme-tag">${escapeHtml(t)}</span>`).join('')}</div>` : ''}
    `;
    this.els.timeline.appendChild(block);
    this.blockLayers.push(layer);
  }

  private updateBreathingLine(): void {
    const blocks = this.els.timeline.querySelectorAll('.copilot-block');
    this.breathingLine?.rebuildFromBlocks(Array.from(blocks) as HTMLElement[], this.blockLayers);
  }

  private updateLayerDots(currentLayer: string): void {
    let header = this.els.timeline.querySelector('.copilot-header') as HTMLElement;
    if (!header) {
      header = document.createElement('div');
      header.className = 'copilot-header';
      this.els.timeline.insertBefore(header, this.els.timeline.firstChild);
    }

    const layers = ['feel', 'see', 'think', 'act'];
    const labels: Record<string, string> = { feel: 'FEEL', see: 'SEE', think: 'THINK', act: 'ACT' };
    const currentMod = this.currentModuleIndex < this.journey.route.length
      ? MODULES[this.journey.route[this.currentModuleIndex]] : null;

    const doneLayers = new Set<string>();
    for (let i = 0; i < this.currentModuleIndex; i++) {
      const m = MODULES[this.journey.route[i]];
      if (m) doneLayers.add(m.layer);
    }

    header.innerHTML = layers.map(l =>
      `<div class="layer-dot ${l} ${doneLayers.has(l) ? 'done' : ''} ${l === currentLayer ? 'active' : ''}"></div>`
    ).join('') + `<span class="layer-label">${labels[currentLayer] || ''} — ${currentMod?.title || ''}</span>`;
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }

  private memoToText(): string {
    const m = this.journey.memo!;
    return [
      `DECISION MEMO — ${new Date(m.generatedAt).toLocaleDateString()}`, '',
      `THE DECISION: ${m.situation}`,
      `WHAT MADE IT HARD: ${m.classification}`,
      m.bodyInsights ? `BODY SIGNALS: ${m.bodyInsights}` : '',
      m.identityInsights ? `INNER CONFLICT: ${m.identityInsights}` : '',
      m.rationalInsights ? `FACTS VS ASSUMPTIONS: ${m.rationalInsights}` : '',
      m.options ? `OPTIONS: ${m.options}` : '',
      m.tradeoffs ? `TRADE-OFFS: ${m.tradeoffs}` : '',
      m.gutFeeling ? `EMERGING CLARITY: ${m.gutFeeling}` : '',
      m.nextStep ? `NEXT STEP: ${m.nextStep}` : '',
      m.openQuestions ? `QUESTIONS WORTH SITTING WITH: ${m.openQuestions}` : '',
      '', '— Generated by May Decision Copilot',
    ].filter(Boolean).join('\n\n');
  }
}

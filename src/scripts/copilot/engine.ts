// src/scripts/copilot/engine.ts - Flowing Session Engine

import { MODULES, PICKABLE_MODULES } from './modules';
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
  | 'picking-frameworks'
  | 'awaiting-additional'
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
  private progressBarEl: HTMLElement | null = null;

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

    // Detect OS for keyboard hint
    const keyboardHint = document.getElementById('copilot-keyboard-hint');
    if (keyboardHint && !navigator.platform?.includes('Mac')) {
      keyboardHint.textContent = 'Enter para nova linha · clique enviar ou Ctrl+Enter para enviar';
    }

    if (this.journey.status === 'active' && this.journey.classification) {
      this.hideWelcome();
      this.reconstructTimeline();
    } else {
      this.showIntake();
    }

    this.breathingLine?.startAnimation();
  }

  // ─── Input Wiring ───

  private wireInput(): void {
    const { mic, textarea, sendBtn, hint } = this.els;

    const langToggle = document.getElementById('voice-lang') as HTMLButtonElement | null;
    initVoiceInput(mic, textarea, langToggle);

    textarea.addEventListener('input', () => {
      sendBtn.disabled = !textarea.value.trim();
      if (textarea.value.trim()) {
        hint.classList.add('hidden');
      } else {
        hint.classList.remove('hidden');
      }
    });

    sendBtn.addEventListener('click', () => this.handleSubmit());

    // Enter = new line (natural textarea behavior)
    // Ctrl/Cmd+Enter = send
    textarea.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
        e.preventDefault();
        if (textarea.value.trim()) this.handleSubmit();
      }
    });
  }

  // ─── Intake ───

  private hideWelcome(): void {
    const welcome = document.getElementById('copilot-welcome');
    if (welcome && !welcome.classList.contains('hidden')) {
      welcome.classList.add('hidden');
      this.els.timeline.classList.remove('timeline-hidden');

      // Switch input from floating card to fixed bar
      const inputEl = document.getElementById('copilot-input');
      if (inputEl) inputEl.classList.remove('copilot-input--welcome');
      const titleEl = document.getElementById('copilot-input-title');
      if (titleEl) titleEl.style.display = 'none';

      // Now that we're in chat mode, render the intake question
      if (this.state === 'intake' && this.els.timeline.children.length === 0) {
        this.appendQuestion(
          "O que está na sua cabeça?",
          'Descreva a decisão com a qual está lutando. Pode ser bagunçado, pode ser honesto - é só pra você.',
          'intake'
        );
      }
    }
  }

  private showIntake(): void {
    this.state = 'intake';
    const welcome = document.getElementById('copilot-welcome');
    if (welcome && !welcome.classList.contains('hidden')) {
      // Welcome is visible - skip rendering the intake question block.
      // The welcome section itself acts as the onboarding.
      this.els.timeline.classList.add('timeline-hidden');
      this.els.textarea.placeholder = "Descreva a decisão que te trava...";
    } else {
      // Welcome was already hidden (e.g. page reload mid-session)
      this.appendQuestion(
        "O que está na sua cabeça?",
        'Descreva a decisão com a qual está lutando. Pode ser bagunçado, pode ser honesto - é só pra você.',
        'intake'
      );
      this.els.textarea.placeholder = "Fico indo e voltando sobre...";
    }
    this.els.textarea.focus();
  }

  // ─── Submit Handler ───

  private async handleSubmit(): Promise<void> {
    const text = this.els.textarea.value.trim();
    if (!text) {
      this.els.hint.classList.remove('hidden');
      return;
    }
    this.hideWelcome();

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
    } else if (this.state === 'awaiting-additional') {
      // User added more context before memo generation
      this.journey.additionalContext = (this.journey.additionalContext || '') + '\n' + text;
      saveJourney(this.journey);
      this.appendResponse(text, isVoice);
      await delay(1000);
      this.generateAndShowMemo();
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

      const suggestedRoute = data.suggestedRoute || this.journey.route.filter((s: string) => s !== 'decision-memo');
      const frameworkReasons: Record<string, string> = data.frameworkReasons || {};

      await this.streamReflection(
        `Entendi. Parece que o que torna isso difícil é ${description}.`,
        [],
        'intake'
      );

      await delay(1500);
      this.showFrameworkPicker(suggestedRoute, frameworkReasons);
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
        "Vou te guiar por alguns exercícios pra te ajudar a pensar sobre isso.",
        [], 'intake'
      );
      await delay(1500);
      const fallbackRoute = this.journey.route.filter(s => s !== 'decision-memo');
      this.showFrameworkPicker(fallbackRoute, {});
    }
  }

  // ─── Framework Picker ───

  private showFrameworkPicker(
    suggestedRoute: string[],
    frameworkReasons: Record<string, string>,
  ): void {
    this.state = 'picking-frameworks';

    const picker = document.createElement('div');
    picker.className = 'copilot-block framework-picker';

    const intro = document.createElement('p');
    intro.className = 'framework-picker-intro';
    intro.textContent = "Aqui está o que eu sugiro:";
    picker.appendChild(intro);

    const selected = new Set(suggestedRoute.filter(s => s !== 'decision-memo'));

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

      const activity = document.createElement('div');
      activity.className = 'framework-card-activity';
      activity.textContent = mod.activity;

      content.appendChild(title);
      content.appendChild(tagline);
      content.appendChild(activity);

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

    suggestedRoute.forEach(slug => renderCard(slug, picker));

    const otherSlugs = PICKABLE_MODULES.filter(s => !suggestedRoute.includes(s));
    if (otherSlugs.length > 0) {
      const toggleBtn = document.createElement('button');
      toggleBtn.className = 'framework-explore-toggle';
      toggleBtn.textContent = '▸ explorar mais frameworks';

      const exploreList = document.createElement('div');
      exploreList.className = 'framework-explore-list';

      otherSlugs.forEach(slug => renderCard(slug, exploreList));

      toggleBtn.addEventListener('click', () => {
        const isOpen = exploreList.classList.toggle('open');
        toggleBtn.textContent = isOpen ? '▾ esconder' : '▸ explorar mais frameworks';
      });

      picker.appendChild(toggleBtn);
      picker.appendChild(exploreList);
    }

    const actions = document.createElement('div');
    actions.className = 'framework-picker-actions';

    const startBtn = document.createElement('button');
    startBtn.className = 'btn-primary';
    startBtn.textContent = 'começar jornada →';

    const hint = document.createElement('span');
    hint.className = 'framework-picker-hint';

    const updateStartButton = () => {
      if (selected.size < 2) {
        startBtn.disabled = true;
        hint.textContent = 'selecione pelo menos 2 frameworks';
      } else {
        startBtn.disabled = false;
        hint.textContent = '';
      }
    };
    updateStartButton();

    startBtn.addEventListener('click', () => {
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

  // ─── Progress Bar ───

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

    this.els.timeline.parentElement?.insertBefore(bar, this.els.timeline);
    this.progressBarEl = bar;
    this.updateProgressBar();
  }

  private updateProgressBar(): void {
    if (!this.progressBarEl) return;
    const route = this.journey.route.filter(s => s !== 'decision-memo');
    const currentIdx = this.currentModuleIndex;

    this.progressBarEl.querySelectorAll('.progress-dot').forEach((dot) => {
      const idx = parseInt((dot as HTMLElement).dataset.index || '0');
      dot.classList.toggle('done', idx < currentIdx);
      dot.classList.toggle('current', idx === currentIdx);
    });

    this.progressBarEl.querySelectorAll('.progress-connector').forEach((conn) => {
      const idx = parseInt((conn as HTMLElement).dataset.index || '0');
      conn.classList.toggle('done', idx < currentIdx);
    });

    const label = this.progressBarEl.querySelector('.progress-label');
    if (label) {
      if (currentIdx >= route.length) {
        label.textContent = '✓ Tudo completo';
      } else {
        const mod = MODULES[route[currentIdx]];
        label.textContent = `Passo ${currentIdx + 1} de ${route.length}: ${mod?.title || ''}`;
      }
    }
  }

  // ─── Module Flow ───

  private showNextQuestion(): void {
    this.updateProgressBar();
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

      // Include previous responses from this same module for context
      const currentModuleResponses = this.journey.moduleResponses[moduleSlug] || [];
      const priorStepResponses = currentModuleResponses
        .slice(0, this.currentStepIndex)
        .map((r, i) => `Step ${i + 1}: ${r}`)
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
        }),
      });

      const data = await res.json();
      this.removeBlock(thinkingBlock);

      if (data.insight && !data.fallback) {
        // If the AI says the response needs more detail, show the insight
        // as an invitation and DON'T advance to the next step
        if (data.needsMore) {
          await this.streamReflection(data.insight, data.themes || [], mod.layer);
          this.state = 'awaiting-input';
          this.els.textarea.placeholder = 'respire fundo e tente de novo...';
          this.els.textarea.focus();
          this.scrollToBottom();
          return; // Don't increment step - let them try again
        }

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
        "Não consegui refletir sobre isso - mas sua resposta está salva. Vamos continuar.",
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
    this.updateProgressBar();

    if (this.currentModuleIndex >= this.journey.route.length) {
      this.showPreMemoPrompt();
      return;
    }

    const nextSlug = this.journey.route[this.currentModuleIndex];
    const nextMod = MODULES[nextSlug];
    this.state = 'transitioning';

    const transitionDiv = document.createElement('div');
    const summary = this.journey.moduleSummaries[mod.slug];
    transitionDiv.innerHTML = `
      <div class="copilot-module-transition">
        <span>✓ ${escapeHtml(mod.title)} completo</span>
      </div>
    `;
    this.els.timeline.appendChild(transitionDiv);

    if (nextMod) {
      const actionDiv = document.createElement('div');
      actionDiv.className = 'copilot-block';
      actionDiv.style.cssText = 'text-align:center;padding:1rem 0';

      const desc = document.createElement('p');
      desc.style.cssText = 'font-family:var(--serif);color:var(--ink-light);margin-bottom:1rem';
      desc.innerHTML = `Próximo: <strong>${escapeHtml(nextMod.title)}</strong> - ${escapeHtml(nextMod.description)}`;
      actionDiv.appendChild(desc);

      const btnRow = document.createElement('div');
      btnRow.style.cssText = 'display:flex;gap:1rem;justify-content:center';

      const continueBtn = document.createElement('button');
      continueBtn.className = 'btn-primary';
      continueBtn.textContent = 'continuar →';
      continueBtn.addEventListener('click', () => {
        continueBtn.disabled = true;
        this.showNextQuestion();
      });

      const pauseBtn = document.createElement('button');
      pauseBtn.className = 'btn-secondary';
      pauseBtn.textContent = 'salvar e voltar depois';
      pauseBtn.addEventListener('click', () => {
        saveJourney(this.journey);
        this.els.timeline.insertAdjacentHTML('beforeend', `
          <div class="copilot-block" style="text-align:center;padding:2rem 0">
            <h3 style="font-family:var(--serif);font-size:1.3rem;margin-bottom:.5rem">Salvo</h3>
            <p style="color:var(--ink-muted)">Volte quando quiser. Vou lembrar de onde você parou.</p>
          </div>
        `);
        this.scrollToBottom();
      });

      btnRow.appendChild(continueBtn);
      btnRow.appendChild(pauseBtn);
      actionDiv.appendChild(btnRow);
      this.els.timeline.appendChild(actionDiv);
    }
    this.scrollToBottom();
  }

  // ─── Pre-Memo Prompt ───

  private showPreMemoPrompt(): void {
    this.state = 'transitioning';

    const transitionDiv = document.createElement('div');
    transitionDiv.innerHTML = `
      <div class="copilot-module-transition">
        <span>✓ todos os exercícios completos</span>
      </div>
    `;
    this.els.timeline.appendChild(transitionDiv);

    const block = document.createElement('div');
    block.className = 'copilot-block';
    block.style.cssText = 'text-align:center;padding:1.5rem 0';

    const question = document.createElement('p');
    question.style.cssText = 'font-family:var(--serif);font-size:1.15rem;color:var(--ink);margin-bottom:0.5rem';
    question.textContent = "Antes de compilar seu Memo de Decisão - tem mais alguma coisa que gostaria de acrescentar?";

    const hint = document.createElement('p');
    hint.style.cssText = 'font-family:var(--serif);font-size:0.95rem;color:var(--ink-muted);font-style:italic;margin-bottom:1.5rem';
    hint.textContent = "Algo que você ainda não disse, um sentimento que surgiu, ou um contexto que pode mudar tudo.";

    const btnRow = document.createElement('div');
    btnRow.style.cssText = 'display:flex;gap:1rem;justify-content:center;flex-wrap:wrap';

    const addMoreBtn = document.createElement('button');
    addMoreBtn.className = 'btn-secondary';
    addMoreBtn.textContent = 'sim, quero acrescentar algo';
    addMoreBtn.addEventListener('click', () => {
      block.remove();
      this.state = 'awaiting-additional';
      this.appendQuestion(
        "O que mais gostaria de acrescentar?",
        "Qualquer coisa - um pensamento, um medo, uma esperança, algo que segurou antes. Isso vai pro seu memo.",
        'act'
      );
      this.els.textarea.placeholder = 'tem mais uma coisa que quero dizer...';
      this.els.textarea.focus();
      this.scrollToBottom();
    });

    const generateBtn = document.createElement('button');
    generateBtn.className = 'btn-primary';
    generateBtn.textContent = 'estou pronto - gerar meu memo';
    generateBtn.addEventListener('click', () => {
      generateBtn.disabled = true;
      this.generateAndShowMemo();
    });

    btnRow.appendChild(addMoreBtn);
    btnRow.appendChild(generateBtn);

    block.appendChild(question);
    block.appendChild(hint);
    block.appendChild(btnRow);
    this.els.timeline.appendChild(block);
    this.scrollToBottom();
  }

  // ─── Memo Generation ───

  private async generateAndShowMemo(): Promise<void> {
    this.state = 'generating-memo';

    const loading = document.createElement('div');
    loading.className = 'copilot-block copilot-loading';
    loading.innerHTML = `
      <p class="copilot-loading-text">compilando tudo que você explorou...</p>
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
          additionalContext: this.journey.additionalContext || undefined,
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
        <h2>Seu Memo de Decisão</h2>
        <p class="copilot-memo-date">${new Date(m.generatedAt).toLocaleDateString('pt-BR', { year: 'numeric', month: 'long', day: 'numeric' })}</p>
        ${section('A Decisão', m.situation)}
        ${section('O que tornava difícil', m.classification)}
        ${section('O que seu corpo disse', m.bodyInsights)}
        ${section('O conflito interno', m.identityInsights)}
        ${section('Fatos vs suposições', m.rationalInsights)}
        ${section('Suas opções reais', m.options)}
        ${section('Trade-offs', m.tradeoffs)}
        ${section('A clareza emergente', m.gutFeeling)}
        ${section('Seu próximo passo', m.nextStep, 'memo-next-step')}
        ${section('Perguntas pra sentar com', m.openQuestions)}
        <div class="copilot-memo-actions">
          <button class="btn-secondary" id="copilot-copy">copiar memo</button>
          <button class="btn-secondary" id="copilot-download">baixar</button>
          <button class="btn-secondary" id="copilot-new">nova decisão</button>
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
        <h2>Seu Memo de Decisão</h2>
        <div class="memo-section"><h3>A Decisão</h3><p>${escapeHtml(this.journey.situation)}</p></div>
        ${sections}
        <div class="copilot-memo-actions">
          <button class="btn-secondary" id="copilot-copy">copiar memo</button>
          <button class="btn-secondary" id="copilot-new">nova decisão</button>
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
      btn.textContent = 'copiado ✓';
      setTimeout(() => btn.textContent = 'copiar memo', 3500);
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
    document.getElementById('copilot-new')?.addEventListener('click', () => {
      if (confirm('Tem certeza? Seu progresso atual será perdido.')) {
        this.restart();
      }
    });
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
        <div class="speaker">copiloto</div>
        <p>${escapeHtml(text)}</p>
        ${guidance ? `<p class="guidance">${escapeHtml(guidance)}</p>` : ''}
      </div>
    `;
    this.els.timeline.appendChild(block);
    this.blockLayers.push(layer);
    this.updateBreathingLine();
  }

  private appendResponse(text: string, isVoice: boolean, dimmed = false): HTMLElement {
    const block = document.createElement('div');
    block.className = `copilot-block${dimmed ? ' dimmed' : ''}`;

    const responseDiv = document.createElement('div');
    responseDiv.className = 'copilot-response';

    const p = document.createElement('p');
    p.textContent = text;
    responseDiv.appendChild(p);

    if (isVoice) {
      responseDiv.insertAdjacentHTML('beforeend', '<div class="meta"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z"/><path d="M19 10v2a7 7 0 0 1-14 0v-2"/><line x1="12" y1="19" x2="12" y2="23"/></svg>voice</div>');
    }

    if (!dimmed) {
      const editBtn = document.createElement('button');
      editBtn.className = 'copilot-edit-btn';
      editBtn.textContent = 'edit';
      editBtn.addEventListener('click', () => {
        this.editResponse(block, text);
      });
      responseDiv.appendChild(editBtn);
    }

    block.appendChild(responseDiv);
    this.els.timeline.appendChild(block);
    this.updateBreathingLine();
    this.scrollToBottom();
    return block;
  }

  private editResponse(responseBlock: HTMLElement, originalText: string): void {
    if (this.state === 'processing' || this.state === 'classifying') return;

    // Find which step this response belongs to
    const moduleSlug = this.journey.route[this.currentModuleIndex];

    // Remove everything after this response block (reflection + subsequent blocks)
    let nextSibling = responseBlock.nextElementSibling;
    while (nextSibling) {
      const toRemove = nextSibling;
      nextSibling = nextSibling.nextElementSibling;
      toRemove.remove();
    }

    // Go back one step
    this.currentStepIndex = Math.max(0, this.currentStepIndex - 1);
    this.journey.currentStepIndex = this.currentStepIndex;

    // Remove the response block itself
    responseBlock.remove();

    // Pre-fill the textarea with the original text
    this.els.textarea.value = originalText;
    this.els.sendBtn.disabled = false;
    this.state = 'awaiting-input';
    this.els.textarea.focus();

    saveJourney(this.journey);
  }

  private appendThinking(): HTMLElement {
    const block = document.createElement('div');
    block.className = 'copilot-block';
    block.innerHTML = `
      <div class="copilot-reflection">
        <div class="marker">✦ reflexão</div>
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
    reflDiv.innerHTML = '<div class="marker">✦ reflexão</div>';

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
        <div class="marker">✦ reflexão</div>
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
    const labels: Record<string, string> = { feel: 'SENTIR', see: 'VER', think: 'PENSAR', act: 'AGIR' };
    const currentMod = this.currentModuleIndex < this.journey.route.length
      ? MODULES[this.journey.route[this.currentModuleIndex]] : null;

    const doneLayers = new Set<string>();
    for (let i = 0; i < this.currentModuleIndex; i++) {
      const m = MODULES[this.journey.route[i]];
      if (m) doneLayers.add(m.layer);
    }

    header.innerHTML = layers.map(l =>
      `<div class="layer-dot ${l} ${doneLayers.has(l) ? 'done' : ''} ${l === currentLayer ? 'active' : ''}"></div>`
    ).join('') + `<span class="layer-label">${labels[currentLayer] || ''} - ${currentMod?.title || ''}</span>`;
  }

  private scrollToBottom(): void {
    requestAnimationFrame(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    });
  }

  private memoToText(): string {
    const m = this.journey.memo!;
    return [
      `MEMO DE DECISÃO - ${new Date(m.generatedAt).toLocaleDateString('pt-BR')}`, '',
      `A DECISÃO: ${m.situation}`,
      `O QUE TORNAVA DIFÍCIL: ${m.classification}`,
      m.bodyInsights ? `SINAIS DO CORPO: ${m.bodyInsights}` : '',
      m.identityInsights ? `CONFLITO INTERNO: ${m.identityInsights}` : '',
      m.rationalInsights ? `FATOS VS SUPOSIÇÕES: ${m.rationalInsights}` : '',
      m.options ? `OPÇÕES: ${m.options}` : '',
      m.tradeoffs ? `TRADE-OFFS: ${m.tradeoffs}` : '',
      m.gutFeeling ? `CLAREZA EMERGENTE: ${m.gutFeeling}` : '',
      m.nextStep ? `PRÓXIMO PASSO: ${m.nextStep}` : '',
      m.openQuestions ? `PERGUNTAS PRA SENTAR COM: ${m.openQuestions}` : '',
      '', '- Gerado pelo May Copiloto de Decisão',
    ].filter(Boolean).join('\n\n');
  }
}

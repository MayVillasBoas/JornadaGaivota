
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

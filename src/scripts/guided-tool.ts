// ─── Types ───

interface FieldMapping {
  input: string;
  output: string;
}

interface ToolConfig {
  slug: string;
  totalSteps: number;
  fields: FieldMapping[];
  encouragements: string[];
  closingReflection: string;
  resultTitle: string;
  visualConfig: VisualConfig;
}

interface VisualConfig {
  type: string; // e.g. 'decision-xray', 'fear-map', 'three-paths', etc.
  sections: VisualSection[];
}

interface VisualSection {
  id: string;
  label: string;
  stepRange: number[]; // which steps feed into this section
  wordClass: string;   // CSS class for word styling
}

interface AIResponse {
  insight: string | null;
  themes: string[];
  visualData: Record<string, any>;
  fallback?: boolean;
}

// ─── GuidedTool Class ───

export class GuidedTool {
  private config: ToolConfig;
  private currentStep: number = 0;
  private steps: NodeListOf<Element>;
  private insightsCollected: Record<number, string> = {};
  private themesCollected: Record<number, string[]> = {};
  private saveTimeout: number | null = null;
  private isTransitioning: boolean = false;

  constructor(config: ToolConfig) {
    this.config = config;
    this.steps = document.querySelectorAll('.step');
  }

  init(): void {
    this.wireNavigation();
    this.wireAutoSave();
    this.wireTextareaHints();
    this.checkResume();
    this.updateProgressBar();
  }

  // ─── Navigation ───

  private wireNavigation(): void {
    document.querySelectorAll('.step-next').forEach(btn => {
      btn.addEventListener('click', () => this.nextStep());
    });
    document.querySelectorAll('.step-prev').forEach(btn => {
      btn.addEventListener('click', () => this.prevStep());
    });
    document.getElementById('finish-btn')?.addEventListener('click', () => this.finish());
    document.getElementById('restart-btn')?.addEventListener('click', () => this.restart());
  }

  private async nextStep(): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const userText = this.getAllStepText();

    // Save state
    this.saveState();

    // Get AI insight (or fallback)
    if (this.currentStep >= 1 && userText.trim()) {
      try {
        await this.processWithAI(userText);
      } catch {
        this.pendingInsight = null;
      }
    }

    // Animate transition
    const oldStep = this.currentStep;
    this.currentStep++;
    await this.animateTransition(oldStep, this.currentStep, 'forward');

    // Show insight or encouragement on next step
    this.showFeedback();

    this.updateProgressBar();
    this.scrollToTop();
    this.isTransitioning = false;

    // Notify fractal canvas of step change
    document.dispatchEvent(new CustomEvent('tool-step-change', { detail: { step: this.currentStep } }));
  }

  private async prevStep(): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    const oldStep = this.currentStep;
    this.currentStep--;
    await this.animateTransition(oldStep, this.currentStep, 'backward');

    this.updateProgressBar();
    this.scrollToTop();
    this.isTransitioning = false;
  }

  private async animateTransition(from: number, to: number, direction: 'forward' | 'backward'): Promise<void> {
    const fromEl = this.steps[from];
    const toEl = this.steps[to];
    if (!fromEl || !toEl) return;

    // Exit animation
    fromEl.classList.remove('active');
    fromEl.classList.add(direction === 'forward' ? 'exiting-up' : 'exiting-down');

    // Brief pause at midpoint
    await this.delay(200);

    // Enter animation
    toEl.classList.add('active');

    // Clean up exit
    await this.delay(300);
    fromEl.classList.remove('exiting-up', 'exiting-down');
  }

  // ─── AI Integration ───

  private async processWithAI(userText: string): Promise<void> {
    // Show transition screen
    this.showTransitionScreen();

    try {
      const previousAnswers: Record<string, string> = {};
      this.config.fields.forEach(f => {
        const ta = document.getElementById(f.input) as HTMLTextAreaElement;
        if (ta?.value) previousAnswers[f.input] = ta.value;
      });

      const stepLabel = this.getStepLabel(this.currentStep);

      const response = await fetch('/api/reflect', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tool: this.config.slug,
          step: this.currentStep,
          stepLabel,
          userText,
          previousAnswers,
          framework: '',
        }),
      });

      const data: AIResponse = await response.json();

      if (data.insight && !data.fallback) {
        this.insightsCollected[this.currentStep] = data.insight;
        this.themesCollected[this.currentStep] = data.themes;
        this.updateVisual(data.themes, data.visualData, this.currentStep);
        this.pendingInsight = data.insight;
        document.dispatchEvent(new CustomEvent('tool-insight-received'));
      } else {
        this.pendingInsight = null;
      }
    } catch {
      this.pendingInsight = null;
    }

    this.hideTransitionScreen();
  }

  private pendingInsight: string | null = null;

  private showFeedback(): void {
    const insightEl = this.steps[this.currentStep]?.querySelector('.ai-insight') as HTMLElement;
    const encouragementEl = this.steps[this.currentStep]?.querySelector('.step-encouragement') as HTMLElement;

    if (this.pendingInsight && insightEl) {
      // Show AI insight
      const textEl = insightEl.querySelector('.ai-insight-text');
      if (textEl) textEl.textContent = this.pendingInsight;

      // Gamification: variable reward — random visual treatment
      insightEl.classList.remove('insight-highlighted', 'insight-breakthrough');
      const roll = Math.random();
      if (roll < 0.1) {
        insightEl.classList.add('insight-breakthrough');
      } else if (roll < 0.4) {
        insightEl.classList.add('insight-highlighted');
      }

      setTimeout(() => insightEl.classList.add('visible'), 100);

      // Hide encouragement if present
      if (encouragementEl) encouragementEl.style.display = 'none';
    } else if (encouragementEl) {
      // Show static encouragement as fallback
      const phrase = this.config.encouragements[this.currentStep] || '';
      if (phrase) {
        encouragementEl.textContent = phrase;
        setTimeout(() => encouragementEl.classList.add('visible'), 100);

        // Auto-hide after 4s
        setTimeout(() => encouragementEl.classList.remove('visible'), 4000);
      }

      // Hide insight box if present
      if (insightEl) insightEl.style.display = 'none';
    }
  }

  // ─── Visual Artifact ───

  private updateVisual(themes: string[], visualData: Record<string, any>, step: number): void {
    // Find which section this step belongs to
    const section = this.config.visualConfig.sections.find(
      s => s.stepRange.includes(step)
    );
    if (!section) return;

    // Dispatch event for fractal viz to handle theme word placement
    document.dispatchEvent(new CustomEvent('tool-visual-update', {
      detail: { themes, wordClass: section.wordClass, sectionLabel: section.label, step },
    }));
  }

  // ─── Transition Screen ───

  private showTransitionScreen(): void {
    const screen = document.querySelector('.transition-screen');
    if (screen) screen.classList.add('active');
  }

  private hideTransitionScreen(): void {
    const screen = document.querySelector('.transition-screen');
    if (screen) screen.classList.remove('active');
  }

  // ─── Progress (handled by fractal viz via events) ───

  private updateProgressBar(): void {
    // Progress is now shown by the fractal viz growth + step dots
    // No separate progress bar to update
  }

  // ─── Textarea Hints ───

  private wireTextareaHints(): void {
    // Subtle visual hint on next button when textarea is empty
    document.querySelectorAll('textarea').forEach(ta => {
      const step = ta.closest('.step');
      const nextBtn = step?.querySelector('.step-next') as HTMLElement;
      if (!nextBtn) return;

      const updateHint = () => {
        if ((ta as HTMLTextAreaElement).value.trim() === '') {
          nextBtn.classList.add('btn-next-hint');
        } else {
          nextBtn.classList.remove('btn-next-hint');
        }
      };

      ta.addEventListener('input', updateHint);
      updateHint();
    });
  }

  // ─── Finish / Results ───

  private async finish(): Promise<void> {
    if (this.isTransitioning) return;
    this.isTransitioning = true;

    // Process last step with AI
    const userText = this.getAllStepText();
    if (userText.trim()) {
      await this.processWithAI(userText);
    }

    // Hide current step
    const currentEl = this.steps[this.currentStep];
    if (currentEl) {
      currentEl.classList.remove('active');
      currentEl.classList.add('exiting-up');
    }

    // Show completion breath
    await this.showCompletionBreath();

    // Populate results
    this.populateResults();

    // Show result step
    const resultStep = document.querySelector('[data-step="result"]');
    if (resultStep) {
      resultStep.classList.add('active');
    }

    // Clean up exit
    if (currentEl) currentEl.classList.remove('exiting-up');

    // Notify fractal to bloom
    document.dispatchEvent(new CustomEvent('tool-bloom'));

    // Stagger reveal of result blocks
    await this.delay(300);
    this.revealResults();

    // Save completion
    this.saveCompletion();

    this.scrollToTop();
    this.isTransitioning = false;
  }

  private async showCompletionBreath(): Promise<void> {
    const breath = document.querySelector('.completion-breath');
    if (!breath) return;

    breath.classList.add('active');

    const textEl = breath.querySelector('.breath-text') as HTMLElement;
    if (textEl) {
      textEl.textContent = '...';
      await this.delay(300);
      textEl.classList.add('visible');
      await this.delay(1500);
      textEl.textContent = 'Done.';
      await this.delay(1000);
      textEl.classList.remove('visible');
    }

    await this.delay(300);
    breath.classList.remove('active');
  }

  private populateResults(): void {
    this.config.fields.forEach(f => {
      const ta = document.getElementById(f.input) as HTMLTextAreaElement;
      const result = document.getElementById(f.output);
      if (result && ta) {
        result.textContent = ta.value || '(not filled)';
      }

      // Add AI insight below each result if available
      const stepNum = parseInt(f.input.replace(/\D/g, ''));
      const insight = this.insightsCollected[stepNum];
      if (insight && result?.parentElement) {
        const existing = result.parentElement.querySelector('.result-insight');
        if (!existing) {
          const insightP = document.createElement('p');
          insightP.className = 'result-insight';
          insightP.textContent = `✦ ${insight}`;
          result.parentElement.appendChild(insightP);
        }
      }
    });
  }

  private revealResults(): void {
    const blocks = document.querySelectorAll('.result-block');
    blocks.forEach((block, i) => {
      setTimeout(() => block.classList.add('revealed'), i * 400);
    });

    // Reveal reflection prompt
    const reflectionPrompt = document.querySelector('.reflection-prompt');
    if (reflectionPrompt) {
      setTimeout(() => reflectionPrompt.classList.add('revealed'), blocks.length * 400 + 500);
    }

    // Reveal counter
    const counter = document.querySelector('.reflection-counter');
    if (counter) {
      const count = this.getReflectionCount();
      counter.textContent = `This was your ${count}th reflection on Unfold.`;
      setTimeout(() => counter.classList.add('revealed'), blocks.length * 400 + 800);
    }
  }

  private restart(): void {
    document.querySelectorAll('textarea').forEach(ta => (ta as HTMLTextAreaElement).value = '');
    document.querySelectorAll('.ai-insight').forEach(el => el.classList.remove('visible'));
    document.querySelectorAll('.result-block').forEach(el => el.classList.remove('revealed'));
    document.querySelectorAll('.result-insight').forEach(el => el.remove());
    document.querySelector('.reflection-prompt')?.classList.remove('revealed');
    document.querySelector('.reflection-counter')?.classList.remove('revealed');

    // Reset visual — clear theme words from fractal viz
    const wordsOverlay = document.querySelector('.fractal-viz-words');
    if (wordsOverlay) {
      wordsOverlay.innerHTML = '';
    }

    this.insightsCollected = {};
    this.themesCollected = {};
    this.currentStep = 0;
    this.clearState();

    this.steps.forEach(s => {
      s.classList.remove('active', 'exiting-up', 'exiting-down');
    });
    this.steps[0]?.classList.add('active');
    this.scrollToTop();
  }

  // ─── Persistence ───

  private wireAutoSave(): void {
    document.querySelectorAll('textarea').forEach(ta => {
      ta.addEventListener('input', () => {
        if (this.saveTimeout) clearTimeout(this.saveTimeout);
        this.saveTimeout = window.setTimeout(() => this.saveState(), 500);
      });
    });
  }

  private saveState(): void {
    const answers: Record<string, string> = {};
    this.config.fields.forEach(f => {
      const ta = document.getElementById(f.input) as HTMLTextAreaElement;
      if (ta?.value) answers[f.input] = ta.value;
    });

    try {
      localStorage.setItem(`may-tool-${this.config.slug}`, JSON.stringify({
        slug: this.config.slug,
        currentStep: this.currentStep,
        answers,
        insights: this.insightsCollected,
        themes: this.themesCollected,
        lastSaved: new Date().toISOString(),
        completed: false,
      }));
    } catch { /* localStorage unavailable */ }
  }

  private saveCompletion(): void {
    try {
      // Mark as completed
      const saved = localStorage.getItem(`may-tool-${this.config.slug}`);
      if (saved) {
        const data = JSON.parse(saved);
        data.completed = true;
        localStorage.setItem(`may-tool-${this.config.slug}`, JSON.stringify(data));
      }

      // Increment reflection count
      const count = parseInt(localStorage.getItem('may-reflection-count') || '0');
      localStorage.setItem('may-reflection-count', String(count + 1));
    } catch { /* localStorage unavailable */ }
  }

  private getReflectionCount(): number {
    try {
      return parseInt(localStorage.getItem('may-reflection-count') || '1');
    } catch {
      return 1;
    }
  }

  private clearState(): void {
    try {
      localStorage.removeItem(`may-tool-${this.config.slug}`);
    } catch { /* */ }
  }

  private checkResume(): void {
    try {
      const saved = localStorage.getItem(`may-tool-${this.config.slug}`);
      if (!saved) return;

      const data = JSON.parse(saved);
      if (data.completed || !data.answers || Object.keys(data.answers).length === 0) return;

      // Show resume prompt
      const prompt = document.querySelector('.resume-prompt') as HTMLElement;
      if (!prompt) return;

      const dateStr = new Date(data.lastSaved).toLocaleDateString('en-US', {
        day: 'numeric', month: 'long',
      });

      const pEl = prompt.querySelector('p');
      if (pEl) pEl.textContent = `You started this exercise on ${dateStr}. Want to continue where you left off?`;

      prompt.classList.add('visible');

      prompt.querySelector('.btn-resume')?.addEventListener('click', () => {
        // Restore answers
        Object.entries(data.answers).forEach(([id, val]) => {
          const ta = document.getElementById(id) as HTMLTextAreaElement;
          if (ta) ta.value = val as string;
        });

        // Restore insights and themes
        if (data.insights) this.insightsCollected = data.insights;
        if (data.themes) this.themesCollected = data.themes;

        // Jump to saved step
        this.currentStep = data.currentStep;
        this.steps.forEach(s => s.classList.remove('active'));
        this.steps[this.currentStep]?.classList.add('active');
        this.updateProgressBar();

        prompt.classList.remove('visible');
      });

      prompt.querySelector('.btn-restart')?.addEventListener('click', () => {
        this.clearState();
        prompt.classList.remove('visible');
      });
    } catch { /* localStorage unavailable */ }
  }

  // ─── Export ───

  static wireExport(config: ToolConfig): void {
    document.getElementById('copy-btn')?.addEventListener('click', () => {
      const text = GuidedTool.buildExportText(config);
      navigator.clipboard.writeText(text).then(() => {
        const btn = document.getElementById('copy-btn');
        if (btn) {
          const original = btn.textContent;
          btn.textContent = 'copied ✓';
          btn.classList.add('btn-copied');
          setTimeout(() => {
            btn.textContent = original;
            btn.classList.remove('btn-copied');
          }, 2000);
        }
      });
    });

    document.getElementById('download-btn')?.addEventListener('click', () => {
      const text = GuidedTool.buildExportText(config);
      const date = new Date().toISOString().split('T')[0];
      const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${config.slug}-${date}.txt`;
      a.click();
      URL.revokeObjectURL(url);
    });

    document.getElementById('save-journal-btn')?.addEventListener('click', () => {
      try {
        const answers: Record<string, string> = {};
        config.fields.forEach(f => {
          const ta = document.getElementById(f.input) as HTMLTextAreaElement;
          if (ta?.value) answers[f.input] = ta.value;
        });

        const journal = JSON.parse(localStorage.getItem('may-journal') || '[]');
        journal.push({
          slug: config.slug,
          toolName: config.resultTitle,
          answers,
          completedAt: new Date().toISOString(),
        });
        localStorage.setItem('may-journal', JSON.stringify(journal));

        const btn = document.getElementById('save-journal-btn');
        if (btn) {
          btn.textContent = 'saved ✓';
          btn.classList.add('btn-saved');
          (btn as HTMLButtonElement).disabled = true;
        }
      } catch { /* localStorage unavailable */ }
    });
  }

  private static buildExportText(config: ToolConfig): string {
    const date = new Date().toLocaleDateString('en-US', {
      day: 'numeric', month: 'long', year: 'numeric',
    });

    let text = `${config.resultTitle.toUpperCase()}\nCompleted on ${date}\n\n---\n\n`;

    config.fields.forEach(f => {
      const resultEl = document.getElementById(f.output);
      const h3 = resultEl?.parentElement?.querySelector('h3');
      const label = h3?.textContent || f.output;
      const value = resultEl?.textContent || '(not filled)';
      text += `${label.toUpperCase()}\n${value}\n\n`;

      // Add insight if present
      const insightEl = resultEl?.parentElement?.querySelector('.result-insight');
      if (insightEl) {
        text += `${insightEl.textContent}\n\n`;
      }
    });

    text += '---\n\nmay.com/ferramentas';
    return text;
  }

  // ─── Helpers ───

  private getCurrentTextarea(): HTMLTextAreaElement | null {
    const step = this.steps[this.currentStep];
    return step?.querySelector('textarea') as HTMLTextAreaElement;
  }

  private getAllStepText(): string {
    const step = this.steps[this.currentStep];
    if (!step) return '';
    const textareas = step.querySelectorAll('textarea');
    if (textareas.length <= 1) {
      return (textareas[0] as HTMLTextAreaElement)?.value || '';
    }
    // Multiple textareas in one step (e.g. tres-futuros step 4)
    return Array.from(textareas)
      .map(ta => (ta as HTMLTextAreaElement).value)
      .filter(v => v.trim())
      .join('\n\n');
  }

  private getStepLabel(step: number): string {
    const stepEl = this.steps[step];
    const h2 = stepEl?.querySelector('h2');
    return h2?.textContent || `Step ${step}`;
  }

  private scrollToTop(): void {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}

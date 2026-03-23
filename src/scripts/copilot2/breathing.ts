// src/scripts/copilot2/breathing.ts - Breathing circle animation

export class BreathingCircle {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private animFrame: number | null = null;
  private phase: 'inhale' | 'hold' | 'exhale' = 'inhale';
  private progress = 0;
  private running = false;
  private cycleCount = 0;
  private maxCycles = 0;
  private onComplete: (() => void) | null = null;

  // Timing (ms)
  private inhaleTime = 4000;
  private holdTime = 2000;
  private exhaleTime = 6000;

  // Visual
  private minRadius = 40;
  private maxRadius = 80;
  private color = 'rgba(194, 122, 90, 0.6)'; // --feel-color with alpha

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.canvas.getBoundingClientRect();
    this.canvas.width = rect.width * dpr;
    this.canvas.height = rect.height * dpr;
    this.ctx.scale(dpr, dpr);
  }

  /**
   * Run N breathing cycles, then resolve
   */
  async breathe(cycles: number): Promise<void> {
    this.maxCycles = cycles;
    this.cycleCount = 0;
    this.phase = 'inhale';
    this.progress = 0;
    this.running = true;

    return new Promise<void>((resolve) => {
      this.onComplete = resolve;
      this.lastTime = performance.now();
      this.animate();
    });
  }

  stop(): void {
    this.running = false;
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  /**
   * Gentle idle pulse (no counting, runs until stopped)
   */
  startIdle(): void {
    this.maxCycles = Infinity;
    this.cycleCount = 0;
    this.phase = 'inhale';
    this.progress = 0;
    this.running = true;
    this.lastTime = performance.now();
    this.animate();
  }

  private lastTime = 0;

  private animate = (): void => {
    if (!this.running) return;

    const now = performance.now();
    const dt = now - this.lastTime;
    this.lastTime = now;

    // Advance phase
    const phaseTime = this.phase === 'inhale' ? this.inhaleTime
                    : this.phase === 'hold' ? this.holdTime
                    : this.exhaleTime;

    this.progress += dt;

    if (this.progress >= phaseTime) {
      this.progress = 0;
      if (this.phase === 'inhale') {
        this.phase = 'hold';
      } else if (this.phase === 'hold') {
        this.phase = 'exhale';
      } else {
        this.phase = 'inhale';
        this.cycleCount++;
        if (this.cycleCount >= this.maxCycles) {
          this.running = false;
          this.clear();
          this.onComplete?.();
          return;
        }
      }
    }

    this.draw();
    this.animFrame = requestAnimationFrame(this.animate);
  };

  private draw(): void {
    const rect = this.canvas.getBoundingClientRect();
    const w = rect.width;
    const h = rect.height;
    const cx = w / 2;
    const cy = h / 2;

    this.ctx.clearRect(0, 0, w, h);

    // Calculate radius based on phase
    let t: number;
    if (this.phase === 'inhale') {
      t = this.easeInOutSine(this.progress / this.inhaleTime);
    } else if (this.phase === 'hold') {
      t = 1;
    } else {
      t = 1 - this.easeInOutSine(this.progress / this.exhaleTime);
    }

    const radius = this.minRadius + (this.maxRadius - this.minRadius) * t;

    // Outer glow
    const gradient = this.ctx.createRadialGradient(cx, cy, radius * 0.5, cx, cy, radius * 1.5);
    gradient.addColorStop(0, 'rgba(194, 122, 90, 0.15)');
    gradient.addColorStop(1, 'rgba(194, 122, 90, 0)');
    this.ctx.fillStyle = gradient;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius * 1.5, 0, Math.PI * 2);
    this.ctx.fill();

    // Main circle
    this.ctx.fillStyle = this.color;
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius, 0, Math.PI * 2);
    this.ctx.fill();

    // Inner lighter circle
    this.ctx.fillStyle = 'rgba(250, 250, 247, 0.1)';
    this.ctx.beginPath();
    this.ctx.arc(cx, cy, radius * 0.6, 0, Math.PI * 2);
    this.ctx.fill();

    // Phase text
    const phaseText = this.phase === 'inhale' ? 'breathe in...'
                    : this.phase === 'hold' ? 'hold...'
                    : 'breathe out...';
    this.ctx.fillStyle = 'rgba(250, 250, 247, 0.7)';
    this.ctx.font = '14px Inter, sans-serif';
    this.ctx.textAlign = 'center';
    this.ctx.textBaseline = 'middle';
    this.ctx.fillText(phaseText, cx, cy);
  }

  private clear(): void {
    const rect = this.canvas.getBoundingClientRect();
    this.ctx.clearRect(0, 0, rect.width, rect.height);
  }

  private easeInOutSine(t: number): number {
    return -(Math.cos(Math.PI * t) - 1) / 2;
  }

  setColor(color: string): void {
    this.color = color;
  }
}

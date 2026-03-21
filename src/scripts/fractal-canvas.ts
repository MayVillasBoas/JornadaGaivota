// src/scripts/fractal-canvas.ts
// Unified fractal visualization — inline, grows with steps, hosts theme words at nodes

export interface FractalConfig {
  type: 'spiral' | 'branch' | 'mixed';
  categoryColor: string;
  accentColors: string[];
  totalSteps: number;
}

export interface NodePosition {
  x: number;
  y: number;
  depth: number;
}

export class FractalCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private config: FractalConfig;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private currentStep = 0;
  private targetStep = 0;
  private raf = 0;
  private running = false;
  private growAnimation = 0;
  private time = 0;

  // Track latest branch tip positions for theme word placement
  private latestNodes: Map<number, NodePosition[]> = new Map();
  private onNodesUpdated: ((step: number, nodes: NodePosition[]) => void) | null = null;

  // Step dots
  private dotsContainer: HTMLElement | null = null;

  constructor(canvas: HTMLCanvasElement, config: FractalConfig) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.config = config;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.resize();

    window.addEventListener('resize', () => this.resize());

    document.addEventListener('tool-step-change', ((e: CustomEvent) => {
      this.setStep(e.detail.step);
    }) as EventListener);

    document.addEventListener('tool-bloom', (() => {
      this.bloom();
    }) as EventListener);
  }

  setDotsContainer(el: HTMLElement) {
    this.dotsContainer = el;
    this.renderDots();
  }

  setOnNodesUpdated(cb: (step: number, nodes: NodePosition[]) => void) {
    this.onNodesUpdated = cb;
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  start() {
    if (this.running) return;
    this.running = true;
    const animate = (t: number) => {
      if (!this.running) return;
      this.time = t;
      this.update(t);
      this.draw();
      this.raf = requestAnimationFrame(animate);
    };
    this.raf = requestAnimationFrame(animate);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  setStep(step: number) {
    this.targetStep = step;
    this.growAnimation = 0;
    this.renderDots();
  }

  bloom() {
    this.targetStep = this.config.totalSteps + 1;
    this.growAnimation = 0;
  }

  getNodePositions(step: number): NodePosition[] {
    return this.latestNodes.get(step) || [];
  }

  private update(_t: number) {
    if (this.currentStep !== this.targetStep) {
      this.growAnimation += 0.016;
      if (this.growAnimation >= 1) {
        this.growAnimation = 1;
        this.currentStep = this.targetStep;
      }
    }
  }

  private draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    // Reserve bottom 30px for step dots
    const drawHeight = this.height - 30;
    const cy = drawHeight / 2;

    const stepProgress = this.currentStep === this.targetStep
      ? this.currentStep
      : this.currentStep + this.easeOutCubic(this.growAnimation);

    const maxDepth = Math.floor(2 + (stepProgress / this.config.totalSteps) * 6);
    const partialDepth = 2 + (stepProgress / this.config.totalSteps) * 6;

    const isBloom = this.targetStep > this.config.totalSteps;

    // Collect node positions for current draw
    this._collectingNodes = true;
    this._currentNodes = [];

    // Scale lengths to inline dimensions
    const scale = Math.min(this.width, drawHeight) / 500;

    switch (this.config.type) {
      case 'branch':
        this.drawBranch(cx, cy + drawHeight * 0.3, -Math.PI / 2, drawHeight * 0.18, 0, maxDepth, partialDepth, isBloom);
        break;
      case 'spiral':
        this.drawSpiral(cx, cy, partialDepth, isBloom, scale);
        break;
      case 'mixed':
        this.drawSpiral(cx, cy, partialDepth * 0.7, isBloom, scale);
        this.drawBranch(cx, cy + drawHeight * 0.15, -Math.PI / 2, drawHeight * 0.1, 0, Math.max(0, maxDepth - 1), partialDepth * 0.8, isBloom);
        break;
    }

    // Draw seed dot at step 0
    if (stepProgress < 0.5) {
      const seedSize = 3 + Math.sin(this.time * 0.002) * 1;
      const glow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, seedSize * 3);
      glow.addColorStop(0, this.getColorForDepth(0, 0.3));
      glow.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, seedSize * 3, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this._collectingNodes = false;

    // Store nodes and notify if step just advanced
    if (this._currentNodes.length > 0 && this.currentStep > 0) {
      const stepKey = this.currentStep;
      if (!this.latestNodes.has(stepKey)) {
        this.latestNodes.set(stepKey, this._currentNodes.slice(0, 6));
        if (this.onNodesUpdated) {
          this.onNodesUpdated(stepKey, this.latestNodes.get(stepKey)!);
        }
      }
    }
  }

  // Node collection state
  private _collectingNodes = false;
  private _currentNodes: NodePosition[] = [];

  // ─── Branch Fractal ───────────────────────────────────────────────────────

  private drawBranch(
    x: number, y: number,
    angle: number, length: number,
    depth: number, maxDepth: number,
    partialDepth: number,
    isBloom: boolean,
  ) {
    if (depth > maxDepth || length < 2) return;

    const depthProgress = Math.min(1, Math.max(0, partialDepth - depth));
    if (depthProgress <= 0) return;

    const opacity = depthProgress * (0.15 + (1 - depth / 8) * 0.1);
    const color = this.getColorForDepth(depth, opacity);

    const sway = Math.sin(this.time * 0.0005 + depth * 1.5 + x * 0.01) * 3;

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    this.ctx.strokeStyle = color;
    this.ctx.lineWidth = Math.max(0.5, (1 - depth / 8) * 2.5);
    this.ctx.lineCap = 'round';
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);

    const midX = (x + endX) / 2 + sway;
    const midY = (y + endY) / 2;
    this.ctx.quadraticCurveTo(midX, midY, endX, endY);
    this.ctx.stroke();

    // Collect tip nodes for word placement
    if (this._collectingNodes && (depth === maxDepth || length < 4)) {
      this._currentNodes.push({ x: endX, y: endY, depth });
    }

    // Glow at branch tips
    if (depth === maxDepth || length < 4) {
      const glowSize = isBloom ? 6 : 3;
      const glowAlpha = isBloom ? opacity * 1.5 : opacity;
      const glow = this.ctx.createRadialGradient(endX, endY, 0, endX, endY, glowSize);
      glow.addColorStop(0, this.getColorForDepth(depth, glowAlpha));
      glow.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(endX, endY, glowSize, 0, Math.PI * 2);
      this.ctx.fill();
    }

    const shrink = 0.67 + Math.sin(depth * 2.3) * 0.05;
    const spreadAngle = 0.4 + depth * 0.05;

    this.drawBranch(endX, endY, angle - spreadAngle + sway * 0.01, length * shrink, depth + 1, maxDepth, partialDepth, isBloom);
    this.drawBranch(endX, endY, angle + spreadAngle + sway * 0.01, length * (shrink - 0.03), depth + 1, maxDepth, partialDepth, isBloom);

    if (depth % 3 === 0 && depth > 0) {
      this.drawBranch(endX, endY, angle + 0.1, length * shrink * 0.6, depth + 1, maxDepth, partialDepth, isBloom);
    }
  }

  // ─── Spiral Fractal ───────────────────────────────────────────────────────

  private drawSpiral(cx: number, cy: number, partialDepth: number, isBloom: boolean, scale: number) {
    const goldenRatio = (1 + Math.sqrt(5)) / 2;
    const maxTurns = 1 + partialDepth * 0.8;
    const totalPoints = Math.floor(maxTurns * 60);

    if (totalPoints <= 0) return;

    let prevX = cx;
    let prevY = cy;

    for (let i = 0; i <= totalPoints; i++) {
      const t = (i / 60) * Math.PI * 2;
      const r = 4 * scale * Math.pow(goldenRatio, t / (Math.PI * 2)) * (1 + Math.sin(this.time * 0.0003) * 0.02);

      const swayAmt = Math.sin(this.time * 0.0004 + t * 0.5) * 2;
      const px = cx + Math.cos(t) * r + swayAmt;
      const py = cy + Math.sin(t) * r + swayAmt * 0.5;

      const progress = i / totalPoints;
      const alpha = Math.min(1, (1 - progress) * 0.5 + 0.1) * 0.2;

      if (i > 0) {
        this.ctx.strokeStyle = this.getColorForDepth(Math.floor(progress * 5), alpha);
        this.ctx.lineWidth = Math.max(0.5, (1 - progress) * 2);
        this.ctx.beginPath();
        this.ctx.moveTo(prevX, prevY);
        this.ctx.lineTo(px, py);
        this.ctx.stroke();
      }

      if (i % 15 === 0 && i > 0) {
        const ornamentSize = (1 - progress) * 4 + 1;
        const ornamentAlpha = alpha * 1.5;

        const glow = this.ctx.createRadialGradient(px, py, 0, px, py, ornamentSize * 2);
        glow.addColorStop(0, this.getColorForDepth(Math.floor(progress * 5), ornamentAlpha));
        glow.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(px, py, ornamentSize * 2, 0, Math.PI * 2);
        this.ctx.fill();

        // Collect ornament positions as nodes
        if (this._collectingNodes && i % 30 === 0) {
          this._currentNodes.push({ x: px, y: py, depth: Math.floor(progress * 5) });
        }

        if (i % 30 === 0 && partialDepth > 2) {
          const branchAngle = t + Math.PI / 2;
          const branchLen = ornamentSize * 8;
          this.drawMiniSpiral(px, py, branchAngle, branchLen, Math.min(2, Math.floor(partialDepth - 2)));
        }
      }

      prevX = px;
      prevY = py;
    }

    if (isBloom) {
      const bloomGlow = this.ctx.createRadialGradient(cx, cy, 0, cx, cy, 30 * scale);
      bloomGlow.addColorStop(0, this.getColorForDepth(0, 0.2));
      bloomGlow.addColorStop(0.5, this.getColorForDepth(2, 0.08));
      bloomGlow.addColorStop(1, 'transparent');
      this.ctx.fillStyle = bloomGlow;
      this.ctx.beginPath();
      this.ctx.arc(cx, cy, 30 * scale, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  private drawMiniSpiral(x: number, y: number, angle: number, length: number, depth: number) {
    if (depth <= 0 || length < 2) return;

    const endX = x + Math.cos(angle) * length;
    const endY = y + Math.sin(angle) * length;

    this.ctx.strokeStyle = this.getColorForDepth(depth + 2, 0.12);
    this.ctx.lineWidth = 0.8;
    this.ctx.beginPath();
    this.ctx.moveTo(x, y);
    this.ctx.lineTo(endX, endY);
    this.ctx.stroke();

    this.drawMiniSpiral(endX, endY, angle + 0.5, length * 0.7, depth - 1);
  }

  // ─── Step Dots ──────────────────────────────────────────────────────────

  private renderDots() {
    if (!this.dotsContainer) return;
    this.dotsContainer.innerHTML = '';

    for (let i = 1; i <= this.config.totalSteps; i++) {
      const dot = document.createElement('span');
      dot.className = 'fractal-dot';
      if (i < this.targetStep) dot.classList.add('filled');
      if (i === this.targetStep) dot.classList.add('filled', 'current');
      this.dotsContainer.appendChild(dot);
    }
  }

  // ─── Helpers ──────────────────────────────────────────────────────────────

  private getColorForDepth(depth: number, alpha: number): string {
    const colors = [this.config.categoryColor, ...this.config.accentColors];
    const hex = colors[depth % colors.length];
    return hexToRgba(hex, alpha);
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}

// ─── Shared Helper ──────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

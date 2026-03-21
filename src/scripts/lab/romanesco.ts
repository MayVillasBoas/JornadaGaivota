// Romanesco Broccoli — self-similar spiral fractal
// Each bud is a miniature copy of the whole, arranged at the golden angle
// The most beautiful fractal in nature

import { BaseVisualization, hexToRgba, LAB_PALETTE } from './base-visualization';

export class Romanesco extends BaseVisualization {
  private time = 0;
  private maxDepth = 0;
  private targetDepth = 6;
  private growStart = 0;

  protected init() {
    this.maxDepth = 0;
    this.growStart = 0;

    // Click to regrow
    this.canvas.addEventListener('click', () => {
      this.maxDepth = 0;
      this.growStart = this.time;
    });
  }

  protected update(t: number) {
    this.time = t * 0.001;

    // Grow depth over time
    const elapsed = this.time - this.growStart;
    this.maxDepth = Math.min(this.targetDepth, elapsed * 0.8);
  }

  protected draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = LAB_PALETTE.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height * 0.55;
    const baseSize = Math.min(this.width, this.height) * 0.28;

    this.drawRomanesco(cx, cy, baseSize, -Math.PI / 2, 0);
  }

  private drawRomanesco(x: number, y: number, size: number, angle: number, depth: number) {
    if (depth > this.maxDepth || size < 1.5) return;

    const depthProgress = Math.min(1, Math.max(0, this.maxDepth - depth));
    if (depthProgress <= 0) return;

    // Golden angle for bud placement
    const goldenAngle = 137.508 * (Math.PI / 180);
    const numBuds = depth === 0 ? 13 : 8 + Math.floor((1 - depth / this.targetDepth) * 5);

    // Draw the central cone/bud
    const coneSize = size * 0.15 * depthProgress;
    const budAlpha = (0.3 + (depth / this.targetDepth) * 0.5) * depthProgress;

    // Color gradient: deep sage at center → bright gold-green at tips
    const t = depth / this.targetDepth;
    const r = Math.floor(45 + t * 130);  // 45 → 175
    const g = Math.floor(90 + t * 90);   // 90 → 180
    const b = Math.floor(50 + t * 20);   // 50 → 70
    const budColor = `rgba(${r},${g},${b},${budAlpha})`;

    // Draw the bud as a glowing point
    const glow = this.ctx.createRadialGradient(x, y, 0, x, y, coneSize * 3);
    glow.addColorStop(0, budColor);
    glow.addColorStop(0.4, `rgba(${r},${g},${b},${budAlpha * 0.4})`);
    glow.addColorStop(1, 'transparent');
    this.ctx.fillStyle = glow;
    this.ctx.beginPath();
    this.ctx.arc(x, y, coneSize * 3, 0, Math.PI * 2);
    this.ctx.fill();

    // Solid center
    this.ctx.fillStyle = budColor;
    this.ctx.beginPath();
    this.ctx.arc(x, y, coneSize, 0, Math.PI * 2);
    this.ctx.fill();

    // Arrange child buds in a spiral
    for (let i = 0; i < numBuds; i++) {
      const budAngle = angle + i * goldenAngle;
      const spiralR = size * (0.25 + (i / numBuds) * 0.55);

      // Fibonacci-like spacing: buds further out are slightly larger
      const budSize = size * (0.3 + (i / numBuds) * 0.15);

      const bx = x + Math.cos(budAngle) * spiralR * depthProgress;
      const by = y + Math.sin(budAngle) * spiralR * depthProgress;

      // Subtle breathing animation
      const breathe = 1 + Math.sin(this.time * 1.5 + i * 0.7 + depth * 2) * 0.03;

      // Connect bud to center with a thin line
      if (depthProgress > 0.5) {
        const lineAlpha = (depthProgress - 0.5) * 0.15;
        this.ctx.strokeStyle = `rgba(${r},${g},${b},${lineAlpha})`;
        this.ctx.lineWidth = Math.max(0.3, (1 - depth / this.targetDepth) * 1.5);
        this.ctx.beginPath();
        this.ctx.moveTo(x, y);
        this.ctx.lineTo(bx, by);
        this.ctx.stroke();
      }

      // Recurse into child buds
      this.drawRomanesco(bx, by, budSize * breathe, budAngle, depth + 1);
    }
  }
}

// Growing Mycelium Network — organic branching that grows from seed points
// Draws incrementally: new segments are added each frame without redrawing everything.

import { BaseVisualization, PALETTE_ARRAY, hexToRgba, LAB_PALETTE } from './base-visualization';
import { createNoise2D } from './simplex-noise';

interface Tip {
  x: number;
  y: number;
  angle: number;
  speed: number;
  depth: number;
  color: string;
  alive: boolean;
}

export class MyceliumNetwork extends BaseVisualization {
  private noise = createNoise2D(23);
  private tips: Tip[] = [];
  private totalSegments = 0;
  private maxSegments = 2000;
  private maxDepth = 5;
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  private needsBackground = true;

  protected init() {
    this.tips = [];
    this.totalSegments = 0;
    this.needsBackground = true;
    this.addSeed(this.width / 2, this.height / 2);

    if (this.clickHandler) {
      this.canvas.removeEventListener('click', this.clickHandler);
    }
    this.clickHandler = (e: MouseEvent) => {
      if (this.totalSegments >= this.maxSegments) return;
      const rect = this.canvas.getBoundingClientRect();
      this.addSeed(e.clientX - rect.left, e.clientY - rect.top);
    };
    this.canvas.addEventListener('click', this.clickHandler);
  }

  private addSeed(x: number, y: number) {
    const numTips = 3 + Math.floor(Math.random() * 3);
    for (let i = 0; i < numTips; i++) {
      const angle = (i / numTips) * Math.PI * 2 + Math.random() * 0.5;
      this.tips.push({
        x, y, angle,
        speed: 0.8 + Math.random() * 0.6,
        depth: 0,
        color: PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)],
        alive: true,
      });
    }

    // Draw seed node
    this.ctx.fillStyle = hexToRgba(
      PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)], 0.5
    );
    this.ctx.beginPath();
    this.ctx.arc(x, y, 3, 0, Math.PI * 2);
    this.ctx.fill();
  }

  protected update(_t: number) {
    if (this.totalSegments >= this.maxSegments) return;

    // Grow a batch of steps per frame (not just 1 per tip)
    const stepsPerFrame = Math.min(20, this.maxSegments - this.totalSegments);
    let drawn = 0;

    for (const tip of this.tips) {
      if (!tip.alive || drawn >= stepsPerFrame) continue;

      const prevX = tip.x;
      const prevY = tip.y;

      tip.angle += this.noise(tip.x * 0.01, tip.y * 0.01) * 0.15;
      tip.x += Math.cos(tip.angle) * tip.speed;
      tip.y += Math.sin(tip.angle) * tip.speed;

      // Draw segment immediately (incremental rendering)
      const alpha = 0.15 + (1 - tip.depth / this.maxDepth) * 0.2;
      this.ctx.strokeStyle = hexToRgba(tip.color, alpha);
      this.ctx.lineWidth = 0.6;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(prevX, prevY);
      this.ctx.lineTo(tip.x, tip.y);
      this.ctx.stroke();

      this.totalSegments++;
      drawn++;

      // Branch
      const branchProb = 0.015 * Math.pow(0.6, tip.depth);
      if (Math.random() < branchProb && tip.depth < this.maxDepth) {
        const branchAngle = tip.angle + (Math.random() > 0.5 ? 1 : -1) * (0.4 + Math.random() * 0.8);
        this.tips.push({
          x: tip.x, y: tip.y,
          angle: branchAngle,
          speed: tip.speed * (0.7 + Math.random() * 0.2),
          depth: tip.depth + 1,
          color: tip.color,
          alive: true,
        });

        // Draw branch node
        this.ctx.fillStyle = hexToRgba(tip.color, 0.3);
        this.ctx.beginPath();
        this.ctx.arc(tip.x, tip.y, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Die at edges
      if (tip.x < -20 || tip.x > this.width + 20 ||
          tip.y < -20 || tip.y > this.height + 20) {
        tip.alive = false;
      }
    }

    // Clean up dead tips periodically
    if (this.tips.length > 150) {
      this.tips = this.tips.filter(t => t.alive);
    }
  }

  protected draw() {
    // Only draw background once — everything else is incremental
    if (this.needsBackground) {
      this.ctx.fillStyle = LAB_PALETTE.bg;
      this.ctx.fillRect(0, 0, this.width, this.height);
      this.needsBackground = false;
    }
    // All drawing happens in update() incrementally
  }
}

// Growing Mycelium Network - organic branching that grows from seed points
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
  private maxSegments = 6000;
  private maxDepth = 6;
  private clickHandler: ((e: MouseEvent) => void) | null = null;
  protected resize() {
    super.resize();
    // Canvas was cleared by resize - re-initialize if running
    if (this.running) {
      this.init();
    }
  }

  protected init() {
    this.tips = [];
    this.totalSegments = 0;

    // Paint background once before any incremental drawing
    this.ctx.fillStyle = LAB_PALETTE.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Multiple seeds spread across the canvas
    const numSeeds = this.isMobile ? 3 : 5;
    for (let i = 0; i < numSeeds; i++) {
      const sx = this.width * (0.2 + Math.random() * 0.6);
      const sy = this.height * (0.2 + Math.random() * 0.6);
      this.addSeed(sx, sy);
    }

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
        speed: 1.2 + Math.random() * 1.3,
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

    // Grow all alive tips each frame for consistent speed
    for (const tip of this.tips) {
      if (!tip.alive || this.totalSegments >= this.maxSegments) continue;

      const prevX = tip.x;
      const prevY = tip.y;

      tip.angle += this.noise(tip.x * 0.003, tip.y * 0.003) * 0.05;
      tip.x += Math.cos(tip.angle) * tip.speed;
      tip.y += Math.sin(tip.angle) * tip.speed;

      // Draw segment immediately (incremental rendering)
      const alpha = 0.3 + (1 - tip.depth / this.maxDepth) * 0.35;
      this.ctx.strokeStyle = hexToRgba(tip.color, alpha);
      this.ctx.lineWidth = Math.max(0.4, 1.2 - tip.depth * 0.15);
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(prevX, prevY);
      this.ctx.lineTo(tip.x, tip.y);
      this.ctx.stroke();

      this.totalSegments++;

      // Branch
      const branchProb = 0.025 * Math.pow(0.6, tip.depth);
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
    // All drawing happens in update() incrementally - background painted once in init()
  }
}

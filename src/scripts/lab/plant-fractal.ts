// Plant Fractal - animated recursive tree that grows branch by branch
// Psychedelic, colorful, mesmerizing growth animation

import { BaseVisualization, PALETTE_ARRAY, hexToRgba, LAB_PALETTE } from './base-visualization';
import { createNoise2D } from './simplex-noise';

interface Branch {
  x1: number; y1: number;
  x2: number; y2: number;
  cpX: number; cpY: number;
  thickness: number;
  color: string;
  alpha: number;
  growStart: number; // time when this branch starts growing
  growDuration: number;
  depth: number;
  hasGlow: boolean;
}

export class PlantFractal extends BaseVisualization {
  private noise = createNoise2D(53);
  private time = 0;
  private branches: Branch[] = [];
  private growing = true;
  private generation = 0;
  private maxGenerations = 12;
  private branchQueue: { x: number; y: number; angle: number; len: number; depth: number; parentTime: number }[] = [];
  private colorCycle = 0;

  protected init() {
    this.branches = [];
    this.branchQueue = [];
    this.generation = 0;
    this.growing = true;
    this.time = 0;

    // Start with a trunk from bottom center
    this.branchQueue.push({
      x: this.width / 2,
      y: this.height * 0.88,
      angle: -Math.PI / 2,
      len: this.height * 0.18,
      depth: 0,
      parentTime: 0,
    });

    // Click to restart with new tree
    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.branches = [];
      this.branchQueue = [];
      this.generation = 0;
      this.growing = true;
      this.colorCycle += 1.5;

      this.branchQueue.push({
        x: e.clientX - rect.left,
        y: this.height * 0.88,
        angle: -Math.PI / 2 + (Math.random() - 0.5) * 0.2,
        len: this.height * 0.16 + Math.random() * this.height * 0.05,
        depth: 0,
        parentTime: this.time,
      });
    });
  }

  protected update(t: number) {
    this.time = t * 0.001;

    if (!this.growing) return;

    // Process queue - add branches gradually
    const toProcess: typeof this.branchQueue = [];
    const remaining: typeof this.branchQueue = [];

    for (const item of this.branchQueue) {
      if (this.time >= item.parentTime + 0.08) {
        toProcess.push(item);
      } else {
        remaining.push(item);
      }
    }
    this.branchQueue = remaining;

    for (const item of toProcess) {
      if (item.depth > this.maxGenerations || item.len < 2) continue;

      // Noise-based angle variation
      const noiseSway = this.noise(item.x * 0.005, item.y * 0.005) * 0.3;
      const angle = item.angle + noiseSway;

      const endX = item.x + Math.cos(angle) * item.len;
      const endY = item.y + Math.sin(angle) * item.len;

      // Control point for curve
      const cpX = (item.x + endX) / 2 + this.noise(item.depth * 2, item.x * 0.01) * item.len * 0.3;
      const cpY = (item.y + endY) / 2;

      // Color cycling - shifts through palette with depth
      const colorIdx = (item.depth + Math.floor(this.colorCycle)) % PALETTE_ARRAY.length;
      const color = PALETTE_ARRAY[colorIdx];

      const thickness = Math.max(0.3, (1 - item.depth / this.maxGenerations) * 5);
      const alpha = 0.2 + (1 - item.depth / this.maxGenerations) * 0.5;

      this.branches.push({
        x1: item.x, y1: item.y,
        x2: endX, y2: endY,
        cpX, cpY,
        thickness,
        color,
        alpha,
        growStart: this.time,
        growDuration: 0.3 + item.depth * 0.02,
        depth: item.depth,
        hasGlow: item.depth >= this.maxGenerations - 3,
      });

      // Branch children - more branches = more psychedelic
      const shrink = 0.62 + this.noise(item.depth, endX * 0.01) * 0.1;
      const spread = 0.35 + item.depth * 0.03;
      const delay = this.time + 0.1 + item.depth * 0.03;

      // Main branches
      this.branchQueue.push({
        x: endX, y: endY,
        angle: angle - spread + this.noise(endX * 0.02, this.time) * 0.15,
        len: item.len * shrink,
        depth: item.depth + 1,
        parentTime: delay,
      });

      this.branchQueue.push({
        x: endX, y: endY,
        angle: angle + spread + this.noise(endY * 0.02, this.time) * 0.15,
        len: item.len * (shrink - 0.04),
        depth: item.depth + 1,
        parentTime: delay + 0.05,
      });

      // Extra branch for complexity at certain depths
      if (item.depth % 3 === 0 && item.depth > 0 && item.depth < this.maxGenerations - 2) {
        this.branchQueue.push({
          x: endX, y: endY,
          angle: angle + this.noise(item.depth * 3, endX * 0.01) * 0.8,
          len: item.len * shrink * 0.5,
          depth: item.depth + 2,
          parentTime: delay + 0.1,
        });
      }
    }

    if (this.branchQueue.length === 0 && toProcess.length === 0) {
      this.growing = false;
    }
  }

  protected draw() {
    // Fade trail - creates ghostly afterglow effect
    this.ctx.fillStyle = 'rgba(26, 26, 26, 0.02)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw branches with growth animation
    for (const b of this.branches) {
      const elapsed = this.time - b.growStart;
      const progress = Math.min(1, elapsed / b.growDuration);

      if (progress <= 0) continue;

      // Ease out cubic for smooth growth
      const t = 1 - Math.pow(1 - progress, 3);

      // Interpolate endpoint
      const currX = b.x1 + (b.x2 - b.x1) * t;
      const currY = b.y1 + (b.y2 - b.y1) * t;
      const currCpX = b.x1 + (b.cpX - b.x1) * t;
      const currCpY = b.y1 + (b.cpY - b.y1) * t;

      // Breathing effect - subtle pulse based on time
      const breathe = 1 + Math.sin(this.time * 2 + b.depth * 0.5) * 0.08;
      const alpha = b.alpha * breathe;

      // Draw the branch curve
      this.ctx.strokeStyle = hexToRgba(b.color, alpha);
      this.ctx.lineWidth = b.thickness * breathe;
      this.ctx.lineCap = 'round';
      this.ctx.beginPath();
      this.ctx.moveTo(b.x1, b.y1);
      this.ctx.quadraticCurveTo(currCpX, currCpY, currX, currY);
      this.ctx.stroke();

      // Glow at tips for outer branches
      if (b.hasGlow && progress > 0.8) {
        const glowAlpha = alpha * 0.6 * ((progress - 0.8) / 0.2);
        const glowSize = 4 + b.depth * 0.3;
        const glow = this.ctx.createRadialGradient(currX, currY, 0, currX, currY, glowSize);
        glow.addColorStop(0, hexToRgba(b.color, glowAlpha));
        glow.addColorStop(0.5, hexToRgba(b.color, glowAlpha * 0.3));
        glow.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(currX, currY, glowSize, 0, Math.PI * 2);
        this.ctx.fill();
      }

      // Growing tip spark - bright dot at the growing edge
      if (progress < 1) {
        const sparkAlpha = (1 - progress) * 0.8;
        this.ctx.fillStyle = hexToRgba(LAB_PALETTE.cream, sparkAlpha);
        this.ctx.beginPath();
        this.ctx.arc(currX, currY, 1.5, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
}

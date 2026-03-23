// Lightning / Lichtenberg - recursive branching fractal
// Main bolt forks into smaller branches with decreasing probability and thickness
// Flash appearance with slow afterglow fade

import { BaseVisualization } from './base-visualization';

interface Branch {
  path: { x: number; y: number }[];
  width: number;
  depth: number;
  children: Branch[];
}

export class LightningFractal extends BaseVisualization {
  private bolts: { branches: Branch; birth: number; alpha: number }[] = [];
  private time = 0;
  private lastBolt = 0;
  private boltInterval = 3.5;

  protected init() {
    this.bolts = [];
    this.lastBolt = -this.boltInterval;

    this.canvas.addEventListener('click', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.clientX - rect.left;
      this.createBolt(x, 0);
    });

    this.canvas.addEventListener('touchstart', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const x = e.touches[0].clientX - rect.left;
      this.createBolt(x, 0);
    }, { passive: true });
  }

  private createBolt(startX: number, startY: number) {
    const maxDepth = this.isMobile ? 5 : 7;
    const root = this.generateBranch(startX, startY, Math.PI / 2, this.height * 0.75, 2, maxDepth);
    this.bolts.push({ branches: root, birth: this.time, alpha: 1 });
    if (this.bolts.length > 4) this.bolts.shift();
  }

  private generateBranch(x: number, y: number, angle: number, length: number, width: number, depth: number): Branch {
    const segments = 5 + Math.floor(Math.random() * 5);
    const path: { x: number; y: number }[] = [{ x, y }];
    let cx = x;
    let cy = y;

    for (let i = 0; i < segments; i++) {
      const segLen = length / segments;
      const jitter = (Math.random() - 0.5) * 1.2;
      const segAngle = angle + jitter;
      cx += Math.cos(segAngle) * segLen;
      cy += Math.sin(segAngle) * segLen;
      path.push({ x: cx, y: cy });
    }

    const branch: Branch = { path, width, depth, children: [] };

    if (depth > 0 && length > 10) {
      // Main continuation (high probability)
      if (Math.random() < 0.9) {
        const childAngle = angle + (Math.random() - 0.5) * 0.6;
        const childLen = length * (0.5 + Math.random() * 0.25);
        branch.children.push(
          this.generateBranch(cx, cy, childAngle, childLen, width * 0.65, depth - 1)
        );
      }

      // Forks at random points along the path
      const forkCount = Math.random() < 0.4 ? 2 : 1;
      for (let f = 0; f < forkCount; f++) {
        if (Math.random() < 0.55) {
          const forkIdx = 1 + Math.floor(Math.random() * (path.length - 2));
          const forkPt = path[forkIdx];
          const side = Math.random() < 0.5 ? -1 : 1;
          const forkAngle = angle + side * (0.4 + Math.random() * 0.7);
          const forkLen = length * (0.2 + Math.random() * 0.3);
          branch.children.push(
            this.generateBranch(forkPt.x, forkPt.y, forkAngle, forkLen, width * 0.4, depth - 1)
          );
        }
      }
    }

    return branch;
  }

  private drawBranch(ctx: CanvasRenderingContext2D, branch: Branch, alpha: number) {
    const a = alpha * Math.max(0.15, branch.depth / 7);
    const path = branch.path;
    if (path.length < 2) return;

    // Outer glow (lilac)
    if (branch.width > 1) {
      ctx.beginPath();
      ctx.moveTo(path[0].x, path[0].y);
      for (let i = 1; i < path.length; i++) {
        ctx.lineTo(path[i].x, path[i].y);
      }
      ctx.strokeStyle = `rgba(139, 106, 173, ${a * 0.12})`;
      ctx.lineWidth = branch.width * 5;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';
      ctx.stroke();
    }

    // Mid glow (electric blue)
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = `rgba(107, 142, 255, ${a * 0.4})`;
    ctx.lineWidth = branch.width * 2;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    // Core (white)
    ctx.beginPath();
    ctx.moveTo(path[0].x, path[0].y);
    for (let i = 1; i < path.length; i++) {
      ctx.lineTo(path[i].x, path[i].y);
    }
    ctx.strokeStyle = `rgba(232, 240, 255, ${a * 0.85})`;
    ctx.lineWidth = branch.width;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.stroke();

    for (const child of branch.children) {
      this.drawBranch(ctx, child, alpha);
    }
  }

  protected update(t: number) {
    this.time = t * 0.001;

    if (this.time - this.lastBolt > this.boltInterval) {
      const x = this.width * 0.2 + Math.random() * this.width * 0.6;
      this.createBolt(x, 0);
      this.lastBolt = this.time;
    }

    for (const bolt of this.bolts) {
      const age = this.time - bolt.birth;
      if (age < 0.05) {
        bolt.alpha = 1;
      } else {
        bolt.alpha = Math.max(0, 1 - (age - 0.05) * 0.35);
      }
    }

    this.bolts = this.bolts.filter(b => b.alpha > 0.01);
  }

  protected draw() {
    const ctx = this.ctx;

    // Fade background (afterglow trail)
    ctx.fillStyle = 'rgba(26, 26, 26, 0.12)';
    ctx.fillRect(0, 0, this.width, this.height);

    ctx.save();
    ctx.globalCompositeOperation = 'lighter';

    for (const bolt of this.bolts) {
      this.drawBranch(ctx, bolt.branches, bolt.alpha);
    }

    ctx.restore();
  }
}

// Growing Mycelium Network — organic branching that grows from seed points
// Nodes pulse with radial gradients. Click to add growth points.

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

interface Node {
  x: number;
  y: number;
  radius: number;
  color: string;
  phase: number;
}

interface Segment {
  x1: number; y1: number;
  x2: number; y2: number;
  color: string;
  alpha: number;
}

export class MyceliumNetwork extends BaseVisualization {
  private noise = createNoise2D(23);
  private tips: Tip[] = [];
  private nodes: Node[] = [];
  private segments: Segment[] = [];
  private time = 0;
  private maxSegments = 3000;
  private maxDepth = 6;

  private clickHandler: ((e: MouseEvent) => void) | null = null;

  protected init() {
    this.tips = [];
    this.nodes = [];
    this.segments = [];
    this.addSeed(this.width / 2, this.height / 2);

    // Remove old listener before adding new one
    if (this.clickHandler) {
      this.canvas.removeEventListener('click', this.clickHandler);
    }
    this.clickHandler = (e: MouseEvent) => {
      const rect = this.canvas.getBoundingClientRect();
      this.addSeed(e.clientX - rect.left, e.clientY - rect.top);
    };
    this.canvas.addEventListener('click', this.clickHandler);
  }

  private addSeed(x: number, y: number) {
    const numTips = 3 + Math.floor(Math.random() * 4);
    for (let i = 0; i < numTips; i++) {
      const angle = (i / numTips) * Math.PI * 2 + Math.random() * 0.5;
      this.tips.push({
        x, y, angle,
        speed: 0.8 + Math.random() * 0.8,
        depth: 0,
        color: PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)],
        alive: true,
      });
    }
    this.nodes.push({
      x, y, radius: 3,
      color: PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)],
      phase: Math.random() * Math.PI * 2,
    });
  }

  protected update(t: number) {
    this.time = t * 0.001;

    if (this.segments.length >= this.maxSegments) return;

    // Grow each active tip
    for (const tip of this.tips) {
      if (!tip.alive) continue;

      const prevX = tip.x;
      const prevY = tip.y;

      // Perturb angle with noise
      tip.angle += this.noise(tip.x * 0.01, tip.y * 0.01) * 0.15;
      tip.x += Math.cos(tip.angle) * tip.speed;
      tip.y += Math.sin(tip.angle) * tip.speed;

      // Add segment
      const alpha = 0.12 + (1 - tip.depth / this.maxDepth) * 0.18;
      this.segments.push({
        x1: prevX, y1: prevY,
        x2: tip.x, y2: tip.y,
        color: tip.color,
        alpha,
      });

      // Branch probability decreases with depth
      const branchProb = 0.012 * Math.pow(0.65, tip.depth);
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
        this.nodes.push({
          x: tip.x, y: tip.y,
          radius: 2 - tip.depth * 0.15,
          color: tip.color,
          phase: Math.random() * Math.PI * 2,
        });
      }

      // Die at edges or max depth
      if (tip.x < -20 || tip.x > this.width + 20 ||
          tip.y < -20 || tip.y > this.height + 20 ||
          tip.depth >= this.maxDepth) {
        tip.alive = false;
      }

      if (this.segments.length >= this.maxSegments) break;
    }

    // Clean up dead tips to prevent array growth
    if (this.tips.length > 200) {
      this.tips = this.tips.filter(t => t.alive);
    }
  }

  protected draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = LAB_PALETTE.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw segments — batch by color for fewer state changes
    this.ctx.lineWidth = 0.6;
    this.ctx.lineCap = 'round';
    for (const seg of this.segments) {
      this.ctx.strokeStyle = hexToRgba(seg.color, seg.alpha);
      this.ctx.beginPath();
      this.ctx.moveTo(seg.x1, seg.y1);
      this.ctx.lineTo(seg.x2, seg.y2);
      this.ctx.stroke();
    }

    // Draw pulsing nodes — limit to 100 most recent to avoid gradient overload
    const visibleNodes = this.nodes.length > 100 ? this.nodes.slice(-100) : this.nodes;
    for (const node of visibleNodes) {
      const pulse = 1 + Math.sin(this.time * 2 + node.phase) * 0.3;
      const r = Math.max(0.5, node.radius * pulse);
      const glow = this.ctx.createRadialGradient(node.x, node.y, 0, node.x, node.y, r * 3);
      glow.addColorStop(0, hexToRgba(node.color, 0.4));
      glow.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(node.x, node.y, r * 3, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

// Koch Snowflake - recursive geometric subdivision
// Start with equilateral triangle, subdivide each edge recursively
// Animates from triangle → level 5 snowflake over ~8 seconds

import { BaseVisualization } from './base-visualization';

interface Point {
  x: number;
  y: number;
}

export class KochSnowflake extends BaseVisualization {
  private rotation = 0;
  private startTime = 0;
  private currentLevel = 0;
  private snowParticles: { x: number; y: number; vx: number; vy: number; size: number; alpha: number }[] = [];

  protected init() {
    this.rotation = 0;
    this.startTime = 0;
    this.currentLevel = 0;

    const count = this.isMobile ? 40 : 80;
    this.snowParticles = [];
    for (let i = 0; i < count; i++) {
      this.snowParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: 0.2 + Math.random() * 0.4,
        size: 1 + Math.random() * 2,
        alpha: 0.1 + Math.random() * 0.15,
      });
    }
  }

  protected update(t: number) {
    if (this.startTime === 0) this.startTime = t;
    const elapsed = (t - this.startTime) * 0.001;

    // Animate level: new level every 1.5 seconds, up to 5
    this.currentLevel = Math.min(5, Math.floor(elapsed / 1.5));

    this.rotation = elapsed * 0.03;

    for (const p of this.snowParticles) {
      p.x += p.vx;
      p.y += p.vy;
      if (p.y > this.height + 5) {
        p.y = -5;
        p.x = Math.random() * this.width;
      }
      if (p.x < -5) p.x = this.width + 5;
      if (p.x > this.width + 5) p.x = -5;
    }
  }

  private subdivide(points: Point[]): Point[] {
    const result: Point[] = [];
    for (let i = 0; i < points.length; i++) {
      const p1 = points[i];
      const p2 = points[(i + 1) % points.length];

      const dx = p2.x - p1.x;
      const dy = p2.y - p1.y;

      const a: Point = { x: p1.x + dx / 3, y: p1.y + dy / 3 };
      const b: Point = { x: p1.x + dx * 2 / 3, y: p1.y + dy * 2 / 3 };

      // Peak of equilateral triangle pointing outward
      const peak: Point = {
        x: (a.x + b.x) / 2 - (a.y - b.y) * Math.sqrt(3) / 2,
        y: (a.y + b.y) / 2 - (b.x - a.x) * Math.sqrt(3) / 2,
      };

      result.push(p1, a, peak, b);
    }
    return result;
  }

  private getSnowflakePoints(level: number, cx: number, cy: number, radius: number): Point[] {
    let points: Point[] = [];
    for (let i = 0; i < 3; i++) {
      const angle = this.rotation + (i * Math.PI * 2) / 3 - Math.PI / 2;
      points.push({
        x: cx + Math.cos(angle) * radius,
        y: cy + Math.sin(angle) * radius,
      });
    }

    for (let l = 0; l < level; l++) {
      points = this.subdivide(points);
    }

    return points;
  }

  protected draw() {
    const ctx = this.ctx;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Snow particles
    for (const p of this.snowParticles) {
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(184, 212, 227, ${p.alpha})`;
      ctx.fill();
    }

    const cx = this.width / 2;
    const cy = this.height / 2;
    const radius = Math.min(this.width, this.height) * 0.35;

    const level = this.currentLevel;
    const points = this.getSnowflakePoints(level, cx, cy, radius);

    // Draw path
    ctx.beginPath();
    ctx.moveTo(points[0].x, points[0].y);
    for (let i = 1; i < points.length; i++) {
      ctx.lineTo(points[i].x, points[i].y);
    }
    ctx.closePath();

    // Subtle fill
    ctx.fillStyle = 'rgba(184, 212, 227, 0.03)';
    ctx.fill();

    // Base stroke - thinner at higher levels
    ctx.strokeStyle = 'rgba(184, 212, 227, 0.5)';
    ctx.lineWidth = level > 3 ? 0.5 : 1;
    ctx.stroke();

    // Glow near mouse
    if (this.mouseActive) {
      ctx.save();
      ctx.shadowColor = 'rgba(184, 212, 227, 0.8)';
      ctx.shadowBlur = 15;
      ctx.strokeStyle = 'rgba(255, 255, 255, 0.4)';
      ctx.lineWidth = 0.5;

      ctx.beginPath();
      for (let i = 0; i < points.length; i++) {
        const p = points[i];
        const next = points[(i + 1) % points.length];
        const dist = Math.hypot(p.x - this.mouseX, p.y - this.mouseY);
        if (dist < 120) {
          ctx.moveTo(p.x, p.y);
          ctx.lineTo(next.x, next.y);
        }
      }
      ctx.stroke();
      ctx.restore();
    }
  }
}

// Barnsley Fern - Iterated Function System
// 4 affine transformations produce a perfect fern leaf
// Wind applied as rendering shear (NOT IFS perturbation) to preserve attractor

import { BaseVisualization } from './base-visualization';

// Classic Barnsley fern coefficients
const TRANSFORMS = [
  { a: 0, b: 0, c: 0, d: 0.16, e: 0, f: 0, p: 0.01 },
  { a: 0.85, b: 0.04, c: -0.04, d: 0.85, e: 0, f: 1.6, p: 0.85 },
  { a: 0.2, b: -0.26, c: 0.23, d: 0.22, e: 0, f: 1.6, p: 0.07 },
  { a: -0.15, b: 0.28, c: 0.26, d: 0.24, e: 0, f: 0.44, p: 0.07 },
];

export class BarnsleyFern extends BaseVisualization {
  private points: { x: number; y: number }[] = [];
  private currentX = 0;
  private currentY = 0;
  private pointsPerFrame = 200;
  private maxPoints = 60000;
  private windOffset = 0;
  private targetWind = 0;
  private startTime = 0;

  protected init() {
    this.points = [];
    this.currentX = 0;
    this.currentY = 0;
    this.startTime = 0;
    this.windOffset = 0;
    this.targetWind = 0;
    this.pointsPerFrame = this.isMobile ? 100 : 200;
    this.maxPoints = this.isMobile ? 30000 : 60000;
  }

  protected update(t: number) {
    if (this.startTime === 0) this.startTime = t;
    const elapsed = (t - this.startTime) * 0.001;

    // Wind from mouse - applied at render time, NOT in IFS
    if (this.mouseActive) {
      this.targetWind = (this.mouseX / this.width - 0.5) * 0.15;
    } else {
      this.targetWind = Math.sin(elapsed * 0.4) * 0.02;
    }
    this.windOffset += (this.targetWind - this.windOffset) * 0.04;

    // Generate points using PURE IFS (no wind perturbation)
    if (this.points.length < this.maxPoints) {
      for (let i = 0; i < this.pointsPerFrame; i++) {
        const r = Math.random();
        let cumulative = 0;
        let tx = TRANSFORMS[0];

        for (const tf of TRANSFORMS) {
          cumulative += tf.p;
          if (r <= cumulative) {
            tx = tf;
            break;
          }
        }

        // Pure IFS - no wind modification
        const nx = tx.a * this.currentX + tx.b * this.currentY + tx.e;
        const ny = tx.c * this.currentX + tx.d * this.currentY + tx.f;

        this.currentX = nx;
        this.currentY = ny;

        this.points.push({ x: nx, y: ny });
      }
    }
  }

  protected draw() {
    const ctx = this.ctx;
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.points.length === 0) return;

    // Fern coordinate space: x ≈ [-2.5, 2.5], y ≈ [0, 10]
    const scale = this.height * 0.085;
    const offsetX = this.width * 0.5;
    const offsetY = this.height * 0.92;

    // Subtle ambient glow
    const glowGrad = ctx.createRadialGradient(
      offsetX, offsetY - this.height * 0.35, 0,
      offsetX, offsetY - this.height * 0.35, this.height * 0.45
    );
    glowGrad.addColorStop(0, 'rgba(61, 107, 90, 0.08)');
    glowGrad.addColorStop(1, 'rgba(61, 107, 90, 0)');
    ctx.fillStyle = glowGrad;
    ctx.fillRect(0, 0, this.width, this.height);

    // Draw points with wind as a RENDERING shear
    // wind shears x by y*windOffset - fern leans without breaking attractor
    const wind = this.windOffset;
    const total = this.points.length;
    const dotSize = this.isMobile ? 1 : 1.2;

    for (let i = 0; i < total; i++) {
      const p = this.points[i];

      // Apply wind as shear: higher points (larger y) move more
      const shearX = p.y * wind;
      const sx = offsetX + (p.x + shearX) * scale;
      const sy = offsetY - p.y * scale;

      // Color gradient: sage → cream
      const t = i / total;
      const cr = Math.round(61 + (245 - 61) * t * 0.4);
      const cg = Math.round(107 + (240 - 107) * t * 0.4);
      const cb = Math.round(90 + (232 - 90) * t * 0.4);

      const age = total - i;
      const alpha = age < 500 ? (age / 500) * 0.7 : 0.7;

      ctx.fillStyle = `rgba(${cr},${cg},${cb},${alpha})`;
      ctx.fillRect(sx, sy, dotSize, dotSize);
    }
  }
}

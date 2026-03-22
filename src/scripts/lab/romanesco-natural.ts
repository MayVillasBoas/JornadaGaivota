// Romanesco — 3D dome with recursive self-similar buds
// Golden angle phyllotaxis mapped onto a hemisphere, with smaller buds on each bud
// Creates the characteristic "fractal broccoli" look

import { BaseVisualization } from './base-visualization';

const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
const TAU = Math.PI * 2;

interface Bud {
  x: number;
  y: number;
  z: number;
  size: number;
  r: number;
  g: number;
  b: number;
}

export class RomanescoNatural extends BaseVisualization {
  private startTime = 0;
  private elapsed = 0;
  private lightAngle = -Math.PI / 4;
  private targetLightAngle = -Math.PI / 4;
  private rotation = 0;
  private buds: Bud[] = [];
  private needsRebuild = true;

  protected init() {
    this.startTime = 0;
    this.elapsed = 0;
    this.lightAngle = -Math.PI / 4;
    this.targetLightAngle = -Math.PI / 4;
    this.rotation = 0;
    this.needsRebuild = true;
    this.buds = [];
  }

  private buildBuds() {
    this.buds = [];
    const cx = this.width / 2;
    const cy = this.height / 2;
    const domeRadius = Math.min(this.width, this.height) * 0.35;
    const numPrimary = this.isMobile ? 250 : 500;

    for (let n = 0; n < numPrimary; n++) {
      const angle = n * GOLDEN_ANGLE + this.rotation;
      // Map to dome surface: r grows with sqrt(n), capped to dome radius
      const t = n / numPrimary; // 0 to 1
      const r2d = domeRadius * Math.sqrt(t);

      // Dome height: z = sqrt(R² - r²) — hemisphere projection
      const rNorm = r2d / domeRadius;
      const z = Math.sqrt(Math.max(0, 1 - rNorm * rNorm));

      // Project 3D position to 2D with perspective
      const perspective = 0.7 + z * 0.3;
      const x = cx + Math.cos(angle) * r2d * perspective;
      const y = cy + Math.sin(angle) * r2d * perspective;

      // Bud size: smaller at center (top of dome), larger at edges
      // Also scaled by z for perspective
      const baseSize = 3 + t * (this.isMobile ? 8 : 12);
      const size = baseSize * (0.6 + z * 0.4);

      // Lime-green color: brighter at top, darker at edges
      const greenIntensity = 0.6 + z * 0.4;
      const budR = Math.round((90 + t * 60) * greenIntensity);
      const budG = Math.round((170 + t * 30) * greenIntensity);
      const budB = Math.round((50 + t * 20) * greenIntensity);

      this.buds.push({ x, y, z, size, r: budR, g: budG, b: budB });

      // Self-similarity: add mini-buds on larger primary buds
      if (t > 0.15 && size > 6) {
        const numSub = this.isMobile ? 4 : 6;
        const subScale = 0.28;
        for (let s = 0; s < numSub; s++) {
          const subAngle = s * GOLDEN_ANGLE + angle * 0.5;
          const subR = size * 0.45;
          const sx = x + Math.cos(subAngle) * subR;
          const sy = y + Math.sin(subAngle) * subR;
          const subSize = size * subScale;

          // Slightly different green for depth
          const subGreen = greenIntensity * 0.9;
          const sr = Math.round((100 + t * 50) * subGreen);
          const sg = Math.round((175 + t * 25) * subGreen);
          const sb = Math.round((55 + t * 15) * subGreen);

          this.buds.push({ x: sx, y: sy, z: z * 0.95, size: subSize, r: sr, g: sg, b: sb });
        }
      }
    }

    // Sort by z (back to front) for correct depth ordering
    this.buds.sort((a, b) => a.z - b.z);
    this.needsRebuild = false;
  }

  protected update(t: number) {
    if (this.startTime === 0) this.startTime = t;
    this.elapsed = (t - this.startTime) * 0.001;

    this.rotation = this.elapsed * 0.01;

    if (this.mouseActive) {
      const dx = this.mouseX - this.width / 2;
      const dy = this.mouseY - this.height / 2;
      this.targetLightAngle = Math.atan2(dy, dx);
    }

    let diff = this.targetLightAngle - this.lightAngle;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    this.lightAngle += diff * 0.06;

    // Rebuild buds periodically for rotation
    if (this.needsRebuild || Math.floor(this.elapsed * 2) !== Math.floor((this.elapsed - 0.016) * 2)) {
      this.buildBuds();
    }
  }

  protected draw() {
    const ctx = this.ctx;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.elapsed <= 0 || this.buds.length === 0) return;

    // Reveal buds over ~4 seconds
    const visibleCount = Math.min(this.buds.length, Math.floor(this.elapsed * (this.buds.length / 4)));

    const lx = Math.cos(this.lightAngle);
    const ly = Math.sin(this.lightAngle);
    const cx = this.width / 2;
    const cy = this.height / 2;

    for (let i = 0; i < visibleCount; i++) {
      const bud = this.buds[i];

      // Lighting: direction from center for normal approximation
      const dx = bud.x - cx;
      const dy = bud.y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy) || 1;
      const nx = dx / dist;
      const ny = dy / dist;
      const dotLight = nx * lx + ny * ly;
      const intensity = 0.4 + 0.6 * Math.max(0, dotLight * 0.5 + 0.5);

      // Apply lighting to bud color
      const cr = Math.round(bud.r * intensity);
      const cg = Math.round(bud.g * intensity);
      const cb = Math.round(bud.b * intensity);

      // Conical bud: radial gradient with offset highlight
      const hlOff = bud.size * 0.25;
      const grad = ctx.createRadialGradient(
        bud.x - lx * hlOff, bud.y - ly * hlOff, bud.size * 0.05,
        bud.x, bud.y, bud.size
      );

      // Highlight on the lit side
      const hlR = Math.min(255, cr + 60);
      const hlG = Math.min(255, cg + 40);
      const hlB = Math.min(255, cb + 20);
      grad.addColorStop(0, `rgb(${hlR},${hlG},${hlB})`);
      grad.addColorStop(0.4, `rgb(${cr},${cg},${cb})`);
      // Dark shadow on the far side
      grad.addColorStop(1, `rgb(${Math.round(cr * 0.35)},${Math.round(cg * 0.4)},${Math.round(cb * 0.25)})`);

      ctx.beginPath();
      ctx.arc(bud.x, bud.y, bud.size, 0, TAU);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Subtle ambient glow at center
    const glowR = Math.min(this.width, this.height) * 0.06;
    const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowR);
    centerGlow.addColorStop(0, 'rgba(180, 210, 100, 0.2)');
    centerGlow.addColorStop(1, 'rgba(180, 210, 100, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, glowR, 0, TAU);
    ctx.fillStyle = centerGlow;
    ctx.fill();
  }
}

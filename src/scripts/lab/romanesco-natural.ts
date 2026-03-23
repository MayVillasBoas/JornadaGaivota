// Romanesco — phyllotaxis spiral with golden angle
// The same mathematical pattern that creates romanesco's Fibonacci spirals
// Points grow outward from center, revealing the spiral structure

import { BaseVisualization } from './base-visualization';

const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
const TAU = Math.PI * 2;

export class RomanescoNatural extends BaseVisualization {
  private startTime = 0;
  private elapsed = 0;
  private maxPoints = 0;
  private spacing = 0;
  private lightAngle = -Math.PI / 4;
  private targetLightAngle = -Math.PI / 4;
  private rotation = 0;

  protected init() {
    this.startTime = 0;
    this.elapsed = 0;
    this.maxPoints = this.isMobile ? 800 : 1600;
    this.spacing = Math.min(this.width, this.height) * 0.012;
    this.lightAngle = -Math.PI / 4;
    this.targetLightAngle = -Math.PI / 4;
    this.rotation = 0;
  }

  protected update(t: number) {
    if (this.startTime === 0) this.startTime = t;
    this.elapsed = (t - this.startTime) * 0.001;

    // Slow rotation
    this.rotation = this.elapsed * 0.015;

    // Light follows mouse
    if (this.mouseActive) {
      const dx = this.mouseX - this.width / 2;
      const dy = this.mouseY - this.height / 2;
      this.targetLightAngle = Math.atan2(dy, dx);
    }

    let diff = this.targetLightAngle - this.lightAngle;
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    this.lightAngle += diff * 0.06;
  }

  protected draw() {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.width, this.height);

    if (this.elapsed <= 0) return;

    // Points appear over ~5 seconds
    const visibleCount = Math.min(this.maxPoints, Math.floor(this.elapsed * (this.maxPoints / 5)));

    const lx = Math.cos(this.lightAngle);
    const ly = Math.sin(this.lightAngle);
    const maxR = this.spacing * Math.sqrt(this.maxPoints);

    // Draw points from outside in (so inner points overlay outer ones = 3D depth)
    for (let n = visibleCount - 1; n >= 0; n--) {
      const angle = n * GOLDEN_ANGLE + this.rotation;
      const r = this.spacing * Math.sqrt(n);
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      // Size: larger toward edges (like romanesco buds growing outward)
      const distRatio = r / maxR;
      const size = 2 + distRatio * (this.isMobile ? 5 : 8);

      // Direction from center (for 3D-like lighting)
      const dirX = r > 0 ? (x - cx) / r : 0;
      const dirY = r > 0 ? (y - cy) / r : 0;
      const dotLight = dirX * lx + dirY * ly;
      const intensity = 0.35 + 0.65 * Math.max(0, dotLight * 0.5 + 0.5);

      // Romanesco colors: green at center → yellow-green at edges
      const baseR = 70 + distRatio * 50;
      const baseG = 110 + distRatio * 50;
      const baseB = 45 + distRatio * 15;

      const cr = Math.round(baseR * intensity);
      const cg = Math.round(baseG * intensity);
      const cb = Math.round(baseB * intensity);

      // 3D dome effect via radial gradient
      const hlOff = size * 0.2;
      const grad = ctx.createRadialGradient(
        x - lx * hlOff, y - ly * hlOff, size * 0.05,
        x, y, size
      );
      const hlR = Math.min(255, cr + 50);
      const hlG = Math.min(255, cg + 35);
      const hlB = Math.min(255, cb + 25);
      grad.addColorStop(0, `rgb(${hlR},${hlG},${hlB})`);
      grad.addColorStop(0.5, `rgb(${cr},${cg},${cb})`);
      grad.addColorStop(1, `rgb(${Math.round(cr * 0.45)},${Math.round(cg * 0.5)},${Math.round(cb * 0.35)})`);

      ctx.beginPath();
      ctx.arc(x, y, size, 0, TAU);
      ctx.fillStyle = grad;
      ctx.fill();
    }

    // Center glow
    const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxR * 0.08);
    centerGlow.addColorStop(0, 'rgba(200, 195, 120, 0.25)');
    centerGlow.addColorStop(1, 'rgba(200, 195, 120, 0)');
    ctx.beginPath();
    ctx.arc(cx, cy, maxR * 0.08, 0, TAU);
    ctx.fillStyle = centerGlow;
    ctx.fill();
  }
}

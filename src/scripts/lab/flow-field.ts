// Flow Field — thousands of particles steered by curl noise
// Curl noise produces divergence-free flow (like real fluid). Mouse pushes particles.

import { BaseVisualization, PALETTE_ARRAY, hexToRgba, LAB_PALETTE } from './base-visualization';
import { createNoise3D } from './simplex-noise';

interface Particle {
  x: number;
  y: number;
  prevX: number;
  prevY: number;
  speed: number;
  color: string;
  life: number;
  maxLife: number;
}

export class FlowField extends BaseVisualization {
  private noise = createNoise3D(17);
  private particles: Particle[] = [];
  private time = 0;
  private scale = 0.003;
  private speed = 0.0004;

  protected init() {
    const count = this.isMobile ? 800 : 3000;
    this.particles = [];
    for (let i = 0; i < count; i++) {
      this.particles.push(this.createParticle());
    }
    // Clear canvas with bg
    this.ctx.fillStyle = LAB_PALETTE.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);
  }

  private createParticle(): Particle {
    const colorHex = PALETTE_ARRAY[Math.floor(Math.random() * PALETTE_ARRAY.length)];
    const alpha = 0.15 + Math.random() * 0.35;
    return {
      x: Math.random() * this.width,
      y: Math.random() * this.height,
      prevX: 0,
      prevY: 0,
      speed: 0.5 + Math.random() * 1.5,
      color: hexToRgba(colorHex, alpha),
      life: 0,
      maxLife: 200 + Math.random() * 300,
    };
  }

  protected update(t: number) {
    this.time = t * this.speed;

    for (const p of this.particles) {
      p.prevX = p.x;
      p.prevY = p.y;

      // Curl noise: take the curl of the scalar noise field for divergence-free flow
      // curl(N) = (dN/dy, -dN/dx) — particles never bunch up or spread apart
      const eps = 0.5;
      const px = p.x * this.scale;
      const py = p.y * this.scale;
      const dNdy = this.noise(px, py + eps, this.time) - this.noise(px, py - eps, this.time);
      const dNdx = this.noise(px + eps, py, this.time) - this.noise(px - eps, py, this.time);

      let vx = dNdy * p.speed * 2;
      let vy = -dNdx * p.speed * 2;

      // Mouse repulsion
      if (this.mouseActive) {
        const dx = p.x - this.mouseX;
        const dy = p.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const radius = 120;
        if (dist < radius) {
          const force = (1 - dist / radius) * 4;
          vx += (dx / dist) * force;
          vy += (dy / dist) * force;
        }
      }

      p.x += vx;
      p.y += vy;
      p.life++;

      // Respawn if out of bounds or expired
      if (p.x < -10 || p.x > this.width + 10 ||
          p.y < -10 || p.y > this.height + 10 ||
          p.life > p.maxLife) {
        const np = this.createParticle();
        p.x = np.x;
        p.y = np.y;
        p.prevX = p.x;
        p.prevY = p.y;
        p.speed = np.speed;
        p.color = np.color;
        p.life = 0;
        p.maxLife = np.maxLife;
      }
    }
  }

  protected draw() {
    // Fade trail effect — overlay semi-transparent bg
    this.ctx.fillStyle = 'rgba(26, 26, 26, 0.03)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw particle trails
    for (const p of this.particles) {
      if (p.life === 0) continue;
      this.ctx.strokeStyle = p.color;
      this.ctx.lineWidth = 0.8;
      this.ctx.beginPath();
      this.ctx.moveTo(p.prevX, p.prevY);
      this.ctx.lineTo(p.x, p.y);
      this.ctx.stroke();
    }
  }
}

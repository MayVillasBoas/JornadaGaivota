// Particle Aurora — vivid aurora borealis with bright flowing curtains
// Real aurora colors: electric green, teal, magenta, violet

import { BaseVisualization, hexToRgba } from './base-visualization';
import { createNoise2D } from './simplex-noise';

// Real aurora borealis colors — vivid!
const AURORA_COLORS = [
  '#39FF14', // electric green (oxygen at 100km)
  '#00E5CC', // teal-cyan
  '#FF10F0', // magenta-pink (nitrogen)
  '#8B5CF6', // violet-purple (nitrogen at high altitude)
  '#22D3EE', // bright cyan
];

export class ParticleAurora extends BaseVisualization {
  private noise = createNoise2D(41);
  private noise2 = createNoise2D(59);
  private time = 0;
  private curtains: {
    baseY: number;
    color: string;
    freq: number;
    amplitude: number;
    speed: number;
    particleCount: number;
  }[] = [];

  protected init() {
    this.curtains = [];
    const numCurtains = 5;

    for (let c = 0; c < numCurtains; c++) {
      this.curtains.push({
        baseY: this.height * (0.15 + (c / numCurtains) * 0.45),
        color: AURORA_COLORS[c % AURORA_COLORS.length],
        freq: 0.002 + c * 0.0008,
        amplitude: 25 + c * 12,
        speed: 0.25 + c * 0.08,
        particleCount: this.isMobile ? 150 : 300,
      });
    }
  }

  protected update(t: number) {
    this.time = t * 0.001;
  }

  protected draw() {
    // Slight fade for trailing glow
    this.ctx.fillStyle = 'rgba(26, 26, 26, 0.15)';
    this.ctx.fillRect(0, 0, this.width, this.height);

    const mouseTilt = this.mouseActive ? (this.mouseX / this.width - 0.5) * 3 : 0;

    this.ctx.globalCompositeOperation = 'lighter';

    for (const curtain of this.curtains) {
      const { baseY, color, freq, amplitude, speed, particleCount } = curtain;

      for (let i = 0; i < particleCount; i++) {
        const x = (i / particleCount) * this.width;

        // Wavy Y position — layered noise for organic movement
        const wave1 = this.noise(x * freq + mouseTilt * 0.3, this.time * speed) * amplitude;
        const wave2 = this.noise2(x * freq * 2.5 + 5, this.time * speed * 0.7) * amplitude * 0.4;
        const y = baseY + wave1 + wave2;

        // Height of the vertical streak — varies with noise
        const streakHeight = 15 + Math.abs(this.noise(x * freq * 1.5, this.time * speed * 0.5)) * 60;

        // Intensity varies along the curtain — creates bright spots and dim areas
        const intensity = Math.max(0.05,
          (this.noise(x * freq * 0.8, this.time * speed * 0.3) + 0.5) * 0.8
        );

        // Vertical gradient streak
        const grad = this.ctx.createLinearGradient(x, y - streakHeight, x, y + streakHeight * 0.6);
        grad.addColorStop(0, 'transparent');
        grad.addColorStop(0.2, hexToRgba(color, intensity * 0.1));
        grad.addColorStop(0.4, hexToRgba(color, intensity * 0.35));
        grad.addColorStop(0.5, hexToRgba(color, intensity * 0.5));
        grad.addColorStop(0.65, hexToRgba(color, intensity * 0.3));
        grad.addColorStop(0.85, hexToRgba(color, intensity * 0.08));
        grad.addColorStop(1, 'transparent');

        this.ctx.fillStyle = grad;
        this.ctx.fillRect(x - 1.5, y - streakHeight, 3, streakHeight * 1.6);
      }

      // Broad atmospheric glow underneath each curtain
      const glowGrad = this.ctx.createRadialGradient(
        this.width / 2, baseY, 0,
        this.width / 2, baseY, this.width * 0.6
      );
      glowGrad.addColorStop(0, hexToRgba(color, 0.03));
      glowGrad.addColorStop(0.5, hexToRgba(color, 0.01));
      glowGrad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glowGrad;
      this.ctx.fillRect(0, 0, this.width, this.height);
    }

    this.ctx.globalCompositeOperation = 'source-over';
  }
}

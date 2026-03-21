// Sun Rays — radial god rays (crepuscular rays) with noise modulation
// Creates volumetric light shafts emanating from a source point

import { BaseVisualization, hexToRgba, LAB_PALETTE } from './base-visualization';
import { createNoise2D, createNoise3D } from './simplex-noise';

export class SunRays extends BaseVisualization {
  private noise2D = createNoise2D(71);
  private noise3D = createNoise3D(73);
  private time = 0;
  private sunX = 0;
  private sunY = 0;
  private numRays = 0;
  private dustParticles: { x: number; y: number; size: number; speed: number; phase: number }[] = [];

  protected init() {
    this.sunX = this.width * 0.5;
    this.sunY = this.height * 0.18;
    this.numRays = this.isMobile ? 40 : 80;

    // Floating dust/pollen particles in the light
    const numDust = this.isMobile ? 60 : 150;
    this.dustParticles = [];
    for (let i = 0; i < numDust; i++) {
      this.dustParticles.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        size: 0.5 + Math.random() * 1.5,
        speed: 0.1 + Math.random() * 0.3,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  protected update(t: number) {
    this.time = t * 0.001;

    // Sun position drifts gently
    this.sunX = this.width * 0.5 + Math.sin(this.time * 0.15) * this.width * 0.1;
    this.sunY = this.height * 0.18 + Math.cos(this.time * 0.1) * 15;

    // Mouse attracts sun
    if (this.mouseActive) {
      this.sunX += (this.mouseX - this.sunX) * 0.03;
      this.sunY += (this.mouseY * 0.3 - this.sunY) * 0.02;
    }

    // Update dust
    for (const p of this.dustParticles) {
      p.y += p.speed;
      p.x += Math.sin(this.time + p.phase) * 0.3;
      if (p.y > this.height + 5) {
        p.y = -5;
        p.x = Math.random() * this.width;
      }
    }
  }

  protected draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = LAB_PALETTE.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // ─── Sun glow ───
    const sunGlow1 = this.ctx.createRadialGradient(
      this.sunX, this.sunY, 0,
      this.sunX, this.sunY, this.height * 0.4
    );
    sunGlow1.addColorStop(0, hexToRgba(LAB_PALETTE.cream, 0.15));
    sunGlow1.addColorStop(0.3, hexToRgba(LAB_PALETTE.gold, 0.06));
    sunGlow1.addColorStop(0.6, hexToRgba(LAB_PALETTE.terracotta, 0.02));
    sunGlow1.addColorStop(1, 'transparent');
    this.ctx.fillStyle = sunGlow1;
    this.ctx.beginPath();
    this.ctx.arc(this.sunX, this.sunY, this.height * 0.4, 0, Math.PI * 2);
    this.ctx.fill();

    // Bright sun core
    const sunCore = this.ctx.createRadialGradient(
      this.sunX, this.sunY, 0,
      this.sunX, this.sunY, 25
    );
    sunCore.addColorStop(0, hexToRgba(LAB_PALETTE.cream, 0.4));
    sunCore.addColorStop(0.5, hexToRgba(LAB_PALETTE.gold, 0.15));
    sunCore.addColorStop(1, 'transparent');
    this.ctx.fillStyle = sunCore;
    this.ctx.beginPath();
    this.ctx.arc(this.sunX, this.sunY, 25, 0, Math.PI * 2);
    this.ctx.fill();

    // ─── God rays ───
    this.ctx.globalCompositeOperation = 'lighter';

    for (let i = 0; i < this.numRays; i++) {
      const baseAngle = (i / this.numRays) * Math.PI * 2;

      // Noise modulates ray visibility and width
      const noiseVal = this.noise3D(
        Math.cos(baseAngle) * 2,
        Math.sin(baseAngle) * 2,
        this.time * 0.3
      );

      // Some rays are "blocked" (shadow of clouds)
      if (noiseVal < -0.1) continue;

      const intensity = Math.max(0, noiseVal + 0.1) * 0.8;
      const rayWidth = 0.02 + intensity * 0.04;
      const rayLength = this.height * (0.5 + intensity * 0.4);

      const a1 = baseAngle - rayWidth;
      const a2 = baseAngle + rayWidth;

      // Ray as a triangle from sun to far edge
      const endX1 = this.sunX + Math.cos(a1) * rayLength;
      const endY1 = this.sunY + Math.sin(a1) * rayLength;
      const endX2 = this.sunX + Math.cos(a2) * rayLength;
      const endY2 = this.sunY + Math.sin(a2) * rayLength;

      // Gradient along the ray
      const rayGrad = this.ctx.createRadialGradient(
        this.sunX, this.sunY, 5,
        this.sunX, this.sunY, rayLength
      );

      // Color varies by angle — warmer below, cooler above
      const warmth = Math.sin(baseAngle) * 0.5 + 0.5; // 0=up, 1=down
      const color = warmth > 0.5 ? LAB_PALETTE.gold : LAB_PALETTE.cream;
      const alpha = intensity * 0.06;

      rayGrad.addColorStop(0, hexToRgba(color, alpha * 2));
      rayGrad.addColorStop(0.3, hexToRgba(color, alpha));
      rayGrad.addColorStop(1, 'transparent');

      this.ctx.fillStyle = rayGrad;
      this.ctx.beginPath();
      this.ctx.moveTo(this.sunX, this.sunY);
      this.ctx.lineTo(endX1, endY1);
      this.ctx.lineTo(endX2, endY2);
      this.ctx.closePath();
      this.ctx.fill();
    }

    // ─── Dust particles caught in the light ───
    for (const p of this.dustParticles) {
      // Brightness based on distance to sun
      const dx = p.x - this.sunX;
      const dy = p.y - this.sunY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const maxDist = this.height * 0.7;
      const brightness = Math.max(0, 1 - dist / maxDist);

      if (brightness <= 0) continue;

      const alpha = brightness * 0.3 * (0.5 + Math.sin(this.time * 2 + p.phase) * 0.5);
      const size = p.size * (1 + brightness);

      this.ctx.fillStyle = hexToRgba(LAB_PALETTE.cream, alpha);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalCompositeOperation = 'source-over';

    // ─── Atmospheric haze at bottom ───
    const hazeGrad = this.ctx.createLinearGradient(0, this.height * 0.6, 0, this.height);
    hazeGrad.addColorStop(0, 'transparent');
    hazeGrad.addColorStop(1, hexToRgba(LAB_PALETTE.terracotta, 0.04));
    this.ctx.fillStyle = hazeGrad;
    this.ctx.fillRect(0, this.height * 0.6, this.width, this.height * 0.4);
  }
}

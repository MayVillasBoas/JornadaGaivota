// Organic Blob Morphing - smooth metaballs driven by simplex noise
// Mouse attracts blobs. Blobs merge and split organically.

import { BaseVisualization, PALETTE_ARRAY, hexToRgba, LAB_PALETTE } from './base-visualization';
import { createNoise3D } from './simplex-noise';

interface Blob {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  phase: number;
  speed: number;
}

export class OrganicBlobs extends BaseVisualization {
  private noise = createNoise3D(31);
  private blobs: Blob[] = [];
  private time = 0;

  protected init() {
    const count = this.isMobile ? 5 : 8;
    this.blobs = [];

    for (let i = 0; i < count; i++) {
      this.blobs.push({
        baseX: this.width * (0.2 + Math.random() * 0.6),
        baseY: this.height * (0.2 + Math.random() * 0.6),
        x: 0, y: 0,
        radius: 40 + Math.random() * 60,
        color: PALETTE_ARRAY[i % PALETTE_ARRAY.length],
        phase: Math.random() * Math.PI * 2,
        speed: 0.3 + Math.random() * 0.4,
      });
    }
  }

  protected update(t: number) {
    this.time = t * 0.0005;

    for (const blob of this.blobs) {
      // Drift with noise
      blob.x = blob.baseX + this.noise(blob.phase, this.time * blob.speed, 0) * 80;
      blob.y = blob.baseY + this.noise(0, blob.phase, this.time * blob.speed) * 60;

      // Mouse attraction
      if (this.mouseActive) {
        const dx = this.mouseX - blob.x;
        const dy = this.mouseY - blob.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 250) {
          const pull = (1 - dist / 250) * 0.08;
          blob.x += dx * pull;
          blob.y += dy * pull;
        }
      }
    }
  }

  protected draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = LAB_PALETTE.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    // Draw with additive blending for merge effect
    this.ctx.globalCompositeOperation = 'screen';

    for (const blob of this.blobs) {
      // Deformed circle using noise
      const points = 60;
      const deformation = blob.radius * 0.3;

      this.ctx.beginPath();
      for (let i = 0; i <= points; i++) {
        const angle = (i / points) * Math.PI * 2;
        const noiseVal = this.noise(
          Math.cos(angle) * 2 + blob.phase,
          Math.sin(angle) * 2 + blob.phase,
          this.time * blob.speed
        );
        const r = blob.radius + noiseVal * deformation;
        const px = blob.x + Math.cos(angle) * r;
        const py = blob.y + Math.sin(angle) * r;

        if (i === 0) this.ctx.moveTo(px, py);
        else this.ctx.lineTo(px, py);
      }
      this.ctx.closePath();

      // Radial gradient fill
      const grad = this.ctx.createRadialGradient(
        blob.x, blob.y, 0,
        blob.x, blob.y, blob.radius * 1.5
      );
      grad.addColorStop(0, hexToRgba(blob.color, 0.35));
      grad.addColorStop(0.6, hexToRgba(blob.color, 0.15));
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.fill();

      // Inner glow
      const innerGrad = this.ctx.createRadialGradient(
        blob.x, blob.y, 0,
        blob.x, blob.y, blob.radius * 0.5
      );
      innerGrad.addColorStop(0, hexToRgba(blob.color, 0.2));
      innerGrad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = innerGrad;
      this.ctx.beginPath();
      this.ctx.arc(blob.x, blob.y, blob.radius * 0.5, 0, Math.PI * 2);
      this.ctx.fill();
    }

    this.ctx.globalCompositeOperation = 'source-over';
  }
}

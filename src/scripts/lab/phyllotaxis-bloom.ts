// Phyllotaxis Bloom - golden angle spiral building outward
// Creates sunflower/nautilus patterns. Mouse affects nearby points.

import { BaseVisualization, PALETTE_ARRAY, hexToRgba, LAB_PALETTE } from './base-visualization';

export class PhyllotaxisBloom extends BaseVisualization {
  private points: { x: number; y: number; r: number; color: string; angle: number }[] = [];
  private maxPoints: number = 0;
  private spacing = 5;
  private goldenAngle = 137.508 * (Math.PI / 180);
  private time = 0;
  private rotation = 0;

  protected init() {
    this.points = [];
    this.maxPoints = this.isMobile ? 1000 : 2000;
  }

  protected update(t: number) {
    this.time = t * 0.001;
    this.rotation = this.time * 0.02;

    // Add points gradually (3 per frame until max)
    const batchSize = Math.min(3, this.maxPoints - this.points.length);
    for (let b = 0; b < batchSize; b++) {
      const n = this.points.length;
      const angle = n * this.goldenAngle;
      const r = this.spacing * Math.sqrt(n);
      const colorIdx = Math.floor((r / (this.spacing * Math.sqrt(this.maxPoints))) * PALETTE_ARRAY.length);
      const color = PALETTE_ARRAY[Math.min(colorIdx, PALETTE_ARRAY.length - 1)];

      this.points.push({ x: 0, y: 0, r, color, angle });
    }

    // Update positions (rotate + compute cartesian)
    const cx = this.width / 2;
    const cy = this.height / 2;
    for (const p of this.points) {
      const a = p.angle + this.rotation;
      p.x = cx + Math.cos(a) * p.r;
      p.y = cy + Math.sin(a) * p.r;
    }
  }

  protected draw() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    this.ctx.fillStyle = LAB_PALETTE.bg;
    this.ctx.fillRect(0, 0, this.width, this.height);

    const maxR = this.spacing * Math.sqrt(this.maxPoints);

    for (const p of this.points) {
      // Base size scales with distance from center
      let size = 1.5 + (p.r / maxR) * 3;
      let alpha = 0.3 + (1 - p.r / maxR) * 0.4;

      // Mouse proximity effect
      if (this.mouseActive) {
        const dx = p.x - this.mouseX;
        const dy = p.y - this.mouseY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 80) {
          const influence = 1 - dist / 80;
          size += influence * 4;
          alpha = Math.min(1, alpha + influence * 0.4);
        }
      }

      // Draw point with glow
      const glow = this.ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, size * 2);
      glow.addColorStop(0, hexToRgba(p.color, alpha));
      glow.addColorStop(0.5, hexToRgba(p.color, alpha * 0.3));
      glow.addColorStop(1, 'transparent');
      this.ctx.fillStyle = glow;
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size * 2, 0, Math.PI * 2);
      this.ctx.fill();

      // Solid center dot
      this.ctx.fillStyle = hexToRgba(p.color, alpha * 0.8);
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, size * 0.4, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

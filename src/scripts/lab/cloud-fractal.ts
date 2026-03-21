// Cloud Fractal — bright daytime sky with white cumulus clouds
// Layered simplex noise creates drifting, morphing cloud formations

import { BaseVisualization, hexToRgba } from './base-visualization';
import { createNoise3D } from './simplex-noise';

export class CloudFractal extends BaseVisualization {
  private noise = createNoise3D(67);
  private noise2 = createNoise3D(89);
  private time = 0;
  private imageData: ImageData | null = null;

  protected init() {
    this.imageData = this.ctx.createImageData(
      Math.ceil(this.width * this.dpr),
      Math.ceil(this.height * this.dpr)
    );
  }

  protected update(t: number) {
    this.time = t * 0.0001;
  }

  protected draw() {
    if (!this.imageData) return;

    const w = Math.ceil(this.width);
    const h = Math.ceil(this.height);
    const data = this.imageData.data;

    // Render at lower resolution for performance
    const scale = this.isMobile ? 4 : 3;
    const sw = Math.ceil(w / scale);
    const sh = Math.ceil(h / scale);

    const buf = new Float32Array(sw * sh);

    // 3 octaves of noise for cloud density (reduced from 4 for speed)
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const nx = x / sw;
        const ny = y / sh;

        let density = 0;

        // Large billowing shapes
        density += this.noise(nx * 3, ny * 2, this.time) * 0.5;
        // Medium detail
        density += this.noise(nx * 6 + 10, ny * 5 + 10, this.time * 1.3) * 0.25;
        // Fine wisps
        density += this.noise2(nx * 12 + 20, ny * 10 + 20, this.time * 1.7) * 0.15;

        // Shape clouds — push toward middle heights
        const heightFactor = 1 - Math.pow((ny - 0.4) * 2.2, 2);
        density *= Math.max(0, heightFactor);

        // Threshold
        density = Math.max(0, (density + 0.05) * 1.8);

        buf[y * sw + x] = density;
      }
    }

    // Sky gradient: deep blue top → light blue horizon
    const skyTopR = 74, skyTopG = 144, skyTopB = 217;    // #4A90D9
    const skyBotR = 184, skyBotG = 212, skyBotB = 240;   // #B8D4F0

    for (let py = 0; py < h * this.dpr; py++) {
      for (let px = 0; px < w * this.dpr; px++) {
        const bx = Math.min(sw - 1, Math.floor((px / this.dpr) / scale));
        const by = Math.min(sh - 1, Math.floor((py / this.dpr) / scale));

        // Bilinear interpolation
        const bxf = ((px / this.dpr) / scale) - bx;
        const byf = ((py / this.dpr) / scale) - by;
        const bx1 = Math.min(sw - 1, bx + 1);
        const by1 = Math.min(sh - 1, by + 1);

        const d00 = buf[by * sw + bx];
        const d10 = buf[by * sw + bx1];
        const d01 = buf[by1 * sw + bx];
        const d11 = buf[by1 * sw + bx1];

        const density = d00 * (1-bxf) * (1-byf) + d10 * bxf * (1-byf) +
                        d01 * (1-bxf) * byf + d11 * bxf * byf;

        // Sky gradient based on vertical position
        const skyT = py / (h * this.dpr);
        let r = skyTopR + (skyBotR - skyTopR) * skyT;
        let g = skyTopG + (skyBotG - skyTopG) * skyT;
        let b = skyTopB + (skyBotB - skyTopB) * skyT;

        if (density > 0) {
          const d = Math.min(1, density);
          const brightness = d * d;

          // White clouds with slight warmth
          const cloudR = 255;
          const cloudG = 253;
          const cloudB = 250;

          // Cloud shadows: slightly blue-gray
          const shadowR = 180;
          const shadowG = 195;
          const shadowB = 215;

          // Mix: dense = bright white, thin = shadows
          const cr = cloudR * brightness + shadowR * (1 - brightness);
          const cg = cloudG * brightness + shadowG * (1 - brightness);
          const cb = cloudB * brightness + shadowB * (1 - brightness);

          // Blend cloud over sky
          const alpha = Math.min(1, d * 1.5);
          r = r + (cr - r) * alpha;
          g = g + (cg - g) * alpha;
          b = b + (cb - b) * alpha;
        }

        const idx = (py * w * this.dpr + px) * 4;
        data[idx] = Math.min(255, Math.max(0, r));
        data[idx + 1] = Math.min(255, Math.max(0, g));
        data[idx + 2] = Math.min(255, Math.max(0, b));
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Mouse creates a sun glow effect
    if (this.mouseActive) {
      const grad = this.ctx.createRadialGradient(
        this.mouseX, this.mouseY, 0,
        this.mouseX, this.mouseY, 100
      );
      grad.addColorStop(0, 'rgba(255, 250, 220, 0.15)');
      grad.addColorStop(0.4, 'rgba(255, 245, 200, 0.06)');
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(this.mouseX, this.mouseY, 100, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

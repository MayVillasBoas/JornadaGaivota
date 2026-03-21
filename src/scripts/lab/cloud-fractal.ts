// Cloud Fractal — volumetric cloud formations using layered simplex noise
// Creates cumulus, cirrus, and fog effects that drift and morph

import { BaseVisualization, hexToRgba, LAB_PALETTE } from './base-visualization';
import { createNoise3D } from './simplex-noise';

export class CloudFractal extends BaseVisualization {
  private noise = createNoise3D(67);
  private noise2 = createNoise3D(89);
  private time = 0;
  private imageData: ImageData | null = null;

  protected init() {
    // Pre-allocate image data for pixel manipulation
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

    // Render at lower resolution for performance, then scale
    const scale = this.isMobile ? 4 : 2;
    const sw = Math.ceil(w / scale);
    const sh = Math.ceil(h / scale);

    // Small buffer for the low-res cloud
    const buf = new Float32Array(sw * sh);

    // Layer multiple octaves of noise for cloud density
    for (let y = 0; y < sh; y++) {
      for (let x = 0; x < sw; x++) {
        const nx = x / sw;
        const ny = y / sh;

        // Multi-octave cloud density
        let density = 0;

        // Large billowing shapes
        density += this.noise(nx * 3, ny * 2, this.time) * 0.5;
        // Medium detail
        density += this.noise(nx * 6 + 10, ny * 5 + 10, this.time * 1.3) * 0.25;
        // Fine wisps
        density += this.noise2(nx * 12 + 20, ny * 10 + 20, this.time * 1.7) * 0.15;
        // Very fine texture
        density += this.noise2(nx * 24, ny * 20, this.time * 2) * 0.1;

        // Shape the clouds — push toward middle heights
        const heightFactor = 1 - Math.pow((ny - 0.35) * 2, 2);
        density *= Math.max(0, heightFactor);

        // Threshold for cloud vs sky
        density = Math.max(0, (density + 0.1) * 1.8);

        buf[y * sw + x] = density;
      }
    }

    // Render to image data with upscaling
    const bgR = 26, bgG = 26, bgB = 26;

    // Cloud colors — warm palette
    const cloudColors = [
      { r: 245, g: 240, b: 232, a: 1.0 },   // cream (main cloud body)
      { r: 61, g: 107, b: 90, a: 0.4 },      // sage tint (shadows)
      { r: 194, g: 122, b: 90, a: 0.3 },     // terracotta (sunset tint)
      { r: 139, g: 106, b: 173, a: 0.2 },    // lilac (atmospheric scatter)
    ];

    for (let py = 0; py < h * this.dpr; py++) {
      for (let px = 0; px < w * this.dpr; px++) {
        // Map pixel to buffer coordinate
        const bx = Math.min(sw - 1, Math.floor((px / this.dpr) / scale));
        const by = Math.min(sh - 1, Math.floor((py / this.dpr) / scale));

        // Bilinear interpolation for smoothness
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

        // Color based on density
        let r = bgR, g = bgG, b = bgB;

        if (density > 0) {
          const d = Math.min(1, density);

          // Mix cloud colors based on density level
          const main = cloudColors[0];
          const shadow = cloudColors[1];
          const sunset = cloudColors[2];
          const atmo = cloudColors[3];

          // Higher density = brighter (more cream), lower = more colored
          const brightness = d * d; // quadratic for soft edges
          r = bgR + (main.r - bgR) * brightness * 0.5
            + (sunset.r - bgR) * d * sunset.a * 0.3
            + (atmo.r - bgR) * (1 - d) * atmo.a * 0.2;
          g = bgG + (main.g - bgG) * brightness * 0.5
            + (shadow.g - bgG) * d * shadow.a * 0.2
            + (atmo.g - bgG) * (1 - d) * atmo.a * 0.2;
          b = bgB + (main.b - bgB) * brightness * 0.4
            + (atmo.b - bgB) * d * atmo.a * 0.3;
        }

        const idx = (py * w * this.dpr + px) * 4;
        data[idx] = Math.min(255, Math.max(0, r));
        data[idx + 1] = Math.min(255, Math.max(0, g));
        data[idx + 2] = Math.min(255, Math.max(0, b));
        data[idx + 3] = 255;
      }
    }

    this.ctx.putImageData(this.imageData, 0, 0);

    // Reset transform after putImageData (it works in pixel space)
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // Mouse creates a clearing/parting effect
    if (this.mouseActive) {
      const grad = this.ctx.createRadialGradient(
        this.mouseX, this.mouseY, 0,
        this.mouseX, this.mouseY, 80
      );
      grad.addColorStop(0, hexToRgba(LAB_PALETTE.gold, 0.08));
      grad.addColorStop(0.5, hexToRgba(LAB_PALETTE.cream, 0.03));
      grad.addColorStop(1, 'transparent');
      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(this.mouseX, this.mouseY, 80, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }
}

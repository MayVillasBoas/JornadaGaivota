// Edge of Chaos - Gray-Scott reaction-diffusion
// Life exists at the boundary between rigid order and total chaos.
// From "Notes on Complexity" by Neil Theise.

import { BaseVisualization } from './base-visualization';

export class EdgeOfChaos extends BaseVisualization {
  // Grid dimensions (~200x150, adjusted to aspect ratio)
  private cols = 0;
  private rows = 0;

  // Double-buffered U and V concentration grids
  private U!: Float32Array;
  private V!: Float32Array;
  private nextU!: Float32Array;
  private nextV!: Float32Array;

  // Reaction-diffusion parameters
  private Du = 0.21;
  private Dv = 0.105;
  private f = 0.035;
  private k = 0.065;

  // Mouse-driven parameter control
  private targetF = 0.035;
  private targetK = 0.065;
  private autoPhase = 0;

  // Rendering
  private imageData!: ImageData;

  // Pre-computed color LUT (256 entries for V mapped to rgb)
  private colorLUT!: Uint8Array; // 256 * 3

  protected init(): void {
    this.buildColorLUT();
    this.rebuildGrid();
  }

  protected resize(): void {
    super.resize();
    if (this.U) {
      this.rebuildGrid();
    }
  }

  private buildColorLUT(): void {
    // Map V concentration [0..1] -> color via 256-entry LUT
    // V ≈ 0.0 : dark bg    rgb(26, 26, 26)
    // V ≈ 0.15: sage green rgb(61, 107, 90)
    // V ≈ 0.3 : cream      rgb(245, 240, 232)
    const stops: { pos: number; r: number; g: number; b: number }[] = [
      { pos: 0.0,  r: 26,  g: 26,  b: 26  },
      { pos: 0.15, r: 61,  g: 107, b: 90  },
      { pos: 0.3,  r: 245, g: 240, b: 232 },
    ];

    this.colorLUT = new Uint8Array(256 * 3);

    for (let i = 0; i < 256; i++) {
      const v = i / 255;
      // Find the two stops we're between
      let r: number, g: number, b: number;
      if (v <= stops[0].pos) {
        r = stops[0].r; g = stops[0].g; b = stops[0].b;
      } else if (v >= stops[stops.length - 1].pos) {
        const s = stops[stops.length - 1];
        r = s.r; g = s.g; b = s.b;
      } else {
        let lo = stops[0], hi = stops[1];
        for (let j = 1; j < stops.length; j++) {
          if (v <= stops[j].pos) {
            lo = stops[j - 1];
            hi = stops[j];
            break;
          }
        }
        const t = (v - lo.pos) / (hi.pos - lo.pos);
        // Smoothstep interpolation
        const st = t * t * (3 - 2 * t);
        r = lo.r + (hi.r - lo.r) * st;
        g = lo.g + (hi.g - lo.g) * st;
        b = lo.b + (hi.b - lo.b) * st;
      }
      this.colorLUT[i * 3]     = Math.round(r);
      this.colorLUT[i * 3 + 1] = Math.round(g);
      this.colorLUT[i * 3 + 2] = Math.round(b);
    }
  }

  private rebuildGrid(): void {
    // Target ~200 columns, adjust rows to aspect ratio
    const targetCols = this.isMobile ? 120 : 200;
    const aspect = this.height / this.width;
    this.cols = targetCols;
    this.rows = Math.round(targetCols * aspect);
    if (this.rows < 50) this.rows = 50;

    const n = this.cols * this.rows;
    this.U = new Float32Array(n);
    this.V = new Float32Array(n);
    this.nextU = new Float32Array(n);
    this.nextV = new Float32Array(n);

    // Initialize: U=1 everywhere, V=0 everywhere
    this.U.fill(1.0);
    this.V.fill(0.0);

    // Seed many small circular spots with V=0.25 + noise
    const patchCount = 20 + Math.floor(Math.random() * 15);
    for (let p = 0; p < patchCount; p++) {
      const r = 2 + Math.floor(Math.random() * 3);
      const cx = r + Math.floor(Math.random() * (this.cols - r * 2));
      const cy = r + Math.floor(Math.random() * (this.rows - r * 2));
      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          if (dx * dx + dy * dy <= r * r) {
            const x = cx + dx;
            const y = cy + dy;
            if (x >= 0 && x < this.cols && y >= 0 && y < this.rows) {
              const idx = y * this.cols + x;
              this.U[idx] = 0.5 + Math.random() * 0.1;
              this.V[idx] = 0.25 + Math.random() * 0.05;
            }
          }
        }
      }
    }

    // Prepare ImageData at canvas pixel resolution
    this.imageData = this.ctx.createImageData(
      this.width * this.dpr,
      this.height * this.dpr,
    );
  }

  protected update(time: number): void {
    // --- Parameter control ---
    if (this.mouseActive) {
      const yNorm = Math.max(0, Math.min(1, this.mouseY / this.height));
      // Top (y=0): f=0.055, k=0.062 (ordered)
      // Mid (y=0.5): f=0.035, k=0.065 (edge of chaos)
      // Bot (y=1): f=0.012, k=0.055 (chaotic)
      if (yNorm <= 0.5) {
        const t = yNorm / 0.5; // 0..1 from top to mid
        this.targetF = 0.055 + (0.035 - 0.055) * t;
        this.targetK = 0.062 + (0.065 - 0.062) * t;
      } else {
        const t = (yNorm - 0.5) / 0.5; // 0..1 from mid to bot
        this.targetF = 0.035 + (0.012 - 0.035) * t;
        this.targetK = 0.065 + (0.055 - 0.065) * t;
      }
    } else {
      // Auto-oscillate f between 0.02 and 0.05
      this.autoPhase += 0.0005;
      const osc = (Math.sin(this.autoPhase) + 1) * 0.5; // 0..1
      this.targetF = 0.02 + osc * 0.03;
      // k follows a complementary curve for interesting patterns
      this.targetK = 0.06 + osc * 0.005;
    }

    // Smooth parameter transitions
    this.f += (this.targetF - this.f) * 0.02;
    this.k += (this.targetK - this.k) * 0.02;

    // --- Reaction-diffusion simulation (4-8 steps per frame) ---
    const steps = this.isMobile ? 8 : 16;
    const { cols, rows, Du, Dv } = this;
    const f = this.f;
    const k = this.k;

    for (let s = 0; s < steps; s++) {
      const U = this.U;
      const V = this.V;
      const nU = this.nextU;
      const nV = this.nextV;

      for (let y = 0; y < rows; y++) {
        const yUp = ((y - 1 + rows) % rows) * cols;
        const yDn = ((y + 1) % rows) * cols;
        const yC  = y * cols;

        for (let x = 0; x < cols; x++) {
          const xL = (x - 1 + cols) % cols;
          const xR = (x + 1) % cols;
          const i = yC + x;

          const u = U[i];
          const v = V[i];

          // 5-point stencil Laplacian: weights 0.2 for each neighbor, -0.8 for center
          const lapU = 0.2 * (U[yUp + x] + U[yDn + x] + U[yC + xL] + U[yC + xR]) - 0.8 * u;
          const lapV = 0.2 * (V[yUp + x] + V[yDn + x] + V[yC + xL] + V[yC + xR]) - 0.8 * v;

          const uvv = u * v * v;

          nU[i] = u + Du * lapU - uvv + f * (1.0 - u);
          nV[i] = v + Dv * lapV + uvv - (k + f) * v;
        }
      }

      // Swap buffers
      const tmpU = this.U;
      const tmpV = this.V;
      this.U = this.nextU;
      this.V = this.nextV;
      this.nextU = tmpU;
      this.nextV = tmpV;
    }
  }

  protected draw(): void {
    const { ctx, width, height, dpr } = this;
    const data = this.imageData.data;
    const imgW = Math.round(width * dpr);
    const imgH = Math.round(height * dpr);
    const { cols, rows, V, colorLUT } = this;

    // Scale factors from pixel space to grid space
    const scaleX = cols / imgW;
    const scaleY = rows / imgH;

    for (let py = 0; py < imgH; py++) {
      const gy = py * scaleY;
      const gy0 = Math.floor(gy);
      const gy1 = gy0 + 1 < rows ? gy0 + 1 : gy0;
      const fy = gy - gy0;
      const row0 = gy0 * cols;
      const row1 = gy1 * cols;

      const rowOffset = py * imgW;

      for (let px = 0; px < imgW; px++) {
        const gx = px * scaleX;
        const gx0 = Math.floor(gx);
        const gx1 = gx0 + 1 < cols ? gx0 + 1 : gx0;
        const fx = gx - gx0;

        // Bilinear interpolation of V
        const v00 = V[row0 + gx0];
        const v10 = V[row0 + gx1];
        const v01 = V[row1 + gx0];
        const v11 = V[row1 + gx1];
        const top = v00 + (v10 - v00) * fx;
        const bot = v01 + (v11 - v01) * fx;
        let v = top + (bot - top) * fy;

        // Clamp and map to LUT index
        if (v < 0) v = 0;
        if (v > 1) v = 1;
        const li = (v * 255) | 0;
        const li3 = li * 3;

        const pidx = (rowOffset + px) * 4;
        data[pidx]     = colorLUT[li3];
        data[pidx + 1] = colorLUT[li3 + 1];
        data[pidx + 2] = colorLUT[li3 + 2];
        data[pidx + 3] = 255;
      }
    }

    ctx.putImageData(this.imageData, 0, 0);

    // Reset transform for any overlay drawing
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // --- Parameter indicator bar on the left ---
    this.drawParameterIndicator();
  }

  private drawParameterIndicator(): void {
    const { ctx, height } = this;
    const barX = 12;
    const barW = 3;
    const barTop = height * 0.1;
    const barBottom = height * 0.9;
    const barH = barBottom - barTop;

    // Compute normalized parameter position (0=top/order, 1=bottom/chaos)
    // Map f back to yNorm approximation
    const fRange = 0.055 - 0.012;
    const param = 1 - (this.f - 0.012) / fRange;

    // Track background
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = '#F5F0E8';
    ctx.beginPath();
    ctx.roundRect(barX - 1, barTop, barW + 2, barH, 2);
    ctx.fill();

    // Gradient fill
    ctx.globalAlpha = 0.5;
    const grad = ctx.createLinearGradient(0, barTop, 0, barBottom);
    grad.addColorStop(0, '#3D6B5A');
    grad.addColorStop(0.5, '#ADA45A');
    grad.addColorStop(1, '#F5F0E8');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barTop + 1, barW, barH - 2, 1.5);
    ctx.fill();

    // Current position marker
    const markerY = barTop + param * barH;
    const edgeness = 1 - Math.abs(param - 0.5) * 2;

    // Glow behind marker
    if (edgeness > 0.2) {
      ctx.globalAlpha = edgeness * 0.4;
      ctx.fillStyle = '#ADA45A';
      ctx.beginPath();
      ctx.arc(barX + barW * 0.5, markerY, 6 + edgeness * 4, 0, Math.PI * 2);
      ctx.fill();
    }

    // Marker dot
    ctx.globalAlpha = 0.95;
    ctx.fillStyle = '#ffffff';
    ctx.beginPath();
    ctx.arc(barX + barW * 0.5, markerY, 3, 0, Math.PI * 2);
    ctx.fill();

    // Labels
    ctx.globalAlpha = 0.35;
    ctx.font = '9px system-ui, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillStyle = '#F5F0E8';
    ctx.fillText('ORDER', barX - 2, barTop - 6);
    ctx.fillText('CHAOS', barX - 2, barBottom + 14);

    if (edgeness > 0.5) {
      ctx.globalAlpha = (edgeness - 0.5) * 2 * 0.4;
      ctx.font = '8px system-ui, sans-serif';
      ctx.fillStyle = '#ADA45A';
      ctx.fillText('edge', barX + barW + 6, markerY + 3);
    }

    ctx.globalAlpha = 1;
  }
}

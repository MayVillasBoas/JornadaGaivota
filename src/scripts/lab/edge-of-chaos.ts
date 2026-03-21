// Edge of Chaos — quenched disorder visualization
// Life exists at the boundary between rigid order and total chaos.
// From "Notes on Complexity" by Neil Theise.

import { BaseVisualization, LAB_PALETTE, hexToRgba, PALETTE_ARRAY } from './base-visualization';
import { createNoise2D } from './simplex-noise';

// Parse hex colors to [r, g, b] for fast interpolation
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpColor(
  a: [number, number, number],
  b: [number, number, number],
  t: number,
): [number, number, number] {
  return [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t,
  ];
}

// Color stops: value 0..1 mapped to palette
const COLOR_STOPS: { pos: number; color: [number, number, number] }[] = [
  { pos: 0.0, color: hexToRgb(LAB_PALETTE.bg) },
  { pos: 0.18, color: hexToRgb(LAB_PALETTE.sage) },
  { pos: 0.38, color: hexToRgb(LAB_PALETTE.lilac) },
  { pos: 0.58, color: hexToRgb(LAB_PALETTE.terracotta) },
  { pos: 0.78, color: hexToRgb(LAB_PALETTE.cream) },
  { pos: 1.0, color: hexToRgb(LAB_PALETTE.gold) },
];

function valueToColor(v: number): [number, number, number] {
  const clamped = Math.max(0, Math.min(1, v));
  for (let i = 1; i < COLOR_STOPS.length; i++) {
    if (clamped <= COLOR_STOPS[i].pos) {
      const prev = COLOR_STOPS[i - 1];
      const next = COLOR_STOPS[i];
      const t = (clamped - prev.pos) / (next.pos - prev.pos);
      // Smooth-step for more organic transitions
      const st = t * t * (3 - 2 * t);
      return lerpColor(prev.color, next.color, st);
    }
  }
  return COLOR_STOPS[COLOR_STOPS.length - 1].color;
}

export class EdgeOfChaos extends BaseVisualization {
  private cols = 0;
  private rows = 0;
  private cellSize = 8;
  private grid: Float32Array = new Float32Array(0);
  private nextGrid: Float32Array = new Float32Array(0);
  private displayGrid: Float32Array = new Float32Array(0);

  // Order-chaos parameter: 0 = pure order, 1 = pure chaos
  private parameter = 0.5;
  private targetParameter = 0.5;
  private autoOscillate = true;

  private noise2d!: ReturnType<typeof createNoise2D>;
  private noise2dB!: ReturnType<typeof createNoise2D>;
  private timeOffset = 0;
  private lastTime = 0;

  // ImageData for fast pixel-level rendering
  private imageData!: ImageData;

  protected init(): void {
    this.noise2d = createNoise2D(137);
    this.noise2dB = createNoise2D(983);
    this.cellSize = this.isMobile ? 12 : 8;
    this.rebuildGrid();
    this.lastTime = 0;
  }

  protected resize(): void {
    super.resize();
    if (this.noise2d) {
      this.rebuildGrid();
    }
  }

  private rebuildGrid(): void {
    this.cols = Math.ceil(this.width / this.cellSize) + 1;
    this.rows = Math.ceil(this.height / this.cellSize) + 1;
    const total = this.cols * this.rows;

    const oldGrid = this.grid;
    const oldCols = oldGrid.length > 0 ? this.cols : 0;

    this.grid = new Float32Array(total);
    this.nextGrid = new Float32Array(total);
    this.displayGrid = new Float32Array(total);

    // Seed with noise
    for (let i = 0; i < total; i++) {
      const col = i % this.cols;
      const row = Math.floor(i / this.cols);
      const n = (this.noise2d(col * 0.08, row * 0.08) + 1) * 0.5;
      this.grid[i] = n;
      this.displayGrid[i] = n;
    }

    // Prepare image data at canvas pixel resolution
    this.imageData = this.ctx.createImageData(
      this.width * this.dpr,
      this.height * this.dpr,
    );
  }

  private idx(col: number, row: number): number {
    // Wrap-around boundaries for seamless edges
    const c = ((col % this.cols) + this.cols) % this.cols;
    const r = ((row % this.rows) + this.rows) % this.rows;
    return r * this.cols + c;
  }

  private neighborAverage(col: number, row: number): number {
    // Moore neighborhood (8 neighbors) with weighted center
    let sum = 0;
    let weight = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        if (dx === 0 && dy === 0) continue;
        const w = (dx === 0 || dy === 0) ? 1.0 : 0.707; // cardinal vs diagonal
        sum += this.grid[this.idx(col + dx, row + dy)] * w;
        weight += w;
      }
    }
    return sum / weight;
  }

  protected update(time: number): void {
    const dt = this.lastTime === 0 ? 16 : Math.min(time - this.lastTime, 50);
    this.lastTime = time;
    const dtSec = dt / 1000;

    this.timeOffset += dtSec;

    // --- Parameter control ---
    if (this.mouseActive) {
      // Mouse Y maps to parameter: top = 0 (order), bottom = 1 (chaos)
      this.targetParameter = Math.max(0, Math.min(1, this.mouseY / this.height));
      this.autoOscillate = false;
    } else {
      // Auto-oscillate: slow sine wave that lingers at the sweet spot
      if (!this.autoOscillate) {
        this.autoOscillate = true;
      }
      // Oscillation with a bias toward the middle (edge of chaos)
      const raw = Math.sin(this.timeOffset * 0.15) * 0.5 + 0.5;
      // Squash toward center to spend more time at the edge
      this.targetParameter = 0.15 + raw * 0.7;
    }

    // Smooth parameter transition
    const paramSpeed = 3.0;
    this.parameter += (this.targetParameter - this.parameter) * Math.min(1, dtSec * paramSpeed);

    // --- Cellular automaton update ---
    // The parameter controls the balance between neighbor influence and randomness
    // p=0: neighbors dominate (frozen order)
    // p=0.5: balance (edge of chaos - emergent complexity)
    // p=1: randomness dominates (noise chaos)

    const p = this.parameter;

    // Effective weights
    // At p=0: neighborWeight=1, noiseWeight=0
    // At p=1: neighborWeight=0, noiseWeight=1
    // We use a nonlinear curve so the "edge" zone is wider and more dramatic
    const curve = p * p * (3 - 2 * p); // smoothstep
    const neighborWeight = 1 - curve;
    const noiseWeight = curve;

    // How fast cells update (slower at edges of the parameter range)
    const edgeness = 1 - Math.abs(p - 0.5) * 2; // 0 at extremes, 1 at center
    const updateSpeed = 0.3 + edgeness * 0.7; // faster at edge of chaos

    // Noise scale changes: ordered = large scale, chaotic = tiny scale
    const noiseScale = 0.02 + p * 0.15;
    const noiseTimeScale = 0.3 + p * 2.0;

    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const i = row * this.cols + col;
        const current = this.grid[i];

        // Neighbor influence
        const navg = this.neighborAverage(col, row);

        // Noise influence (two octaves for richness)
        const n1 = (this.noise2d(
          col * noiseScale + this.timeOffset * noiseTimeScale * 0.3,
          row * noiseScale + this.timeOffset * noiseTimeScale * 0.2,
        ) + 1) * 0.5;
        const n2 = (this.noise2dB(
          col * noiseScale * 2.5 + this.timeOffset * noiseTimeScale * 0.7,
          row * noiseScale * 2.5 - this.timeOffset * noiseTimeScale * 0.5,
        ) + 1) * 0.5;
        const noiseVal = n1 * 0.65 + n2 * 0.35;

        // Combine: weighted blend of neighbor average and noise
        const target = navg * neighborWeight + noiseVal * noiseWeight;

        // At the edge of chaos, add a nonlinear feedback term
        // This creates the interesting emergent structures
        let feedback = 0;
        if (edgeness > 0.3) {
          const diff = navg - current;
          // Amplify differences slightly — this is what creates structure
          feedback = diff * edgeness * 0.4;
          // Add a gentle threshold effect: push values toward 0 or 1
          const centerDist = (current - 0.5) * 2; // -1 to 1
          feedback += centerDist * edgeness * 0.05;
        }

        const newVal = current + (target - current + feedback) * updateSpeed * dtSec * 3;
        this.nextGrid[i] = Math.max(0, Math.min(1, newVal));
      }
    }

    // Swap grids
    const tmp = this.grid;
    this.grid = this.nextGrid;
    this.nextGrid = tmp;

    // Smooth display values toward actual values (visual interpolation)
    const displayLerp = Math.min(1, dtSec * 12);
    for (let i = 0; i < this.grid.length; i++) {
      this.displayGrid[i] += (this.grid[i] - this.displayGrid[i]) * displayLerp;
    }
  }

  protected draw(): void {
    const { ctx, width, height, dpr } = this;
    const data = this.imageData.data;
    const imgW = Math.floor(width * dpr);
    const imgH = Math.floor(height * dpr);
    const cellPx = this.cellSize * dpr;
    const halfCell = cellPx * 0.5;

    // Clear to bg
    const bgRgb = hexToRgb(LAB_PALETTE.bg);

    // Fill all pixels — interpolate between cell centers for organic feel
    for (let py = 0; py < imgH; py++) {
      // Hex offset: odd rows shift right by half a cell
      const rawRow = py / cellPx;
      const row = Math.floor(rawRow);
      const fy = rawRow - row; // fractional position within cell

      for (let px = 0; px < imgW; px++) {
        // Offset odd rows for organic hex-like feel
        const offset = (row & 1) ? halfCell * 0.5 : 0;
        const rawCol = (px - offset) / cellPx;
        const col = Math.floor(rawCol);
        const fx = rawCol - col; // fractional position within cell

        // Bilinear interpolation between 4 nearest cell centers
        const c00 = this.displayGrid[this.idx(col, row)];
        const c10 = this.displayGrid[this.idx(col + 1, row)];
        const c01 = this.displayGrid[this.idx(col, row + 1)];
        const c11 = this.displayGrid[this.idx(col + 1, row + 1)];

        const sfx = fx * fx * (3 - 2 * fx); // smoothstep
        const sfy = fy * fy * (3 - 2 * fy);

        const top = c00 + (c10 - c00) * sfx;
        const bot = c01 + (c11 - c01) * sfx;
        const val = top + (bot - top) * sfy;

        const rgb = valueToColor(val);

        // Subtle glow: brighten active cells (those far from bg value)
        const activity = Math.abs(val - 0.1) * 0.15;
        const edgeness = 1 - Math.abs(this.parameter - 0.5) * 2;
        const glow = activity * edgeness;

        const idx = (py * imgW + px) * 4;
        data[idx] = Math.min(255, rgb[0] + glow * 40);
        data[idx + 1] = Math.min(255, rgb[1] + glow * 30);
        data[idx + 2] = Math.min(255, rgb[2] + glow * 20);
        data[idx + 3] = 255;
      }
    }

    ctx.putImageData(this.imageData, 0, 0);

    // Reset transform for overlay drawing (putImageData ignores transform)
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);

    // --- Parameter indicator bar on the left ---
    this.drawParameterIndicator();
  }

  private drawParameterIndicator(): void {
    const { ctx, width, height, parameter } = this;
    const barX = 12;
    const barW = 3;
    const barTop = height * 0.1;
    const barBottom = height * 0.9;
    const barH = barBottom - barTop;

    // Track background
    ctx.globalAlpha = 0.2;
    ctx.fillStyle = LAB_PALETTE.cream;
    ctx.beginPath();
    ctx.roundRect(barX - 1, barTop, barW + 2, barH, 2);
    ctx.fill();

    // Gradient fill showing the spectrum
    ctx.globalAlpha = 0.5;
    const grad = ctx.createLinearGradient(0, barTop, 0, barBottom);
    grad.addColorStop(0, LAB_PALETTE.sage);      // order
    grad.addColorStop(0.4, LAB_PALETTE.lilac);    // transition
    grad.addColorStop(0.5, LAB_PALETTE.gold);     // edge of chaos
    grad.addColorStop(0.6, LAB_PALETTE.terracotta);
    grad.addColorStop(1, LAB_PALETTE.cream);      // chaos
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.roundRect(barX, barTop + 1, barW, barH - 2, 1.5);
    ctx.fill();

    // Current position marker
    const markerY = barTop + parameter * barH;
    ctx.globalAlpha = 0.9;

    // Glow behind marker
    const edgeness = 1 - Math.abs(parameter - 0.5) * 2;
    if (edgeness > 0.2) {
      ctx.globalAlpha = edgeness * 0.4;
      ctx.fillStyle = LAB_PALETTE.gold;
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
    ctx.fillStyle = LAB_PALETTE.cream;
    ctx.fillText('ORDER', barX - 2, barTop - 6);
    ctx.fillText('CHAOS', barX - 2, barBottom + 14);

    // "Edge of chaos" label that appears when near the sweet spot
    if (edgeness > 0.5) {
      ctx.globalAlpha = (edgeness - 0.5) * 2 * 0.4;
      ctx.font = '8px system-ui, sans-serif';
      ctx.fillStyle = LAB_PALETTE.gold;
      ctx.fillText('edge', barX + barW + 6, markerY + 3);
    }

    ctx.globalAlpha = 1;
  }
}

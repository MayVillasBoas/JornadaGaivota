// Emergence Boids — flocking simulation
// Concept: EMERGENCE from "Notes on Complexity"
// Simple local rules (separation, alignment, cohesion) → complex global behavior

import { BaseVisualization, LAB_PALETTE, hexToRgba, PALETTE_ARRAY } from './base-visualization';
import { createNoise2D } from './simplex-noise';

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  color: string;
  colorIndex: number;
}

// ── Spatial hash grid for O(n) neighbor lookups ──────────────────────
class SpatialGrid {
  private cellSize: number;
  private cols: number;
  private rows: number;
  private cells: Int32Array;   // flat array of boid indices, packed
  private counts: Int32Array;  // how many boids in each cell
  private capacity: number;    // max boids per cell

  constructor(width: number, height: number, cellSize: number, maxPerCell: number) {
    this.cellSize = cellSize;
    this.cols = Math.ceil(width / cellSize) || 1;
    this.rows = Math.ceil(height / cellSize) || 1;
    this.capacity = maxPerCell;
    const totalCells = this.cols * this.rows;
    this.cells = new Int32Array(totalCells * maxPerCell);
    this.counts = new Int32Array(totalCells);
  }

  resize(width: number, height: number) {
    this.cols = Math.ceil(width / this.cellSize) || 1;
    this.rows = Math.ceil(height / this.cellSize) || 1;
    const totalCells = this.cols * this.rows;
    this.cells = new Int32Array(totalCells * this.capacity);
    this.counts = new Int32Array(totalCells);
  }

  clear() {
    this.counts.fill(0);
  }

  insert(index: number, x: number, y: number) {
    const col = Math.floor(x / this.cellSize) % this.cols;
    const row = Math.floor(y / this.cellSize) % this.rows;
    const c = (col < 0 ? col + this.cols : col);
    const r = (row < 0 ? row + this.rows : row);
    const cellIdx = r * this.cols + c;
    const count = this.counts[cellIdx];
    if (count < this.capacity) {
      this.cells[cellIdx * this.capacity + count] = index;
      this.counts[cellIdx] = count + 1;
    }
  }

  getNeighborIndices(x: number, y: number, result: number[]): number {
    let len = 0;
    const col = Math.floor(x / this.cellSize);
    const row = Math.floor(y / this.cellSize);

    for (let dr = -1; dr <= 1; dr++) {
      for (let dc = -1; dc <= 1; dc++) {
        let c = (col + dc) % this.cols;
        let r = (row + dr) % this.rows;
        if (c < 0) c += this.cols;
        if (r < 0) r += this.rows;
        const cellIdx = r * this.cols + c;
        const count = this.counts[cellIdx];
        for (let i = 0; i < count; i++) {
          result[len++] = this.cells[cellIdx * this.capacity + i];
        }
      }
    }
    return len;
  }
}

// ── Constants ────────────────────────────────────────────────────────
const CELL_SIZE = 50;
const PERCEPTION = 60;
const PERCEPTION_SQ = PERCEPTION * PERCEPTION;
const MAX_SPEED = 3;
const MAX_FORCE = 0.15;
const SEPARATION_WEIGHT = 1.8;
const ALIGNMENT_WEIGHT = 1.0;
const COHESION_WEIGHT = 1.0;
const MOUSE_REPEL_RADIUS = 120;
const MOUSE_REPEL_RADIUS_SQ = MOUSE_REPEL_RADIUS * MOUSE_REPEL_RADIUS;
const MOUSE_REPEL_STRENGTH = 0.35;
const BOID_SIZE = 5;
const NOISE_SCALE = 0.003;
const NOISE_STRENGTH = 0.08;

export class EmergenceBoids extends BaseVisualization {
  private boids: Boid[] = [];
  private grid!: SpatialGrid;
  private noise2D!: (x: number, y: number) => number;
  private neighborBuf: number[] = [];
  private time = 0;

  // Pre-computed glow gradients per palette color
  private glowCache: Map<string, CanvasGradient | null> = new Map();

  protected init(): void {
    this.noise2D = createNoise2D(12345);
    const count = this.isMobile ? 200 : 350;

    this.boids = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.5 + Math.random() * 1.5;
      const colorIndex = i % PALETTE_ARRAY.length;
      this.boids.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        color: PALETTE_ARRAY[colorIndex],
        colorIndex,
      });
    }

    this.grid = new SpatialGrid(this.width, this.height, CELL_SIZE, 32);
    this.neighborBuf = new Array(this.boids.length);
    this.glowCache.clear();
  }

  protected resize(): void {
    super.resize();
    if (this.grid) {
      this.grid.resize(this.width, this.height);
    }
  }

  protected update(time: number): void {
    this.time = time * 0.001;
    const { boids, grid, width, height } = this;
    const n = boids.length;

    // Rebuild spatial grid
    grid.clear();
    for (let i = 0; i < n; i++) {
      grid.insert(i, boids[i].x, boids[i].y);
    }

    // For each boid, compute flocking forces
    for (let i = 0; i < n; i++) {
      const b = boids[i];

      // Accumulate forces
      let sepX = 0, sepY = 0, sepCount = 0;
      let aliX = 0, aliY = 0, aliCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      // Query neighbors from spatial grid
      const nLen = grid.getNeighborIndices(b.x, b.y, this.neighborBuf);

      for (let ni = 0; ni < nLen; ni++) {
        const j = this.neighborBuf[ni];
        if (j === i) continue;
        const other = boids[j];

        // Toroidal distance
        let dx = other.x - b.x;
        let dy = other.y - b.y;
        if (dx > width * 0.5) dx -= width;
        else if (dx < -width * 0.5) dx += width;
        if (dy > height * 0.5) dy -= height;
        else if (dy < -height * 0.5) dy += height;

        const distSq = dx * dx + dy * dy;
        if (distSq > PERCEPTION_SQ || distSq < 0.0001) continue;

        // Separation (stronger when closer)
        const dist = Math.sqrt(distSq);
        sepX -= dx / dist;
        sepY -= dy / dist;
        sepCount++;

        // Alignment
        aliX += other.vx;
        aliY += other.vy;
        aliCount++;

        // Cohesion
        cohX += dx;
        cohY += dy;
        cohCount++;
      }

      let fx = 0, fy = 0;

      // Apply separation
      if (sepCount > 0) {
        sepX /= sepCount;
        sepY /= sepCount;
        const mag = Math.sqrt(sepX * sepX + sepY * sepY) || 1;
        fx += (sepX / mag) * MAX_FORCE * SEPARATION_WEIGHT;
        fy += (sepY / mag) * MAX_FORCE * SEPARATION_WEIGHT;
      }

      // Apply alignment
      if (aliCount > 0) {
        aliX /= aliCount;
        aliY /= aliCount;
        const mag = Math.sqrt(aliX * aliX + aliY * aliY) || 1;
        const desiredX = (aliX / mag) * MAX_SPEED;
        const desiredY = (aliY / mag) * MAX_SPEED;
        let steerX = desiredX - b.vx;
        let steerY = desiredY - b.vy;
        const sMag = Math.sqrt(steerX * steerX + steerY * steerY);
        if (sMag > MAX_FORCE) {
          steerX = (steerX / sMag) * MAX_FORCE;
          steerY = (steerY / sMag) * MAX_FORCE;
        }
        fx += steerX * ALIGNMENT_WEIGHT;
        fy += steerY * ALIGNMENT_WEIGHT;
      }

      // Apply cohesion
      if (cohCount > 0) {
        cohX /= cohCount;
        cohY /= cohCount;
        const mag = Math.sqrt(cohX * cohX + cohY * cohY) || 1;
        const desiredX = (cohX / mag) * MAX_SPEED;
        const desiredY = (cohY / mag) * MAX_SPEED;
        let steerX = desiredX - b.vx;
        let steerY = desiredY - b.vy;
        const sMag = Math.sqrt(steerX * steerX + steerY * steerY);
        if (sMag > MAX_FORCE) {
          steerX = (steerX / sMag) * MAX_FORCE;
          steerY = (steerY / sMag) * MAX_FORCE;
        }
        fx += steerX * COHESION_WEIGHT;
        fy += steerY * COHESION_WEIGHT;
      }

      // Noise perturbation for organic feel
      const noiseVal = this.noise2D(b.x * NOISE_SCALE + this.time * 0.2, b.y * NOISE_SCALE);
      const noiseAngle = noiseVal * Math.PI * 2;
      fx += Math.cos(noiseAngle) * NOISE_STRENGTH;
      fy += Math.sin(noiseAngle) * NOISE_STRENGTH;

      // Mouse repulsion
      if (this.mouseActive) {
        let mdx = b.x - this.mouseX;
        let mdy = b.y - this.mouseY;
        // No toroidal wrap for mouse — just direct
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq < MOUSE_REPEL_RADIUS_SQ && mDistSq > 0.01) {
          const mDist = Math.sqrt(mDistSq);
          const strength = (1 - mDist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_STRENGTH;
          fx += (mdx / mDist) * strength;
          fy += (mdy / mDist) * strength;
        }
      }

      // Apply forces
      b.vx += fx;
      b.vy += fy;

      // Clamp speed
      const speed = Math.sqrt(b.vx * b.vx + b.vy * b.vy);
      if (speed > MAX_SPEED) {
        b.vx = (b.vx / speed) * MAX_SPEED;
        b.vy = (b.vy / speed) * MAX_SPEED;
      }
      // Minimum speed so boids don't stall
      if (speed < 0.5) {
        b.vx = (b.vx / (speed || 1)) * 0.5;
        b.vy = (b.vy / (speed || 1)) * 0.5;
      }

      // Update position
      b.x += b.vx;
      b.y += b.vy;

      // Wrap edges (toroidal)
      if (b.x < 0) b.x += width;
      else if (b.x >= width) b.x -= width;
      if (b.y < 0) b.y += height;
      else if (b.y >= height) b.y -= height;
    }
  }

  protected draw(): void {
    const { ctx, width, height, boids } = this;

    // Semi-transparent background overlay for trail effect
    ctx.fillStyle = 'rgba(26,26,26,0.08)';
    ctx.fillRect(0, 0, width, height);

    // Draw each boid
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      const angle = Math.atan2(b.vy, b.vx);

      // Subtle glow
      const grad = ctx.createRadialGradient(b.x, b.y, 0, b.x, b.y, BOID_SIZE * 3);
      grad.addColorStop(0, hexToRgba(b.color, 0.15));
      grad.addColorStop(1, hexToRgba(b.color, 0));
      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(b.x, b.y, BOID_SIZE * 3, 0, Math.PI * 2);
      ctx.fill();

      // Triangle body pointing in velocity direction
      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);
      ctx.fillStyle = hexToRgba(b.color, 0.85);
      ctx.beginPath();
      ctx.moveTo(BOID_SIZE, 0);
      ctx.lineTo(-BOID_SIZE * 0.6, BOID_SIZE * 0.45);
      ctx.lineTo(-BOID_SIZE * 0.6, -BOID_SIZE * 0.45);
      ctx.closePath();
      ctx.fill();
      ctx.restore();
    }
  }
}

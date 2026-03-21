// Stigmergy — Self-Organization from the Bottom Up
// Inspired by ant colony trail-laying behavior
// From "Notes on Complexity": organization emerges without central control

import { BaseVisualization, LAB_PALETTE, hexToRgba, PALETTE_ARRAY } from './base-visualization';
import { createNoise2D } from './simplex-noise';

interface Agent {
  x: number;
  y: number;
  angle: number;
  speed: number;
}

interface FoodSource {
  x: number;
  y: number;
  strength: number;
  birthTime: number;
}

// Parse hex colors once for trail rendering
function hexToRgb(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const COLOR_GOLD = hexToRgb(LAB_PALETTE.gold);
const COLOR_CREAM = hexToRgb(LAB_PALETTE.cream);
const COLOR_SAGE = hexToRgb(LAB_PALETTE.sage);
const COLOR_LILAC = hexToRgb(LAB_PALETTE.lilac);
const COLOR_TERRACOTTA = hexToRgb(LAB_PALETTE.terracotta);
const COLOR_BG = hexToRgb(LAB_PALETTE.bg);

export class Stigmergy extends BaseVisualization {
  private agents: Agent[] = [];
  private trailMap!: Float32Array;
  private trailW = 0;
  private trailH = 0;
  private tempTrail!: Float32Array;
  private foodSources: FoodSource[] = [];
  private noise2D = createNoise2D(137);
  private imageData!: ImageData;
  private trailCanvas!: HTMLCanvasElement;
  private trailCtx!: CanvasRenderingContext2D;
  private frameCount = 0;
  private startTime = 0;

  // Simulation parameters
  private readonly CELL_SIZE = 4;
  private readonly SENSOR_DIST = 20;
  private readonly SENSOR_ANGLE = Math.PI / 6; // 30 degrees
  private readonly TURN_SPEED = 0.3;
  private readonly DEPOSIT_AMOUNT = 0.6;
  private readonly EVAPORATION = 0.985;
  private readonly DIFFUSION_WEIGHT = 0.18;
  private readonly FOOD_EMIT_RADIUS = 8; // in trail cells
  private readonly FOOD_EMIT_STRENGTH = 0.4;

  protected init(): void {
    this.startTime = performance.now();
    this.frameCount = 0;
    this.setupTrailMap();
    this.setupAgents();
    this.setupFoodSources();
    this.bindClick();
  }

  private setupTrailMap(): void {
    this.trailW = Math.ceil(this.width / this.CELL_SIZE);
    this.trailH = Math.ceil(this.height / this.CELL_SIZE);
    const size = this.trailW * this.trailH;
    this.trailMap = new Float32Array(size);
    this.tempTrail = new Float32Array(size);

    // Off-screen canvas for trail rendering
    this.trailCanvas = document.createElement('canvas');
    this.trailCanvas.width = this.trailW;
    this.trailCanvas.height = this.trailH;
    this.trailCtx = this.trailCanvas.getContext('2d')!;
    this.imageData = this.trailCtx.createImageData(this.trailW, this.trailH);
  }

  private setupAgents(): void {
    const count = this.isMobile ? 150 : 250;
    this.agents = [];

    for (let i = 0; i < count; i++) {
      this.agents.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        angle: Math.random() * Math.PI * 2,
        speed: 1.2 + Math.random() * 0.8,
      });
    }
  }

  private setupFoodSources(): void {
    this.foodSources = [];
    const count = 3 + Math.floor(Math.random() * 2);
    const margin = Math.min(this.width, this.height) * 0.15;

    for (let i = 0; i < count; i++) {
      this.foodSources.push({
        x: margin + Math.random() * (this.width - margin * 2),
        y: margin + Math.random() * (this.height - margin * 2),
        strength: 0.8 + Math.random() * 0.2,
        birthTime: this.startTime,
      });
    }
  }

  private _clickBound = false;
  private _clickHandler = (e: MouseEvent | TouchEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    let cx: number, cy: number;
    if ('touches' in e) {
      cx = e.touches[0].clientX - rect.left;
      cy = e.touches[0].clientY - rect.top;
    } else {
      cx = e.clientX - rect.left;
      cy = e.clientY - rect.top;
    }
    this.foodSources.push({
      x: cx,
      y: cy,
      strength: 0.9,
      birthTime: performance.now(),
    });
  };

  private bindClick(): void {
    if (this._clickBound) return;
    this._clickBound = true;
    this.canvas.addEventListener('click', this._clickHandler);
    this.canvas.addEventListener('touchstart', this._clickHandler as EventListener, { passive: true });
  }

  // --- Trail map operations ---

  private trailAt(cx: number, cy: number): number {
    if (cx < 0 || cx >= this.trailW || cy < 0 || cy >= this.trailH) return 0;
    return this.trailMap[cy * this.trailW + cx];
  }

  private senseAt(worldX: number, worldY: number): number {
    const cx = Math.floor(worldX / this.CELL_SIZE);
    const cy = Math.floor(worldY / this.CELL_SIZE);
    // Sample a small area for smoother sensing
    let sum = 0;
    for (let dy = -1; dy <= 1; dy++) {
      for (let dx = -1; dx <= 1; dx++) {
        sum += this.trailAt(cx + dx, cy + dy);
      }
    }
    return sum;
  }

  private deposit(worldX: number, worldY: number, amount: number): void {
    const cx = Math.floor(worldX / this.CELL_SIZE);
    const cy = Math.floor(worldY / this.CELL_SIZE);
    if (cx >= 0 && cx < this.trailW && cy >= 0 && cy < this.trailH) {
      this.trailMap[cy * this.trailW + cx] = Math.min(
        this.trailMap[cy * this.trailW + cx] + amount,
        3.0
      );
    }
  }

  private diffuseAndEvaporate(): void {
    const w = this.trailW;
    const h = this.trailH;
    const src = this.trailMap;
    const dst = this.tempTrail;
    const dw = this.DIFFUSION_WEIGHT;
    const center = 1 - dw;

    for (let y = 1; y < h - 1; y++) {
      const row = y * w;
      for (let x = 1; x < w - 1; x++) {
        const idx = row + x;
        // 3x3 box blur: weighted average of center + neighbors
        const neighbors =
          src[idx - w - 1] + src[idx - w] + src[idx - w + 1] +
          src[idx - 1]     +                  src[idx + 1] +
          src[idx + w - 1] + src[idx + w] + src[idx + w + 1];
        dst[idx] = (center * src[idx] + dw * (neighbors / 8)) * this.EVAPORATION;
      }
    }

    // Edges: just evaporate
    for (let x = 0; x < w; x++) {
      dst[x] = src[x] * this.EVAPORATION * 0.95;
      dst[(h - 1) * w + x] = src[(h - 1) * w + x] * this.EVAPORATION * 0.95;
    }
    for (let y = 0; y < h; y++) {
      dst[y * w] = src[y * w] * this.EVAPORATION * 0.95;
      dst[y * w + w - 1] = src[y * w + w - 1] * this.EVAPORATION * 0.95;
    }

    // Swap
    this.trailMap = dst;
    this.tempTrail = src;
  }

  private emitFromFoodSources(time: number): void {
    for (const food of this.foodSources) {
      const age = (time - food.birthTime) / 1000;
      // Pulse gently
      const pulse = 1 + 0.3 * Math.sin(age * 2.5);
      const r = this.FOOD_EMIT_RADIUS;
      const cx = Math.floor(food.x / this.CELL_SIZE);
      const cy = Math.floor(food.y / this.CELL_SIZE);

      for (let dy = -r; dy <= r; dy++) {
        for (let dx = -r; dx <= r; dx++) {
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist > r) continue;
          const tx = cx + dx;
          const ty = cy + dy;
          if (tx < 0 || tx >= this.trailW || ty < 0 || ty >= this.trailH) continue;
          const falloff = 1 - dist / r;
          const amount = this.FOOD_EMIT_STRENGTH * food.strength * falloff * falloff * pulse;
          const idx = ty * this.trailW + tx;
          this.trailMap[idx] = Math.min(this.trailMap[idx] + amount, 3.0);
        }
      }
    }
  }

  // --- Agent logic ---

  private updateAgents(time: number): void {
    const w = this.width;
    const h = this.height;

    for (const agent of this.agents) {
      // Sense three directions
      const leftAngle = agent.angle - this.SENSOR_ANGLE;
      const rightAngle = agent.angle + this.SENSOR_ANGLE;

      const senseL = this.senseAt(
        agent.x + Math.cos(leftAngle) * this.SENSOR_DIST,
        agent.y + Math.sin(leftAngle) * this.SENSOR_DIST
      );
      const senseC = this.senseAt(
        agent.x + Math.cos(agent.angle) * this.SENSOR_DIST,
        agent.y + Math.sin(agent.angle) * this.SENSOR_DIST
      );
      const senseR = this.senseAt(
        agent.x + Math.cos(rightAngle) * this.SENSOR_DIST,
        agent.y + Math.sin(rightAngle) * this.SENSOR_DIST
      );

      // Decision: turn toward strongest trail
      if (senseC >= senseL && senseC >= senseR) {
        // Keep going straight — slight random wander
        agent.angle += (Math.random() - 0.5) * 0.1;
      } else if (senseL > senseR) {
        agent.angle -= this.TURN_SPEED + (Math.random() - 0.5) * 0.05;
      } else if (senseR > senseL) {
        agent.angle += this.TURN_SPEED + (Math.random() - 0.5) * 0.05;
      } else {
        // Equal — random turn
        agent.angle += (Math.random() - 0.5) * this.TURN_SPEED;
      }

      // Add gentle noise-based wander so early movement looks organic
      const noiseVal = this.noise2D(agent.x * 0.005, agent.y * 0.005 + time * 0.00002);
      agent.angle += noiseVal * 0.08;

      // Mouse attraction: gently pull nearby agents
      if (this.mouseActive) {
        const dx = this.mouseX - agent.x;
        const dy = this.mouseY - agent.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 120 && dist > 1) {
          const attractAngle = Math.atan2(dy, dx);
          let diff = attractAngle - agent.angle;
          // Normalize
          while (diff > Math.PI) diff -= Math.PI * 2;
          while (diff < -Math.PI) diff += Math.PI * 2;
          agent.angle += diff * 0.06;
        }
      }

      // Move forward
      agent.x += Math.cos(agent.angle) * agent.speed;
      agent.y += Math.sin(agent.angle) * agent.speed;

      // Wrap around edges
      if (agent.x < 0) agent.x += w;
      if (agent.x >= w) agent.x -= w;
      if (agent.y < 0) agent.y += h;
      if (agent.y >= h) agent.y -= h;

      // Deposit trail
      this.deposit(agent.x, agent.y, this.DEPOSIT_AMOUNT);
    }
  }

  // --- Main loop ---

  protected update(time: number): void {
    this.frameCount++;

    // Emit from food sources
    this.emitFromFoodSources(time);

    // Update agents
    this.updateAgents(time);

    // Diffuse and evaporate trail
    this.diffuseAndEvaporate();

    // Deposit at mouse position for interactivity
    if (this.mouseActive) {
      this.deposit(this.mouseX, this.mouseY, 0.3);
    }
  }

  protected draw(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // Clear with dark background
    ctx.fillStyle = LAB_PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    // Render trail map to ImageData
    this.renderTrailImage();

    // Draw trail image scaled up to canvas
    this.trailCtx.putImageData(this.imageData, 0, 0);
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';
    ctx.drawImage(this.trailCanvas, 0, 0, this.trailW, this.trailH, 0, 0, w, h);

    // Draw food sources with pulse glow
    this.drawFoodSources();

    // Draw agents as tiny dots
    this.drawAgents();
  }

  private renderTrailImage(): void {
    const data = this.imageData.data;
    const tw = this.trailW;
    const th = this.trailH;
    const trail = this.trailMap;

    for (let y = 0; y < th; y++) {
      const row = y * tw;
      for (let x = 0; x < tw; x++) {
        const idx = row + x;
        const pIdx = idx * 4;
        const val = trail[idx];

        if (val < 0.01) {
          // Transparent / background
          data[pIdx] = COLOR_BG[0];
          data[pIdx + 1] = COLOR_BG[1];
          data[pIdx + 2] = COLOR_BG[2];
          data[pIdx + 3] = 255;
          continue;
        }

        // Map intensity to color:
        // Low (0-0.3): sage (dim, just forming)
        // Medium (0.3-0.8): lilac -> gold (established paths)
        // High (0.8+): cream/gold (highways, bright glow)
        let r: number, g: number, b: number, a: number;

        if (val < 0.3) {
          const t = val / 0.3;
          // Blend bg -> sage
          r = COLOR_BG[0] + (COLOR_SAGE[0] - COLOR_BG[0]) * t;
          g = COLOR_BG[1] + (COLOR_SAGE[1] - COLOR_BG[1]) * t;
          b = COLOR_BG[2] + (COLOR_SAGE[2] - COLOR_BG[2]) * t;
          a = 255;
        } else if (val < 0.8) {
          const t = (val - 0.3) / 0.5;
          // Blend sage -> gold
          r = COLOR_SAGE[0] + (COLOR_GOLD[0] - COLOR_SAGE[0]) * t;
          g = COLOR_SAGE[1] + (COLOR_GOLD[1] - COLOR_SAGE[1]) * t;
          b = COLOR_SAGE[2] + (COLOR_GOLD[2] - COLOR_SAGE[2]) * t;
          a = 255;
        } else if (val < 1.5) {
          const t = Math.min((val - 0.8) / 0.7, 1);
          // Blend gold -> cream (bright highways)
          r = COLOR_GOLD[0] + (COLOR_CREAM[0] - COLOR_GOLD[0]) * t;
          g = COLOR_GOLD[1] + (COLOR_CREAM[1] - COLOR_GOLD[1]) * t;
          b = COLOR_GOLD[2] + (COLOR_CREAM[2] - COLOR_GOLD[2]) * t;
          a = 255;
        } else {
          // Very high intensity: cream with slight bloom
          const bloom = Math.min((val - 1.5) / 1.5, 1);
          r = COLOR_CREAM[0] + (255 - COLOR_CREAM[0]) * bloom * 0.3;
          g = COLOR_CREAM[1] + (255 - COLOR_CREAM[1]) * bloom * 0.3;
          b = COLOR_CREAM[2] + (255 - COLOR_CREAM[2]) * bloom * 0.2;
          a = 255;
        }

        data[pIdx] = r;
        data[pIdx + 1] = g;
        data[pIdx + 2] = b;
        data[pIdx + 3] = a;
      }
    }
  }

  private drawFoodSources(): void {
    const ctx = this.ctx;
    const now = performance.now();

    for (const food of this.foodSources) {
      const age = (now - food.birthTime) / 1000;
      const pulse = 1 + 0.25 * Math.sin(age * 2.5);
      const baseRadius = 6 * pulse;

      // Outer glow
      const gradient = ctx.createRadialGradient(
        food.x, food.y, 0,
        food.x, food.y, baseRadius * 4
      );
      gradient.addColorStop(0, hexToRgba(LAB_PALETTE.gold, 0.35 * food.strength));
      gradient.addColorStop(0.4, hexToRgba(LAB_PALETTE.gold, 0.12 * food.strength));
      gradient.addColorStop(1, hexToRgba(LAB_PALETTE.gold, 0));
      ctx.fillStyle = gradient;
      ctx.beginPath();
      ctx.arc(food.x, food.y, baseRadius * 4, 0, Math.PI * 2);
      ctx.fill();

      // Core dot
      ctx.fillStyle = hexToRgba(LAB_PALETTE.cream, 0.7 * food.strength);
      ctx.beginPath();
      ctx.arc(food.x, food.y, 2.5 * pulse, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  private drawAgents(): void {
    const ctx = this.ctx;
    ctx.fillStyle = hexToRgba(LAB_PALETTE.terracotta, 0.6);

    ctx.beginPath();
    for (const agent of this.agents) {
      ctx.moveTo(agent.x + 1.2, agent.y);
      ctx.arc(agent.x, agent.y, 1.2, 0, Math.PI * 2);
    }
    ctx.fill();
  }

  protected resize(): void {
    super.resize();
    // Reinitialize trail map on resize if running
    if (this.running) {
      this.setupTrailMap();
      // Re-emit from food sources to keep continuity
    }
  }
}

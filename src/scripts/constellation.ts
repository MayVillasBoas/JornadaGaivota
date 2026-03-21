// src/scripts/constellation.ts
// Constellation layout engine + Canvas background for the Explore page

import type { LensState, Connection } from './explore-session';

// ─── Canvas Background (organic blobs + connection lines) ─────────────────────

// Rich blob colors matching CreamCosmos aesthetic (higher opacity, varied)
const BLOB_COLORS = [
  'rgba(61, 107, 90, 0.18)',   // sage
  'rgba(139, 106, 173, 0.16)', // lilac
  'rgba(194, 122, 90, 0.15)',  // terracotta
  'rgba(74, 122, 173, 0.14)',  // soft blue
  'rgba(173, 164, 90, 0.13)',  // warm gold
  'rgba(43, 74, 62, 0.12)',    // deep sage
  'rgba(160, 120, 160, 0.14)', // soft purple
  'rgba(200, 140, 100, 0.12)', // warm amber
];

// Prime-number cycle durations (seconds) — non-repeating patterns
const CYCLES = [13, 17, 23];

interface Blob {
  baseX: number;
  baseY: number;
  x: number;
  y: number;
  r: number;
  color: string;
  midColor: string;
  phase: number;
}

export class ConstellationCanvas {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private blobs: Blob[] = [];
  private raf = 0;
  private running = false;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private parallaxX = 0;
  private parallaxY = 0;
  private isMobile = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.isMobile = window.innerWidth < 768;
    this.resize();
    this.initBlobs();

    window.addEventListener('resize', () => {
      this.isMobile = window.innerWidth < 768;
      this.resize();
      this.initBlobs();
    });

    // Mouse parallax (desktop only)
    if (!this.isMobile) {
      window.addEventListener('mousemove', (e) => {
        this.parallaxX = e.clientX - this.width / 2;
        this.parallaxY = e.clientY - this.height / 2;
      });
    }
  }

  private resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  private initBlobs() {
    const count = this.isMobile ? 6 : 12;
    this.blobs = [];
    for (let i = 0; i < count; i++) {
      const color = BLOB_COLORS[i % BLOB_COLORS.length];
      // Create a mid-stop color at ~50% opacity of the main
      const midColor = color.replace(/[\d.]+\)$/, (m) => `${parseFloat(m) * 0.35})`);

      this.blobs.push({
        baseX: Math.random() * this.width,
        baseY: Math.random() * this.height,
        x: 0,
        y: 0,
        r: 60 + Math.random() * 140,
        color,
        midColor,
        phase: Math.random() * Math.PI * 2,
      });
    }
  }

  start() {
    if (this.running) return;
    this.running = true;
    const animate = (time: number) => {
      if (!this.running) return;
      this.drawFrame(time);
      this.raf = requestAnimationFrame(animate);
    };
    this.raf = requestAnimationFrame(animate);
  }

  stop() {
    this.running = false;
    cancelAnimationFrame(this.raf);
  }

  private drawFrame(time: number) {
    this.ctx.clearRect(0, 0, this.width, this.height);

    for (let i = 0; i < this.blobs.length; i++) {
      const blob = this.blobs[i];
      const cycle = CYCLES[i % CYCLES.length];
      const speed = (Math.PI * 2) / (cycle * 1000);
      const t = time * speed + blob.phase;

      const px = this.isMobile ? 0 : this.parallaxX * 0.02;
      const py = this.isMobile ? 0 : this.parallaxY * 0.02;

      blob.x = blob.baseX + Math.sin(t) * 40 + px;
      blob.y = blob.baseY + Math.cos(t * 0.7) * 30 + py;

      // Wrap around
      const wx = ((blob.x % this.width) + this.width) % this.width;
      const wy = ((blob.y % this.height) + this.height) % this.height;

      // 3-stop radial gradient (matching CreamCosmos richness)
      const grad = this.ctx.createRadialGradient(wx, wy, 0, wx, wy, blob.r);
      grad.addColorStop(0, blob.color);
      grad.addColorStop(0.5, blob.midColor);
      grad.addColorStop(1, 'rgba(0,0,0,0)');

      this.ctx.fillStyle = grad;
      this.ctx.beginPath();
      this.ctx.arc(wx, wy, blob.r, 0, Math.PI * 2);
      this.ctx.fill();
    }
  }

  /** Draw bezier connection lines between orb positions */
  drawConnections(
    connections: Connection[],
    orbPositions: Map<string, { x: number; y: number; color: string }>,
  ) {
    for (const conn of connections) {
      const from = orbPositions.get(conn.from);
      const to = orbPositions.get(conn.to);
      if (!from || !to) continue;

      const midX = (from.x + to.x) / 2;
      const midY = (from.y + to.y) / 2;
      const dx = to.x - from.x;
      const dy = to.y - from.y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist === 0) continue;
      const offset = dist * 0.2;
      const cpX = midX - (dy / dist) * offset;
      const cpY = midY + (dx / dist) * offset;

      this.ctx.strokeStyle = hexToRgba(from.color, 0.2);
      this.ctx.lineWidth = 1.5;
      this.ctx.beginPath();
      this.ctx.moveTo(from.x, from.y);
      this.ctx.quadraticCurveTo(cpX, cpY, to.x, to.y);
      this.ctx.stroke();

      // Glow at endpoints
      for (const pt of [from, to]) {
        const glow = this.ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, 8);
        glow.addColorStop(0, hexToRgba(pt.color, 0.15));
        glow.addColorStop(1, 'transparent');
        this.ctx.fillStyle = glow;
        this.ctx.beginPath();
        this.ctx.arc(pt.x, pt.y, 8, 0, Math.PI * 2);
        this.ctx.fill();
      }
    }
  }
}

// ─── Orb Layout Engine ────────────────────────────────────────────────────────

export interface OrbPosition {
  x: number;
  y: number;
  size: number;
}

/**
 * Calculate orb positions in polar coordinates from center,
 * spread by category to create organic clustering.
 */
export function calculateOrbPositions(
  lenses: LensState[],
  containerWidth: number,
  containerHeight: number,
): Map<string, OrbPosition> {
  const positions = new Map<string, OrbPosition>();
  const cx = containerWidth / 2;
  const cy = containerHeight / 2;
  const maxRadius = Math.min(containerWidth, containerHeight) * 0.32;

  const count = lenses.length;
  if (count === 0) return positions;

  // Distribute evenly around the center with golden angle for organic feel
  const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5°

  lenses.forEach((lens, i) => {
    const angle = i * goldenAngle;

    // Distance: first orb closer, later ones further out
    // Also modulated by relevance (higher relevance = closer)
    const ringFraction = (i + 1) / (count + 1);
    const distance = maxRadius * (0.35 + ringFraction * 0.65) * (1.1 - lens.relevance * 0.3);

    // Orb size based on relevance (50-80px)
    const size = 50 + lens.relevance * 30;

    // Small jitter for organic feel
    const jitterX = Math.sin(i * 7.3 + 0.5) * 15;
    const jitterY = Math.cos(i * 5.7 + 0.5) * 15;

    positions.set(lens.principleId, {
      x: cx + Math.cos(angle) * distance + jitterX,
      y: cy + Math.sin(angle) * distance + jitterY,
      size,
    });
  });

  return positions;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function hexToRgba(hex: string, alpha: number): string {
  // Handle both hex and rgba formats
  if (hex.startsWith('rgba') || hex.startsWith('rgb')) return hex;
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

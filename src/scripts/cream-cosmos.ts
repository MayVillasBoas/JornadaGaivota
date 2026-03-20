// src/scripts/cream-cosmos.ts
// Cream Cosmos — animated canvas hero with organic blobs and mentor orbit points

export interface MentorPoint {
  slug: string;
  name: string;
  color: string;
}

// ---------------------------------------------------------------------------
// Blob — organic radial-gradient circle that drifts sinusoidally
// ---------------------------------------------------------------------------

const BLOB_COLORS = [
  'rgba(61, 107, 90, 0.18)',   // sage
  'rgba(139, 106, 173, 0.16)', // lilac
  'rgba(194, 122, 90, 0.15)',  // terracotta
  'rgba(74, 122, 173, 0.12)',  // soft blue
  'rgba(173, 164, 90, 0.12)',  // warm gold
];

class Blob {
  x: number;
  y: number;
  radius: number;
  color: string;
  vx: number;
  vy: number;
  phase: number;
  baseX: number;
  baseY: number;

  constructor(w: number, h: number) {
    this.baseX = Math.random() * w;
    this.baseY = Math.random() * h;
    this.x = this.baseX;
    this.y = this.baseY;
    this.radius = 60 + Math.random() * 90; // 60-150
    this.color = BLOB_COLORS[Math.floor(Math.random() * BLOB_COLORS.length)];
    this.vx = (Math.random() - 0.5) * 0.3;
    this.vy = (Math.random() - 0.5) * 0.3;
    this.phase = Math.random() * Math.PI * 2;
  }

  update(t: number, cycleDuration: number, parallaxX: number, parallaxY: number) {
    const speed = (Math.PI * 2) / (cycleDuration * 1000);
    this.x = this.baseX + Math.sin(t * speed + this.phase) * 40 + parallaxX * 0.02;
    this.y = this.baseY + Math.cos(t * speed * 0.7 + this.phase) * 30 + parallaxY * 0.02;
  }

  draw(ctx: CanvasRenderingContext2D) {
    const gradient = ctx.createRadialGradient(
      this.x, this.y, 0,
      this.x, this.y, this.radius,
    );
    gradient.addColorStop(0, this.color);
    gradient.addColorStop(0.5, this.color.replace(/[\d.]+\)$/, '0.06)'));
    gradient.addColorStop(1, 'rgba(0,0,0,0)');
    ctx.beginPath();
    ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();
  }
}

// ---------------------------------------------------------------------------
// OrbitPoint — a mentor point orbiting in an elliptical ring
// ---------------------------------------------------------------------------

interface OrbitPointData {
  mentor: MentorPoint;
  ring: number;        // 0, 1, 2
  angle: number;       // current angle in radians
  startAngle: number;  // initial angle offset
  screenX: number;
  screenY: number;
}

const RING_SPEEDS = [0.0004, 0.0003, 0.0002]; // rad/frame-ms

function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

// ---------------------------------------------------------------------------
// CreamCosmos — main class
// ---------------------------------------------------------------------------

export class CreamCosmos {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private mentors: MentorPoint[];
  private blobs: Blob[] = [];
  private orbitPoints: OrbitPointData[] = [];
  private animId: number | null = null;
  private running = false;
  private reducedMotion = false;
  private isMobile = false;
  private width = 0;
  private height = 0;
  private dpr = 1;
  private parallaxX = 0;
  private parallaxY = 0;
  private hoverCb: ((m: MentorPoint | null) => void) | null = null;
  private clickCb: ((m: MentorPoint) => void) | null = null;
  private hoveredPoint: OrbitPointData | null = null;
  private resizeTimer: ReturnType<typeof setTimeout> | null = null;
  private observer: IntersectionObserver | null = null;
  private visible = true;

  // Prime-number cycle durations for blob groups (seconds)
  private readonly CYCLES = [13, 17, 23];

  constructor(canvas: HTMLCanvasElement, mentors: MentorPoint[]) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.mentors = mentors;
    this.reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    this.isMobile = window.innerWidth < 768;
    this.dpr = window.devicePixelRatio || 1;
    this.resize();
    this.createBlobs();
    this.createOrbitPoints();
  }

  // --- Public API ---

  start(): void {
    this.bindEvents();
    this.setupIntersectionObserver();
    if (this.reducedMotion) {
      this.drawStatic();
      return;
    }
    this.running = true;
    this.loop(performance.now());
  }

  stop(): void {
    this.running = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
    this.unbindEvents();
    this.observer?.disconnect();
  }

  onMentorHover(callback: (mentor: MentorPoint | null) => void): void {
    this.hoverCb = callback;
  }

  onMentorClick(callback: (mentor: MentorPoint) => void): void {
    this.clickCb = callback;
  }

  // --- Internal ---

  private resize() {
    const parent = this.canvas.parentElement;
    if (!parent) return;
    this.width = parent.clientWidth;
    this.height = parent.clientHeight;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.canvas.style.width = `${this.width}px`;
    this.canvas.style.height = `${this.height}px`;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    this.isMobile = window.innerWidth < 768;
  }

  private createBlobs() {
    const count = this.isMobile ? 6 : 12;
    this.blobs = [];
    for (let i = 0; i < count; i++) {
      this.blobs.push(new Blob(this.width, this.height));
    }
  }

  private createOrbitPoints() {
    const cx = this.width / 2;
    const cy = this.height / 2;
    this.orbitPoints = [];
    const mentorsPerRing = [4, 4, 4];
    let idx = 0;
    for (let ring = 0; ring < 3; ring++) {
      const count = mentorsPerRing[ring];
      for (let j = 0; j < count; j++) {
        if (idx >= this.mentors.length) break;
        const startAngle = (j / count) * Math.PI * 2 + ring * 0.5;
        this.orbitPoints.push({
          mentor: this.mentors[idx],
          ring,
          angle: startAngle,
          startAngle,
          screenX: cx,
          screenY: cy,
        });
        idx++;
      }
    }
  }

  private getEllipse(ring: number): { rx: number; ry: number } {
    const base = this.isMobile ? 0.25 : 0.3;
    const scale = base + ring * (this.isMobile ? 0.1 : 0.12);
    return {
      rx: this.width * scale,
      ry: this.height * scale * 0.55,
    };
  }

  private updateOrbitPoints(t: number) {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const speedMul = this.isMobile ? 0.5 : 1;
    for (const pt of this.orbitPoints) {
      const speed = RING_SPEEDS[pt.ring] * speedMul;
      pt.angle = pt.startAngle + t * speed;
      const { rx, ry } = this.getEllipse(pt.ring);
      pt.screenX = cx + Math.cos(pt.angle) * rx;
      pt.screenY = cy + Math.sin(pt.angle) * ry;
    }
  }

  private drawOrbitPoints() {
    for (const pt of this.orbitPoints) {
      const isHovered = pt === this.hoveredPoint;
      const r = isHovered ? 6 : 4;
      const alpha = isHovered ? 0.95 : 0.7;

      // Glow
      this.ctx.beginPath();
      this.ctx.arc(pt.screenX, pt.screenY, r + 6, 0, Math.PI * 2);
      this.ctx.fillStyle = hexToRgba(pt.mentor.color, alpha * 0.25);
      this.ctx.fill();

      // Dot
      this.ctx.beginPath();
      this.ctx.arc(pt.screenX, pt.screenY, r, 0, Math.PI * 2);
      this.ctx.fillStyle = hexToRgba(pt.mentor.color, alpha);
      this.ctx.fill();
    }
  }

  private loop = (t: number) => {
    if (!this.running) return;
    if (!this.visible) {
      this.animId = requestAnimationFrame(this.loop);
      return;
    }

    this.ctx.clearRect(0, 0, this.width, this.height);

    // Draw blobs
    for (let i = 0; i < this.blobs.length; i++) {
      const cycle = this.CYCLES[i % this.CYCLES.length];
      this.blobs[i].update(t, cycle, this.parallaxX, this.parallaxY);
      this.blobs[i].draw(this.ctx);
    }

    // Update & draw orbit points
    this.updateOrbitPoints(t);
    this.drawOrbitPoints();

    this.animId = requestAnimationFrame(this.loop);
  };

  private drawStatic() {
    this.ctx.clearRect(0, 0, this.width, this.height);
    for (const blob of this.blobs) {
      blob.draw(this.ctx);
    }
    this.updateOrbitPoints(0);
    this.drawOrbitPoints();
  }

  // --- Events ---

  private onMouseMove = (e: MouseEvent) => {
    if (this.isMobile) return;
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Parallax
    this.parallaxX = (mx - this.width / 2);
    this.parallaxY = (my - this.height / 2);

    // Hover detection
    let found: OrbitPointData | null = null;
    for (const pt of this.orbitPoints) {
      const dx = mx - pt.screenX;
      const dy = my - pt.screenY;
      if (Math.sqrt(dx * dx + dy * dy) < 15) {
        found = pt;
        break;
      }
    }
    if (found !== this.hoveredPoint) {
      this.hoveredPoint = found;
      this.canvas.style.cursor = found ? 'pointer' : '';
      this.hoverCb?.(found ? found.mentor : null);
    }
  };

  private onClick = (e: MouseEvent) => {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;
    for (const pt of this.orbitPoints) {
      const dx = mx - pt.screenX;
      const dy = my - pt.screenY;
      if (Math.sqrt(dx * dx + dy * dy) < 15) {
        this.clickCb?.(pt.mentor);
        return;
      }
    }
  };

  private onTouchEnd = (e: TouchEvent) => {
    if (!e.changedTouches.length) return;
    const touch = e.changedTouches[0];
    const rect = this.canvas.getBoundingClientRect();
    const mx = touch.clientX - rect.left;
    const my = touch.clientY - rect.top;
    for (const pt of this.orbitPoints) {
      const dx = mx - pt.screenX;
      const dy = my - pt.screenY;
      if (Math.sqrt(dx * dx + dy * dy) < 20) {
        this.clickCb?.(pt.mentor);
        return;
      }
    }
  };

  private onResize = () => {
    if (this.resizeTimer) clearTimeout(this.resizeTimer);
    this.resizeTimer = setTimeout(() => {
      this.resize();
      this.createBlobs();
      this.createOrbitPoints();
      if (this.reducedMotion) this.drawStatic();
    }, 150);
  };

  private bindEvents() {
    this.canvas.addEventListener('mousemove', this.onMouseMove);
    this.canvas.addEventListener('click', this.onClick);
    this.canvas.addEventListener('touchend', this.onTouchEnd);
    window.addEventListener('resize', this.onResize);
  }

  private unbindEvents() {
    this.canvas.removeEventListener('mousemove', this.onMouseMove);
    this.canvas.removeEventListener('click', this.onClick);
    this.canvas.removeEventListener('touchend', this.onTouchEnd);
    window.removeEventListener('resize', this.onResize);
  }

  private setupIntersectionObserver() {
    this.observer = new IntersectionObserver(
      ([entry]) => { this.visible = entry.isIntersecting; },
      { threshold: 0.05 },
    );
    this.observer.observe(this.canvas);
  }
}

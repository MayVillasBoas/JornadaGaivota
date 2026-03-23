// Permeable Boundaries - particle cluster exchange
// Concept: INTERCONNECTION from "Notes on Complexity"
// Boundaries between us are not walls but zones of exchange.
// "Every atom belonging to me as good belongs to you." - Whitman

import { BaseVisualization, LAB_PALETTE, hexToRgba, PALETTE_ARRAY } from './base-visualization';
import { createNoise2D } from './simplex-noise';

// ── Types ────────────────────────────────────────────────────────────

interface Cluster {
  x: number;
  y: number;
  baseX: number;
  baseY: number;
  color: string;
  r: number;
  g: number;
  b: number;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  cluster: number;
  r: number;
  g: number;
  b: number;
  targetR: number;
  targetG: number;
  targetB: number;
  migrating: boolean;
  migrationProgress: number;
  migrationFrom: number;
  angle: number;
  orbitRadius: number;
  size: number;
}

interface Bridge {
  x: number;
  y: number;
  life: number;
  maxLife: number;
  clusterA: number;
  clusterB: number;
}

// ── Helpers ──────────────────────────────────────────────────────────

function parseHex(hex: string): [number, number, number] {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

function lerpColor(
  r1: number, g1: number, b1: number,
  r2: number, g2: number, b2: number,
  t: number,
): [number, number, number] {
  return [
    r1 + (r2 - r1) * t,
    g1 + (g2 - g1) * t,
    b1 + (b2 - b1) * t,
  ];
}

function dist(x1: number, y1: number, x2: number, y2: number): number {
  const dx = x1 - x2;
  const dy = y1 - y2;
  return Math.sqrt(dx * dx + dy * dy);
}

// ── Main class ───────────────────────────────────────────────────────

export class PermeableBoundaries extends BaseVisualization {
  private noise = createNoise2D(77);
  private noise2 = createNoise2D(133);
  private clusters: Cluster[] = [];
  private particles: Particle[] = [];
  private bridges: Bridge[] = [];
  private time = 0;
  private particleCount = 300;
  private clusterCount = 5;

  protected init(): void {
    this.particleCount = this.isMobile ? 200 : 300;
    this.clusterCount = this.isMobile ? 4 : 5;
    this.clusters = [];
    this.particles = [];
    this.bridges = [];
    this.time = 0;

    this.initClusters();
    this.initParticles();
  }

  // ── Cluster placement ──────────────────────────────────────────────

  private initClusters(): void {
    const cx = this.width / 2;
    const cy = this.height / 2;
    const spread = Math.min(this.width, this.height) * 0.3;

    for (let i = 0; i < this.clusterCount; i++) {
      const angle = (i / this.clusterCount) * Math.PI * 2 + Math.PI * 0.15;
      const r = spread * (0.6 + 0.4 * ((i % 2 === 0) ? 1 : 0.7));
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      const color = PALETTE_ARRAY[i % PALETTE_ARRAY.length];
      const [cr, cg, cb] = parseHex(color);

      this.clusters.push({
        x, y,
        baseX: x,
        baseY: y,
        color,
        r: cr, g: cg, b: cb,
      });
    }
  }

  // ── Particle seeding ───────────────────────────────────────────────

  private initParticles(): void {
    for (let i = 0; i < this.particleCount; i++) {
      const clusterIdx = i % this.clusterCount;
      const cluster = this.clusters[clusterIdx];
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 100 + 20;
      const x = cluster.x + Math.cos(angle) * radius;
      const y = cluster.y + Math.sin(angle) * radius;

      this.particles.push({
        x, y,
        vx: 0, vy: 0,
        cluster: clusterIdx,
        r: cluster.r, g: cluster.g, b: cluster.b,
        targetR: cluster.r, targetG: cluster.g, targetB: cluster.b,
        migrating: false,
        migrationProgress: 0,
        migrationFrom: clusterIdx,
        angle: angle,
        orbitRadius: radius,
        size: 1.5 + Math.random() * 1.5,
      });
    }
  }

  // ── Update loop ────────────────────────────────────────────────────

  protected update(time: number): void {
    const dt = 1 / 60;
    this.time = time * 0.001;

    this.updateClusterPositions();
    this.updateParticles(dt);
    this.updateBridges(dt);
  }

  private updateClusterPositions(): void {
    const t = this.time * 0.1;
    for (let i = 0; i < this.clusters.length; i++) {
      const c = this.clusters[i];
      const drift = 30;
      c.x = c.baseX + this.noise(i * 3.7 + t, 0) * drift;
      c.y = c.baseY + this.noise(0, i * 3.7 + t) * drift;
    }
  }

  private updateParticles(dt: number): void {
    const migrationBase = 0.001;
    const mouseRadius = 150;
    const mouseForce = 0.8;

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const home = this.clusters[p.cluster];

      // -- Spring attraction toward home cluster --
      const dx = home.x - p.x;
      const dy = home.y - p.y;
      const springK = 0.003;
      p.vx += dx * springK;
      p.vy += dy * springK;

      // -- Orbital motion via noise --
      p.angle += 0.008 + this.noise(p.x * 0.005, p.y * 0.005 + this.time * 0.3) * 0.01;
      const orbitTarget = 50 + this.noise2(i * 0.1, this.time * 0.2) * 30;
      p.orbitRadius += (orbitTarget - p.orbitRadius) * 0.01;

      const orbitX = home.x + Math.cos(p.angle) * p.orbitRadius;
      const orbitY = home.y + Math.sin(p.angle) * p.orbitRadius;
      p.vx += (orbitX - p.x) * 0.002;
      p.vy += (orbitY - p.y) * 0.002;

      // -- Mouse attraction (from ANY cluster) --
      if (this.mouseActive) {
        const mx = this.mouseX - p.x;
        const my = this.mouseY - p.y;
        const md = Math.sqrt(mx * mx + my * my);
        if (md < mouseRadius && md > 1) {
          const strength = (1 - md / mouseRadius) * mouseForce;
          p.vx += (mx / md) * strength;
          p.vy += (my / md) * strength;
        }
      }

      // -- Bridge attraction --
      for (const bridge of this.bridges) {
        if (bridge.life <= 0) continue;
        if (p.cluster !== bridge.clusterA && p.cluster !== bridge.clusterB) continue;
        const bx = bridge.x - p.x;
        const by = bridge.y - p.y;
        const bd = Math.sqrt(bx * bx + by * by);
        if (bd < 120 && bd > 1) {
          const strength = (1 - bd / 120) * 0.3 * (bridge.life / bridge.maxLife);
          p.vx += (bx / bd) * strength;
          p.vy += (by / bd) * strength;
        }
      }

      // -- Damping --
      p.vx *= 0.96;
      p.vy *= 0.96;

      // -- Integrate --
      p.x += p.vx;
      p.y += p.vy;

      // -- Wrap edges softly --
      const margin = 40;
      if (p.x < -margin) p.x = this.width + margin;
      if (p.x > this.width + margin) p.x = -margin;
      if (p.y < -margin) p.y = this.height + margin;
      if (p.y > this.height + margin) p.y = -margin;

      // -- Migration logic --
      if (!p.migrating) {
        // Check bridge-boosted migration
        let migrationRate = migrationBase;
        for (const bridge of this.bridges) {
          if (bridge.life <= 0) continue;
          if (p.cluster === bridge.clusterA || p.cluster === bridge.clusterB) {
            const bd = dist(p.x, p.y, bridge.x, bridge.y);
            if (bd < 100) {
              migrationRate += 0.008 * (bridge.life / bridge.maxLife);
            }
          }
        }

        if (Math.random() < migrationRate) {
          // Pick a neighbor cluster (prefer closer ones)
          const weights: number[] = [];
          let totalWeight = 0;
          for (let j = 0; j < this.clusters.length; j++) {
            if (j === p.cluster) { weights.push(0); continue; }
            const cd = dist(p.x, p.y, this.clusters[j].x, this.clusters[j].y);
            const w = 1 / (cd * cd + 1);
            weights.push(w);
            totalWeight += w;
          }

          let r = Math.random() * totalWeight;
          let target = 0;
          for (let j = 0; j < weights.length; j++) {
            r -= weights[j];
            if (r <= 0) { target = j; break; }
          }

          p.migrating = true;
          p.migrationProgress = 0;
          p.migrationFrom = p.cluster;
          p.cluster = target;
          const newCluster = this.clusters[target];
          p.targetR = newCluster.r;
          p.targetG = newCluster.g;
          p.targetB = newCluster.b;
        }
      }

      // -- Color transition during migration --
      if (p.migrating) {
        p.migrationProgress += 1 / 60;
        if (p.migrationProgress >= 1) {
          p.migrationProgress = 1;
          p.migrating = false;
          p.r = p.targetR;
          p.g = p.targetG;
          p.b = p.targetB;
        } else {
          const t = p.migrationProgress;
          const ease = t * t * (3 - 2 * t); // smoothstep
          const fromCluster = this.clusters[p.migrationFrom];
          const [nr, ng, nb] = lerpColor(
            fromCluster.r, fromCluster.g, fromCluster.b,
            p.targetR, p.targetG, p.targetB,
            ease,
          );
          p.r = nr;
          p.g = ng;
          p.b = nb;
        }
      }
    }
  }

  private updateBridges(dt: number): void {
    for (let i = this.bridges.length - 1; i >= 0; i--) {
      this.bridges[i].life -= dt * 0.3;
      if (this.bridges[i].life <= 0) {
        this.bridges.splice(i, 1);
      }
    }
  }

  // ── Lifecycle overrides for click handling ───────────────────────────

  start(): void {
    super.start();
    this.canvas.addEventListener('click', this.handleClick);
  }

  stop(): void {
    this.canvas.removeEventListener('click', this.handleClick);
    super.stop();
  }

  private handleClick = (e: MouseEvent): void => {
    const rect = this.canvas.getBoundingClientRect();
    const mx = e.clientX - rect.left;
    const my = e.clientY - rect.top;

    // Find two nearest clusters
    const sorted = this.clusters
      .map((c, i) => ({ i, d: dist(mx, my, c.x, c.y) }))
      .sort((a, b) => a.d - b.d);

    if (sorted.length >= 2) {
      this.bridges.push({
        x: mx,
        y: my,
        life: 3,
        maxLife: 3,
        clusterA: sorted[0].i,
        clusterB: sorted[1].i,
      });
    }
  };

  // ── Draw ───────────────────────────────────────────────────────────

  protected draw(): void {
    const ctx = this.ctx;

    // Soft fade instead of full clear - ghostly trails
    ctx.fillStyle = hexToRgba(LAB_PALETTE.bg, 0.25);
    ctx.fillRect(0, 0, this.width, this.height);

    this.drawClusterGlows(ctx);
    this.drawBridges(ctx);
    this.drawMigrationTrails(ctx);
    this.drawParticles(ctx);
  }

  private drawClusterGlows(ctx: CanvasRenderingContext2D): void {
    for (const cluster of this.clusters) {
      const radius = this.isMobile ? 110 : 150;
      const grad = ctx.createRadialGradient(
        cluster.x, cluster.y, 0,
        cluster.x, cluster.y, radius,
      );
      // Breathing: pulse the alpha slightly
      const breath = 0.04 + Math.sin(this.time * 0.5 + cluster.baseX * 0.01) * 0.015;
      grad.addColorStop(0, `rgba(${cluster.r},${cluster.g},${cluster.b},${breath})`);
      grad.addColorStop(0.5, `rgba(${cluster.r},${cluster.g},${cluster.b},${breath * 0.5})`);
      grad.addColorStop(1, `rgba(${cluster.r},${cluster.g},${cluster.b},0)`);

      ctx.beginPath();
      ctx.arc(cluster.x, cluster.y, radius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();
    }
  }

  private drawBridges(ctx: CanvasRenderingContext2D): void {
    for (const bridge of this.bridges) {
      const alpha = (bridge.life / bridge.maxLife) * 0.3;
      const cA = this.clusters[bridge.clusterA];
      const cB = this.clusters[bridge.clusterB];

      // Soft glow at bridge point
      const grad = ctx.createRadialGradient(
        bridge.x, bridge.y, 0,
        bridge.x, bridge.y, 60,
      );
      grad.addColorStop(0, hexToRgba(LAB_PALETTE.cream, alpha));
      grad.addColorStop(1, hexToRgba(LAB_PALETTE.cream, 0));
      ctx.beginPath();
      ctx.arc(bridge.x, bridge.y, 60, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Faint line connecting the two clusters through the bridge
      ctx.beginPath();
      ctx.moveTo(cA.x, cA.y);
      ctx.quadraticCurveTo(bridge.x, bridge.y, cB.x, cB.y);
      ctx.strokeStyle = hexToRgba(LAB_PALETTE.cream, alpha * 0.4);
      ctx.lineWidth = 1;
      ctx.stroke();
    }
  }

  private drawMigrationTrails(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      if (!p.migrating) continue;

      const from = this.clusters[p.migrationFrom];

      // Faint line from particle back toward its origin
      const alpha = 0.06 * (1 - p.migrationProgress);
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      // Curve back toward origin cluster
      const midX = (p.x + from.x) * 0.5;
      const midY = (p.y + from.y) * 0.5;
      ctx.lineTo(midX, midY);
      ctx.strokeStyle = `rgba(${Math.round(p.r)},${Math.round(p.g)},${Math.round(p.b)},${alpha})`;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  private drawParticles(ctx: CanvasRenderingContext2D): void {
    for (const p of this.particles) {
      const r = Math.round(p.r);
      const g = Math.round(p.g);
      const b = Math.round(p.b);

      // Migrating particles glow brighter
      const baseAlpha = p.migrating ? 0.9 : 0.7;
      const glowRadius = p.migrating
        ? p.size * 3 + Math.sin(this.time * 3 + p.x * 0.1) * 2
        : p.size * 2;

      // Outer glow
      const grad = ctx.createRadialGradient(
        p.x, p.y, 0,
        p.x, p.y, glowRadius,
      );
      const glowAlpha = p.migrating ? 0.25 : 0.1;
      grad.addColorStop(0, `rgba(${r},${g},${b},${glowAlpha})`);
      grad.addColorStop(1, `rgba(${r},${g},${b},0)`);
      ctx.beginPath();
      ctx.arc(p.x, p.y, glowRadius, 0, Math.PI * 2);
      ctx.fillStyle = grad;
      ctx.fill();

      // Core
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      ctx.fillStyle = `rgba(${r},${g},${b},${baseAlpha})`;
      ctx.fill();
    }
  }
}

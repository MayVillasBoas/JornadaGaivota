// Scale Shift — complementarity visualization
// Concept: COMPLEMENTARITY from "Notes on Complexity"
// Following Niels Bohr: we are simultaneously distinct individuals
// AND components of a larger organism, depending on the scale of observation.
// Both views are true simultaneously.

import { BaseVisualization, LAB_PALETTE, hexToRgba, PALETTE_ARRAY } from './base-visualization';
import { createNoise2D } from './simplex-noise';

interface Particle {
  // orbital parameters
  orbitRadius: number;
  orbitAngle: number;
  orbitSpeed: number;
  // individual personality
  phase: number;
  wobbleAmp: number;
  wobbleFreq: number;
  radialOscAmp: number;
  radialOscFreq: number;
  // appearance
  colorIndex: number;
  color: string;
  // computed position
  x: number;
  y: number;
  // trail
  trail: { x: number; y: number }[];
}

export class ScaleShift extends BaseVisualization {
  private particles: Particle[] = [];
  private noise2D!: ReturnType<typeof createNoise2D>;
  private time = 0;

  // camera
  private zoom = 0.3;
  private targetZoom = 0.3;
  private camX = 0;
  private camY = 0;
  private targetCamX = 0;
  private targetCamY = 0;

  // organism center (world coordinates)
  private centerX = 0;
  private centerY = 0;

  // breathing
  private breathPhase = 0;

  // auto-oscillation
  private autoZoomPhase = 0;

  private count = 400;
  private maxTrail = 12;

  protected init(): void {
    this.noise2D = createNoise2D(137);
    this.count = this.isMobile ? 250 : 400;
    this.maxTrail = this.isMobile ? 8 : 12;
    this.centerX = this.width / 2;
    this.centerY = this.height / 2;
    this.camX = this.centerX;
    this.camY = this.centerY;
    this.targetCamX = this.centerX;
    this.targetCamY = this.centerY;

    this.particles = [];
    const baseRadius = Math.min(this.width, this.height) * 0.28;

    for (let i = 0; i < this.count; i++) {
      const t = i / this.count;
      // distribute particles in concentric rings with noise
      const ringNoise = this.noise2D(t * 6, i * 0.1);
      const orbitRadius = baseRadius * (0.15 + 0.85 * Math.pow(t, 0.6)) + ringNoise * baseRadius * 0.1;
      const orbitAngle = t * Math.PI * 2 * 7.3 + ringNoise * 0.5; // golden-ish spread
      const colorIndex = i % PALETTE_ARRAY.length;

      this.particles.push({
        orbitRadius,
        orbitAngle,
        orbitSpeed: 0.0003 + Math.random() * 0.0004,
        phase: Math.random() * Math.PI * 2,
        wobbleAmp: 2 + Math.random() * 6,
        wobbleFreq: 0.5 + Math.random() * 1.5,
        radialOscAmp: 0.03 + Math.random() * 0.08,
        radialOscFreq: 0.3 + Math.random() * 0.7,
        colorIndex,
        color: PALETTE_ARRAY[colorIndex],
        x: 0,
        y: 0,
        trail: [],
      });
    }
  }

  protected resize(): void {
    super.resize();
    if (this.particles.length > 0) {
      this.centerX = this.width / 2;
      this.centerY = this.height / 2;
    }
  }

  protected update(time: number): void {
    const dt = this.time === 0 ? 16 : Math.min(time - this.time, 50);
    this.time = time;

    this.breathPhase += dt * 0.0008;
    this.autoZoomPhase += dt * 0.00015;

    // ── Zoom control ──
    if (this.mouseActive) {
      this.targetZoom = Math.max(0, Math.min(1, this.mouseY / this.height));
    } else {
      // auto-oscillate between 0.15 and 0.75
      this.targetZoom = 0.45 + 0.30 * Math.sin(this.autoZoomPhase);
    }
    this.zoom += (this.targetZoom - this.zoom) * 0.03;

    // ── Camera target ──
    // At zoom=0: camera at organism center
    // At zoom=1: camera focuses on a slowly rotating subsection
    const focusAngle = time * 0.00008;
    const focusRadius = Math.min(this.width, this.height) * 0.15;
    const focusX = this.centerX + Math.cos(focusAngle) * focusRadius;
    const focusY = this.centerY + Math.sin(focusAngle) * focusRadius;
    this.targetCamX = this.centerX + (focusX - this.centerX) * this.zoom;
    this.targetCamY = this.centerY + (focusY - this.centerY) * this.zoom;
    this.camX += (this.targetCamX - this.camX) * 0.04;
    this.camY += (this.targetCamY - this.camY) * 0.04;

    // ── Global breathing ──
    const breathScale = 1 + 0.06 * Math.sin(this.breathPhase);
    const breathRadial = Math.sin(this.breathPhase * 0.7) * 0.04;

    // ── Update particles ──
    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];

      // orbit
      p.orbitAngle += p.orbitSpeed * dt;

      // individual wobble (more pronounced at zoom=1)
      const wobble = Math.sin(time * 0.001 * p.wobbleFreq + p.phase) * p.wobbleAmp;
      const radialOsc = Math.sin(time * 0.001 * p.radialOscFreq + p.phase * 2) * p.radialOscAmp;

      // noise-based organic drift
      const noiseVal = this.noise2D(
        Math.cos(p.orbitAngle) * 0.8 + time * 0.00005,
        Math.sin(p.orbitAngle) * 0.8 + i * 0.01
      );
      const noiseDrift = noiseVal * 8;

      // compute world position
      const r = p.orbitRadius * breathScale * (1 + radialOsc + breathRadial);
      const angle = p.orbitAngle;
      p.x = this.centerX + Math.cos(angle) * r + Math.cos(angle + Math.PI / 2) * wobble + noiseDrift;
      p.y = this.centerY + Math.sin(angle) * r + Math.sin(angle + Math.PI / 2) * wobble + noiseDrift * 0.7;

      // trail (used at high zoom)
      p.trail.push({ x: p.x, y: p.y });
      if (p.trail.length > this.maxTrail) {
        p.trail.shift();
      }
    }
  }

  protected draw(): void {
    const ctx = this.ctx;
    const w = this.width;
    const h = this.height;

    // ── Clear ──
    ctx.fillStyle = LAB_PALETTE.bg;
    ctx.fillRect(0, 0, w, h);

    // ── Compute camera transform ──
    // scale: 1x at zoom=0, ~5x at zoom=1
    const scale = 1 + this.zoom * 4;
    const offsetX = w / 2 - this.camX * scale;
    const offsetY = h / 2 - this.camY * scale;

    // helper to transform world to screen
    const toScreen = (wx: number, wy: number): [number, number] => {
      return [wx * scale + offsetX, wy * scale + offsetY];
    };

    // ── Radial glow at center (fades with zoom) ──
    const glowAlpha = Math.max(0, 1 - this.zoom * 1.5);
    if (glowAlpha > 0.01) {
      const [cx, cy] = toScreen(this.centerX, this.centerY);
      const glowRadius = Math.min(w, h) * 0.35 * scale * 0.3;
      const glow = ctx.createRadialGradient(cx, cy, 0, cx, cy, glowRadius);
      glow.addColorStop(0, hexToRgba(LAB_PALETTE.lilac, 0.12 * glowAlpha));
      glow.addColorStop(0.4, hexToRgba(LAB_PALETTE.sage, 0.06 * glowAlpha));
      glow.addColorStop(1, hexToRgba(LAB_PALETTE.bg, 0));
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, w, h);
    }

    // ── Connecting lines (fade in at low zoom, fade out at high zoom) ──
    const lineAlpha = Math.max(0, 1 - this.zoom * 2) * 0.35;
    if (lineAlpha > 0.005) {
      const maxDist = 35 * scale;
      const maxDistSq = maxDist * maxDist;
      ctx.lineWidth = 0.5;

      // use subset for performance
      const step = this.isMobile ? 3 : 2;
      for (let i = 0; i < this.particles.length; i += step) {
        const pi = this.particles[i];
        const [sx1, sy1] = toScreen(pi.x, pi.y);
        // skip if offscreen
        if (sx1 < -50 || sx1 > w + 50 || sy1 < -50 || sy1 > h + 50) continue;

        for (let j = i + step; j < this.particles.length; j += step) {
          const pj = this.particles[j];
          const [sx2, sy2] = toScreen(pj.x, pj.y);

          const dxs = sx1 - sx2;
          const dys = sy1 - sy2;
          const distSq = dxs * dxs + dys * dys;

          if (distSq < maxDistSq) {
            const dist = Math.sqrt(distSq);
            const a = lineAlpha * (1 - dist / maxDist);
            // blend colors between the two particles
            ctx.strokeStyle = hexToRgba(LAB_PALETTE.cream, a);
            ctx.beginPath();
            ctx.moveTo(sx1, sy1);
            ctx.lineTo(sx2, sy2);
            ctx.stroke();
          }
        }
      }
    }

    // ── Particle trails (fade in at high zoom) ──
    const trailAlpha = Math.max(0, (this.zoom - 0.4) * 1.8);
    if (trailAlpha > 0.01) {
      for (let i = 0; i < this.particles.length; i++) {
        const p = this.particles[i];
        if (p.trail.length < 2) continue;

        const [headX, headY] = toScreen(p.x, p.y);
        // skip if far offscreen
        if (headX < -100 || headX > w + 100 || headY < -100 || headY > h + 100) continue;

        ctx.beginPath();
        const [t0x, t0y] = toScreen(p.trail[0].x, p.trail[0].y);
        ctx.moveTo(t0x, t0y);
        for (let t = 1; t < p.trail.length; t++) {
          const [tx, ty] = toScreen(p.trail[t].x, p.trail[t].y);
          ctx.lineTo(tx, ty);
        }
        ctx.strokeStyle = hexToRgba(p.color, trailAlpha * 0.3);
        ctx.lineWidth = this.particleSize() * 0.5;
        ctx.lineCap = 'round';
        ctx.stroke();
      }
    }

    // ── Particles ──
    const pSize = this.particleSize();
    const haloAlpha = Math.max(0, (this.zoom - 0.3) * 1.5);

    for (let i = 0; i < this.particles.length; i++) {
      const p = this.particles[i];
      const [sx, sy] = toScreen(p.x, p.y);

      // cull offscreen
      if (sx < -20 || sx > w + 20 || sy < -20 || sy > h + 20) continue;

      // individual glow halo at high zoom
      if (haloAlpha > 0.01 && pSize > 3) {
        const haloSize = pSize * 3;
        const halo = ctx.createRadialGradient(sx, sy, pSize * 0.3, sx, sy, haloSize);
        halo.addColorStop(0, hexToRgba(p.color, 0.15 * haloAlpha));
        halo.addColorStop(1, hexToRgba(p.color, 0));
        ctx.fillStyle = halo;
        ctx.beginPath();
        ctx.arc(sx, sy, haloSize, 0, Math.PI * 2);
        ctx.fill();
      }

      // particle dot
      // At low zoom: all particles tend toward a unified cream color
      // At high zoom: each particle shows its own palette color
      const individualColor = this.zoom;
      if (individualColor < 0.5) {
        // blend toward cream/collective
        const collectiveAlpha = 0.4 + 0.3 * (1 - this.zoom * 2);
        ctx.fillStyle = hexToRgba(LAB_PALETTE.cream, collectiveAlpha);
      } else {
        // show individual color
        const alpha = 0.5 + 0.4 * ((this.zoom - 0.5) * 2);
        ctx.fillStyle = hexToRgba(p.color, alpha);
      }

      ctx.beginPath();
      ctx.arc(sx, sy, pSize, 0, Math.PI * 2);
      ctx.fill();
    }

    // ── Subtle vignette ──
    const vignette = ctx.createRadialGradient(w / 2, h / 2, w * 0.25, w / 2, h / 2, w * 0.7);
    vignette.addColorStop(0, 'rgba(26,26,26,0)');
    vignette.addColorStop(1, 'rgba(26,26,26,0.5)');
    ctx.fillStyle = vignette;
    ctx.fillRect(0, 0, w, h);
  }

  /** Particle render size interpolates with zoom */
  private particleSize(): number {
    // zoom 0 → 1.2px, zoom 1 → 7px
    return 1.2 + this.zoom * 5.8;
  }
}

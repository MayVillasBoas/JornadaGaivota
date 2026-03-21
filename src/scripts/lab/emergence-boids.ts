// Emergence Boids — flocking simulation
// Concept: EMERGENCE from "Notes on Complexity"
// Simple local rules (separation, alignment, cohesion) → complex global behavior
// Visual: realistic bird murmuration with seagull-like silhouettes

import { BaseVisualization } from './base-visualization';
import { createNoise2D } from './simplex-noise';

interface Boid {
  x: number;
  y: number;
  vx: number;
  vy: number;
  // Per-bird visual variation
  r: number;
  g: number;
  b: number;
  alpha: number;
  size: number;       // wingspan in px (6–10)
  flapPhase: number;  // offset for wing flap sine wave
  flapSpeed: number;  // how fast this bird flaps
}

// ── Constants ────────────────────────────────────────────────────────
const PERCEPTION = 60;
const PERCEPTION_SQ = PERCEPTION * PERCEPTION;
const MAX_SPEED = 1.5;
const MAX_FORCE = 0.08;
const SEPARATION_WEIGHT = 1.5;
const ALIGNMENT_WEIGHT = 1.2;
const COHESION_WEIGHT = 1.0;
const MOUSE_REPEL_RADIUS = 100;
const MOUSE_REPEL_RADIUS_SQ = MOUSE_REPEL_RADIUS * MOUSE_REPEL_RADIUS;
const MOUSE_REPEL_STRENGTH = 0.2;
const NOISE_SCALE = 0.003;
const NOISE_STRENGTH = 0.15;
const MIN_SPEED = 0.3;

export class EmergenceBoids extends BaseVisualization {
  private boids: Boid[] = [];
  private noise2D!: (x: number, y: number) => number;
  private time = 0;

  protected init(): void {
    this.noise2D = createNoise2D(12345);
    const count = this.isMobile ? 80 : 120;

    this.boids = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 0.3 + Math.random() * 1.0;

      // Organic bird color: warm grays / sandy beige / cream with variation
      const baseR = 180 + Math.random() * 40;  // 180–220
      const baseG = 170 + Math.random() * 40;  // 170–210
      const baseB = 155 + Math.random() * 40;  // 155–195
      const alpha = 0.55 + Math.random() * 0.3; // 0.55–0.85

      this.boids.push({
        x: Math.random() * this.width,
        y: Math.random() * this.height,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed,
        r: baseR,
        g: baseG,
        b: baseB,
        alpha,
        size: 6 + Math.random() * 4, // 6–10px wingspan
        flapPhase: Math.random() * Math.PI * 2,
        flapSpeed: 2.5 + Math.random() * 1.5, // varied flap rates
      });
    }
  }

  protected update(time: number): void {
    this.time = time * 0.001;
    const { boids, width, height } = this;
    const n = boids.length;

    // O(n²) neighbor check — fine for 120 boids
    for (let i = 0; i < n; i++) {
      const b = boids[i];

      let sepX = 0, sepY = 0, sepCount = 0;
      let aliX = 0, aliY = 0, aliCount = 0;
      let cohX = 0, cohY = 0, cohCount = 0;

      for (let j = 0; j < n; j++) {
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

        const dist = Math.sqrt(distSq);

        // Separation (stronger when closer)
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

      // Separation
      if (sepCount > 0) {
        sepX /= sepCount;
        sepY /= sepCount;
        const mag = Math.sqrt(sepX * sepX + sepY * sepY) || 1;
        fx += (sepX / mag) * MAX_FORCE * SEPARATION_WEIGHT;
        fy += (sepY / mag) * MAX_FORCE * SEPARATION_WEIGHT;
      }

      // Alignment
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

      // Cohesion
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

      // Noise wander for organic drift
      const noiseVal = this.noise2D(
        b.x * NOISE_SCALE + this.time * 0.15,
        b.y * NOISE_SCALE,
      );
      const noiseAngle = noiseVal * Math.PI * 2;
      fx += Math.cos(noiseAngle) * NOISE_STRENGTH * MAX_FORCE;
      fy += Math.sin(noiseAngle) * NOISE_STRENGTH * MAX_FORCE;

      // Gentle mouse repulsion
      if (this.mouseActive) {
        const mdx = b.x - this.mouseX;
        const mdy = b.y - this.mouseY;
        const mDistSq = mdx * mdx + mdy * mdy;
        if (mDistSq < MOUSE_REPEL_RADIUS_SQ && mDistSq > 0.01) {
          const mDist = Math.sqrt(mDistSq);
          const strength = (1 - mDist / MOUSE_REPEL_RADIUS) * MOUSE_REPEL_STRENGTH;
          fx += (mdx / mDist) * strength * MAX_FORCE;
          fy += (mdy / mDist) * strength * MAX_FORCE;
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
      if (speed < MIN_SPEED && speed > 0.0001) {
        b.vx = (b.vx / speed) * MIN_SPEED;
        b.vy = (b.vy / speed) * MIN_SPEED;
      }

      // Update position
      b.x += b.vx;
      b.y += b.vy;

      // Toroidal wrapping
      if (b.x < 0) b.x += width;
      else if (b.x >= width) b.x -= width;
      if (b.y < 0) b.y += height;
      else if (b.y >= height) b.y -= height;
    }
  }

  protected draw(): void {
    const { ctx, width, height, boids, time } = this;

    // Fade trail for gentle motion blur
    ctx.fillStyle = 'rgba(26, 26, 26, 0.08)';
    ctx.fillRect(0, 0, width, height);

    // Draw each boid as a seagull-like silhouette
    for (let i = 0; i < boids.length; i++) {
      const b = boids[i];
      const angle = Math.atan2(b.vy, b.vx);

      // Wing flap: sine wave oscillation per bird
      const flap = Math.sin(time * b.flapSpeed + b.flapPhase);
      // flapY controls how much the wingtips curve up/down (-1 to 1)
      const flapAmount = flap * 0.35; // subtle flap

      const halfWing = b.size * 0.5;

      ctx.save();
      ctx.translate(b.x, b.y);
      ctx.rotate(angle);

      // Bird color
      ctx.strokeStyle = `rgba(${b.r | 0}, ${b.g | 0}, ${b.b | 0}, ${b.alpha})`;
      ctx.lineWidth = 1.2;
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      // Draw seagull silhouette: two curved wings meeting at a body point
      // The bird faces right (along +x axis) before rotation
      ctx.beginPath();

      // Left wingtip → body center → right wingtip
      // Left wing (top in bird-local space before rotation means one side)
      const wingTipY = halfWing;
      const wingCurveUp = flapAmount * halfWing; // wingtip vertical offset from flapping

      // Left wing: from wingtip to body
      ctx.moveTo(-halfWing * 0.3, -wingTipY + wingCurveUp);
      ctx.quadraticCurveTo(
        halfWing * 0.15, -wingTipY * 0.25 + wingCurveUp * 0.3,
        halfWing * 0.4, 0, // body center front
      );

      // Right wing: from body to wingtip
      ctx.quadraticCurveTo(
        halfWing * 0.15, wingTipY * 0.25 - wingCurveUp * 0.3,
        -halfWing * 0.3, wingTipY - wingCurveUp,
      );

      ctx.stroke();

      // Small body dot for definition
      ctx.fillStyle = `rgba(${b.r | 0}, ${b.g | 0}, ${b.b | 0}, ${b.alpha * 0.6})`;
      ctx.beginPath();
      ctx.arc(halfWing * 0.2, 0, 0.8, 0, Math.PI * 2);
      ctx.fill();

      ctx.restore();
    }
  }
}

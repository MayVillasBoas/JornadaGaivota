// Romanesco Natural — phyllotaxis with cone-shaped buds and recursive self-similarity
// Top-down view: golden angle distributes tapered cone buds radiating from center
// Mouse interaction shifts light direction for dynamic 3D shading

import { BaseVisualization } from './base-visualization';

const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);
const TAU = Math.PI * 2;

// Romanesco colors
const LIME_GREEN = { r: 123, g: 160, b: 91 };    // #7BA05B
const YELLOW_GREEN = { r: 154, g: 185, b: 115 };  // #9AB973
const CREAM = { r: 232, g: 224, b: 200 };          // #E8E0C8
const DARK_GREEN = { r: 58, g: 82, b: 42 };        // shadow tone

interface Bud {
  // Position relative to parent center (or canvas center for main buds)
  x: number;
  y: number;
  // Angle from center
  angle: number;
  // Distance from center
  dist: number;
  // Size (length of the cone)
  size: number;
  // Width at base
  baseWidth: number;
  // Index in spiral (for growth animation ordering)
  spiralIndex: number;
  // Depth level: 0 = main, 1 = sub-bud
  depth: number;
}

function lerpColor(
  a: { r: number; g: number; b: number },
  b: { r: number; g: number; b: number },
  t: number,
): { r: number; g: number; b: number } {
  return {
    r: a.r + (b.r - a.r) * t,
    g: a.g + (b.g - a.g) * t,
    b: a.b + (b.b - a.b) * t,
  };
}

export class RomanescoNatural extends BaseVisualization {
  private buds: Bud[] = [];
  private startTime = 0;
  private growthProgress = 0;
  private lightAngle = -Math.PI / 4;
  private targetLightAngle = -Math.PI / 4;
  private mainBudCount = 0;

  protected init() {
    this.buds = [];
    this.startTime = 0;
    this.growthProgress = 0;
    this.lightAngle = -Math.PI / 4;
    this.targetLightAngle = -Math.PI / 4;
    this.generateBuds();
  }

  private generateBuds() {
    this.buds = [];
    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.38;

    const n = this.isMobile ? 80 : 150;
    this.mainBudCount = n;

    // Generate main buds in phyllotaxis spiral
    for (let i = 1; i <= n; i++) {
      const angle = i * GOLDEN_ANGLE;
      const r = Math.sqrt(i / n) * maxRadius;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;

      // Buds get larger toward the outside (like a real romanesco)
      const sizeT = Math.pow(i / n, 0.5);
      const budLength = maxRadius * (0.04 + 0.09 * sizeT);
      const budWidth = budLength * 0.55;

      this.buds.push({
        x, y,
        angle,
        dist: r,
        size: budLength,
        baseWidth: budWidth,
        spiralIndex: i,
        depth: 0,
      });

      // Sub-buds on larger outer buds (recursive self-similarity)
      if (budLength > maxRadius * 0.07 && !this.isMobile) {
        const subCount = Math.floor(5 + 3 * sizeT);
        for (let j = 1; j <= subCount; j++) {
          const subAngle = angle + j * GOLDEN_ANGLE;
          const subR = Math.sqrt(j / subCount) * budLength * 0.55;
          const subX = x + Math.cos(subAngle) * subR;
          const subY = y + Math.sin(subAngle) * subR;
          const subSize = budLength * (0.18 + 0.12 * (j / subCount));
          const subWidth = subSize * 0.5;

          this.buds.push({
            x: subX, y: subY,
            angle: subAngle,
            dist: Math.hypot(subX - cx, subY - cy),
            size: subSize,
            baseWidth: subWidth,
            spiralIndex: i + j * 0.01,
            depth: 1,
          });
        }
      }
    }

    // Sort: draw from center outward so outer buds overlap inner ones
    this.buds.sort((a, b) => a.dist - b.dist);
  }

  protected update(t: number) {
    if (this.startTime === 0) this.startTime = t;
    const elapsed = (t - this.startTime) * 0.001;

    // Growth over ~4 seconds
    this.growthProgress = Math.min(1, elapsed / 4);

    // Light follows mouse
    if (this.mouseActive) {
      const dx = this.mouseX - this.width / 2;
      const dy = this.mouseY - this.height / 2;
      this.targetLightAngle = Math.atan2(dy, dx);
    }

    // Smooth interpolation toward target light angle
    let diff = this.targetLightAngle - this.lightAngle;
    // Wrap to [-PI, PI]
    while (diff > Math.PI) diff -= TAU;
    while (diff < -Math.PI) diff += TAU;
    this.lightAngle += diff * 0.06;
  }

  protected draw() {
    const ctx = this.ctx;
    const cx = this.width / 2;
    const cy = this.height / 2;
    const maxRadius = Math.min(this.width, this.height) * 0.38;

    // Background
    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.width, this.height);

    // Light direction vector
    const lx = Math.cos(this.lightAngle);
    const ly = Math.sin(this.lightAngle);

    // How many buds are visible based on growth
    const visibleCount = Math.floor(this.growthProgress * this.buds.length);

    for (let i = 0; i < visibleCount; i++) {
      const bud = this.buds[i];

      // Fade in recently appeared buds
      const appearProgress = Math.min(1, (visibleCount - i) / Math.max(1, this.buds.length * 0.08));
      const scale = this.easeOutCubic(appearProgress);
      if (scale < 0.01) continue;

      const budSize = bud.size * scale;
      const budWidth = bud.baseWidth * scale;

      // Direction this bud points: away from center
      const dirAngle = Math.atan2(bud.y - cy, bud.x - cx);
      const dirX = Math.cos(dirAngle);
      const dirY = Math.sin(dirAngle);

      // Perpendicular for the base width
      const perpX = -dirY;
      const perpY = dirX;

      // Tip of the cone (pointing outward from center)
      const tipX = bud.x + dirX * budSize;
      const tipY = bud.y + dirY * budSize;

      // Base corners (perpendicular to direction)
      const baseLeftX = bud.x - perpX * budWidth * 0.5;
      const baseLeftY = bud.y - perpY * budWidth * 0.5;
      const baseRightX = bud.x + perpX * budWidth * 0.5;
      const baseRightY = bud.y + perpY * budWidth * 0.5;

      // Control points for a rounded cone (bezier curves for organic shape)
      const midLen = budSize * 0.6;
      const midWidth = budWidth * 0.35;
      const midLeftX = bud.x + dirX * midLen - perpX * midWidth;
      const midLeftY = bud.y + dirY * midLen - perpY * midWidth;
      const midRightX = bud.x + dirX * midLen + perpX * midWidth;
      const midRightY = bud.y + dirY * midLen + perpY * midWidth;

      // Lighting: dot product of bud normal with light direction
      // The "normal" of each bud surface approximated by its outward direction
      const dotLight = dirX * lx + dirY * ly;
      // Side lighting: which side of the bud faces the light
      const sideLight = perpX * lx + perpY * ly;

      // Base color depends on distance from center
      const distRatio = bud.dist / maxRadius;
      const baseColor = lerpColor(LIME_GREEN, YELLOW_GREEN, distRatio);

      // Lighting intensity
      const intensity = 0.35 + 0.65 * Math.max(0, dotLight * 0.5 + 0.5);

      // Lit side vs shadow side
      const litSide = sideLight > 0 ? 1 : -1;
      const sideIntensity = Math.abs(sideLight);

      // Create gradient across the bud width for 3D effect
      const gradStartX = bud.x - perpX * budWidth * 0.5;
      const gradStartY = bud.y - perpY * budWidth * 0.5;
      const gradEndX = bud.x + perpX * budWidth * 0.5;
      const gradEndY = bud.y + perpY * budWidth * 0.5;

      const grad = ctx.createLinearGradient(gradStartX, gradStartY, gradEndX, gradEndY);

      // Shadow side
      const shadowColor = lerpColor(baseColor, DARK_GREEN, 0.3 + 0.3 * sideIntensity);
      // Lit side
      const litColor = lerpColor(baseColor, CREAM, 0.15 + 0.25 * sideIntensity);

      const alpha = Math.min(1, scale * 0.95);

      if (litSide > 0) {
        // Light comes from the right side (in perpendicular frame)
        grad.addColorStop(0, `rgba(${Math.round(shadowColor.r * intensity)},${Math.round(shadowColor.g * intensity)},${Math.round(shadowColor.b * intensity)},${alpha})`);
        grad.addColorStop(0.5, `rgba(${Math.round(baseColor.r * intensity)},${Math.round(baseColor.g * intensity)},${Math.round(baseColor.b * intensity)},${alpha})`);
        grad.addColorStop(1, `rgba(${Math.round(litColor.r * intensity)},${Math.round(litColor.g * intensity)},${Math.round(litColor.b * intensity)},${alpha})`);
      } else {
        // Light comes from the left side
        grad.addColorStop(0, `rgba(${Math.round(litColor.r * intensity)},${Math.round(litColor.g * intensity)},${Math.round(litColor.b * intensity)},${alpha})`);
        grad.addColorStop(0.5, `rgba(${Math.round(baseColor.r * intensity)},${Math.round(baseColor.g * intensity)},${Math.round(baseColor.b * intensity)},${alpha})`);
        grad.addColorStop(1, `rgba(${Math.round(shadowColor.r * intensity)},${Math.round(shadowColor.g * intensity)},${Math.round(shadowColor.b * intensity)},${alpha})`);
      }

      // Draw the tapered cone shape
      ctx.beginPath();
      ctx.moveTo(baseLeftX, baseLeftY);
      ctx.quadraticCurveTo(midLeftX, midLeftY, tipX, tipY);
      ctx.quadraticCurveTo(midRightX, midRightY, baseRightX, baseRightY);
      // Rounded base
      ctx.quadraticCurveTo(
        bud.x - dirX * budWidth * 0.15,
        bud.y - dirY * budWidth * 0.15,
        baseLeftX, baseLeftY,
      );
      ctx.closePath();
      ctx.fillStyle = grad;
      ctx.fill();

      // Tip highlight — lighter cream dot at the very tip
      const tipHighlight = 0.3 + 0.5 * Math.max(0, dotLight);
      if (budSize > 4 && tipHighlight > 0.3) {
        const highlightR = budSize * 0.12;
        const tipGrad = ctx.createRadialGradient(tipX, tipY, 0, tipX, tipY, highlightR);
        tipGrad.addColorStop(0, `rgba(${CREAM.r},${CREAM.g},${CREAM.b},${alpha * tipHighlight * 0.7})`);
        tipGrad.addColorStop(1, `rgba(${CREAM.r},${CREAM.g},${CREAM.b},0)`);
        ctx.beginPath();
        ctx.arc(tipX, tipY, highlightR, 0, TAU);
        ctx.fillStyle = tipGrad;
        ctx.fill();
      }

      // Subtle dark outline for depth separation on larger buds
      if (bud.depth === 0 && budSize > 6) {
        ctx.beginPath();
        ctx.moveTo(baseLeftX, baseLeftY);
        ctx.quadraticCurveTo(midLeftX, midLeftY, tipX, tipY);
        ctx.quadraticCurveTo(midRightX, midRightY, baseRightX, baseRightY);
        ctx.quadraticCurveTo(
          bud.x - dirX * budWidth * 0.15,
          bud.y - dirY * budWidth * 0.15,
          baseLeftX, baseLeftY,
        );
        ctx.closePath();
        ctx.strokeStyle = `rgba(30,45,25,${alpha * 0.2})`;
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }

    // Central point glow (the apex of the romanesco)
    const centerGlow = ctx.createRadialGradient(cx, cy, 0, cx, cy, maxRadius * 0.08);
    centerGlow.addColorStop(0, 'rgba(200,195,140,0.25)');
    centerGlow.addColorStop(0.5, 'rgba(154,185,115,0.1)');
    centerGlow.addColorStop(1, 'rgba(123,160,91,0)');
    ctx.beginPath();
    ctx.arc(cx, cy, maxRadius * 0.08, 0, TAU);
    ctx.fillStyle = centerGlow;
    ctx.fill();
  }

  private easeOutCubic(t: number): number {
    return 1 - Math.pow(1 - t, 3);
  }
}

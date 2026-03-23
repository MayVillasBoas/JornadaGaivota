// Nautilus - Logarithmic spiral with chambered cross-section
// r = a * e^(b*θ) where b relates to the golden ratio
// Chambers drawn as arcs with curved septa (dividing walls)

import { BaseVisualization, hexToRgba } from './base-visualization';

const AMBER = '#D4A574';
const CREAM = '#F5F0E8';
const TERRACOTTA = '#C27A5A';

export class NautilusSpiral extends BaseVisualization {
  private startTime = 0;
  private growthProgress = 0; // 0 to 1
  private totalChambers = 28;
  private highlightChamber = -1;

  // Spiral parameters
  private a = 1;
  private b = 0.1759;

  protected init() {
    this.startTime = 0;
    this.growthProgress = 0;
  }

  protected update(t: number) {
    if (this.startTime === 0) this.startTime = t;
    const elapsed = (t - this.startTime) * 0.001;

    // Grow in over ~5 seconds
    this.growthProgress = Math.min(1, elapsed / 5);

    // Detect highlighted chamber from mouse
    this.highlightChamber = -1;
    if (this.mouseActive) {
      const cx = this.width / 2;
      const cy = this.height / 2;
      const dx = this.mouseX - cx;
      const dy = this.mouseY - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const angle = Math.atan2(dy, dx);

      // Find which chamber the mouse is closest to
      const scale = Math.min(this.width, this.height) * 0.018;
      for (let i = 0; i < this.totalChambers; i++) {
        const theta = (i * Math.PI) / 4;
        const r = this.a * Math.exp(this.b * theta) * scale;
        const chamberX = cx + Math.cos(theta) * r;
        const chamberY = cy + Math.sin(theta) * r;
        const d = Math.sqrt((this.mouseX - chamberX) ** 2 + (this.mouseY - chamberY) ** 2);
        if (d < r * 0.4) {
          this.highlightChamber = i;
        }
      }
    }
  }

  private spiralR(theta: number): number {
    return this.a * Math.exp(this.b * theta);
  }

  protected draw() {
    const ctx = this.ctx;

    ctx.fillStyle = '#1a1a1a';
    ctx.fillRect(0, 0, this.width, this.height);

    const cx = this.width / 2;
    const cy = this.height / 2;
    const scale = Math.min(this.width, this.height) * 0.018;

    const visibleChambers = Math.floor(this.growthProgress * this.totalChambers);
    const chamberFraction = (this.growthProgress * this.totalChambers) % 1;

    // Draw outer shell wall (the spiral itself)
    ctx.beginPath();
    const maxTheta = ((visibleChambers + chamberFraction) * Math.PI) / 4;
    const steps = Math.floor(maxTheta * 30);

    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * maxTheta;
      const r = this.spiralR(theta) * scale;
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = hexToRgba(AMBER, 0.6);
    ctx.lineWidth = 2;
    ctx.stroke();

    // Draw inner spiral (slightly tighter)
    ctx.beginPath();
    for (let i = 0; i <= steps; i++) {
      const theta = (i / steps) * maxTheta;
      const r = this.spiralR(theta) * scale * 0.7;
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;
      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);
    }

    ctx.strokeStyle = hexToRgba(TERRACOTTA, 0.3);
    ctx.lineWidth = 1;
    ctx.stroke();

    // Draw septa (chamber dividing walls)
    for (let i = 0; i <= visibleChambers; i++) {
      const theta = (i * Math.PI) / 4;
      if (theta > maxTheta) break;

      const rOuter = this.spiralR(theta) * scale;
      const rInner = this.spiralR(theta) * scale * 0.15;

      const outerX = cx + Math.cos(theta) * rOuter;
      const outerY = cy + Math.sin(theta) * rOuter;
      const innerX = cx + Math.cos(theta) * rInner;
      const innerY = cy + Math.sin(theta) * rInner;

      // Septa are slightly curved - approximate with quadratic bezier
      const midTheta = theta - 0.15;
      const midR = (rOuter + rInner) * 0.5;
      const cpX = cx + Math.cos(midTheta) * midR;
      const cpY = cy + Math.sin(midTheta) * midR;

      const isHighlighted = i === this.highlightChamber || i === this.highlightChamber + 1;

      ctx.beginPath();
      ctx.moveTo(innerX, innerY);
      ctx.quadraticCurveTo(cpX, cpY, outerX, outerY);
      ctx.strokeStyle = isHighlighted
        ? hexToRgba(CREAM, 0.7)
        : hexToRgba(AMBER, 0.35);
      ctx.lineWidth = isHighlighted ? 1.5 : 1;
      ctx.stroke();
    }

    // Fill chambers with subtle gradient
    for (let i = 0; i < visibleChambers; i++) {
      const theta1 = (i * Math.PI) / 4;
      const theta2 = ((i + 1) * Math.PI) / 4;

      if (theta2 > maxTheta) break;

      const r1 = this.spiralR(theta1) * scale;
      const r2 = this.spiralR(theta2) * scale;
      const midTheta = (theta1 + theta2) / 2;
      const midR = (r1 + r2) / 2;

      const chamberCx = cx + Math.cos(midTheta) * midR * 0.6;
      const chamberCy = cy + Math.sin(midTheta) * midR * 0.6;

      const isHighlighted = i === this.highlightChamber;

      // Chamber fill
      ctx.beginPath();
      const arcSteps = 20;
      // Outer arc
      for (let s = 0; s <= arcSteps; s++) {
        const t = theta1 + (theta2 - theta1) * (s / arcSteps);
        const r = this.spiralR(t) * scale;
        const x = cx + Math.cos(t) * r;
        const y = cy + Math.sin(t) * r;
        if (s === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }
      // Inner arc (reverse)
      for (let s = arcSteps; s >= 0; s--) {
        const t = theta1 + (theta2 - theta1) * (s / arcSteps);
        const r = this.spiralR(t) * scale * 0.15;
        const x = cx + Math.cos(t) * r;
        const y = cy + Math.sin(t) * r;
        ctx.lineTo(x, y);
      }
      ctx.closePath();

      if (isHighlighted) {
        ctx.fillStyle = hexToRgba(AMBER, 0.15);
      } else {
        // Older chambers are darker
        const t = i / this.totalChambers;
        ctx.fillStyle = hexToRgba(AMBER, 0.02 + t * 0.05);
      }
      ctx.fill();
    }

    // Growth lines (subtle texture on outer wall)
    ctx.save();
    ctx.globalAlpha = 0.08;
    for (let i = 0; i < maxTheta * 8; i++) {
      const theta = i * 0.13;
      if (theta > maxTheta) break;
      const r = this.spiralR(theta) * scale;
      const x = cx + Math.cos(theta) * r;
      const y = cy + Math.sin(theta) * r;
      const nx = Math.cos(theta + Math.PI / 2);
      const ny = Math.sin(theta + Math.PI / 2);
      ctx.beginPath();
      ctx.moveTo(x - nx * 3, y - ny * 3);
      ctx.lineTo(x + nx * 3, y + ny * 3);
      ctx.strokeStyle = CREAM;
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
    ctx.restore();

    // Highlight label
    if (this.highlightChamber >= 0 && this.highlightChamber < visibleChambers) {
      const theta = ((this.highlightChamber + 0.5) * Math.PI) / 4;
      const r = this.spiralR(theta) * scale;
      const x = cx + Math.cos(theta) * r * 1.2;
      const y = cy + Math.sin(theta) * r * 1.2;

      const ratio = this.highlightChamber > 0
        ? (this.spiralR((this.highlightChamber + 1) * Math.PI / 4) / this.spiralR(this.highlightChamber * Math.PI / 4)).toFixed(3)
        : '-';

      ctx.fillStyle = 'rgba(245, 240, 232, 0.5)';
      ctx.font = '11px Inter, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`${ratio}`, x, y);
    }
  }
}

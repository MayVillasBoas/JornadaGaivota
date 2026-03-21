// src/scripts/copilot/breathing-line.ts

const LAYER_COLORS: Record<string, string> = {
  feel: '#c27a5a',
  see: '#8b6aad',
  think: '#4a7aad',
  act: '#2B4A3E',
  intake: '#8a8a82',
};

interface LineSegment {
  startY: number;
  endY: number;
  layer: string;
}

interface ThemeNode {
  y: number;
  label: string;
  layer: string;
}

export class BreathingLine {
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D;
  private segments: LineSegment[] = [];
  private nodes: ThemeNode[] = [];
  private animFrame: number | null = null;
  private time = 0;
  private container: HTMLElement;

  constructor(canvas: HTMLCanvasElement, container: HTMLElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.container = container;
    this.resize();
    window.addEventListener('resize', () => this.resize());
  }

  private resize(): void {
    const dpr = window.devicePixelRatio || 1;
    const rect = this.container.getBoundingClientRect();
    this.canvas.width = 40 * dpr;
    this.canvas.height = rect.height * dpr;
    this.canvas.style.width = '40px';
    this.canvas.style.height = rect.height + 'px';
    this.ctx.scale(dpr, dpr);
    this.draw();
  }

  addSegment(startY: number, endY: number, layer: string): void {
    this.segments.push({ startY, endY, layer });
    this.resize();
  }

  addNode(y: number, label: string, layer: string): void {
    this.nodes.push({ y, label, layer });
    this.draw();
  }

  rebuildFromBlocks(blocks: HTMLElement[], layers: string[]): void {
    this.segments = [];
    const canvasRect = this.canvas.getBoundingClientRect();

    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const rect = block.getBoundingClientRect();
      const startY = rect.top - canvasRect.top;
      const endY = rect.bottom - canvasRect.top;
      const layer = layers[i] || 'intake';
      this.segments.push({ startY, endY, layer });
    }

    this.resize();
  }

  private draw(): void {
    const w = 40;
    const h = this.canvas.height / (window.devicePixelRatio || 1);
    this.ctx.clearRect(0, 0, w, h);

    if (this.segments.length === 0) return;

    this.time += 0.02;
    const centerX = 20;

    for (const seg of this.segments) {
      this.ctx.beginPath();
      this.ctx.strokeStyle = LAYER_COLORS[seg.layer] || LAYER_COLORS.intake;
      this.ctx.lineWidth = 2;
      this.ctx.lineCap = 'round';

      const steps = Math.max(1, Math.floor((seg.endY - seg.startY) / 4));
      for (let i = 0; i <= steps; i++) {
        const t = i / steps;
        const y = seg.startY + t * (seg.endY - seg.startY);
        const wobble = Math.sin(y * 0.02 + this.time) * 3 +
                       Math.sin(y * 0.05 + this.time * 1.3) * 1.5;
        const x = centerX + wobble;

        if (i === 0) {
          this.ctx.moveTo(x, y);
        } else {
          this.ctx.lineTo(x, y);
        }
      }
      this.ctx.stroke();
    }

    for (const node of this.nodes) {
      const color = LAYER_COLORS[node.layer] || LAYER_COLORS.intake;
      const wobble = Math.sin(node.y * 0.02 + this.time) * 3;
      const x = centerX + wobble;

      this.ctx.beginPath();
      this.ctx.arc(x, node.y, 4, 0, Math.PI * 2);
      this.ctx.fillStyle = color;
      this.ctx.fill();
    }
  }

  startAnimation(): void {
    if (this.animFrame) return;
    const animate = () => {
      this.draw();
      this.animFrame = requestAnimationFrame(animate);
    };
    animate();
  }

  stopAnimation(): void {
    if (this.animFrame) {
      cancelAnimationFrame(this.animFrame);
      this.animFrame = null;
    }
  }

  destroy(): void {
    this.stopAnimation();
    window.removeEventListener('resize', () => this.resize());
  }
}

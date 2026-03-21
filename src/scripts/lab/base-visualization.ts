// Base class for all lab visualizations
// Handles canvas lifecycle, DPR, mouse tracking, resize

export const LAB_PALETTE = {
  sage:       '#3D6B5A',
  lilac:      '#8B6AAD',
  terracotta: '#C27A5A',
  cream:      '#F5F0E8',
  gold:       '#ADA45A',
  bg:         '#1a1a1a',
};

export const PALETTE_ARRAY = [
  LAB_PALETTE.sage,
  LAB_PALETTE.lilac,
  LAB_PALETTE.terracotta,
  LAB_PALETTE.cream,
  LAB_PALETTE.gold,
];

export function hexToRgba(hex: string, alpha: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgba(${r},${g},${b},${alpha})`;
}

export abstract class BaseVisualization {
  protected canvas: HTMLCanvasElement;
  protected ctx: CanvasRenderingContext2D;
  protected width = 0;
  protected height = 0;
  protected dpr = 1;
  protected running = false;
  protected animId: number | null = null;
  protected isMobile: boolean;
  protected mouseX = 0;
  protected mouseY = 0;
  protected mouseActive = false;

  constructor(canvas: HTMLCanvasElement) {
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d')!;
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.isMobile = window.innerWidth < 768;

    this.resize();
    this._bindEvents();
  }

  private _bindEvents() {
    const onResize = () => {
      this.isMobile = window.innerWidth < 768;
      this.resize();
    };
    window.addEventListener('resize', onResize);

    this.canvas.addEventListener('mousemove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      this.mouseX = e.clientX - rect.left;
      this.mouseY = e.clientY - rect.top;
      this.mouseActive = true;
    });

    this.canvas.addEventListener('mouseleave', () => {
      this.mouseActive = false;
    });

    this.canvas.addEventListener('touchmove', (e) => {
      const rect = this.canvas.getBoundingClientRect();
      const touch = e.touches[0];
      this.mouseX = touch.clientX - rect.left;
      this.mouseY = touch.clientY - rect.top;
      this.mouseActive = true;
    }, { passive: true });

    this.canvas.addEventListener('touchend', () => {
      this.mouseActive = false;
    });
  }

  protected resize() {
    const rect = this.canvas.getBoundingClientRect();
    this.width = rect.width;
    this.height = rect.height;
    this.canvas.width = this.width * this.dpr;
    this.canvas.height = this.height * this.dpr;
    this.ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
  }

  start() {
    if (this.running) return;
    this.running = true;
    this.init();
    const loop = (time: number) => {
      if (!this.running) return;
      this.update(time);
      this.draw();
      this.animId = requestAnimationFrame(loop);
    };
    this.animId = requestAnimationFrame(loop);
  }

  stop() {
    this.running = false;
    if (this.animId !== null) {
      cancelAnimationFrame(this.animId);
      this.animId = null;
    }
  }

  protected init(): void {}
  protected abstract update(time: number): void;
  protected abstract draw(): void;
}

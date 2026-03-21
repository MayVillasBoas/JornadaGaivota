// Romanesco — Julia Set fractal with organic spiral structures
// GPU-accelerated via WebGL fragment shader
// z = z² + c produces infinite self-similar detail at any zoom level

import { BaseVisualization } from './base-visualization';

const VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_zoom;
uniform vec2 u_center;
uniform float u_time;
uniform float u_maxIter;

// Cosine palette for organic coloring: sage → gold-green → cream
vec3 palette(float t) {
  vec3 a = vec3(0.3, 0.4, 0.3);
  vec3 b = vec3(0.4, 0.35, 0.25);
  vec3 c = vec3(1.0, 1.0, 1.0);
  vec3 d = vec3(0.0, 0.15, 0.20);
  return a + b * cos(6.28318 * (c * t + d));
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);

  // Apply zoom and pan
  uv = uv / u_zoom + u_center;

  // Julia set: z = z² + c
  // This c value produces beautiful organic spirals
  float breathe = sin(u_time * 0.3) * 0.008;
  vec2 c = vec2(-0.7269 + breathe, 0.1889 + breathe * 0.5);

  vec2 z = uv;
  float i;
  float maxIter = floor(u_maxIter);

  for (float n = 0.0; n < 256.0; n++) {
    if (n >= maxIter) break;
    if (dot(z, z) > 4.0) break;
    // z = z² + c using complex multiplication
    z = vec2(z.x * z.x - z.y * z.y, 2.0 * z.x * z.y) + c;
    i = n;
  }

  // Background
  vec3 bg = vec3(0.102, 0.102, 0.102);

  if (dot(z, z) <= 4.0) {
    // Inside the set — dark
    gl_FragColor = vec4(bg * 0.8, 1.0);
    return;
  }

  // Smooth iteration count to avoid color banding
  float sl = i - log2(log2(dot(z, z))) + 4.0;
  float t = sl / maxIter;

  // Color with palette
  vec3 color = palette(t * 3.0 + u_time * 0.05);

  // Darken edges slightly for depth
  float vignette = 1.0 - 0.3 * length(gl_FragCoord.xy / u_resolution - 0.5);
  color *= vignette;

  gl_FragColor = vec4(color, 1.0);
}
`;

export class Romanesco extends BaseVisualization {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private glCanvas: HTMLCanvasElement | null = null;

  private uResolution: WebGLUniformLocation | null = null;
  private uZoom: WebGLUniformLocation | null = null;
  private uCenter: WebGLUniformLocation | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private uMaxIter: WebGLUniformLocation | null = null;

  private time = 0;
  private zoom = 1.0;
  private centerX = 0.0;
  private centerY = 0.0;
  private growStart = 0;

  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private centerStartX = 0;
  private centerStartY = 0;

  protected init() {
    this.setupWebGL();
    if (this.gl) this.setupInteraction();
  }

  private setupWebGL() {
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.style.position = 'absolute';
    this.glCanvas.style.inset = '0';
    this.glCanvas.style.width = '100%';
    this.glCanvas.style.height = '100%';
    this.canvas.parentElement?.appendChild(this.glCanvas);
    this.canvas.style.display = 'none';

    this.gl = this.glCanvas.getContext('webgl', { antialias: false });
    if (!this.gl) return;

    const vs = this.compile(this.gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this.compile(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = this.gl.createProgram()!;
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Link error:', this.gl.getProgramInfoLog(this.program));
      return;
    }

    this.gl.useProgram(this.program);

    const buf = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]), this.gl.STATIC_DRAW);

    const pos = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(pos);
    this.gl.vertexAttribPointer(pos, 2, this.gl.FLOAT, false, 0, 0);

    this.uResolution = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.uZoom = this.gl.getUniformLocation(this.program, 'u_zoom');
    this.uCenter = this.gl.getUniformLocation(this.program, 'u_center');
    this.uTime = this.gl.getUniformLocation(this.program, 'u_time');
    this.uMaxIter = this.gl.getUniformLocation(this.program, 'u_maxIter');

    this.resizeGL();
  }

  private compile(type: number, src: string): WebGLShader | null {
    if (!this.gl) return null;
    const s = this.gl.createShader(type)!;
    this.gl.shaderSource(s, src);
    this.gl.compileShader(s);
    if (!this.gl.getShaderParameter(s, this.gl.COMPILE_STATUS)) {
      console.error('Shader error:', this.gl.getShaderInfoLog(s));
      return null;
    }
    return s;
  }

  private resizeGL() {
    if (!this.gl || !this.glCanvas) return;
    const rect = this.glCanvas.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.glCanvas.width = rect.width * dpr;
    this.glCanvas.height = rect.height * dpr;
    this.gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
  }

  protected resize() {
    super.resize();
    this.resizeGL();
  }

  private setupInteraction() {
    const el = this.glCanvas!;
    el.style.cursor = 'grab';

    el.addEventListener('dblclick', () => {
      this.zoom = 1.0;
      this.centerX = 0.0;
      this.centerY = 0.0;
    });

    el.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width - 0.5;
      const my = -((e.clientY - rect.top) / rect.height - 0.5);
      const aspect = rect.width / rect.height;

      const prev = this.zoom;
      this.zoom = Math.max(0.5, Math.min(500, this.zoom * (e.deltaY < 0 ? 1.15 : 1 / 1.15)));

      const ratio = 1 / this.zoom - 1 / prev;
      this.centerX += mx * aspect * ratio;
      this.centerY += my * ratio;
    }, { passive: false });

    el.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.centerStartX = this.centerX;
      this.centerStartY = this.centerY;
      el.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const rect = el.getBoundingClientRect();
      const dx = (e.clientX - this.dragStartX) / rect.width;
      const dy = (e.clientY - this.dragStartY) / rect.height;
      const aspect = rect.width / rect.height;
      this.centerX = this.centerStartX - dx * aspect / this.zoom;
      this.centerY = this.centerStartY + dy / this.zoom;
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        el.style.cursor = 'grab';
      }
    });

    // Touch
    let lastDist = 0;
    el.addEventListener('touchstart', (e) => {
      if (e.touches.length === 1) {
        this.isDragging = true;
        this.dragStartX = e.touches[0].clientX;
        this.dragStartY = e.touches[0].clientY;
        this.centerStartX = this.centerX;
        this.centerStartY = this.centerY;
      } else if (e.touches.length === 2) {
        this.isDragging = false;
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        lastDist = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    el.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = el.getBoundingClientRect();
      if (e.touches.length === 1 && this.isDragging) {
        const dx = (e.touches[0].clientX - this.dragStartX) / rect.width;
        const dy = (e.touches[0].clientY - this.dragStartY) / rect.height;
        const aspect = rect.width / rect.height;
        this.centerX = this.centerStartX - dx * aspect / this.zoom;
        this.centerY = this.centerStartY + dy / this.zoom;
      } else if (e.touches.length === 2) {
        const dx = e.touches[1].clientX - e.touches[0].clientX;
        const dy = e.touches[1].clientY - e.touches[0].clientY;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (lastDist > 0) {
          this.zoom = Math.max(0.5, Math.min(500, this.zoom * (dist / lastDist)));
        }
        lastDist = dist;
      }
    }, { passive: false });

    el.addEventListener('touchend', () => {
      this.isDragging = false;
      lastDist = 0;
    });
  }

  protected update(t: number) {
    this.time = t * 0.001;
  }

  protected draw() {
    if (!this.gl || !this.program || !this.glCanvas) return;

    // Grow max iterations over time for entrance effect
    const elapsed = this.time - this.growStart;
    const maxIter = Math.min(128, elapsed * 20);

    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uResolution, this.glCanvas.width, this.glCanvas.height);
    this.gl.uniform1f(this.uZoom, this.zoom);
    this.gl.uniform2f(this.uCenter, this.centerX, this.centerY);
    this.gl.uniform1f(this.uTime, this.time);
    this.gl.uniform1f(this.uMaxIter, maxIter);
    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Hint on 2D canvas
    this.ctx.clearRect(0, 0, this.width, this.height);
    if (this.zoom === 1.0 && maxIter >= 128) {
      this.ctx.fillStyle = 'rgba(255,255,255,0.3)';
      this.ctx.font = '13px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('scroll to zoom · drag to pan · double-click to reset', this.width / 2, this.height - 24);
    }
  }

  stop() {
    super.stop();
    if (this.glCanvas?.parentElement) {
      this.glCanvas.parentElement.removeChild(this.glCanvas);
      this.canvas.style.display = '';
    }
  }
}

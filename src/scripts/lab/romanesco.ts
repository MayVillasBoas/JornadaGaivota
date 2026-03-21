// Romanesco Broccoli — GPU-accelerated self-similar spiral fractal
// Uses WebGL fragment shader to calculate fractal detail per-pixel
// Supports smooth zoom and pan with infinite detail at any scale

import { BaseVisualization, LAB_PALETTE } from './base-visualization';

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
uniform float u_growth;

// Golden angle in radians
const float GOLDEN_ANGLE = 2.39996323;
const float PI = 3.14159265;

// Map depth to color: deep sage → bright gold-green
vec3 depthColor(float depth, float maxDepth) {
  float t = depth / maxDepth;
  float r = mix(0.18, 0.69, t);
  float g = mix(0.35, 0.71, t);
  float b = mix(0.20, 0.27, t);
  return vec3(r, g, b);
}

// Check if point is inside a circle
float circleSDF(vec2 p, vec2 center, float radius) {
  return length(p - center) - radius;
}

// The fractal: test recursively if pixel belongs to the romanesco
// Returns: vec2(depth, glow) where depth = -1 means miss
vec2 romanesco(vec2 uv) {
  float scale = 1.0;
  vec2 offset = vec2(0.0);
  float totalDepth = -1.0;
  float glow = 0.0;

  // Max iterations increases with zoom for more detail
  int maxIter = 8 + int(clamp(log2(u_zoom) * 2.0, 0.0, 8.0));

  for (int i = 0; i < 16; i++) {
    if (i >= maxIter) break;

    float growthProgress = clamp(u_growth - float(i), 0.0, 1.0);
    if (growthProgress <= 0.0) break;

    // Transform point to local space
    vec2 local = (uv - offset) / scale;

    // Central bud
    float budRadius = 0.12;
    float dist = length(local);

    if (dist < budRadius * 1.5) {
      // Inside the central bud area
      float budDist = circleSDF(local, vec2(0.0), budRadius * growthProgress);
      if (budDist < 0.0) {
        float intensity = smoothstep(0.0, -budRadius * 0.5, budDist);
        totalDepth = float(i) + intensity * 0.5;
        glow = max(glow, intensity * growthProgress);
      }
    }

    // Find which child bud we're closest to
    float bestDist = 999.0;
    int bestBud = -1;
    vec2 bestCenter = vec2(0.0);
    float bestSize = 0.0;

    // Number of buds decreases with depth for natural look
    int numBuds = i == 0 ? 13 : 9;

    for (int j = 0; j < 13; j++) {
      if (j >= numBuds) break;

      float angle = float(j) * GOLDEN_ANGLE - PI * 0.5;
      float spiralR = 0.2 + float(j) / float(numBuds) * 0.5;
      float childSize = 0.22 + float(j) / float(numBuds) * 0.12;

      // Breathing animation
      float breathe = 1.0 + sin(u_time * 1.5 + float(j) * 0.7 + float(i) * 2.0) * 0.02;
      childSize *= breathe;

      vec2 childCenter = vec2(cos(angle), sin(angle)) * spiralR * growthProgress;
      float d = length(local - childCenter);

      if (d < childSize && d < bestDist) {
        bestDist = d;
        bestBud = j;
        bestCenter = childCenter;
        bestSize = childSize;
      }

      // Add subtle glow around each bud
      float glowDist = d - childSize * 0.3;
      if (glowDist < childSize * 0.8) {
        glow = max(glow, smoothstep(childSize * 0.8, 0.0, glowDist) * 0.3 * growthProgress);
      }
    }

    if (bestBud < 0) break;

    // Transform into the child bud's space for next iteration
    float childAngle = float(bestBud) * GOLDEN_ANGLE - PI * 0.5;
    offset += bestCenter * scale;
    scale *= bestSize;
  }

  return vec2(totalDepth, glow);
}

void main() {
  vec2 uv = (gl_FragCoord.xy - u_resolution * 0.5) / min(u_resolution.x, u_resolution.y);

  // Apply zoom and pan
  uv = uv / u_zoom + u_center;

  // Background
  vec3 bg = vec3(0.102, 0.102, 0.102); // #1a1a1a

  vec2 result = romanesco(uv);
  float depth = result.x;
  float glow = result.y;

  vec3 color = bg;

  if (depth >= 0.0) {
    vec3 fractalColor = depthColor(depth, 12.0);
    float alpha = 0.5 + depth * 0.04;
    color = mix(bg, fractalColor, alpha);
  }

  // Add glow
  if (glow > 0.0) {
    vec3 glowColor = depthColor(2.0, 12.0);
    color = mix(color, glowColor, glow * 0.6);
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export class Romanesco extends BaseVisualization {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private glCanvas: HTMLCanvasElement | null = null;

  // Uniforms
  private uResolution: WebGLUniformLocation | null = null;
  private uZoom: WebGLUniformLocation | null = null;
  private uCenter: WebGLUniformLocation | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private uGrowth: WebGLUniformLocation | null = null;

  // State
  private time = 0;
  private zoom = 1.0;
  private centerX = 0.0;
  private centerY = 0.05;
  private growStart = 0;
  private growth = 0;

  // Interaction
  private isDragging = false;
  private dragStartX = 0;
  private dragStartY = 0;
  private centerStartX = 0;
  private centerStartY = 0;

  protected init() {
    this.setupWebGL();
    this.setupInteraction();
  }

  private setupWebGL() {
    // Create a WebGL canvas overlaying the 2D canvas
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.style.cssText = this.canvas.style.cssText || '';
    this.glCanvas.style.position = 'absolute';
    this.glCanvas.style.inset = '0';
    this.glCanvas.style.width = '100%';
    this.glCanvas.style.height = '100%';
    this.canvas.parentElement?.appendChild(this.glCanvas);

    // Hide the original 2D canvas
    this.canvas.style.display = 'none';

    this.gl = this.glCanvas.getContext('webgl', { antialias: false });
    if (!this.gl) return;

    // Compile shaders
    const vs = this.compileShader(this.gl.VERTEX_SHADER, VERTEX_SHADER);
    const fs = this.compileShader(this.gl.FRAGMENT_SHADER, FRAGMENT_SHADER);
    if (!vs || !fs) return;

    this.program = this.gl.createProgram()!;
    this.gl.attachShader(this.program, vs);
    this.gl.attachShader(this.program, fs);
    this.gl.linkProgram(this.program);

    if (!this.gl.getProgramParameter(this.program, this.gl.LINK_STATUS)) {
      console.error('Shader link error:', this.gl.getProgramInfoLog(this.program));
      return;
    }

    this.gl.useProgram(this.program);

    // Fullscreen quad
    const buffer = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buffer);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1,
      -1, 1, 1, -1, 1, 1,
    ]), this.gl.STATIC_DRAW);

    const aPosition = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(aPosition);
    this.gl.vertexAttribPointer(aPosition, 2, this.gl.FLOAT, false, 0, 0);

    // Get uniform locations
    this.uResolution = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.uZoom = this.gl.getUniformLocation(this.program, 'u_zoom');
    this.uCenter = this.gl.getUniformLocation(this.program, 'u_center');
    this.uTime = this.gl.getUniformLocation(this.program, 'u_time');
    this.uGrowth = this.gl.getUniformLocation(this.program, 'u_growth');

    this.resizeGL();
  }

  private compileShader(type: number, source: string): WebGLShader | null {
    if (!this.gl) return null;
    const shader = this.gl.createShader(type)!;
    this.gl.shaderSource(shader, source);
    this.gl.compileShader(shader);
    if (!this.gl.getShaderParameter(shader, this.gl.COMPILE_STATUS)) {
      console.error('Shader compile error:', this.gl.getShaderInfoLog(shader));
      return null;
    }
    return shader;
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
    const target = this.glCanvas || this.canvas;
    target.style.cursor = 'grab';

    // Double-click to reset
    target.addEventListener('dblclick', () => {
      this.zoom = 1.0;
      this.centerX = 0.0;
      this.centerY = 0.05;
    });

    // Scroll to zoom
    target.addEventListener('wheel', (e) => {
      e.preventDefault();
      const rect = target.getBoundingClientRect();
      const mx = (e.clientX - rect.left) / rect.width - 0.5;
      const my = -((e.clientY - rect.top) / rect.height - 0.5);
      const aspect = rect.width / rect.height;

      const prevZoom = this.zoom;
      const zoomFactor = e.deltaY < 0 ? 1.15 : 1 / 1.15;
      this.zoom = Math.max(0.5, Math.min(200, this.zoom * zoomFactor));

      // Zoom toward cursor
      const zoomRatio = 1 / this.zoom - 1 / prevZoom;
      this.centerX += mx * aspect * zoomRatio;
      this.centerY += my * zoomRatio;
    }, { passive: false });

    // Drag to pan
    target.addEventListener('mousedown', (e) => {
      this.isDragging = true;
      this.dragStartX = e.clientX;
      this.dragStartY = e.clientY;
      this.centerStartX = this.centerX;
      this.centerStartY = this.centerY;
      target.style.cursor = 'grabbing';
    });

    window.addEventListener('mousemove', (e) => {
      if (!this.isDragging) return;
      const rect = target.getBoundingClientRect();
      const dx = (e.clientX - this.dragStartX) / rect.width;
      const dy = (e.clientY - this.dragStartY) / rect.height;
      const aspect = rect.width / rect.height;
      this.centerX = this.centerStartX - dx * aspect / this.zoom;
      this.centerY = this.centerStartY + dy / this.zoom;
    });

    window.addEventListener('mouseup', () => {
      if (this.isDragging) {
        this.isDragging = false;
        target.style.cursor = 'grab';
      }
    });

    // Touch support
    let lastTouchDist = 0;

    target.addEventListener('touchstart', (e) => {
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
        lastTouchDist = Math.sqrt(dx * dx + dy * dy);
      }
    }, { passive: true });

    target.addEventListener('touchmove', (e) => {
      e.preventDefault();
      const rect = target.getBoundingClientRect();
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
        if (lastTouchDist > 0) {
          this.zoom = Math.max(0.5, Math.min(200, this.zoom * (dist / lastTouchDist)));
        }
        lastTouchDist = dist;
      }
    }, { passive: false });

    target.addEventListener('touchend', () => {
      this.isDragging = false;
      lastTouchDist = 0;
    });
  }

  protected update(t: number) {
    this.time = t * 0.001;
    const elapsed = this.time - this.growStart;
    this.growth = Math.min(16, elapsed * 1.2);
  }

  protected draw() {
    if (!this.gl || !this.program || !this.glCanvas) {
      // Fallback: draw hint on 2D canvas
      return;
    }

    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uResolution, this.glCanvas.width, this.glCanvas.height);
    this.gl.uniform1f(this.uZoom, this.zoom);
    this.gl.uniform2f(this.uCenter, this.centerX, this.centerY);
    this.gl.uniform1f(this.uTime, this.time);
    this.gl.uniform1f(this.uGrowth, this.growth);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);

    // Draw hint on 2D canvas overlay
    if (this.zoom === 1.0 && this.growth >= 8) {
      this.ctx.clearRect(0, 0, this.width, this.height);
      this.ctx.fillStyle = 'rgba(255,255,255,0.25)';
      this.ctx.font = '12px Inter, sans-serif';
      this.ctx.textAlign = 'center';
      this.ctx.fillText('scroll to zoom · drag to pan · double-click to reset', this.width / 2, this.height - 24);
    } else {
      this.ctx.clearRect(0, 0, this.width, this.height);
    }
  }

  stop() {
    super.stop();
    // Clean up WebGL canvas
    if (this.glCanvas && this.glCanvas.parentElement) {
      this.glCanvas.parentElement.removeChild(this.glCanvas);
      this.canvas.style.display = '';
    }
  }
}

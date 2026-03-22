// Base class for WebGL-accelerated visualizations
// Handles WebGL canvas creation, shader compilation, fullscreen quad, and standard uniforms

import { BaseVisualization } from './base-visualization';

const DEFAULT_VERTEX_SHADER = `
attribute vec2 a_position;
void main() {
  gl_Position = vec4(a_position, 0.0, 1.0);
}
`;

export abstract class BaseWebGLVisualization extends BaseVisualization {
  protected gl: WebGLRenderingContext | null = null;
  protected program: WebGLProgram | null = null;
  protected glCanvas: HTMLCanvasElement | null = null;

  private uResolution: WebGLUniformLocation | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private uMouse: WebGLUniformLocation | null = null;
  private uMouseActive: WebGLUniformLocation | null = null;
  private uIsMobile: WebGLUniformLocation | null = null;

  private time = 0;

  protected abstract getFragmentShader(): string;

  protected getVertexShader(): string {
    return DEFAULT_VERTEX_SHADER;
  }

  /** Override to set up viz-specific uniform locations */
  protected setupCustomUniforms(_gl: WebGLRenderingContext, _program: WebGLProgram): void {}

  /** Override to update viz-specific uniform values each frame */
  protected updateCustomUniforms(_gl: WebGLRenderingContext, _program: WebGLProgram, _time: number): void {}

  protected init() {
    this.glCanvas = document.createElement('canvas');
    this.glCanvas.style.position = 'absolute';
    this.glCanvas.style.inset = '0';
    this.glCanvas.style.width = '100%';
    this.glCanvas.style.height = '100%';
    this.canvas.parentElement?.appendChild(this.glCanvas);
    this.canvas.style.display = 'none';

    this.gl = this.glCanvas.getContext('webgl', { antialias: false, preserveDrawingBuffer: true });
    if (!this.gl) return;

    const vs = this.compileShader(this.gl.VERTEX_SHADER, this.getVertexShader());
    const fs = this.compileShader(this.gl.FRAGMENT_SHADER, this.getFragmentShader());
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

    // Fullscreen quad
    const buf = this.gl.createBuffer();
    this.gl.bindBuffer(this.gl.ARRAY_BUFFER, buf);
    this.gl.bufferData(this.gl.ARRAY_BUFFER, new Float32Array([
      -1, -1, 1, -1, -1, 1, -1, 1, 1, -1, 1, 1,
    ]), this.gl.STATIC_DRAW);

    const pos = this.gl.getAttribLocation(this.program, 'a_position');
    this.gl.enableVertexAttribArray(pos);
    this.gl.vertexAttribPointer(pos, 2, this.gl.FLOAT, false, 0, 0);

    // Standard uniforms
    this.uResolution = this.gl.getUniformLocation(this.program, 'u_resolution');
    this.uTime = this.gl.getUniformLocation(this.program, 'u_time');
    this.uMouse = this.gl.getUniformLocation(this.program, 'u_mouse');
    this.uMouseActive = this.gl.getUniformLocation(this.program, 'u_mouseActive');
    this.uIsMobile = this.gl.getUniformLocation(this.program, 'u_isMobile');

    this.setupCustomUniforms(this.gl, this.program);
    this.resizeGL();
  }

  private compileShader(type: number, src: string): WebGLShader | null {
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
    // Force DPR 1 on mobile for performance (4x fewer pixels)
    const dpr = this.isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.glCanvas.width = rect.width * dpr;
    this.glCanvas.height = rect.height * dpr;
    this.gl.viewport(0, 0, this.glCanvas.width, this.glCanvas.height);
  }

  protected resize() {
    super.resize();
    this.resizeGL();
  }

  protected update(t: number) {
    this.time = t * 0.001;
  }

  protected draw() {
    if (!this.gl || !this.program || !this.glCanvas) return;

    const dpr = this.isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);

    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uResolution, this.glCanvas.width, this.glCanvas.height);
    this.gl.uniform1f(this.uTime, this.time);
    this.gl.uniform2f(this.uMouse, this.mouseX * dpr, this.mouseY * dpr);
    this.gl.uniform1f(this.uMouseActive, this.mouseActive ? 1.0 : 0.0);
    this.gl.uniform1f(this.uIsMobile, this.isMobile ? 1.0 : 0.0);

    this.updateCustomUniforms(this.gl, this.program, this.time);

    this.gl.drawArrays(this.gl.TRIANGLES, 0, 6);
  }

  stop() {
    super.stop();
    if (this.glCanvas?.parentElement) {
      this.glCanvas.parentElement.removeChild(this.glCanvas);
      this.canvas.style.display = '';
    }
  }
}

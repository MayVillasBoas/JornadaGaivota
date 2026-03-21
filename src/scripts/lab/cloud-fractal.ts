// Cloud Fractal — bright blue sky with white cumulus clouds
// GPU-accelerated via WebGL fragment shader with simplex noise

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
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseActive;

// Hash-based noise (no textures needed)
vec3 mod289(vec3 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 mod289(vec4 x) { return x - floor(x * (1.0 / 289.0)) * 289.0; }
vec4 permute(vec4 x) { return mod289(((x * 34.0) + 1.0) * x); }
vec4 taylorInvSqrt(vec4 r) { return 1.79284291400159 - 0.85373472095314 * r; }

float snoise(vec3 v) {
  const vec2 C = vec2(1.0/6.0, 1.0/3.0);
  const vec4 D = vec4(0.0, 0.5, 1.0, 2.0);

  vec3 i = floor(v + dot(v, C.yyy));
  vec3 x0 = v - i + dot(i, C.xxx);

  vec3 g = step(x0.yzx, x0.xyz);
  vec3 l = 1.0 - g;
  vec3 i1 = min(g.xyz, l.zxy);
  vec3 i2 = max(g.xyz, l.zxy);

  vec3 x1 = x0 - i1 + C.xxx;
  vec3 x2 = x0 - i2 + C.yyy;
  vec3 x3 = x0 - D.yyy;

  i = mod289(i);
  vec4 p = permute(permute(permute(
    i.z + vec4(0.0, i1.z, i2.z, 1.0))
    + i.y + vec4(0.0, i1.y, i2.y, 1.0))
    + i.x + vec4(0.0, i1.x, i2.x, 1.0));

  float n_ = 0.142857142857;
  vec3 ns = n_ * D.wyz - D.xzx;

  vec4 j = p - 49.0 * floor(p * ns.z * ns.z);
  vec4 x_ = floor(j * ns.z);
  vec4 y_ = floor(j - 7.0 * x_);

  vec4 x = x_ * ns.x + ns.yyyy;
  vec4 y = y_ * ns.x + ns.yyyy;
  vec4 h = 1.0 - abs(x) - abs(y);

  vec4 b0 = vec4(x.xy, y.xy);
  vec4 b1 = vec4(x.zw, y.zw);

  vec4 s0 = floor(b0) * 2.0 + 1.0;
  vec4 s1 = floor(b1) * 2.0 + 1.0;
  vec4 sh = -step(h, vec4(0.0));

  vec4 a0 = b0.xzyw + s0.xzyw * sh.xxyy;
  vec4 a1 = b1.xzyw + s1.xzyw * sh.zzww;

  vec3 p0 = vec3(a0.xy, h.x);
  vec3 p1 = vec3(a0.zw, h.y);
  vec3 p2 = vec3(a1.xy, h.z);
  vec3 p3 = vec3(a1.zw, h.w);

  vec4 norm = taylorInvSqrt(vec4(dot(p0,p0), dot(p1,p1), dot(p2,p2), dot(p3,p3)));
  p0 *= norm.x; p1 *= norm.y; p2 *= norm.z; p3 *= norm.w;

  vec4 m = max(0.6 - vec4(dot(x0,x0), dot(x1,x1), dot(x2,x2), dot(x3,x3)), 0.0);
  m = m * m;
  return 42.0 * dot(m*m, vec4(dot(p0,x0), dot(p1,x1), dot(p2,x2), dot(p3,x3)));
}

// Fractal Brownian Motion — layered noise
float fbm(vec3 p) {
  float val = 0.0;
  float amp = 0.5;
  float freq = 1.0;
  for (int i = 0; i < 4; i++) {
    val += amp * snoise(p * freq);
    freq *= 2.2;
    amp *= 0.45;
  }
  return val;
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Sky gradient: deep blue top → light blue horizon
  vec3 skyTop = vec3(0.25, 0.52, 0.85);    // rich blue
  vec3 skyBot = vec3(0.68, 0.82, 0.94);    // pale blue
  vec3 sky = mix(skyBot, skyTop, uv.y);

  // Cloud density from fractal noise
  float t = u_time * 0.15;
  vec3 pos = vec3(uv.x * 3.0 + t, uv.y * 2.0, t * 0.3);

  float density = fbm(pos);

  // Shape: more clouds in the middle heights
  float heightMask = smoothstep(0.0, 0.3, uv.y) * smoothstep(1.0, 0.5, uv.y);
  density = density * heightMask;

  // Threshold and smooth
  float cloud = smoothstep(0.0, 0.35, density);

  // Cloud color: white with blue-gray shadows
  vec3 cloudBright = vec3(1.0, 0.99, 0.97);
  vec3 cloudShadow = vec3(0.75, 0.80, 0.88);
  vec3 cloudColor = mix(cloudShadow, cloudBright, cloud * cloud);

  // Blend cloud over sky
  vec3 color = mix(sky, cloudColor, cloud * 0.9);

  // Sun glow from mouse
  if (u_mouseActive > 0.5) {
    vec2 mouseUV = u_mouse / u_resolution;
    mouseUV.y = 1.0 - mouseUV.y; // flip Y
    float sunDist = length(uv - mouseUV);
    float sunGlow = exp(-sunDist * 4.0) * 0.3;
    color += vec3(1.0, 0.95, 0.8) * sunGlow;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export class CloudFractal extends BaseVisualization {
  private gl: WebGLRenderingContext | null = null;
  private program: WebGLProgram | null = null;
  private glCanvas: HTMLCanvasElement | null = null;

  private uResolution: WebGLUniformLocation | null = null;
  private uTime: WebGLUniformLocation | null = null;
  private uMouse: WebGLUniformLocation | null = null;
  private uMouseActive: WebGLUniformLocation | null = null;

  private time = 0;

  protected init() {
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
    this.uTime = this.gl.getUniformLocation(this.program, 'u_time');
    this.uMouse = this.gl.getUniformLocation(this.program, 'u_mouse');
    this.uMouseActive = this.gl.getUniformLocation(this.program, 'u_mouseActive');

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

  protected update(t: number) {
    this.time = t * 0.001;
  }

  protected draw() {
    if (!this.gl || !this.program || !this.glCanvas) return;

    const dpr = Math.min(window.devicePixelRatio || 1, 2);

    this.gl.useProgram(this.program);
    this.gl.uniform2f(this.uResolution, this.glCanvas.width, this.glCanvas.height);
    this.gl.uniform1f(this.uTime, this.time);
    this.gl.uniform2f(this.uMouse, this.mouseX * dpr, this.mouseY * dpr);
    this.gl.uniform1f(this.uMouseActive, this.mouseActive ? 1.0 : 0.0);
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

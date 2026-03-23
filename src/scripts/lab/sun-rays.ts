// Sun Rays - radial god rays (crepuscular rays) with noise modulation
// GPU-accelerated via WebGL fragment shader

import { BaseWebGLVisualization } from './base-webgl-visualization';
import { GLSL_SIMPLEX_3D, GLSL_HASH } from './glsl-noise';

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseActive;
uniform float u_isMobile;
uniform vec2 u_sunPos;

${GLSL_SIMPLEX_3D}
${GLSL_HASH}

// Lab palette colors
const vec3 CREAM = vec3(0.961, 0.941, 0.910);      // #F5F0E8
const vec3 GOLD = vec3(0.678, 0.643, 0.353);        // #ADA45A
const vec3 TERRACOTTA = vec3(0.761, 0.478, 0.353);  // #C27A5A
const vec3 BG = vec3(0.102);                         // #1a1a1a

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;
  vec2 sunUV = u_sunPos / u_resolution;
  sunUV.y = 1.0 - sunUV.y; // flip Y for UV space

  vec3 color = BG;

  // ─── Sun glow ───
  float sunDist = length(uv - sunUV);
  color += CREAM * exp(-sunDist * 5.0) * 0.15;  // outer glow
  color += CREAM * exp(-sunDist * 30.0) * 0.4;  // bright core

  // ─── God rays ───
  float angle = atan(uv.y - sunUV.y, uv.x - sunUV.x);
  float dist = length(uv - sunUV);

  int numRays = u_isMobile > 0.5 ? 40 : 80;
  float fNumRays = float(numRays);

  // Noise modulates ray visibility
  float rayNoise = snoise(vec3(
    cos(angle) * 2.0,
    sin(angle) * 2.0,
    u_time * 0.3
  ));

  // Some rays blocked by invisible clouds
  float rayIntensity = max(0.0, rayNoise + 0.1) * 0.8;
  float rayWidth = 0.02 + rayIntensity * 0.04;

  // Angular pattern creates discrete rays
  float angularPos = angle * fNumRays / 6.28318;
  float rayPattern = smoothstep(rayWidth * fNumRays, 0.0,
    abs(fract(angularPos) - 0.5) * 2.0);

  // Radial falloff
  float rayFalloff = exp(-dist * 3.0) * rayIntensity;

  // Warmth varies by angle (warmer below sun)
  float warmth = sin(angle) * 0.5 + 0.5;
  vec3 rayColor = mix(CREAM, GOLD, warmth);

  color += rayColor * rayPattern * rayFalloff * 0.08;

  // ─── Procedural dust particles ───
  float dustScale = u_isMobile > 0.5 ? 30.0 : 50.0;
  vec2 cellID = floor(uv * dustScale);
  vec2 cellUV = fract(uv * dustScale);

  // Random offset per cell
  vec2 dustOffset = vec2(
    hash(cellID + 0.1),
    hash(cellID + 0.7)
  ) - 0.5;

  // Animate drift
  dustOffset.y += u_time * 0.02 * (0.5 + hash(cellID) * 0.5);
  dustOffset.x += sin(u_time + hash(cellID) * 6.28) * 0.05;
  dustOffset = fract(dustOffset + 0.5) - 0.5;

  float dustDist = length(cellUV - 0.5 - dustOffset * 0.3);
  float dustBrightness = max(0.0, 1.0 - length(uv - sunUV) / 0.7);
  float dustTwinkle = sin(u_time * 2.0 + hash(cellID) * 6.28) * 0.5 + 0.5;
  color += CREAM * smoothstep(0.04, 0.0, dustDist) * dustBrightness * dustTwinkle * 0.25;

  // ─── Atmospheric haze at bottom ───
  color += TERRACOTTA * smoothstep(0.6, 1.0, 1.0 - uv.y) * 0.04;

  gl_FragColor = vec4(color, 1.0);
}
`;

export class SunRays extends BaseWebGLVisualization {
  private sunX = 0;
  private sunY = 0;
  private uSunPos: WebGLUniformLocation | null = null;

  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }

  protected setupCustomUniforms(gl: WebGLRenderingContext, program: WebGLProgram): void {
    this.uSunPos = gl.getUniformLocation(program, 'u_sunPos');
    this.sunX = this.width * 0.5;
    this.sunY = this.height * 0.18;
  }

  protected update(t: number) {
    super.update(t);
    const time = t * 0.001;

    // Sun drifts gently
    this.sunX = this.width * 0.5 + Math.sin(time * 0.15) * this.width * 0.1;
    this.sunY = this.height * 0.18 + Math.cos(time * 0.1) * 15;

    // Mouse attracts sun
    if (this.mouseActive) {
      this.sunX += (this.mouseX - this.sunX) * 0.03;
      this.sunY += (this.mouseY * 0.3 - this.sunY) * 0.02;
    }
  }

  protected updateCustomUniforms(gl: WebGLRenderingContext, _program: WebGLProgram, _time: number): void {
    const dpr = this.isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    gl.uniform2f(this.uSunPos, this.sunX * dpr, this.sunY * dpr);
  }
}

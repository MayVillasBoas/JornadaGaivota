// Particle Aurora - vivid aurora borealis with bright flowing curtains
// GPU-accelerated via WebGL fragment shader

import { BaseWebGLVisualization } from './base-webgl-visualization';
import { GLSL_SIMPLEX_3D } from './glsl-noise';

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseActive;
uniform float u_isMobile;

${GLSL_SIMPLEX_3D}

// Aurora colors
vec3 getAuroraColor(int i) {
  if (i == 0) return vec3(0.224, 1.0, 0.078);      // #39FF14 electric green
  if (i == 1) return vec3(0.0, 0.898, 0.8);         // #00E5CC teal-cyan
  if (i == 2) return vec3(1.0, 0.063, 0.941);       // #FF10F0 magenta
  if (i == 3) return vec3(0.545, 0.361, 0.965);     // #8B5CF6 violet
  return vec3(0.133, 0.827, 0.933);                  // #22D3EE bright cyan
}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Dark background with slight fade trail effect
  vec3 color = vec3(0.102); // #1a1a1a

  float mouseTilt = u_mouseActive > 0.5
    ? (u_mouse.x / u_resolution.x - 0.5) * 3.0
    : 0.0;

  int numCurtains = 5;
  if (u_isMobile > 0.5) numCurtains = 3;

  for (int c = 0; c < 5; c++) {
    if (c >= numCurtains) break;

    float fc = float(c);
    float baseY = 0.55 + fc * 0.08;
    float freq = 0.002 + fc * 0.0008;
    float amplitude = 0.04 + fc * 0.02;
    float speed = 0.25 + fc * 0.08;

    // Scale freq to UV space (original was in pixel space)
    float uvFreq = freq * u_resolution.x;

    // Wave position from layered noise
    float wave1 = snoise(vec3(
      uv.x * uvFreq + mouseTilt * 0.3,
      u_time * speed,
      fc * 3.0
    )) * amplitude;

    float wave2 = snoise(vec3(
      uv.x * uvFreq * 2.5 + 5.0,
      u_time * speed * 0.7,
      fc * 3.0 + 1.0
    )) * amplitude * 0.4;

    float curtainY = baseY + wave1 + wave2;

    // Vertical streak with gaussian falloff
    float dist = abs(uv.y - curtainY);
    float streakHeight = 0.025 + abs(snoise(vec3(
      uv.x * uvFreq * 1.5,
      u_time * speed * 0.5,
      fc * 3.0 + 2.0
    ))) * 0.08;

    float streak = exp(-dist * dist / (streakHeight * streakHeight * 2.0));

    // Intensity varies along X
    float intensity = max(0.05, (snoise(vec3(
      uv.x * uvFreq * 0.8,
      u_time * speed * 0.3,
      fc * 3.0 + 4.0
    )) + 0.5) * 0.8);

    // Additive blend
    vec3 curtainColor = getAuroraColor(c);
    color += curtainColor * streak * intensity * 0.5;

    // Broad atmospheric glow
    float glowDist = length(vec2(uv.x - 0.5, uv.y - baseY));
    color += curtainColor * exp(-glowDist * 3.0) * 0.02;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export class ParticleAurora extends BaseWebGLVisualization {
  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }
}

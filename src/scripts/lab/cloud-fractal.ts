// Cloud Fractal — bright blue sky with white cumulus clouds
// GPU-accelerated via WebGL fragment shader with simplex noise

import { BaseWebGLVisualization } from './base-webgl-visualization';
import { GLSL_SIMPLEX_3D, GLSL_FBM } from './glsl-noise';

const FRAGMENT_SHADER = `
precision highp float;

uniform vec2 u_resolution;
uniform float u_time;
uniform vec2 u_mouse;
uniform float u_mouseActive;

${GLSL_SIMPLEX_3D}
${GLSL_FBM}

void main() {
  vec2 uv = gl_FragCoord.xy / u_resolution;

  // Sky gradient: deep blue top -> light blue horizon
  vec3 skyTop = vec3(0.25, 0.52, 0.85);
  vec3 skyBot = vec3(0.68, 0.82, 0.94);
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
    mouseUV.y = 1.0 - mouseUV.y;
    float sunDist = length(uv - mouseUV);
    float sunGlow = exp(-sunDist * 4.0) * 0.3;
    color += vec3(1.0, 0.95, 0.8) * sunGlow;
  }

  gl_FragColor = vec4(color, 1.0);
}
`;

export class CloudFractal extends BaseWebGLVisualization {
  protected getFragmentShader(): string {
    return FRAGMENT_SHADER;
  }
}

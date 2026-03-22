// Romanesco — 3D fractal broccoli with Three.js
// Recursive cone-on-cone structure with golden angle spiral placement
// Based on the algorithm from rrhvella/romanesco-broccoli-generator

import { BaseVisualization } from './base-visualization';
import * as THREE from 'three';

const GOLDEN_ANGLE = 2.399963; // 137.508° in radians
const INNER_TO_OUTER_RATIO = 0.4325;
const RADIUS_TO_LENGTH = 0.9534;

export class RomanescoNatural extends BaseVisualization {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private threeCanvas: HTMLCanvasElement | null = null;
  private startTime = 0;
  private elapsed = 0;
  private cameraAngle = 0;
  private targetCameraAngle = 0;
  private cameraHeight = 0.5;
  private targetCameraHeight = 0.5;

  protected init() {
    this.startTime = 0;
    this.elapsed = 0;

    this.threeCanvas = document.createElement('canvas');
    this.threeCanvas.style.position = 'absolute';
    this.threeCanvas.style.inset = '0';
    this.threeCanvas.style.width = '100%';
    this.threeCanvas.style.height = '100%';
    this.canvas.parentElement?.appendChild(this.threeCanvas);
    this.canvas.style.display = 'none';

    const dpr = this.isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.threeCanvas,
      antialias: !this.isMobile,
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x1a1a1a);
    this.renderer.shadowMap.enabled = false;

    this.scene = new THREE.Scene();
    this.camera = new THREE.PerspectiveCamera(35, this.width / this.height, 0.1, 100);

    // Warm natural lighting
    this.scene.add(new THREE.AmbientLight(0x667755, 0.7));

    const sun = new THREE.DirectionalLight(0xffeedd, 1.0);
    sun.position.set(4, 6, 3);
    this.scene.add(sun);

    const fill = new THREE.DirectionalLight(0x99bb88, 0.35);
    fill.position.set(-3, 2, -4);
    this.scene.add(fill);

    this.buildRomanesco();
  }

  private buildRomanesco() {
    if (!this.scene) return;

    const group = new THREE.Group();

    // Shared bud geometry — a sphere deformed into a bud/teardrop shape
    const budGeo = new THREE.SphereGeometry(1, 10, 8);
    const pos = budGeo.getAttribute('position');
    for (let i = 0; i < pos.count; i++) {
      let x = pos.getX(i);
      let y = pos.getY(i);
      let z = pos.getZ(i);
      // Taper: narrow at top, wide at bottom
      const t = (y + 1) / 2; // 0=bottom, 1=top
      const taper = 1.0 - t * 0.65;
      // Stretch upward to make conical
      pos.setX(i, x * taper);
      pos.setZ(i, z * taper);
      pos.setY(i, y * 1.4);
    }
    budGeo.computeVertexNormals();

    // Material: bright lime green (like the photo)
    const mat = new THREE.MeshPhongMaterial({
      color: 0x8ec440,
      shininess: 15,
      specular: 0x334411,
      flatShading: false,
    });

    const maxLevels = this.isMobile ? 2 : 3;
    const budsPerLevel = this.isMobile ? 12 : 18;

    // Recursive romanesco builder
    const addBroccoli = (
      parentPos: THREE.Vector3,
      parentDir: THREE.Vector3, // direction the cone points
      radius: number,
      level: number
    ) => {
      if (level > maxLevels || radius < 0.008) return;

      const length = radius / RADIUS_TO_LENGTH;
      const innerRadius = radius * INNER_TO_OUTER_RATIO;

      // Draw this bud
      const bud = new THREE.Mesh(budGeo, mat);
      bud.position.copy(parentPos);
      bud.scale.set(radius, length * 0.5, radius);

      // Orient along parentDir
      const up = new THREE.Vector3(0, 1, 0);
      const quat = new THREE.Quaternion().setFromUnitVectors(up, parentDir.clone().normalize());
      bud.quaternion.copy(quat);

      group.add(bud);

      // Place child buds on the surface in a conic spiral
      const medianRadius = (innerRadius + radius) / 2;
      const childScale = 0.38 - level * 0.05; // children get proportionally smaller each level
      let angle = 0;

      for (let i = 0; i < budsPerLevel; i++) {
        const t = (i + 1) / (budsPerLevel + 1); // 0 to 1 along the cone spine

        // Position along the cone's spine
        const spineProgress = t * length;
        const localRadius = medianRadius * t; // radius grows from tip to base

        // Spiral position on cone surface
        angle += GOLDEN_ANGLE;
        const lx = Math.cos(angle) * localRadius;
        const lz = Math.sin(angle) * localRadius;
        const ly = length - spineProgress; // from top down

        // Transform to world space
        const localPos = new THREE.Vector3(lx, ly, lz);
        localPos.applyQuaternion(quat);
        const worldPos = parentPos.clone().add(localPos);

        // Child direction: outward from cone spine + upward along cone
        const outward = new THREE.Vector3(lx, 0, lz).normalize();
        outward.applyQuaternion(quat);
        const childDir = parentDir.clone().multiplyScalar(0.6).add(outward.multiplyScalar(0.4)).normalize();

        const childRadius = radius * childScale * (0.5 + t * 0.5); // larger toward base

        addBroccoli(worldPos, childDir, childRadius, level + 1);
      }
    };

    // Start: main romanesco pointing up
    addBroccoli(
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0, 1, 0),
      0.8,
      0
    );

    // Center the group
    const box = new THREE.Box3().setFromObject(group);
    const center = box.getCenter(new THREE.Vector3());
    group.position.sub(center);
    group.position.y += 0.3;

    this.scene.add(group);
  }

  protected resize() {
    super.resize();
    if (this.renderer && this.camera) {
      const dpr = this.isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
      this.renderer.setPixelRatio(dpr);
      this.renderer.setSize(this.width, this.height);
      this.camera.aspect = this.width / this.height;
      this.camera.updateProjectionMatrix();
    }
  }

  protected update(t: number) {
    if (this.startTime === 0) this.startTime = t;
    this.elapsed = (t - this.startTime) * 0.001;

    this.targetCameraAngle = this.elapsed * 0.12;

    if (this.mouseActive) {
      this.targetCameraAngle = (this.mouseX / this.width - 0.5) * Math.PI * 2;
      this.targetCameraHeight = 0.3 + (1 - this.mouseY / this.height) * 1.5;
    }

    this.cameraAngle += (this.targetCameraAngle - this.cameraAngle) * 0.04;
    this.cameraHeight += (this.targetCameraHeight - this.cameraHeight) * 0.04;

    if (this.camera) {
      const dist = 4.5;
      this.camera.position.set(
        Math.sin(this.cameraAngle) * dist,
        this.cameraHeight + 1.2,
        Math.cos(this.cameraAngle) * dist
      );
      this.camera.lookAt(0, 0.3, 0);
    }
  }

  protected draw() {
    if (!this.renderer || !this.scene || !this.camera) return;
    this.renderer.render(this.scene, this.camera);
  }

  stop() {
    super.stop();
    if (this.renderer) this.renderer.dispose();
    if (this.threeCanvas?.parentElement) {
      this.threeCanvas.parentElement.removeChild(this.threeCanvas);
      this.canvas.style.display = '';
    }
  }
}

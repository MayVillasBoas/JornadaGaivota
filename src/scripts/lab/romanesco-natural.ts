// Romanesco — 3D romanesco broccoli with Three.js
// Recursive cone geometry arranged in golden angle phyllotaxis
// Real 3D with orbital camera, lighting, and self-similar structure

import { BaseVisualization } from './base-visualization';
import * as THREE from 'three';

const GOLDEN_ANGLE = 137.508 * (Math.PI / 180);

export class RomanescoNatural extends BaseVisualization {
  private renderer: THREE.WebGLRenderer | null = null;
  private scene: THREE.Scene | null = null;
  private camera: THREE.PerspectiveCamera | null = null;
  private threeCanvas: HTMLCanvasElement | null = null;
  private startTime = 0;
  private elapsed = 0;
  private cameraAngle = 0;
  private targetCameraAngle = 0;
  private cameraHeight = 0.4;
  private targetCameraHeight = 0.4;

  protected init() {
    this.startTime = 0;
    this.elapsed = 0;

    // Create Three.js canvas
    this.threeCanvas = document.createElement('canvas');
    this.threeCanvas.style.position = 'absolute';
    this.threeCanvas.style.inset = '0';
    this.threeCanvas.style.width = '100%';
    this.threeCanvas.style.height = '100%';
    this.canvas.parentElement?.appendChild(this.threeCanvas);
    this.canvas.style.display = 'none';

    // Renderer
    const dpr = this.isMobile ? 1 : Math.min(window.devicePixelRatio || 1, 2);
    this.renderer = new THREE.WebGLRenderer({
      canvas: this.threeCanvas,
      antialias: !this.isMobile,
    });
    this.renderer.setPixelRatio(dpr);
    this.renderer.setSize(this.width, this.height);
    this.renderer.setClearColor(0x1a1a1a);

    // Scene
    this.scene = new THREE.Scene();

    // Camera
    this.camera = new THREE.PerspectiveCamera(45, this.width / this.height, 0.1, 100);
    this.camera.position.set(0, 2, 4);
    this.camera.lookAt(0, 0.5, 0);

    // Lighting
    const ambientLight = new THREE.AmbientLight(0x334422, 0.6);
    this.scene.add(ambientLight);

    const mainLight = new THREE.DirectionalLight(0xffffff, 1.0);
    mainLight.position.set(3, 5, 2);
    this.scene.add(mainLight);

    const fillLight = new THREE.DirectionalLight(0x88aa66, 0.3);
    fillLight.position.set(-2, 1, -3);
    this.scene.add(fillLight);

    const rimLight = new THREE.DirectionalLight(0xaaccaa, 0.2);
    rimLight.position.set(0, -1, -2);
    this.scene.add(rimLight);

    // Build romanesco
    this.buildRomanesco();
  }

  private buildRomanesco() {
    if (!this.scene) return;

    const budGeometry = new THREE.ConeGeometry(1, 1.6, 6);
    budGeometry.translate(0, 0.8, 0); // pivot at base

    // Romanesco green material
    const material = new THREE.MeshPhongMaterial({
      color: 0x6b9b3a,
      shininess: 20,
      specular: 0x334422,
    });

    const numPrimary = this.isMobile ? 120 : 220;
    const group = new THREE.Group();

    for (let i = 1; i <= numPrimary; i++) {
      const t = i / numPrimary;
      const theta = i * GOLDEN_ANGLE;

      // Phyllotaxis on a dome surface
      const phi = Math.acos(1 - 1.6 * t);
      const r = 1.0;

      // Position on sphere
      const x = r * Math.sin(phi) * Math.cos(theta);
      const y = r * Math.cos(phi);
      const z = r * Math.sin(phi) * Math.sin(theta);

      // Bud size: larger toward equator
      const budScale = 0.06 + 0.12 * Math.sin(phi);

      // Create bud pointing outward from center
      const bud = new THREE.Mesh(budGeometry, material);
      bud.position.set(x, y, z);
      bud.scale.setScalar(budScale);

      // Orient to point outward (away from center)
      bud.lookAt(x * 2, y * 2, z * 2);

      group.add(bud);

      // Level 2: sub-buds on larger buds
      if (budScale > 0.1 && !this.isMobile) {
        const numSub = 5;
        for (let j = 0; j < numSub; j++) {
          const subTheta = j * GOLDEN_ANGLE;
          const subPhi = 0.3 + j * 0.12;
          const subR = budScale * 3.5;

          // Position sub-bud on the surface of the parent bud
          const parentNorm = new THREE.Vector3(x, y, z).normalize();
          const tangent1 = new THREE.Vector3(-Math.sin(theta), 0, Math.cos(theta)).normalize();
          const tangent2 = new THREE.Vector3().crossVectors(parentNorm, tangent1).normalize();

          const sx = x + (tangent1.x * Math.cos(subTheta) + tangent2.x * Math.sin(subTheta)) * subR * Math.sin(subPhi)
                       + parentNorm.x * subR * Math.cos(subPhi);
          const sy = y + (tangent1.y * Math.cos(subTheta) + tangent2.y * Math.sin(subTheta)) * subR * Math.sin(subPhi)
                       + parentNorm.y * subR * Math.cos(subPhi);
          const sz = z + (tangent1.z * Math.cos(subTheta) + tangent2.z * Math.sin(subTheta)) * subR * Math.sin(subPhi)
                       + parentNorm.z * subR * Math.cos(subPhi);

          const subScale = budScale * 0.35;
          const subBud = new THREE.Mesh(budGeometry, material);
          subBud.position.set(sx, sy, sz);
          subBud.scale.setScalar(subScale);
          subBud.lookAt(sx + parentNorm.x, sy + parentNorm.y, sz + parentNorm.z);

          group.add(subBud);
        }
      }
    }

    // Add a base sphere for the main dome body
    const domeGeo = new THREE.SphereGeometry(0.92, 32, 24, 0, Math.PI * 2, 0, Math.PI * 0.6);
    const domeMat = new THREE.MeshPhongMaterial({
      color: 0x4a7a28,
      shininess: 10,
      specular: 0x223311,
    });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    group.add(dome);

    this.scene.add(group);
  }

  protected resize() {
    super.resize();
    if (this.renderer && this.camera && this.threeCanvas) {
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

    // Auto-rotate slowly
    this.targetCameraAngle = this.elapsed * 0.2;

    // Mouse orbit
    if (this.mouseActive) {
      this.targetCameraAngle = (this.mouseX / this.width - 0.5) * Math.PI * 2;
      this.targetCameraHeight = 0.2 + (1 - this.mouseY / this.height) * 1.5;
    }

    this.cameraAngle += (this.targetCameraAngle - this.cameraAngle) * 0.05;
    this.cameraHeight += (this.targetCameraHeight - this.cameraHeight) * 0.05;

    if (this.camera) {
      const dist = 3.5;
      this.camera.position.set(
        Math.sin(this.cameraAngle) * dist,
        this.cameraHeight + 0.8,
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
    if (this.renderer) {
      this.renderer.dispose();
    }
    if (this.threeCanvas?.parentElement) {
      this.threeCanvas.parentElement.removeChild(this.threeCanvas);
      this.canvas.style.display = '';
    }
  }
}

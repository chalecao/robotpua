/**
 * @module CameraController
 * @description FPS 第一人称视角控制，基于 Pointer Lock 实现鼠标视角旋转
 */
export class CameraController {
  constructor(camera, canvas) {
    this.camera = camera;
    this.canvas = canvas;
    this.pitch = 0;
    this.yaw = 0;
    this.sensitivity = 0.002;

    document.addEventListener('mousemove', (e) => {
      if (document.pointerLockElement !== canvas) return;
      this.yaw -= e.movementX * this.sensitivity;
      this.pitch -= e.movementY * this.sensitivity;
      this.pitch = Math.max(-Math.PI / 2, Math.min(Math.PI / 2, this.pitch));
    });

    document.addEventListener('pointerlockerror', () => {
      console.warn('[CameraController] Pointer Lock failed — mouse look unavailable.');
    });
  }

  update() {
    this.camera.rotation.set(this.pitch, this.yaw, 0, 'YXZ');
  }

  applyTo(object) {
    object.position.copy(this.camera.position);
    object.rotation.copy(this.camera.rotation);
  }

  getForwardDir() {
    const dir = { x: 0, y: 0, z: 0 };
    dir.x = -Math.sin(this.yaw) * Math.cos(this.pitch);
    dir.y = Math.sin(this.pitch);
    dir.z = -Math.cos(this.yaw) * Math.cos(this.pitch);
    return dir;
  }

  getRightDir() {
    return { x: Math.cos(this.yaw), y: 0, z: -Math.sin(this.yaw) };
  }

  isLocked() {
    return document.pointerLockElement === this.canvas;
  }
}

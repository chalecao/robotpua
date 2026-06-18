/**
 * @file AIController.js
 * @description AI 对手控制逻辑
 */
import * as THREE from '../../lib/three.module.js';

export class AIController {
    constructor(kartMesh, centerPoint = new THREE.Vector3(0, 0, 0), radius = 40) {
        this.mesh = kartMesh;
        this.center = centerPoint;
        this.radius = radius;
        this.angle = 0;
        this.baseSpeed = 0.6;
        this.speed = this.baseSpeed;
        this.lapTime = 0;
        this.debuffUntil = 0;
        this.speedVariation = 0;
    }

    update(dt = 1 / 60) {
        if (Date.now() < this.debuffUntil) {
            this.speed = this.baseSpeed * 0.3;
        } else {
            this.speed = this.baseSpeed;
        }

        if (this.speedVariation > 0) {
            this.speed *= 1 + Math.sin(this.angle * 3) * this.speedVariation;
        }

        this.angle += this.speed * 0.01 * dt * 60;

        const x = Math.cos(this.angle) * this.radius;
        const z = Math.sin(this.angle) * this.radius;

        this.mesh.position.set(x, 0, z);

        const behindX = Math.cos(this.angle - 0.5) * this.radius;
        const behindZ = Math.sin(this.angle - 0.5) * this.radius;

        this.mesh.lookAt(behindX, 0, behindZ);

        this.mesh.rotation.z = Math.sin(this.angle * 3) * this.speedVariation * 0.8;
    }

    applyDebuff(durationMs) {
        this.debuffUntil = Date.now() + durationMs;
    }

    isDebuffed() {
        return Date.now() < this.debuffUntil;
    }
}

/**
 * @file PaperBall.js
 * @description 纸球实体：极轻、高摩擦、低弹性，可被风吹动。
 * @module entities/PaperBall
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Ball, BALL_STATE } from './Ball.js';

/**
 * 纸球子类 — 重写物理参数和视觉表现
 */
export class PaperBall extends Ball {
    /**
     * @param {THREE.Scene} scene
     * @param {THREE.Vector3} startPosition
     */
    constructor(scene, startPosition) {
        super('paper', scene, startPosition);

        // 纸球颜色偏暖白
        this.material.color.setHex(0xfff8f0);
    }

    /**
     * 覆盖父类 update — 纸球受风影响更大
     * @param {number} dt
     */
    update(dt) {
        if (this.state === BALL_STATE.SWITCHING_IN) {
            const s = this.mesh.scale.x + dt * 5;
            this.mesh.scale.setScalar(Math.min(s, 1.0));
            if (this.mesh.scale.x >= 1.0) {
                this.state = BALL_STATE.IDLE;
                this.mesh.scale.setScalar(1.0);
            }
            return;
        }
        if (this.state === BALL_STATE.SWITCHING_OUT) return;

        // 旋转 — 纸球转得快
        if (this.onGround) {
            const speed = this.velocity.length();
            if (speed > 0.1) {
                this.mesh.rotation.x += this.velocity.z * dt * 4;
                this.mesh.rotation.z -= this.velocity.x * dt * 4;
            }
        }

        // 空中飘浮效果 — 轻微上下浮动
        if (!this.onGround) {
            this.velocity.multiplyScalar(1 - 0.8 * dt);
            this.mesh.position.y += Math.sin(Date.now() * 0.003) * 0.002;
        }

        // 注意：不在这里重置 onGround
        this._updateTrail();
    }

    /**
     * 纸球切换特效 — 纸屑飞扬
     */
    playSwitchOutEffect(particles, position) {
        particles.emitPaperBits(position.clone());
        particles.emitDust(position.clone());
    }

    /**
     * 纸球落地特效 — 纸屑 + 少量尘土
     */
    playImpactEffect(particles, position, impactNormal) {
        particles.emitPaperBits(position);
        particles.emitDust(position);
    }
}

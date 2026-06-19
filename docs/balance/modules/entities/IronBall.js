/**
 * @file IronBall.js
 * @description 铁球实体：极重、低摩擦、高弹性，可压碎脆弱桥梁。
 * @module entities/IronBall
 */

import { Ball, BALL_STATE } from './Ball.js';

/**
 * 铁球子类 — 重载物理行为和特效
 */
export class IronBall extends Ball {
    /**
     * @param {THREE.Scene} scene
     * @param {THREE.Vector3} startPosition
     */
    constructor(scene, startPosition) {
        super('iron', scene, startPosition);

        // 铁球落地尘土更大
        this.impactCooldown = 0;
    }

    /**
     * 覆盖父类 update — 铁球惯性更大
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

        // 旋转 — 铁球转得慢但有力
        if (this.onGround) {
            const speed = this.velocity.length();
            if (speed > 0.1) {
                this.mesh.rotation.x += this.velocity.z * dt * 1.5;
                this.mesh.rotation.z -= this.velocity.x * dt * 1.5;
            }
        }

        // 速度衰减 — 铁球衰减慢
        if (!this.onGround) {
            this.velocity.multiplyScalar(1 - 0.2 * dt);
        }

        // 撞击冷却
        if (this.impactCooldown > 0) {
            this.impactCooldown -= dt;
        }

        // 注意：不在这里重置 onGround
        this._updateTrail();
    }

    /**
     * 铁球落地特效 — 大量火星 + 尘土
     */
    playImpactEffect(particles, position, impactNormal) {
        if (this.impactCooldown <= 0) {
            particles.emitSparks(position.clone());
            particles.emitDust(position.clone());
            this.impactCooldown = 0.3;
        }
    }

    /**
     * 铁球切换特效 — 火星四溅
     */
    playSwitchOutEffect(particles, position) {
        particles.emitSparks(position.clone());
        particles.emitSmoke(position.clone());
    }
}

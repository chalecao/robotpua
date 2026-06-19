/**
 * @file WoodBall.js
 * @description 木球实体：中等重量、标准摩擦，万能平衡体。
 * @module entities/WoodBall
 */

import { Ball, BALL_STATE } from './Ball.js';

/**
 * 木球子类 — 标准物理参数
 */
export class WoodBall extends Ball {
    /**
     * @param {THREE.Scene} scene
     * @param {THREE.Vector3} startPosition
     */
    constructor(scene, startPosition) {
        super('wood', scene, startPosition);
    }

    /**
     * 木球落地特效 — 木屑飞溅
     * @param {import('../graphics/ParticleSystem.js').ParticleSystem} particles
     * @param {THREE.Vector3} position
     * @param {THREE.Vector3} impactNormal
     */
    playImpactEffect(particles, position, impactNormal) {
        particles.emitWoodShards(position);
    }

    /**
     * 木球切换特效 — 消散为木屑
     * @param {import('../graphics/ParticleSystem.js').ParticleSystem} particles
     * @param {THREE.Vector3} position
     */
    playSwitchOutEffect(particles, position) {
        particles.emitWoodShards(position.clone());
        particles.emitDust(position.clone());
    }
}

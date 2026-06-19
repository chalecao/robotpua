/**
 * @file Level_01_Bridge.js
 * @description 关卡 1：木板桥 — 基础关卡，训练玩家三种球体的不同重量感和平衡控制。
 * @module levels/Level_01_Bridge
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Level } from '../entities/Level.js';

/**
 * 关卡 1 构建器
 * @param {THREE.Scene} scene
 * @param {import('../physics/PhysicsWorld.js').PhysicsWorld} physicsWorld
 * @param {import('../core/Assets.js').Assets} assets
 * @returns {Level}
 */
export function buildLevel01(scene, physicsWorld, assets) {
    const level = new Level(scene, physicsWorld, assets);
    level.clear();
    level.levelName = 'LEVEL 01 — BRIDGE';

    // ===== 起点平台 =====
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: 0, material: 'concrete' });
    level.createStartMarker(new THREE.Vector3(0, 0.31, 0));

    // ===== 第一段直轨 =====
    level.createTrack({ width: 2.5, length: 8, x: 0, y: 0, z: -6, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: -1.25, y: 0.3, z: -6 });
    level.createGuardrail({ trackLength: 8, x: 1.25, y: 0.3, z: -6 });

    // ===== 第二段 — 稍微变窄 =====
    level.createTrack({ width: 2.0, length: 6, x: 0, y: 0, z: -14, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 6, x: -1.0, y: 0.3, z: -14 });
    level.createGuardrail({ trackLength: 6, x: 1.0, y: 0.3, z: -14 });

    // ===== 第三段 — 金属桥 =====
    level.createTrack({ width: 2.5, length: 8, x: 0, y: 0, z: -22, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: -1.25, y: 0.3, z: -22 });
    level.createGuardrail({ trackLength: 8, x: 1.25, y: 0.3, z: -22 });

    // ===== 第四段 — 可压碎的脆弱桥 =====
    level.createTrack({ width: 2.5, length: 6, x: 0, y: 0, z: -31, material: 'brittle', isBrittle: true });
    level.createGuardrail({ trackLength: 6, x: -1.25, y: 0.3, z: -31 });
    level.createGuardrail({ trackLength: 6, x: 1.25, y: 0.3, z: -31 });

    // ===== 第五段 — 终点前直轨 =====
    level.createTrack({ width: 2.5, length: 8, x: 0, y: 0, z: -38, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: -1.25, y: 0.3, z: -38 });
    level.createGuardrail({ trackLength: 8, x: 1.25, y: 0.3, z: -38 });

    // ===== 终点平台 =====
    level.createTrack({ width: 5, length: 5, x: 0, y: 0, z: -45, material: 'concrete' });

    // ===== 终点光圈 =====
    level.createFinishZone(new THREE.Vector3(0, 0.31, -45));

    // ===== 装饰支柱 =====
    level.createPillar(-5, -2, -10, 8);
    level.createPillar(5, -2, -10, 8);
    level.createPillar(-5, -2, -25, 10);
    level.createPillar(5, -2, -25, 10);
    level.createPillar(-5, -2, -40, 6);
    level.createPillar(5, -2, -40, 6);

    // ===== 移动平台（桥段之间） =====
    level.createMovingPlatform({
        width: 3, height: 0.2, depth: 2,
        x: 0, y: -0.5, z: -18,
        range: new THREE.Vector3(0, 0, 3),
        speed: 0.8,
    });

    // 起点位置
    level.startPoint = new THREE.Vector3(0, 2, 0);

    return level;
}

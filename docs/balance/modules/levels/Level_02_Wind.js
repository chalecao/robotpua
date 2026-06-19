/**
 * @file Level_02_Wind.js
 * @description 关卡 2：风扇峡谷 — 引入风力机关，纸球会被吹飞，铁球几乎不受影响。
 * @module levels/Level_02_Wind
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Level } from '../entities/Level.js';

/**
 * 关卡 2 构建器
 * @param {THREE.Scene} scene
 * @param {import('../physics/PhysicsWorld.js').PhysicsWorld} physicsWorld
 * @param {import('../core/Assets.js').Assets} assets
 * @returns {Level}
 */
export function buildLevel02(scene, physicsWorld, assets) {
    const level = new Level(scene, physicsWorld, assets);
    level.clear();
    level.levelName = 'LEVEL 02 — WIND CANYON';

    // ===== 起点平台 =====
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: 0, material: 'concrete' });
    level.createStartMarker(new THREE.Vector3(0, 0.31, 0));

    // ===== 第一段 — 狭窄轨道 =====
    level.createTrack({ width: 1.5, length: 6, x: 0, y: 0, z: -6, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: -0.75, y: 0.3, z: -6 });
    level.createGuardrail({ trackLength: 6, x: 0.75, y: 0.3, z: -6 });

    // ===== 风扇区 1 — 向上吹 =====
    level.createFan(new THREE.Vector3(0, -1, -12), new THREE.Vector3(0, 1, 0), 8, 3);

    // ===== 中间安全平台 =====
    level.createTrack({ width: 3, length: 3, x: 0, y: 0, z: -15, material: 'concrete' });

    // ===== 风扇区 2 — 侧向吹 =====
    level.createFan(new THREE.Vector3(-5, 0, -20), new THREE.Vector3(1, 0, 0), 12, 4);

    // ===== 侧轨 =====
    level.createTrack({ width: 1.5, length: 8, x: 0, y: 0, z: -24, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: -0.75, y: 0.3, z: -24 });
    level.createGuardrail({ trackLength: 8, x: 0.75, y: 0.3, z: -24 });

    // ===== 风扇区 3 — 反向侧向吹 =====
    level.createFan(new THREE.Vector3(5, 0, -32), new THREE.Vector3(-1, 0, 0), 10, 4);

    // ===== 磁铁区 =====
    level.createMagnet(new THREE.Vector3(0, 1, -38), 15, 3);

    // ===== 磁铁下方轨道（防止球被吸到虚空）=====
    level.createTrack({ width: 2, length: 4, x: 0, y: 0, z: -38, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: -1, y: 0.3, z: -38 });
    level.createGuardrail({ trackLength: 4, x: 1, y: 0.3, z: -38 });

    // ===== 磁铁后轨道 =====
    level.createTrack({ width: 2, length: 6, x: 0, y: 0, z: -43, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: -1, y: 0.3, z: -43 });
    level.createGuardrail({ trackLength: 6, x: 1, y: 0.3, z: -43 });

    // ===== 终点平台 =====
    level.createTrack({ width: 5, length: 5, x: 0, y: 0, z: -50, material: 'concrete' });
    level.createFinishZone(new THREE.Vector3(0, 0.31, -50));

    // ===== 移动平台 =====
    level.createMovingPlatform({
        width: 3, height: 0.2, depth: 2,
        x: 0, y: -0.5, z: -35,
        range: new THREE.Vector3(2, 0, 0),
        speed: 1.2,
    });

    // ===== 装饰 =====
    level.createPillar(-6, -2, -15, 10);
    level.createPillar(6, -2, -15, 10);
    level.createPillar(-6, -2, -30, 12);
    level.createPillar(6, -2, -30, 12);
    level.createPillar(-6, -2, -45, 8);
    level.createPillar(6, -2, -45, 8);

    level.startPoint = new THREE.Vector3(0, 2, 0);

    return level;
}

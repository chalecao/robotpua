/**
 * @file Level_06_Multi.js
 * @description 关卡 6：多机关综合 — 风扇 + 磁铁 + 移动平台 + 脆弱桥梁组合关卡。
 * @module levels/Level_06_Multi
 */

import * as THREE from 'https://robotpua.com/cs/lib/three.module.js';
import { Level } from '../entities/Level.js';

/**
 * 关卡 6 构建器
 */
export function buildLevel06(scene, physicsWorld, assets) {
    const level = new Level(scene, physicsWorld, assets);
    level.clear();
    level.levelName = 'LEVEL 06 — MULTI MECHANIC';

    // ===== 起点平台 =====
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: 0, material: 'concrete' });
    level.createStartMarker(new THREE.Vector3(0, 0.31, 0));

    // ===== 第 1 段：普通轨道 =====
    level.createTrack({ width: 2.5, length: 8, x: 0, y: 0, z: -7, material: 'woodPlank' });
    level.createGuardrail({ trackLength: 8, x: -1.25, y: 0.3, z: -7 });
    level.createGuardrail({ trackLength: 8, x: 1.25, y: 0.3, z: -7 });

    // ===== 风扇区 =====
    level.createFan(new THREE.Vector3(0, -1, -13), new THREE.Vector3(0, 1, 0), 10, 3);
    level.createTrack({ width: 3, length: 3, x: 0, y: 0, z: -16, material: 'concrete' });

    // ===== 第 2 段：金属轨道 =====
    level.createTrack({ width: 2.5, length: 8, x: 0, y: 0, z: -22, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: -1.25, y: 0.3, z: -22 });
    level.createGuardrail({ trackLength: 8, x: 1.25, y: 0.3, z: -22 });

    // ===== 移动平台 =====
    level.createMovingPlatform({
        width: 3, height: 0.2, depth: 2,
        x: 0, y: -0.5, z: -30,
        range: new THREE.Vector3(0, 0, 3),
        speed: 1.0,
    });

    // ===== 磁铁区 =====
    level.createMagnet(new THREE.Vector3(0, 1.5, -35), 20, 3.5);
    level.createTrack({ width: 2.5, length: 6, x: 0, y: 0, z: -38, material: 'metal' });
    level.createGuardrail({ trackLength: 6, x: -1.25, y: 0.3, z: -38 });
    level.createGuardrail({ trackLength: 6, x: 1.25, y: 0.3, z: -38 });

    // ===== 脆弱桥梁 =====
    level.createTrack({ width: 2.5, length: 5, x: 0, y: 0, z: -44, material: 'brittle', isBrittle: true });
    level.createGuardrail({ trackLength: 5, x: -1.25, y: 0.3, z: -44 });
    level.createGuardrail({ trackLength: 5, x: 1.25, y: 0.3, z: -44 });

    // ===== 安全平台（桥后） =====
    level.createTrack({ width: 4, length: 4, x: 0, y: 0, z: -50, material: 'concrete' });

    // ===== 风扇区 2（侧向） =====
    level.createFan(new THREE.Vector3(-4, 0, -55), new THREE.Vector3(1, 0, 0), 12, 4);
    level.createTrack({ width: 2, length: 8, x: 0, y: 0, z: -57, material: 'metal' });
    level.createGuardrail({ trackLength: 8, x: -1, y: 0.3, z: -57 });
    level.createGuardrail({ trackLength: 8, x: 1, y: 0.3, z: -57 });

    // ===== 横向偏移 =====
    level.createTrack({ width: 2.5, length: 4, x: 3, y: 0, z: -63, material: 'metal' });
    level.createGuardrail({ trackLength: 4, x: 1.75, y: 0.3, z: -63 });
    level.createGuardrail({ trackLength: 4, x: 4.25, y: 0.3, z: -63 });

    // ===== 终点平台 =====
    level.createTrack({ width: 5, length: 5, x: 3, y: 0, z: -70, material: 'concrete' });
    level.createFinishZone(new THREE.Vector3(3, 0.31, -70));

    // ===== 移动平台 2 =====
    level.createMovingPlatform({
        width: 2.5, height: 0.2, depth: 2,
        x: 0, y: 0, z: -55,
        range: new THREE.Vector3(2, 0, 0),
        speed: 1.5,
    });

    // ===== 装饰 =====
    level.createPillar(-8, -2, -15, 10);
    level.createPillar(8, -2, -15, 10);
    level.createPillar(-8, -2, -40, 12);
    level.createPillar(8, -2, -40, 12);
    level.createPillar(-8, -2, -65, 10);
    level.createPillar(8, -2, -65, 10);

    level.startPoint = new THREE.Vector3(0, 2, 0);

    return level;
}
